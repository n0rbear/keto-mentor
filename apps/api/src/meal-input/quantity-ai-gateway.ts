import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "../ai/failover-provider.js";
import { MistralQuantityEstimationProvider } from "./mistral-quantity-provider.js";
import { OpenRouterQuantityEstimationProvider } from "./openrouter-quantity-provider.js";
import { GroqQuantityEstimationProvider } from "./groq-quantity-provider.js";
import { ChatQuantityEstimationProvider } from "./chat-quantity-provider.js";
import { DisabledQuantityEstimationProvider, type QuantityEstimationProvider } from "./quantity-estimation.js";

const quantityFailoverObserver = createFailoverObserver("quantity");

/** Selects the configured quantity-estimation AI gateway (Groq or OpenRouter as primary — see FOOD_AI_PROVIDER — with the other as automatic failover when GROQ_API_KEY/OPENROUTER_API_KEY is set, or direct Mistral). */
export function configuredQuantityAiProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): QuantityEstimationProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "groq") {
      if (!resolved.secondary) {
        return new GroqQuantityEstimationProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
      }
      const primary = new GroqAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
      const secondary = new OpenRouterAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, appReferer: resolved.secondary.appReferer, appTitle: resolved.secondary.appTitle, fetchImpl: overrides.fetchImpl });
      return new ChatQuantityEstimationProvider(new FailoverAiProvider(primary, secondary, quantityFailoverObserver));
    }
    if (resolved.kind === "openrouter") {
      if (!resolved.secondary) {
        return new OpenRouterQuantityEstimationProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
      }
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, fetchImpl: overrides.fetchImpl });
      return new ChatQuantityEstimationProvider(new FailoverAiProvider(primary, secondary, quantityFailoverObserver));
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
