import { describe, expect, it, vi } from "vitest";
import { authoritativeName, backfillFoodNames } from "./backfill-food-names.js";

function fakeDb(foods: any[]) {
  const updates: any[] = [], aliases: any[] = [];
  return {
    updates, aliases,
    food: { findMany: vi.fn(async () => foods.map((f) => ({ ...f }))), update: vi.fn(async (args: any) => { updates.push(args); }) },
    foodAlias: { upsert: vi.fn(async (args: any) => { aliases.push(args.create); }) }
  };
}

describe("hiányzó ételnevek pótlása", () => {
  const bacon = { id: "usda-1", name: "Pork, cured, bacon, unprepared", originalName: "Pork, cured, bacon, unprepared", names: { en: "Pork, cured, bacon, unprepared", hu: "szalonna, pácolt, nyers" }, synonyms: null, brand: null, category: "Pork" };
  const blsHaxe = { id: "bls-1", name: "Schwein Hintereisbein/Hinterhaxe, roh", originalName: "Schwein Hintereisbein/Hinterhaxe, roh", names: { de: "Schweinehaxe" }, synonyms: null, brand: null, category: null };

  it("asks only for the missing languages, then saves name, search text and a localized alias", async () => {
    const db = fakeDb([bacon, blsHaxe]);
    const localize = vi.fn(async (items: Array<{ id: string; authoritativeName: string }>, locale: string) =>
      new Map(items.map((item) => [item.id, `${locale}:${item.authoritativeName}`])));
    const result = await backfillFoodNames({ prisma: db, provider: { id: "openai", localize } });
    // bacon misses de; the BLS knuckle misses hu and en.
    expect(localize.mock.calls.map(([items, locale]) => [locale, items.map((i) => i.id)])).toEqual([["de-DE", ["usda-1"]], ["hu-HU", ["bls-1"]], ["en-GB", ["bls-1"]]]);
    expect(result).toEqual({ filled: 3, failed: 0 });
    const lastHaxe = db.updates.filter((u) => u.where.id === "bls-1").at(-1);
    expect(lastHaxe.data.names).toEqual({ de: "Schweinehaxe", hu: "hu-HU:Schwein Hintereisbein/Hinterhaxe, roh", en: "en-GB:Schwein Hintereisbein/Hinterhaxe, roh" });
    expect(lastHaxe.data.searchText).toContain("schweinehaxe");
    expect(db.aliases.find((a) => a.foodId === "usda-1")).toMatchObject({ locale: "de", kind: "localized_name", provenance: { method: "ai_localization" } });
  });

  it("does nothing without a provider and counts names the provider did not return", async () => {
    const db = fakeDb([bacon]);
    expect(await backfillFoodNames({ prisma: db, provider: { id: "disabled", localize: vi.fn() }, log: () => undefined })).toEqual({ filled: 0, failed: 0 });
    expect(await backfillFoodNames({ prisma: db, provider: { id: "openai", localize: async () => new Map() }, log: () => undefined })).toEqual({ filled: 0, failed: 1 });
    expect(db.updates).toEqual([]);
  });

  it("translates from the English name where there is one, else the original", () => {
    expect(authoritativeName(bacon)).toBe("Pork, cured, bacon, unprepared");
    expect(authoritativeName(blsHaxe)).toBe("Schwein Hintereisbein/Hinterhaxe, roh");
  });
});
