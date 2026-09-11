import { describe, expect, it } from "vitest";
import { configuredCandidateLocalizationProvider } from "./candidate-localization-gateway.js";
import { ChatCandidateLocalizationProvider, DisabledCandidateLocalizationProvider } from "./candidate-localization.js";

describe("candidate localization AI gateway selection", () => {
  it("selects OpenRouter when FOOD_AI_PROVIDER=openrouter and credentials are present", () => {
    const provider = configuredCandidateLocalizationProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "key", FOOD_AI_MODEL: "some/model:free" });
    expect(provider).toBeInstanceOf(ChatCandidateLocalizationProvider);
    expect(provider.id).toBe("openrouter");
  });

  it("is safely disabled when nothing is configured", () => {
    expect(configuredCandidateLocalizationProvider({})).toBeInstanceOf(DisabledCandidateLocalizationProvider);
  });

  it("12. candidate localization fails over to Groq end-to-end when OpenRouter 429s", async () => {
    let openRouterCalls = 0;
    let groqCalls = 0;
    const fetchImpl = (async (url: string) => {
      if (String(url).includes("groq.com")) {
        groqCalls++;
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ items: [{ id: "0", displayName: "Marhahúsleves" }] }) } }] }));
      }
      openRouterCalls++;
      return new Response("rate limited", { status: 429 });
    }) as typeof fetch;

    const provider = configuredCandidateLocalizationProvider(
      { FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key" },
      { fetchImpl }
    );
    const result = await provider.localize([{ id: "0", authoritativeName: "Beef broth" }], "hu");

    expect(openRouterCalls).toBe(1);
    expect(groqCalls).toBe(1);
    expect(result.get("0")).toBe("Marhahúsleves");
    expect(provider.id).toBe("groq");
  });

  it("candidate localization stays disabled-safe (returns unlocalized candidates, never throws) when both providers fail", async () => {
    const fetchImpl = (async () => new Response("down", { status: 503 })) as typeof fetch;
    const provider = configuredCandidateLocalizationProvider(
      { FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key" },
      { fetchImpl }
    );
    await expect(provider.localize([{ id: "0", authoritativeName: "Beef broth" }], "hu")).resolves.toEqual(new Map());
  });

  // Owner-beta performance blocker (2026-09-12): benchmark evidence (114
  // calls) showed Groq succeeding 100% of localization attempts vs
  // OpenRouter's 0% (every OpenRouter localization call degraded to empty
  // in the live benchmark). FOOD_AI_PROVIDER="groq" makes Groq primary with
  // OpenRouter as the automatic failover.
  describe("Groq as primary (FOOD_AI_PROVIDER=groq)", () => {
    it("selects Groq when FOOD_AI_PROVIDER=groq and credentials are present", () => {
      const provider = configuredCandidateLocalizationProvider({ FOOD_AI_PROVIDER: "groq", GROQ_API_KEY: "groq-key" });
      expect(provider).toBeInstanceOf(ChatCandidateLocalizationProvider);
      expect(provider.id).toBe("groq");
    });

    it("is safely disabled when Groq is selected but the key is missing", () => {
      expect(configuredCandidateLocalizationProvider({ FOOD_AI_PROVIDER: "groq" })).toBeInstanceOf(DisabledCandidateLocalizationProvider);
    });

    it("candidate localization fails over to OpenRouter end-to-end when Groq 429s", async () => {
      let groqCalls = 0;
      let openRouterCalls = 0;
      const fetchImpl = (async (url: string) => {
        if (String(url).includes("openrouter.ai")) {
          openRouterCalls++;
          return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ items: [{ id: "0", displayName: "Marhahúsleves" }] }) } }] }));
        }
        groqCalls++;
        return new Response("rate limited", { status: 429 });
      }) as typeof fetch;

      const provider = configuredCandidateLocalizationProvider(
        { FOOD_AI_PROVIDER: "groq", GROQ_API_KEY: "groq-key", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free" },
        { fetchImpl }
      );
      const result = await provider.localize([{ id: "0", authoritativeName: "Beef broth" }], "hu");

      expect(groqCalls).toBe(1);
      expect(openRouterCalls).toBe(1);
      expect(result.get("0")).toBe("Marhahúsleves");
      expect(provider.id).toBe("openrouter");
    });
  });
});
