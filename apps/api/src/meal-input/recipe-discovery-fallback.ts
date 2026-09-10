import type { PrismaClient } from "@prisma/client";
import type { Locale } from "@keto-mentor/shared";
import type { DynamicResolutionDeps, InterpretResult } from "./interpret.js";
import { previewRecipeImport, RecipeImportError } from "../recipes/recipe-import.js";
import { createRecipeImportProof } from "../recipes/import-proof.js";
import type { RecipeExtractionProvider } from "../recipes/recipe-extraction-provider.js";
import { RecipeDiscoveryService, type RecipeDiscoveryCandidate, type RecipeDiscoveryPreview } from "../recipes/recipe-discovery.js";
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
  // Not yet wired by the production route (server.ts) — passing this through
  // is what lets the PR #49 live-eval diagnostic exercise real USDA/dynamic
  // resolution for recipe-derived ingredients. Omitted (undefined) everywhere
  // else, which previewRecipeImport treats identically to its own null default.
  dynamic?: DynamicResolutionDeps;
};

type ExtractedPreview = Awaited<ReturnType<typeof previewRecipeImport>>;
type PreviewIngredient = ExtractedPreview["ingredients"][number];
type FoodWithMacros = { kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number };

// A hard cap independent of (but currently matching) RecipeDiscoveryService's
// own MAX_CANDIDATES_RETURNED — kept as its own named constant here so this
// file's "how many candidates will I actually FETCH" bound is legible on its
// own without reaching into the discovery service's internals.
const MAX_CANDIDATE_ATTEMPTS = 3;

/**
 * RecipeImportError publicCodes that describe a property of ONE candidate
 * PAGE/URL — too big, wrong/missing shape, no usable recipe, that one
 * server didn't respond, or that one URL happened to resolve somewhere
 * unsafe. None of these say anything about the search/provider/database
 * layer, so trying the NEXT independently-sourced, independently-SSRF-
 * validated candidate from the same bounded set is safe and never weakens
 * any trust/security invariant — including the blocked-URL codes: the
 * unsafe URL is never fetched (safe-url-fetcher already refused it before
 * any network attempt), only skipped in favor of a different URL.
 */
const RECOVERABLE_CANDIDATE_CODES = new Set([
  "response_too_large", "recipe_content_too_large", "too_many_ingredients",
  "recipe_page_not_found", "malformed_json_ld", "recipe_ingredients_missing",
  "recipe_ai_unavailable", "recipe_ai_timeout", "recipe_ai_invalid_output",
  "unsupported_content_type",
  "blocked_url", "invalid_url", "dns_failure", "redirect_limit", "fetch_timeout", "fetch_failed"
]);
// Everything else — notably previewRecipeImport's own "import_failed"
// catch-all for a genuinely unexpected/unclassified error (e.g. a database
// failure inside its per-ingredient interpretMealInput calls) — says
// nothing about the one candidate page and would fail identically for the
// next one. Treated as SYSTEMIC: abort the whole attempt loop immediately
// rather than spend two more fetches repeating a real infrastructure error.

function logCandidateSetOutcome(candidateCount: number) {
  console.log(`recipe_discovery candidates=${candidateCount}`);
}

