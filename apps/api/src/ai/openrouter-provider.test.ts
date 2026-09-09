import { describe, expect, it, vi } from "vitest";
import { AiProviderError } from "./chat-completions-provider.js";
import { OpenRouterAiProvider } from "./openrouter-provider.js";

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

function provider(fetchImpl: typeof fetch, overrides: Partial<ConstructorParameters<typeof OpenRouterAiProvider>[0]> = {}) {
  return new OpenRouterAiProvider({ apiKey: "test-secret", model: "some/free-model:free", fetchImpl, ...overrides });
}

describe("OpenRouter food-NLP provider", () => {
  it("uses the OpenRouter chat-completions endpoint and forwards optional identification headers", async () => {
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const result = await provider(request as typeof fetch, { appReferer: "https://ketomentor.example", appTitle: "Keto Mentor" })
      .run("food_nlp", { text: "a handful of peanuts" });
    expect(result).toEqual(validUnderstanding);
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toBe("https://openrouter.ai/api/v1/chat/completions");
    const headers = init?.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer test-secret");
    expect(headers["HTTP-Referer"]).toBe("https://ketomentor.example");
    expect(headers["X-Title"]).toBe("Keto Mentor");
    expect(JSON.stringify(init?.body)).not.toContain("test-secret");
  });

  it("defaults to a larger max_tokens ceiling to survive reasoning-model overhead", async () => {
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    await provider(request as typeof fetch).run("food_nlp", { text: "a handful of peanuts" });
    const body = JSON.parse(String(request.mock.calls[0][1]?.body));
    expect(body.max_tokens).toBeGreaterThanOrEqual(3000);
  });

  it("accepts JSON wrapped in a markdown code fence, a common free-model deviation from response_format", async () => {
    const request = vi.fn(async () => completion("```json\n" + JSON.stringify(validUnderstanding) + "\n```"));
    const result = await provider(request as typeof fetch).run("food_nlp", { text: "a handful of peanuts" });
    expect(result).toEqual(validUnderstanding);
  });

  it("fails closed when content is null (model exhausted its token budget on internal reasoning)", async () => {
    const request = vi.fn(async () => completion(null as unknown as string));
    await expect(provider(request as typeof fetch).run("food_nlp", { text: "a handful of peanuts" }))
      .rejects.toMatchObject({ code: "invalid_response" });
  });

  it("returns a sanitized error for a 5xx upstream failure without exposing the body, but keeps the plain status code for diagnostics", async () => {
    const request = vi.fn(async () => new Response("upstream secret detail", { status: 503 }));
    await expect(provider(request as typeof fetch).run("food_nlp", { text: "meal input" })).rejects.toEqual(new AiProviderError("http_error", 503));
  });

  it("returns a sanitized error for a 429 rate limit without exposing the body, but keeps the plain status code for diagnostics", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ error: { message: "rate limited", code: 429 } }), { status: 429 }));
    await expect(provider(request as typeof fetch).run("food_nlp", { text: "meal input" })).rejects.toEqual(new AiProviderError("http_error", 429));
  });

  it("rejects malformed JSON safely", async () => {
    await expect(provider((async () => completion("not json")) as typeof fetch).run("food_nlp", { text: "meal input" }))
      .rejects.toMatchObject({ code: "invalid_response" });
  });
});
