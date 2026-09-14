import { describe, expect, it, vi } from "vitest";
import { ChatRecipeQuantityEstimationProvider, RECIPE_QUANTITY_ESTIMATION_INSTRUCTION, recipeQuantityEstimationOutputSchema } from "./recipe-quantity-estimation.js";

const input = {
  title: "Gulyásleves", locale: "hu-HU", ingredientLines: ["2 gerezd fokhagyma", "1-2 tk mustár"],
  items: [
    { index: 0, sourceIndex: 0, raw: "2 gerezd fokhagyma", identity: "garlic", quantity: 2, unit: "clove" },
    { index: 1, sourceIndex: 1, raw: "1-2 tk mustár", identity: "prepared mustard", quantity: 1, quantityUpper: 2, unit: "tsp" }
  ]
};

describe("recipe quantity estimation trust boundary", () => {
  it("accepts physical quantity output and rejects nutrition/identity fields", () => {
    expect(recipeQuantityEstimationOutputSchema.safeParse({ estimates: [{ index: 0, grams: 6, confidence: .8 }] }).success).toBe(true);
    for (const field of ["kcal", "protein", "fat", "carbs", "fiber", "foodId", "nutrition"]) expect(recipeQuantityEstimationOutputSchema.safeParse({ estimates: [{ index: 0, grams: 6, confidence: .8, [field]: 1 }] }).success).toBe(false);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, 50_001])("rejects invalid grams %s", (grams) => {
    expect(recipeQuantityEstimationOutputSchema.safeParse({ estimates: [{ index: 0, grams, confidence: .8 }] }).success).toBe(false);
  });

  it("makes one batched full-context call and documents midpoint range policy", async () => {
    const complete = vi.fn(async (_instruction: string, _input: string, validate: (v: unknown) => unknown) => validate({ estimates: [{ index: 0, grams: 6, confidence: .8 }, { index: 1, grams: 7.5, confidence: .7 }] }));
    const provider = new ChatRecipeQuantityEstimationProvider({ id: "fixture", model: "fixture", complete } as any);
    await expect(provider.estimate(input)).resolves.toMatchObject({ estimates: [{ index: 0, grams: 6 }, { index: 1, grams: 7.5 }] });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(JSON.parse(complete.mock.calls[0][1]).ingredientLines).toEqual(input.ingredientLines);
    expect(RECIPE_QUANTITY_ESTIMATION_INSTRUCTION).toContain("midpoint");
  });

  it.each([
    { estimates: [{ index: 0, grams: 6, confidence: .8 }] },
    { estimates: [{ index: 0, grams: 6, confidence: .8 }, { index: 0, grams: 7, confidence: .8 }] },
    { estimates: [{ index: 0, grams: 6, confidence: .8 }, { index: 9, grams: 7, confidence: .8 }] }
  ])("fails safely for missing, duplicate, or hallucinated items", async (output) => {
    const provider = new ChatRecipeQuantityEstimationProvider({ id: "fixture", model: "fixture", complete: async (_i: string, _x: string, validate: (v: unknown) => unknown) => validate(output) } as any);
    await expect(provider.estimate(input)).resolves.toBeNull();
  });
});