function logCandidateAttempt(index: number, domain: string, outcome: "skip" | "selected" | "systemic_error", detail: { fetch: "ok" | "failed"; extraction?: "ok" | "failed"; ingredients?: number; resolved?: number; nutritionCalculable?: boolean; reason?: string; url?: string }) {
  console.log(
    `candidate_attempt index=${index} domain=${domain} fetch=${detail.fetch}` +
    (detail.url ? ` url=${detail.url}` : "") +
    (detail.extraction ? ` extraction=${detail.extraction}` : "") +
    (detail.ingredients != null ? ` ingredients=${detail.ingredients}` : "") +
    (detail.resolved != null ? ` resolved=${detail.resolved}` : "") +
    (detail.nutritionCalculable != null ? ` nutrition_calculable=${detail.nutritionCalculable}` : "") +
    ` outcome=${outcome}` +
    (detail.reason ? ` reason=${detail.reason}` : "")
  );
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

function toCandidateShape(extracted: ExtractedPreview, nutrition: ReturnType<typeof computePreviewNutrition>, importProof: string): NonNullable<RecipeDiscoveryPreview["candidate"]> {
  return {
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
  };
}

type AttemptResult =
  | { outcome: "selected"; candidate: NonNullable<RecipeDiscoveryPreview["candidate"]> }
  | { outcome: "skip" }
  | { outcome: "systemic_error" };

/**
 * One candidate's full suitability pipeline: safe fetch -> extraction ->
 * (inside previewRecipeImport) ingredient resolution against the REAL
 * trusted Food/dynamic-resolution pipeline -> nutrition-calculability check.
 * Accepts (stops the caller's loop on) a candidate only when extraction
 * succeeded AND every ingredient resolved to a trusted Food + gram quantity
 * — the same strict, never-fabricate-nutrition bar already enforced
 * elsewhere. A candidate that extracts but resolves only partially is
 * "skip" (owner-beta blocker #5, 2026-09-10: prefer trying the next
 * independently-sourced candidate over surfacing a known-incomplete one).
 */
async function attemptCandidate(index: number, candidate: RecipeDiscoveryCandidate, deps: RecipeDiscoveryFallbackDeps): Promise<AttemptResult> {
  let extracted: ExtractedPreview;
  try {
    extracted = await previewRecipeImport(deps.prisma, candidate.url, deps.fetchDependencies ?? {}, deps.recipeAiProvider, deps.dynamic ?? null);
  } catch (error) {
    const code = error instanceof RecipeImportError ? error.publicCode : "unknown";
    if (error instanceof RecipeImportError && RECOVERABLE_CANDIDATE_CODES.has(code)) {
      logCandidateAttempt(index, candidate.domain, "skip", { fetch: "failed", reason: code, url: candidate.url });
      return { outcome: "skip" };
    }
    logCandidateAttempt(index, candidate.domain, "systemic_error", { fetch: "failed", reason: code, url: candidate.url });
    return { outcome: "systemic_error" };
  }

  const nutrition = computePreviewNutrition(extracted.ingredients);
  if (!extracted.ingredients.length || !nutrition.calculable) {
    logCandidateAttempt(index, candidate.domain, "skip", {
      fetch: "ok", extraction: "ok", ingredients: extracted.ingredients.length,
      resolved: nutrition.resolvedCount, nutritionCalculable: false,
      reason: !extracted.ingredients.length ? "no_usable_ingredients" : "ingredients_incomplete",
      url: candidate.url
    });
    return { outcome: "skip" };
  }

  logCandidateAttempt(index, candidate.domain, "selected", { fetch: "ok", extraction: "ok", ingredients: extracted.ingredients.length, resolved: nutrition.resolvedCount, nutritionCalculable: true, url: candidate.url });
  const importProof = createRecipeImportProof(deps.userId, extracted.sourceUrl, extracted.extractionMethod);
  return { outcome: "selected", candidate: toCandidateShape(extracted, nutrition, importProof) };
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
 *
 * Candidates from the SAME single Tavily search are tried SEQUENTIALLY
 * (never concurrently — protects latency/AI-call/network/recipe-site load,
 * per owner-beta blocker #5) and stop at the first one that is both
 * importable and fully ingredient-resolvable. No additional search is ever
 * made to find more candidates.
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
      candidatesAttempted: 0,
      reason: discovery.status === "no_results" ? "no_relevant_results" : discovery.status === "disabled" ? "disabled" : discovery.status === "rate_limited" ? "rate_limited" : "provider_error"
    };
    return { ...result, recipeDiscovery: preview };
  }

  logCandidateSetOutcome(discovery.candidates.length);
  const attempted = discovery.candidates.slice(0, MAX_CANDIDATE_ATTEMPTS);
  let attemptsMade = 0;
  let sawSystemicError = false;
  for (const candidate of attempted) {
    attemptsMade += 1;
    const attempt = await attemptCandidate(attemptsMade, candidate, deps);
    if (attempt.outcome === "selected") {
      const preview: RecipeDiscoveryPreview = {
        status: "confirmation_required",
        searchAttempted: true,
        resultCount: discovery.resultCount,
        candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
        candidatesAttempted: attemptsMade,
        candidate: attempt.candidate
      };
      return { ...result, recipeDiscovery: preview };
    }
    if (attempt.outcome === "systemic_error") { sawSystemicError = true; break; } // stop trying — see RECOVERABLE_CANDIDATE_CODES comment above
  }

  const preview: RecipeDiscoveryPreview = {
    status: "unresolved",
    searchAttempted: true,
    resultCount: discovery.resultCount,
    candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
    candidatesAttempted: attemptsMade,
    reason: sawSystemicError ? "systemic_error" : "no_fully_resolvable_candidate"
  };
  return { ...result, recipeDiscovery: preview };
}
