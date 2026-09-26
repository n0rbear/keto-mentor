import type { Locale } from "@keto-mentor/shared";
import { normalizeSearch } from "../catalog/normalize.js";
import { isRelevantExternalCandidate } from "../catalog/external-food.js";
import type { WebKnowledgeSearchProvider } from "../web-knowledge/web-knowledge-search-provider.js";
import type { NegativeSearchCache } from "../web-knowledge/negative-search-cache.js";
import type { WebKnowledgeSearchRateLimiter } from "../web-knowledge/web-knowledge-rate-limit.js";
import type { MacroTotals } from "../nutrition-core.js";
import type { RecipeIngredientReview } from "./recipe-ingredient-review.js";

/**
 * Owner-beta checkpoint (2026-09-15) — final recipe nutrition review:
 * nutritionPer100g's weight BASIS was previously only documented in a source
 * comment (see below), never surfaced in the API contract itself — a
 * consuming client had no way to tell "this per-100g figure is a real,
 * known cooked-dish yield weight" (a saved Recipe with finishedWeightGrams,
 * see recipes/nutrition.ts's calculateRecipeNutrition) apart from "this is
 * an approximation based on the sum of raw ingredient grams, which
 * typically OVERSTATES a cooked dish's true weight" (every discovered
 * recipe — extraction never captures a cooked yield). Both are honestly
 * computed from real authoritative data; only the WEIGHT they're divided by
 * differs. Exposed explicitly rather than changed, silently omitted, or
 * newly estimated — the smallest safe fix consistent with existing behavior.
 */
export type NutritionPer100gBasis = "finished_weight" | "raw_ingredient_weight";

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
  localAlternatives?: { recipeId: string; title: string; source: "own" | "reference"; servings: number | null; servingGrams: number | null }[];
  // Present only when status === "local_match". Already fully trusted and
  // persisted — no import step, no importProof, just the existing recipeId
  // a meal can reference directly (MealItem.recipeId).
  localMatch?: {
    recipeId: string;
    title: string;
    source: "own" | "reference";
    servings: number | null;
    servingGrams: number | null;
    ingredientCount: number;
    nutritionPer100g: MacroTotals | null;
    // A saved Recipe's per100g (calculateRecipeNutrition) is only ever
    // computed when finishedWeightGrams is known — see nutrition.ts — so
    // this is always "finished_weight" whenever nutritionPer100g is non-null.
    nutritionPer100gBasis: NutritionPer100gBasis | null;
    nutritionCalculable: boolean;
  };
  candidate?: {
    title: string;
    instructions?: string[];
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
    // Owner-beta (2026-09-14) — Blocker 5: this is per 100g of the COMBINED
    // RAW INGREDIENT WEIGHT, never a finished/cooked dish weight (a
    // discovered recipe has no finishedWeightGrams — see
    // recipes/nutrition.ts's calculateRecipeNutrition, the local-saved-
    // recipe equivalent, which correctly refuses per100g without one). A
    // known, honestly-labeled approximation — never presented as measured.
    nutritionPer100g: MacroTotals | null;
    // Owner-beta checkpoint (2026-09-15): explicit, API-visible weight basis
    // for nutritionPer100g — always "raw_ingredient_weight" for a discovered
    // recipe (extraction never captures a cooked yield weight), null when
    // nutritionPer100g itself is null. A client MUST treat this differently
    // from a true measured cooked-dish per-100g figure.
    nutritionPer100gBasis: NutritionPer100gBasis | null;
    // Owner-beta (2026-09-14) — Blocker 5: per ONE serving, using `servings`
    // (schema.org recipeYield / the AI extraction's own structured field —
    // never a fabricated number) — needs no weight-basis assumption at all,
    // so prefer this over nutritionPer100g whenever `servings` is present.
    // null whenever servings is unknown or recipeState !== "fully_resolved".
    nutritionPerServing: MacroTotals | null;
    nutritionTotal: MacroTotals | null;
    requestedPortion?: { count: number; unit: "plate" | "bowl" | "portion"; provenance: "explicit_household_unit"; nutrition: MacroTotals | null };
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
    // Owner-beta (2026-09-14): Blocker 4 (double counting) — populated only
    // for a multi-item phrase (e.g. "csülökpörkölt krumplival") where this
    // candidate's OWN resolved ingredients were found to be the SAME Food as
    // a separately-resolved sibling item in `items`. `overlapsWithSiblingItems`
    // is an identity-confirmed match (same underlying Food.id — the recipe
    // genuinely includes this exact food, already independently resolved
    // elsewhere in the phrase); the corresponding sibling item in the
    // returned InterpretResult is marked nutritionEligible:false +
    // excludedBySiblingRecipe so it is never also counted. A future
    // recipe-confirmation save flow must NOT submit an excluded sibling's own
    // contribution alongside this recipe's. `possibleOverlapWithSiblingItems`
    // is a WEAKER, name-based signal (the recipe's own ingredient text names
    // the same food, but it didn't itself reach a trusted identity) — never
    // auto-decided; the corresponding sibling is marked ambiguous/
    // canConfirm:false so a save flow must ask the user rather than guess.
    overlapsWithSiblingItems?: { itemIndex: number; canonicalName: string }[];
    possibleOverlapWithSiblingItems?: { itemIndex: number; canonicalName: string }[];
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
