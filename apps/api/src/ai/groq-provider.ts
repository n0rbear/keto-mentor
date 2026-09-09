import { ChatCompletionsProvider } from "./chat-completions-provider.js";

export type GroqProviderOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  maxTokens?: number;
  fetchImpl?: typeof fetch;
};

// Groq's free-tier open-weight models (e.g. the gpt-oss family) can emit an
// internal reasoning trace before the actual JSON answer, the same
// class of behavior OpenRouterAiProvider already budgets extra tokens for —
// mirror that defensive margin here rather than risk truncating to no
// content. Groq's inference is materially faster than OpenRouter's shared
// free tier, so the timeout can stay well below OpenRouter's 25s default.
const DEFAULT_MAX_TOKENS = 2_000;
const DEFAULT_TIMEOUT_MS = 12_000;

export class GroqAiProvider extends ChatCompletionsProvider {
  constructor(options: GroqProviderOptions) {
    super({
      id: "groq",
      apiKey: options.apiKey,
      model: options.model,
      baseUrl: options.baseUrl ?? "https://api.groq.com/openai/",
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxResponseBytes: options.maxResponseBytes,
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      fetchImpl: options.fetchImpl
    });
  }
}
