import { foodUnderstandingSchema, type FoodUnderstanding } from "@keto-mentor/shared";
import { z } from "zod";
import type { AiCapability, AiProvider, FoodNlpInput } from "./provider.js";
import { FOOD_NLP_SYSTEM_INSTRUCTION } from "./food-nlp-prompt.js";

const foodNlpInputSchema = z.object({ text: z.string().trim().min(2).max(300) }).strict();
const mistralEnvelopeSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().max(60_000) }).passthrough()
  }).passthrough()).min(1).max(4)
}).passthrough();

export type MistralProviderOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  fetchImpl?: typeof fetch;
};

export class AiProviderError extends Error {
  constructor(readonly code: "unsupported_capability" | "timeout" | "http_error" | "response_too_large" | "invalid_response") {
    super(code);
    this.name = "AiProviderError";
  }
}

function completionUrl(baseUrl: string) {
  const parsed = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (parsed.username || parsed.password) throw new Error("MISTRAL_BASE_URL must not contain credentials");
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("MISTRAL_BASE_URL must use HTTPS");
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

export class MistralAiProvider implements AiProvider {
  readonly id = "mistral";
  readonly model: string;
  private readonly apiKey: string;
  private readonly url: string;
  private readonly timeoutMs: number;
  private readonly maxResponseBytes: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: MistralProviderOptions) {
    if (!options.apiKey.trim() || !options.model.trim()) throw new Error("Mistral API key and model are required");
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.url = completionUrl(options.baseUrl ?? "https://api.mistral.ai/");
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.maxResponseBytes = options.maxResponseBytes ?? 64 * 1024;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  supports(capability: AiCapability) { return capability === "food_nlp"; }

  async run<TInput, TOutput>(capability: AiCapability, input: TInput): Promise<TOutput> {
    if (capability !== "food_nlp") throw new AiProviderError("unsupported_capability");
    const { text } = foodNlpInputSchema.parse(input as FoodNlpInput);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(this.url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: FOOD_NLP_SYSTEM_INSTRUCTION },
            { role: "user", content: text }
          ],
          response_format: { type: "json_object" },
          safe_prompt: true,
          temperature: 0,
          max_tokens: 900,
          stream: false
        }),
        signal: controller.signal
      });
      const body = await boundedText(response, this.maxResponseBytes);
      if (!response.ok) throw new AiProviderError("http_error");
      try {
        const envelope = mistralEnvelopeSchema.parse(JSON.parse(body));
        return foodUnderstandingSchema.parse(JSON.parse(envelope.choices[0].message.content)) as TOutput;
      } catch (error) {
        if (error instanceof AiProviderError) throw error;
        throw new AiProviderError("invalid_response");
      }
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) throw new AiProviderError("timeout");
      throw new AiProviderError("http_error");
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function configuredFoodNlpProvider(config: { MISTRAL_API_KEY?: string; MISTRAL_MODEL?: string; MISTRAL_BASE_URL?: string }): AiProvider {
  if (!config.MISTRAL_API_KEY || !config.MISTRAL_MODEL) {
    return { id: "disabled", supports: () => false, async run() { throw new Error("food_nlp_disabled"); } };
  }
  return new MistralAiProvider({ apiKey: config.MISTRAL_API_KEY, model: config.MISTRAL_MODEL, baseUrl: config.MISTRAL_BASE_URL });
}
