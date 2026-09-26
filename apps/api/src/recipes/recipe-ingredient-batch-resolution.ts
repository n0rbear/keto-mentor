import { searchFoods, isTrustedLocalMatch, hasIdentityCoverage, localFormMismatch } from "../catalog/food-search.js";
import { cappedPerRequest, RECIPE_FALLBACK_CAP } from "../catalog/usage-budget.js";
import { resolveManyAuthoritativeFoods, type PendingAuthoritativeResolution } from "../catalog/dynamic-food-resolution-batch.js";
import { DisabledRecipeSemanticGateProvider } from "../catalog/semantic-candidate-gate-batch.js";
import { resolveQuantity, type DynamicResolutionDeps } from "../meal-input/interpret.js";
import { DisabledQuantityEstimationProvider } from "../meal-input/quantity-estimation.js";
import type { ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { normalizeSearch } from "../catalog/normalize.js";
import type { RecipeIngredientNormalizationProvider } from "./recipe-ingredient-normalization.js";
import { DisabledRecipeQuantityEstimationProvider, type RecipeQuantityEstimationProvider } from "./recipe-quantity-estimation.js";
import type { ReviewableIngredient } from "./recipe-ingredient-review.js";
import { attemptFallbackChain } from "../catalog/dynamic-food-resolution.js";
import { createAiEstimateProof } from "../catalog/ai-estimate-proof.js";

type SearchablePrisma = Parameters<typeof searchFoods>[0];
export type BatchResolvedIngredient = ReviewableIngredient & { canConfirm: boolean };

// Salt/pepper with no stated amount carry no meaningful nutrition, so they are
// excluded instead of blocking the recipe on a quantity nobody wrote down.
// Live production case (2026-09-25): "só ízlés szerint" reached this check as
// a Hungarian or "... to taste" identity, missed the English-only set, and
// left the whole discovered recipe waiting on a salt confirmation. Matched in
// HU/DE/EN, with "to taste" phrasing stripped, against the normalized
// identity and the line's own parsed food words.
const UNQUANTIFIED_SEASONING_IDENTITIES = new Set([
  "salt", "pepper", "black pepper", "white pepper", "ground pepper", "ground black pepper", "salt and pepper", "salt pepper", "sea salt", "table salt",
  "so", "bors", "feketebors", "fekete bors", "orolt bors", "orolt feketebors", "orolt fekete bors", "so es bors", "so bors", "tengeri so",
  "salz", "pfeffer", "schwarzer pfeffer", "salz und pfeffer", "salz pfeffer", "meersalz"
]);
const TO_TASTE_PHRASES = /\b(?:izles szerint|tetszes szerint|igeny szerint|to taste|as needed|nach geschmack|nach belieben|optional|opcionalis)\b/g;
const TO_TASTE_LINE = /\b(?:izles szerint|tetszes szerint|igeny szerint|to taste|nach geschmack|nach belieben)\b/;
const seasoningKey = (value: string) => normalizeSearch(value).replace(/[(),]/g, " ").replace(TO_TASTE_PHRASES, " ").replace(/\s+/g, " ").trim();
// The line's own food words only count for a single-food line: on "só, 500 g
// hús" the line-level foodQuery is "só", which must never mark the meat as salt.
const isUnquantifiedSeasoning = (parsed: ParsedNaturalFoodQuery, identity: string, singleFoodLine: boolean) =>
  parsed.quantity == null && [identity, singleFoodLine ? parsed.foodQuery : undefined].some((value) => !!value && UNQUANTIFIED_SEASONING_IDENTITIES.has(seasoningKey(value)));
function explicitMass(parsed: ParsedNaturalFoodQuery) {
  if (parsed.quantity == null) return null;
  if (parsed.unit === "g") return parsed.quantity;
  if (parsed.unit === "kg") return parsed.quantity * 1_000;
  return null;
}

function maxEstimatedGrams(item: Parameters<RecipeQuantityEstimationProvider["estimate"]>[0]["items"][number]) {
  const count = item.quantityUpper ?? item.quantity;
  // to_taste: the whole recipe's "ízlés szerint" amount, which is small by
  // nature; a hard cap keeps a bad estimate from dominating the dish.
  const perUnit: Partial<Record<string, number>> = { pinch: 25, tsp: 100, tbsp: 250, clove: 250, bunch: 5_000, stalk: 10_000, piece: 10_000, head: 10_000, cup: 5_000, handful: 2_000, to_taste: 60 };
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

  // Owner-beta checkpoint (2026-09-15): cold-path performance. Restructured
  // from one sequential pass (each ingredient's dynamic resolution — search +
  // semantic gate + localization — awaited one at a time) into three passes:
  // (1) local search + per-food fast-path decision, deferring anything that
  // needs authoritative resolution into a `pending` list instead of resolving
  // it immediately; (2) ONE call to resolveManyAuthoritativeFoods, which
  // itself runs external search with bounded concurrency and batches
  // semantic-gate + localization across EVERY pending ingredient at once
  // (see catalog/dynamic-food-resolution-batch.ts); (3) finalize quantity for
  // every food now that its identity is known, exactly as before. Every local
  // search/fast-path/quantity computation below is byte-for-byte identical to
  // the previous single-pass version — only WHEN dynamic resolution happens
  // (batched afterward, not inline) changed.
  type Draft = {
    resultIndex: number; line: { index: number; raw: string; parsed: ParsedNaturalFoodQuery };
    food: { canonicalIdentity: string; preparation?: string }; singleFoodLine: boolean; identityQuery: string;
    selectedFood: any; resolution: ReviewableIngredient["resolution"]; candidates: ReviewableIngredient["candidates"];
    externalCandidates?: ReviewableIngredient["externalCandidates"]; externalCandidatesReason?: ReviewableIngredient["externalCandidatesReason"];
    aiEstimate?: ReviewableIngredient["aiEstimate"];
  };
  const drafts: Draft[] = [];
  const pending: PendingAuthoritativeResolution[] = [];

  for (const line of input.lines) {
    // One line naming the same food twice ("őrölt kömény+egész kömény",
    // live case 2026-09-25) must not become two identical ingredients: the
    // normalizer returns both with one canonical identity, so keep the first.
    const foods = (byIndex.get(line.index)?.foods ?? []).filter((food, index, all) =>
      all.findIndex((other) => normalizeSearch(other.canonicalIdentity) === normalizeSearch(food.canonicalIdentity)) === index);
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

      // A validated dynamically-created regional/branded Food is persisted
      // under its specific source phrase (for example pritaminpaprika-krém),
      // while canonicalIdentity may intentionally be broader (paprika paste).
      // Search the parser's quantity-free source identity first; quantity is
      // still never part of catalog search. Fall back to canonical identity.
      const sourceIdentity = line.parsed.foodQuery.trim();
      const sourceCandidates = sourceIdentity && sourceIdentity !== identityQuery ? (await searchFoods(prisma, sourceIdentity, 8)) as any[] : [];
      const canonicalCandidates = (await searchFoods(prisma, identityQuery, 20, { rawIngredient: line.raw })) as any[];
      // Canonical normalization is the stronger identity evidence. A broad
      // source phrase ("mustár", or a split "só, bors" line) must not let
      // an exact lexical hit for a DIFFERENT canonical food outrank it.
      const trustedCanonical = canonicalCandidates.filter((candidate) => isTrustedLocalMatch(candidate.match));
      const explicitPreparedState = !!(food.preparation ?? line.parsed.preparation) || /\b(cooked|boiled|roasted|fried|grilled|főtt|sült|párolt|gekocht|gebraten)\b/i.test(line.raw);
      // Owner-beta checkpoint (2026-09-15): a trusted local candidate must
      // not win merely because it is the only (or first) thing already
      // cached — see localFormMismatch. Live, reproduced case: this
      // catalog's only cached "tomato" Food was "Tomatoes, red, ripe,
      // cooked" (a stale dynamic_search alias from an earlier session);
      // every future "1 db paradicsom" — an ordinary fresh tomato, no
      // cooked wording at all — silently kept reusing it. A form-mismatched
      // trusted candidate is excluded from the fast path entirely, falling
      // through to full authoritative search + semantic gate instead. Only
      // evaluated when a REAL (non-disabled) semantic gate is configured —
      // without one, excluding a mismatched local candidate has nowhere
      // safe to fall through to, so the pre-existing (unfiltered) behavior
      // applies unchanged.
      const hasRealSemanticGate = !!dynamic?.semanticCandidateGateProvider && dynamic.semanticCandidateGateProvider.id !== "disabled";
      const formEvidence = { rawIngredient: line.raw };
      const formCompatible = (candidate: any) => !hasRealSemanticGate || !localFormMismatch(candidate.originalName ?? candidate.name, formEvidence, candidate.match);
      const formCompatibleCanonical = trustedCanonical.filter(formCompatible);
      const canonicalTop = !explicitPreparedState
        // "roh" is BLS's own raw marker. Recognizing only English "raw" made a
        // trusted USDA "..., raw" row ALWAYS beat a BLS "... roh" row even
        // when BLS ranked first (searchFoods' BLS tie-break), silently
        // bypassing the European-source preference in this one path.
        ? formCompatibleCanonical.find((candidate) => /\b(raw|roh)\b/i.test(candidate.originalName ?? candidate.name) && !/\b(cooked|boiled|roasted|fried|gekocht|gebraten)\b/i.test(candidate.originalName ?? candidate.name)) ?? formCompatibleCanonical[0]
        : formCompatibleCanonical[0];
      const top = canonicalTop
        ?? sourceCandidates.find((candidate) => isTrustedLocalMatch(candidate.match) && formCompatible(candidate) && (
          hasIdentityCoverage(identityQuery, candidate)
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

      // Reserve this food's final slot in `results` NOW, at the same
      // position it would have occupied in the original single-pass order
      // (interleaved with "no foods" lines, which push directly) — patched
      // in place once its identity/quantity are fully known below.
      const resultIndex = results.length;
      results.push(undefined as any);
      const draft: Draft = { resultIndex, line, food, singleFoodLine, identityQuery, selectedFood, resolution, candidates };
      drafts.push(draft);
      if (!selectedFood && dynamic) {
        pending.push({
          id: String(resultIndex), canonicalIdentity: identityQuery, originalIdentity: identityQuery, rawIngredient: line.raw,
          // The user's own word for the round-trip check: the normalizer's
          // local name, or the line's food phrase when it names one food.
          sourceIdentity: (food as { localName?: string }).localName ?? (singleFoodLine ? line.parsed.foodQuery : undefined),
          preparation: food.preparation ?? line.parsed.preparation ?? "as supplied; no pre-cooked state stated",
          sourceQuantity: line.parsed.quantity, sourceUnit: line.parsed.unit
        });
      }
    }
  }

  if (pending.length && dynamic) {
    const outcomes = await resolveManyAuthoritativeFoods(dynamic.prisma, pending, {
      adapters: dynamic.adapters, rateLimiter: dynamic.rateLimiter, userId: dynamic.userId,
      locale: dynamic.locale, foodLocale: dynamic.foodLocale, localizationProvider: dynamic.localizationProvider,
      semanticGateProvider: dynamic.recipeSemanticGateProvider ?? new DisabledRecipeSemanticGateProvider(),
      // Unified food-resolution engine (2026-09-23): the SAME single-item
      // gate and semantic-recovery provider the direct-entry path uses —
      // see BatchAuthoritativeDeps's own doc for why the single-item-shaped
      // gate is needed here (only for the bounded recovery retries, never
      // for the main batched decision above, which keeps using the batch gate).
      semanticCandidateGateProvider: dynamic.semanticCandidateGateProvider, semanticRecoveryProvider: dynamic.semanticRecoveryProvider,
      recipeTitle: input.title, recipeContext: input.context
    });
    // Each draft's fallback (web evidence / AI estimate) is independent, so
    // they run in parallel instead of one after another (live logs,
    // 2026-09-25: a single recipe took ~44 s, largely sequential waits).
    // One recipe never spends more than RECIPE_FALLBACK_CAP web lookups or
    // AI estimates, whatever the user's remaining hourly/daily budget.
    const fallbackDeps = {
      ...dynamic,
      webEvidenceFallback: dynamic.webEvidenceFallback && { ...dynamic.webEvidenceFallback, rateLimiter: cappedPerRequest(dynamic.webEvidenceFallback.rateLimiter, RECIPE_FALLBACK_CAP) },
      aiEstimation: dynamic.aiEstimation && { ...dynamic.aiEstimation, rateLimiter: cappedPerRequest(dynamic.aiEstimation.rateLimiter, RECIPE_FALLBACK_CAP) }
    };
    await Promise.all(drafts.map(async (draft) => {
      const outcome = outcomes.get(String(draft.resultIndex));
      if (!outcome) return; // this draft resolved locally — never sent to the batch resolver
      if (outcome.status === "resolved") { draft.selectedFood = outcome.food; draft.resolution = "resolved"; draft.candidates = [outcome.food]; }
      else if (outcome.status === "confirmation_required") { draft.resolution = "confirmation_required"; draft.externalCandidates = outcome.candidates; draft.externalCandidatesReason = outcome.reason; }
      else if (outcome.status === "unresolved" && ["not_found", "invalid_external_data", "external_unavailable", "convergence_rejected"].includes(outcome.reason)
        && (dynamic.webEvidenceFallback || dynamic.aiEstimation)) {
        // Authoritative batch already exhausted this identity. Reuse the
        // shared last-resort chain without repeating structured lookups.
        const fallback = await attemptFallbackChain(dynamic.prisma, draft.identityQuery, draft.identityQuery,
          "normalized_identity", fallbackDeps, dynamic.locale, { rawIngredient: draft.line.raw, recipeTitle: input.title },
          outcome.reason as "not_found" | "invalid_external_data" | "external_unavailable" | "convergence_rejected", {});
        if (fallback.status === "resolved") {
          draft.selectedFood = fallback.food; draft.resolution = "resolved"; draft.candidates = [fallback.food];
        } else if (fallback.status === "ai_estimate_pending") {
          draft.aiEstimate = { ...fallback.estimate, requestedIdentity: fallback.requestedIdentity, canonicalIdentity: fallback.canonicalIdentity,
            proof: createAiEstimateProof(dynamic.userId, { ...fallback.estimate, requestedIdentity: fallback.requestedIdentity }) };
        }
      }
    }));
  }

  for (const draft of drafts) {
    const { line, food, singleFoodLine, identityQuery, selectedFood, resolution, candidates, externalCandidates, externalCandidatesReason } = draft;
    const mass = singleFoodLine ? explicitMass(line.parsed) : null;
    let quantity: ReviewableIngredient["quantity"] = mass == null ? null : { status: "resolved", grams: mass };
    let quantitySource: ReviewableIngredient["quantitySource"] = mass == null ? "unknown" : "explicit";
    let excludeFromNutrition = false;
    if (isUnquantifiedSeasoning(line.parsed, identityQuery, singleFoodLine)) {
      quantitySource = "unquantified_seasoning";
      excludeFromNutrition = true;
    } else if (singleFoodLine && mass == null && line.parsed.quantity != null && selectedFood && resolution === "resolved") {
      const authoritative = await resolveQuantity(line.parsed, selectedFood, new DisabledQuantityEstimationProvider());
      if (authoritative?.status === "resolved" && !authoritative.requiresConfirmation) {
        quantity = authoritative;
        quantitySource = authoritative.method === "authoritative" ? "authoritative_conversion" : "explicit";
      }
    }

    // Live case (2026-09-25, cookpad "Húsos káposzta"): "ízlés szerint édes
    // fűszerpaprika", "... kömény" had a resolved food but no amount, and
    // nothing ever estimated one, so each blocked the recipe. A "to taste"
    // line (not already excluded as salt/pepper) now asks the estimator for
    // the typical total amount used in this recipe.
    const toTaste = !quantity && !excludeFromNutrition && line.parsed.quantity == null && TO_TASTE_LINE.test(normalizeSearch(line.raw));
    if (toTaste) estimationItems.push({ index: draft.resultIndex, sourceIndex: line.index, raw: line.raw, identity: identityQuery, preparation: food.preparation ?? line.parsed.preparation, quantity: 1, unit: "to_taste" });
    else if (singleFoodLine && !quantity && line.parsed.quantity != null && line.parsed.unit) estimationItems.push({ index: draft.resultIndex, sourceIndex: line.index, raw: line.raw, identity: identityQuery, preparation: food.preparation ?? line.parsed.preparation, quantity: line.parsed.quantity, quantityUpper: line.parsed.quantityUpper, unit: line.parsed.unit });

    results[draft.resultIndex] = {
      originalText: line.raw, parsedQuantity: singleFoodLine ? line.parsed.quantity : undefined, parsedUnit: singleFoodLine ? line.parsed.unit : undefined,
      parsedFoodQuery: identityQuery, preparation: food.preparation ?? line.parsed.preparation,
      resolution, selectedFood, candidates, quantity, quantitySource, aiEstimate: draft.aiEstimate,
      quantityGrams: quantity?.status === "resolved" ? quantity.grams : undefined,
      quantityRange: singleFoodLine && line.parsed.quantityUpper != null ? { min: line.parsed.quantity!, max: line.parsed.quantityUpper, unit: line.parsed.unit } : undefined,
      excludeFromNutrition, canConfirm: resolution === "resolved" && (!!quantity || excludeFromNutrition), externalCandidates, externalCandidatesReason
    };
  }

  if (estimationItems.length) {
    const estimationInput = { title: input.title, locale: input.locale, ingredientLines: input.lines.map((line) => line.raw), items: estimationItems };
    const estimated = await quantityProvider.estimate(estimationInput);
    const firstEstimates = estimated?.estimates ?? [];
    const returnedIndexes = new Set(firstEstimates.map((estimate) => estimate.index));
    const missingItems = estimationItems.filter((item) => !returnedIndexes.has(item.index));
    // One bounded retry only for omitted indexes. Malformed/unsafe values are
    // still rejected below and a second omission remains unresolved.
    const retry = missingItems.length ? await quantityProvider.estimate({ ...estimationInput, items: missingItems }) : null;
    for (const estimate of [...firstEstimates, ...(retry?.estimates ?? [])]) {
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
