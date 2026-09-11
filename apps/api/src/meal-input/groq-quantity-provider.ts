import { GroqAiProvider, type GroqProviderOptions } from "../ai/groq-provider.js";
import { ChatQuantityEstimationProvider } from "./chat-quantity-provider.js";

export class GroqQuantityEstimationProvider extends ChatQuantityEstimationProvider {
  constructor(options: GroqProviderOptions, now?: () => number, ttlMs?: number, maxEntries?: number) {
    super(new GroqAiProvider(options), now, ttlMs, maxEntries);
  }
}
