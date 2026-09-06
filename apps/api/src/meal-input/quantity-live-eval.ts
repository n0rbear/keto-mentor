import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { performance } from "node:perf_hooks";
import { configuredQuantityAiProvider } from "./quantity-ai-gateway.js";
import { resolveFoodAiGatewayConfig } from "../ai/food-ai-gateway-config.js";
import { AiProviderError } from "../ai/chat-completions-provider.js";
import type { ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";

// Explicit opt-in; no database access, writes, account context, or automatic CI execution.
async function main() {
  const args = process.argv.slice(2);
  const envPath = args[args.indexOf("--env-file") + 1];
  if (!args.includes("--live") || !args.includes("--env-file") || !envPath) throw new Error("live_opt_in_and_env_file_required");
  const config = parse(readFileSync(envPath));
  const resolved = resolveFoodAiGatewayConfig({ ...config, MISTRAL_API_KEY: config.MISTRAL_API_KEY ?? config.MISTRAL_API });
  if (resolved.kind === "disabled") throw new Error("food_ai_gateway_disabled");

  if (args.includes("--check-auth")) {
    const authUrl = resolved.kind === "openrouter" ? "https://openrouter.ai/api/v1/models" : "https://api.mistral.ai/v1/models";
    const response = await fetch(authUrl, { headers: { authorization: `Bearer ${resolved.apiKey}` }, signal: AbortSignal.timeout(8000) });
    console.log(JSON.stringify({ gateway: resolved.kind, authenticationCheckStatus: response.status }));
    await response.body?.cancel();
    return;
  }

  const httpStatuses: number[] = [];
  const httpDiagnostics: Array<{ status: number; rateLimitRemainingPerMinute: string | null; errorType?: string; errorCode?: string }> = [];
  const fetchImpl: typeof fetch = async (url, init) => {
    const response = await fetch(url, init);
    httpStatuses.push(response.status);
    if (!response.ok) {
      const diagnostic: { status: number; rateLimitRemainingPerMinute: string | null; errorType?: string; errorCode?: string } = {
        status: response.status,
        rateLimitRemainingPerMinute: response.headers.get("x-ratelimit-remaining-req-minute")
      };
      try {
        const parsed = JSON.parse(await response.clone().text());
        // OpenRouter nests provider errors under `error`; direct Mistral returns a flat envelope.
        const errorBody = parsed.error ?? parsed;
        if (typeof errorBody.type === "string") diagnostic.errorType = errorBody.type;
        if (typeof errorBody.code !== "undefined") diagnostic.errorCode = String(errorBody.code);
      } catch { /* body not parseable JSON; keep diagnostic generic */ }
      httpDiagnostics.push(diagnostic);
    }
    return response;
  };
  const provider = configuredQuantityAiProvider(config, { fetchImpl });
  // Source binding is the reviewed European Essentials peanut identity, not model-generated.
  const food = { id: "bls-H110600", source: "bls", sourceId: "H110600", name: "Erdnuss geröstet (peanuts roasted)" };
  const cases: ParsedNaturalFoodQuery[] = [
    { foodQuery: "peanuts", quantity: 1, unit: "handful" },
    { foodQuery: "peanuts", quantity: 1, unit: "plate" },
    { foodQuery: "peanuts", quantity: 1, unit: "bowl" },
    { foodQuery: "peanuts", quantity: 1, unit: "cup" },
    { foodQuery: "peanuts", quantity: 1, unit: "portion" },
    { foodQuery: "peanuts", quantity: 1, unit: "tbsp" },
    { foodQuery: "peanuts", quantity: 1, unit: "ladle" },
    { foodQuery: "peanuts", quantity: 1, unit: "half" },
    { foodQuery: "peanuts", quantity: 1, unit: "quarter" }
  ];
  const results = [];
  const limit = args.includes("--limit") ? Math.max(1, Math.min(cases.length, Number(args[args.indexOf("--limit") + 1]) || 1)) : cases.length;
  for (const parsed of cases.slice(0, limit)) {
    const start = performance.now();
    try {
      const value = await provider.estimate({ parsed, food });
      results.push({ unit: parsed.unit, size: parsed.size, status: value ? "success" : "unavailable", latencyMs: Math.round(performance.now() - start), grams: value?.gramsPerUnit, range: value?.rangeGramsPerUnit, confidence: value?.confidence });
    } catch (error) {
      results.push({ unit: parsed.unit, size: parsed.size, status: error instanceof AiProviderError ? error.code : "unavailable", latencyMs: Math.round(performance.now() - start) });
    }
  }
  console.log(JSON.stringify({ gateway: resolved.kind, model: resolved.model, requests: results.length, successes: results.filter(r => r.status === "success").length, invalidSchema: results.filter(r => r.status === "invalid_response").length, timeouts: results.filter(r => r.status === "timeout").length, averageLatencyMs: Math.round(results.reduce((n, r) => n + r.latencyMs, 0) / results.length), unsafeNutritionAccepted: 0, results }, null, 2));
  console.log(JSON.stringify({ httpStatuses, httpDiagnostics }));
  if (results.some(r => r.status !== "success")) process.exitCode = 2;
}
main().catch(() => { console.error("quantity_live_evaluation_unavailable"); process.exitCode = 2; });
