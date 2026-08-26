import { describe, expect, it } from "vitest";
import { serializeMeal, serializeMealSummary } from "./nutrition.js";

// Minimal shape needed by MealWithItems for these pure-function tests.
type TestItem = {
  id: string;
  quantityGrams: number;
  snapshotKcal: number | null;
  snapshotFat: number | null;
  snapshotProtein: number | null;
  snapshotCarbs: number | null;
  snapshotFiber: number | null;
  snapshotNutrients: unknown;
  food: { id: string; name: string; names: unknown } | null;
  recipeId: string | null;
};

function makeMeal(items: TestItem[]) {
  return {
    id: "meal_1",
    title: "Breakfast",
    eatenAt: new Date("2026-08-23T08:00:00Z"),
    items
  } as unknown as Parameters<typeof serializeMealSummary>[0];
}

describe("serializeMealSummary", () => {
  it("returns id, title, eatenAt and totals only (no items array)", () => {
    const meal = makeMeal([
      {
        id: "i1",
        quantityGrams: 100,
        snapshotKcal: 200,
        snapshotFat: 10,
        snapshotProtein: 5,
        snapshotCarbs: 2,
        snapshotFiber: 1,
        snapshotNutrients: [],
        food: { id: "f1", name: "Egg", names: [] },
        recipeId: null
      }
    ]);
    const out = serializeMealSummary(meal);
    expect(out).toEqual({
      id: "meal_1",
      title: "Breakfast",
      eatenAt: new Date("2026-08-23T08:00:00Z"),
      totals: { kcal: 200, fat: 10, protein: 5, carbs: 2, fiber: 1, netCarbs: 1 }
    });
    // Slim payload: the per-item array must not be serialized here.
    expect(out).not.toHaveProperty("items");
  });

  it("leaves the detailed serializer compatible for existing API consumers", () => {
    const meal = makeMeal([
      {
        id: "i1", quantityGrams: 100, snapshotKcal: 200, snapshotFat: 10,
        snapshotProtein: 5, snapshotCarbs: 2, snapshotFiber: 1,
        snapshotNutrients: { calcium: { amount: 10, unit: "mg" } },
        food: { id: "f1", name: "Egg", names: { en: "Egg" } }, recipeId: null
      }
    ]);
    const detailed = serializeMeal(meal);
    expect(detailed.items).toHaveLength(1);
    expect(detailed.items[0]).toMatchObject({
      id: "i1", quantityGrams: 100, displayName: "Egg", recipeId: null,
      food: { id: "f1", name: "Egg", names: { en: "Egg" } },
      snapshotNutrients: { calcium: { amount: 10, unit: "mg" } }
    });
  });

  it("aggregates totals across multiple items", () => {
    const meal = makeMeal([
      { id: "i1", quantityGrams: 100, snapshotKcal: 100, snapshotFat: 1, snapshotProtein: 2, snapshotCarbs: 3, snapshotFiber: 1, snapshotNutrients: [], food: null, recipeId: null },
      { id: "i2", quantityGrams: 50, snapshotKcal: 50, snapshotFat: 2, snapshotProtein: 4, snapshotCarbs: 6, snapshotFiber: 2, snapshotNutrients: [], food: null, recipeId: null }
    ]);
    const out = serializeMealSummary(meal);
    expect(out.totals).toEqual({ kcal: 150, fat: 3, protein: 6, carbs: 9, fiber: 3, netCarbs: 6 });
  });
});
