import { ChatCompletionsProvider } from "./chat-completions-provider.js";

export type OpenRouterProviderOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  maxTokens?: number;
  fetchImpl?: typeof fetch;
  appReferer?: string;
  appTitle?: string;
};

// OpenRouter's free tier commonly serves reasoning models whose internal chain-of-thought
// can consume a small token budget before any content is emitted; a larger ceiling gives
// the model room to finish past its own reasoning trace instead of truncating to no content.
const DEFAULT_MAX_TOKENS = 3_000;
// The same reasoning trace takes noticeably longer to generate than a direct answer, and
// free-tier shared capacity adds further latency; give it more room than the 8s Mistral default.
const DEFAULT_TIMEOUT_MS = 25_000;

export class OpenRouterAiProvider extends ChatCompletionsProvider {
  constructor(options: OpenRouterProviderOptions) {
    const extraHeaders: Record<string, string> = {};
    if (options.appReferer) extraHeaders["HTTP-Referer"] = options.appReferer;
    if (options.appTitle) extraHeaders["X-Title"] = options.appTitle;
    super({
      id: "openrouter",
      apiKey: options.apiKey,
      model: options.model,
      baseUrl: options.baseUrl ?? "https://openrouter.ai/api/",
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxResponseBytes: options.maxResponseBytes,
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      fetchImpl: options.fetchImpl,
      extraHeaders
    });
  }
}
