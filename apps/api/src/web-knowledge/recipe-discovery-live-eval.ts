import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

// Resolve the repo-root .env by file location, not process.cwd() — mirrors
// recipe-extraction-live-eval.ts exactly.
loadDotenv({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../../.env") });

import { configuredWebKnowledgeSearchProvider } from "./web-knowledge-gateway.js";
import { RecipeDiscoveryService } from "../recipes/recipe-discovery.js";
import { WebKnowledgeSearchRateLimiter } from "./web-knowledge-rate-limit.js";
import { NegativeSearchCache } from "./negative-search-cache.js";
import { attachRecipeDiscoveryFallback } from "../meal-input/recipe-discovery-fallback.js";
import { previewRecipeImport } from "../recipes/recipe-import.js";
import { configuredRecipeAiProvider } from "../recipes/recipe-ai-gateway.js";
import { resolveFoodAiGatewayConfig } from "../ai/food-ai-gateway-config.js";
import { configuredSearchIntentProvider } from "../catalog/search-intent-gateway.js";
import { configuredCandidateLocalizationProvider } from "../catalog/candidate-localization-gateway.js";
import { DynamicFoodResolutionRateLimiter } from "../catalog/dynamic-food-rate-limit.js";
import { UsdaFoodDataCentralLookupAdapter } from "../catalog/structured-source-adapters.js";
import { interpretMealInput, type DynamicResolutionDeps } from "../meal-input/interpret.js";
import type { InterpretResult } from "../meal-input/interpret.js";
import type { StructuredFoodLookupAdapter } from "../catalog/external-food.js";
import { ChatSearchIntentProvider, type SearchIntentProvider } from "../catalog/search-intent.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { DEFAULT_GROQ_MODEL } from "../ai/food-ai-gateway-config.js";

/**
 * KETO MENTOR checkpoint D (2026-09-10): PR #49 full ingredient-resolution
 * validation — local catalog + real USDA dynamic resolution. Extends
 * checkpoint C's live-eval (which had no USDA_FDC_API_KEY available) by
 * wiring the SAME dynamic-resolution deps object server.ts constructs
 * (searchIntentProvider, USDA adapter, candidateLocalizationProvider,
 * DynamicFoodResolutionRateLimiter) through to the real, unmodified
 * interpretMealInput/resolveDynamicFood/resolveAuthoritativeFood pipeline —
 * never a diagnostic-only alternate resolver.
 *
 * Calls attachRecipeDiscoveryFallback DIRECTLY (the exact function server.ts
 * wires into /meal-input/interpret) for the real bounded-candidate loop, then
 * calls previewRecipeImport ONCE MORE directly on the winning candidate URL
 * to harvest full per-ingredient diagnostic detail that the preview shape
 * deliberately does not expose (ingredientSummary is originalText only). The
 * second call costs zero extra Tavily calls and (thanks to alias
 * persistence from the first call) approximately zero extra USDA calls for
 * ingredients already resolved — verified via the counting wrapper below.
 */

// Diagnostic-only call counter — wraps the real UsdaFoodDataCentralLookupAdapter,
// changes no behavior, just observes call count/outcome shape for reporting.
class CountingUsdaAdapter implements StructuredFoodLookupAdapter {
  readonly source = "usda_fdc" as const;
  readonly sourceName = "USDA FoodData Central";
  calls = 0;
  errors = 0;
  emptyResults = 0;
  constructor(private readonly delegate: UsdaFoodDataCentralLookupAdapter) {}
  async lookup(query: string): Promise<unknown[]> {
    this.calls += 1;
    try {
      const result = await this.delegate.lookup(query);
      if (!result.length) this.emptyResults += 1;
      return result;
    } catch (error) {
      this.errors += 1;
      throw error;
    }
  }
}

type IngredientClassification =
  | "LOCAL_EXACT" | "LOCAL_ALIAS" | "LOCAL_FUZZY_ACCEPTED"
  | "USDA_RESOLVED" | "USDA_CONFIRMATION_REQUIRED" | "LOCAL_CONFIRMATION_REQUIRED"
  | "SEMANTIC_REJECTION" | "UNRESOLVED" | "PROVIDER_FAILURE";

function classifyIngredient(ingredient: {
  resolution: string;
  selectedFood: { source?: string; match?: { stage?: string } } | null;
}, dynamicOutcomeSeen: boolean): IngredientClassification {
  const food = ingredient.selectedFood as any;
  if (ingredient.resolution === "resolved") {
    if (food?.source === "usda_fdc") return "USDA_RESOLVED";
    const stage = food?.match?.stage;
    if (stage === "exact") return "LOCAL_EXACT";
    if (stage === "alias") return "LOCAL_ALIAS";
    if (stage === "fuzzy") return "LOCAL_FUZZY_ACCEPTED";
    // Dynamic path landed on a local Food (resolveAuthoritativeFood's own
    // translated-query search found a trusted local match) — no match.stage
    // survives that path, only source. Treat as alias-equivalent: a dynamic
    // resolution that converged on an existing local identity.
    return "LOCAL_ALIAS";
  }
  if (ingredient.resolution === "confirmation_required") {
    return dynamicOutcomeSeen ? "USDA_CONFIRMATION_REQUIRED" : "LOCAL_CONFIRMATION_REQUIRED";
  }
  // "unresolved": either resolveDynamicFood itself returned unresolved
  // (not_found/invalid_external_data/external_unavailable/rate_limited/
  // no_adapters), or the semantic-coverage gate (owner-beta blocker #3)
  // overrode an upstream "resolved" outcome. Both collapse to the same
  // public foodResolution; see the console dynamic_food_resolution log
  // lines captured below for the aggregate (not per-ingredient) breakdown.
  return "UNRESOLVED";
}

async function main() {
  const env = process.env as Record<string, string | undefined>;
  const provider = configuredWebKnowledgeSearchProvider(env);
  if (provider.id === "disabled") {
    throw new Error("web_knowledge_search_provider_disabled: set WEB_SEARCH_PROVIDER=tavily and TAVILY_API_KEY for this live evaluation");
  }

  const recipeAiConfig = resolveFoodAiGatewayConfig(env);
  const recipeAiProvider = configuredRecipeAiProvider(env);

  const discoveryService = new RecipeDiscoveryService({
    provider,
    rateLimiter: new WebKnowledgeSearchRateLimiter(),
    negativeCache: new NegativeSearchCache()
  });

  if (!env.LIVE_EVAL_DATABASE_URL) {
    throw new Error("LIVE_EVAL_DATABASE_URL is required for checkpoint D (isolated Postgres, never production)");
  }
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasources: { db: { url: env.LIVE_EVAL_DATABASE_URL } } });

  const usdaConfigured = Boolean(env.USDA_FDC_API_KEY);
  const rawUsdaAdapter = usdaConfigured ? new UsdaFoodDataCentralLookupAdapter(env.USDA_FDC_API_KEY!) : null;
  const countingAdapter = rawUsdaAdapter ? new CountingUsdaAdapter(rawUsdaAdapter) : null;
  const externalFoodAdapters: StructuredFoodLookupAdapter[] = countingAdapter ? [countingAdapter] : [];

  // KNOWN LOCAL-ENVIRONMENT ISSUE (verified via a separate zero-Tavily/USDA-cost
  // probe before this run): the OpenRouter primary configured in this
  // machine's local .env (FOOD_AI_MODEL=minimax/minimax-m2.7:free) returns a
  // hard 404 for search-intent requests. isRecoverableAiFailure (failover-
  // provider.ts) deliberately treats a 404 as non-recoverable (a genuinely
  // wrong request, not "provider down"), so FailoverAiProvider correctly
  // never attempts the configured Groq secondary — that is the REAL,
  // unmodified production failover architecture behaving exactly as
  // designed, not a bug. Since this collapses every dynamic-resolution
  // attempt to via:"raw_query" (Hungarian text sent straight to USDA's
  // English-language database) and defeats this checkpoint's actual goal of
  // observing real USDA resolution, this diagnostic substitutes a
  // Groq-only search-intent provider (same real ChatSearchIntentProvider
  // class, same real GroqAiProvider transport, same real GROQ_API_KEY —
  // only the OpenRouter leg is skipped). This is a diagnostic-script-only
  // substitution, never applied to recipe-import.ts/recipe-discovery-
  // fallback.ts/server.ts — production's real OpenRouter->Groq failover
  // architecture is completely unchanged and unaffected by this file.
  const useGroqOnlySearchIntent = Boolean(env.GROQ_API_KEY) && env.LIVE_EVAL_FORCE_GROQ_SEARCH_INTENT !== "false";
  const searchIntentProvider: SearchIntentProvider = useGroqOnlySearchIntent
    ? new ChatSearchIntentProvider(new GroqAiProvider({ apiKey: env.GROQ_API_KEY!, model: env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL }))
    : configuredSearchIntentProvider(env);
  const candidateLocalizationProvider = configuredCandidateLocalizationProvider(env);
  const dynamicFoodResolutionLimiter = new DynamicFoodResolutionRateLimiter();

  function buildDynamicDeps(userId: string): DynamicResolutionDeps {
    return {
      prisma,
      searchIntentProvider,
      adapters: externalFoodAdapters,
      rateLimiter: dynamicFoodResolutionLimiter,
      userId,
      locale: "hu",
      localizationProvider: candidateLocalizationProvider
    } as DynamicResolutionDeps;
  }

  const dishes: Array<{ key: string; phrase: string }> = [
    { key: "toltott-kaposzta", phrase: "töltött káposzta" },
    { key: "rakott-krumpli", phrase: "rakott krumpli" },
    { key: "gulyasleves", phrase: "gulyásleves" }
  ];

  function eligibleResult(phrase: string): InterpretResult {
    const item: InterpretResult = {
      input: phrase, parsed: { foodQuery: phrase }, foodResolution: "unresolved",
      selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      interpretationSource: "ai_assisted"
    };
    return {
      ...item, foodResolution: "compound",
      semantic: { language: "hu", kind: "compound_dish", dishName: phrase, clarificationNeeded: false },
      items: [item]
    };
  }

  const report: any[] = [];
  for (const dish of dishes) {
    const start = performance.now();
    const usdaCallsBefore = countingAdapter?.calls ?? 0;

    // Capture the real candidate_attempt log lines (now including url= —
    // see recipe-discovery-fallback.ts) so the best real candidate this
    // dish's actual bounded loop already fetched can be identified for a
    // detail pass below, even when it was correctly "skip"ped (partial
    // resolution) rather than "selected". No behavior change: this only
    // observes console output the real function already emits.
    const capturedLines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => { capturedLines.push(args.map(String).join(" ")); originalLog(...args); };
    let withDiscovery: InterpretResult;
    try {
      withDiscovery = await attachRecipeDiscoveryFallback(eligibleResult(dish.phrase), {
        discoveryService, recipeAiProvider, prisma, userId: `live-eval-${dish.key}`, locale: "hu",
        dynamic: buildDynamicDeps(`live-eval-${dish.key}`)
      });
    } finally {
      console.log = originalLog;
    }
    const usdaCallsAfterDiscovery = countingAdapter?.calls ?? 0;
    const latencyMs = Math.round(performance.now() - start);

    // Best real candidate attempt this dish made: prefer the selected one,
    // else the attempt with the most extracted ingredients (most informative
    // for diagnostics), parsed straight out of the real candidate_attempt log.
    const selectedUrl = withDiscovery.recipeDiscovery?.candidate?.sourceUrl;
    let bestSkippedUrl: string | undefined;
    let bestSkippedIngredients = -1;
    for (const line of capturedLines) {
      if (!line.startsWith("candidate_attempt ")) continue;
      const urlMatch = line.match(/url=(\S+)/);
      const ingredientsMatch = line.match(/ingredients=(\d+)/);
      if (urlMatch && ingredientsMatch && Number(ingredientsMatch[1]) > bestSkippedIngredients) {
        bestSkippedIngredients = Number(ingredientsMatch[1]);
        bestSkippedUrl = urlMatch[1];
      }
    }
    const detailUrl = selectedUrl ?? bestSkippedUrl;

    let ingredientDetail: any[] = [];
    let usdaCallsAfterDetail = usdaCallsAfterDiscovery;
    if (detailUrl) {
      // Second real call on a URL the real bounded loop already fetched for
      // real this run, purely to harvest full per-ingredient diagnostics
      // that RecipeDiscoveryPreview's candidate shape deliberately never
      // exposes (ingredientSummary is originalText only). Same real
      // previewRecipeImport function used inside attachRecipeDiscoveryFallback
      // — never a reimplementation. Never picks a URL the real loop did not
      // itself already attempt.
      const detailed = await previewRecipeImport(prisma, detailUrl, {}, recipeAiProvider, buildDynamicDeps(`live-eval-${dish.key}-detail`));
      usdaCallsAfterDetail = countingAdapter?.calls ?? 0;
      ingredientDetail = detailed.ingredients.map((ingredient) => ({
        originalText: ingredient.originalText,
        parsedQuantity: ingredient.parsedQuantity,
        parsedUnit: ingredient.parsedUnit,
        parsedFoodQuery: ingredient.parsedFoodQuery,
        resolution: ingredient.resolution,
        selectedFoodSource: (ingredient.selectedFood as any)?.source ?? null,
        selectedFoodMatchStage: (ingredient.selectedFood as any)?.match?.stage ?? null,
        selectedFoodName: (ingredient.selectedFood as any)?.name ?? null,
        quantityStatus: ingredient.quantity?.status ?? null,
        quantityGrams: ingredient.quantity?.status === "resolved" ? ingredient.quantity.grams : null,
        canConfirm: ingredient.canConfirm,
        classification: classifyIngredient(ingredient as any, usdaConfigured)
      }));
    }

    report.push({
      dish: dish.key,
      latencyMs,
      recipeAiGateway: recipeAiConfig.kind,
      usdaConfigured,
      usdaCallsDuringDiscoveryLoop: usdaCallsAfterDiscovery - usdaCallsBefore,
      usdaCallsDuringDetailPass: usdaCallsAfterDetail - usdaCallsAfterDiscovery,
      usdaCallsTotal: usdaCallsAfterDetail - usdaCallsBefore,
      recipeDiscovery: withDiscovery.recipeDiscovery,
      detailUrl: detailUrl ?? null,
      ingredientDetail
    });
  }

  // Persistence/reuse test: pick the first USDA_RESOLVED ingredient found
  // above (if any) and re-run interpretMealInput directly for that EXACT
  // original ingredient text — first pass already ran inside the dish loop
  // (counted above), this is the FOLLOW-UP pass proving "same phrase next
  // time -> zero external calls". No extra Tavily call: reuses the already-
  // extracted ingredient text, never re-searches.
  let persistenceTest: any = null;
  const usdaResolvedIngredient = report
    .flatMap((r) => r.ingredientDetail)
    .find((i: any) => i.classification === "USDA_RESOLVED");
  if (usdaResolvedIngredient) {
    const callsBeforeFirst = countingAdapter?.calls ?? 0;
    const first = await interpretMealInput(prisma, usdaResolvedIngredient.originalText, undefined, undefined, buildDynamicDeps("live-eval-persistence-first"));
    const callsAfterFirst = countingAdapter?.calls ?? 0;
    const second = await interpretMealInput(prisma, usdaResolvedIngredient.originalText, undefined, undefined, buildDynamicDeps("live-eval-persistence-second"));
    const callsAfterSecond = countingAdapter?.calls ?? 0;
    persistenceTest = {
      originalText: usdaResolvedIngredient.originalText,
      firstRun: { usdaCalls: callsAfterFirst - callsBeforeFirst, foodResolution: first.foodResolution, selectedFoodSource: (first.selectedFood as any)?.source ?? null, selectedFoodMatchStage: (first.selectedFood as any)?.match?.stage ?? null },
      secondRun: { usdaCalls: callsAfterSecond - callsAfterFirst, foodResolution: second.foodResolution, selectedFoodSource: (second.selectedFood as any)?.source ?? null, selectedFoodMatchStage: (second.selectedFood as any)?.match?.stage ?? null, localTrustedHit: callsAfterSecond === callsAfterFirst && second.foodResolution === "resolved" }
    };
  } else {
    persistenceTest = { note: "no USDA_RESOLVED ingredient found across the 3 dishes this run — see ingredientDetail/UNRESOLVED reasons in the report instead" };
  }

  console.log(JSON.stringify({
    searchIntentMode: useGroqOnlySearchIntent ? "diagnostic_groq_only (local OpenRouter primary returns 404 — see comment above)" : "production_wiring (openrouter primary + groq secondary)",
    usdaAdapterStats: countingAdapter ? { calls: countingAdapter.calls, errors: countingAdapter.errors, emptyResults: countingAdapter.emptyResults } : null,
    report,
    persistenceTest
  }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => { console.error("recipe_discovery_live_evaluation_unavailable", error instanceof Error ? error.message : error); process.exitCode = 2; });
