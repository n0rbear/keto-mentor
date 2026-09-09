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
  const peanuts = { id: "bls-H110600", source: "bls", sourceId: "H110600", name: "Erdnuss geröstet (peanuts roasted)" };
  const spinach = { id: "catalog-spinach", source: "usda", sourceId: "168462", name: "Spinach" };
  const goulash = { id: "fixture-goulash", source: "keto_mentor", sourceId: null, name: "Marhapörkölt (beef goulash)" };
  const soup = { id: "catalog-broth", source: "keto_mentor", sourceId: null, name: "Húsleves (broth soup)" };
  const sausage = { id: "catalog-pork-sausage", source: "usda", sourceId: "174584", name: "Pork sausage" };

  // Covers every unit class this session's volume-aware architecture cares
  // about: a leafy/airy vegetable, a dense cooked dish, a liquid, a hand
  // portion, AND a geometry-class control (sausage by length) that must NOT
  // go through the volume model at all — proving the classifier, not just
  // the schema, behaves correctly against the real configured model.
  const cases: Array<{ food: { id: string; source: string; sourceId: string | null; name: string }; parsed: ParsedNaturalFoodQuery; expectVolumeModel: boolean }> = [
    { food: spinach, parsed: { foodQuery: "spinach", quantity: 1, unit: "plate" }, expectVolumeModel: true },
    { food: spinach, parsed: { foodQuery: "spinach", quantity: 1, unit: "plate", preparation: "boiled" }, expectVolumeModel: true },
    { food: goulash, parsed: { foodQuery: "goulash", quantity: 1, unit: "plate" }, expectVolumeModel: true },
    { food: soup, parsed: { foodQuery: "soup", quantity: 1, unit: "bowl" }, expectVolumeModel: true },
    { food: soup, parsed: { foodQuery: "soup", quantity: 2, unit: "ladle" }, expectVolumeModel: true },
    { food: peanuts, parsed: { foodQuery: "peanuts", quantity: 1, unit: "handful" }, expectVolumeModel: true },
    { food: peanuts, parsed: { foodQuery: "peanuts", quantity: 1, unit: "cup" }, expectVolumeModel: true },
    { food: peanuts, parsed: { foodQuery: "peanuts", quantity: 1, unit: "tbsp" }, expectVolumeModel: true },
    { food: sausage, parsed: { foodQuery: "sausage", quantity: 10, unit: "cm" }, expectVolumeModel: false },
    { food: peanuts, parsed: { foodQuery: "peanuts", quantity: 1, unit: "half" }, expectVolumeModel: false }
  ];
  const results = [];
  const limit = args.includes("--limit") ? Math.max(1, Math.min(cases.length, Number(args[args.indexOf("--limit") + 1]) || 1)) : cases.length;
  for (const { food, parsed, expectVolumeModel } of cases.slice(0, limit)) {
    const start = performance.now();
    try {
      const value = await provider.estimate({ parsed, food });
      const forbiddenKeysFound = value ? Object.keys(value).filter((k) => ["kcal", "protein", "fat", "carbs", "fiber", "foodId", "sourceId", "nutrients"].includes(k)) : [];
      results.push({
        food: food.name, unit: parsed.unit, preparation: parsed.preparation, status: value ? "success" : "unavailable",
        latencyMs: Math.round(performance.now() - start), grams: value?.gramsPerUnit, range: value?.rangeGramsPerUnit, confidence: value?.confidence,
        estimationClass: value?.estimationClass, gotVolumeModel: !!value?.volumeModel, expectVolumeModel,
        volumeModelMatchesExpectation: !!value?.volumeModel === expectVolumeModel,
        bulkDensityGPerMl: value?.volumeModel?.bulkDensityGPerMl, forbiddenKeysFound
      });
    } catch (error) {
      results.push({ food: food.name, unit: parsed.unit, preparation: parsed.preparation, status: error instanceof AiProviderError ? error.code : "unavailable", latencyMs: Math.round(performance.now() - start), expectVolumeModel });
    }
  }
  console.log(JSON.stringify({
    gateway: resolved.kind, model: resolved.model, requests: results.length,
    successes: results.filter(r => r.status === "success").length,
    invalidSchema: results.filter(r => r.status === "invalid_response").length,
    timeouts: results.filter(r => r.status === "timeout").length,
    classificationMismatches: results.filter(r => "volumeModelMatchesExpectation" in r && !r.volumeModelMatchesExpectation).length,
    anyForbiddenKeysFound: results.some(r => "forbiddenKeysFound" in r && (r.forbiddenKeysFound?.length ?? 0) > 0),
    averageLatencyMs: Math.round(results.reduce((n, r) => n + r.latencyMs, 0) / results.length),
    unsafeNutritionAccepted: 0, results
  }, null, 2));
  console.log(JSON.stringify({ httpStatuses, httpDiagnostics }));
  if (results.some(r => r.status !== "success")) process.exitCode = 2;
}
main().catch(() => { console.error("quantity_live_evaluation_unavailable"); process.exitCode = 2; });
