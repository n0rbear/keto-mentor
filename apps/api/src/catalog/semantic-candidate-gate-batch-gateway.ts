import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { OpenAiProvider } from "../ai/openai-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "../ai/failover-provider.js";
import { ChatRecipeSemanticGateProvider, DisabledRecipeSemanticGateProvider, type RecipeSemanticGateProvider } from "./semantic-candidate-gate-batch.js";

const semanticCandidateGateBatchFailoverObserver = createFailoverObserver("semantic_candidate_gate_batch");

// Up to SEMANTIC_GATE_BATCH_MAX_PAIRS (30) candidate pairs, each carrying a
// relationship + formCompatibility + contextualFit verdict, needs more
// output headroom than the single-ingredient gate's default token budget
// (mirrors recipe-ingredient-normalization-gateway.ts's identical reasoning).
const SEMANTIC_CANDIDATE_GATE_BATCH_MAX_TOKENS = 4_000;

/**
 * Reuses the exact same configured AI gateway (OpenRouter with automatic Groq
 * failover, direct Mistral, or OpenAI) already used by every other food-AI
 * capability — same env vars, same credentials, no new secret. Misconfiguration
 * or failure degrades to DisabledRecipeSemanticGateProvider, which fails
 * CLOSED (every pair unvalidated) — same safety posture as the
 * single-ingredient gate this batches on top of.
 */
export function configuredRecipeSemanticGateProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): RecipeSemanticGateProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "groq") {
      const primary = new GroqAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, maxTokens: SEMANTIC_CANDIDATE_GATE_BATCH_MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatRecipeSemanticGateProvider(primary);
      const secondary = new OpenRouterAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, appReferer: resolved.secondary.appReferer, appTitle: resolved.secondary.appTitle, maxTokens: SEMANTIC_CANDIDATE_GATE_BATCH_MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      return new ChatRecipeSemanticGateProvider(new FailoverAiProvider(primary, secondary, semanticCandidateGateBatchFailoverObserver));
    }
    if (resolved.kind === "openrouter") {
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, maxTokens: SEMANTIC_CANDIDATE_GATE_BATCH_MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatRecipeSemanticGateProvider(primary);
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, maxTokens: SEMANTIC_CANDIDATE_GATE_BATCH_MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      return new ChatRecipeSemanticGateProvider(new FailoverAiProvider(primary, secondary, semanticCandidateGateBatchFailoverObserver));
    }
    if (resolved.kind === "openai") {
      return new ChatRecipeSemanticGateProvider(new OpenAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, maxTokens: SEMANTIC_CANDIDATE_GATE_BATCH_MAX_TOKENS, fetchImpl: overrides.fetchImpl }));
    }
    if (resolved.kind === "mistral") {
      return new ChatRecipeSemanticGateProvider(new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, maxTokens: SEMANTIC_CANDIDATE_GATE_BATCH_MAX_TOKENS, fetchImpl: overrides.fetchImpl }));
    }
  } catch (error) {
    console.error("semantic_candidate_gate_batch_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledRecipeSemanticGateProvider();
}
