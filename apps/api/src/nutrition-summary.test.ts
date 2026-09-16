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
  snapshotNetCarbs?: number | null;
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

// P0 checkpoint (2026-09-16): a persisted recipe-backed MealItem must report the
// SAME netCarbs the recipe portion had at creation time, never a value re-derived
// (and silently re-clamped) from the aggregated snapshotCarbs/snapshotFiber. This
// is the real bug PR #54's own final review found: recipe preview was fixed, but
// a logged meal item still showed a different, wrong number.
describe("MealItem netCarbs persistence (snapshotNetCarbs)", () => {
  // Ingredient A: carbs 2, fiber 5 -> clamps to 0. Ingredient B: carbs 10, fiber 1
  // -> net 9. Correct whole-recipe netCarbs = 0 + 9 = 9, NOT max(0, 12 - 6) = 6.
  it("uses the stored snapshotNetCarbs directly, not max(0, carbs - fiber), for a recipe-backed item", () => {
    const meal = makeMeal([
      {
        id: "i1", quantityGrams: 300, snapshotKcal: 400, snapshotFat: 20, snapshotProtein: 10,
        snapshotCarbs: 12, snapshotFiber: 6, snapshotNetCarbs: 9, snapshotNutrients: [],
        food: null, recipeId: "recipe-1"
      }
    ]);
    const out = serializeMealSummary(meal);
    expect(out.totals.netCarbs).toBe(9);
    expect(out.totals.netCarbs).not.toBe(6);
  });

  it("a stored snapshotNetCarbs of exactly 0 is used as-is, not treated as missing (nullish, not falsy, check)", () => {
    const meal = makeMeal([
      {
        id: "i1", quantityGrams: 100, snapshotKcal: 50, snapshotFat: 1, snapshotProtein: 1,
        snapshotCarbs: 5, snapshotFiber: 5, snapshotNetCarbs: 0, snapshotNutrients: [],
        food: null, recipeId: "recipe-1"
      }
    ]);
    expect(serializeMealSummary(meal).totals.netCarbs).toBe(0);
  });

  it("LEGACY FALLBACK: a row with no stored snapshotNetCarbs (pre-checkpoint) falls back to max(0, carbs - fiber)", () => {
    const meal = makeMeal([
      {
        id: "i1", quantityGrams: 300, snapshotKcal: 400, snapshotFat: 20, snapshotProtein: 10,
        snapshotCarbs: 12, snapshotFiber: 6, snapshotNetCarbs: null, snapshotNutrients: [],
        food: null, recipeId: "recipe-1"
      }
    ]);
    // Documented, non-authoritative approximation for pre-existing rows only —
    // see nutrition.ts's itemTotals comment. Real historical value is unrecoverable.
    expect(serializeMealSummary(meal).totals.netCarbs).toBe(6);
  });

  it("mixed meal: one catalog food, one new recipe item (stored netCarbs), one legacy recipe item (fallback)", () => {
    const meal = makeMeal([
      { id: "i1", quantityGrams: 100, snapshotKcal: null, snapshotFat: null, snapshotProtein: null, snapshotCarbs: null, snapshotFiber: null, snapshotNutrients: null, food: { id: "gouda", name: "Gouda", names: {}, kcalPer100g: 0, fatPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fiberPer100g: 0 } as any, recipeId: null },
      { id: "i2", quantityGrams: 300, snapshotKcal: 400, snapshotFat: 20, snapshotProtein: 10, snapshotCarbs: 12, snapshotFiber: 6, snapshotNetCarbs: 9, snapshotNutrients: [], food: null, recipeId: "recipe-new" },
      { id: "i3", quantityGrams: 200, snapshotKcal: 200, snapshotFat: 10, snapshotProtein: 5, snapshotCarbs: 8, snapshotFiber: 4, snapshotNetCarbs: null, snapshotNutrients: [], food: null, recipeId: "recipe-legacy" }
    ]);
    // catalog item has no Food per100g fixture here, so it contributes 0; the point
    // of this test is that the two recipe items are handled correctly side by side.
    const totals = serializeMealSummary(meal).totals;
    expect(totals.netCarbs).toBe(9 + 4); // stored 9, legacy fallback max(0, 8-4)=4
  });
});
