import { describe, expect, it } from "vitest";
import { foodUnderstandingSchema } from "@keto-mentor/shared";
import { evaluateFoodUnderstanding } from "./food-understanding-eval.js";
import { FOOD_UNDERSTANDING_EVAL_CORPUS, semanticFixture } from "./food-understanding-eval-corpus.js";

describe("food-understanding evaluation corpus", () => {
  it("contains the locked 210-case HU/DE/EN distribution and safety coverage", () => {
    expect(FOOD_UNDERSTANDING_EVAL_CORPUS).toHaveLength(210);
    expect(FOOD_UNDERSTANDING_EVAL_CORPUS.filter((test) => test.language === "hu")).toHaveLength(80);
    expect(FOOD_UNDERSTANDING_EVAL_CORPUS.filter((test) => test.language === "de")).toHaveLength(65);
    expect(FOOD_UNDERSTANDING_EVAL_CORPUS.filter((test) => test.language === "en")).toHaveLength(65);
    expect(FOOD_UNDERSTANDING_EVAL_CORPUS.filter((test) => test.route === "deterministic")).toHaveLength(80);
    expect(FOOD_UNDERSTANDING_EVAL_CORPUS.filter((test) => test.route === "ai")).toHaveLength(130);
    expect(FOOD_UNDERSTANDING_EVAL_CORPUS.filter((test) => /ignore|kcal|api key|api-schlüssel/i.test(test.input)).length).toBeGreaterThanOrEqual(8);
  });

  it("keeps every deterministic semantic fixture inside the strict contract", () => {
    for (const test of FOOD_UNDERSTANDING_EVAL_CORPUS) expect(() => foodUnderstandingSchema.parse(semanticFixture(test)), test.id).not.toThrow();
  });

  it("reports complete fixture metrics without a live model call", async () => {
    const known = new Set(["egg", "chicken breast", "gouda", "avocado", "butter", "sausage", "salmon", "broccoli", "cucumber"]);
    const report = await evaluateFoodUnderstanding(FOOD_UNDERSTANDING_EVAL_CORPUS, async (test) => semanticFixture(test), async (name) => known.has(name));
    expect(report).toMatchObject({
      total: 210, validSchema: 210, kindClassificationAccuracy: 100,
      explicitItemExtractionAccuracy: 100, quantityExtractionAccuracy: 100,
      modifierExtractionAccuracy: 100, exclusionExtractionAccuracy: 100,
      unsafeNutritionOutputAccepted: 0, failures: []
    });
    expect(report.trustedFoodResolutionRate).not.toBeNull();
  });
});
