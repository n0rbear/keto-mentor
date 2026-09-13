import { foodUnderstandingSchema } from "@keto-mentor/shared";
import { z } from "zod";
import type { AiCapability, AiProvider, FoodNlpInput } from "./provider.js";
import { FOOD_NLP_SYSTEM_INSTRUCTION } from "./food-nlp-prompt.js";

const foodNlpInputSchema = z.object({ text: z.string().trim().min(2).max(300) }).strict();
// `usage` is optional and permissive (.passthrough()) — every OpenAI-
// compatible provider this file talks to (Groq, OpenRouter, Mistral, OpenAI
// itself) returns SOME usage object, but the exact nested shape varies (only
// OpenAI's newer models report prompt_tokens_details.cached_tokens /
// completion_tokens_details.reasoning_tokens) — never required, never
// assumed identical across providers.
const usageSchema = z.object({
  prompt_tokens: z.number().optional(),
  completion_tokens: z.number().optional(),
  total_tokens: z.number().optional(),
  prompt_tokens_details: z.object({ cached_tokens: z.number().optional() }).passthrough().optional(),
  completion_tokens_details: z.object({ reasoning_tokens: z.number().optional() }).passthrough().optional()
}).passthrough().optional();
const chatCompletionEnvelopeSchema = z.object({
  id: z.string().optional(),
  usage: usageSchema,
  choices: z.array(z.object({
    message: z.object({ content: z.string().max(60_000).nullable() }).passthrough()
  }).passthrough()).min(1).max(4)
}).passthrough();

// Owner-beta OpenAI baseline checkpoint (2026-09-13): category-only call
// telemetry — never prompt/response CONTENT, never the API key. Optional and
// defaulted to a no-op, so every existing provider/caller that doesn't pass
// `onUsage` is byte-identical in behavior; a benchmark harness (or, later, a
// production observability hook) opts in explicitly per-instance.
export type ChatCompletionsUsageEvent = {
  providerId: string;
  model: string;
  capability: string;
  success: boolean;
  latencyMs: number;
  httpStatus?: number;
  errorCode?: string;
  requestId?: string;
  promptTokens?: number;
  cachedTokens?: number;
  completionTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
};

export type ChatCompletionsOptions = {
  id: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  maxTokens?: number;
  fetchImpl?: typeof fetch;
  extraHeaders?: Record<string, string>;
  extraBodyFields?: Record<string, unknown>;
  // OpenAI's newer (reasoning-family) models reject the legacy `max_tokens`
  // field outright ("Unsupported parameter... Use 'max_completion_tokens'
  // instead" — confirmed live against the real API) — Groq/OpenRouter/
  // Mistral all still expect `max_tokens`, so this is opt-in per provider,
  // never a global behavior change.
  maxTokensParam?: "max_tokens" | "max_completion_tokens";
  onUsage?: (event: ChatCompletionsUsageEvent) => void;
};

export class AiProviderError extends Error {
  // httpStatus is only ever a plain HTTP status number — never response body,
  // headers, or any other upstream content — so surfacing it in diagnostics
  // (see quantity_ai logging in interpret.ts) can never leak a secret or user
  // data. It is what actually distinguishes "provider rate-limited/over
  // quota" (429) from "provider outage" (5xx) from "our own request was
  // malformed" (4xx other than 429) — three very different, previously
  // indistinguishable causes that all collapsed into the same opaque
  // "http_error" code.
  constructor(readonly code: "unsupported_capability" | "timeout" | "http_error" | "response_too_large" | "invalid_response", readonly httpStatus?: number) {
    super(code);
    this.name = "AiProviderError";
  }
}

export function completionUrl(baseUrl: string) {
  const parsed = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (parsed.username || parsed.password) throw new Error("AI base URL must not contain credentials");
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("AI base URL must use HTTPS");
  }
  return new URL("v1/chat/completions", parsed).toString();
}

async function boundedText(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new AiProviderError("response_too_large");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new AiProviderError("response_too_large");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}

// Some OpenAI-compatible models ignore response_format and wrap JSON in a markdown code fence.
function stripCodeFence(content: string) {
  const fenced = content.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : content;
}

/** Generic OpenAI-compatible chat-completions transport shared by every food-AI gateway. */
export class ChatCompletionsProvider implements AiProvider {
  readonly id: string;
  readonly model: string;
  private readonly apiKey: string;
  private readonly url: string;
  private readonly timeoutMs: number;
  private readonly maxResponseBytes: number;
  private readonly maxTokens: number;
  private readonly fetchImpl: typeof fetch;
  private readonly extraHeaders: Record<string, string>;
  private readonly extraBodyFields: Record<string, unknown>;
  private readonly maxTokensParam: "max_tokens" | "max_completion_tokens";
  private readonly onUsage?: (event: ChatCompletionsUsageEvent) => void;

