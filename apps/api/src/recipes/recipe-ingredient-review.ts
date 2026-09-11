import type { ExternalFoodCandidate } from "../catalog/external-food.js";
import { addMacros, emptyMacros, scaleMacros, type MacroTotals } from "../nutrition-core.js";

/**
 * The recipe ingredient review contract (owner-beta blocker #6, 2026-09-11).
 * Reuses interpretMealInput's own existing three-way outcome (resolved /
 * confirmation_required / unresolved) and the EXISTING externalCandidates
 * (ExternalFoodCandidate[], confirmable only via POST /foods/resolve-external/
 * confirm — source+sourceId, server-side refetch/revalidation) rather than
 * inventing a second USDA confirmation protocol. No nutrition supplied by an
 * AI/webpage extraction ever reaches this shape — resolvedFood/localCandidates
 * only ever carry already-trusted catalog Food rows.
 */
export type RecipeIngredientReviewStatus = "resolved" | "confirmation_required" | "unresolved";

export type TrustedFoodSummary = {
  id: string;
  name: string;
  source: string;
  kcalPer100g: number;
  fatPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
};

export type LocalCandidateSummary = { id: string; name: string; source: string };

export type RecipeIngredientReview = {
  originalText: string;
  parsedQuantity?: number;
  parsedUnit?: string;
  parsedFoodQuery: string;
  preparation?: string;
  status: RecipeIngredientReviewStatus;
  // Set only when status === "resolved" — the SAME trust bar
  // interpretMealInput itself already enforces (isTrustedLocalMatch, or a
  // dynamic resolution that converged and survived the semantic-coverage
  // gate). Never set merely because a preview selectedFood/candidate exists.
  resolvedFood: TrustedFoodSummary | null;
  // Present when status === "confirmation_required" and the candidate(s)
  // came from dynamic/external (USDA) resolution — the exact existing
  // ExternalFoodCandidate shape. The client may confirm ONE of these ONLY by
  // sending {source, sourceId} to the existing POST /foods/resolve-external/
  // confirm endpoint, which re-fetches and re-validates server-side; nothing
  // here is ever nutrition the client could submit directly.
  externalCandidates?: ExternalFoodCandidate[];
  externalCandidatesReason?: "ambiguous" | "possible_duplicate" | "weak_match";
  // Present when status === "confirmation_required" and the ambiguity is
  // purely local (a preparation-specific form missing from the catalog, or
  // two local matches nearly tied) — informational only in this checkpoint;
  // there is no dedicated confirm-by-local-id endpoint yet (deliberately out
  // of scope, see the PR description).
  localCandidates?: LocalCandidateSummary[];
  quantityStatus: "resolved" | "unresolved";
  quantityGrams?: number;
  // THE FIX (owner-beta blocker #6): true only when status === "resolved"
  // AND quantityStatus === "resolved". A confirmation_required ingredient
  // NEVER counts, even though interpretOne intentionally keeps a preview
  // selectedFood/resolved-quantity around for confirmation_required outcomes
  // (see interpret.ts's prepUnavailable/ambiguous branches) — that preview
  // exists so the review UI has something to show, never so it can be
  // silently treated as trusted.
  trustedNutritionReady: boolean;
};

// The minimal shape this module needs from a previewRecipeImport ingredient
// result — avoids a circular import on recipe-import.ts's own richer type.
export type ReviewableIngredient = {
  originalText: string;
  parsedQuantity?: number;
  parsedUnit?: string;
  parsedFoodQuery: string;
  preparation?: string;
  resolution: string;
  selectedFood: { id: string; name: string; source: string; kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number } | null;
  candidates: readonly { id: string; name: string; source: string }[];
  quantity: { status: string; grams?: number } | null;
  externalCandidates?: ExternalFoodCandidate[];
  externalCandidatesReason?: "ambiguous" | "possible_duplicate" | "weak_match";
};

function toTrustedFoodSummary(food: NonNullable<ReviewableIngredient["selectedFood"]>): TrustedFoodSummary {
  return { id: food.id, name: food.name, source: food.source, kcalPer100g: food.kcalPer100g, fatPer100g: food.fatPer100g, proteinPer100g: food.proteinPer100g, carbsPer100g: food.carbsPer100g, fiberPer100g: food.fiberPer100g };
}

function toLocalCandidateSummary(food: { id: string; name: string; source: string }): LocalCandidateSummary {
  return { id: food.id, name: food.name, source: food.source };
}

