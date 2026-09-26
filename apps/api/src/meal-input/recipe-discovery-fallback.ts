import type { PrismaClient } from "@prisma/client";
import type { Locale } from "@keto-mentor/shared";
import type { DynamicResolutionDeps, InterpretResult } from "./interpret.js";
import { normalizeSearch } from "../catalog/normalize.js";
import { previewRecipeImport, RecipeImportError } from "../recipes/recipe-import.js";
import { createRecipeImportProof } from "../recipes/import-proof.js";
import type { RecipeExtractionProvider } from "../recipes/recipe-extraction-provider.js";
import { RecipeDiscoveryService, type RecipeDiscoveryCandidate, type RecipeDiscoveryPreview } from "../recipes/recipe-discovery.js";
import { domainOf } from "../web-knowledge/web-knowledge-search-provider.js";
import type { SafeFetcherDependencies } from "../recipes/safe-url-fetcher.js";
import { classifyRecipeReview, computeTrustedNutrition, toIngredientReview, localizeResolvedFoodNames, type RecipeIngredientReview, type RecipeReviewSummary, type ReviewableIngredient } from "../recipes/recipe-ingredient-review.js";
import { findReferenceDish, findTrustedLocalRecipe } from "./local-recipe-lookup.js";
import type { ProgressStage } from "./progress-bus.js";
import type { RecipeIngredientNormalizationProvider } from "../recipes/recipe-ingredient-normalization.js";
import type { RecipeQuantityEstimationProvider } from "../recipes/recipe-quantity-estimation.js";

export type RecipeDiscoveryFallbackDeps = {
  discoveryService: RecipeDiscoveryService;
  recipeAiProvider: RecipeExtractionProvider;
  prisma: Parameters<typeof previewRecipeImport>[0] & Pick<PrismaClient, "recipe">;
  userId: string;
  onProgress?: (stage: ProgressStage) => void;
  locale: Locale;
  // Test-only injection point — production never sets this, so
  // previewRecipeImport always runs against the real safe-url-fetcher.
  fetchDependencies?: SafeFetcherDependencies;
  // Owner-beta (2026-09-13): wired by the production route (server.ts) using
  // the exact same deps as ordinary meal-input's dynamic resolution — proven
  // necessary for recipe-derived ingredients to reach trusted USDA/BLS Food
  // identities rather than only the sparse local catalog. Optional (rather
  // than required) so callers without external adapters configured (or test
  // doubles) can omit it; previewRecipeImport treats that identically to an
  // explicit null.
  dynamic?: DynamicResolutionDeps;
  // Owner-beta checkpoint (2026-09-13): the whole-recipe-context batch
  // ingredient-normalization path (see recipe-ingredient-normalization.ts).
  // Optional — previewRecipeImport itself defaults to Disabled (falls back
  // to the existing per-ingredient path) when omitted.
  recipeIngredientNormalizationProvider?: RecipeIngredientNormalizationProvider;
  recipeQuantityEstimationProvider?: RecipeQuantityEstimationProvider;
};

type ExtractedPreview = Awaited<ReturnType<typeof previewRecipeImport>>;

// A hard cap independent of (but currently matching) RecipeDiscoveryService's
// own MAX_CANDIDATES_RETURNED — kept as its own named constant here so this
// file's "how many candidates will I actually FETCH" bound is legible on its
// own without reaching into the discovery service's internals.
const MAX_CANDIDATE_ATTEMPTS = 3;

