import type { PrismaClient } from "@prisma/client";
import type { RecipeDiscoveryMealItemInput } from "@keto-mentor/shared";
import type { DynamicResolutionDeps } from "../meal-input/interpret.js";
import type { RecipeExtractionProvider } from "../recipes/recipe-extraction-provider.js";
import { previewRecipeImport } from "../recipes/recipe-import.js";
import { verifyRecipeImportProof } from "../recipes/import-proof.js";
import { toIngredientReview, classifyRecipeReview, computeTrustedNutrition, type ReviewableIngredient } from "../recipes/recipe-ingredient-review.js";
import { calculateRecipeNutrition, scaleRecipeSnapshot, type RecipeWithIngredients } from "../recipes/nutrition.js";
import type { SafeFetcherDependencies } from "../recipes/safe-url-fetcher.js";

export type RecipeDiscoveryMealItemDeps = {
  recipeAiProvider: RecipeExtractionProvider;
  dynamic: DynamicResolutionDeps;
  // Test-only injection point — production never sets this, so re-derivation
  // always runs against the real safe-url-fetcher (mirrors
  // RecipeDiscoveryFallbackDeps.fetchDependencies exactly).
  fetchDependencies?: SafeFetcherDependencies;
};

export type ResolvedRecipeDiscoveryMealItem = {
  recipeId: string;
  resolvedFoodIds: ReadonlySet<string>;
  mealItemData: {
    recipeId: string;
    quantityGrams: number;
    displayName: string;
    snapshotKcal: number;
    snapshotFat: number;
    snapshotProtein: number;
    snapshotCarbs: number;
    snapshotFiber: number;
    snapshotNutrients: ReturnType<typeof scaleRecipeSnapshot>["nutrients"];
  };
};

function recipeDiscoveryMealItemError(publicCode: string, status = 400) {
  return Object.assign(new Error(publicCode), { status, publicCode });
}

const recipeInclude = {
  ingredients: { include: { food: { include: { nutrients: { include: { nutrient: true } } } } } }
} as const;

/**
 * Owner-beta (2026-09-14) — recipe-confirm checkpoint: turns a server-
 * previewed web recipe candidate into a real, user-owned Recipe (reusing
 * one already imported from the SAME sourceUrl when it exists — this is
 * both Phase 9's local-recipe-reuse requirement AND recipe-level
 * idempotency for a duplicate/retried confirmation) and a ready-to-persist
 * MealItem shape, matching addRecipeToMeal's own portion/snapshot logic
 * exactly so both entry points behave identically.
 *
 * Trust boundary: the CLIENT supplies only `sourceUrl` + the proof that it
 * legitimately went through discovery/preview for that exact URL, plus the
 * portion it consumed. The client supplies NO ingredient list, no Food IDs,
 * no nutrition — every one of those is re-derived server-side from
 * `previewRecipeImport`, the exact same source of truth the discovery
 * preview itself used, and the recipe is refused (never partially saved)
 * unless EVERY ingredient reaches trusted nutrition (recipeState ===
 * "fully_resolved") — the same bar recipe-discovery-fallback.ts already
 * enforces before ever presenting a candidate as usable.
 */
export async function resolveRecipeDiscoveryMealItem(
  prisma: PrismaClient,
  userId: string,
  item: RecipeDiscoveryMealItemInput,
  deps: RecipeDiscoveryMealItemDeps
): Promise<ResolvedRecipeDiscoveryMealItem> {
  verifyRecipeImportProof(item.importProof, userId, item.sourceUrl, item.extractionMethod);

  // Phase 9 (local reuse) + Phase 8 (idempotency for the Recipe half of a
  // retried confirmation): the user's OWN prior import of this exact URL
  // wins outright — no re-fetch, no re-AI-call, no duplicate Recipe row.
  // Scoped to userId (never another user's recipe under the same URL, even
  // a public one — recipe-discovery's own claim is "this is what YOU found
  // and confirmed", not a shared community recipe).
  const existing = await prisma.recipe.findFirst({ where: { userId, sourceUrl: item.sourceUrl, deletedAt: null }, include: recipeInclude });
  const recipe = existing ?? (await createRecipeFromDiscovery(prisma, userId, item, deps));

  const nutrition = calculateRecipeNutrition(recipe as unknown as RecipeWithIngredients);
  const baseWeight = recipe.finishedWeightGrams ?? nutrition.ingredientWeightGrams;
  if (!baseWeight) throw recipeDiscoveryMealItemError("recipe_nutrition_not_calculable");
  const factor = item.unit === "serving"
    ? recipe.servings ? item.quantity / recipe.servings : (() => { throw recipeDiscoveryMealItemError("recipe_servings_required"); })()
    : item.quantity / baseWeight;
  const snapshot = scaleRecipeSnapshot(nutrition.total.macros, nutrition.total.nutrients, factor);
  const quantityGrams = item.unit === "serving" ? baseWeight * factor : item.quantity;

  return {
    recipeId: recipe.id,
    resolvedFoodIds: new Set(recipe.ingredients.map((ingredient) => ingredient.foodId)),
    mealItemData: {
      recipeId: recipe.id,
      quantityGrams,
      displayName: recipe.title,
      snapshotKcal: snapshot.macros.kcal,
      snapshotFat: snapshot.macros.fat,
      snapshotProtein: snapshot.macros.protein,
      snapshotCarbs: snapshot.macros.carbs,
      snapshotFiber: snapshot.macros.fiber,
      snapshotNutrients: snapshot.nutrients
    }
  };
}

async function createRecipeFromDiscovery(prisma: PrismaClient, userId: string, item: RecipeDiscoveryMealItemInput, deps: RecipeDiscoveryMealItemDeps) {
  const extracted = await previewRecipeImport(prisma, item.sourceUrl, deps.fetchDependencies ?? {}, deps.recipeAiProvider, deps.dynamic);
  // The page may have changed since the user's original preview (or a
  // differently-shaped page was served this time) — the proof was minted
  // for a SPECIFIC extraction method, never a blank check to accept
  // whatever comes back now.
  if (extracted.extractionMethod !== item.extractionMethod) throw recipeDiscoveryMealItemError("recipe_source_changed");

  const reviews = extracted.ingredients.map((ingredient) => toIngredientReview(ingredient as unknown as ReviewableIngredient));
  const summary = classifyRecipeReview(reviews);
  if (summary.state !== "fully_resolved") throw recipeDiscoveryMealItemError("recipe_not_fully_resolved");
  const trusted = computeTrustedNutrition(reviews, extracted.servings);
  if (!trusted.calculable) throw recipeDiscoveryMealItemError("recipe_nutrition_not_calculable");

  return prisma.recipe.create({
    data: {
      userId,
      title: extracted.title,
      instructions: extracted.instructions,
      servings: extracted.servings,
      visibility: "private",
      sourceType: extracted.extractionMethod === "schema_org_json_ld" ? "schema_org" : "ai_structured",
      sourceUrl: extracted.sourceUrl,
      provenance: { importedAt: new Date().toISOString(), extractionMethod: extracted.extractionMethod, sourceUrl: extracted.sourceUrl, trust: "source_verified" },
      ingredients: {
        create: reviews.map((review, index) => ({
          foodId: review.resolvedFood!.id,
          quantityGrams: review.quantityGrams!,
          originalText: review.originalText,
          preparation: review.preparation,
          sortOrder: index
        }))
      }
    },
    include: recipeInclude
  });
}
