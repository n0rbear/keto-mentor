import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { OpenAiProvider } from "../ai/openai-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "../ai/failover-provider.js";
import { ChatAiNutritionEstimationProvider, DisabledAiNutritionEstimationProvider, type AiNutritionEstimationProvider } from "./ai-nutrition-estimation.js";

const aiNutritionEstimationFailoverObserver = createFailoverObserver("ai_nutrition_estimation");

/**
 * Reuses the exact same configured AI gateway as every other food-AI
 * capability — no new secret. Misconfiguration degrades to
 * DisabledAiNutritionEstimationProvider (estimate() always returns null),
 * the same fail-safe convention every configured*Provider factory follows.
 */
export function configuredAiNutritionEstimationProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): AiNutritionEstimationProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "groq") {
      const primary = new GroqAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatAiNutritionEstimationProvider(primary);
      const secondary = new OpenRouterAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, appReferer: resolved.secondary.appReferer, appTitle: resolved.secondary.appTitle, fetchImpl: overrides.fetchImpl });
      return new ChatAiNutritionEstimationProvider(new FailoverAiProvider(primary, secondary, aiNutritionEstimationFailoverObserver));
    }
    if (resolved.kind === "openrouter") {
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatAiNutritionEstimationProvider(primary);
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, fetchImpl: overrides.fetchImpl });
      return new ChatAiNutritionEstimationProvider(new FailoverAiProvider(primary, secondary, aiNutritionEstimationFailoverObserver));
    }
    if (resolved.kind === "openai") {
      return new ChatAiNutritionEstimationProvider(new OpenAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl }));
    }
    if (resolved.kind === "mistral") {
      return new ChatAiNutritionEstimationProvider(new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl }));
    }
  } catch (error) {
    console.error("ai_nutrition_estimation_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledAiNutritionEstimationProvider();
}
