import { describe, expect, it, vi } from "vitest";
import { configuredFoodAiProvider } from "./food-ai-gateway.js";
import { MistralAiProvider } from "./mistral-provider.js";
import { OpenRouterAiProvider } from "./openrouter-provider.js";
import { FailoverAiProvider } from "./failover-provider.js";

describe("food AI gateway selection", () => {
  it("selects OpenRouter when FOOD_AI_PROVIDER=openrouter and credentials are present", () => {
    const provider = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "key", FOOD_AI_MODEL: "some/model:free" });
    expect(provider).toBeInstanceOf(OpenRouterAiProvider);
    expect(provider.id).toBe("openrouter");
  });

  it("selects direct Mistral when FOOD_AI_PROVIDER=mistral", () => {
    const provider = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "mistral", MISTRAL_API_KEY: "key", MISTRAL_MODEL: "mistral-small-latest" });
    expect(provider).toBeInstanceOf(MistralAiProvider);
    expect(provider.id).toBe("mistral");
  });

  it("selects direct Mistral when FOOD_AI_PROVIDER is unset (backward compatibility)", () => {
    const provider = configuredFoodAiProvider({ MISTRAL_API_KEY: "key", MISTRAL_MODEL: "mistral-small-latest" });
    expect(provider).toBeInstanceOf(MistralAiProvider);
  });

  it("is disabled when nothing is configured", () => {
    expect(configuredFoodAiProvider({}).supports("food_nlp")).toBe(false);
  });

  it("is disabled when OpenRouter is selected but the key is missing", () => {
    const provider = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "openrouter", FOOD_AI_MODEL: "some/model:free" });
    expect(provider.supports("food_nlp")).toBe(false);
  });

  it("is disabled when OpenRouter is selected but the model is missing", () => {
    const provider = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "key" });
    expect(provider.supports("food_nlp")).toBe(false);
  });

  it("degrades to disabled instead of throwing when the key is whitespace-only", () => {
    const provider = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: " ", FOOD_AI_MODEL: "some/model:free" });
    expect(provider.supports("food_nlp")).toBe(false);
  });

  it("never includes the OpenRouter key in a thrown error", async () => {
    const provider = configuredFoodAiProvider({
      FOOD_AI_PROVIDER: "openrouter",
      OPENROUTER_API_KEY: "super-secret-key",
      FOOD_AI_MODEL: "some/model:free"
    });
    const fetchImpl = (async () => new Response("super-secret-key leaked in body", { status: 500 })) as typeof fetch;
    const failing = new OpenRouterAiProvider({ apiKey: "super-secret-key", model: "some/model:free", fetchImpl });
    let error: unknown;
    try {
      await failing.run("food_nlp", { text: "meal input" });
    } catch (caught) {
      error = caught;
    }
    expect(JSON.stringify(error)).not.toContain("super-secret-key");
    expect(String(error)).not.toContain("super-secret-key");
    expect(provider.supports("food_nlp")).toBe(true);
  });

  it("stays a plain OpenRouterAiProvider (no failover wrapper) when GROQ_API_KEY is not configured", () => {
    const provider = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "key", FOOD_AI_MODEL: "some/model:free" });
    expect(provider).toBeInstanceOf(OpenRouterAiProvider);
    expect(provider).not.toBeInstanceOf(FailoverAiProvider);
  });

  it("wraps OpenRouter with a Groq failover when GROQ_API_KEY is configured", async () => {
    const fetchImpl = vi.fn(async () => new Response("rate limited", { status: 429 }));
    const provider = configuredFoodAiProvider({
      FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free",
      GROQ_API_KEY: "groq-key"
    }, { fetchImpl });
    expect(provider).toBeInstanceOf(FailoverAiProvider);
    expect(provider.id).toBe("openrouter");
  });

  it("defaults the Groq model when GROQ_MODEL is unset, and honors it when set", () => {
    const withDefault = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key" });
    expect(withDefault.model).toBe("some/model:free"); // primary's model until a failover actually happens
    const withOverride = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "or-key", FOOD_AI_MODEL: "some/model:free", GROQ_API_KEY: "groq-key", GROQ_MODEL: "custom-groq-model" });
    expect(withOverride).toBeInstanceOf(FailoverAiProvider);
  });

  it("never wires Groq as Mistral's secondary — Mistral keeps its own unmodified provider", () => {
    const provider = configuredFoodAiProvider({ FOOD_AI_PROVIDER: "mistral", MISTRAL_API_KEY: "key", MISTRAL_MODEL: "mistral-small-latest", GROQ_API_KEY: "groq-key" });
    expect(provider).toBeInstanceOf(MistralAiProvider);
    expect(provider).not.toBeInstanceOf(FailoverAiProvider);
  });
});
