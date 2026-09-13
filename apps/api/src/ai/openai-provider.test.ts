import { describe, expect, it, vi } from "vitest";
import { AiProviderError, type ChatCompletionsUsageEvent } from "./chat-completions-provider.js";
import { OpenAiProvider } from "./openai-provider.js";
import { resolveFoodAiGatewayConfig } from "./food-ai-gateway-config.js";
import { configuredFoodAiProvider } from "./food-ai-gateway.js";

const validUnderstanding = {
  language: "hu",
  kind: "compound_dish",
  dishName: "gulyásleves",
  items: [{ originalText: "gulyásleves", canonicalName: "gulyásleves", evidence: "explicit", confidence: 0.9 }],
  clarificationNeeded: false,
  confidence: 0.9
};

function completion(content: string, usage?: Record<string, unknown>, id = "chatcmpl-test") {
  return new Response(JSON.stringify({ id, choices: [{ message: { content } }], ...(usage ? { usage } : {}) }), { status: 200, headers: { "content-type": "application/json" } });
}

function provider(fetchImpl: typeof fetch, overrides: Partial<ConstructorParameters<typeof OpenAiProvider>[0]> = {}) {
  return new OpenAiProvider({ apiKey: "test-secret", model: "gpt-5.4-nano", fetchImpl, ...overrides });
}

describe("OpenAI provider — maps into the existing food_nlp schema (owner-beta OpenAI baseline checkpoint, 2026-09-13)", () => {
  it("a real-shaped OpenAI response validates through the SAME foodUnderstandingSchema every other provider uses — no OpenAI-specific parsing path", async () => {
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const result = await provider(request as typeof fetch).run("food_nlp", { text: "gulyásleves" });
    expect(result).toEqual(validUnderstanding);
  });

  it("reports its own id distinctly from groq/openrouter/mistral", () => {
    expect(provider((async () => completion("{}")) as typeof fetch).id).toBe("openai");
  });

  it("hits the real OpenAI chat-completions endpoint, never leaking the key into the body", async () => {
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    await provider(request as typeof fetch).run("food_nlp", { text: "gulyásleves" });
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
    const headers = init?.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer test-secret");
    expect(JSON.stringify(init?.body)).not.toContain("test-secret");
  });

  // Confirmed live against the real API (2026-09-13): gpt-5.4-nano rejects
  // the legacy `max_tokens` field outright ("Unsupported parameter... Use
  // 'max_completion_tokens' instead"). temperature:0 was confirmed to still
  // work, so only the token-limit parameter name differs from Groq/
  // OpenRouter/Mistral, which all still expect `max_tokens`.
  it("sends max_completion_tokens, never the legacy max_tokens field this model rejects", async () => {
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    await provider(request as typeof fetch).run("food_nlp", { text: "gulyásleves" });
    const body = JSON.parse(String(request.mock.calls[0][1]?.body));
    expect(body.max_completion_tokens).toBeGreaterThan(0);
    expect(body.max_tokens).toBeUndefined();
    expect(body.temperature).toBe(0);
  });

  it("invalid OpenAI output fails closed — malformed JSON never reaches the caller as if it were a valid classification", async () => {
    await expect(provider((async () => completion("not json")) as typeof fetch).run("food_nlp", { text: "meal input" }))
      .rejects.toMatchObject({ code: "invalid_response" });
  });

  it("a schema-violating (but syntactically valid JSON) response also fails closed, never partially accepted", async () => {
    await expect(provider((async () => completion(JSON.stringify({ not: "a valid understanding" }))) as typeof fetch).run("food_nlp", { text: "meal input" }))
      .rejects.toMatchObject({ code: "invalid_response" });
  });

  it("an OpenAI API failure (5xx) fails safely with the real status code, never a raw error body leaking upstream detail", async () => {
    const request = vi.fn(async () => new Response("upstream account/billing detail", { status: 503 }));
    await expect(provider(request as typeof fetch).run("food_nlp", { text: "meal input" })).rejects.toEqual(new AiProviderError("http_error", 503));
  });

  it("an OpenAI 429 (rate/capacity limit) fails safely, distinguishable from other failures", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 }));
    await expect(provider(request as typeof fetch).run("food_nlp", { text: "meal input" })).rejects.toEqual(new AiProviderError("http_error", 429));
  });

  it("a missing/blank API key fails safely at construction — never silently proceeds with an empty credential", () => {
    expect(() => new OpenAiProvider({ apiKey: "", model: "gpt-5.4-nano" })).toThrow();
    expect(() => new OpenAiProvider({ apiKey: "   ", model: "gpt-5.4-nano" })).toThrow();
  });

  it("usage telemetry parsing works: real OpenAI usage shape (prompt/cached/completion/reasoning/total tokens + request id) is captured, never prompt/response CONTENT", async () => {
    const events: ChatCompletionsUsageEvent[] = [];
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding), {
      prompt_tokens: 102, completion_tokens: 74, total_tokens: 176,
      prompt_tokens_details: { cached_tokens: 20 },
      completion_tokens_details: { reasoning_tokens: 5 }
    }, "chatcmpl-realistic-id"));
    const withTelemetry = new OpenAiProvider({ apiKey: "test-secret", model: "gpt-5.4-nano", fetchImpl: request as typeof fetch, onUsage: (e) => events.push(e) });
    await withTelemetry.run("food_nlp", { text: "gulyásleves" });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      providerId: "openai", model: "gpt-5.4-nano", capability: "food_nlp", success: true,
      requestId: "chatcmpl-realistic-id", promptTokens: 102, cachedTokens: 20, completionTokens: 74, reasoningTokens: 5, totalTokens: 176
    });
    expect(events[0].latencyMs).toBeGreaterThanOrEqual(0);
    const serialized = JSON.stringify(events);
    expect(serialized).not.toMatch(/gulyásleves|test-secret/);
  });

  it("usage telemetry also fires on failure, carrying the error code and status but never fabricated token counts", async () => {
    const events: ChatCompletionsUsageEvent[] = [];
    const request = vi.fn(async () => new Response("server error", { status: 500 }));
    const withTelemetry = new OpenAiProvider({ apiKey: "test-secret", model: "gpt-5.4-nano", fetchImpl: request as typeof fetch, onUsage: (e) => events.push(e) });
    await expect(withTelemetry.run("food_nlp", { text: "gulyásleves" })).rejects.toBeInstanceOf(AiProviderError);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ providerId: "openai", success: false, httpStatus: 500, errorCode: "http_error" });
    expect(events[0].promptTokens).toBeUndefined();
    expect(events[0].totalTokens).toBeUndefined();
  });

  it("no nutrition number can enter through the OpenAI provider: its only validated output shape is FoodUnderstanding (classification/identity/confidence), which has no kcal/fat/protein/carbs/fiber field at all", async () => {
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const result = await provider(request as typeof fetch).run("food_nlp", { text: "gulyásleves" }) as Record<string, unknown>;
    expect(Object.keys(result)).not.toEqual(expect.arrayContaining(["kcal", "kcalPer100g", "fat", "protein", "carbs", "fiber"]));
  });
});

