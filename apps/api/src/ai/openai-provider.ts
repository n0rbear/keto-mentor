import { ChatCompletionsProvider, type ChatCompletionsUsageEvent } from "./chat-completions-provider.js";

export type OpenAiProviderOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  maxTokens?: number;
  fetchImpl?: typeof fetch;
  onUsage?: (event: ChatCompletionsUsageEvent) => void;
};

// OpenAI baseline checkpoint (2026-09-13): confirmed live against the real
// API (not assumed) — newer OpenAI models (including gpt-5.4-nano) reject
// the legacy `max_tokens` field outright: "Unsupported parameter: 'max_tokens'
// is not supported with this model. Use 'max_completion_tokens' instead."
// `temperature: 0` combined with `max_completion_tokens` was confirmed to
// still work (some reasoning-tier models reject any non-default temperature
// entirely — gpt-5.4-nano does not), so ChatCompletionsProvider's existing
// deterministic temperature:0 behavior needed no change, only the token-
// limit parameter name.
const DEFAULT_MAX_TOKENS = 900;
const DEFAULT_TIMEOUT_MS = 15_000;

export class OpenAiProvider extends ChatCompletionsProvider {
  constructor(options: OpenAiProviderOptions) {
    super({
      id: "openai",
      apiKey: options.apiKey,
      model: options.model,
      baseUrl: options.baseUrl ?? "https://api.openai.com/",
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxResponseBytes: options.maxResponseBytes,
      maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      fetchImpl: options.fetchImpl,
      maxTokensParam: "max_completion_tokens",
      onUsage: options.onUsage
    });
  }
}
