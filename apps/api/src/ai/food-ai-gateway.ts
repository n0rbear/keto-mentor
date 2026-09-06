import type { AiProvider } from "./provider.js";
import { MistralAiProvider } from "./mistral-provider.js";
import { OpenRouterAiProvider } from "./openrouter-provider.js";
import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "./food-ai-gateway-config.js";

const disabledProvider: AiProvider = {
  id: "disabled",
  supports: () => false,
  async run() { throw new Error("food_nlp_disabled"); }
};

/** Selects the configured food-understanding AI gateway (OpenRouter or direct Mistral). */
export function configuredFoodAiProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): AiProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  if (resolved.kind === "openrouter") {
    return new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
  }
  if (resolved.kind === "mistral") {
    return new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
  }
  return disabledProvider;
}
