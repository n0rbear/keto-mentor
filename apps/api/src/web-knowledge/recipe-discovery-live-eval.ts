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
import { previewRecipeImport, RecipeImportError } from "../recipes/recipe-import.js";
import { configuredRecipeAiProvider } from "../recipes/recipe-ai-gateway.js";
import { resolveFoodAiGatewayConfig } from "../ai/food-ai-gateway-config.js";
import { SafeFetchError } from "../recipes/safe-url-fetcher.js";
import { isRelevantExternalCandidate } from "../catalog/external-food.js";
import { normalizeSearch } from "../catalog/normalize.js";

/**
 * Owner-beta blocker #4 (2026-09-10) real-development validation. Opt-in by
 * existing configuration only (WEB_SEARCH_PROVIDER=tavily + TAVILY_API_KEY) —
 * never prints the API key or raw webpage content, only bounded/typed
 * outcome data, mirroring every other *-live-eval.ts script's discipline.
 * Exactly one Tavily search per dish, per the same credit-protection policy
 * the production code path enforces.
 *
 * Diagnostic-only extension (owner-beta blocker #5, 2026-09-10): after the
 * production-shaped single-candidate path (identical to RecipeDiscoveryService),
 * this ALSO walks the rest of the SAME already-returned bounded result set
 * (no new search) to distinguish SEARCH RELEVANCE (isRelevantExternalCandidate)
 * from RECIPE-IMPORT SUITABILITY (does the page actually fetch/extract
 * cleanly) — reporting only, never changes what the production service selects.
 */
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

  const prisma = { foodAlias: { findMany: async () => [] }, food: { findMany: async () => [] } } as any;

  const dishes: Array<{ key: string; phrase: string }> = [
    { key: "toltott-kaposzta", phrase: "töltött káposzta" },
    { key: "rakott-krumpli", phrase: "rakott krumpli" },
    { key: "gulyasleves", phrase: "gulyásleves" }
  ];

  async function tryExtract(url: string) {
    const start = performance.now();
    try {
      const preview = await previewRecipeImport(prisma, url, {}, recipeAiProvider);
      const resolvedIngredients = preview.ingredients.filter((i) => i.selectedFood && i.quantity?.status === "resolved").length;
      return {
        ok: true, latencyMs: Math.round(performance.now() - start),
        extractionMethod: preview.extractionMethod,
        ingredientCount: preview.ingredients.length, resolvedIngredientCount: resolvedIngredients,
        nutritionCalculable: resolvedIngredients === preview.ingredients.length && preview.ingredients.length > 0
      };
    } catch (error) {
      const code = error instanceof RecipeImportError ? error.publicCode : error instanceof SafeFetchError ? error.publicCode : "unknown";
      return { ok: false, latencyMs: Math.round(performance.now() - start), failureCode: code };
    }
  }

  const report: unknown[] = [];
  for (const dish of dishes) {
    // Production-shaped path: exactly what RecipeDiscoveryService.discover() does.
    const searchStart = performance.now();
    const discovery = await discoveryService.discover({ originalPhrase: dish.phrase, locale: "hu", userId: `live-eval-${dish.key}` });
    const searchLatencyMs = Math.round(performance.now() - searchStart);

    if (discovery.status !== "found") {
      report.push({ dish: dish.key, searchRequestCount: 1, searchLatencyMs, discoveryStatus: discovery.status, finalState: "unresolved" });
      continue;
    }

    const topExtraction = await tryExtract(discovery.candidate.url);
    const entry: any = {
      dish: dish.key, searchRequestCount: 1, searchLatencyMs,
      resultCount: discovery.resultCount, candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
      selectedCandidate: { title: discovery.candidate.title, domain: discovery.candidate.domain },
      recipeAiGateway: recipeAiConfig.kind,
      selectedCandidateExtraction: topExtraction,
      finalState: topExtraction.ok ? "confirmation_required" : "unresolved"
    };

    // Diagnostic-only (no new search): walk the REST of the same bounded
    // result set to separate "was it relevant" from "was it importable."
    if (!topExtraction.ok) {
      const raw = await provider.search({ query: `${dish.phrase} recept`, maxResults: 5 });
      const relevant = raw.filter((r) => isRelevantExternalCandidate(dish.phrase, normalizeSearch(r.title)));
      const candidateTrace = [];
      for (const candidate of relevant) {
        const extraction = candidate.url === discovery.candidate.url ? topExtraction : await tryExtract(candidate.url);
        candidateTrace.push({ title: candidate.title, domain: candidate.domain, isTopSelected: candidate.url === discovery.candidate.url, extraction });
        if (extraction.ok) break; // first importable one is enough evidence
      }
      entry.boundedSetSuitabilityTrace = candidateTrace;
    }

    report.push(entry);
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error("recipe_discovery_live_evaluation_unavailable", error instanceof Error ? error.message : error); process.exitCode = 2; });
