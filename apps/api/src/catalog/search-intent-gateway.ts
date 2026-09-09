import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { ChatSearchIntentProvider, DisabledSearchIntentProvider, type SearchIntentProvider } from "./search-intent.js";

/**
 * Reuses the exact same configured AI gateway (OpenRouter or direct Mistral)
 * already used for food understanding and quantity estimation — same env
 * vars, same credentials, no new secret and no new provider stack.
 */
export function configuredSearchIntentProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): SearchIntentProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "openrouter") {
      return new ChatSearchIntentProvider(new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl }));
    }
    if (resolved.kind === "mistral") {
      return new ChatSearchIntentProvider(new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl }));
    }
  } catch (error) {
    console.error("search_intent_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledSearchIntentProvider();
}
