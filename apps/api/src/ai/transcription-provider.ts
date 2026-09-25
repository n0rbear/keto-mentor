// Speech-to-text for voice food entry (2026-09-23). Structurally identical
// trust boundary to every other AI capability in this codebase: the
// transcript is TEXT ONLY, fed into the SAME existing meal-input
// interpretation/resolution pipeline as typed text — this module never
// itself decides food identity or nutrition, and never sees or stores
// anything beyond one short audio buffer for the duration of one request.
//
// A dedicated transport (not ChatCompletionsProvider): OpenAI's
// transcription endpoint is a multipart/form-data upload to
// /v1/audio/transcriptions, a fundamentally different shape from the JSON
// chat-completions body every other provider in ./  talks to — reusing that
// transport was not possible, so this is a new, narrow, single-purpose one.

export type TranscriptionResult = { text: string; language?: string };

export class TranscriptionProviderError extends Error {
  constructor(readonly code: "timeout" | "http_error" | "invalid_response" | "response_too_large" | "empty_audio", readonly httpStatus?: number) {
    super(code);
    this.name = "TranscriptionProviderError";
  }
}

export interface TranscriptionProvider {
  readonly id: string;
  transcribe(input: { audio: Buffer; mimeType: string; language?: string }, signal?: AbortSignal): Promise<TranscriptionResult>;
}

export class DisabledTranscriptionProvider implements TranscriptionProvider {
  readonly id = "disabled";
  async transcribe(): Promise<TranscriptionResult> {
    throw new TranscriptionProviderError("http_error");
  }
}

export type OpenAiTranscriptionProviderOptions = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  fetchImpl?: typeof fetch;
};

const DEFAULT_MODEL = "gpt-4o-mini-transcribe";
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_RESPONSE_BYTES = 64 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "mp4", "audio/m4a": "m4a",
  "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav"
};

function audioFileName(mimeType: string): string {
  const bare = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  return `voice.${EXTENSION_BY_MIME[bare] ?? "webm"}`;
}

async function boundedText(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new TranscriptionProviderError("response_too_large");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) { await reader.cancel(); throw new TranscriptionProviderError("response_too_large"); }
    chunks.push(value);
  }
  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}

function transcriptionUrl(baseUrl: string): string {
  const parsed = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (parsed.username || parsed.password) throw new Error("Transcription base URL must not contain credentials");
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("Transcription base URL must use HTTPS");
  }
  return new URL("v1/audio/transcriptions", parsed).toString();
}

// Short food-log context in the transcription language: biases spelling of
// food words and units. Without a language, all three are listed.
const TRANSCRIPTION_PROMPTS: Record<string, string> = {
  hu: "Ételnapló, magyarul: 2 tojás, 100 g túró, egy tányér gulyásleves, só ízlés szerint.",
  de: "Essenstagebuch, auf Deutsch: 2 Eier, 100 g Quark, ein Teller Gulaschsuppe, Salz nach Geschmack.",
  en: "Food log, in English: 2 eggs, 100 g cottage cheese, a bowl of goulash soup, salt to taste."
};
export function transcriptionPrompt(language?: string): string {
  if (language && TRANSCRIPTION_PROMPTS[language]) return TRANSCRIPTION_PROMPTS[language];
  return Object.values(TRANSCRIPTION_PROMPTS).join(" ");
}

/**
 * OpenAI speech-to-text. Audio always flows browser -> this backend ->
 * OpenAI, using the server's own OPENAI_API_KEY (same env var the existing
 * OpenAI food-AI benchmark provider already reads, see ai/openai-provider.ts
 * and config.ts) — the key never reaches the browser. `language` (the
 * page's UI language) is sent as OpenAI's binding `language` field.
 */
export class OpenAiTranscriptionProvider implements TranscriptionProvider {
  readonly id = "openai";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly url: string;
  private readonly timeoutMs: number;
  private readonly maxResponseBytes: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenAiTranscriptionProviderOptions) {
    if (!options.apiKey.trim()) throw new Error("Transcription provider API key is required");
    this.apiKey = options.apiKey;
    this.model = options.model?.trim() || DEFAULT_MODEL;
    this.url = transcriptionUrl(options.baseUrl ?? "https://api.openai.com/");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxResponseBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async transcribe(input: { audio: Buffer; mimeType: string; language?: string }, signal?: AbortSignal): Promise<TranscriptionResult> {
    if (!input.audio.byteLength) throw new TranscriptionProviderError("empty_audio");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const onExternalAbort = () => controller.abort();
    signal?.addEventListener("abort", onExternalAbort);
    try {
      const form = new FormData();
      form.append("model", this.model);
      // Category-only, never the transcript itself — see this file's own
      // doc for why raw audio/transcript content is never logged.
      form.append("file", new Blob([new Uint8Array(input.audio)], { type: input.mimeType }), audioFileName(input.mimeType));
      // The page's current UI language is FORCED (owner decision,
      // 2026-09-25): OpenAI's `language` field is binding, so a Hungarian
      // page always transcribes Hungarian. Auto-detection misread short
      // Hungarian food phrases. The prompt is in the same language.
      if (input.language) form.append("language", input.language);
      form.append("prompt", transcriptionPrompt(input.language));
      const response = await this.fetchImpl(this.url, {
        method: "POST",
        headers: { authorization: `Bearer ${this.apiKey}` },
        body: form,
        signal: controller.signal
      });
      const body = await boundedText(response, this.maxResponseBytes);
      if (!response.ok) throw new TranscriptionProviderError("http_error", response.status);
      let parsed: unknown;
      try { parsed = JSON.parse(body); } catch { throw new TranscriptionProviderError("invalid_response"); }
      const text = (parsed as { text?: unknown } | null)?.text;
      if (typeof text !== "string") throw new TranscriptionProviderError("invalid_response");
      const language = (parsed as { language?: unknown }).language;
      return { text: text.trim(), language: typeof language === "string" ? language : undefined };
    } catch (error) {
      if (error instanceof TranscriptionProviderError) throw error;
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) throw new TranscriptionProviderError("timeout");
      throw new TranscriptionProviderError("http_error");
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onExternalAbort);
    }
  }
}
