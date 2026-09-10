import type { Locale } from "@keto-mentor/shared";
import { normalizeSearch } from "../catalog/normalize.js";
import { isRelevantExternalCandidate } from "../catalog/external-food.js";
import type { WebKnowledgeSearchProvider } from "../web-knowledge/web-knowledge-search-provider.js";
import type { NegativeSearchCache } from "../web-knowledge/negative-search-cache.js";
import type { WebKnowledgeSearchRateLimiter } from "../web-knowledge/web-knowledge-rate-limit.js";
import type { MacroTotals } from "../nutrition-core.js";

/**
 * The bounded, safe-to-serialize shape attached to a meal-input result when
 * web recipe discovery ran. Deliberately carries only what a client needs to
 * render "we found a recipe that may represent this dish" and to confirm it
 * via the EXISTING recipe-import persistence flow (POST /recipes with
 * importProof) — never arbitrary webpage HTML/text, never raw ingredient
 * objects with forged nutrition.
 */
export type RecipeDiscoveryPreview = {
  status: "confirmation_required" | "unresolved";
  searchAttempted: boolean;
  resultCount: number;
  candidatesAfterRelevanceFilter: number;
  reason?: "disabled" | "rate_limited" | "provider_error" | "no_relevant_results" | "fetch_failed" | "extraction_failed";
  candidate?: {
    title: string;
    sourceUrl: string;
    domain: string;
    servings?: number;
    extractionMethod: "schema_org_json_ld" | "ai_structured";
    ingredientCount: number;
    resolvedIngredientCount: number;
    unresolvedIngredientCount: number;
    ingredientSummary: string[];
    nutritionPer100g: MacroTotals | null;
    nutritionCalculable: boolean;
    ingredientWeightGrams: number | null;
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

export type RecipeDiscoveryCandidate = { url: string; title: string; domain: string };

export type RecipeDiscoveryOutcome =
  | { status: "found"; candidate: RecipeDiscoveryCandidate; resultCount: number; candidatesAfterRelevanceFilter: number }
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
 * Finds at most ONE candidate recipe URL for a composite-dish concept the
 * local catalog and structured authoritative sources have already genuinely
 * failed to resolve. Deliberately makes at most one WebKnowledgeSearchProvider
 * call per discover() invocation (owner-beta blocker #4, 2026-09-10: Tavily
 * development-credit protection) — no query fan-out, no multi-hint retries.
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

    const top = relevant[0];
    logRecipeDiscoveryOutcome("found", results.length, relevant.length);
    return {
      status: "found",
      candidate: { url: top.url, title: top.title, domain: top.domain },
      resultCount: results.length,
      candidatesAfterRelevanceFilter: relevant.length
    };
  }
}
