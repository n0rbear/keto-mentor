import { describe, expect, it, vi } from "vitest";
import { interpretMealInput, type InterpretResult } from "./interpret.js";
import { normalizeSearch } from "../catalog/normalize.js";
import type { AiProvider } from "../ai/provider.js";
import type { FoodUnderstanding } from "@keto-mentor/shared";

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
  { id: "catalog-cucumber", name: "Cucumber", names: { hu: "Kígyóuborka", de: "Gurke", en: "Cucumber" }, synonyms: { hu: ["kígyóuborka", "kigyouborka", "uborka"], de: ["gurke", "salatgurke"], en: ["cucumber"] }, servings: [{ id: "cucumber-piece", key: "piece", unit: "piece", labels: { en: "piece" }, grams: 300, isEstimated: true, confidence: 0.7, provenance: { method: "curated_estimate" } }], kcalPer100g: 15 },
  { id: "catalog-sausage", name: "Sausage", names: { hu: "Virsli", de: "Würstchen", en: "Sausage" }, synonyms: { hu: ["virsli"], de: ["wurstchen"], en: ["sausage"] }, servings: [{ id: "sausage-piece", key: "piece", unit: "piece", labels: { en: "piece" }, grams: 50, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } }], kcalPer100g: 300 },
  { id: "catalog-pepper", name: "Pepper", names: { hu: "Paprika", de: "Paprika", en: "Pepper" }, synonyms: { hu: ["paprika"], de: ["paprika"], en: ["pepper"] }, kcalPer100g: 20 },
  { id: "catalog-peanut", name: "Peanuts", names: { hu: "Földimogyoró", de: "Erdnüsse", en: "Peanuts" }, synonyms: { hu: ["mogyoró", "foldimogyoro"], de: ["erdnusse"], en: ["peanut", "peanuts"] }, kcalPer100g: 567 },
  { id: "catalog-broth", name: "Soup", names: { hu: "Húsleves", de: "Suppe", en: "Soup" }, synonyms: { hu: ["húsleves", "husleves"], de: ["suppe"], en: ["soup"] }, kcalPer100g: 35 },
  { id: "catalog-roast-chicken", name: "Roast chicken", names: { hu: "Grillcsirke", de: "Grillhähnchen", en: "Roast chicken" }, synonyms: { hu: ["grillcsirke"], de: ["grillhahnchen"], en: ["roast chicken"] }, kcalPer100g: 239 },
  { id: "catalog-chicken-breast", name: "Chicken breast", names: { hu: "Csirkemell", de: "Hähnchenbrust", en: "Chicken breast" }, synonyms: { hu: ["csirkemell"], de: ["hahnchenbrust"], en: ["chicken breast"] }, kcalPer100g: 120 }
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

