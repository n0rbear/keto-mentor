import { describe, expect, it } from "vitest";
import { dayMicros } from "./micros.js";

describe("mikrotápanyagok", () => {
  it("sums recipe snapshots and food values per gram against the EU reference values", () => {
    const r = dayMicros([
      { quantityGrams: 200, food: { nutrients: [{ amountPer100g: 30, nutrient: { key: "magnesium" } }, { amountPer100g: 400, nutrient: { key: "sodium" } }, { amountPer100g: 20, nutrient: { key: "protein" } }] } },
      { quantityGrams: 350, snapshotNutrients: { magnesium: { key: "magnesium", amount: 75, unit: "mg" }, vitamin_c: { amount: 40 } } },
      { quantityGrams: 100, food: { nutrients: [] } }
    ]);
    const get = (k: string) => r.nutrients.find((n) => n.key === k)!;
    expect(get("magnesium")).toMatchObject({ amount: 135, reference: 375, percent: 36 });
    expect(get("sodium")).toMatchObject({ amount: 800, kind: "max", percent: 40 });
    expect(get("vitamin_c").percent).toBe(50);
    expect(r).toMatchObject({ items: 3, itemsWithData: 2 });
    expect(r.nutrients.some((n) => n.key === "protein")).toBe(false);
  });
});
