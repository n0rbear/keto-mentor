import { describe, expect, it } from "vitest";
import { interpretMealInput, type InterpretResult } from "./interpret.js";
import { normalizeSearch } from "../catalog/normalize.js";

type Serving = { id: string; key: string; unit: string; labels: Record<string, string>; grams: number; isEstimated: boolean; confidence: number; provenance: unknown };
type Food = {
  id: string;
  name: string;
  names: Record<string, string>;
  synonyms: Record<string, string[]>;
  servingUnit?: string;
  servingGrams?: number;
  isEstimated?: boolean;
  confidence?: number;
  kcalPer100g: number;
};

const baseFoods: Food[] = [
  { id: "catalog-egg", name: "Egg", names: { hu: "Tojás", de: "Ei", en: "Egg" }, synonyms: { hu: ["tojás", "tojas"], de: ["ei"], en: ["egg", "eggs"] }, servingUnit: "egg", servingGrams: 46, kcalPer100g: 143 },
  { id: "catalog-fried-egg", name: "Fried egg", names: { hu: "Tükörtojás", de: "Spiegelei", en: "Fried egg" }, synonyms: { hu: ["tükörtojás", "tukortojas", "sült tojás", "sult tojas"], de: ["spiegelei"], en: ["fried egg"] }, servingUnit: "egg", servingGrams: 46, kcalPer100g: 196 },
  // Scrambled egg intentionally has NO serving: USDA's 100 g basis is not
  // evidence that one egg of scrambled egg weighs ~100 g, so no per-egg
  // FoodServing is created and quantity must be entered manually.
  { id: "catalog-scrambled-egg", name: "Scrambled egg", names: { hu: "Rántotta", de: "Rührei", en: "Scrambled egg" }, synonyms: { hu: ["rántotta", "rantotta", "tojásrántotta", "tojasrantotta"], de: ["ruhrei"], en: ["scrambled egg", "eggs scrambled"] }, kcalPer100g: 149 },
  { id: "catalog-cheddar", name: "Cheddar cheese", names: { hu: "Cheddar sajt", de: "Cheddar", en: "Cheddar cheese" }, synonyms: { hu: ["cheddar", "sajt"], de: ["cheddar", "käse", "kase"], en: ["cheddar", "cheese"] }, servingUnit: "slice", servingGrams: 28, kcalPer100g: 403 },
  { id: "catalog-gouda", name: "Gouda cheese", names: { hu: "Gouda sajt", de: "Gouda", en: "Gouda cheese" }, synonyms: { hu: ["gouda", "sajt"], de: ["gouda", "käse", "kase"], en: ["gouda", "cheese"] }, servingUnit: "slice", servingGrams: 28, kcalPer100g: 356 },
  { id: "catalog-cucumber", name: "Cucumber", names: { hu: "Kígyóuborka", de: "Gurke", en: "Cucumber" }, synonyms: { hu: ["kígyóuborka", "kigyouborka", "uborka"], de: ["gurke", "salatgurke"], en: ["cucumber"] }, servingUnit: "piece", servingGrams: 300, isEstimated: true, confidence: 0.7, kcalPer100g: 15 }
];

function makePrisma() {
  const foods = baseFoods.map((f) => ({
    ...f,
    createdById: null,
    searchText: normalizeSearch([f.name, ...Object.values(f.synonyms).flat()].join(" ")),
    servings: f.servingUnit && f.servingGrams != null
      ? [{ id: `${f.id}-serving`, key: f.servingUnit, unit: f.servingUnit, labels: { en: f.servingUnit }, grams: f.servingGrams, isEstimated: f.isEstimated ?? false, confidence: f.confidence ?? 1, provenance: { method: "curated_seed" } }]
      : []
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
    expect(r.quantity?.grams).toBe(5 * 46);
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