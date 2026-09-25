import { describe, expect, it, vi } from "vitest";
import { DisabledTranscriptionProvider, OpenAiTranscriptionProvider, transcriptionPrompt, TranscriptionProviderError } from "./transcription-provider.js";

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  const text = JSON.stringify(body);
  return {
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    headers: { get: (key: string) => init.headers?.[key.toLowerCase()] ?? null },
    body: {
      getReader: () => {
        let done = false;
        return {
          read: async () => {
            if (done) return { done: true, value: undefined };
            done = true;
            return { done: false, value: new TextEncoder().encode(text) };
          },
          cancel: async () => {}
        };
      }
    }
  } as unknown as Response;
}

describe("DisabledTranscriptionProvider", () => {
  it("always throws, never silently returns fabricated text", async () => {
    await expect(new DisabledTranscriptionProvider().transcribe({ audio: Buffer.from("x"), mimeType: "audio/webm" })).rejects.toThrow();
  });
});

describe("OpenAiTranscriptionProvider", () => {
  it("requires a non-empty API key", () => {
    expect(() => new OpenAiTranscriptionProvider({ apiKey: "" })).toThrow();
  });

  it("rejects empty audio without making a network call", async () => {
    const fetchImpl = vi.fn();
    const provider = new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: fetchImpl as any });
    await expect(provider.transcribe({ audio: Buffer.alloc(0), mimeType: "audio/webm" })).rejects.toThrow(TranscriptionProviderError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts multipart form data with model/file/language/prompt, never leaking the API key into the body", async () => {
    let capturedInit: any;
    const fetchImpl = vi.fn(async (_url: string, init: any) => { capturedInit = init; return jsonResponse({ text: "200 gramm csirkemell", language: "hu" }); });
    const provider = new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: fetchImpl as any });
    const result = await provider.transcribe({ audio: Buffer.from("fake-audio-bytes"), mimeType: "audio/webm", language: "hu" });
    expect(result).toEqual({ text: "200 gramm csirkemell", language: "hu" });
    expect(capturedInit.headers.authorization).toBe("Bearer sk-test");
    expect(capturedInit.body).toBeInstanceOf(FormData);
    expect(capturedInit.body.get("model")).toBe("gpt-4o-mini-transcribe");
    // The page language is binding: a Hungarian page transcribes Hungarian.
    expect(capturedInit.body.get("language")).toBe("hu");
    expect(capturedInit.body.get("prompt")).toMatch(/^Ételnapló/);
    expect(capturedInit.body.get("file")).toBeInstanceOf(Blob);
  });

  it("omits the language field entirely when no hint is given — auto-detection, never a forced language", async () => {
    let capturedInit: any;
    const fetchImpl = vi.fn(async (_url: string, init: any) => { capturedInit = init; return jsonResponse({ text: "two eggs" }); });
    const provider = new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: fetchImpl as any });
    await provider.transcribe({ audio: Buffer.from("fake-audio-bytes"), mimeType: "audio/webm" });
    expect(capturedInit.body.has("language")).toBe(false);
    expect(capturedInit.body.get("prompt")).toContain("Essenstagebuch");
    expect(capturedInit.body.get("prompt")).toContain("Ételnapló");
  });

  it("uses a prompt in the page language, or all three languages when none is given", () => {
    expect(transcriptionPrompt("hu")).toMatch(/^Ételnapló/);
    expect(transcriptionPrompt("hu")).not.toContain("Essenstagebuch");
    expect(transcriptionPrompt("de")).toMatch(/^Essenstagebuch/);
    for (const language of [undefined, "fr"]) {
      const prompt = transcriptionPrompt(language);
      expect(prompt).toContain("Ételnapló");
      expect(prompt).toContain("Essenstagebuch");
      expect(prompt).toContain("Food log");
    }
  });

  it("uses gpt-4o-mini-transcribe by default and an override model when given", async () => {
    let capturedInit: any;
    const fetchImpl = vi.fn(async (_url: string, init: any) => { capturedInit = init; return jsonResponse({ text: "x" }); });
    await new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: fetchImpl as any }).transcribe({ audio: Buffer.from("a"), mimeType: "audio/webm" });
    expect(capturedInit.body.get("model")).toBe("gpt-4o-mini-transcribe");

    const overridden = new OpenAiTranscriptionProvider({ apiKey: "sk-test", model: "whisper-1", fetchImpl: fetchImpl as any });
    await overridden.transcribe({ audio: Buffer.from("a"), mimeType: "audio/webm" });
    expect(capturedInit.body.get("model")).toBe("whisper-1");
  });

  it("maps an HTTP error to a typed, provider-message-free error", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: { message: "upstream secret detail" } }, { status: 429 }));
    const provider = new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: fetchImpl as any });
    try {
      await provider.transcribe({ audio: Buffer.from("a"), mimeType: "audio/webm" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(TranscriptionProviderError);
      expect((error as TranscriptionProviderError).code).toBe("http_error");
      expect((error as TranscriptionProviderError).httpStatus).toBe(429);
      expect((error as Error).message).not.toContain("upstream secret detail");
    }
  });

  it("maps a timeout/abort to a typed timeout error", async () => {
    const fetchImpl = vi.fn((_url: string, init: any) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
    }));
    const provider = new OpenAiTranscriptionProvider({ apiKey: "sk-test", timeoutMs: 5, fetchImpl: fetchImpl as any });
    await expect(provider.transcribe({ audio: Buffer.from("a"), mimeType: "audio/webm" })).rejects.toMatchObject({ code: "timeout" });
  });

  it("rejects a response body larger than the configured bound", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ text: "x" }, { headers: { "content-length": String(10 * 1024 * 1024) } }));
    const provider = new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: fetchImpl as any });
    await expect(provider.transcribe({ audio: Buffer.from("a"), mimeType: "audio/webm" })).rejects.toMatchObject({ code: "response_too_large" });
  });

  it("rejects malformed JSON or a response missing a text field", async () => {
    const malformedJson = vi.fn(async () => ({
      ok: true, status: 200, headers: { get: () => null },
      body: { getReader: () => { let d = false; return { read: async () => { if (d) return { done: true }; d = true; return { done: false, value: new TextEncoder().encode("not json") }; }, cancel: async () => {} }; } }
    } as unknown as Response));
    const provider1 = new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: malformedJson as any });
    await expect(provider1.transcribe({ audio: Buffer.from("a"), mimeType: "audio/webm" })).rejects.toMatchObject({ code: "invalid_response" });

    const missingText = vi.fn(async () => jsonResponse({ language: "en" }));
    const provider2 = new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: missingText as any });
    await expect(provider2.transcribe({ audio: Buffer.from("a"), mimeType: "audio/webm" })).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("returns an empty transcript faithfully rather than inventing text", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ text: "" }));
    const provider = new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: fetchImpl as any });
    const result = await provider.transcribe({ audio: Buffer.from("a"), mimeType: "audio/webm" });
    expect(result.text).toBe("");
  });

  it.each([
    ["hu", "200 gramm csirkemell két tojással"],
    ["de", "ein Teller Gulaschsuppe"],
    ["en", "two eggs and 100 grams of bacon"]
  ])("returns the %s transcript verbatim", async (language, text) => {
    const fetchImpl = vi.fn(async () => jsonResponse({ text, language }));
    const provider = new OpenAiTranscriptionProvider({ apiKey: "sk-test", fetchImpl: fetchImpl as any });
    const result = await provider.transcribe({ audio: Buffer.from("a"), mimeType: "audio/webm" });
    expect(result).toEqual({ text, language });
  });

  it("rejects a base URL that isn't HTTPS (except localhost)", () => {
    expect(() => new OpenAiTranscriptionProvider({ apiKey: "sk-test", baseUrl: "http://evil.example/" })).toThrow();
  });
});
