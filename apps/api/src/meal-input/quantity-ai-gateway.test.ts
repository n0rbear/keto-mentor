import { describe, expect, it, vi } from "vitest";
import { configuredQuantityAiProvider } from "./quantity-ai-gateway.js";
import { MistralQuantityEstimationProvider } from "./mistral-quantity-provider.js";
import { OpenRouterQuantityEstimationProvider } from "./openrouter-quantity-provider.js";
import { DisabledQuantityEstimationProvider } from "./quantity-estimation.js";
import { resolveQuantity } from "./interpret.js";

const food = { id: "peanuts", source: "USDA", sourceId: "172430", name: "Peanuts" };
// "piece" (geometry-class) deliberately — these tests cover generic gateway
// selection/error/provenance behavior, not the volume-model schema.
const parsed = { quantity: 1, unit: "piece" as const, foodQuery: "peanuts" };

describe("quantity AI gateway selection", () => {
  it("selects OpenRouter when FOOD_AI_PROVIDER=openrouter and credentials are present", () => {
    const provider = configuredQuantityAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "key", FOOD_AI_MODEL: "some/model:free" });
    expect(provider).toBeInstanceOf(OpenRouterQuantityEstimationProvider);
  });

  it("selects direct Mistral when FOOD_AI_PROVIDER=mistral", () => {
    const provider = configuredQuantityAiProvider({ FOOD_AI_PROVIDER: "mistral", MISTRAL_API_KEY: "key", MISTRAL_MODEL: "mistral-small-latest" });
    expect(provider).toBeInstanceOf(MistralQuantityEstimationProvider);
  });

  it("selects direct Mistral when FOOD_AI_PROVIDER is unset (backward compatibility)", () => {
    const provider = configuredQuantityAiProvider({ MISTRAL_API_KEY: "key", MISTRAL_MODEL: "mistral-small-latest" });
    expect(provider).toBeInstanceOf(MistralQuantityEstimationProvider);
  });

  it("is safely disabled when nothing is configured", () => {
    expect(configuredQuantityAiProvider({})).toBeInstanceOf(DisabledQuantityEstimationProvider);
  });

  it("is safely disabled when OpenRouter is selected but the key is missing", () => {
    expect(configuredQuantityAiProvider({ FOOD_AI_PROVIDER: "openrouter", FOOD_AI_MODEL: "some/model:free" })).toBeInstanceOf(DisabledQuantityEstimationProvider);
  });

  it("degrades to disabled instead of throwing when the key is whitespace-only", () => {
    expect(configuredQuantityAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: " ", FOOD_AI_MODEL: "some/model:free" })).toBeInstanceOf(DisabledQuantityEstimationProvider);
  });

  it.each([429, 500])("an OpenRouter HTTP %s response falls back to asking for grams instead of a 500", async (status) => {
    const provider = new OpenRouterQuantityEstimationProvider({
      apiKey: "test-secret", model: "some/model:free",
      fetchImpl: async () => new Response("upstream detail", { status })
    });
    const result = await resolveQuantity(parsed, food, provider);
    expect(result.reason).toBe("conversion_missing");
  });

  it("OpenRouter malformed JSON output safely asks for grams", async () => {
    const provider = new OpenRouterQuantityEstimationProvider({
      apiKey: "test-secret", model: "some/model:free",
      fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: "not json" } }] }))
    });
    const result = await resolveQuantity(parsed, food, provider);
    expect(result.reason).toBe("conversion_missing");
  });

  it("OpenRouter provenance identifies the openrouter gateway distinctly from Mistral", async () => {
    const output = { gramsPerUnit: 30, rangeGramsPerUnit: { min: 25, max: 35 }, confidence: 0.8 };
    const provider = new OpenRouterQuantityEstimationProvider({
      apiKey: "test-secret", model: "some/model:free",
      fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(output) } }] }))
    });
    const result = await resolveQuantity(parsed, food, provider);
    expect(result.method).toBe("ai_estimated");
    expect((result as { provenance?: { provider?: string } }).provenance?.provider).toBe("openrouter");
  });

  it("never leaks the OpenRouter key through a failed estimate", async () => {
    const provider = new OpenRouterQuantityEstimationProvider({
      apiKey: "super-secret-key", model: "some/model:free",
      fetchImpl: async () => { throw new Error("super-secret-key"); }
    });
    const result = await resolveQuantity(parsed, food, provider);
    expect(result.reason).toBe("conversion_missing");
    expect(JSON.stringify(result)).not.toContain("super-secret-key");
  });

  it("stays a plain OpenRouterQuantityEstimationProvider (no failover) when GROQ_API_KEY is not configured", () => {
    const provider = configuredQuantityAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "key", FOOD_AI_MODEL: "some/model:free" });
    expect(provider).toBeInstanceOf(OpenRouterQuantityEstimationProvider);
  });

  it("11. quantity estimation fails over to Groq end-to-end through resolveQuantity when OpenRouter 429s", async () => {
    let openRouterCalls = 0;
    let groqCalls = 0;
    const fetchImpl = (async (url: string) => {
      const targetsGroq = String(url).includes("groq.com");
      if (targetsGroq) {
        groqCalls++;
        return new Response(JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ gramsPerUnit: 28, rangeGramsPerUnit: { min: 20, max: 35 }, confidence: 0.6 }) } }]
        }));
      }
      openRouterCalls++;
      return new Response("rate limited", { status: 429 });
    }) as typeof fetch;

    const provider = configuredQuantityAiProvider(
      { FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key" },
      { fetchImpl }
    );
    const result = await resolveQuantity(parsed, food, provider);

    expect(openRouterCalls).toBe(1);
    expect(groqCalls).toBe(1);
    expect(result.status).toBe("resolved");
    expect(result.aiOutcome).toBe("estimated");
    // Provenance must honestly say Groq served this estimate, not the primary.
    expect((result as { provenance?: { provider?: string } }).provenance?.provider).toBe("groq");
  });

  it("Groq cannot smuggle a nutrition/provenance field into a quantity estimate even after a successful failover", async () => {
    const fetchImpl = (async (url: string) => {
      if (String(url).includes("groq.com")) {
        return new Response(JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ gramsPerUnit: 28, rangeGramsPerUnit: { min: 20, max: 35 }, confidence: 0.6, kcalPer100g: 999 }) } }]
        }));
      }
      return new Response("rate limited", { status: 429 });
    }) as typeof fetch;
    const provider = configuredQuantityAiProvider(
      { FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key" },
      { fetchImpl }
    );
    const result = await resolveQuantity(parsed, food, provider);
    // The strict quantityOutputSchema rejects the extra field, so the whole
    // estimate fails safely — never silently dropping just the bad field and
    // accepting the rest, which would also accept whatever schema-violating
    // trust boundary the provider tried to cross.
    expect(result.reason).toBe("conversion_missing");
  });
});
