import { resolveFoodAiGatewayConfig, type FoodAiGatewayConfigInput } from "../ai/food-ai-gateway-config.js";
import { OpenRouterAiProvider } from "../ai/openrouter-provider.js";
import { MistralAiProvider } from "../ai/mistral-provider.js";
import { GroqAiProvider } from "../ai/groq-provider.js";
import { OpenAiProvider } from "../ai/openai-provider.js";
import { FailoverAiProvider, createFailoverObserver } from "../ai/failover-provider.js";
import { ChatRecipeIngredientNormalizationProvider, DisabledRecipeIngredientNormalizationProvider, type RecipeIngredientNormalizationProvider } from "./recipe-ingredient-normalization.js";

const recipeIngredientNormalizationFailoverObserver = createFailoverObserver("recipe_ingredient_normalization");

// A full recipe's worth of ingredients (up to RECIPE_IMPORT_LIMITS.ingredients
// = 50) normalized in one batched response needs materially more output
// headroom than a single-ingredient capability like search-intent — real
// measured evidence: an 18-ingredient recipe alone produced 832 completion
// tokens. Scaled with margin for the full 50-ingredient cap plus JSON
// structure overhead. Passed explicitly to every provider construction below
// since each provider's own DEFAULT_MAX_TOKENS (Groq 2,000 / OpenRouter 3,000
// / OpenAI 900 / Mistral's own default) would otherwise silently truncate a
// large recipe's response.
const RECIPE_INGREDIENT_NORMALIZATION_MAX_TOKENS = 4_000;

/**
 * Reuses the exact same configured AI gateway (OpenRouter, with an automatic
 * Groq failover when GROQ_API_KEY is set, direct Mistral, or OpenAI) already
 * used for search-intent/semantic-candidate-gate/candidate-localization —
 * same env vars, same credentials, no new secret and no new provider stack.
 * Misconfiguration/failure degrades to DisabledRecipeIngredientNormalization
 * Provider, which fails OPEN (returns null) — the caller falls back to the
 * existing per-ingredient resolution path, never blocks recipe import.
 */
export function configuredRecipeIngredientNormalizationProvider(config: FoodAiGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): RecipeIngredientNormalizationProvider {
  const resolved = resolveFoodAiGatewayConfig(config);
  try {
    if (resolved.kind === "groq") {
      const primary = new GroqAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, maxTokens: RECIPE_INGREDIENT_NORMALIZATION_MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatRecipeIngredientNormalizationProvider(primary);
      const secondary = new OpenRouterAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, appReferer: resolved.secondary.appReferer, appTitle: resolved.secondary.appTitle, maxTokens: RECIPE_INGREDIENT_NORMALIZATION_MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      return new ChatRecipeIngredientNormalizationProvider(new FailoverAiProvider(primary, secondary, recipeIngredientNormalizationFailoverObserver));
    }
    if (resolved.kind === "openrouter") {
      const primary = new OpenRouterAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, appReferer: resolved.appReferer, appTitle: resolved.appTitle, maxTokens: RECIPE_INGREDIENT_NORMALIZATION_MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      if (!resolved.secondary) return new ChatRecipeIngredientNormalizationProvider(primary);
      const secondary = new GroqAiProvider({ apiKey: resolved.secondary.apiKey, model: resolved.secondary.model, baseUrl: resolved.secondary.baseUrl, maxTokens: RECIPE_INGREDIENT_NORMALIZATION_MAX_TOKENS, fetchImpl: overrides.fetchImpl });
      return new ChatRecipeIngredientNormalizationProvider(new FailoverAiProvider(primary, secondary, recipeIngredientNormalizationFailoverObserver));
    }
    if (resolved.kind === "openai") {
      return new ChatRecipeIngredientNormalizationProvider(new OpenAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, maxTokens: RECIPE_INGREDIENT_NORMALIZATION_MAX_TOKENS, fetchImpl: overrides.fetchImpl }));
    }
    if (resolved.kind === "mistral") {
      return new ChatRecipeIngredientNormalizationProvider(new MistralAiProvider({ apiKey: resolved.apiKey, model: resolved.model, baseUrl: resolved.baseUrl, maxTokens: RECIPE_INGREDIENT_NORMALIZATION_MAX_TOKENS, fetchImpl: overrides.fetchImpl }));
    }
  } catch (error) {
    console.error("recipe_ingredient_normalization_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledRecipeIngredientNormalizationProvider();
}