class MockFoodNlpProvider implements AiProvider {
  id = "mock-food-nlp";
  model = "fixture-v1";
  calls = 0;
  constructor(private readonly result: FoodUnderstanding | Error) {}
  supports(capability: string) { return capability === "food_nlp"; }
  async run<TInput, TOutput>(): Promise<TOutput> {
    this.calls += 1;
    if (this.result instanceof Error) throw this.result;
    return this.result as TOutput;
  }
}

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

  it("never calls quantity AI for unresolved or ambiguous food", async () => {
    const quantity = { id: "spy", estimate: vi.fn() };
    await interpretMealInput(prisma, "egy marék ismeretlenétel", quantity);
    await interpretMealInput(prisma, "egy szelet sajt", quantity);
    expect(quantity.estimate).not.toHaveBeenCalled();
  });

  it("asks only the first useful quantity clarification in a multi-item meal", async () => {
    const quantity = { id: "fixture", estimate: vi.fn(async () => ({ gramsPerUnit: 30, rangeGramsPerUnit: { min: 25, max: 35 }, confidence: .8, method: "ai_estimated" as const, provenance: { provider: "fixture", modelOrRule: "fixture", estimatedAt: "2026-09-06T00:00:00Z" } })) };
    const result = await interpretMealInput(prisma, "egy marék mogyoró és mogyoró", quantity);
    expect(result.clarification).toMatchObject({ itemIndex: 0, type: "estimate_confirmation", suggestedGrams: 30 });
    expect(quantity.estimate).toHaveBeenCalledOnce();
  });

  it("uses quantity AI only after a trusted food resolves", async () => {
    const quantity = { id: "fixture", estimate: vi.fn(async () => ({ gramsPerUnit: 30, rangeGramsPerUnit: { min: 25, max: 35 }, confidence: .8, method: "ai_estimated" as const, provenance: { provider: "fixture", modelOrRule: "fixture", estimatedAt: "2026-09-06T00:00:00Z" } })) };
    const result = await interpretMealInput(prisma, "egy marék mogyoró", quantity);
    expect(result.selectedFood?.id).toBe("catalog-peanut");
    expect(result.quantity).toMatchObject({ grams: 30, method: "ai_estimated", requiresConfirmation: true });
    expect(result.clarification?.type).toBe("estimate_confirmation");
    expect(quantity.estimate).toHaveBeenCalledOnce();
  });

  it("missing quantity asks the user and does not invoke AI", async () => {
    const quantity = { id: "spy", estimate: vi.fn() };
    const result = await interpretMealInput(prisma, "mogyoró", quantity);
    expect(result.clarification?.type).toBe("quantity_missing");
    expect(quantity.estimate).not.toHaveBeenCalled();
  });

  it.each([
    ["2 tojás", "catalog-egg", 100, "authoritative", 0, false],
    ["3 szelet Gouda", "catalog-gouda", 85.05, "estimated", 0, true],
    ["egy marék mogyoró", "catalog-peanut", 30, "ai_estimated", 1, true],
    ["két merőkanál húsleves", "catalog-broth", 500, "ai_estimated", 1, true],
    ["fél grillcsirke", "catalog-roast-chicken", 400, "ai_estimated", 1, true],
    ["200 g csirkemell", "catalog-chicken-breast", 200, "measured", 0, false],
    ["eine Handvoll Erdnüsse", "catalog-peanut", 30, "ai_estimated", 1, true],
    ["zwei Kellen Suppe", "catalog-broth", 500, "ai_estimated", 1, true],
    ["ein halbes Grillhähnchen", "catalog-roast-chicken", 400, "ai_estimated", 1, true],
    ["a handful of peanuts", "catalog-peanut", 30, "ai_estimated", 1, true],
    ["two ladles of soup", "catalog-broth", 500, "ai_estimated", 1, true],
    ["half a roast chicken", "catalog-roast-chicken", 400, "ai_estimated", 1, true]
  ] as const)("Phase 2 demo: %s", async (input, foodId, grams, method, calls, confirmation) => {
    const estimate = vi.fn(async ({ parsed }: any) => {
      const gramsPerUnit = parsed.unit === "handful" ? 30 : parsed.unit === "ladle" ? 250 : 400;
      return { gramsPerUnit, rangeGramsPerUnit: { min: gramsPerUnit * .8, max: gramsPerUnit * 1.2 }, confidence: .75, method: "ai_estimated" as const, provenance: { provider: "fixture", modelOrRule: "fixture", estimatedAt: "2026-09-06T00:00:00Z" } };
    });
    const result = await interpretMealInput(prisma, input, { id: "fixture", estimate });
    expect(result.selectedFood?.id).toBe(foodId);
    expect(result.quantity?.grams).toBeCloseTo(grams, 6);
    expect(result.quantity?.method).toBe(method);
    expect(result.quantity?.requiresConfirmation).toBe(confirmation);
    expect(estimate).toHaveBeenCalledTimes(calls);
  });

  it("Phase 2 demo keeps unresolved lecsó out of quantity AI", async () => {
    const estimate = vi.fn();
    const result = await interpretMealInput(prisma, "egy tányér lecsó", { id: "spy", estimate });
    expect(result.selectedFood).toBeNull();
    expect(result.canConfirm).toBe(false);
    expect(estimate).not.toHaveBeenCalled();
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

  it("does not call AI for safe deterministic egg or Gouda inputs", async () => {
    const ai = new MockFoodNlpProvider(new Error("must not be called"));
    const egg = await interpretMealInput(prisma, "2 tojás", undefined, ai);
    const gouda = await interpretMealInput(prisma, "3 szelet Gouda", undefined, ai);
    expect(egg.interpretationSource).toBe("deterministic");
    expect(gouda.interpretationSource).toBe("deterministic");
    expect(ai.calls).toBe(0);
  });

  it("represents a compound dish and independently resolves only explicit trusted components", async () => {
    const ai = new MockFoodNlpProvider({
      language: "hu", kind: "compound_dish", dishName: "lecsó", confidence: 0.96,
      clarificationNeeded: true, clarificationReason: "A lecsó adagjának összetétele pontosítandó.",
      items: [
        { originalText: "egy tányér lecsó", canonicalName: "lecsó", quantity: 1, unit: "plate", evidence: "explicit", confidence: 0.98 },
        { originalText: "két virsli", canonicalName: "sausage", quantity: 2, unit: "piece", evidence: "explicit", confidence: 0.97 },
        { originalText: "három tojás", canonicalName: "egg", quantity: 3, unit: "piece", evidence: "explicit", confidence: 0.98 },
        { originalText: "paprika", canonicalName: "pepper", evidence: "inferred_common", confidence: 0.6 }
      ]
    });
    const result = await interpretMealInput(prisma, "egy tányér lecsó két virslivel és három tojással", undefined, ai);
    expect(result.interpretationSource).toBe("ai_assisted");
    expect(result.foodResolution).toBe("compound");
    expect(result.semantic?.dishName).toBe("lecsó");
    expect(result.canConfirm).toBe(false);
    expect(result.items?.map((item) => item.selectedFood?.id ?? null)).toEqual([null, "catalog-sausage", "catalog-egg", null]);
    expect(result.items?.[1].quantity?.grams).toBe(100);
    expect(result.items?.[2].quantity?.grams).toBe(150);
    expect(result.items?.[3].semanticItem?.evidence).toBe("inferred_common");
    expect(result.items?.[3].selectedFood).toBeNull();
    expect(result.items?.[3].nutritionEligible).toBe(false);
  });

  it("supports an AI-assisted single food and re-resolves it through the trusted catalog", async () => {
    const ai = new MockFoodNlpProvider({
      language: "en", kind: "single_food", confidence: 0.95, clarificationNeeded: false,
      items: [{ originalText: "half of the creamy green fruit", canonicalName: "avocado", quantity: 1, unit: "half", evidence: "explicit", confidence: 0.96 }]
    });
    const result = await interpretMealInput(prisma, "half of the creamy green fruit", undefined, ai);
    expect(result).toMatchObject({ interpretationSource: "ai_assisted", selectedFood: { id: "catalog-avocado" }, nutritionEligible: true, canConfirm: true });
    expect(result.quantity?.grams).toBe(100.5);
  });

  it("preserves order and independently resolves AI-extracted multiple foods", async () => {
    const ai = new MockFoodNlpProvider({
      language: "en", kind: "multiple_foods", confidence: 0.96, clarificationNeeded: false,
      items: [
        { originalText: "an egg", canonicalName: "egg", quantity: 1, unit: "piece", evidence: "explicit", confidence: 0.98 },
        { originalText: "half an avocado", canonicalName: "avocado", quantity: 1, unit: "half", evidence: "explicit", confidence: 0.97 }
      ]
    });
    const result = await interpretMealInput(prisma, "an egg alongside half an avocado", undefined, ai);
    expect(result.interpretationSource).toBe("ai_assisted");
    expect(result.foodResolution).toBe("multi");
    expect(result.items?.map((item) => item.selectedFood?.id)).toEqual(["catalog-egg", "catalog-avocado"]);
    expect(result.items?.map((item) => item.quantity?.grams)).toEqual([50, 100.5]);
  });

  it("preserves modifiers and exclusions without inventing weight or nutrition", async () => {
    const ai = new MockFoodNlpProvider({
      language: "de", kind: "compound_dish", dishName: "Döner", confidence: 0.93,
      clarificationNeeded: true, clarificationReason: "Portion and trusted dish record are unresolved.",
      items: [{ originalText: "Döner", canonicalName: "döner", modifiers: ["extra meat"], excludedModifiers: ["sauce"], evidence: "explicit", confidence: 0.94 }]
    });
    const result = await interpretMealInput(prisma, "ein Döner mit extra Fleisch ohne Soße", undefined, ai);
    expect(result.semantic?.dishName).toBe("Döner");
    expect(result.items?.[0].semanticItem).toMatchObject({ modifiers: ["extra meat"], excludedModifiers: ["sauce"] });
    expect(result.items?.[0].quantity).toBeNull();
    expect(result.canConfirm).toBe(false);
  });

  it("falls back to unchanged deterministic behavior when the provider fails", async () => {
    const ai = new MockFoodNlpProvider(new Error("upstream unavailable"));
    const result = await interpretMealInput(prisma, "unrecognized compound meal with sauce", undefined, ai);
    expect(ai.calls).toBe(1);
    expect(result.interpretationSource).toBe("deterministic");
    expect(result.foodResolution).toBe("unresolved");
  });

  it("rejects nutrition-bearing output at the provider-neutral boundary before trusted resolution", async () => {
    const poisoned = {
      language: "en", kind: "single_food", confidence: 0.99, clarificationNeeded: false, kcal: 500,
      items: [{ originalText: "mystery meal", canonicalName: "egg", evidence: "explicit", confidence: 0.99 }]
    } as unknown as FoodUnderstanding;
    const ai = new MockFoodNlpProvider(poisoned);
    const result = await interpretMealInput(prisma, "mystery meal phrase", undefined, ai);
    expect(ai.calls).toBe(1);
    expect(result.interpretationSource).toBe("deterministic");
    expect(result.selectedFood).toBeNull();
    expect(result.nutritionEligible).not.toBe(true);
  });

  it.each([
    ["egy döner extra hússal, szósz nélkül", "hu", "compound_dish", "döner", ["extra meat"], ["sauce"]],
    ["ein Döner mit extra Fleisch ohne Soße", "de", "compound_dish", "döner", ["extra meat"], ["sauce"]],
    ["a Caesar salad without croutons", "en", "compound_dish", "Caesar salad", [], ["croutons"]],
    ["two ladles of beef stew", "en", "compound_dish", "beef stew", [], []]
  ] as const)("produces a safe mock product preview for %s", async (input, language, kind, dishName, modifiers, exclusions) => {
    const ai = new MockFoodNlpProvider({
      language, kind, dishName: kind === "compound_dish" ? dishName : undefined, confidence: 0.94,
      clarificationNeeded: true, clarificationReason: "A trusted dish or quantity conversion is still required.",
      items: [{
        originalText: input, canonicalName: dishName, quantity: input.includes("two ladles") ? 2 : input.includes("fél") ? 1 : undefined,
        unit: input.includes("two ladles") ? "ladle" : input.includes("fél") ? "half" : undefined,
        modifiers: [...modifiers], excludedModifiers: [...exclusions], evidence: "explicit", confidence: 0.94
      }]
    });
    const result = await interpretMealInput(prisma, input, undefined, ai);
    const item = result.items?.[0] ?? result;
    expect(result.interpretationSource).toBe("ai_assisted");
    expect(result.semantic).toMatchObject({ language, clarificationNeeded: true });
    if (kind === "compound_dish") expect(result.semantic?.dishName).toBe(dishName);
    expect(item.semanticItem).toMatchObject({ modifiers: [...modifiers], excludedModifiers: [...exclusions] });
    expect(item.nutritionEligible).toBe(false);
    expect(result.canConfirm).toBe(false);
  });
});
