import { describe, expect, it } from "vitest";
import { interpretMealInput, type InterpretResult } from "./interpret.js";
import { normalizeSearch } from "../catalog/normalize.js";

type Serving = { id: string; key: string; unit: string; labels: Record<string, string>; grams: number; isEstimated: boolean; confidence: number; provenance: unknown };
type Food = {
  id: string;
  name: string;
  names: Record<string, string>;
  synonyms: Record<string, string[]>;
  servings?: Serving[];
  kcalPer100g: number;
};

const baseFoods: Food[] = [
  { id: "catalog-egg", name: "Egg", names: { hu: "Tojás", de: "Ei", en: "Egg" }, synonyms: { hu: ["tojás", "tojas"], de: ["ei", "eier"], en: ["egg", "eggs"] }, servings: [{ id: "egg", key: "egg", unit: "egg", labels: { en: "egg", hu: "tojás", de: "Ei" }, grams: 50, isEstimated: false, confidence: 1, provenance: { method: "authoritative", fdcId: "171287", portionId: "88374" } }], kcalPer100g: 143 },
  { id: "catalog-fried-egg", name: "Fried egg", names: { hu: "Tükörtojás", de: "Spiegelei", en: "Fried egg" }, synonyms: { hu: ["tükörtojás", "tukortojas", "sült tojás", "sult tojas"], de: ["spiegelei"], en: ["fried egg"] }, servings: [{ id: "fried-egg", key: "egg", unit: "egg", labels: { en: "egg", hu: "tojás", de: "Ei" }, grams: 46, isEstimated: false, confidence: 1, provenance: { method: "authoritative", fdcId: "173423", portionId: "92497" } }], kcalPer100g: 196 },
  // Generic scrambled egg intentionally has no per-egg serving until a
  // preparation-specific confirmation flow exists.
  { id: "catalog-scrambled-egg", name: "Scrambled egg", names: { hu: "Rántotta", de: "Rührei", en: "Scrambled egg" }, synonyms: { hu: ["rántotta", "rantotta", "tojásrántotta", "tojasrantotta"], de: ["ruhrei"], en: ["scrambled egg", "eggs scrambled"] }, kcalPer100g: 149 },
  { id: "catalog-avocado", name: "Avocado", names: { hu: "Avokádó", de: "Avocado", en: "Avocado" }, synonyms: { hu: ["avokádó", "avokado"], de: ["avocado"], en: ["avocado"] }, servings: [
    { id: "avocado-half", key: "half", unit: "half", labels: { en: "half", hu: "fél", de: "halbe" }, grams: 100.5, isEstimated: false, confidence: 1, provenance: { method: "authoritative_derived", fdcId: "171705", portionId: "89226" } },
    { id: "avocado-piece", key: "piece", unit: "piece", labels: { en: "whole avocado" }, grams: 201, isEstimated: false, confidence: 1, provenance: { method: "authoritative", fdcId: "171705", portionId: "89226" } }
  ], kcalPer100g: 160 },
  { id: "catalog-butter", name: "Butter", names: { hu: "Vaj", de: "Butter", en: "Butter" }, synonyms: { hu: ["vaj"], de: ["butter"], en: ["butter"] }, servings: [
    { id: "butter-tbsp", key: "tbsp", unit: "tbsp", labels: { en: "tablespoon", hu: "evőkanál", de: "Esslöffel" }, grams: 14.2, isEstimated: false, confidence: 1, provenance: { method: "authoritative", fdcId: "173430", portionId: "92512" } },
    { id: "butter-tsp", key: "tsp", unit: "tsp", labels: { en: "teaspoon", hu: "teáskanál", de: "Teelöffel" }, grams: 14.2 / 3, isEstimated: false, confidence: 1, provenance: { method: "authoritative_derived", fdcId: "173430", portionId: "92512" } }
  ], kcalPer100g: 717 },
  { id: "catalog-cheddar", name: "Cheddar cheese", names: { hu: "Cheddar sajt", de: "Cheddar", en: "Cheddar cheese" }, synonyms: { hu: ["cheddar", "sajt"], de: ["cheddar", "käse", "kase"], en: ["cheddar", "cheese"] }, servings: [{ id: "cheddar-slice", key: "slice", unit: "slice", labels: { en: "slice" }, grams: 28, isEstimated: false, confidence: 1, provenance: { method: "authoritative", fdcId: "173414", portionId: "92472" } }], kcalPer100g: 403 },
  { id: "catalog-gouda", name: "Gouda cheese", names: { hu: "Gouda sajt", de: "Gouda", en: "Gouda cheese" }, synonyms: { hu: ["gouda", "sajt"], de: ["gouda", "käse", "kase"], en: ["gouda", "cheese"] }, servings: [{ id: "gouda-slice", key: "slice", unit: "slice", labels: { en: "slice" }, grams: 28.35, isEstimated: true, confidence: 0.7, provenance: { method: "reference_estimate", fdcId: "171241", portionId: "88235" } }], kcalPer100g: 356 },
  { id: "catalog-cucumber", name: "Cucumber", names: { hu: "Kígyóuborka", de: "Gurke", en: "Cucumber" }, synonyms: { hu: ["kígyóuborka", "kigyouborka", "uborka"], de: ["gurke", "salatgurke"], en: ["cucumber"] }, servings: [{ id: "cucumber-piece", key: "piece", unit: "piece", labels: { en: "piece" }, grams: 300, isEstimated: true, confidence: 0.7, provenance: { method: "curated_estimate" } }], kcalPer100g: 15 }
];

