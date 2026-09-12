import type { Locale } from "@keto-mentor/shared";
import { normalizeSearch } from "../catalog/normalize.js";
import { isRelevantExternalCandidate } from "../catalog/external-food.js";
import type { WebKnowledgeSearchProvider } from "../web-knowledge/web-knowledge-search-provider.js";
import type { NegativeSearchCache } from "../web-knowledge/negative-search-cache.js";
import type { WebKnowledgeSearchRateLimiter } from "../web-knowledge/web-knowledge-rate-limit.js";
import type { MacroTotals } from "../nutrition-core.js";
import type { RecipeIngredientReview } from "./recipe-ingredient-review.js";

/**
 * The bounded, safe-to-serialize shape attached to a meal-input result when
 * web recipe discovery ran. Deliberately carries only what a client needs to
 * render "we found a recipe that may represent this dish" and to confirm it
 * via the EXISTING recipe-import persistence flow (POST /recipes with
 * importProof) — never arbitrary webpage HTML/text, never raw ingredient
 * objects with forged nutrition.
 */
export type RecipeDiscoveryPreview = {
  // "local_match": a trusted local Recipe (the user's own, already-saved/
  // imported) matched the dish exactly — see meal-input/local-recipe-
  // lookup.ts. Wins outright over web discovery; carries `localMatch`, never
  // `candidate`.
  status: "confirmation_required" | "unresolved" | "local_match";
  searchAttempted: boolean;
  resultCount: number;
  candidatesAfterRelevanceFilter: number;
  // How many of the bounded candidates were actually fetched/attempted
  // before either selecting one or exhausting the set.
  candidatesAttempted: number;
  reason?: "disabled" | "rate_limited" | "provider_error" | "no_relevant_results" | "no_fully_resolvable_candidate" | "systemic_error" | "ambiguous_local_matches";
  // Present only when `reason === "ambiguous_local_matches"` — two or more
  // of the user's own saved recipes matched the dish name equally well.
  // Never silently resolved; the client must ask the user to pick one.
  localAlternatives?: { recipeId: string; title: string }[];
  // Present only when status === "local_match". Already fully trusted and
  // persisted — no import step, no importProof, just the existing recipeId
  // a meal can reference directly (MealItem.recipeId).
  localMatch?: {
    recipeId: string;
    title: string;
    servings: number | null;
    ingredientCount: number;
    nutritionPer100g: MacroTotals | null;
    nutritionCalculable: boolean;
  };
  candidate?: {
    title: string;
    sourceUrl: string;
    domain: string;
    servings?: number;
    extractionMethod: "schema_org_json_ld" | "ai_structured";
    ingredientCount: number;
    // Owner-beta blocker #6 (2026-09-11): counts now use the FIXED trusted-
    // nutrition gate — resolvedIngredientCount only counts an ingredient
    // whose identity itself reached "resolved" (never a merely-previewed
    // confirmation_required candidate, even one with a resolved gram
    // quantity — see recipe-ingredient-review.ts).
    resolvedIngredientCount: number;
    confirmationRequiredIngredientCount: number;
    unresolvedIngredientCount: number;
    ingredientSummary: string[];
    // FINAL/TRUSTED nutrition only (computeTrustedNutrition) — null/false
    // whenever recipeState !== "fully_resolved". Never a partial estimate.
    nutritionPer100g: MacroTotals | null;
    nutritionCalculable: boolean;
    ingredientWeightGrams: number | null;
    // "fully_resolved": every ingredient already trusted, ready for final
    // nutrition. "reviewable": extraction succeeded and at least one
    // ingredient has something a human can act on (resolved or
    // confirmation_required) — the recipe is preserved for review instead of
    // being thrown away merely because full auto-resolution didn't happen.
    recipeState: "fully_resolved" | "reviewable";
    // The full per-ingredient review contract — see recipe-ingredient-
    // review.ts. Carries only already-trusted catalog data and the existing
    // ExternalFoodCandidate shape confirmable via POST /foods/resolve-
    // external/confirm — never arbitrary webpage/AI-supplied nutrition.
    ingredients: readonly RecipeIngredientReview[];
    /** Same import-proof mechanism the manual URL-import flow already uses — hand this straight to POST /recipes to persist, unchanged. */
    importProof: string;
  };
};

// A language-level search hint (not a per-dish alias) so a bare dish name
// reads as a recipe query rather than, say, a restaurant-menu or product
// listing query. Generalizes to any concept in that language, never a
// specific food/dish name.
const RECIPE_LOCALE_HINT: Record<Locale, string> = { hu: "recept", de: "rezept", en: "recipe" };
const MAX_RESULTS = 5;
const MAX_CANDIDATES_CONSIDERED = 5;
// How many relevant candidates discover() hands back for sequential
// import-suitability attempts (recipe-discovery-fallback.ts) — bounded
// independently of MAX_CANDIDATES_CONSIDERED (the relevance-filter scan
// width) so tightening/loosening one never silently changes the other.
// Real production evidence (owner-beta blocker #5, 2026-09-10): for all
// three validated dishes, the top-ranked relevant result was unsuitable for
// import (oversized page / no schema.org markup) while a lower-ranked
// result in the SAME single search's result set was cleanly importable —
// 3 is the smallest bound that captured a working candidate in every case
// observed so far.
const MAX_CANDIDATES_RETURNED = 3;

