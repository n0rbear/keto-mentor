import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { MistralQuantityEstimationProvider } from "./mistral-quantity-provider.js";
import { OpenRouterQuantityEstimationProvider } from "./openrouter-quantity-provider.js";
import { DisabledQuantityEstimationProvider, type QuantityEstimationProvider } from "./quantity-estimation.js";

/** Selects the configured quantity-estimation AI gateway (OpenRouter or direct Mistral). */
export function configuredQuantityAiProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): QuantityEstimationProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "openrouter") {
      return new OpenRouterQuantityEstimationProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
    }
    if (resolved.kind === "mistral") {
      return new MistralQuantityEstimationProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
    }
  } catch (error) {
    // A misconfigured AI gateway (e.g. a blank/placeholder key) must never take the whole
    // API down; degrade to the disabled provider the same way "no provider configured" does.
    console.error("quantity_ai_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledQuantityEstimationProvider();
}
