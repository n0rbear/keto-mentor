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
import { classifyRecipeReview, computeTrustedNutrition, toIngredientReview, type RecipeIngredientReview, type RecipeReviewSummary, type ReviewableIngredient } from "../recipes/recipe-ingredient-review.js";
import { findTrustedLocalRecipe } from "./local-recipe-lookup.js";
import type { ProgressStage } from "./progress-bus.js";

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
};

type ExtractedPreview = Awaited<ReturnType<typeof previewRecipeImport>>;

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

function logCandidateAttempt(index: number, domain: string, outcome: "unusable" | "fully_resolved" | "reviewable" | "systemic_error", detail: { fetch: "ok" | "failed"; extraction?: "ok" | "failed"; ingredients?: number; resolved?: number; confirmationRequired?: number; unresolved?: number; reason?: string; url?: string }) {
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
    nutritionPerServing: trusted.perServing,
    nutritionCalculable: trusted.calculable,
    ingredientWeightGrams: trusted.weightGrams,
    recipeState: summary.state === "fully_resolved" ? "fully_resolved" : "reviewable",
    ingredients: reviews,
    importProof
  };
}

type AttemptResult =
  | { outcome: "fully_resolved"; candidate: NonNullable<RecipeDiscoveryPreview["candidate"]> }
  | { outcome: "reviewable"; candidate: NonNullable<RecipeDiscoveryPreview["candidate"]>; summary: RecipeReviewSummary }
  | { outcome: "unusable" }
  | { outcome: "systemic_error" };

/**
 * One candidate's full suitability pipeline: safe fetch -> extraction ->
 * (inside previewRecipeImport) ingredient resolution against the REAL
 * trusted Food/dynamic-resolution pipeline -> deterministic review
 * classification (recipe-ingredient-review.ts, owner-beta blocker #6). A
 * candidate is:
 *  - "fully_resolved" when EVERY ingredient reached trusted nutrition —
 *    the caller stops immediately, this is the best possible outcome;
 *  - "reviewable" when extraction succeeded and at least one ingredient has
 *    something a human can act on (resolved or confirmation_required) —
 *    the caller remembers it but keeps trying the remaining bounded
 *    candidates in case a fully_resolved one turns up;
 *  - "unusable" when extraction failed for a page-level reason, or every
 *    single ingredient is a dead end — try the next candidate exactly as
 *    before (owner-beta blocker #5).
 * A candidate is never discarded merely because some ingredients are
 * confirmation_required (owner-beta blocker #6) — that was the prior
 * checkpoint's over-eager "skip" behavior, now replaced.
 */
async function attemptCandidate(index: number, candidate: RecipeDiscoveryCandidate, deps: RecipeDiscoveryFallbackDeps): Promise<AttemptResult> {
  let extracted: ExtractedPreview;
  try {
    extracted = await previewRecipeImport(deps.prisma, candidate.url, deps.fetchDependencies ?? {}, deps.recipeAiProvider, deps.dynamic ?? null);
  } catch (error) {
    const code = error instanceof RecipeImportError ? error.publicCode : "unknown";
    if (error instanceof RecipeImportError && RECOVERABLE_CANDIDATE_CODES.has(code)) {
      logCandidateAttempt(index, candidate.domain, "unusable", { fetch: "failed", reason: code, url: candidate.url });
      return { outcome: "unusable" };
    }
    logCandidateAttempt(index, candidate.domain, "systemic_error", { fetch: "failed", reason: code, url: candidate.url });
    return { outcome: "systemic_error" };
  }

  // selectedFood at runtime is always a real Food row (macros included) —
  // ResolvedFood's own TS type is intentionally looser (see interpret.ts),
  // matching the same safe-cast pattern the prior checkpoint's
  // computePreviewNutrition already used here.
  const reviews = extracted.ingredients.map((ingredient) => toIngredientReview(ingredient as unknown as ReviewableIngredient));
  const summary = classifyRecipeReview(reviews);

  if (summary.state === "unusable") {
    logCandidateAttempt(index, candidate.domain, "unusable", {
      fetch: "ok", extraction: "ok", ingredients: reviews.length,
      resolved: summary.resolvedCount, confirmationRequired: summary.confirmationRequiredCount, unresolved: summary.unresolvedCount,
      reason: !reviews.length ? "no_usable_ingredients" : "no_meaningful_candidates",
      url: candidate.url
    });
    return { outcome: "unusable" };
  }

  const importProof = createRecipeImportProof(deps.userId, extracted.sourceUrl, extracted.extractionMethod);
  const shaped = toCandidateShape(extracted, reviews, summary, importProof);

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
  if (dishItem.foodResolution !== "unresolved" || dishItem.selectedFood) return null;

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
function detectSiblingOverlap(ingredients: readonly RecipeIngredientReview[], items: readonly InterpretResult[], targetIndex: number): { confirmed: SiblingOverlapMatch[]; possible: SiblingOverlapMatch[] } {
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
  let sawSystemicError = false;
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
    if (attempt.outcome === "systemic_error") { sawSystemicError = true; break; } // stop trying — see RECOVERABLE_CANDIDATE_CODES comment above
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
    reason: sawSystemicError ? "systemic_error" : "no_fully_resolvable_candidate"
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
  const local = await findTrustedLocalRecipe(deps.prisma, dishName, deps.userId);
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
