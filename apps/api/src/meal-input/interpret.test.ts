import { describe, expect, it } from "vitest";
import { resolveQuantity, interpretMealInput } from "./interpret.js";
import { DisabledQuantityEstimationProvider, validateQuantityEstimate } from "./quantity-estimation.js";
import type { PrismaClient } from "@prisma/client";

const eggFood = { id: "catalog-egg", source: "usda_fdc", sourceId: "1", name: "Egg", servings: [
  { id: "piece", key: "egg", unit: "egg", labels: { en: "egg" }, grams: 46, isEstimated: false, confidence: 1, provenance: { source: "USDA food_portion" } },
  { id: "slice", key: "slice", unit: "slice", labels: { en: "slice" }, grams: 28, isEstimated: true, confidence: .7, provenance: { method: "curated estimate" } }
] };

describe("human quantity resolution", () => {
  it("keeps measured mass exact", async () => expect(await resolveQuantity({ quantity: 125, unit: "g", foodQuery: "uborka" }, eggFood)).toMatchObject({ grams: 125, method: "measured", confidence: 1, estimated: false, requiresConfirmation: false }));
  it("uses an authoritative Food serving", async () => expect(await resolveQuantity({ quantity: 5, unit: "piece", foodQuery: "tojas" }, eggFood)).toMatchObject({ grams: 230, servingId: "piece", method: "authoritative", requiresConfirmation: false }));
  it("makes estimates visible and confirmable", async () => expect(await resolveQuantity({ quantity: 3, unit: "slice", foodQuery: "gouda" }, eggFood)).toMatchObject({ grams: 84, method: "estimated", confidence: .7, estimated: true, requiresConfirmation: true }));
  it("does not invent a centimetre conversion when no provider is configured", async () => expect(await resolveQuantity({ quantity: 15, unit: "cm", foodQuery: "uborka" }, eggFood, new DisabledQuantityEstimationProvider())).toMatchObject({ status: "unresolved", reason: "conversion_missing" }));
  it("accepts a structured AI estimate but never nutrition", async () => expect(await resolveQuantity({ quantity: 15, unit: "cm", foodQuery: "uborka" }, eggFood, { id: "test", async estimate() { return { gramsPerUnit: 8.5, confidence: .62, method: "ai_estimated", provenance: { provider: "test", modelOrRule: "fixture", estimatedAt: "2026-08-14T00:00:00Z" } }; } })).toMatchObject({ grams: 127.5, method: "ai_estimated", requiresConfirmation: true }));
  it("rejects estimates without traceable provenance", () => expect(() => validateQuantityEstimate({ gramsPerUnit: 10, confidence: .5, method: "estimated", provenance: {} })).toThrow("incomplete_estimate_provenance"));
});

const records = [
  { id: "catalog-egg", name: "Egg", originalName: "Egg", names: { hu: "Tojás" }, searchText: "tojas tojás egg", servings: [
    { id: "piece", key: "egg", unit: "egg", labels: { en: "egg" }, grams: 46, isEstimated: false, confidence: 1, provenance: { source: "USDA" } }
  ] },
  { id: "catalog-fried-egg", name: "Fried egg", originalName: "Egg, fried", names: { hu: "Tükörtojás" }, searchText: "tukortojas spiegelei fried egg sult tojas", servings: [
    { id: "piece", key: "egg", unit: "egg", labels: { en: "egg" }, grams: 46, isEstimated: false, confidence: 1, provenance: { source: "USDA" } }
  ] },
  { id: "catalog-cheddar", name: "Cheddar cheese", names: { hu: "Cheddar sajt" }, searchText: "cheddar sajt cheese", servings: [] },
  { id: "catalog-gouda", name: "Gouda cheese", names: { hu: "Gouda sajt" }, searchText: "gouda sajt cheese", servings: [] },
  { id: "catalog-cucumber", name: "Kígyóuborka", names: { hu: "Kígyóuborka" }, searchText: "kigyouborka uborka cucumber", servings: [] },
  { id: "catalog-chicken-drumstick", name: "Csirkecomb", names: { hu: "Csirkecomb" }, searchText: "csirkecomb chicken leg", servings: [] },
  { id: "catalog-chicken-breast", name: "Csirkemell", names: { hu: "Csirkemell" }, searchText: "csirkemell chicken breast", servings: [] }
];

const mockPrisma = {
  foodAlias: { findMany: async () => [] },
  food: {
    findMany: async ({ where, include }: any) => {
      if (where.id?.in) return records.filter((r) => where.id.in.includes(r.id)).map((r) => ({ ...r, servings: include?.servings ? r.servings : undefined }));
      const queries = where.OR.map((c: any) => c.searchText.contains);
      return records.filter((r) => queries.some((q: string) => r.searchText.includes(q)));
    }
  }
} as unknown as Pick<PrismaClient, "food" | "foodAlias">;