function makePrisma() {
  const foods = baseFoods.map((f) => ({
    ...f,
    createdById: null,
    searchText: normalizeSearch([f.name, ...Object.values(f.synonyms).flat()].join(" ")),
    servings: f.servings ?? []
  }));
  const aliasRows = baseFoods.flatMap((f) => Object.values(f.synonyms).flat().map((a) => ({ foodId: f.id, normalizedAlias: normalizeSearch(a) })));

  return {
    foodAlias: {
      findMany: async ({ where }: any) => {
        const variants = where.OR.map((o: any) => o.normalizedAlias.contains as string);
        return aliasRows.filter((r) => variants.some((v: string) => r.normalizedAlias.includes(v)));
      }
    },
    food: {
      findMany: async ({ where }: any) => {
        const variants = where.OR.map((o: any) => o.searchText.contains as string);
        return foods
          .filter((f) => f.createdById === null && variants.some((v: string) => f.searchText.toLowerCase().includes(v.toLowerCase())))
          .map((f) => ({ ...f }));
      }
    }
  } as any;
}

const prisma = makePrisma();

describe("meal input interpretation", () => {
  it("5 tojás -> generic Egg", async () => {
    const r: InterpretResult = await interpretMealInput(prisma, "5 tojás");
    expect(r.selectedFood?.id).toBe("catalog-egg");
    expect(r.preparation).toBeUndefined();
    expect(r.quantity?.grams).toBe(5 * 50);
    expect(r.canConfirm).toBe(true);
  });

  it("3 tükörtojás -> fried Egg nutrition, not generic/raw Egg", async () => {
    const r = await interpretMealInput(prisma, "3 tükörtojás");
    expect(r.selectedFood?.id).toBe("catalog-fried-egg");
    expect(r.preparation).toBe("fried");
    expect(r.quantity?.grams).toBe(3 * 46);
    expect(r.canConfirm).toBe(true);
  });

  it("5 tojásból rántotta -> scrambled Egg food resolved, but no trustworthy per-egg conversion exists", async () => {
    const r = await interpretMealInput(prisma, "5 tojásból rántotta");
    expect(r.selectedFood?.id).toBe("catalog-scrambled-egg");
    expect(r.preparation).toBe("scrambled");
    // No per-egg FoodServing exists for scrambled egg (USDA 100 g basis is NOT
    // a per-egg cooked weight), so the FOOD still resolves but the quantity
    // cannot be converted: it must be unresolved / conversion_missing and no
    // 500 g value invented.
    expect(r.foodResolution).toBe("resolved");
    expect(r.quantity?.status).toBe("unresolved");
    expect(r.quantity?.reason).toBe("conversion_missing");
    expect(r.quantity?.grams).toBeUndefined();
    expect(r.canConfirm).toBe(false);
  });

  it("főtt tojás -> does NOT confirm/silently use raw/fried/scrambled nutrition when boiled Food is unavailable", async () => {
    const r = await interpretMealInput(prisma, "főtt tojás");
    expect(r.preparation).toBe("boiled");
    expect(r.preparationUnavailable).toBe(true);
    expect(r.canConfirm).toBe(false);
    expect(r.foodResolution).toBe("confirmation_required");
    // The displayed candidate may fall back to the base egg for review, but it
    // must NOT be auto-confirmed: the user must explicitly choose/confirm.
    expect(r.quantity?.status === "resolved" ? r.quantity.requiresConfirmation || r.ambiguous || r.preparationUnavailable : true).toBe(true);
  });

  it("generic sajt -> ambiguous/candidate confirmation, never arbitrary Cheddar/Gouda auto-resolution", async () => {
    const r = await interpretMealInput(prisma, "sajt");
    expect(r.ambiguous).toBe(true);
    expect(r.canConfirm).toBe(false);
    expect(r.candidates.map((c) => c.id)).toEqual(expect.arrayContaining(["catalog-cheddar", "catalog-gouda"]));
    expect(r.foodResolution).toBe("confirmation_required");
  });

  it("explicit Gouda -> Gouda", async () => {
    const r = await interpretMealInput(prisma, "gouda");
    expect(r.selectedFood?.id).toBe("catalog-gouda");
    expect(r.ambiguous).toBeFalsy();
  });

  it("2 eggs resolve to the exact base Egg in HU / DE / EN", async () => {
    for (const input of ["2 tojás", "2 Eier", "2 eggs"]) {
      const r = await interpretMealInput(prisma, input);
      expect(r.selectedFood?.id).toBe("catalog-egg");
      expect(r.ambiguous).toBe(false);
      expect(r.quantity?.grams).toBe(100);
      expect(r.canConfirm).toBe(true);
    }
  });

  it("fried egg keeps the prepared identity and its own serving", async () => {
    const r = await interpretMealInput(prisma, "1 fried egg");
    expect(r.selectedFood?.id).toBe("catalog-fried-egg");
    expect(r.quantity?.grams).toBe(46);
    expect(r.canConfirm).toBe(true);
  });

  it("half avocado prefers the explicit authoritative half serving in HU / DE / EN", async () => {
    for (const input of ["fél avokádó", "halbe Avocado", "half avocado"]) {
      const r = await interpretMealInput(prisma, input);
      expect(r.selectedFood?.id).toBe("catalog-avocado");
      expect(r.parsed).toMatchObject({ quantity: 1, unit: "half" });
      expect(r.quantity?.servingId).toBe("avocado-half");
      expect(r.quantity?.grams).toBe(100.5);
      expect(r.canConfirm).toBe(true);
    }
  });

  it("whole avocado uses the authoritative whole-food serving", async () => {
    const r = await interpretMealInput(prisma, "whole avocado");
    expect(r.quantity?.servingId).toBe("avocado-piece");
    expect(r.quantity?.grams).toBe(201);
    expect(r.canConfirm).toBe(true);
  });

  it("butter tablespoon resolves authoritatively in HU / DE / EN", async () => {
    for (const input of ["1 evőkanál vaj", "1 EL Butter", "1 tbsp butter"]) {
      const r = await interpretMealInput(prisma, input);
      expect(r.selectedFood?.id).toBe("catalog-butter");
      expect(r.quantity?.grams).toBe(14.2);
      expect(r.canConfirm).toBe(true);
    }
  });

  it("butter teaspoon resolves separately in HU / DE / EN", async () => {
    for (const input of ["1 teáskanál vaj", "1 TL Butter", "1 tsp butter"]) {
      const r = await interpretMealInput(prisma, input);
      expect(r.quantity?.grams).toBeCloseTo(14.2 / 3, 8);
      expect(r.canConfirm).toBe(true);
    }
  });

  it("3 Gouda slices remain estimated because USDA has no generic Gouda slice portion", async () => {
    for (const input of ["3 szelet gouda", "3 Scheiben Gouda", "3 slices gouda"]) {
      const r = await interpretMealInput(prisma, input);
      expect(r.selectedFood?.id).toBe("catalog-gouda");
      expect(r.quantity?.grams).toBeCloseTo(85.05, 8);
      expect(r.quantity?.estimated).toBe(true);
      expect(r.quantity?.requiresConfirmation).toBe(true);
      expect(r.canConfirm).toBe(false);
    }
  });

  it("generic cheese remains ambiguous in HU / DE / EN", async () => {
    for (const input of ["sajt", "Käse", "cheese"]) {
      const r = await interpretMealInput(prisma, input);
      expect(r.ambiguous).toBe(true);
      expect(r.canConfirm).toBe(false);
      expect(r.candidates.map((candidate) => candidate.id)).toEqual(expect.arrayContaining(["catalog-cheddar", "catalog-gouda"]));
    }
  });

  it("half of an estimated piece preserves the confirmation requirement", async () => {
    const r = await interpretMealInput(prisma, "fél kígyóuborka");
    expect(r.quantity?.grams).toBe(150);
    expect(r.quantity?.estimated).toBe(true);
    expect(r.quantity?.requiresConfirmation).toBe(true);
    expect(r.canConfirm).toBe(false);
  });

  it("1 kg conversion remains exactly 1000 g", async () => {
    const r = await interpretMealInput(prisma, "1 kg cheddar");
    expect(r.quantity?.grams).toBe(1000);
    expect(r.quantity?.requiresConfirmation).toBe(false);
    expect(r.canConfirm).toBe(true);
  });

  it("500 g resolves to 500 g (measured mass is authoritative)", async () => {
    const r = await interpretMealInput(prisma, "500 g cheddar");
    expect(r.quantity?.grams).toBe(500);
    expect(r.canConfirm).toBe(true);
  });

  it("estimated serving in multi-item cannot be silently logged", async () => {
    const r = await interpretMealInput(prisma, "1 db uborka és 1 kg cheddar");
    expect(r.foodResolution).toBe("multi");
    expect(r.canConfirm).toBe(false);
    const cucumber = r.items?.find((it) => it.selectedFood?.id === "catalog-cucumber");
    expect(cucumber?.quantity?.requiresConfirmation).toBe(true);
  });

  it("unresolved item disables Log all", async () => {
    const r = await interpretMealInput(prisma, "főtt tojás és 1 kg cheddar");
    expect(r.foodResolution).toBe("multi");
    expect(r.canConfirm).toBe(false);
    const boiled = r.items?.find((it) => it.preparation === "boiled");
    expect(boiled?.canConfirm).toBe(false);
  });

  it("measured mass (kg) in multi-item keeps exactly 1000 g for the kg item", async () => {
    const r = await interpretMealInput(prisma, "1 kg cheddar és 200 g gouda");
    expect(r.canConfirm).toBe(true);
    const kgItem = r.items?.find((it) => it.parsed.unit === "kg");
    const gItem = r.items?.find((it) => it.parsed.unit === "g");
    expect(kgItem?.quantity?.grams).toBe(1000);
    expect(gItem?.quantity?.grams).toBe(200);
  });
});
