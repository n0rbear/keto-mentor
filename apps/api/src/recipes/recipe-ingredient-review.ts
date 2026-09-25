import type { ExternalFoodCandidate } from "../catalog/external-food.js";
import { addMacros, emptyMacros, scaleMacros, scaleMacroTotals, type MacroTotals } from "../nutrition-core.js";
import type { RecipeIngredientRole } from "./recipe-ingredient-role.js";
import type { InterpretResult } from "../meal-input/interpret.js";

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
export type RecipeQuantitySource = "explicit" | "authoritative_conversion" | "estimated" | "unquantified_seasoning" | "user_input" | "unknown";

// Why an ingredient keeps a recipe from being logged (owner request,
// 2026-09-25: show the exact reason and let the user fix it by hand).
// Absent whenever trustedNutritionReady is true.
export type RecipeIngredientBlockingReason = "food_not_found" | "food_needs_confirmation" | "ai_estimate_only" | "quantity_missing";

export type TrustedFoodSummary = {
  sourceId?: string | null;
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
  aiEstimate?: InterpretResult["aiEstimate"];
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
  quantitySource: RecipeQuantitySource;
  quantityConfidence?: number;
  quantityRange?: { min: number; max: number; unit?: string };
  excludeFromNutrition: boolean;
  sourceGroup?: string;
  role: RecipeIngredientRole;
  optional: boolean;
  includedInBaseNutrition: boolean;
  roleEvidence: "source_group" | "ingredient_wording" | "default_core";
  // THE FIX (owner-beta blocker #6): true only when status === "resolved"
  // AND quantityStatus === "resolved". A confirmation_required ingredient
  // NEVER counts, even though interpretOne intentionally keeps a preview
  // selectedFood/resolved-quantity around for confirmation_required outcomes
  // (see interpret.ts's prepUnavailable/ambiguous branches) — that preview
  // exists so the review UI has something to show, never so it can be
  // silently treated as trusted.
  trustedNutritionReady: boolean;
  blockingReason?: RecipeIngredientBlockingReason;
  // True once a manual override (see applyIngredientOverrides) changed this ingredient.
  userAdjusted?: boolean;
};

function blockingReasonOf(review: Pick<RecipeIngredientReview, "trustedNutritionReady" | "status" | "aiEstimate" | "resolvedFood">): RecipeIngredientBlockingReason | undefined {
  if (review.trustedNutritionReady) return undefined;
  if (review.status === "unresolved") return review.aiEstimate ? "ai_estimate_only" : "food_not_found";
  if (review.status === "confirmation_required" || !review.resolvedFood) return "food_needs_confirmation";
  return "quantity_missing";
}

// The minimal shape this module needs from a previewRecipeImport ingredient
// result — avoids a circular import on recipe-import.ts's own richer type.
export type ReviewableIngredient = {
  aiEstimate?: InterpretResult["aiEstimate"];
  originalText: string;
  parsedQuantity?: number;
  parsedUnit?: string;
  parsedFoodQuery: string;
  preparation?: string;
  resolution: string;
  selectedFood: { id: string; name: string; source: string; sourceId?: string | null; kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number } | null;
  candidates: readonly { id: string; name: string; source: string }[];
  quantity: { status: string; grams?: number } | null;
  quantitySource?: RecipeQuantitySource;
  quantityGrams?: number;
  quantityConfidence?: number;
  quantityRange?: { min: number; max: number; unit?: string };
  excludeFromNutrition?: boolean;
  sourceGroup?: string;
  role?: RecipeIngredientRole;
  optional?: boolean;
  includedInBaseNutrition?: boolean;
  evidence?: "source_group" | "ingredient_wording" | "default_core";
  externalCandidates?: ExternalFoodCandidate[];
  externalCandidatesReason?: "ambiguous" | "possible_duplicate" | "weak_match";
};

