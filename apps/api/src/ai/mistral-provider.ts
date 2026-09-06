import { ChatCompletionsProvider } from "./chat-completions-provider.js";
import type { AiProvider } from "./provider.js";

export { AiProviderError } from "./chat-completions-provider.js";

export type MistralProviderOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  fetchImpl?: typeof fetch;
};

export class MistralAiProvider extends ChatCompletionsProvider {
  constructor(options: MistralProviderOptions) {
    super({
      id: "mistral",
      apiKey: options.apiKey,
      model: options.model,
      baseUrl: options.baseUrl ?? "https://api.mistral.ai/",
      timeoutMs: options.timeoutMs,
      maxResponseBytes: options.maxResponseBytes,
      fetchImpl: options.fetchImpl,
      extraBodyFields: { safe_prompt: true }
    });
  }
}

/** @deprecated Direct Mistral-only factory retained for backward compatibility. Prefer `configuredFoodAiProvider` from `./food-ai-gateway.js`. */
export function configuredFoodNlpProvider(config: { MISTRAL_API_KEY?: string; MISTRAL_MODEL?: string; MISTRAL_BASE_URL?: string }): AiProvider {
  if (!config.MISTRAL_API_KEY || !config.MISTRAL_MODEL) {
    return { id: "disabled", supports: () => false, async run() { throw new Error("food_nlp_disabled"); } };
  }
  return new MistralAiProvider({ apiKey: config.MISTRAL_API_KEY, model: config.MISTRAL_MODEL, baseUrl: config.MISTRAL_BASE_URL });
}
