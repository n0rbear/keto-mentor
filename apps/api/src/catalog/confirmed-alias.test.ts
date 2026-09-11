import { describe, expect, it } from "vitest";
import { learnConfirmedAlias } from "./confirmed-alias.js";

function fakePrisma() {
  const aliases: Array<{ foodId: string; alias: string; normalizedAlias: string; locale: string; kind: string; confidence: number; provenance: unknown }> = [];
  const prisma = {
    foodAlias: {
      upsert: async ({ where, create }: any) => {
        const key = where.foodId_normalizedAlias_locale;
        const existing = aliases.find((a) => a.foodId === key.foodId && a.normalizedAlias === key.normalizedAlias && a.locale === key.locale);
        if (existing) return existing;
        const row = { foodId: create.foodId, alias: create.alias, normalizedAlias: create.normalizedAlias, locale: create.locale, kind: create.kind, confidence: create.confidence, provenance: create.provenance };
        aliases.push(row);
        return row;
      }
    }
  };
  return { prisma, aliases };
}

const provenance = { sourceUrl: "https://example.com/r", ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" };

describe("learnConfirmedAlias: the strongest identity evidence (owner-beta blocker #8)", () => {
  it("6 — creates a trusted 'confirmed_external' alias, confidence 1, provenance recorded", async () => {
    const { prisma, aliases } = fakePrisma();
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "burgonya", foodLocale: "hu-HU", provenance });
    expect(aliases).toHaveLength(1);
    expect(aliases[0]).toMatchObject({ foodId: "food-1", normalizedAlias: "burgonya", locale: "hu-HU", kind: "confirmed_external", confidence: 1 });
    expect(aliases[0].provenance).toMatchObject({ method: "confirmed_external", ...provenance });
  });

  // Test 7 (required): alias stores/retains correct locale.
  it("7 — stores the EXACT regional locale it was given, never a collapsed bare language", async () => {
    const { prisma, aliases } = fakePrisma();
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "Erdapfel", foodLocale: "de-AT", provenance });
    expect(aliases[0].locale).toBe("de-AT");
    expect(aliases[0].locale).not.toBe("de");
  });

  // Test 8 (required): confirmation in locale A does not silently create alias in locale B.
  it("8 — confirming in de-AT never creates or touches a de-DE row for the same food/phrase", async () => {
    const { prisma, aliases } = fakePrisma();
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "erdapfel", foodLocale: "de-AT", provenance });
    expect(aliases.some((a) => a.locale === "de-DE")).toBe(false);
    expect(aliases).toHaveLength(1);
  });

  // Test 9 (required): same authoritative Food may safely have aliases in multiple locales.
  it("9 — the SAME Food may independently and safely gain confirmed aliases in multiple distinct locales", async () => {
    const { prisma, aliases } = fakePrisma();
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "burgonya", foodLocale: "hu-HU", provenance });
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "kartoffel", foodLocale: "de-DE", provenance });
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "erdapfel", foodLocale: "de-AT", provenance });
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "potato", foodLocale: "en-GB", provenance });
    expect(aliases).toHaveLength(4);
    expect(new Set(aliases.map((a) => a.foodId))).toEqual(new Set(["food-1"])); // all point to the same authoritative Food
    expect(new Set(aliases.map((a) => a.locale))).toEqual(new Set(["hu-HU", "de-DE", "de-AT", "en-GB"]));
  });

  // Test 10 (required): quantity/unit noise is not learned.
  it("10 — learns only the parsed food identity, never quantity/unit noise", async () => {
    const { prisma, aliases } = fakePrisma();
    // The caller is expected to pass parsedFoodQuery (identity only), not
    // the raw ingredient text — this test proves the function itself never
    // re-parses or otherwise re-introduces quantity/unit into what it stores.
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "burgonya", foodLocale: "hu-HU", provenance });
    expect(aliases[0].alias).toBe("burgonya");
    expect(aliases[0].alias).not.toMatch(/\d/); // no digits/quantity ever present
  });

  it("is idempotent — confirming the same phrase/locale/food twice writes exactly one row", async () => {
    const { prisma, aliases } = fakePrisma();
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "burgonya", foodLocale: "hu-HU", provenance });
    await learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "burgonya", foodLocale: "hu-HU", provenance });
    expect(aliases).toHaveLength(1);
  });

  it("silently no-ops (never throws) for an empty/too-short parsed identity", async () => {
    const { prisma, aliases } = fakePrisma();
    await expect(learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "", foodLocale: "hu-HU", provenance })).resolves.toBeUndefined();
    await expect(learnConfirmedAlias(prisma, { foodId: "food-1", parsedFoodQuery: "a", foodLocale: "hu-HU", provenance })).resolves.toBeUndefined();
    expect(aliases).toHaveLength(0);
  });

  it("never throws even if the underlying write fails — best-effort, never load-bearing", async () => {
    const prisma = { foodAlias: { upsert: async () => { throw new Error("db down"); } } };
    await expect(learnConfirmedAlias(prisma as any, { foodId: "food-1", parsedFoodQuery: "burgonya", foodLocale: "hu-HU", provenance })).resolves.toBeUndefined();
  });
});