// Live staging RCA (2026-09-24): "gulyásleves" hit previewRecipeImport's own
// "import_failed" catch-all — which this file used to treat as SYSTEMIC
// (abort the whole search), on the theory that an unclassified internal
// error "says nothing about the one candidate page and would fail
// identically for the next one" (the same reasoning that already, correctly,
// applies to the well-understood page-level codes previewRecipeImport can
// throw: response_too_large, recipe_content_too_large, too_many_ingredients,
// recipe_page_not_found, malformed_json_ld, recipe_ingredients_missing,
// recipe_ai_unavailable, recipe_ai_timeout, recipe_ai_invalid_output,
// unsupported_content_type, blocked_url, invalid_url, dns_failure,
// redirect_limit, fetch_timeout, fetch_failed — none of these say anything
// about the search/provider/database layer, so trying the NEXT
// independently-sourced, independently-SSRF-validated candidate is safe and
// never weakens any trust/security invariant, including the blocked-URL
// codes: the unsafe URL is never fetched at all). The "systemic" assumption
// for the UNCLASSIFIED catch-all specifically turned out to be FALSE in the
// observed case: previewRecipeImport's per-ingredient resolution
// (resolveRecipeIngredientsBatch -> persistCandidate) had a genuine bug (see
// external-food.ts's persistCandidate fix, same date) that could throw for
// ONE specific new ingredient identity — nothing to do with the page,
// network, or database layer, and no reason to expect the NEXT candidate (a
// different recipe, different ingredients, different URL) to fail the same
// way. An unclassified error is therefore no longer trusted as evidence the
// whole operation cannot succeed; every RecipeImportError code, known or
// not, is now candidate-local (see attemptCandidate) — the only thing still
// allowed to abort the entire search is genuine cancellation (isAbortError
// below), since continuing to burn more candidates after the caller has
// already given up cannot possibly help.
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function logCandidateSetOutcome(candidateCount: number) {
  console.log(`recipe_discovery candidates=${candidateCount}`);
}

function logCandidateAttempt(index: number, domain: string, outcome: "unusable" | "fully_resolved" | "reviewable", detail: { fetch: "ok" | "failed"; extraction?: "ok" | "failed"; ingredients?: number; resolved?: number; confirmationRequired?: number; unresolved?: number; reason?: string; url?: string }) {
  console.log(
    `candidate_attempt index=${index} domain=${domain} fetch=${detail.fetch}` +
    (detail.url ? ` url=${detail.url}` : "") +
    (detail.extraction ? ` extraction=${detail.extraction}` : "") +
    (detail.ingredients != null ? ` ingredients=${detail.ingredients}` : "") +
    (detail.resolved != null ? ` resolved=${detail.resolved}` : "") +
    (detail.confirmationRequired != null ? ` confirmation_required=${detail.confirmationRequired}` : "") +
    (detail.unresolved != null ? ` unresolved=${detail.unresolved}` : "") +
    ` outcome=${outcome}` +
    (detail.reason ? ` reason=${detail.reason}` : "")
  );
}

function toCandidateShape(extracted: ExtractedPreview, reviews: readonly RecipeIngredientReview[], summary: RecipeReviewSummary, importProof: string): NonNullable<RecipeDiscoveryPreview["candidate"]> {
  const trusted = computeTrustedNutrition(reviews, extracted.servings);
  return {
    title: extracted.title,
    sourceUrl: extracted.sourceUrl,
    domain: domainOf(extracted.sourceUrl),
    servings: extracted.servings,
    extractionMethod: extracted.extractionMethod,
    ingredientCount: extracted.ingredients.length,
    resolvedIngredientCount: summary.trustedNutritionReadyCount,
    unresolvedIngredientCount: summary.unresolvedCount,
    confirmationRequiredIngredientCount: summary.confirmationRequiredCount,
    ingredientSummary: extracted.ingredients.map((ingredient) => ingredient.originalText).slice(0, 50),
    nutritionPer100g: trusted.macros,
    // A discovered recipe never has a known cooked-yield weight — see
    // recipe-ingredient-review.ts's computeTrustedNutrition — so this is
    // always the raw-ingredient-weight basis, explicitly, whenever non-null.
    nutritionPer100gBasis: trusted.macros != null ? "raw_ingredient_weight" : null,
    nutritionPerServing: trusted.perServing,
    nutritionTotal: trusted.total,
    nutritionCalculable: trusted.calculable,
    ingredientWeightGrams: trusted.weightGrams,
    recipeState: summary.state === "fully_resolved" ? "fully_resolved" : "reviewable",
    ingredients: reviews,
    instructions: extracted.instructions,
    importProof
  };
}

type AttemptResult =
  | { outcome: "fully_resolved"; candidate: NonNullable<RecipeDiscoveryPreview["candidate"]> }
  | { outcome: "reviewable"; candidate: NonNullable<RecipeDiscoveryPreview["candidate"]>; summary: RecipeReviewSummary }
  | { outcome: "unusable"; reason: string };

