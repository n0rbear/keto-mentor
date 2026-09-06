import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { MistralQuantityEstimationProvider } from "./mistral-quantity-provider.js";
import { OpenRouterQuantityEstimationProvider } from "./openrouter-quantity-provider.js";
import { DisabledQuantityEstimationProvider, type QuantityEstimationProvider } from "./quantity-estimation.js";

/** Selects the configured quantity-estimation AI gateway (OpenRouter or direct Mistral). */
export function configuredQuantityAiProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): QuantityEstimationProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  if (resolved.kind === "openrouter") {
    return new OpenRouterQuantityEstimationProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
  }
  if (resolved.kind === "mistral") {
    return new MistralQuantityEstimationProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
  }
  return new DisabledQuantityEstimationProvider();
}
