import type { AiProvider } from "./provider.js";
import { MistralAiProvider } from "./mistral-provider.js";
import { OpenRouterAiProvider } from "./openrouter-provider.js";
import { GroqAiProvider } from "./groq-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "./failover-provider.js";
import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "./food-ai-gateway-config.js";

const disabledProvider: AiProvider = {
  id: "disabled",
  supports: () => false,
  async run() { throw new Error("food_nlp_disabled"); }
};

const foodNlpFailoverObserver = createFailoverObserver("food_nlp");

/** Selects the configured food-understanding AI gateway (OpenRouter, with an automatic Groq failover when GROQ_API_KEY is set, or direct Mistral). */
export function configuredFoodAiProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): AiProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "openrouter") {
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return primary;
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, fetchImpl: overrides.fetchImpl });
      return new FailoverAiProvider(primary, secondary, foodNlpFailoverObserver);
    }
    if (resolved.kind === "mistral") {
      return new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
    }
  } catch (error) {
    // A misconfigured AI gateway (e.g. a blank/placeholder key) must never take the whole
    // API down; degrade to the disabled provider the same way "no provider configured" does.
    console.error("food_ai_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return disabledProvider;
}
