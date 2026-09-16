import type { PrismaClient } from "@prisma/client";
import type { RecipeDiscoveryMealItemInput } from "@keto-mentor/shared";
import type { DynamicResolutionDeps } from "../meal-input/interpret.js";
import type { RecipeExtractionProvider } from "../recipes/recipe-extraction-provider.js";
import { previewRecipeImport } from "../recipes/recipe-import.js";
import { verifyRecipeImportProof } from "../recipes/import-proof.js";
import { toIngredientReview, classifyRecipeReview, computeTrustedNutrition, type ReviewableIngredient, type TrustedFoodSummary } from "../recipes/recipe-ingredient-review.js";
import { calculateRecipeNutrition, scaleRecipeSnapshot, type RecipeWithIngredients } from "../recipes/nutrition.js";
import type { SafeFetcherDependencies } from "../recipes/safe-url-fetcher.js";
import { DisabledRecipeIngredientNormalizationProvider, type RecipeIngredientNormalizationProvider } from "../recipes/recipe-ingredient-normalization.js";
import { DisabledRecipeQuantityEstimationProvider, type RecipeQuantityEstimationProvider } from "../recipes/recipe-quantity-estimation.js";

export type RecipeDiscoveryMealItemDeps = {
  recipeAiProvider: RecipeExtractionProvider;
  dynamic: DynamicResolutionDeps;
  // Test-only injection point — production never sets this, so re-derivation
  // always runs against the real safe-url-fetcher (mirrors
  // RecipeDiscoveryFallbackDeps.fetchDependencies exactly).
  fetchDependencies?: SafeFetcherDependencies;
  // Owner-beta checkpoint (2026-09-15) — final recipe nutrition review: this
  // was previously missing entirely, so meal-creation's own re-derivation
  // (required — never trusts the client's earlier preview) silently fell
  // back to the OLDER, weaker per-ingredient-line resolution path with no
  // whole-recipe-context normalization and no AI household-quantity
  // estimation, even though BOTH /recipes/import-url/preview and the
  // natural-language recipe-discovery path already use the full pipeline.
  // A real, reproduced consequence: a recipe preview correctly showing
  // 19/19 resolved could still fail meal creation with
  // "recipe_not_fully_resolved", since re-derivation used a materially
  // different (weaker) resolution path than what produced that preview.
  // Optional + defaulted so any existing caller/test that doesn't wire this
  // keeps compiling and behaving unchanged (still degrades to the
  // per-ingredient path, just now consistently with what such a caller
  // already had, not silently WORSE than what the user actually previewed).
  recipeIngredientNormalizationProvider?: RecipeIngredientNormalizationProvider;
  recipeQuantityEstimationProvider?: RecipeQuantityEstimationProvider;
};

function recipeDiscoveryMealItemError(publicCode: string, status = 400) {
  return Object.assign(new Error(publicCode), { status, publicCode });
}

const recipeInclude = {
  ingredients: { include: { food: { include: { nutrients: { include: { nutrient: true } } } } } }
} as const;

type VirtualIngredient = { foodId: string | null; quantityGrams: number | null; originalText: string; preparation?: string; sourceGroup?: string; role: "core" | "seasoning" | "garnish" | "serving_accompaniment"; optional: boolean; includedInBaseNutrition: boolean; roleProvenance: Record<string, unknown>; food: (TrustedFoodSummary & { nutrients?: never }) | null };
type VirtualRecipe = { servings: number | null; finishedWeightGrams: null; title: string; ingredients: VirtualIngredient[] };

/**
 * Owner-beta (2026-09-15) — final PR review: everything needed to accept or
 * refuse a recipe-discovery meal item, WITHOUT yet writing the Recipe row.
 * Splitting "derive + validate" from "persist" (see persistPreparedRecipe
 * below) means an overlap rejection discovered only after seeing this
 * item's own resolved ingredients (recipe-vs-sibling or recipe-vs-recipe,
 * both computed in createMeal AFTER every item in the request is prepared)
 * never leaves an orphaned Recipe row behind — the row is only ever created
 * once the WHOLE request is known to be acceptable.
 */
export type PreparedRecipeDiscoveryItem =
  | { kind: "existing"; recipeId: string; sourceUrl: string; recipe: RecipeWithIngredients }
  | { kind: "pending"; sourceUrl: string; virtualRecipe: VirtualRecipe; createData: Record<string, unknown> };

export function resolvedFoodIdsOf(prepared: PreparedRecipeDiscoveryItem): ReadonlySet<string> {
  const recipe = prepared.kind === "existing" ? prepared.recipe : prepared.virtualRecipe;
  return new Set(recipe.ingredients.map((ingredient) => ingredient.foodId).filter((id): id is string => !!id));
}

/**
 * Verifies the proof and either finds the user's own already-imported
 * Recipe for this exact sourceUrl (Phase 9 local reuse + recipe-level
 * idempotency — never another user's, even a public one: recipe-discovery's
 * claim is "this is what YOU found and confirmed") or re-derives the full
 * trusted ingredient list server-side via previewRecipeImport — the exact
 * same source of truth the discovery preview itself used. Refuses (never
 * partially prepares) unless EVERY ingredient reaches trusted nutrition
 * (recipeState === "fully_resolved").
 */
