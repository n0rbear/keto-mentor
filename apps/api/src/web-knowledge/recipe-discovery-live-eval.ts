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

/**
 * Owner-beta blocker #4 (2026-09-10) real-development validation. Opt-in by
 * existing configuration only (WEB_SEARCH_PROVIDER=tavily + TAVILY_API_KEY) —
 * never prints the API key or raw webpage content, only bounded/typed
 * outcome data, mirroring every other *-live-eval.ts script's discipline.
 * Exactly one Tavily search per dish, per the same credit-protection policy
 * the production code path enforces.
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

  // No local catalog for this eval — every ingredient resolution below is a
  // genuine live attempt (which may itself call USDA / the food-nlp AI, same
  // as previewRecipeImport already does for manual imports).
  const prisma = { foodAlias: { findMany: async () => [] }, food: { findMany: async () => [] } } as any;

  const dishes: Array<{ key: string; phrase: string }> = [
    { key: "toltott-kaposzta", phrase: "töltött káposzta" },
    { key: "rakott-krumpli", phrase: "rakott krumpli" },
    { key: "gulyasleves", phrase: "gulyásleves" }
  ];

  const report: unknown[] = [];
  for (const dish of dishes) {
    const searchStart = performance.now();
    const discovery = await discoveryService.discover({ originalPhrase: dish.phrase, locale: "hu", userId: `live-eval-${dish.key}` });
    const searchLatencyMs = Math.round(performance.now() - searchStart);

    if (discovery.status !== "found") {
      report.push({ dish: dish.key, provider: provider.id, searchRequestCount: 1, searchLatencyMs, discoveryStatus: discovery.status, resultCount: "resultCount" in discovery ? discovery.resultCount : 0, candidatesAfterRelevanceFilter: "candidatesAfterRelevanceFilter" in discovery ? discovery.candidatesAfterRelevanceFilter : 0, finalState: "unresolved" });
      continue;
    }

    const extractStart = performance.now();
    try {
      const preview = await previewRecipeImport(prisma, discovery.candidate.url, {}, recipeAiProvider);
      const extractLatencyMs = Math.round(performance.now() - extractStart);
      const resolvedIngredients = preview.ingredients.filter((i) => i.selectedFood && i.quantity?.status === "resolved").length;
      report.push({
        dish: dish.key,
        provider: provider.id,
        searchRequestCount: 1,
        searchLatencyMs,
        resultCount: discovery.resultCount,
        candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter,
        selectedCandidate: { title: discovery.candidate.title, domain: discovery.candidate.domain },
        extractionMethod: preview.extractionMethod,
        extractLatencyMs,
        recipeAiGateway: recipeAiConfig.kind,
        ingredientCount: preview.ingredients.length,
        resolvedIngredientCount: resolvedIngredients,
        unresolvedIngredientCount: preview.ingredients.length - resolvedIngredients,
        nutritionCalculable: resolvedIngredients === preview.ingredients.length && preview.ingredients.length > 0,
        finalState: "confirmation_required"
      });
    } catch (error) {
      const extractLatencyMs = Math.round(performance.now() - extractStart);
      const code = error instanceof RecipeImportError ? error.publicCode : error instanceof SafeFetchError ? error.publicCode : "unknown";
      report.push({ dish: dish.key, provider: provider.id, searchRequestCount: 1, searchLatencyMs, resultCount: discovery.resultCount, candidatesAfterRelevanceFilter: discovery.candidatesAfterRelevanceFilter, selectedCandidate: { title: discovery.candidate.title, domain: discovery.candidate.domain }, extractLatencyMs, extractionFailureCode: code, finalState: "unresolved" });
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error("recipe_discovery_live_evaluation_unavailable", error instanceof Error ? error.message : error); process.exitCode = 2; });