export type RecipeDiscoveryCandidate = { url: string; title: string; domain: string };

export type RecipeDiscoveryOutcome =
  | { status: "found"; candidates: RecipeDiscoveryCandidate[]; resultCount: number; candidatesAfterRelevanceFilter: number }
  | { status: "no_results"; resultCount: number; candidatesAfterRelevanceFilter: number }
  | { status: "rate_limited" }
  | { status: "disabled" }
  | { status: "provider_error" };

export type RecipeDiscoveryDeps = {
  provider: WebKnowledgeSearchProvider;
  rateLimiter: WebKnowledgeSearchRateLimiter;
  negativeCache: NegativeSearchCache;
};

/**
 * Category-only production observability, mirroring dynamic_food_resolution's
 * existing convention exactly — no dish name, no query text, only the typed
 * outcome and bounded counts.
 */
function logRecipeDiscoveryOutcome(status: RecipeDiscoveryOutcome["status"], resultCount?: number, afterFilter?: number) {
  console.log(`recipe_discovery status=${status}${resultCount != null ? ` results=${resultCount}` : ""}${afterFilter != null ? ` afterFilter=${afterFilter}` : ""}`);
}

/**
 * Finds a small BOUNDED, ordered set of candidate recipe URLs (see
 * MAX_CANDIDATES_RETURNED) for a composite-dish concept the local catalog
 * and structured authoritative sources have already genuinely failed to
 * resolve — never just the single top-ranked one, since relevance and
 * import-suitability are separate questions the caller (recipe-discovery-
 * fallback.ts) evaluates sequentially. Deliberately makes at most one
 * WebKnowledgeSearchProvider call per discover() invocation (owner-beta
 * blocker #4, 2026-09-10: Tavily development-credit protection) — no query
 * fan-out, no multi-hint retries, regardless of how many candidates are
 * returned or attempted downstream.
 *
 * The ORIGINAL user concept (not any translated/expanded hint) is always the
 * relevance anchor: isRelevantExternalCandidate requires every meaningful
 * token of the original phrase to be attested in a result's own title before
 * that result is even considered a candidate. A high Tavily relevance score
 * alone is never sufficient — see the same discipline already applied to
 * USDA candidates in catalog/external-food.ts.
 */
export class RecipeDiscoveryService {
  constructor(private readonly deps: RecipeDiscoveryDeps) {}

  async discover(input: { originalPhrase: string; locale: Locale; userId: string }): Promise<RecipeDiscoveryOutcome> {
    if (this.deps.provider.id === "disabled") {
      logRecipeDiscoveryOutcome("disabled");
      return { status: "disabled" };
    }
    const normalizedPhrase = normalizeSearch(input.originalPhrase);
    if (!normalizedPhrase) return { status: "no_results", resultCount: 0, candidatesAfterRelevanceFilter: 0 };

    if (this.deps.negativeCache.has(normalizedPhrase)) {
      logRecipeDiscoveryOutcome("no_results", 0, 0);
      return { status: "no_results", resultCount: 0, candidatesAfterRelevanceFilter: 0 };
    }
    if (!this.deps.rateLimiter.consume(input.userId)) {
      logRecipeDiscoveryOutcome("rate_limited");
      return { status: "rate_limited" };
    }

    const hint = RECIPE_LOCALE_HINT[input.locale] ?? RECIPE_LOCALE_HINT.en;
    const query = `${input.originalPhrase} ${hint}`.trim().slice(0, 200);

    let results;
    try {
      results = await this.deps.provider.search({ query, maxResults: MAX_RESULTS });
    } catch {
      logRecipeDiscoveryOutcome("provider_error");
      return { status: "provider_error" };
    }

    const relevant = results
      .slice(0, MAX_CANDIDATES_CONSIDERED)
      .filter((result) => isRelevantExternalCandidate(input.originalPhrase, normalizeSearch(result.title)));

    if (!relevant.length) {
      this.deps.negativeCache.set(normalizedPhrase);
      logRecipeDiscoveryOutcome("no_results", results.length, 0);
      return { status: "no_results", resultCount: results.length, candidatesAfterRelevanceFilter: 0 };
    }

    logRecipeDiscoveryOutcome("found", results.length, relevant.length);
    return {
      status: "found",
      candidates: relevant.slice(0, MAX_CANDIDATES_RETURNED).map((result) => ({ url: result.url, title: result.title, domain: result.domain })),
      resultCount: results.length,
      candidatesAfterRelevanceFilter: relevant.length
    };
  }
}
