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
};

export type FoodAiGatewayConfig =
  | { kind: "openrouter"; apiKey: string; model: string; baseUrl?: string; appReferer?: string; appTitle?: string }
  | { kind: "mistral"; apiKey: string; model: string; baseUrl?: string }
  | { kind: "disabled" };

/**
 * Single point where FOOD_AI_PROVIDER is interpreted. Both the food-understanding and
 * quantity-estimation gateways call this so the choice of AI backend never forks the
 * business logic that consumes AiProvider/QuantityEstimationProvider.
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
      appTitle: config.OPENROUTER_APP_TITLE
    };
  }
  if (!config.MISTRAL_API_KEY || !config.MISTRAL_MODEL) return { kind: "disabled" };
  return { kind: "mistral", apiKey: config.MISTRAL_API_KEY, model: config.MISTRAL_MODEL, baseUrl: config.MISTRAL_BASE_URL };
}