export async function prepareRecipeDiscoveryItem(
  prisma: PrismaClient,
  userId: string,
  item: RecipeDiscoveryMealItemInput,
  deps: RecipeDiscoveryMealItemDeps
): Promise<PreparedRecipeDiscoveryItem> {
  verifyRecipeImportProof(item.importProof, userId, item.sourceUrl, item.extractionMethod);

  const existing = await prisma.recipe.findFirst({ where: { userId, sourceUrl: item.sourceUrl, deletedAt: null }, include: recipeInclude });
  if (existing) return { kind: "existing", recipeId: existing.id, sourceUrl: item.sourceUrl, recipe: existing as unknown as RecipeWithIngredients };

  const extracted = await previewRecipeImport(
    prisma, item.sourceUrl, deps.fetchDependencies ?? {}, deps.recipeAiProvider, deps.dynamic,
    deps.recipeIngredientNormalizationProvider ?? new DisabledRecipeIngredientNormalizationProvider(),
    deps.recipeQuantityEstimationProvider ?? new DisabledRecipeQuantityEstimationProvider()
  );
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

  const virtualIngredients: VirtualIngredient[] = reviews.map((review) => ({
    foodId: review.resolvedFood?.id ?? null,
    quantityGrams: review.quantityGrams ?? null,
    originalText: review.originalText,
    preparation: review.preparation,
    sourceGroup: review.sourceGroup,
    role: review.role,
    optional: review.optional,
    includedInBaseNutrition: review.includedInBaseNutrition,
    roleProvenance: { evidence: review.roleEvidence, sourceGroup: review.sourceGroup ?? null },
    food: review.resolvedFood
  }));

  return {
    kind: "pending",
    sourceUrl: item.sourceUrl,
    virtualRecipe: { servings: extracted.servings ?? null, finishedWeightGrams: null, title: extracted.title, ingredients: virtualIngredients },
    createData: {
      userId,
      title: extracted.title,
      instructions: extracted.instructions,
      servings: extracted.servings,
      visibility: "private",
      sourceType: extracted.extractionMethod === "schema_org_json_ld" ? "schema_org" : "ai_structured",
      sourceUrl: extracted.sourceUrl,
      provenance: { importedAt: new Date().toISOString(), extractionMethod: extracted.extractionMethod, sourceUrl: extracted.sourceUrl, trust: "source_verified" },
      ingredients: {
        create: virtualIngredients.map((ingredient, index) => ({
          foodId: ingredient.foodId, quantityGrams: ingredient.quantityGrams, originalText: ingredient.originalText, preparation: ingredient.preparation,
          sourceGroup: ingredient.sourceGroup, role: ingredient.role, optional: ingredient.optional,
          includedInBaseNutrition: ingredient.includedInBaseNutrition, roleProvenance: ingredient.roleProvenance, sortOrder: index
        }))
      }
    }
  };
}

/** Only ever called once the WHOLE request (every item, every overlap check) is known to be acceptable. A no-op DB read for an already-existing Recipe (just returns its id); a real `recipe.create` write for a "pending" one. */
export async function persistPreparedRecipe(prisma: PrismaClient, prepared: PreparedRecipeDiscoveryItem): Promise<string> {
  if (prepared.kind === "existing") return prepared.recipeId;
  const created = await prisma.recipe.create({ data: prepared.createData as any, include: recipeInclude });
  return created.id;
}

export function computeRecipeMealItemData(prepared: PreparedRecipeDiscoveryItem, recipeId: string, item: RecipeDiscoveryMealItemInput) {
  const recipe = prepared.kind === "existing" ? prepared.recipe : prepared.virtualRecipe;
  const nutrition = calculateRecipeNutrition(recipe as unknown as RecipeWithIngredients);
  const baseWeight = recipe.finishedWeightGrams ?? nutrition.ingredientWeightGrams;
  if (!baseWeight) throw recipeDiscoveryMealItemError("recipe_nutrition_not_calculable");
  const factor = item.unit === "serving"
    ? recipe.servings ? item.quantity / recipe.servings : (() => { throw recipeDiscoveryMealItemError("recipe_servings_required"); })()
    : item.quantity / baseWeight;
  const snapshot = scaleRecipeSnapshot(nutrition.total.macros, nutrition.total.nutrients, factor);
  const quantityGrams = item.unit === "serving" ? baseWeight * factor : item.quantity;

  return {
    recipeId,
    quantityGrams,
    displayName: recipe.title,
    snapshotKcal: snapshot.macros.kcal,
    snapshotFat: snapshot.macros.fat,
    snapshotProtein: snapshot.macros.protein,
    snapshotCarbs: snapshot.macros.carbs,
    snapshotFiber: snapshot.macros.fiber,
    // The portion's own already-correctly-scaled netCarbs (see scaleMacroTotals) —
    // persisted directly, never re-derived from snapshotCarbs/snapshotFiber at read
    // time, which would re-clamp an already-aggregated total. See nutrition.ts.
    snapshotNetCarbs: snapshot.macros.netCarbs,
    snapshotNutrients: snapshot.nutrients
  };
}