function toTrustedFoodSummary(food: NonNullable<ReviewableIngredient["selectedFood"]>): TrustedFoodSummary {
  return { id: food.id, name: food.name, source: food.source, ...(food.sourceId ? { sourceId: food.sourceId } : {}), kcalPer100g: food.kcalPer100g, fatPer100g: food.fatPer100g, proteinPer100g: food.proteinPer100g, carbsPer100g: food.carbsPer100g, fiberPer100g: food.fiberPer100g };
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

  const quantityGrams = ingredient.quantity?.status === "resolved" ? ingredient.quantity.grams : ingredient.quantityGrams;
  const quantityStatus: "resolved" | "unresolved" = quantityGrams != null ? "resolved" : "unresolved";
  const quantitySource: RecipeQuantitySource = ingredient.quantitySource ?? (quantityStatus === "resolved" ? "authoritative_conversion" : "unknown");
  const role = ingredient.excludeFromNutrition && quantitySource === "unquantified_seasoning" ? "seasoning" : (ingredient.role ?? "core");
  const includedInBaseNutrition = ingredient.includedInBaseNutrition ?? true;
  const excludeFromNutrition = !includedInBaseNutrition || (ingredient.excludeFromNutrition === true && quantitySource === "unquantified_seasoning");

  const trustedNutritionReady = excludeFromNutrition || (status === "resolved" && quantityStatus === "resolved" && !!ingredient.selectedFood);
  const resolvedFood = status === "resolved" && ingredient.selectedFood ? toTrustedFoodSummary(ingredient.selectedFood) : null;

  const hasExternalCandidates = status === "confirmation_required" && !!ingredient.externalCandidates?.length;
  // Live staging RCA (2026-09-24): `ingredient.candidates` is not guaranteed
  // populated on every ReviewableIngredient shape that can reach this branch
  // (status confirmation_required, a selectedFood preview, no external
  // candidates) — an undefined value here used to throw a raw TypeError
  // (`Cannot read properties of undefined (reading 'filter')`), which,
  // uncaught, could abort an entire recipe-discovery search over ONE
  // candidate's ONE ingredient (see recipe-discovery-fallback.ts's own
  // candidate-isolation fix, same date, for the defense-in-depth half of
  // this).
  const localCandidates =
    status === "confirmation_required" && !hasExternalCandidates && ingredient.selectedFood
      ? [ingredient.selectedFood, ...(ingredient.candidates ?? []).filter((c) => c.id !== ingredient.selectedFood!.id)].slice(0, 5).map(toLocalCandidateSummary)
      : undefined;

  return {
    originalText: ingredient.originalText,
    aiEstimate: ingredient.aiEstimate,
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
    quantitySource,
    quantityConfidence: ingredient.quantityConfidence,
    quantityRange: ingredient.quantityRange,
    excludeFromNutrition,
    sourceGroup: ingredient.sourceGroup,
    role,
    optional: ingredient.optional ?? false,
    includedInBaseNutrition,
    roleEvidence: ingredient.evidence ?? "default_core",
    trustedNutritionReady,
    blockingReason: blockingReasonOf({ trustedNutritionReady, status, aiEstimate: ingredient.aiEstimate, resolvedFood })
  };
}

export type RecipeIngredientOverrideInput =
  | { ingredientIndex: number; action: "exclude" }
  | { ingredientIndex: number; action: "grams"; grams: number }
  | { ingredientIndex: number; action: "food"; foodId: string; grams?: number };

/**
 * Applies the user's manual fixes to the server's OWN freshly re-derived
 * ingredient reviews (never to anything the client sent back). `foods` must
 * hold only foods the caller already checked this user may use (catalog or
 * their own). An override that points at a missing ingredient or an
 * unavailable food is refused outright, never silently skipped.
 */