/**
 * One candidate's full suitability pipeline: safe fetch -> extraction ->
 * (inside previewRecipeImport) ingredient resolution against the REAL
 * trusted Food/dynamic-resolution pipeline -> deterministic review
 * classification (recipe-ingredient-review.ts, owner-beta blocker #6). A
 * candidate is:
 *  - "fully_resolved" when EVERY ingredient reached trusted nutrition —
 *    the caller stops immediately, this is the best possible outcome;
 *  - "reviewable" whenever extraction supplies ingredient rows, even when
 *    none has resolved yet; the source recipe remains useful for review —
 *    the caller remembers it but keeps trying the remaining bounded
 *    candidates in case a fully_resolved one turns up;
 *  - "unusable" for EVERY OTHER failure — a page-level extraction problem,
 *    no ingredient rows, or (2026-09-24 candidate-isolation checkpoint) any
 *    exception at all from this candidate's own post-extraction review/
 *    classification — try the next candidate exactly as before (owner-beta
 *    blocker #5). Nothing about ONE candidate's own failure, of any kind,
 *    is evidence the next, independently-sourced candidate would fail the
 *    same way (see the RCA comment on isAbortError above) — only a genuine
 *    cancellation propagates out of this function instead of returning.
 * A candidate is never discarded merely because some ingredients are
 * confirmation_required (owner-beta blocker #6) — that was the prior
 * checkpoint's over-eager "skip" behavior, now replaced.
 */
async function attemptCandidate(index: number, candidate: RecipeDiscoveryCandidate, deps: RecipeDiscoveryFallbackDeps): Promise<AttemptResult> {
  let extracted: ExtractedPreview;
  try {
    extracted = await previewRecipeImport(deps.prisma, candidate.url, deps.fetchDependencies ?? {}, deps.recipeAiProvider, deps.dynamic ?? null, deps.recipeIngredientNormalizationProvider, deps.recipeQuantityEstimationProvider);
  } catch (error) {
    if (isAbortError(error)) throw error;
    const code = error instanceof RecipeImportError ? error.publicCode : "unexpected_error";
    logCandidateAttempt(index, candidate.domain, "unusable", { fetch: "failed", reason: code, url: candidate.url });
    return { outcome: "unusable", reason: code };
  }

  // 2026-09-24 candidate-isolation checkpoint: post-extraction review/
  // classification used to run unguarded here — a bug in it (or a future
  // one) would propagate straight out of this function, uncaught, aborting
  // every remaining candidate. Its own failure is exactly as candidate-local
  // as an extraction failure above: it says something went wrong turning
  // THIS candidate's own extracted ingredients into a reviewable shape,
  // nothing about whether the next, independently-sourced candidate can
  // succeed.
  try {
    // selectedFood at runtime is always a real Food row (macros included) —
    // ResolvedFood's own TS type is intentionally looser (see interpret.ts),
    // matching the same safe-cast pattern the prior checkpoint's
    // computePreviewNutrition already used here.
    const reviews = extracted.ingredients.map((ingredient) => toIngredientReview(ingredient as unknown as ReviewableIngredient));
    const summary = classifyRecipeReview(reviews);

    if (!reviews.length) {
      logCandidateAttempt(index, candidate.domain, "unusable", {
        fetch: "ok", extraction: "ok", ingredients: reviews.length,
        resolved: summary.resolvedCount, confirmationRequired: summary.confirmationRequiredCount, unresolved: summary.unresolvedCount,
        reason: "no_usable_ingredients",
        url: candidate.url
      });
      return { outcome: "unusable", reason: "no_usable_ingredients" };
    }

    const importProof = createRecipeImportProof(deps.userId, extracted.sourceUrl, extracted.extractionMethod);
    const displayReviews = await localizeResolvedFoodNames(reviews, deps.dynamic?.localizationProvider, deps.locale);
    const shaped = toCandidateShape(extracted, displayReviews, summary, importProof);

    if (summary.state === "fully_resolved") {
      logCandidateAttempt(index, candidate.domain, "fully_resolved", { fetch: "ok", extraction: "ok", ingredients: reviews.length, resolved: summary.resolvedCount, url: candidate.url });
      return { outcome: "fully_resolved", candidate: shaped };
    }

    logCandidateAttempt(index, candidate.domain, "reviewable", {
      fetch: "ok", extraction: "ok", ingredients: reviews.length,
      resolved: summary.resolvedCount, confirmationRequired: summary.confirmationRequiredCount, unresolved: summary.unresolvedCount,
      url: candidate.url
    });
    return { outcome: "reviewable", candidate: shaped, summary };
  } catch (error) {
    if (isAbortError(error)) throw error;
    logCandidateAttempt(index, candidate.domain, "unusable", { fetch: "ok", extraction: "ok", reason: "review_failed", url: candidate.url });
    return { outcome: "unusable", reason: "review_failed" };
  }
}

