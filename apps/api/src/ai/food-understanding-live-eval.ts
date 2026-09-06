import { configuredFoodAiProvider } from "./food-ai-gateway.js";
import { resolveFoodAiGatewayConfig } from "./food-ai-gateway-config.js";
import { evaluateFoodUnderstanding } from "./food-understanding-eval.js";
import { FOOD_UNDERSTANDING_EVAL_CORPUS } from "./food-understanding-eval-corpus.js";

const env = process.env as Record<string, string | undefined>;
const resolved = resolveFoodAiGatewayConfig(env);
if (resolved.kind === "disabled") {
  throw new Error("food_ai_gateway_disabled: configure FOOD_AI_PROVIDER=openrouter with OPENROUTER_API_KEY/FOOD_AI_MODEL, or MISTRAL_API_KEY/MISTRAL_MODEL, for the optional live evaluation");
}
const requestedLimit = Number(env.FOOD_NLP_LIVE_LIMIT ?? Number.POSITIVE_INFINITY);
const cases = FOOD_UNDERSTANDING_EVAL_CORPUS.filter((test) => test.route === "ai").slice(0, Number.isFinite(requestedLimit) ? Math.max(1, requestedLimit) : undefined);
const provider = configuredFoodAiProvider(env);
const report = await evaluateFoodUnderstanding(cases, (test) => provider.run("food_nlp", { text: test.input }));
console.log(JSON.stringify({ gateway: resolved.kind, model: resolved.model, liveCalls: cases.length, report }, null, 2));
if (report.unsafeNutritionOutputAccepted || report.validSchema !== report.total) process.exitCode = 2;
