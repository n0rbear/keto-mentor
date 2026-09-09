export type FoodAiGatewayConfigInput = {
  FOOD_AI_PROVIDER?: string;
  FOOD_AI_MODEL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_BASE_URL?: string;
  OPENROUTER_APP_REFERER?: string;
  OPENROUTER_APP_TITLE?: string;
  MISTRAL_API_KEY?: string;
  MISTRAL_MODEL?: string;
  MISTRAL_BASE_URL?: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
  GROQ_BASE_URL?: string;
};

export type GroqSecondaryConfig = { apiKey: string; model: string; baseUrl?: string };

// A strong, currently-free-tier Groq model with native JSON-structured-output
// support (see GROQ_MODEL_SELECTION.md-equivalent note in the PR description)
// — used only when GROQ_API_KEY is set but GROQ_MODEL is left unconfigured,
// so enabling failover never requires more than one new environment variable.
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

export type FoodAiGatewayConfig =
  | { kind: "openrouter"; apiKey: string; model: string; baseUrl?: string; appReferer?: string; appTitle?: string; secondary?: GroqSecondaryConfig }
  | { kind: "mistral"; apiKey: string; model: string; baseUrl?: string }
  | { kind: "disabled" };

function resolveGroqSecondary(config: FoodAiGatewayConfigInput): GroqSecondaryConfig | undefined {
  const apiKey = config.GROQ_API_KEY?.trim();
  if (!apiKey) return undefined;
  return { apiKey, model: config.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL, baseUrl: config.GROQ_BASE_URL };
}

/**
 * Single point where FOOD_AI_PROVIDER is interpreted. Both the food-understanding and
 * quantity-estimation gateways call this so the choice of AI backend never forks the
 * business logic that consumes AiProvider/QuantityEstimationProvider.
 *
 * Groq is deliberately only ever wired as OpenRouter's secondary — never
 * Mistral's — matching the product's actual chain (OpenRouter -> Groq ->
 * safe manual fallback); Mistral is the legacy direct-provider path and is
 * left exactly as it already behaves.
 */
export function resolveFoodAiGatewayConfig(config: FoodAiGatewayConfigInput): FoodAiGatewayConfig {
  if (config.FOOD_AI_PROVIDER === "openrouter") {
    if (!config.OPENROUTER_API_KEY || !config.FOOD_AI_MODEL) return { kind: "disabled" };
    return {
      kind: "openrouter",
      apiKey: config.OPENROUTER_API_KEY,
      model: config.FOOD_AI_MODEL,
      baseUrl: config.OPENROUTER_BASE_URL,
      appReferer: config.OPENROUTER_APP_REFERER,
      appTitle: config.OPENROUTER_APP_TITLE,
      secondary: resolveGroqSecondary(config)
    };
  }
  if (!config.MISTRAL_API_KEY || !config.MISTRAL_MODEL) return { kind: "disabled" };
  return { kind: "mistral", apiKey: config.MISTRAL_API_KEY, model: config.MISTRAL_MODEL, baseUrl: config.MISTRAL_BASE_URL };
}
