import type { PrismaClient } from "@prisma/client";
import type { Locale } from "@keto-mentor/shared";
import type { DynamicResolutionDeps, InterpretResult } from "./interpret.js";
import { previewRecipeImport, RecipeImportError } from "../recipes/recipe-import.js";
import { createRecipeImportProof } from "../recipes/import-proof.js";
import type { RecipeExtractionProvider } from "../recipes/recipe-extraction-provider.js";
import { RecipeDiscoveryService, type RecipeDiscoveryCandidate, type RecipeDiscoveryPreview } from "../recipes/recipe-discovery.js";
import { domainOf } from "../web-knowledge/web-knowledge-search-provider.js";
import type { SafeFetcherDependencies } from "../recipes/safe-url-fetcher.js";
import { classifyRecipeReview, computeTrustedNutrition, toIngredientReview, type RecipeIngredientReview, type RecipeReviewSummary, type ReviewableIngredient } from "../recipes/recipe-ingredient-review.js";

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
  const trusted = computeTrustedNutrition(reviews);
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
  let bestReviewable: { candidate: NonNullable<RecipeDiscoveryPreview["candidate"]>; summary: RecipeReviewSummary } | null = null;
  for (const candidate of attempted) {
    attemptsMade += 1;
    const attempt = await attemptCandidate(attemptsMade, candidate, deps);
    if (attempt.outcome === "fully_resolved") {
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
    const preview: RecipeDiscoveryPreview = {
      status: "confirmation_required",
      searchAttempted: true,
      resultCount: discovery.resultCount,
      candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
      candidatesAttempted: attemptsMade,
      candidate: bestReviewable.candidate
    };
    return { ...result, recipeDiscovery: preview };
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
