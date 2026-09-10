import type { PrismaClient } from "@prisma/client";
import type { Locale } from "@keto-mentor/shared";
import type { InterpretResult } from "./interpret.js";
import { previewRecipeImport, RecipeImportError } from "../recipes/recipe-import.js";
import { createRecipeImportProof } from "../recipes/import-proof.js";
import type { RecipeExtractionProvider } from "../recipes/recipe-extraction-provider.js";
import { RecipeDiscoveryService, type RecipeDiscoveryPreview } from "../recipes/recipe-discovery.js";
import { domainOf } from "../web-knowledge/web-knowledge-search-provider.js";
import { addMacros, emptyMacros, scaleMacros, type MacroTotals } from "../nutrition-core.js";
import type { SafeFetcherDependencies } from "../recipes/safe-url-fetcher.js";

export type RecipeDiscoveryFallbackDeps = {
  discoveryService: RecipeDiscoveryService;
  recipeAiProvider: RecipeExtractionProvider;
  prisma: Parameters<typeof previewRecipeImport>[0];
  userId: string;
  locale: Locale;
  // Test-only injection point — production never sets this, so
  // previewRecipeImport always runs against the real safe-url-fetcher.
  fetchDependencies?: SafeFetcherDependencies;
};

type PreviewIngredient = Awaited<ReturnType<typeof previewRecipeImport>>["ingredients"][number];
type FoodWithMacros = { kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number };

function logExtractionOutcome(status: "success" | "fetch_failed", code?: string) {
  console.log(`recipe_discovery_extraction status=${status}${code ? ` code=${code}` : ""}`);
}

/**
 * Computes recipe nutrition the same way calculateRecipeNutrition does
 * (Σ ingredient grams/100 × trusted Food macros) directly from a PREVIEW's
 * already-resolved ingredients, without ever persisting a Recipe row first.
 * Deliberately refuses to produce a number at all unless EVERY ingredient
 * resolved to a real trusted Food with a resolved gram quantity — a partial
 * result is reported as unresolved/incomplete (resolvedCount/unresolvedCount),
 * never silently scaled from a subset. Never reads webpage-claimed nutrition.
 */
function computePreviewNutrition(ingredients: readonly PreviewIngredient[]) {
  if (!ingredients.length) return { calculable: false, resolvedCount: 0, unresolvedCount: 0, macros: null as MacroTotals | null, weightGrams: null as number | null };
  let resolvedCount = 0;
  let totals = emptyMacros();
  let weightGrams = 0;
  for (const ingredient of ingredients) {
    const food = ingredient.selectedFood as unknown as FoodWithMacros | null;
    const grams = ingredient.quantity?.status === "resolved" ? ingredient.quantity.grams : undefined;
    if (!food || typeof grams !== "number") continue;
    resolvedCount += 1;
    weightGrams += grams;
    totals = addMacros(totals, scaleMacros({ kcal: food.kcalPer100g, fat: food.fatPer100g, protein: food.proteinPer100g, carbs: food.carbsPer100g, fiber: food.fiberPer100g }, grams / 100));
  }
  const calculable = resolvedCount === ingredients.length && weightGrams > 0;
  return {
    calculable,
    resolvedCount,
    unresolvedCount: ingredients.length - resolvedCount,
    macros: calculable ? scaleMacros(totals, 100 / weightGrams) : null,
    weightGrams: weightGrams || null
  };
}

/**
 * Only the clean whole-dish case: the AI classified the phrase as a
 * compound/prepared dish, no explicit component ingredients were stated
 * (so there is exactly one semantic item — the dish name itself), and that
 * item's own local+structured-source resolution genuinely found nothing.
 * A multi-ingredient compound phrase ("lecsó with 2 sausages and 3 eggs")
 * still goes through the existing item-level path unchanged — recipe
 * discovery for a partially-specified dish is out of this checkpoint's scope.
 */
function isEligibleForRecipeDiscovery(result: InterpretResult): boolean {
  if (result.semantic?.kind !== "compound_dish") return false;
  if (result.semantic?.clarificationNeeded) return false;
  if (!result.items || result.items.length !== 1) return false;
  const item = result.items[0];
  return item.foodResolution === "unresolved" && !item.selectedFood;
}

/**
 * Attaches a bounded, confirmable web-discovered recipe preview to an
 * already-computed InterpretResult — called from the route handler AFTER
 * interpretMealInput, never from inside it. Recipe discovery is a fallback
 * layered on top of food understanding, not a code path threaded through it:
 * this keeps interpret.ts exactly as focused as before, and avoids a
 * meal-input <-> recipes import cycle (recipe-import.ts already imports
 * interpretMealInput for its own ingredient resolution).
 */
export async function attachRecipeDiscoveryFallback(result: InterpretResult, deps: RecipeDiscoveryFallbackDeps): Promise<InterpretResult> {
  if (!isEligibleForRecipeDiscovery(result)) return result;
  const dishName = result.semantic?.dishName?.trim() || result.parsed.foodQuery;
  if (!dishName) return result;

  const discovery = await deps.discoveryService.discover({ originalPhrase: dishName, locale: deps.locale, userId: deps.userId });

  if (discovery.status !== "found") {
    const preview: RecipeDiscoveryPreview = {
      status: "unresolved",
      searchAttempted: discovery.status !== "disabled",
      resultCount: "resultCount" in discovery ? discovery.resultCount : 0,
      candidatesAfterRelevanceFilter: "candidatesAfterRelevanceFilter" in discovery ? discovery.candidatesAfterRelevanceFilter : 0,
      reason: discovery.status === "no_results" ? "no_relevant_results" : discovery.status === "disabled" ? "disabled" : discovery.status === "rate_limited" ? "rate_limited" : "provider_error"
    };
    return { ...result, recipeDiscovery: preview };
  }

  let extracted;
  try {
    extracted = await previewRecipeImport(deps.prisma, discovery.candidate.url, deps.fetchDependencies ?? {}, deps.recipeAiProvider);
    logExtractionOutcome("success");
  } catch (error) {
    logExtractionOutcome("fetch_failed", error instanceof RecipeImportError ? error.publicCode : "unknown");
    const preview: RecipeDiscoveryPreview = {
      status: "unresolved",
      searchAttempted: true,
      resultCount: discovery.resultCount,
      candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
      reason: "fetch_failed"
    };
    return { ...result, recipeDiscovery: preview };
  }

  const nutrition = computePreviewNutrition(extracted.ingredients);
  const importProof = createRecipeImportProof(deps.userId, extracted.sourceUrl, extracted.extractionMethod);

  const preview: RecipeDiscoveryPreview = {
    status: "confirmation_required",
    searchAttempted: true,
    resultCount: discovery.resultCount,
    candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
    candidate: {
      title: extracted.title,
      sourceUrl: extracted.sourceUrl,
      domain: domainOf(extracted.sourceUrl),
      servings: extracted.servings,
      extractionMethod: extracted.extractionMethod,
      ingredientCount: extracted.ingredients.length,
      resolvedIngredientCount: nutrition.resolvedCount,
      unresolvedIngredientCount: nutrition.unresolvedCount,
      ingredientSummary: extracted.ingredients.map((ingredient) => ingredient.originalText).slice(0, 50),
      nutritionPer100g: nutrition.macros,
      nutritionCalculable: nutrition.calculable,
      ingredientWeightGrams: nutrition.weightGrams,
      importProof
    }
  };
  return { ...result, recipeDiscovery: preview };
}
