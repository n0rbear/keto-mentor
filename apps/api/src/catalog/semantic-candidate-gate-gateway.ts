import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "../ai/failover-provider.js";
import { ChatSemanticCandidateGateProvider, DisabledSemanticCandidateGateProvider, type SemanticCandidateGateProvider } from "./semantic-candidate-gate.js";

const semanticCandidateGateFailoverObserver = createFailoverObserver("semantic_candidate_gate");

/**
 * Reuses the exact same configured AI gateway (OpenRouter, with an automatic
 * Groq failover when GROQ_API_KEY is set, or direct Mistral) already used for
 * search-intent/candidate-localization — same env vars, same credentials, no
 * new secret and no new provider stack. Misconfiguration/failure degrades to
 * DisabledSemanticCandidateGateProvider, which fails CLOSED (rejects every
 * candidate) — unlike every other Disabled* provider in this codebase, which
 * fails open/no-op. That is intentional: this is the safety gate.
 */
export function configuredSemanticCandidateGateProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): SemanticCandidateGateProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "groq") {
      const primary = new GroqAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatSemanticCandidateGateProvider(primary);
      const secondary = new OpenRouterAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, appReferer: resolved.secondary.appReferer, appTitle: resolved.secondary.appTitle, fetchImpl: overrides.fetchImpl });
      return new ChatSemanticCandidateGateProvider(new FailoverAiProvider(primary, secondary, semanticCandidateGateFailoverObserver));
    }
    if (resolved.kind === "openrouter") {
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatSemanticCandidateGateProvider(primary);
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, fetchImpl: overrides.fetchImpl });
      return new ChatSemanticCandidateGateProvider(new FailoverAiProvider(primary, secondary, semanticCandidateGateFailoverObserver));
    }
    if (resolved.kind === "mistral") {
      return new ChatSemanticCandidateGateProvider(new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl }));
    }
  } catch (error) {
    console.error("semantic_candidate_gate_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledSemanticCandidateGateProvider();
}
