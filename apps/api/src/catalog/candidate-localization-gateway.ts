import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "../ai/failover-provider.js";
import { ChatCandidateLocalizationProvider, DisabledCandidateLocalizationProvider, type CandidateLocalizationProvider } from "./candidate-localization.js";

const candidateLocalizationFailoverObserver = createFailoverObserver("candidate_localization");

/**
 * Reuses the exact same configured AI gateway (OpenRouter, with an automatic
 * Groq failover when GROQ_API_KEY is set, or direct Mistral) already used for
 * food understanding, quantity estimation, and search intent — same env
 * vars, same credentials, no new secret and no new provider stack.
 */
export function configuredCandidateLocalizationProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): CandidateLocalizationProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "groq") {
      const primary = new GroqAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatCandidateLocalizationProvider(primary);
      const secondary = new OpenRouterAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, appReferer: resolved.secondary.appReferer, appTitle: resolved.secondary.appTitle, fetchImpl: overrides.fetchImpl });
      return new ChatCandidateLocalizationProvider(new FailoverAiProvider(primary, secondary, candidateLocalizationFailoverObserver));
    }
    if (resolved.kind === "openrouter") {
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatCandidateLocalizationProvider(primary);
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, fetchImpl: overrides.fetchImpl });
      return new ChatCandidateLocalizationProvider(new FailoverAiProvider(primary, secondary, candidateLocalizationFailoverObserver));
    }
    if (resolved.kind === "mistral") {
      return new ChatCandidateLocalizationProvider(new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl }));
    }
  } catch (error) {
    console.error("candidate_localization_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledCandidateLocalizationProvider();
}
