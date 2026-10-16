import { describe, expect, it, vi } from "vitest";

// "zabkása mangóval" (owner report 2026-10-16): an item the catalog did not
// know is still looked up as a known dish on its own.
vi.mock("../reference-dishes/lookup.js", () => ({
  referenceVariantIdsFor: (name: string) => (name.trim().toLowerCase() === "zabkása" ? ["hu_zabkasa"] : []),
  findReferenceRecipes: async () => [{ id: "r-zab", title: "Zabkása", servings: 1, finishedWeightGrams: 261, provenance: { titles: { hu: "zabkása" } }, ingredients: [] }]
}));
vi.mock("../recipes/nutrition.js", () => ({
  calculateRecipeNutrition: () => ({ perServing: { macros: { kcal: 363, fat: 10.5, protein: 14, carbs: 55.3, fiber: 5.5, netCarbs: 49.8 } } })
}));

const { fillUnclearWithReferenceDishes } = await import("./public-try.js");

describe("kipróbálás: ismert étel több tétel között", () => {
  it("replaces an unclear item with its reference dish and recomputes the totals", async () => {
    const mango = { name: "mangó", grams: 100, status: "assumed_100g" as const, macros: { kcal: 60, fat: 0.5, protein: 0.7, carbs: 13.7, fiber: 1.7, netCarbs: 12 } };
    const result = await fillUnclearWithReferenceDishes({} as any, { items: [{ name: "zabkása", grams: null, status: "unclear", macros: null }, mango], totals: mango.macros, source: "foods" }, "hu");
    expect(result.items[0]).toMatchObject({ name: "zabkása", grams: 261, status: "ok" });
    expect(result.items[1]).toEqual(mango);
    expect(result.totals).toMatchObject({ kcal: 423, netCarbs: 61.8 });
  });

  it("leaves an unknown unclear item as it was", async () => {
    const before = { items: [{ name: "valami", grams: null, status: "unclear" as const, macros: null }], totals: { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 }, source: "foods" as const };
    expect((await fillUnclearWithReferenceDishes({} as any, before, "hu")).items).toEqual(before.items);
  });
});