export function applyIngredientOverrides(
  reviews: readonly RecipeIngredientReview[],
  overrides: readonly RecipeIngredientOverrideInput[],
  foods: ReadonlyMap<string, TrustedFoodSummary>
): RecipeIngredientReview[] {
  const next = reviews.map((review) => ({ ...review }));
  for (const override of overrides) {
    const current = next[override.ingredientIndex];
    if (!current) throw Object.assign(new Error("invalid_ingredient_override"), { status: 400, publicCode: "invalid_ingredient_override" });
    let updated: RecipeIngredientReview;
    if (override.action === "exclude") {
      updated = { ...current, excludeFromNutrition: true, includedInBaseNutrition: false };
    } else if (override.action === "grams") {
      updated = { ...current, quantityGrams: override.grams, quantityStatus: "resolved", quantitySource: "user_input" };
    } else {
      const food = foods.get(override.foodId);
      if (!food) throw Object.assign(new Error("invalid_ingredient_override"), { status: 400, publicCode: "invalid_ingredient_override" });
      const grams = override.grams ?? current.quantityGrams;
      updated = {
        ...current, status: "resolved", resolvedFood: food, aiEstimate: undefined, externalCandidates: undefined, externalCandidatesReason: undefined, localCandidates: undefined,
        excludeFromNutrition: false, includedInBaseNutrition: true,
        ...(grams != null ? { quantityGrams: grams, quantityStatus: "resolved" as const, quantitySource: override.grams != null ? "user_input" as const : current.quantitySource } : {})
      };
    }
    const excluded = updated.excludeFromNutrition || !updated.includedInBaseNutrition;
    const trustedNutritionReady = excluded || (updated.status === "resolved" && updated.quantityStatus === "resolved" && !!updated.resolvedFood);
    next[override.ingredientIndex] = { ...updated, trustedNutritionReady, blockingReason: blockingReasonOf({ ...updated, trustedNutritionReady }), userAdjusted: true };
  }
  return next;
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
 *
 * Owner-beta (2026-09-14) — Blocker 5 (portion/serving provenance): `macros`
 * (and the derived `weightGrams`) are per 100g of the COMBINED RAW
 * INGREDIENT WEIGHT, never the finished/cooked dish weight — a discovered
 * recipe has no finishedWeightGrams (see recipes/nutrition.ts's
 * calculateRecipeNutrition, which correctly refuses per100g without one, for
 * the local-saved-recipe equivalent). Raw ingredient weight typically
 * OVERSTATES a cooked dish's true weight (water evaporates; a soup/stew's
 * finished weight is usually LESS than its raw ingredients' sum), which
 * would UNDERSTATE the dish's real per-100g calorie density — this is a
 * known, honestly-labeled approximation, never presented as the dish's own
 * measured per-100g figure. `servings` (schema.org recipeYield or the AI
 * extraction's own structured field — never a fabricated number) lets a
 * PER-SERVING figure be computed instead, which needs no weight-basis
 * assumption at all and is the stronger of the two when available.
 */
export function computeTrustedNutrition(ingredients: readonly RecipeIngredientReview[], servings?: number): { calculable: boolean; macros: MacroTotals | null; total: MacroTotals | null; weightGrams: number | null; perServing: MacroTotals | null } {
  if (!ingredients.length || !ingredients.every((i) => i.trustedNutritionReady)) {
    return { calculable: false, macros: null, total: null, weightGrams: null, perServing: null };
  }
  let totals = emptyMacros();
  let weightGrams = 0;
  for (const ingredient of ingredients) {
    if (ingredient.excludeFromNutrition || !ingredient.includedInBaseNutrition) continue;
    const food = ingredient.resolvedFood!;
    const grams = ingredient.quantityGrams!;
    weightGrams += grams;
    totals = addMacros(totals, scaleMacros({ kcal: food.kcalPer100g, fat: food.fatPer100g, protein: food.proteinPer100g, carbs: food.carbsPer100g, fiber: food.fiberPer100g }, grams / 100));
  }
  const calculable = weightGrams > 0;
  // scaleMacroTotals (never scaleMacros) below: `totals` is already an
  // accumulated MacroTotals whose own netCarbs was correctly clamped once
  // per ingredient — see nutrition-core.ts's scaleMacroTotals comment.
  return {
    calculable,
    macros: calculable ? scaleMacroTotals(totals, 100 / weightGrams) : null,
    total: calculable ? totals : null,
    weightGrams: weightGrams || null,
    perServing: calculable && servings && servings > 0 ? scaleMacroTotals(totals, 1 / servings) : null
  };
}