export function toIngredientReview(ingredient: ReviewableIngredient): RecipeIngredientReview {
  // A single recipe ingredient line is expected to parse as ONE food item.
  // "multi"/"compound" mean the line itself didn't (e.g. a multi-clause
  // sentence, or injected text like "ignore previous instructions..." that
  // tokenizes into several pseudo-items) — there is no single coherent
  // identity to review here, so this is treated as a dead end (unresolved),
  // never as if it had a meaningful confirmable candidate.
  const status: RecipeIngredientReviewStatus =
    ingredient.resolution === "resolved" ? "resolved"
    : ingredient.resolution === "confirmation_required" || ingredient.resolution === "preview" ? "confirmation_required"
    : "unresolved";

  const quantityStatus: "resolved" | "unresolved" = ingredient.quantity?.status === "resolved" ? "resolved" : "unresolved";
  const quantityGrams = ingredient.quantity?.status === "resolved" ? ingredient.quantity.grams : undefined;

  const trustedNutritionReady = status === "resolved" && quantityStatus === "resolved" && !!ingredient.selectedFood;
  const resolvedFood = status === "resolved" && ingredient.selectedFood ? toTrustedFoodSummary(ingredient.selectedFood) : null;

  const hasExternalCandidates = status === "confirmation_required" && !!ingredient.externalCandidates?.length;
  const localCandidates =
    status === "confirmation_required" && !hasExternalCandidates && ingredient.selectedFood
      ? [ingredient.selectedFood, ...ingredient.candidates.filter((c) => c.id !== ingredient.selectedFood!.id)].slice(0, 5).map(toLocalCandidateSummary)
      : undefined;

  return {
    originalText: ingredient.originalText,
    parsedQuantity: ingredient.parsedQuantity,
    parsedUnit: ingredient.parsedUnit,
    parsedFoodQuery: ingredient.parsedFoodQuery,
    preparation: ingredient.preparation,
    status,
    resolvedFood,
    externalCandidates: hasExternalCandidates ? ingredient.externalCandidates : undefined,
    externalCandidatesReason: hasExternalCandidates ? ingredient.externalCandidatesReason : undefined,
    localCandidates,
    quantityStatus,
    quantityGrams,
    trustedNutritionReady
  };
}

export type RecipeReviewState = "fully_resolved" | "reviewable" | "unusable";

export type RecipeReviewSummary = {
  state: RecipeReviewState;
  resolvedCount: number;
  confirmationRequiredCount: number;
  unresolvedCount: number;
  quantityReadyCount: number;
  trustedNutritionReadyCount: number;
};

/**
 * Deterministic, non-AI classification of a candidate page's whole
 * ingredient set. UNUSABLE is reserved for "nothing here can ever be
 * reviewed into a usable recipe" (zero ingredients extracted, or every
 * single one is a hard dead end) — a MIX of resolved/confirmation_required/
 * unresolved ingredients is REVIEWABLE, since the confirmation_required and
 * resolved ones genuinely have something a human can act on even when one
 * ingredient remains a dead end (e.g. a single mis-parsed ingredient must
 * never sink an otherwise-legitimate recipe).
 */
export function classifyRecipeReview(ingredients: readonly RecipeIngredientReview[]): RecipeReviewSummary {
  const resolvedCount = ingredients.filter((i) => i.status === "resolved").length;
  const confirmationRequiredCount = ingredients.filter((i) => i.status === "confirmation_required").length;
  const unresolvedCount = ingredients.filter((i) => i.status === "unresolved").length;
  const quantityReadyCount = ingredients.filter((i) => i.quantityStatus === "resolved").length;
  const trustedNutritionReadyCount = ingredients.filter((i) => i.trustedNutritionReady).length;

  let state: RecipeReviewState;
  if (!ingredients.length) state = "unusable";
  else if (trustedNutritionReadyCount === ingredients.length) state = "fully_resolved";
  else if (unresolvedCount === ingredients.length) state = "unusable";
  else state = "reviewable";

  return { state, resolvedCount, confirmationRequiredCount, unresolvedCount, quantityReadyCount, trustedNutritionReadyCount };
}

/**
 * FINAL/TRUSTED recipe nutrition only — computed exclusively from ingredients
 * whose trustedNutritionReady is true. Refuses to produce a number at all
 * unless EVERY ingredient is trusted (never a partial/scaled estimate from a
 * subset) — this is the fixed replacement for the prior checkpoint's
 * computePreviewNutrition, which incorrectly counted a merely-previewed
 * confirmation_required candidate. Never reads webpage-claimed nutrition.
 */
export function computeTrustedNutrition(ingredients: readonly RecipeIngredientReview[]): { calculable: boolean; macros: MacroTotals | null; weightGrams: number | null } {
  if (!ingredients.length || !ingredients.every((i) => i.trustedNutritionReady)) {
    return { calculable: false, macros: null, weightGrams: null };
  }
  let totals = emptyMacros();
  let weightGrams = 0;
  for (const ingredient of ingredients) {
    const food = ingredient.resolvedFood!;
    const grams = ingredient.quantityGrams!;
    weightGrams += grams;
    totals = addMacros(totals, scaleMacros({ kcal: food.kcalPer100g, fat: food.fatPer100g, protein: food.proteinPer100g, carbs: food.carbsPer100g, fiber: food.fiberPer100g }, grams / 100));
  }
  return { calculable: weightGrams > 0, macros: weightGrams > 0 ? scaleMacros(totals, 100 / weightGrams) : null, weightGrams: weightGrams || null };
}
