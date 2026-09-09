import { describe, expect, it } from "vitest";
import { configuredSearchIntentProvider } from "./search-intent-gateway.js";
import { ChatSearchIntentProvider, DisabledSearchIntentProvider } from "./search-intent.js";

describe("search intent AI gateway selection", () => {
  it("selects OpenRouter when FOOD_AI_PROVIDER=openrouter and credentials are present", () => {
    const provider = configuredSearchIntentProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "key", FOOD_AI_MODEL: "some/model:free" });
    expect(provider).toBeInstanceOf(ChatSearchIntentProvider);
    expect(provider.id).toBe("openrouter");
  });

  it("is safely disabled when nothing is configured", () => {
    expect(configuredSearchIntentProvider({})).toBeInstanceOf(DisabledSearchIntentProvider);
  });

  it("10. search-intent generation fails over to Groq end-to-end when OpenRouter 429s", async () => {
    let openRouterCalls = 0;
    let groqCalls = 0;
    const validIntent = { canonicalConcept: "beef broth", searchTerms: ["beef broth"], sourceLanguage: "hu" as const };
    const fetchImpl = (async (url: string) => {
      if (String(url).includes("groq.com")) {
        groqCalls++;
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validIntent) } }] }));
      }
      openRouterCalls++;
      return new Response("rate limited", { status: 429 });
    }) as typeof fetch;

    const provider = configuredSearchIntentProvider(
      { FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key" },
      { fetchImpl }
    );
    const result = await provider.generate({ foodQuery: "marhahusleves" });

    expect(openRouterCalls).toBe(1);
    expect(groqCalls).toBe(1);
    expect(result).toEqual(validIntent);
    // Provenance must honestly reflect Groq having served this call.
    expect(provider.id).toBe("groq");
  });

  it("search-intent stays disabled-safe (returns null, never throws) when both OpenRouter and Groq fail", async () => {
    const fetchImpl = (async () => new Response("down", { status: 503 })) as typeof fetch;
    const provider = configuredSearchIntentProvider(
      { FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key" },
      { fetchImpl }
    );
    await expect(provider.generate({ foodQuery: "marhahusleves" })).resolves.toBeNull();
  });
});
