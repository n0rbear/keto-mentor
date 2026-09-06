import { MistralAiProvider, type MistralProviderOptions } from "../ai/mistral-provider.js";
import { ChatQuantityEstimationProvider } from "./chat-quantity-provider.js";
import { DisabledQuantityEstimationProvider, type QuantityEstimationProvider } from "./quantity-estimation.js";

export { quantityOutputSchema, QUANTITY_INSTRUCTION } from "./chat-quantity-provider.js";

export class MistralQuantityEstimationProvider extends ChatQuantityEstimationProvider {
  constructor(options: MistralProviderOptions, now?: () => number, ttlMs?: number, maxEntries?: number) {
    super(new MistralAiProvider(options), now, ttlMs, maxEntries);
  }
}

/** @deprecated Direct Mistral-only factory retained for backward compatibility. Prefer `configuredQuantityAiProvider` from `./quantity-ai-gateway.js`. */
export function configuredQuantityProvider(config: { MISTRAL_API_KEY?: string; MISTRAL_MODEL?: string; MISTRAL_BASE_URL?: string }): QuantityEstimationProvider {
  return config.MISTRAL_API_KEY && config.MISTRAL_MODEL
    ? new MistralQuantityEstimationProvider({ apiKey: config.MISTRAL_API_KEY, model: config.MISTRAL_MODEL, baseUrl: config.MISTRAL_BASE_URL })
    : new DisabledQuantityEstimationProvider();
}
