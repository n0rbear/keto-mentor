import { describe, expect, it } from "vitest";
import { calculateRecipeNutrition, scaleRecipeSnapshot } from "./nutrition.js";

function recipe() {
  return {
    id: "r1", userId: "u1", title: "Teszt", description: null, servings: 4, finishedWeightGrams: 500,
    visibility: "private", sourceType: "manual", sourceUrl: null, provenance: null, forkedFromRecipeId: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
    ingredients: [
      { id: "i1", recipeId: "r1", foodId: "f1", quantityGrams: 200, originalText: null, preparation: null, sortOrder: 0, food: { id: "f1", name: "A", names: null, synonyms: null, brand: null, barcode: null, source: "bls", sourceId: "1", originalName: "A", category: null, searchText: "a", provenance: null, servingUnit: null, servingGrams: null, kcalPer100g: 100, fatPer100g: 10, proteinPer100g: 20, carbsPer100g: 5, fiberPer100g: 2, createdById: null, createdAt: new Date(), nutrients: [{ foodId: "f1", nutrientId: "n1", amountPer100g: 50, nutrient: { id: "n1", key: "calcium", label: "Calcium", unit: "mg", group: "mineral" } }] } },
      { id: "i2", recipeId: "r1", foodId: "f2", quantityGrams: 100, originalText: null, preparation: null, sortOrder: 1, food: { id: "f2", name: "B", names: null, synonyms: null, brand: null, barcode: null, source: "usda_fdc", sourceId: "2", originalName: "B", category: null, searchText: "b", provenance: null, servingUnit: null, servingGrams: null, kcalPer100g: 200, fatPer100g: 5, proteinPer100g: 10, carbsPer100g: 20, fiberPer100g: 4, createdById: null, createdAt: new Date(), nutrients: [{ foodId: "f2", nutrientId: "n1", amountPer100g: 100, nutrient: { id: "n1", key: "calcium", label: "Calcium", unit: "mg", group: "mineral" } }, { foodId: "f2", nutrientId: "n2", amountPer100g: 2, nutrient: { id: "n2", key: "iron", label: "Iron", unit: "mg", group: "mineral" } }] } }
    ]
  } as any;
}

describe("recipe nutrition calculator", () => {
  const result = calculateRecipeNutrition(recipe());
  it("sums ingredient weight", () => expect(result.ingredientWeightGrams).toBe(300));
  it("calculates total kcal", () => expect(result.total.macros.kcal).toBe(400));
  it("calculates protein", () => expect(result.total.macros.protein).toBe(50));
  it("calculates fat", () => expect(result.total.macros.fat).toBe(25));
  it("calculates carbs", () => expect(result.total.macros.carbs).toBe(30));
  it("calculates fiber", () => expect(result.total.macros.fiber).toBe(8));
  it("calculates net carbs", () => expect(result.total.macros.netCarbs).toBe(22));
  it("aggregates micronutrients with their original unit", () => {
    expect(result.total.nutrients.calcium).toMatchObject({ amount: 200, unit: "mg" });
    expect(result.total.nutrients.iron.amount).toBe(2);
  });
  it("calculates per serving", () => expect(result.perServing?.macros).toMatchObject({ kcal: 100, protein: 12.5, netCarbs: 5.5 }));
  it("calculates per 100 g from finished weight", () => expect(result.per100g?.macros).toMatchObject({ kcal: 80, protein: 10, netCarbs: 4.4 }));
  it("scales an immutable meal snapshot", () => {
    const snapshot = scaleRecipeSnapshot(result.total.macros, result.total.nutrients, 0.5);
    expect(snapshot.macros.kcal).toBe(200); expect(snapshot.nutrients.calcium.amount).toBe(100); expect(result.total.macros.kcal).toBe(400);
  });
});