/**
 * Deterministic "best REVIEWABLE candidate" tiebreak (owner-beta blocker #6)
 * — no AI call, no re-fetch. Fewest dead-end (unresolved) ingredients wins
 * first; ties broken by the most already-trusted ingredients; a further tie
 * keeps whichever was attempted first (stable — candidates are scanned in
 * the bounded set's own relevance order).
 */
function isBetterReviewable(a: RecipeReviewSummary, b: RecipeReviewSummary): boolean {
  if (a.unresolvedCount !== b.unresolvedCount) return a.unresolvedCount < b.unresolvedCount;
  return a.trustedNutritionReadyCount > b.trustedNutritionReadyCount;
}

function isSufficientReviewable(summary: RecipeReviewSummary): boolean {
  const total = summary.resolvedCount + summary.confirmationRequiredCount + summary.unresolvedCount;
  // Loosened 2026-09-25: blocked ingredients can now be fixed by hand in the
  // UI, so a mostly-trusted recipe is worth showing at once instead of
  // spending another ~30 s on the next page (live: 14/18 trusted, 3
  // unresolved still triggered a second full attempt).
  return total > 0 && summary.trustedNutritionReadyCount / total >= 0.7 && summary.unresolvedCount <= 4;
}

type DiscoveryTarget = { location: "result" } | { location: "item"; index: number };

/**
 * The compound/prepared dish is classified, and exactly one of its semantic
 * items represents the DISH'S OWN identity (matched by canonicalName against
 * semantic.dishName — see interpret.ts's hasDishItem/injection logic), and
 * that item's own local+structured-source resolution genuinely found
 * nothing. Two shapes are eligible:
 *
 *  - "result": the classic single-item case ("rakott krumpli" alone) — the
 *    dish item IS the whole result, so the preview attaches at the top
 *    level exactly as before this checkpoint.
 *
 *  - "item": owner-beta blocker (2026-09-12) — "csülökpörkölt krumplival"-
 *    style phrases where the dish is named ALONGSIDE a side/add-on that
 *    resolves independently (here: burgonya/krumpli as its own trusted
 *    Food). Every OTHER item must have already reached some non-"unresolved"
 *    outcome; a second still-unresolved item means the phrase itself is
 *    under-specified/ambiguous ("lecsó" + "2 virsli" with neither
 *    resolving), which stays out of scope exactly as before — recipe
 *    discovery only ever targets a single, unambiguous, genuinely-unresolved
 *    dish identity, never a whole under-specified meal.
 */
function findEligibleDiscoveryTarget(result: InterpretResult): DiscoveryTarget | null {
  if (result.semantic?.kind !== "compound_dish") return null;
  if (result.semantic?.clarificationNeeded) return null;
  const dishName = result.semantic?.dishName?.trim();
  if (!dishName || !result.items?.length) return null;

  const dishNormalized = normalizeSearch(dishName);
  const dishItemEntries = result.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => normalizeSearch(item.semanticItem?.canonicalName ?? "") === dishNormalized);
  if (dishItemEntries.length !== 1) return null;

  const { item: dishItem, index } = dishItemEntries[0];
  // Prepared-dish routing audit (2026-09-19): "ai_estimate_pending" is now
  // ALSO eligible, not just "unresolved". Root cause of all six tested
  // prepared dishes (gulyásleves, paprikás csirke, töltött káposzta, rakott
  // krumpli, túrós muffin, sajtos pogácsa) silently skipping this entire
  // module: the dish item's own deterministic per-item resolution
  // (interpretOne -> resolveDynamicFood) already reached AI-estimation
  // before food-understanding ever got a chance to classify the phrase as a
  // compound dish (see interpret.ts's shouldUseAiFallback/
  // interpretAiUnderstanding for the other half of this fix — the settled
  // estimate is REUSED there, never re-computed, so recipe discovery is now
  // genuinely attempted without spending a second AI-estimate token). A
  // dish item that already has a usable AI estimate is not thrown away by
  // this widening — applyPreview below only ever ADDS `recipeDiscovery`
  // metadata to the item, it never touches foodResolution/selectedFood/
  // aiEstimate, so if recipe discovery fails, the existing AI estimate is
  // completely unaffected and still shown; if it succeeds, the user sees
  // BOTH, and can choose.
  if ((dishItem.foodResolution !== "unresolved" && dishItem.foodResolution !== "ai_estimate_pending") || dishItem.selectedFood) return null;

  const othersAllSettled = result.items.every((item, i) => i === index || item.foodResolution !== "unresolved");
  if (!othersAllSettled) return null;

  return result.items.length === 1 ? { location: "result" } : { location: "item", index };
}

