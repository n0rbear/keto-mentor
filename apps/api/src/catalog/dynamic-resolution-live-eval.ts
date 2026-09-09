import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { performance } from "node:perf_hooks";
import { resolveFoodAiGatewayConfig } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { ChatSearchIntentProvider } from "./search-intent.js";
import { UsdaFoodDataCentralLookupAdapter } from "./structured-source-adapters.js";

// Explicit opt-in; no database writes, no production account, no persistence.
// This exercises the REAL two real-provider chain (search-intent LLM -> USDA
// FDC search) exactly as resolveDynamicFood would, without ever calling
// resolveAuthoritativeFood/persisting — pure exploratory read-only validation.
async function main() {
  const args = process.argv.slice(2);
  const envPath = args[args.indexOf("--env-file") + 1];
  if (!args.includes("--live") || !args.includes("--env-file") || !envPath) throw new Error("live_opt_in_and_env_file_required");
  const config = parse(readFileSync(envPath));

  const resolved = resolveFoodAiGatewayConfig(config);
  if (resolved.kind === "disabled") throw new Error("food_ai_gateway_disabled");
  const transport = resolved.kind === "openrouter"
    ? new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle })
    : new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl });
  const searchIntentProvider = new ChatSearchIntentProvider(transport);

  const usdaKey = config.USDA_FDC_API_KEY || "DEMO_KEY";
  const usdaAdapter = new UsdaFoodDataCentralLookupAdapter(usdaKey);

  // Genuinely missing local foods (not just the already-fixed sausage), plus
  // one deliberately different category (fish) per the task's explicit
  // requirement that at least one unrelated category prove the same
  // architecture, not just the reference pork/processed-meat gap.
  const cases: Array<{ text: string; foodQuery: string; preparation?: string }> = [
    { text: "150 g csülök", foodQuery: "csülök" },
    { text: "füstölt csülök", foodQuery: "csülök", preparation: "smoked" },
    { text: "2 db virsli", foodQuery: "virsli" },
    { text: "1 szelet szalámi", foodQuery: "szalámi" },
    { text: "disznósajt", foodQuery: "disznósajt" },
    { text: "100 g fogas", foodQuery: "fogas" } // pikeperch — a different category (freshwater fish), not processed meat
  ];

  const results = [];
  for (const testCase of cases) {
    const start = performance.now();
    const intent = await searchIntentProvider.generate({ foodQuery: testCase.foodQuery, preparation: testCase.preparation });
    const intentMs = Math.round(performance.now() - start);
    if (!intent) {
      results.push({ input: testCase.text, intent: null, intentMs, candidates: [], searchMs: 0 });
      continue;
    }
    const searchStart = performance.now();
    let candidates: unknown[] = [];
    let searchError: string | null = null;
    try {
      candidates = await usdaAdapter.lookup(intent.searchTerms[0]);
    } catch (error) {
      searchError = error instanceof Error ? error.message : String(error);
    }
    const searchMs = Math.round(performance.now() - searchStart);
    results.push({
      input: testCase.text, intent, intentMs,
      searchTerm: intent.searchTerms[0], searchMs, searchError,
      candidateCount: candidates.length,
      topCandidates: (candidates as any[]).slice(0, 3).map((c) => ({ name: c.name, confidence: c.confidence, matchPolicy: c.matchPolicy }))
    });
  }

  console.log(JSON.stringify({ gateway: resolved.kind, model: resolved.model, usdaKeySource: config.USDA_FDC_API_KEY ? "configured" : "DEMO_KEY", results }, null, 2));
  if (results.every((r) => r.candidateCount === 0 && !r.intent)) process.exitCode = 2;
}
main().catch((error) => { console.error("dynamic_resolution_live_evaluation_unavailable", error instanceof Error ? error.message : error); process.exitCode = 2; });
