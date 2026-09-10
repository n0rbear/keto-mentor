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
import { configuredRecipeAiProvider } from "../recipes/recipe-ai-gateway.js";
import { resolveFoodAiGatewayConfig } from "../ai/food-ai-gateway-config.js";
import type { InterpretResult } from "../meal-input/interpret.js";

/**
 * Owner-beta blocker #4/#5 (2026-09-10) real-development validation. Opt-in
 * by existing configuration only (WEB_SEARCH_PROVIDER=tavily +
 * TAVILY_API_KEY) — never prints the API key or raw webpage content, only
 * bounded/typed outcome data, mirroring every other *-live-eval.ts script's
 * discipline. Exactly one Tavily search per dish, per the same
 * credit-protection policy the production code path enforces.
 *
 * Calls attachRecipeDiscoveryFallback DIRECTLY — the exact same function
 * server.ts wires into /meal-input/interpret — so this exercises the real
 * bounded-candidate sequential-attempt loop, not a re-implementation of it.
 *
 * ingredientResolutionPrisma lets this be pointed at a real, populated
 * (non-production) Food catalog for a true ingredient-resolution read —
 * defaults to an always-miss stub matching prior runs when none is supplied.
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

  // Real, populated ingredient-resolution database — see prisma-live-eval-db.ts
  // for how this is provisioned (local Docker Postgres seeded with the same
  // curated catalog import used in dev, never production). Falls back to an
  // always-miss stub (matching the prior checkpoint's diagnostic) if
  // LIVE_EVAL_DATABASE_URL is not set, so this script still runs standalone.
  const { PrismaClient } = await import("@prisma/client");
  const prisma = env.LIVE_EVAL_DATABASE_URL
    ? new PrismaClient({ datasources: { db: { url: env.LIVE_EVAL_DATABASE_URL } } })
    : ({ foodAlias: { findMany: async () => [] }, food: { findMany: async () => [] } } as any);

  const dishes: Array<{ key: string; phrase: string }> = [
    { key: "toltott-kaposzta", phrase: "töltött káposzta" },
    { key: "rakott-krumpli", phrase: "rakott krumpli" },
    { key: "gulyasleves", phrase: "gulyásleves" }
  ];

  // Minimal InterpretResult shaped to be eligible for recipe discovery —
  // mirrors exactly what a real compound_dish/no-explicit-ingredients/
  // genuine-miss classification produces (see interpret.ts's
  // isEligibleForRecipeDiscovery in recipe-discovery-fallback.ts).
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

  const report: unknown[] = [];
  for (const dish of dishes) {
    const start = performance.now();
    const withDiscovery = await attachRecipeDiscoveryFallback(eligibleResult(dish.phrase), {
      discoveryService, recipeAiProvider, prisma, userId: `live-eval-${dish.key}`, locale: "hu"
    });
    const latencyMs = Math.round(performance.now() - start);
    report.push({ dish: dish.key, latencyMs, recipeAiGateway: recipeAiConfig.kind, recipeDiscovery: withDiscovery.recipeDiscovery });
  }

  console.log(JSON.stringify(report, null, 2));
  if (env.LIVE_EVAL_DATABASE_URL) await prisma.$disconnect();
}

main().catch((error) => { console.error("recipe_discovery_live_evaluation_unavailable", error instanceof Error ? error.message : error); process.exitCode = 2; });
