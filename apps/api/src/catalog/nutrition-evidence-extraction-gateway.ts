import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { OpenAiProvider } from "../ai/openai-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "../ai/failover-provider.js";
import { ChatNutritionEvidenceExtractionProvider, DisabledNutritionEvidenceExtractionProvider, type NutritionEvidenceExtractionProvider } from "./nutrition-evidence-extraction.js";

const nutritionEvidenceExtractionFailoverObserver = createFailoverObserver("nutrition_evidence_extraction");

/**
 * Reuses the exact same configured AI gateway (Groq/OpenRouter/OpenAI/Mistral,
 * with the same automatic failover pairing) already used for every other
 * food-AI capability — no new secret, no new provider stack. Misconfiguration
 * or an unresolvable config degrades to DisabledNutritionEvidenceExtractionProvider
 * (extract() always returns null) — fail-safe, matching this codebase's
 * standing convention for every configured*Provider factory.
 */
export function configuredNutritionEvidenceExtractionProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): NutritionEvidenceExtractionProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "groq") {
      const primary = new GroqAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatNutritionEvidenceExtractionProvider(primary);
      const secondary = new OpenRouterAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, appReferer: resolved.secondary.appReferer, appTitle: resolved.secondary.appTitle, fetchImpl: overrides.fetchImpl });
      return new ChatNutritionEvidenceExtractionProvider(new FailoverAiProvider(primary, secondary, nutritionEvidenceExtractionFailoverObserver));
    }
    if (resolved.kind === "openrouter") {
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatNutritionEvidenceExtractionProvider(primary);
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, fetchImpl: overrides.fetchImpl });
      return new ChatNutritionEvidenceExtractionProvider(new FailoverAiProvider(primary, secondary, nutritionEvidenceExtractionFailoverObserver));
    }
    if (resolved.kind === "openai") {
      return new ChatNutritionEvidenceExtractionProvider(new OpenAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl }));
    }
    if (resolved.kind === "mistral") {
      return new ChatNutritionEvidenceExtractionProvider(new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl }));
    }
  } catch (error) {
    console.error("nutrition_evidence_extraction_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledNutritionEvidenceExtractionProvider();
}
