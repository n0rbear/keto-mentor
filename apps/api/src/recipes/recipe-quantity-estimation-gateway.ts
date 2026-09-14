import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { OpenAiProvider } from "../ai/openai-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "../ai/failover-provider.js";
import { ChatRecipeQuantityEstimationProvider, DisabledRecipeQuantityEstimationProvider, type RecipeQuantityEstimationProvider } from "./recipe-quantity-estimation.js";

const observer = createFailoverObserver("recipe_quantity_estimation");
const MAX_TOKENS = 2_000;

export function configuredRecipeQuantityEstimationProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): RecipeQuantityEstimationProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "groq") {
      const primary = new GroqAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, maxTokens: MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatRecipeQuantityEstimationProvider(primary);
      const secondary = new OpenRouterAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, appReferer: resolved.secondary.appReferer, appTitle: resolved.secondary.appTitle, maxTokens: MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      return new ChatRecipeQuantityEstimationProvider(new FailoverAiProvider(primary, secondary, observer));
    }
    if (resolved.kind === "openrouter") {
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, maxTokens: MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatRecipeQuantityEstimationProvider(primary);
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, maxTokens: MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      return new ChatRecipeQuantityEstimationProvider(new FailoverAiProvider(primary, secondary, observer));
    }
    if (resolved.kind === "openai") return new ChatRecipeQuantityEstimationProvider(new OpenAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, maxTokens: MAX_TOKENS, fetchImpl: overrides.fetchImpl }));
    if (resolved.kind === "mistral") return new ChatRecipeQuantityEstimationProvider(new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, maxTokens: MAX_TOKENS, fetchImpl: overrides.fetchImpl }));
  } catch (error) {
    console.error("recipe_quantity_estimation_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledRecipeQuantityEstimationProvider();
}
