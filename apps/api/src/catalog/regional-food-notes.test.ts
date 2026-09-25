import { describe, expect, it } from "vitest";
import { REGIONAL_FOOD_IDENTITY_NOTES } from "./regional-food-notes.js";
import { SEMANTIC_CANDIDATE_GATE_INSTRUCTION } from "./semantic-candidate-gate.js";
import { SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION } from "./semantic-candidate-gate-batch.js";
import { RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION } from "../recipes/recipe-ingredient-normalization.js";
import { SEARCH_INTENT_INSTRUCTION } from "./search-intent.js";

describe("regional food identity notes (paprikakrém is not roasted pepper spread)", () => {
  it("state that paprikakrém is a chili paste and sült paprikakrém/ajvar is a different food", () => {
    expect(REGIONAL_FOOD_IDENTITY_NOTES).toMatch(/csípős paprikakrém/);
    expect(REGIONAL_FOOD_IDENTITY_NOTES).toMatch(/NOT a roasted bell pepper spread \("sült paprikakrém", "ajvar"/);
  });

  it("are part of every identity-deciding prompt", () => {
    for (const prompt of [SEMANTIC_CANDIDATE_GATE_INSTRUCTION, SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION, RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION, SEARCH_INTENT_INSTRUCTION]) {
      expect(prompt).toContain(REGIONAL_FOOD_IDENTITY_NOTES);
    }
  });
});