  constructor(options: ChatCompletionsOptions) {
    if (!options.apiKey.trim() || !options.model.trim()) throw new Error("AI provider API key and model are required");
    this.id = options.id;
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.url = completionUrl(options.baseUrl);
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.maxResponseBytes = options.maxResponseBytes ?? 64 * 1024;
    this.maxTokens = options.maxTokens ?? 900;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.extraHeaders = options.extraHeaders ?? {};
    this.extraBodyFields = options.extraBodyFields ?? {};
    this.maxTokensParam = options.maxTokensParam ?? "max_tokens";
    this.onUsage = options.onUsage;
  }

  supports(capability: AiCapability) { return capability === "food_nlp"; }

  // Owner-beta OpenAI baseline checkpoint (2026-09-13): ALWAYS logs a single
  // category-only line — provider/model/capability/success/latency/token
  // counts, NEVER prompt/response content or the API key — for every
  // completion call, on every provider (Groq/OpenRouter/Mistral/OpenAI),
  // matching this codebase's existing observability convention (see
  // interpret.ts's `quantity_ai outcome=...` / `timing_stage stage=...`).
  // This is what answers "how much does one real meal interpretation cost"
  // from live Render logs without needing any new API surface. The optional
  // `onUsage` callback (unused in production) exists purely so a test can
  // assert the parsed telemetry shape without scraping console output.
  private reportUsage(event: ChatCompletionsUsageEvent) {
    console.log(
      `ai_usage capability=${event.capability} provider=${event.providerId} model=${event.model} success=${event.success}` +
      ` latencyMs=${event.latencyMs}` +
      (event.httpStatus != null ? ` httpStatus=${event.httpStatus}` : "") +
      (event.errorCode ? ` errorCode=${event.errorCode}` : "") +
      (event.requestId ? ` requestId=${event.requestId}` : "") +
      (event.promptTokens != null ? ` promptTokens=${event.promptTokens}` : "") +
      (event.cachedTokens != null ? ` cachedTokens=${event.cachedTokens}` : "") +
      (event.completionTokens != null ? ` completionTokens=${event.completionTokens}` : "") +
      (event.reasoningTokens != null ? ` reasoningTokens=${event.reasoningTokens}` : "") +
      (event.totalTokens != null ? ` totalTokens=${event.totalTokens}` : "")
    );
    this.onUsage?.(event);
  }

  async run<TInput, TOutput>(capability: AiCapability, input: TInput): Promise<TOutput> {
    if (capability !== "food_nlp") throw new AiProviderError("unsupported_capability");
    const { text } = foodNlpInputSchema.parse(input as FoodNlpInput);
    return this.complete(FOOD_NLP_SYSTEM_INSTRUCTION, text, (value) => foodUnderstandingSchema.parse(value), "food_nlp") as Promise<TOutput>;
  }

  async complete<T>(instruction: string, input: string, validate: (value: unknown) => T, capability = "unknown"): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const startedAt = Date.now();
    // requestId is captured from the response envelope even on a later
    // validation failure (helps correlate a bad response with OpenAI's own
    // dashboard), but never on a network-level failure where no envelope exists.
    let requestId: string | undefined;
    try {
      const response = await this.fetchImpl(this.url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}`, ...this.extraHeaders },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: instruction },
            { role: "user", content: input }
          ],
          response_format: { type: "json_object" },
          temperature: 0,
          [this.maxTokensParam]: this.maxTokens,
          stream: false,
          ...this.extraBodyFields
        }),
        signal: controller.signal
      });
      const body = await boundedText(response, this.maxResponseBytes);
      if (!response.ok) throw new AiProviderError("http_error", response.status);
      try {
        const envelope = chatCompletionEnvelopeSchema.parse(JSON.parse(body));
        requestId = envelope.id;
        const content = envelope.choices[0].message.content;
        if (content === null) throw new AiProviderError("invalid_response");
        const result = validate(JSON.parse(stripCodeFence(content)));
        this.reportUsage({
          providerId: this.id, model: this.model, capability, success: true, latencyMs: Date.now() - startedAt, requestId,
          promptTokens: envelope.usage?.prompt_tokens, cachedTokens: envelope.usage?.prompt_tokens_details?.cached_tokens,
          completionTokens: envelope.usage?.completion_tokens, reasoningTokens: envelope.usage?.completion_tokens_details?.reasoning_tokens,
          totalTokens: envelope.usage?.total_tokens
        });
        return result;
      } catch (error) {
        if (error instanceof AiProviderError) throw error;
        throw new AiProviderError("invalid_response");
      }
    } catch (error) {
      const mapped = error instanceof AiProviderError ? error
        : controller.signal.aborted || (error instanceof Error && error.name === "AbortError") ? new AiProviderError("timeout")
        : new AiProviderError("http_error");
      this.reportUsage({ providerId: this.id, model: this.model, capability, success: false, latencyMs: Date.now() - startedAt, httpStatus: mapped.httpStatus, errorCode: mapped.code, requestId });
      throw mapped;
    } finally {
      clearTimeout(timeout);
    }
  }
}
