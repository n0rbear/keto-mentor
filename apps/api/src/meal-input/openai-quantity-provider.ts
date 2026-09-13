import { OpenAiProvider, type OpenAiProviderOptions } from "../ai/openai-provider.js";
import { ChatQuantityEstimationProvider } from "./chat-quantity-provider.js";

export class OpenAiQuantityEstimationProvider extends ChatQuantityEstimationProvider {
  constructor(options: OpenAiProviderOptions, now?: () => number, ttlMs?: number, maxEntries?: number) {
    super(new OpenAiProvider(options), now, ttlMs, maxEntries);
  }
}
