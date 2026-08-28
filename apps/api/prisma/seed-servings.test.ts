import { describe, expect, it } from "vitest";
import { upsertSeedServings, type SeedServing } from "./seed-servings.js";

describe("seed serving upserts", () => {
  it("is idempotent and only updates the targeted food/key pairs", async () => {
    const rows = new Map<string, unknown>([["unrelated:piece", { grams: 999 }]]);
    const store = {
      upsert: async ({ where, update, create }: any) => {
        const key = `${where.foodId_key.foodId}:${where.foodId_key.key}`;
        rows.set(key, rows.has(key) ? { ...(rows.get(key) as object), ...update } : create);
      }
    };
    const servings: SeedServing[] = [
      { key: "tbsp", unit: "tbsp", labels: { en: "tablespoon" }, grams: 14.2, provenance: { source: "USDA" } },
      { key: "tsp", unit: "tsp", labels: { en: "teaspoon" }, grams: 14.2 / 3, provenance: { source: "USDA" } }
    ];

    await upsertSeedServings(store, "catalog-butter", servings);
    await upsertSeedServings(store, "catalog-butter", servings);

    expect([...rows.keys()].sort()).toEqual(["catalog-butter:tbsp", "catalog-butter:tsp", "unrelated:piece"]);
    expect(rows.get("unrelated:piece")).toEqual({ grams: 999 });
  });
});
