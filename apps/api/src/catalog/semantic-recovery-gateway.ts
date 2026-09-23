import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { OpenAiProvider } from "../ai/openai-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "../ai/failover-provider.js";
import { ChatSemanticRecoveryProvider, DisabledSemanticRecoveryProvider, type SemanticRecoveryProvider } from "./semantic-recovery.js";

const semanticRecoveryFailoverObserver = createFailoverObserver("semantic_recovery");

/**
 * Reuses the exact same configured AI gateway as every other food-AI
 * capability (search intent, quantity estimation, semantic candidate gate) —
 * same env vars, same credentials, no new secret and no new provider stack.
 */
export function configuredSemanticRecoveryProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): SemanticRecoveryProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "groq") {
      const primary = new GroqAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatSemanticRecoveryProvider(primary);
      const secondary = new OpenRouterAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, appReferer: resolved.secondary.appReferer, appTitle: resolved.secondary.appTitle, fetchImpl: overrides.fetchImpl });
      return new ChatSemanticRecoveryProvider(new FailoverAiProvider(primary, secondary, semanticRecoveryFailoverObserver));
    }
    if (resolved.kind === "openrouter") {
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatSemanticRecoveryProvider(primary);
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, fetchImpl: overrides.fetchImpl });
      return new ChatSemanticRecoveryProvider(new FailoverAiProvider(primary, secondary, semanticRecoveryFailoverObserver));
    }
    if (resolved.kind === "openai") {
      return new ChatSemanticRecoveryProvider(new OpenAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl }));
    }
    if (resolved.kind === "mistral") {
      return new ChatSemanticRecoveryProvider(new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl }));
    }
  } catch (error) {
    console.error("semantic_recovery_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledSemanticRecoveryProvider();
}
