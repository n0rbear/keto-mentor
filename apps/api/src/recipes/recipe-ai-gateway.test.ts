import { describe, expect, it } from "vitest";
import { configuredRecipeAiProvider } from "./recipe-ai-gateway.js";
import { OpenRouterRecipeExtractionProvider } from "./openrouter-recipe-extraction-provider.js";
import { MistralRecipeExtractionProvider } from "./mistral-recipe-extraction-provider.js";
import { DisabledRecipeExtractionProvider } from "./recipe-extraction-provider.js";
import { GroqRecipeExtractionProvider } from "./groq-recipe-extraction-provider.js";

describe("recipe AI gateway selection", () => {
  // Owner-beta (2026-09-12): FOOD_AI_PROVIDER=groq previously fell through
  // to Disabled here — silently turning off recipe extraction's AI-
  // structured fallback for any candidate page without schema.org markup.
  it("selects Groq when FOOD_AI_PROVIDER=groq and credentials are present", () => {
    const provider = configuredRecipeAiProvider({ FOOD_AI_PROVIDER: "groq", GROQ_API_KEY: "key" });
    expect(provider).toBeInstanceOf(GroqRecipeExtractionProvider);
  });

  it("is safely disabled when Groq is selected but the key is missing", () => {
    expect(configuredRecipeAiProvider({ FOOD_AI_PROVIDER: "groq" })).toBeInstanceOf(DisabledRecipeExtractionProvider);
  });

  it("selects OpenRouter when FOOD_AI_PROVIDER=openrouter and credentials are present", () => {
    const provider = configuredRecipeAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: "key", FOOD_AI_MODEL: "some/model:free" });
    expect(provider).toBeInstanceOf(OpenRouterRecipeExtractionProvider);
  });

  it("selects direct Mistral when FOOD_AI_PROVIDER=mistral", () => {
    const provider = configuredRecipeAiProvider({ FOOD_AI_PROVIDER: "mistral", MISTRAL_API_KEY: "key", MISTRAL_MODEL: "mistral-small-latest" });
    expect(provider).toBeInstanceOf(MistralRecipeExtractionProvider);
  });

  it("selects direct Mistral when FOOD_AI_PROVIDER is unset (backward compatibility, matching the other AI gateways)", () => {
    const provider = configuredRecipeAiProvider({ MISTRAL_API_KEY: "key", MISTRAL_MODEL: "mistral-small-latest" });
    expect(provider).toBeInstanceOf(MistralRecipeExtractionProvider);
  });

  it("is safely disabled when nothing is configured", () => {
    expect(configuredRecipeAiProvider({})).toBeInstanceOf(DisabledRecipeExtractionProvider);
  });

  it("is safely disabled when OpenRouter is selected but the key is missing", () => {
    expect(configuredRecipeAiProvider({ FOOD_AI_PROVIDER: "openrouter", FOOD_AI_MODEL: "some/model:free" })).toBeInstanceOf(DisabledRecipeExtractionProvider);
  });

  it("degrades to disabled instead of throwing when the key is whitespace-only", () => {
    expect(configuredRecipeAiProvider({ FOOD_AI_PROVIDER: "openrouter", OPENROUTER_API_KEY: " ", FOOD_AI_MODEL: "some/model:free" })).toBeInstanceOf(DisabledRecipeExtractionProvider);
  });

  it("the disabled provider always rejects extraction rather than returning a fabricated recipe", async () => {
    await expect(new DisabledRecipeExtractionProvider().extract("page text")).rejects.toThrow();
  });
});
