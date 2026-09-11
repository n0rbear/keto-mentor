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
export type OpenRouterSecondaryConfig = { apiKey: string; model: string; baseUrl?: string; appReferer?: string; appTitle?: string };

// A strong, currently-free-tier Groq model with native JSON-structured-output
// support (see GROQ_MODEL_SELECTION.md-equivalent note in the PR description)
// — used only when GROQ_API_KEY is set but GROQ_MODEL is left unconfigured,
// so enabling failover never requires more than one new environment variable.
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

export type FoodAiGatewayConfig =
  | { kind: "openrouter"; apiKey: string; model: string; baseUrl?: string; appReferer?: string; appTitle?: string; secondary?: GroqSecondaryConfig }
  // Owner-beta performance blocker (2026-09-12): a controlled benchmark (114
  // calls, 5 capabilities, 3 attempts each) measured OpenRouter's free
  // Nemotron model as slower (7-25s+ vs Groq's 0.7-2.4s median) AND
  // substantially less reliable (0-67% success rate on quantity,
  // localization, and search-intent; the semantic candidate gate degraded
  // to its own fail-closed empty map on 12 of 15 multi-candidate calls,
  // meaning the safety gate technically never returned a wrong answer but
  // was functionally unusable) — while Groq succeeded 100% of the time
  // across every capability with equal-or-better semantic correctness where
  // both succeeded. FOOD_AI_PROVIDER="groq" makes Groq primary with
  // OpenRouter as the automatic failover (never removed, just demoted) —
  // environment-driven, not a default, so a deployment can still choose
  // "openrouter" explicitly.
  | { kind: "groq"; apiKey: string; model: string; baseUrl?: string; secondary?: OpenRouterSecondaryConfig }
  | { kind: "mistral"; apiKey: string; model: string; baseUrl?: string }
  | { kind: "disabled" };

function resolveGroqSecondary(config: FoodAiGatewayConfigInput): GroqSecondaryConfig | undefined {
  const apiKey = config.GROQ_API_KEY?.trim();
  if (!apiKey) return undefined;
  return { apiKey, model: config.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL, baseUrl: config.GROQ_BASE_URL };
}

// Reuses the SAME OpenRouter credentials/model env vars every other kind
// already uses (OPENROUTER_API_KEY, FOOD_AI_MODEL, ...) — no new secret, no
// new env var, so switching FOOD_AI_PROVIDER between "openrouter" and "groq"
// never requires touching anything but that one variable.
function resolveOpenRouterSecondary(config: FoodAiGatewayConfigInput): OpenRouterSecondaryConfig | undefined {
  const apiKey = config.OPENROUTER_API_KEY?.trim();
  const model = config.FOOD_AI_MODEL?.trim();
  if (!apiKey || !model) return undefined;
  return { apiKey, model, baseUrl: config.OPENROUTER_BASE_URL, appReferer: config.OPENROUTER_APP_REFERER, appTitle: config.OPENROUTER_APP_TITLE };
}

/**
 * Single point where FOOD_AI_PROVIDER is interpreted. Every food-AI gateway
 * (food understanding, quantity estimation, search intent, semantic
 * candidate gate, candidate localization) calls this so the choice of AI
 * backend never forks the business logic that consumes each capability's
 * provider interface.
 *
 * Groq and OpenRouter are each other's ONLY failover partner — never
 * Mistral's; Mistral is the legacy direct-provider path and is left exactly
 * as it already behaves.
 */
export function resolveFoodAiGatewayConfig(config: FoodAiGatewayConfigInput): FoodAiGatewayConfig {
  if (config.FOOD_AI_PROVIDER === "groq") {
    const apiKey = config.GROQ_API_KEY?.trim();
    if (!apiKey) return { kind: "disabled" };
    return {
      kind: "groq",
      apiKey,
      model: config.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL,
      baseUrl: config.GROQ_BASE_URL,
      secondary: resolveOpenRouterSecondary(config)
    };
  }
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