describe("interpretMealInput", () => {
  it("'5 tojás' resolves to generic egg, not fried egg", async () => {
    const r = await interpretMealInput(mockPrisma, "5 tojás");
    expect(r.parsed).toEqual({ quantity: 5, unit: "piece", foodQuery: "tojas" });
    expect(r.foodResolution).toBe("resolved");
    expect(r.selectedFood?.id).toBe("catalog-egg");
    expect(r.quantity).toMatchObject({ status: "resolved", grams: 230, method: "authoritative" });
    expect(r.canConfirm).toBe(true);
    expect(r.preparation).toBeUndefined();
  });

  it("'3 tükörtojás' separates preparation; generic egg is selected, fried is an attribute", async () => {
    const r = await interpretMealInput(mockPrisma, "3 tükörtojás");
    expect(r.parsed.preparation).toBe("fried");
    expect(r.parsed.foodQuery).toBe("tojas");
    expect(r.selectedFood?.id).toBe("catalog-egg");
    expect(r.quantity).toMatchObject({ status: "resolved", grams: 138 });
    expect(r.canConfirm).toBe(true);
  });

  it("'5 tojásból rántotta' -> base egg + scrambled, uses egg serving (not fried nutrition confusion)", async () => {
    const r = await interpretMealInput(mockPrisma, "5 tojásból rántotta");
    expect(r.parsed).toMatchObject({ quantity: 5, unit: "piece", foodQuery: "tojas", preparation: "scrambled" });
    expect(r.selectedFood?.id).toBe("catalog-egg");
    expect(r.quantity).toMatchObject({ status: "resolved", grams: 230 });
    expect(r.canConfirm).toBe(true);
  });

  it("'tojásrántotta 5 tojásból' -> base egg + scrambled", async () => {
    const r = await interpretMealInput(mockPrisma, "tojásrántotta 5 tojásból");
    expect(r.parsed).toMatchObject({ quantity: 5, unit: "piece", foodQuery: "tojas", preparation: "scrambled" });
    expect(r.quantity).toMatchObject({ status: "resolved", grams: 230 });
  });

  it("'2 szelet gouda' is recognized but has no slice serving -> unresolved conversion", async () => {
    const r = await interpretMealInput(mockPrisma, "2 szelet gouda");
    expect(r.parsed).toEqual({ quantity: 2, unit: "slice", foodQuery: "gouda" });
    expect(r.selectedFood?.id).toBe("catalog-gouda");
    expect(r.quantity).toMatchObject({ status: "unresolved", reason: "conversion_missing" });
    expect(r.canConfirm).toBe(false);
  });

  it("generic 'sajt' returns candidates, not a silent single cheese", async () => {
    const r = await interpretMealInput(mockPrisma, "sajt");
    expect(r.parsed.foodQuery).toBe("sajt");
    const ids = r.candidates.map((c) => c.id);
    expect(ids).toContain("catalog-cheddar");
    expect(ids).toContain("catalog-gouda");
    expect(r.selectedFood).not.toBeNull();
  });

  it("'100 g bacon' uses exact mass and stays unresolved when food unknown", async () => {
    const r = await interpretMealInput(mockPrisma, "100 g bacon");
    expect(r.parsed).toEqual({ quantity: 100, unit: "g", foodQuery: "bacon" });
    expect(r.foodResolution).toBe("unresolved");
    expect(r.selectedFood).toBeNull();
  });

  it("'12 cm kígyóuborka' recognizes food + length but does not invent grams", async () => {
    const r = await interpretMealInput(mockPrisma, "12 cm kígyóuborka");
    expect(r.parsed).toEqual({ quantity: 12, unit: "cm", foodQuery: "kigyouborka" });
    expect(r.selectedFood?.id).toBe("catalog-cucumber");
    expect(r.quantity).toMatchObject({ status: "unresolved", reason: "conversion_missing" });
    expect(r.canConfirm).toBe(false);
  });

  it("'fél kígyóuborka' parses half quantity", async () => {
    const r = await interpretMealInput(mockPrisma, "fél kígyóuborka");
    expect(r.parsed).toEqual({ quantity: 0.5, unit: "piece", foodQuery: "kigyouborka" });
  });

  it("unknown food stays unresolved without a fake match", async () => {
    const r = await interpretMealInput(mockPrisma, "valami különös étel");
    expect(r.foodResolution).toBe("unresolved");
    expect(r.selectedFood).toBeNull();
    expect(r.canConfirm).toBe(false);
  });

  it("diacritic-free input still resolves the food", async () => {
    const r = await interpretMealInput(mockPrisma, "kigyouborka");
    expect(r.parsed.foodQuery).toBe("kigyouborka");
    expect(r.selectedFood?.id).toBe("catalog-cucumber");
  });

  it("'2 csirkecomb és fél csirkemell' yields two interpreted items", async () => {
    const r = await interpretMealInput(mockPrisma, "2 csirkecomb és fél csirkemell");
    expect(r.foodResolution).toBe("multi");
    expect(r.items).toHaveLength(2);
    expect(r.items?.[0].parsed).toEqual({ quantity: 2, unit: "piece", foodQuery: "csirkecomb" });
    expect(r.items?.[1].parsed).toEqual({ quantity: 0.5, unit: "piece", foodQuery: "csirkemell" });
  });
});