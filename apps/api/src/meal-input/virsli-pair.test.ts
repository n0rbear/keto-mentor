import { describe, expect, it } from "vitest";
import { interpretMealInput } from "./interpret.js";

// Owner tickets c289ec / 5d5e3f (2026-10-15): "2 pár virsli" offered a choice
// between the reviewed BLS "Wiener Würstchen" (hu "virsli", 59.5 g a piece)
// and an Open Food Facts product also named "virsli", then asked for grams.
const wiener = { id: "bls-wiener", name: "Wiener Würstchen", originalName: "Wiener Würstchen", names: { hu: "virsli", de: "Wiener Würstchen" }, source: "bls", sourceId: "W1", createdById: null, searchText: "wiener wurstchen virsli", kcalPer100g: 290, proteinPer100g: 13, fatPer100g: 26, carbsPer100g: 1, fiberPer100g: 0,
  servings: [{ id: "s1", key: "piece", unit: "piece", labels: { hu: "db" }, grams: 59.5, isEstimated: false, confidence: 0.9, provenance: { kind: "reference_serving" } }] };
const offWiener = { ...wiener, id: "off-wiener", name: "Wiener Sausage", originalName: "Wiener Sausage", source: "open_food_facts", sourceId: "123", searchText: "wiener sausage virsli", servings: [] };
const foods = [wiener, offWiener];
const prisma = {
  foodAlias: { findMany: async () => [{ foodId: "bls-wiener", normalizedAlias: "virsli", kind: "localized_name", confidence: 1 }, { foodId: "off-wiener", normalizedAlias: "virsli", kind: "external", confidence: 1 }] },
  food: { findMany: async ({ where }: any) => where.id?.in ? foods.filter((f) => where.id.in.includes(f.id)) : foods.filter((f) => where.OR.some((o: any) => f.searchText.includes(o.searchText.contains))) }
} as any;

describe("2 pár virsli", () => {
  it("resolves to the reviewed virsli at 4 pieces without a choice or a grams question", async () => {
    const result: any = await interpretMealInput(prisma, "2 pár virsli");
    const item = result.items?.[0] ?? result;
    expect(item.ambiguous).toBeFalsy();
    expect(item.selectedFood.id).toBe("bls-wiener");
    expect(item.quantity).toMatchObject({ status: "resolved", grams: 238 });
    expect(item.canConfirm).toBe(true);
  });
});
