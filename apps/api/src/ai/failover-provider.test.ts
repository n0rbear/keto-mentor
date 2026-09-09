import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AiProviderError } from "./chat-completions-provider.js";
import { OpenRouterAiProvider } from "./openrouter-provider.js";
import { GroqAiProvider } from "./groq-provider.js";
import { FailoverAiProvider, isRecoverableAiFailure } from "./failover-provider.js";

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

function openRouter(fetchImpl: typeof fetch, timeoutMs?: number) {
  return new OpenRouterAiProvider({ apiKey: "or-secret", model: "or-model", fetchImpl, timeoutMs });
}

function groq(fetchImpl: typeof fetch) {
  return new GroqAiProvider({ apiKey: "groq-secret", model: "groq-model", fetchImpl });
}

// A fetch stub that never settles on its own but properly rejects with an
// AbortError once the caller's AbortController fires — mirrors real fetch's
// abort behavior so ChatCompletionsProvider's timeout path can be exercised
// quickly and deterministically instead of hanging or needing a real clock.
function abortAwareFetch(): typeof fetch {
  return (async (_url, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    });
  })) as typeof fetch;
}

describe("AI provider failover (OpenRouter -> Groq)", () => {
  it("1. primary success: the secondary receives zero calls", async () => {
    const primaryFetch = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const secondaryFetch = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), groq(secondaryFetch as typeof fetch));
    const result = await failover.run("food_nlp", { text: "peanuts" });
    expect(result).toEqual(validUnderstanding);
    expect(primaryFetch).toHaveBeenCalledTimes(1);
    expect(secondaryFetch).not.toHaveBeenCalled();
    expect(failover.id).toBe("openrouter");
  });

  it("2. primary 429: the secondary is called exactly once and its result is used", async () => {
    const primaryFetch = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const secondaryFetch = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), groq(secondaryFetch as typeof fetch));
    const result = await failover.run("food_nlp", { text: "peanuts" });
    expect(result).toEqual(validUnderstanding);
    expect(primaryFetch).toHaveBeenCalledTimes(1);
    expect(secondaryFetch).toHaveBeenCalledTimes(1);
    expect(failover.id).toBe("groq");
  });

  it("3. primary timeout: falls over to the secondary", async () => {
    const secondaryFetch = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const failover = new FailoverAiProvider(openRouter(abortAwareFetch(), 5), groq(secondaryFetch as typeof fetch));
    const result = await failover.run("food_nlp", { text: "peanuts" });
    expect(result).toEqual(validUnderstanding);
    expect(secondaryFetch).toHaveBeenCalledTimes(1);
    expect(failover.id).toBe("groq");
  });

  it("4. transient primary 5xx: falls over to the secondary", async () => {
    const primaryFetch = vi.fn(async () => new Response("outage", { status: 503 }));
    const secondaryFetch = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), groq(secondaryFetch as typeof fetch));
    const result = await failover.run("food_nlp", { text: "peanuts" });
    expect(result).toEqual(validUnderstanding);
    expect(secondaryFetch).toHaveBeenCalledTimes(1);
  });

  it("5. Groq success returns a valid structured result", async () => {
    const primaryFetch = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const secondaryFetch = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), groq(secondaryFetch as typeof fetch));
    await expect(failover.run("food_nlp", { text: "peanuts" })).resolves.toEqual(validUnderstanding);
  });

  it("6. both providers fail: the error propagates to the caller's existing safe fallback (never a fabricated result)", async () => {
    const primaryFetch = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const secondaryFetch = vi.fn(async () => new Response("also down", { status: 503 }));
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), groq(secondaryFetch as typeof fetch));
    await expect(failover.run("food_nlp", { text: "peanuts" })).rejects.toEqual(new AiProviderError("http_error", 503));
    expect(primaryFetch).toHaveBeenCalledTimes(1);
    expect(secondaryFetch).toHaveBeenCalledTimes(1);
  });

  it("7. malformed Groq output fails safely instead of being accepted", async () => {
    const primaryFetch = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const secondaryFetch = vi.fn(async () => completion("not json"));
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), groq(secondaryFetch as typeof fetch));
    await expect(failover.run("food_nlp", { text: "peanuts" })).rejects.toMatchObject({ code: "invalid_response" });
    expect(secondaryFetch).toHaveBeenCalledTimes(1);
  });

  it("8. Groq cannot inject a field the caller's schema forbids (e.g. a nutrition value)", async () => {
    const forbiddenSchema = z.object({ gramsPerUnit: z.number() }).strict();
    const primaryFetch = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const secondaryFetch = vi.fn(async () => completion(JSON.stringify({ gramsPerUnit: 30, kcalPer100g: 999 })));
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), groq(secondaryFetch as typeof fetch));
    await expect(failover.complete("instruction", "input", (value) => forbiddenSchema.parse(value))).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("9. at most one attempt per provider per logical operation — no retry storms across repeated calls", async () => {
    const primaryFetch = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const secondaryFetch = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), groq(secondaryFetch as typeof fetch));
    await failover.run("food_nlp", { text: "peanuts" });
    await failover.run("food_nlp", { text: "peanuts" });
    expect(primaryFetch).toHaveBeenCalledTimes(2);
    expect(secondaryFetch).toHaveBeenCalledTimes(2);
  });

  it("without a secondary configured, a recoverable primary failure still propagates (no crash, no invented secondary)", async () => {
    const primaryFetch = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), undefined);
    await expect(failover.run("food_nlp", { text: "peanuts" })).rejects.toEqual(new AiProviderError("http_error", 429));
  });

  it("never leaks either provider's API key through a failed failover", async () => {
    const primaryFetch = vi.fn(async () => { throw new Error("openrouter-secret-key leaked"); });
    const secondaryFetch = vi.fn(async () => { throw new Error("groq-secret-key leaked"); });
    const failover = new FailoverAiProvider(openRouter(primaryFetch as typeof fetch), groq(secondaryFetch as typeof fetch));
    let error: unknown;
    try { await failover.run("food_nlp", { text: "peanuts" }); } catch (caught) { error = caught; }
    expect(JSON.stringify(error)).not.toContain("secret-key");
    expect(String(error)).not.toContain("secret-key");
  });

  it.each([
    ["429 rate limit", new AiProviderError("http_error", 429), true],
    ["500 upstream error", new AiProviderError("http_error", 500), true],
    ["503 upstream outage", new AiProviderError("http_error", 503), true],
    ["network failure with no response", new AiProviderError("http_error", undefined), true],
    ["timeout", new AiProviderError("timeout"), true],
    ["400 bad request (configuration, not transient)", new AiProviderError("http_error", 400), false],
    ["401 unauthorized (configuration, not transient)", new AiProviderError("http_error", 401), false],
    ["invalid_response (this provider's own bad output)", new AiProviderError("invalid_response"), false],
    ["response_too_large", new AiProviderError("response_too_large"), false],
    ["unsupported_capability", new AiProviderError("unsupported_capability"), false],
    ["a non-AiProviderError", new Error("boom"), false]
  ])("classifies recoverability correctly: %s", (_label, error, expected) => {
    expect(isRecoverableAiFailure(error)).toBe(expected);
  });
});
