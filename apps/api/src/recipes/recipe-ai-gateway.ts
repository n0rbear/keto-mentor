import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { MistralRecipeExtractionProvider } from "./mistral-recipe-extraction-provider.js";
import { OpenRouterRecipeExtractionProvider } from "./openrouter-recipe-extraction-provider.js";
import { DisabledRecipeExtractionProvider, type RecipeExtractionProvider } from "./recipe-extraction-provider.js";

/**
 * Selects the configured recipe-extraction AI gateway — reuses the exact same
 * FOOD_AI_PROVIDER/model/credentials already configured for food-understanding
 * and quantity estimation (resolveFoodAiGatewayConfig), so recipe URL import
 * needs no separate secret or provider configuration.
 */
export function configuredRecipeAiProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): RecipeExtractionProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "openrouter") {
      return new OpenRouterRecipeExtractionProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, fetchImpl: overrides.fetchImpl });
    }
    if (resolved.kind === "mistral") {
      return new MistralRecipeExtractionProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, fetchImpl: overrides.fetchImpl });
    }
  } catch (error) {
    // A misconfigured AI gateway (e.g. a blank/placeholder key) must never take the whole
    // API down; degrade to the disabled provider the same way "no provider configured" does.
    console.error("recipe_ai_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledRecipeExtractionProvider();
}
