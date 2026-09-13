import { searchFoods, isTrustedLocalMatch } from "../catalog/food-search.js";
import { resolveDynamicFoodFromIdentity } from "../catalog/dynamic-food-resolution.js";
import { resolveQuantity, type DynamicResolutionDeps } from "../meal-input/interpret.js";
import { DisabledQuantityEstimationProvider } from "../meal-input/quantity-estimation.js";
import type { ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";
import type { RecipeIngredientNormalizationProvider } from "./recipe-ingredient-normalization.js";
import type { ReviewableIngredient } from "./recipe-ingredient-review.js";

type SearchablePrisma = Parameters<typeof searchFoods>[0];

// A superset of ReviewableIngredient — adds `canConfirm`, which
// recipe-ingredient-review.ts's own shape doesn't need but the manual
// Recipe Editor import flow (apps/web/src/RecipeEditor.tsx) reads directly
// off previewRecipeImport's returned ingredients array, exactly like the
// existing per-ingredient path already provides. Computed the same way
// interpret.ts's own quantity_postprocess step does: only true when both
// identity AND quantity are trusted without further confirmation.
export type BatchResolvedIngredient = ReviewableIngredient & { canConfirm: boolean };

/**
 * Owner-beta checkpoint (2026-09-13): the whole-recipe-context batch
 * normalization path (see recipe-ingredient-normalization.ts). Consumes the
 * batch call's output and resolves EACH identified food independently
 * through the SAME authoritative-search / relevance-filter / semantic-gate /
 * trust chain the per-ingredient path already used (external-food.ts,
 * dynamic-food-resolution.ts) — completely unchanged there. This file only
 * decides WHAT search term to feed that chain and how to shape the result,
 * never weakens what the chain itself trusts.
 *
 * Produces ONE ReviewableIngredient per FOOD (not per recipe line) — the
 * SAME shape recipe-ingredient-review.ts's toIngredientReview already
 * expects, so classifyRecipeReview/computeTrustedNutrition/toCandidateShape
 * need no changes at all to handle a line that named more than one food
 * ("só, bors" -> two independent, independently-resolved entries, never
 * silently collapsed to one — see recipe-ingredient-normalization.ts's own
 * schema comment for why `foods` is an array).
 */
export async function resolveRecipeIngredientsBatch(
  prisma: SearchablePrisma,
  normalizationProvider: RecipeIngredientNormalizationProvider,
  input: { title?: string; locale?: string; lines: readonly { index: number; raw: string; parsed: ParsedNaturalFoodQuery }[] },
  dynamic: DynamicResolutionDeps
): Promise<BatchResolvedIngredient[] | null> {
  const normalized = await normalizationProvider.normalize({
    title: input.title,
    locale: input.locale,
    ingredients: input.lines.map((line) => ({
      index: line.index,
      raw: line.raw,
      // Owner-beta checkpoint (2026-09-13): only passed as a hint when the
      // deterministic parser found a quantity for a SINGLE-food line — the
      // model is instructed to defer to it, but this code never trusts the
      // model's OWN quantity output for grams computation either way (see
      // below): the deterministic parse remains the sole source of truth.
      parsedQuantity: line.parsed.quantity,
      parsedUnit: line.parsed.unit
    }))
  });
  if (!normalized) return null;

  const byIndex = new Map(normalized.ingredients.map((line) => [line.index, line]));
  const results: BatchResolvedIngredient[] = [];

  for (const line of input.lines) {
    const normalizedLine = byIndex.get(line.index);
    // Defensive: normalize()'s own index-integrity check already guarantees
    // every given index appears exactly once, but a caller-side lookup miss
    // is still handled safely (treated as a dead end for this line) rather
    // than throwing, since a partial/best-effort result is still useful for
    // the OTHER lines.
    const foods = normalizedLine?.foods ?? [];
    if (!foods.length) {
      results.push({ originalText: line.raw, parsedFoodQuery: line.parsed.foodQuery, resolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false });
      continue;
    }
    // Owner-beta checkpoint (2026-09-13): the deterministic quantity is only
    // ever applied when the line names EXACTLY ONE food — a multi-food line
    // ("só, bors") has no way to safely split one stated quantity across
    // several foods, so each food on such a line gets quantityStatus
    // "unresolved" (requires confirmation / stays out of nutrition) rather
    // than inventing a split. This is a correctness choice, not a
    // limitation to work around.
    const singleFoodLine = foods.length === 1;
    for (const food of foods) {
      const identityQuery = food.canonicalIdentity;
      const localQuery = food.localName ?? food.canonicalIdentity;

      let selectedFood: any = null;
      let resolution: ReviewableIngredient["resolution"] = "unresolved";
      let candidates: ReviewableIngredient["candidates"] = [];
      let externalCandidates: ReviewableIngredient["externalCandidates"];
      let externalCandidatesReason: ReviewableIngredient["externalCandidatesReason"];

      // Local search first (zero-cost, no AI/external call) — tries the
      // original local-language name before the English canonical identity,
      // since the local catalog/aliases are most likely to already carry the
      // local-language term from a prior confirmation (see confirmed-alias.ts).
      for (const query of localQuery === identityQuery ? [localQuery] : [localQuery, identityQuery]) {
        const localCandidates = (await searchFoods(prisma, query, 8)) as any[];
        const top = localCandidates[0];
        if (top && isTrustedLocalMatch(top.match)) { selectedFood = top; resolution = "resolved"; candidates = [top]; break; }
      }

      if (!selectedFood && dynamic) {
        const outcome = await resolveDynamicFoodFromIdentity(dynamic.prisma, { canonicalIdentity: identityQuery, originalIdentity: localQuery }, dynamic);
        if (outcome.status === "resolved") { selectedFood = outcome.food; resolution = "resolved"; candidates = [outcome.food]; }
        else if (outcome.status === "confirmation_required") { resolution = "confirmation_required"; externalCandidates = outcome.candidates; externalCandidatesReason = outcome.reason; }
        else resolution = "unresolved";
      }

      const parsed: ParsedNaturalFoodQuery = singleFoodLine ? line.parsed : { foodQuery: identityQuery };
      const quantity = selectedFood && resolution === "resolved" && singleFoodLine
        ? await resolveQuantity(parsed, selectedFood, new DisabledQuantityEstimationProvider())
        : null;
      const canConfirm = resolution === "resolved" && quantity?.status === "resolved" && !quantity.requiresConfirmation;

      results.push({
        originalText: line.raw,
        parsedQuantity: singleFoodLine ? line.parsed.quantity : undefined,
        parsedUnit: singleFoodLine ? line.parsed.unit : undefined,
        parsedFoodQuery: localQuery,
        preparation: food.preparation ?? line.parsed.preparation,
        resolution,
        selectedFood,
        candidates,
        quantity,
        canConfirm,
        externalCandidates,
        externalCandidatesReason
      });
    }
  }
  return results;
}