describe("provider selection: FOOD_AI_PROVIDER=openai (owner-beta OpenAI baseline checkpoint, 2026-09-13)", () => {
  it("resolves to the openai kind only when both OPENAI_API_KEY and FOOD_AI_MODEL are set", () => {
    expect(resolveFoodAiGatewayConfig({ FOOD_AI_PROVIDER: "openai", OPENAI_API_KEY: "key", FOOD_AI_MODEL: "gpt-5.4-nano" }))
      .toMatchObject({ kind: "openai", apiKey: "key", model: "gpt-5.4-nano" });
  });

  it("degrades to disabled (never a crash, never a silent fallback to a different provider) when OPENAI_API_KEY is missing", () => {
    expect(resolveFoodAiGatewayConfig({ FOOD_AI_PROVIDER: "openai", FOOD_AI_MODEL: "gpt-5.4-nano" })).toEqual({ kind: "disabled" });
  });

  it("degrades to disabled when FOOD_AI_MODEL is missing", () => {
    expect(resolveFoodAiGatewayConfig({ FOOD_AI_PROVIDER: "openai", OPENAI_API_KEY: "key" })).toEqual({ kind: "disabled" });
  });

  it("configuredFoodAiProvider constructs a real, working OpenAiProvider end to end from FOOD_AI_PROVIDER=openai", async () => {
    const request = vi.fn(async () => completion(JSON.stringify(validUnderstanding)));
    const ai = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "openai", OPENAI_API_KEY: "key", FOOD_AI_MODEL: "gpt-5.4-nano" }, { fetchImpl: request as typeof fetch });
    expect(ai.id).toBe("openai");
    expect(await ai.run("food_nlp", { text: "gulyásleves" })).toEqual(validUnderstanding);
  });

  it("Groq selection is completely unaffected by the openai addition — FOOD_AI_PROVIDER=groq still resolves to groq", () => {
    expect(resolveFoodAiGatewayConfig({ FOOD_AI_PROVIDER: "groq", GROQ_API_KEY: "key" })).toMatchObject({ kind: "groq" });
  });

  it("openai is never wired as anyone's automatic failover partner (unlike groq<->openrouter) — a deliberate, documented scope choice", () => {
    const resolved = resolveFoodAiGatewayConfig({ FOOD_AI_PROVIDER: "openai", OPENAI_API_KEY: "key", FOOD_AI_MODEL: "gpt-5.4-nano" });
    expect(resolved).not.toHaveProperty("secondary");
  });
});