type SiblingOverlapMatch = { itemIndex: number; canonicalName: string };

/**
 * Owner-beta (2026-09-14) — Blocker 4 (double counting): for a multi-item
 * phrase (e.g. "csülökpörkölt krumplival" -> [csülökpörkölt, krumpli]),
 * checks whether a fully_resolved recipe candidate's OWN resolved
 * ingredients are the SAME Food as another, separately-resolved item in the
 * phrase — if so, that sibling must not ALSO independently contribute
 * nutrition once the recipe is accepted (see cases A-E in the owner-beta
 * spec: a discovered recipe may or may not already include a named side).
 *
 * Two tiers, by design — "prefer confirmation over guessing":
 *  - `confirmed`: an ingredient's own trusted resolvedFood.id equals the
 *    sibling's own selectedFood.id — the only fully general (never
 *    hardcoded) identity signal available, since both independently
 *    converge on the SAME underlying Food row for the same real identity
 *    (see findDuplicate's dedup behavior in external-food.ts).
 *  - `possible`: no identity match, but the ingredient's own name (its
 *    resolvedFood.name if trusted, otherwise its own parsed search query)
 *    normalizes to substantially the same text as the sibling's name —
 *    e.g. the recipe's own "krumpli" ingredient failed to reach a trusted
 *    Food (today's sparse catalog reality) but its raw text still clearly
 *    names the same food the sibling independently resolved. Never
 *    auto-decided either way.
 */
