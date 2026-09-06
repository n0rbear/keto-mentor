import { OpenRouterAiProvider, type OpenRouterProviderOptions } from "../ai/openrouter-provider.js";
import { ChatQuantityEstimationProvider } from "./chat-quantity-provider.js";

export class OpenRouterQuantityEstimationProvider extends ChatQuantityEstimationProvider {
  constructor(options: OpenRouterProviderOptions, now?: () => number, ttlMs?: number, maxEntries?: number) {
    super(new OpenRouterAiProvider(options), now, ttlMs, maxEntries);
  }
}
