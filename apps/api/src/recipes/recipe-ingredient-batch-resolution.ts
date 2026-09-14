import { searchFoods, isTrustedLocalMatch, foodNameRepresentations, hasSemanticCoverage } from "../catalog/food-search.js";
import { resolveDynamicFoodFromIdentity } from "../catalog/dynamic-food-resolution.js";
import { resolveQuantity, type DynamicResolutionDeps } from "../meal-input/interpret.js";
import { DisabledQuantityEstimationProvider } from "../meal-input/quantity-estimation.js";
import type { ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";
import type { RecipeIngredientNormalizationProvider } from "./recipe-ingredient-normalization.js";
import { DisabledRecipeQuantityEstimationProvider, type RecipeQuantityEstimationProvider } from "./recipe-quantity-estimation.js";
import type { ReviewableIngredient } from "./recipe-ingredient-review.js";

type SearchablePrisma = Parameters<typeof searchFoods>[0];
export type BatchResolvedIngredient = ReviewableIngredient & { canConfirm: boolean };

const UNQUANTIFIED_SEASONING_IDENTITIES = new Set(["salt", "pepper", "black pepper"]);
const isUnquantifiedSeasoning = (parsed: ParsedNaturalFoodQuery, identity: string) => parsed.quantity == null && UNQUANTIFIED_SEASONING_IDENTITIES.has(identity.trim().toLowerCase());
function explicitMass(parsed: ParsedNaturalFoodQuery) {
  if (parsed.quantity == null) return null;
  if (parsed.unit === "g") return parsed.quantity;
  if (parsed.unit === "kg") return parsed.quantity * 1_000;
  return null;
}

function maxEstimatedGrams(item: Parameters<RecipeQuantityEstimationProvider["estimate"]>[0]["items"][number]) {
  const count = item.quantityUpper ?? item.quantity;
  const perUnit: Partial<Record<string, number>> = { pinch: 25, tsp: 100, tbsp: 250, clove: 250, bunch: 5_000, stalk: 10_000, piece: 10_000, head: 10_000, cup: 5_000, handful: 2_000 };
  return Math.min(50_000, count * (perUnit[item.unit] ?? 50_000));
}

/** Identity and quantity use independent tracks. Catalog lookup receives canonicalIdentity only. */
export async function resolveRecipeIngredientsBatch(
  prisma: SearchablePrisma,
  normalizationProvider: RecipeIngredientNormalizationProvider,
  input: { title?: string; context?: string; locale?: string; lines: readonly { index: number; raw: string; parsed: ParsedNaturalFoodQuery }[] },
  dynamic: DynamicResolutionDeps,
  quantityProvider: RecipeQuantityEstimationProvider = new DisabledRecipeQuantityEstimationProvider()
): Promise<BatchResolvedIngredient[] | null> {
  const normalized = await normalizationProvider.normalize({ title: input.title, locale: input.locale, ingredients: input.lines.map((line) => ({ index: line.index, raw: line.raw, parsedQuantity: line.parsed.quantity, parsedUnit: line.parsed.unit })) });
  if (!normalized) return null;

  const byIndex = new Map(normalized.ingredients.map((line) => [line.index, line]));
  const results: BatchResolvedIngredient[] = [];
  const estimationItems: Parameters<RecipeQuantityEstimationProvider["estimate"]>[0]["items"][number][] = [];

  for (const line of input.lines) {
    const foods = byIndex.get(line.index)?.foods ?? [];
    if (!foods.length) {
      const mass = explicitMass(line.parsed);
      results.push({ originalText: line.raw, parsedQuantity: line.parsed.quantity, parsedUnit: line.parsed.unit, parsedFoodQuery: line.parsed.foodQuery, resolution: "unresolved", selectedFood: null, candidates: [], quantity: mass == null ? null : { status: "resolved", grams: mass }, quantitySource: mass == null ? "unknown" : "explicit", quantityGrams: mass ?? undefined, canConfirm: false });
      continue;
    }

    const singleFoodLine = foods.length === 1;
    for (const food of foods) {
      const identityQuery = food.canonicalIdentity;
      let selectedFood: any = null;
      let resolution: ReviewableIngredient["resolution"] = "unresolved";
      let candidates: ReviewableIngredient["candidates"] = [];
      let externalCandidates: ReviewableIngredient["externalCandidates"];
      let externalCandidatesReason: ReviewableIngredient["externalCandidatesReason"];

      // A validated dynamically-created regional/branded Food is persisted
      // under its specific source phrase (for example pritaminpaprika-krém),
      // while canonicalIdentity may intentionally be broader (paprika paste).
      // Search the parser's quantity-free source identity first; quantity is
      // still never part of catalog search. Fall back to canonical identity.
      const sourceIdentity = line.parsed.foodQuery.trim();
      const sourceCandidates = sourceIdentity && sourceIdentity !== identityQuery ? (await searchFoods(prisma, sourceIdentity, 8)) as any[] : [];
      const canonicalCandidates = (await searchFoods(prisma, identityQuery, 8)) as any[];
      const localCandidates = [...canonicalCandidates, ...sourceCandidates.filter((candidate) => !canonicalCandidates.some((canonical) => canonical.id === candidate.id))];
      // Canonical normalization is the stronger identity evidence. A broad
      // source phrase ("mustár", or a split "só, bors" line) must not let
      // an exact lexical hit for a DIFFERENT canonical food outrank it.
      const trustedCanonical = canonicalCandidates.filter((candidate) => isTrustedLocalMatch(candidate.match));
      const explicitPreparedState = !!(food.preparation ?? line.parsed.preparation) || /\b(cooked|boiled|roasted|fried|grilled|főtt|sült|párolt|gekocht|gebraten)\b/i.test(line.raw);
      const canonicalTop = !explicitPreparedState
        ? trustedCanonical.find((candidate) => /\braw\b/i.test(candidate.originalName ?? candidate.name) && !/\b(cooked|boiled|roasted|fried)\b/i.test(candidate.originalName ?? candidate.name)) ?? trustedCanonical[0]
        : trustedCanonical[0];
      const top = canonicalTop
        ?? sourceCandidates.find((candidate) => isTrustedLocalMatch(candidate.match) && (
          hasSemanticCoverage(identityQuery, foodNameRepresentations(candidate))
          // A persisted manufacturer/national-database Food reached this
          // exact strong source-phrase alias only after authoritative
          // identity validation. Reuse that learned alias without forcing
          // its brand name to lexically contain a broader English canonical
          // concept (e.g. Erős Pista vs "hot pepper paste"). USDA lexical
          // shortcuts stay excluded, which is what prevents "mustár" from
          // selecting mustard greens or "só, bors" from selecting salt twice.
          || candidate.source !== "usda_fdc"
        ));
      if (top) { selectedFood = top; resolution = "resolved"; candidates = [top]; }
      if (!selectedFood && dynamic) {
        const outcome = await resolveDynamicFoodFromIdentity(dynamic.prisma, { canonicalIdentity: identityQuery, originalIdentity: identityQuery, rawIngredient: line.raw, recipeTitle: input.title, recipeContext: input.context, preparation: food.preparation ?? line.parsed.preparation ?? "as supplied; no pre-cooked state stated", sourceQuantity: line.parsed.quantity, sourceUnit: line.parsed.unit }, dynamic);
        if (outcome.status === "resolved") { selectedFood = outcome.food; resolution = "resolved"; candidates = [outcome.food]; }
        else if (outcome.status === "confirmation_required") { resolution = "confirmation_required"; externalCandidates = outcome.candidates; externalCandidatesReason = outcome.reason; }
      }

      const mass = singleFoodLine ? explicitMass(line.parsed) : null;
      let quantity: ReviewableIngredient["quantity"] = mass == null ? null : { status: "resolved", grams: mass };
      let quantitySource: ReviewableIngredient["quantitySource"] = mass == null ? "unknown" : "explicit";
      let excludeFromNutrition = false;
      if (isUnquantifiedSeasoning(line.parsed, identityQuery)) {
        quantitySource = "unquantified_seasoning";
        excludeFromNutrition = true;
      } else if (singleFoodLine && mass == null && line.parsed.quantity != null && selectedFood && resolution === "resolved") {
        const authoritative = await resolveQuantity(line.parsed, selectedFood, new DisabledQuantityEstimationProvider());
        if (authoritative?.status === "resolved" && !authoritative.requiresConfirmation) {
          quantity = authoritative;
          quantitySource = authoritative.method === "authoritative" ? "authoritative_conversion" : "explicit";
        }
      }

      const resultIndex = results.length;
      if (singleFoodLine && !quantity && line.parsed.quantity != null && line.parsed.unit) estimationItems.push({ index: resultIndex, sourceIndex: line.index, raw: line.raw, identity: identityQuery, preparation: food.preparation ?? line.parsed.preparation, quantity: line.parsed.quantity, quantityUpper: line.parsed.quantityUpper, unit: line.parsed.unit });

      results.push({
        originalText: line.raw, parsedQuantity: singleFoodLine ? line.parsed.quantity : undefined, parsedUnit: singleFoodLine ? line.parsed.unit : undefined,
        parsedFoodQuery: identityQuery, preparation: food.preparation ?? line.parsed.preparation,
        resolution, selectedFood, candidates, quantity, quantitySource,
        quantityGrams: quantity?.status === "resolved" ? quantity.grams : undefined,
        quantityRange: singleFoodLine && line.parsed.quantityUpper != null ? { min: line.parsed.quantity!, max: line.parsed.quantityUpper, unit: line.parsed.unit } : undefined,
        excludeFromNutrition, canConfirm: resolution === "resolved" && (!!quantity || excludeFromNutrition), externalCandidates, externalCandidatesReason
      });
    }
  }

  if (estimationItems.length) {
    const estimated = await quantityProvider.estimate({ title: input.title, locale: input.locale, ingredientLines: input.lines.map((line) => line.raw), items: estimationItems });
    for (const estimate of estimated?.estimates ?? []) {
      const target = results[estimate.index];
      const source = estimationItems.find((item) => item.index === estimate.index);
      if (!target || !source || !Number.isFinite(estimate.grams) || estimate.grams <= 0 || estimate.grams > maxEstimatedGrams(source)) continue;
      target.quantity = { status: "resolved", grams: estimate.grams };
      target.quantityGrams = estimate.grams;
      target.quantitySource = "estimated";
      target.quantityConfidence = estimate.confidence;
      target.canConfirm = target.resolution === "resolved";
    }
  }
  return results;
}