export function detectSiblingOverlap(ingredients: readonly RecipeIngredientReview[], items: readonly InterpretResult[], targetIndex: number): { confirmed: SiblingOverlapMatch[]; possible: SiblingOverlapMatch[] } {
  const confirmed: SiblingOverlapMatch[] = [];
  const possible: SiblingOverlapMatch[] = [];
  items.forEach((sibling, index) => {
    if (index === targetIndex) return;
    const siblingFood = sibling.selectedFood;
    const siblingName = siblingFood?.name ?? sibling.semanticItem?.canonicalName ?? sibling.parsed?.foodQuery;
    const siblingNormalized = siblingName ? normalizeSearch(siblingName) : "";
    if (!siblingNormalized) return;

    let confirmedMatch = false;
    let possibleMatch = false;
    for (const ingredient of ingredients) {
      // A source-recipe serving accompaniment is visible context, not part
      // of the base dish. If the user explicitly consumes the same food as
      // a sibling item, it must remain independently countable.
      if (ingredient.excludeFromNutrition || !ingredient.includedInBaseNutrition) continue;
      if (siblingFood && ingredient.resolvedFood && ingredient.resolvedFood.id === siblingFood.id) { confirmedMatch = true; break; }
      const ingredientNormalized = normalizeSearch(ingredient.resolvedFood?.name ?? ingredient.parsedFoodQuery);
      if (ingredientNormalized && (ingredientNormalized === siblingNormalized || ingredientNormalized.includes(siblingNormalized) || siblingNormalized.includes(ingredientNormalized))) possibleMatch = true;
    }
    const canonicalName = sibling.semanticItem?.canonicalName ?? siblingName!;
    if (confirmedMatch) confirmed.push({ itemIndex: index, canonicalName });
    else if (possibleMatch) possible.push({ itemIndex: index, canonicalName });
  });
  return { confirmed, possible };
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
/** Attaches `preview` at the location `findEligibleDiscoveryTarget` identified — the top level for the classic single-item case, or only the one dish item's own slot for a multi-item phrase, leaving every other item byte-identical (no re-shaping, no risk of touching an already-settled sibling like an independently-resolved potato). */
function applyPreview(result: InterpretResult, target: DiscoveryTarget, preview: RecipeDiscoveryPreview): InterpretResult {
  if (target.location === "result") return { ...result, recipeDiscovery: preview };
  const items = result.items!.map((item, i) => (i === target.index ? { ...item, recipeDiscovery: preview } : item));
  return { ...result, items };
}

async function runRecipeDiscovery(dishName: string, deps: RecipeDiscoveryFallbackDeps): Promise<RecipeDiscoveryPreview> {
  const discovery = await deps.discoveryService.discover({ originalPhrase: dishName, locale: deps.locale, userId: deps.userId });

  if (discovery.status !== "found") {
    return {
      status: "unresolved",
      searchAttempted: discovery.status !== "disabled",
      resultCount: "resultCount" in discovery ? discovery.resultCount : 0,
      candidatesAfterRelevanceFilter: "candidatesAfterRelevanceFilter" in discovery ? discovery.candidatesAfterRelevanceFilter : 0,
      candidatesAttempted: 0,
      reason: discovery.status === "no_results" ? "no_relevant_results" : discovery.status === "disabled" ? "disabled" : discovery.status === "rate_limited" ? "rate_limited" : "provider_error"
    };
  }

  logCandidateSetOutcome(discovery.candidates.length);
  const attempted = discovery.candidates.slice(0, MAX_CANDIDATE_ATTEMPTS);
  let attemptsMade = 0;
  // Diagnostic only (2026-09-24 candidate-isolation checkpoint) — no longer
  // controls whether the loop keeps going. An unexpected per-candidate error
  // is still worth surfacing to the user as "systemic_error" (rather than the
  // more generic "no candidate was fully verifiable") when NONE of the
  // bounded attempts panned out, but it never stops a later, independently-
  // sourced candidate from being tried.
  let sawUnexpectedError = false;
  let bestReviewable: { candidate: NonNullable<RecipeDiscoveryPreview["candidate"]>; summary: RecipeReviewSummary } | null = null;
  for (const candidate of attempted) {
    attemptsMade += 1;
    const attempt = await attemptCandidate(attemptsMade, candidate, deps);
    if (attempt.outcome === "fully_resolved") {
      return {
        status: "confirmation_required",
        searchAttempted: true,
        resultCount: discovery.resultCount,
        candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
        candidatesAttempted: attemptsMade,
        candidate: attempt.candidate
      };
    }
    if (attempt.outcome === "reviewable" && (!bestReviewable || isBetterReviewable(attempt.summary, bestReviewable.summary))) {
      bestReviewable = { candidate: attempt.candidate, summary: attempt.summary };
    }
    // The discovery provider already orders relevant pages. Once the current
    // page is strongly reviewable, trying lower-ranked pages repeats the full
    // ingredient AI pipeline without a proportionate correctness benefit.
    if (attempt.outcome === "reviewable" && isSufficientReviewable(attempt.summary)) break;
    // Only the genuinely UNCLASSIFIED reasons count as "unexpected" for
    // diagnostics — "import_failed" (previewRecipeImport's own catch-all for
    // an error it couldn't attribute to a specific known page-level cause)
    // and "unexpected_error"/"review_failed" (this file's own equivalents,
    // see attemptCandidate) — a well-understood, page-specific reason
    // (blocked_url, fetch_timeout, no_usable_ingredients, ...) is exactly the
    // ordinary "this candidate didn't pan out" case and must not be conflated
    // with it.
    if (attempt.outcome === "unusable" && (attempt.reason === "import_failed" || attempt.reason === "unexpected_error" || attempt.reason === "review_failed")) sawUnexpectedError = true;
    // No break here (2026-09-24 candidate-isolation checkpoint, see
    // isAbortError's own doc): a candidate-local failure, of any kind, is
    // never treated as evidence the next candidate can't succeed — continue
    // to the next bounded attempt exactly like the "unusable" cases above
    // already did.
  }

  // No candidate reached fully_resolved within the bounded attempts — surface
  // the best REVIEWABLE one found (owner-beta blocker #6: a legitimate
  // recipe with safe, meaningful USDA/local candidates must never be thrown
  // away merely because human confirmation is required), rather than only
  // ever returning a candidate when every ingredient auto-resolved.
  if (bestReviewable) {
    return {
      status: "confirmation_required",
      searchAttempted: true,
      resultCount: discovery.resultCount,
      candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
      candidatesAttempted: attemptsMade,
      candidate: bestReviewable.candidate
    };
  }

  return {
    status: "unresolved",
    searchAttempted: true,
    resultCount: discovery.resultCount,
    candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
    candidatesAttempted: attemptsMade,
    reason: sawUnexpectedError ? "systemic_error" : "no_fully_resolvable_candidate"
  };
}

export async function attachRecipeDiscoveryFallback(result: InterpretResult, deps: RecipeDiscoveryFallbackDeps): Promise<InterpretResult> {
  const target = findEligibleDiscoveryTarget(result);
  if (!target) return result;
  const dishName = result.semantic?.dishName?.trim();
  if (!dishName) return result;

  // Step B of the prepared-dish resolution order: a trusted local Recipe
  // wins outright, at zero search/fetch/AI cost, before web discovery is
  // ever attempted.
  deps.onProgress?.("local_recipe_search");
  const own = await findTrustedLocalRecipe(deps.prisma, dishName, deps.userId);
  const local = own.status === "not_found" ? await findReferenceDish(deps.prisma, dishName) : own;
  if (local.status === "found") {
    const preview: RecipeDiscoveryPreview = {
      status: "local_match",
      searchAttempted: false,
      resultCount: 0,
      candidatesAfterRelevanceFilter: 0,
      candidatesAttempted: 0,
      localMatch: local
    };
    return applyPreview(result, target, preview);
  }
  if (local.status === "ambiguous") {
    const preview: RecipeDiscoveryPreview = {
      status: "confirmation_required",
      searchAttempted: false,
      resultCount: 0,
      candidatesAfterRelevanceFilter: 0,
      candidatesAttempted: 0,
      reason: "ambiguous_local_matches",
      localAlternatives: local.candidates
    };
    return applyPreview(result, target, preview);
  }

  deps.onProgress?.("recipe_discovery");
  let preview = await runRecipeDiscovery(dishName, deps);
  const portionUnit = result.semantic?.dishUnit;
  const portionCount = result.semantic?.dishQuantity;
  if (preview.candidate && portionCount && (portionUnit === "plate" || portionUnit === "bowl" || portionUnit === "portion")) {
    preview = { ...preview, candidate: { ...preview.candidate, requestedPortion: {
      count: portionCount, unit: portionUnit, provenance: "explicit_household_unit",
      nutrition: preview.candidate.nutritionPerServing ? Object.fromEntries(Object.entries(preview.candidate.nutritionPerServing).map(([key, value]) => [key, value * portionCount])) as typeof preview.candidate.nutritionPerServing : null
    } } };
  }
  let siblingsScoped = result;
  // Blocker 4 (double counting): only meaningful for the multi-item case
  // (a single-item phrase has no siblings), and only once a candidate's own
  // ingredients are actually known (fully_resolved — see attemptCandidate).
  if (target.location === "item" && preview.candidate && result.items) {
    const overlap = detectSiblingOverlap(preview.candidate.ingredients, result.items, target.index);
    if (overlap.confirmed.length || overlap.possible.length) {
      preview = {
        ...preview,
        candidate: {
          ...preview.candidate,
          overlapsWithSiblingItems: overlap.confirmed.length ? overlap.confirmed : undefined,
          possibleOverlapWithSiblingItems: overlap.possible.length ? overlap.possible : undefined
        }
      };
      siblingsScoped = {
        ...result,
        items: result.items.map((item, index) => {
          if (overlap.confirmed.some((m) => m.itemIndex === index)) {
            return { ...item, nutritionEligible: false, canConfirm: true, excludedBySiblingRecipe: { dishItemIndex: target.index, dishName } };
          }
          if (overlap.possible.some((m) => m.itemIndex === index)) {
            return { ...item, ambiguous: true, canConfirm: false };
          }
          return item;
        })
      };
    }
  }
  return applyPreview(siblingsScoped, target, preview);
}
