import { describe, expect, it, vi } from "vitest";
import { AiProviderError } from "./chat-completions-provider.js";
import { GroqAiProvider } from "./groq-provider.js";

const validUnderstanding = {
  language: "en",
  kind: "single_food",
  items: [{ originalText: "peanuts", canonicalName: "peanuts", unit: "handful", quantity: 1, evidence: "explicit", confidence: 0.9 }],
  clarificationNeeded: false,
  confidence: 0.9
};

function completion(content: string, init?: ResponseInit) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { "content-type": "application/json" }, ...init });
}

function provider(fetchImpl: typeof fetch, overrides: Partial<ConstructorParameters<typeof GroqAiProvider>[0]> = {}) {
  return new GroqAiProvider({ apiKey: "test-secret", model: "openai/gpt-oss-20b", fetchImpl, ...overrides });
}

describe("Groq food-NLP provider", () => {
  it("uses Groq's OpenAI-compatible chat-completions endpoint", async () => {
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const result = await provider(request as typeof fetch).run("food_nlp", { text: "a handful of peanuts" });
    expect(result).toEqual(validUnderstanding);
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toBe("https://api.groq.com/openai/v1/chat/completions");
    const headers = init?.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer test-secret");
    expect(JSON.stringify(init?.body)).not.toContain("test-secret");
  });

  it("reports its own id distinctly from openrouter/mistral", () => {
    expect(provider((async () => completion("{}")) as typeof fetch).id).toBe("groq");
  });

  it("defaults max_tokens with headroom for an internal reasoning trace", async () => {
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    await provider(request as typeof fetch).run("food_nlp", { text: "a handful of peanuts" });
    const body = JSON.parse(String(request.mock.calls[0][1]?.body));
    expect(body.max_tokens).toBeGreaterThanOrEqual(2000);
  });

  it("returns a sanitized error for a 5xx upstream failure, keeping the plain status code for diagnostics", async () => {
    const request = vi.fn(async () => new Response("upstream secret detail", { status: 503 }));
    await expect(provider(request as typeof fetch).run("food_nlp", { text: "meal input" })).rejects.toEqual(new AiProviderError("http_error", 503));
  });

  it("returns a sanitized error for a 429 rate limit, keeping the plain status code for diagnostics", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 }));
    await expect(provider(request as typeof fetch).run("food_nlp", { text: "meal input" })).rejects.toEqual(new AiProviderError("http_error", 429));
  });

  it("rejects malformed JSON safely", async () => {
    await expect(provider((async () => completion("not json")) as typeof fetch).run("food_nlp", { text: "meal input" }))
      .rejects.toMatchObject({ code: "invalid_response" });
  });
});
