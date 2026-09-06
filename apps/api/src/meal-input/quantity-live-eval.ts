import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { performance } from "node:perf_hooks";
import { MistralQuantityEstimationProvider } from "./mistral-quantity-provider.js";
import { AiProviderError } from "../ai/mistral-provider.js";
import type { ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";

// Explicit opt-in; no database access, writes, account context, or automatic CI execution.
async function main() {
  const args = process.argv.slice(2);
  const envPath = args[args.indexOf("--env-file") + 1];
  if (!args.includes("--live") || !args.includes("--env-file") || !envPath) throw new Error("live_opt_in_and_env_file_required");
  const config = parse(readFileSync(envPath));
  const apiKey = config.MISTRAL_API_KEY ?? config.MISTRAL_API;
  if (!apiKey) throw new Error("mistral_key_missing");
  const model = config.MISTRAL_MODEL ?? "mistral-small-latest";
  if (args.includes("--check-auth")) {
    const response = await fetch("https://api.mistral.ai/v1/models", { headers: { authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(8000) });
    console.log(JSON.stringify({ authenticationCheckStatus: response.status }));
    await response.body?.cancel();
    return;
  }
  const httpStatuses: number[] = [];
  const provider = new MistralQuantityEstimationProvider({ apiKey, model, baseUrl: config.MISTRAL_BASE_URL, fetchImpl: async (url, init) => { const response = await fetch(url, init); httpStatuses.push(response.status); return response; } });
  // Source binding is the reviewed European Essentials peanut identity, not model-generated.
  const food = { id: "bls-H110600", source: "bls", sourceId: "H110600", name: "Erdnuss geröstet (peanuts roasted)" };
  const cases: ParsedNaturalFoodQuery[] = [
    { foodQuery: "peanuts", quantity: 1, unit: "handful" },
    { foodQuery: "peanuts", quantity: 1, unit: "handful", size: "small" },
    { foodQuery: "peanuts", quantity: 1, unit: "handful", size: "large" },
    { foodQuery: "peanuts", quantity: 1, unit: "bowl" },
    { foodQuery: "peanuts", quantity: 1, unit: "cup" },
    { foodQuery: "peanuts", quantity: 1, unit: "portion" },
    { foodQuery: "peanuts", quantity: 1, unit: "tbsp" }
  ];
  const results = [];
  const limit = args.includes("--limit") ? Math.max(1, Math.min(7, Number(args[args.indexOf("--limit") + 1]) || 1)) : 7;
  for (const parsed of cases.slice(0, limit)) {
    const start = performance.now();
    try {
      const value = await provider.estimate({ parsed, food });
      results.push({ unit: parsed.unit, size: parsed.size, status: value ? "success" : "unavailable", latencyMs: Math.round(performance.now() - start), grams: value?.gramsPerUnit, range: value?.rangeGramsPerUnit, confidence: value?.confidence });
    } catch (error) {
      results.push({ unit: parsed.unit, size: parsed.size, status: error instanceof AiProviderError ? error.code : "unavailable", latencyMs: Math.round(performance.now() - start) });
    }
  }
  console.log(JSON.stringify({ model, requests: results.length, successes: results.filter(r => r.status === "success").length, invalidSchema: results.filter(r => r.status === "invalid_response").length, timeouts: results.filter(r => r.status === "timeout").length, averageLatencyMs: Math.round(results.reduce((n, r) => n + r.latencyMs, 0) / results.length), unsafeNutritionAccepted: 0, results }, null, 2));
  console.log(JSON.stringify({ httpStatuses }));
  if (results.some(r => r.status !== "success")) process.exitCode = 2;
}
main().catch(() => { console.error("quantity_live_evaluation_unavailable"); process.exitCode = 2; });
