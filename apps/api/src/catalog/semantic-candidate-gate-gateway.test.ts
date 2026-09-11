import { describe, expect, it } from "vitest";
import { configuredSemanticCandidateGateProvider } from "./semantic-candidate-gate-gateway.js";
import { ChatSemanticCandidateGateProvider, DisabledSemanticCandidateGateProvider } from "./semantic-candidate-gate.js";

const validGateOutput = { results: [{ id: "0", relationship: "same_identity" }] };

describe("semantic candidate gate AI gateway selection", () => {
  it("selects OpenRouter when FOOD_AI_PROVIDER=openrouter and credentials are present", () => {
    const provider = configuredSemanticCandidateGateProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "key", FOOD_AI_MODEL: "some/model:free" });
    expect(provider).toBeInstanceOf(ChatSemanticCandidateGateProvider);
    expect(provider.id).toBe("openrouter");
  });

  // Fail-closed by construction — see semantic-candidate-gate.ts — so
  // "safely disabled" here means every candidate is rejected, never that a
  // misconfiguration silently no-ops like every other Disabled* provider.
  it("fails CLOSED (DisabledSemanticCandidateGateProvider) when nothing is configured", () => {
    expect(configuredSemanticCandidateGateProvider({})).toBeInstanceOf(DisabledSemanticCandidateGateProvider);
  });

  it("candidate gate fails over to Groq end-to-end when OpenRouter 429s", async () => {
    let openRouterCalls = 0;
    let groqCalls = 0;
    const fetchImpl = (async (url: string) => {
      if (String(url).includes("groq.com")) {
        groqCalls++;
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validGateOutput) } }] }));
      }
      openRouterCalls++;
      return new Response("rate limited", { status: 429 });
    }) as typeof fetch;

    const provider = configuredSemanticCandidateGateProvider(
      { FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key" },
      { fetchImpl }
    );
    const result = await provider.checkRelevance({ identity: "potato" }, [{ id: "0", authoritativeName: "Potatoes, boiled" }]);

    expect(openRouterCalls).toBe(1);
    expect(groqCalls).toBe(1);
    expect(result.get("0")).toBe(true);
    expect(provider.id).toBe("groq");
  });

  it("candidate gate stays fail-CLOSED (empty map, every candidate rejected) when both providers fail", async () => {
    const fetchImpl = (async () => new Response("down", { status: 503 })) as typeof fetch;
    const provider = configuredSemanticCandidateGateProvider(
      { FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key" },
      { fetchImpl }
    );
    const result = await provider.checkRelevance({ identity: "potato" }, [{ id: "0", authoritativeName: "Potatoes, boiled" }]);
    expect(result.size).toBe(0);
  });

  // Owner-beta performance blocker (2026-09-12): a controlled benchmark (5
  // identity-boundary pairs x 3 attempts) found OpenRouter's semantic gate
  // call degraded to its own fail-closed empty map on 12 of 15 multi-
  // candidate attempts (potato/almond/milk/pork) — never wrong, but
  // functionally unusable — while Groq answered every single case
  // correctly (15/15). FOOD_AI_PROVIDER="groq" makes Groq primary with
  // OpenRouter as the automatic failover; the gate's own fail-closed
  // safety design (semantic-candidate-gate.ts) is completely untouched.
  describe("Groq as primary (FOOD_AI_PROVIDER=groq)", () => {
    it("selects Groq when FOOD_AI_PROVIDER=groq and credentials are present", () => {
      const provider = configuredSemanticCandidateGateProvider({ FOOD_AI_PROVIDER: "groq", GROQ_API_KEY: "groq-key" });
      expect(provider).toBeInstanceOf(ChatSemanticCandidateGateProvider);
      expect(provider.id).toBe("groq");
    });

    it("fails CLOSED when Groq is selected but the key is missing", () => {
      expect(configuredSemanticCandidateGateProvider({ FOOD_AI_PROVIDER: "groq" })).toBeInstanceOf(DisabledSemanticCandidateGateProvider);
    });

    it("stays a plain Groq-backed provider (no failover) when OpenRouter is not configured", () => {
      const provider = configuredSemanticCandidateGateProvider({ FOOD_AI_PROVIDER: "groq", GROQ_API_KEY: "groq-key" });
      expect(provider.id).toBe("groq");
    });

    it("candidate gate fails over to OpenRouter end-to-end when Groq 429s", async () => {
      let groqCalls = 0;
      let openRouterCalls = 0;
      const fetchImpl = (async (url: string) => {
        if (String(url).includes("openrouter.ai")) {
          openRouterCalls++;
          return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validGateOutput) } }] }));
        }
        groqCalls++;
        return new Response("rate limited", { status: 429 });
      }) as typeof fetch;

      const provider = configuredSemanticCandidateGateProvider(
        { FOOD_AI_PROVIDER: "groq", GROQ_API_KEY: "groq-key", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free" },
        { fetchImpl }
      );
      const result = await provider.checkRelevance({ identity: "potato" }, [{ id: "0", authoritativeName: "Potatoes, boiled" }]);

      expect(groqCalls).toBe(1);
      expect(openRouterCalls).toBe(1);
      expect(result.get("0")).toBe(true);
      expect(provider.id).toBe("openrouter");
    });

    it("candidate gate stays fail-CLOSED when both Groq and OpenRouter fail", async () => {
      const fetchImpl = (async () => new Response("down", { status: 503 })) as typeof fetch;
      const provider = configuredSemanticCandidateGateProvider(
        { FOOD_AI_PROVIDER: "groq", GROQ_API_KEY: "groq-key", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free" },
        { fetchImpl }
      );
      const result = await provider.checkRelevance({ identity: "potato" }, [{ id: "0", authoritativeName: "Potato flour" }]);
      expect(result.size).toBe(0);
    });
  });
});
