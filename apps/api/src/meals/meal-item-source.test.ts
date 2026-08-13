import { describe, expect, it } from "vitest";
import { assertExactlyOneMealItemSource } from "./meal-item-source.js";

describe("MealItem source invariant", () => {
  it("accepts a Food-only MealItem", () => {
    expect(() => assertExactlyOneMealItemSource({ hasFood: true, hasRecipe: false })).not.toThrow();
  });

  it("accepts a Recipe-only MealItem", () => {
    expect(() => assertExactlyOneMealItemSource({ hasFood: false, hasRecipe: true })).not.toThrow();
  });

  it("rejects a MealItem with neither source", () => {
    expect(() => assertExactlyOneMealItemSource({ hasFood: false, hasRecipe: false })).toThrowError("meal_item_source_invalid");
  });

  it("rejects a MealItem with both sources", () => {
    expect(() => assertExactlyOneMealItemSource({ hasFood: true, hasRecipe: true })).toThrowError("meal_item_source_invalid");
  });
});
