import { describe, expect, it, vi } from "vitest";
import { interpretMealInput, resolveQuantity, type DynamicResolutionDeps, type InterpretResult } from "./interpret.js";
import { normalizeSearch } from "../catalog/normalize.js";
import type { AiProvider } from "../ai/provider.js";
import type { FoodUnderstanding } from "@keto-mentor/shared";
import type { QuantityEstimate, QuantityEstimationProvider } from "./quantity-estimation.js";
import { DisabledQuantityEstimationProvider } from "./quantity-estimation.js";
import { AiProviderError } from "../ai/chat-completions-provider.js";
import { parseNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { DynamicFoodResolutionRateLimiter } from "../catalog/dynamic-food-rate-limit.js";
import type { SearchIntentProvider } from "../catalog/search-intent.js";
import { DEFAULT_CONCURRENCY } from "../request-performance.js";

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
  { id: "catalog-fried-egg", name: "Fried egg", names: { hu: "Tükörtojás", de: "Spiegelei", en: "Fried egg" }, synonyms: { hu: ["tükörtojás", "tukortojas", "sült tojás", "sult tojas"], de: ["spiegelei", "spiegeleier"], en: ["fried egg", "fried eggs"] }, servings: [{ id: "fried-egg", key: "egg", unit: "egg", labels: { en: "egg", hu: "tojás", de: "Ei" }, grams: 46, isEstimated: false, confidence: 1, provenance: { method: "authoritative", fdcId: "173423", portionId: "92497" } }], kcalPer100g: 196 },
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
  { id: "catalog-chicken-breast", name: "Chicken breast", names: { hu: "Csirkemell", de: "Hähnchenbrust", en: "Chicken breast" }, synonyms: { hu: ["csirkemell"], de: ["hahnchenbrust"], en: ["chicken breast"] }, kcalPer100g: 120 },
  // Owner-beta reproduction fixtures below: deliberately WITHOUT a trusted
  // FoodServing, matching the real gap that forces the AI quantity fallback.
  { id: "catalog-spinach", name: "Spinach", names: { hu: "Spenót", de: "Spinat", en: "Spinach" }, synonyms: { hu: ["spenót", "spenot"], de: ["spinat"], en: ["spinach"] }, kcalPer100g: 23 },
  // Owner-beta finding (real catalog gap): no trusted FoodServing — matches
  // the actual production catalog entry added for this, which deliberately
  // has no per-piece or per-cm serving so length-based quantities go through
  // AI estimation rather than an invented conversion.
  { id: "catalog-pork-sausage", name: "Pork sausage", names: { hu: "Kolbász", de: "Wurst", en: "Pork sausage" }, synonyms: { hu: ["kolbász", "kolbasz", "parasztkolbász", "parasztkolbasz"], de: ["wurst", "bratwurst"], en: ["sausage", "pork sausage"] }, kcalPer100g: 309 },
  { id: "catalog-ham", name: "Ham", names: { hu: "Sonka", de: "Schinken", en: "Ham" }, synonyms: { hu: ["sonka"], de: ["schinken"], en: ["ham"] }, kcalPer100g: 145 },
  { id: "catalog-feta", name: "Feta cheese", names: { hu: "Feta", de: "Feta", en: "Feta cheese" }, synonyms: { hu: ["feta"], de: ["feta"], en: ["feta", "feta cheese"] }, kcalPer100g: 264 },
  { id: "catalog-lettuce", name: "Lettuce", names: { hu: "Saláta", de: "Salat", en: "Lettuce" }, synonyms: { hu: ["saláta", "salata"], de: ["salat"], en: ["lettuce", "salad"] }, kcalPer100g: 15 },
  // Owner real-iPhone report (2026-09-09): "1 marék mandula" ("1 marok
  // mandula" — the alternate, equally-valid unaccented Hungarian spelling —
  // is covered too, see below) fell back to manual grams instead of
  // volume-aware estimation. Almonds, no trusted FoodServing, matching the
  // real catalog entry that reproduced it.
  { id: "catalog-almond", name: "Almonds", names: { hu: "Mandula", de: "Mandeln", en: "Almonds" }, synonyms: { hu: ["mandula"], de: ["mandeln", "mandel"], en: ["almond", "almonds"] }, kcalPer100g: 579 },
  // Owner-beta blocker #2 fixture (2026-09-10): mirrors the real
  // already-trusted, already-persisted "marhahúsleves" Food from production
  // — used to prove a genuinely strong local match survives an AI
  // compound_dish classification instead of being buried by it.
  { id: "catalog-beef-broth", name: "Beef broth", names: { hu: "Marhahúsleves", en: "Beef broth" }, synonyms: { hu: ["marhahúsleves", "marhahusleves"], en: ["beef broth"] }, kcalPer100g: 8 }
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

/**
 * Deterministic stand-in for the real OpenRouter/Mistral quantity gateway.
 * Never touches the network — the whole point is that these tests must not
 * depend on a live provider. Mirrors the real transport's contract: returns
 * a bounded QuantityEstimate, returns null when it declines, or throws
 * AiProviderError for transport-level failures.
 */
class MockQuantityProvider implements QuantityEstimationProvider {
  calls = 0;
  constructor(
    readonly id: string,
    private readonly behavior: QuantityEstimate | null | Error
  ) {}
  async estimate(): Promise<QuantityEstimate | null> {
    this.calls += 1;
    if (this.behavior instanceof Error) throw this.behavior;
    return this.behavior;
  }
}

function aiEstimate(gramsPerUnit: number, overrides: Partial<QuantityEstimate> = {}): QuantityEstimate {
  return {
    gramsPerUnit, confidence: 0.6, method: "ai_estimated",
    provenance: { provider: "mock-openrouter", modelOrRule: "fixture-model", estimatedAt: "2026-01-01T00:00:00.000Z" },
    rangeGramsPerUnit: { min: gramsPerUnit * 0.7, max: gramsPerUnit * 1.3 },
    ...overrides
  };
}

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

  // Owner real-iPhone report (2026-09-09): "1 marék mandula" reached the
  // manual-grams fallback ("nincs hiteles grammsúly... add meg kézzel a
  // grammot") instead of a volume-aware estimate. Root cause traced to a
  // currently-unavailable AI provider (production logs: providerError=
  // http_error), NOT a routing bug — interpretMealInput's two-pass design
  // (see its own comment: "Resolve food semantics before allowing any
  // external weight estimation") deliberately runs the deterministic pass
  // with a disabled provider first, then retries quantity resolution with
  // the REAL provider only once food identity is confirmed. These tests
  // prove that second, real pass is reached and used correctly — with a
  // working provider AND with a failing one — for both the accented
  // "marék" and the unaccented "marok" spelling, so a future regression in
  // either the routing or the parser synonym is caught immediately.
  it.each([
    ["1 marék mandula", "hu"],
    ["1 marok mandula", "hu"],
    ["eine Handvoll Mandeln", "de"],
    ["a handful of almonds", "en"]
  ] as const)("%s: a handful is volume-class (container/body-relative), not single-item geometry, and gets exactly one real AI call", async (input) => {
    const estimate = vi.fn(async ({ parsed }: any) => {
      expect(parsed.unit).toBe("handful"); // never "piece" — see quantity-estimation.ts's VOLUME_UNITS
      return aiEstimate(28, { estimationClass: "volume", estimationMethodClass: "packing" });
    });
    const result = await interpretMealInput(prisma, input, { id: "mock-openrouter", estimate });
    expect(result.selectedFood?.id).toBe("catalog-almond");
    expect(result.quantity?.status).toBe("resolved");
    expect(result.quantity?.grams).toBeCloseTo(28, 6);
    expect(result.quantity?.estimationClass).toBe("volume");
    // Distinguishable from an exact/trusted quantity (item 7): estimated
    // grams must never be silently presented as if they were measured.
    expect(result.quantity?.estimated).toBe(true);
    expect(result.quantity?.method).toBe("ai_estimated");
    expect(result.quantity?.requiresConfirmation).toBe(true);
    expect(estimate).toHaveBeenCalledTimes(1);
  });

  it("a handful whose AI provider is unavailable (rate-limited/erroring) fails safely to the manual-grams fallback — never fabricates a gram figure or nutrition", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", new AiProviderError("http_error", 429));
    const result = await interpretMealInput(prisma, "1 marék mandula", provider);
    expect(result.selectedFood?.id).toBe("catalog-almond"); // food identity is unaffected by the quantity failure
    expect(result.quantity?.status).toBe("unresolved");
    expect(result.quantity?.reason).toBe("conversion_missing");
    expect(result.quantity?.aiOutcome).toBe("invalid_output");
    expect(result.quantity?.grams).toBeUndefined();
    expect(result.canConfirm).toBe(false);
    expect(provider.calls).toBe(1); // exactly one attempt, not zero (never silently skipped) and not retried
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

  // Owner-beta blocker (2026-09-12): a real UI finding — "1 tányér vegyes
  // saláta a következőkből: fejessaláta, retek, káposzta, 1 kanál tejfölös
  // szósz" listed "vegyes saláta" itself as a FIFTH item alongside the four
  // ingredients that already define it, double-counting the dish. The
  // control test above ("represents a compound dish") proves dishName is
  // still independently resolved when NOT explicitly defined by its items
  // (lecsó); this proves the opposite case — dishIsComposition:true — never
  // synthesizes that extra item. Generalized across HU/DE/EN by construction:
  // this is a pure interpret.ts logic test, not a hardcoded "vegyes saláta"
  // string check.
  it("does not double-count the parent dish as a separate item when the AI marks it explicitly composed of the items that follow (dishIsComposition)", async () => {
    const ai = new MockFoodNlpProvider({
      language: "hu", kind: "compound_dish", dishName: "vegyes saláta", dishIsComposition: true, confidence: 0.9, clarificationNeeded: false,
      items: [
        { originalText: "fejessaláta", canonicalName: "lettuce", evidence: "inferred_common", confidence: 0.8 },
        { originalText: "1 evőkanál Cream, sour, full fat", canonicalName: "butter", quantity: 1, unit: "tbsp", evidence: "explicit", confidence: 0.9 }
      ]
    });
    const result = await interpretMealInput(prisma, "1 tányér vegyes saláta a következőkből: fejessaláta, ..., 1 kanál vajas szósz", undefined, ai);
    expect(result.semantic?.dishName).toBe("vegyes saláta");
    // Exactly the two real components — never a third synthetic "vegyes
    // saláta" item on top of them.
    expect(result.items).toHaveLength(2);
    expect(result.items?.every((item) => item.semanticItem?.canonicalName !== "vegyes saláta")).toBe(true);
  });

  // Control for the fix above: WITHOUT an explicit composition cue
  // (dishIsComposition absent/false), a named dish mentioned alongside a few
  // add-ons must still get its own independent resolution attempt — the
  // existing "represents a compound dish" test already covers this for
  // lecsó; this is the same control expressed the other way, to make the
  // dishIsComposition branch itself directly testable in isolation.
  it("still resolves the dish name as its own item when dishIsComposition is absent, even with an items list", async () => {
    const ai = new MockFoodNlpProvider({
      language: "hu", kind: "compound_dish", dishName: "lecsó", confidence: 0.9, clarificationNeeded: false,
      items: [{ originalText: "két virsli", canonicalName: "sausage", quantity: 2, unit: "piece", evidence: "explicit", confidence: 0.97 }]
    });
    const result = await interpretMealInput(prisma, "lecsó két virslivel", undefined, ai);
    expect(result.items?.some((item) => item.semanticItem?.canonicalName === "lecsó")).toBe(true);
  });

  // Owner-beta regression (2026-09-10): "2 tányér marhahúsleves" already had
  // a correct, already-trusted local Food available, but AI food-understanding
  // classified the phrase as compound_dish and the known-good identity was
  // discarded — canConfirm forced false, quantity never attempted — even
  // though the item-level deterministic resolution underneath it was
  // genuinely strong (score >= 95, exact/alias stage). Trusted-match
  // precedence: that strength must survive the compound_dish classification.
  it("a genuinely strong local match survives an AI compound_dish classification instead of being buried by it", async () => {
    const ai = new MockFoodNlpProvider({
      language: "hu", kind: "compound_dish", dishName: "marhahúsleves", confidence: 0.9, clarificationNeeded: false,
      items: [{ originalText: "marhahúsleves", canonicalName: "marhahúsleves", quantity: 2, unit: "plate", evidence: "explicit", confidence: 0.9 }]
    });
    const quantityProvider = new MockQuantityProvider("mock-openrouter", aiEstimate(300));
    // A phrasing the deterministic parser alone cannot cleanly resolve, so
    // shouldUseAiFallback genuinely triggers (mirrors a real free-form request).
    const result = await interpretMealInput(prisma, "the usual beefy soup thing, two plates please", quantityProvider, ai);
    expect(result.interpretationSource).toBe("ai_assisted");
    expect(result.foodResolution).toBe("resolved"); // NOT "compound" — the trusted match takes precedence
    expect(result.selectedFood?.id).toBe("catalog-beef-broth");
    expect(result.quantity?.grams).toBe(600); // 2 plates, not discarded — quantity estimation actually ran
    // An AI-estimated quantity always requires explicit confirmation
    // regardless of how confident the identity match was — that part of the
    // trust boundary is untouched by this fix.
    expect(result.quantity?.requiresConfirmation).toBe(true);
  });

  // Control: a compound_dish classification for a phrase that genuinely has
  // no strong local identity must still behave exactly as before — the
  // precedence rule above must never protect a weak/absent match.
  it("compound_dish still applies normally when the underlying item is not a strong local match", async () => {
    const ai = new MockFoodNlpProvider({
      language: "hu", kind: "compound_dish", dishName: "rakott krumpli", confidence: 0.9,
      clarificationNeeded: true, clarificationReason: "No trustworthy generic identity for this composite dish.",
      items: [{ originalText: "rakott krumpli", canonicalName: "rakott krumpli", quantity: 1, unit: "plate", evidence: "explicit", confidence: 0.9 }]
    });
    const result = await interpretMealInput(prisma, "some layered potato bake thing", undefined, ai);
    expect(result.foodResolution).toBe("compound");
    expect(result.canConfirm).toBe(false);
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

describe("OpenRouter quantity AI fallback architecture (owner-beta root cause)", () => {
  const spinachFood = { id: "catalog-spinach", source: "keto_mentor", sourceId: null, name: "Spinach" };

  it("resolveQuantity: trusted serving beats AI — the provider is never even called when a trustworthy serving exists", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(999));
    const parsed = parseNaturalFoodQuery("3 tükörtojás");
    const friedEgg = { id: "catalog-fried-egg", source: "keto_mentor", sourceId: null, name: "Fried egg", servings: [
      { id: "fried-egg", key: "egg", unit: "egg", labels: {}, grams: 46, isEstimated: false, confidence: 1, provenance: {} }
    ] };
    const result = await resolveQuantity(parsed, friedEgg as any, provider);
    expect(provider.calls).toBe(0);
    expect(result.status).toBe("resolved");
    expect(result.grams).toBe(3 * 46);
    expect(result.method).toBe("authoritative");
    expect(result.estimated).toBe(false);
  });

  it("resolveQuantity: AI provides a bounded, confirmable estimate when no trusted serving exists (aiOutcome: estimated)", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(280));
    const parsed = parseNaturalFoodQuery("1 tányér spenót");
    const result = await resolveQuantity(parsed, spinachFood, provider);
    expect(provider.calls).toBe(1);
    expect(result.status).toBe("resolved");
    expect(result.estimated).toBe(true);
    expect(result.requiresConfirmation).toBe(true); // AI estimates always require explicit confirmation
    expect(result.method).toBe("ai_estimated");
    expect(result.grams).toBe(280);
    expect(result.aiOutcome).toBe("estimated");
  });

  it("resolveQuantity: a plate estimate is tagged volume/container and carries the validated physical model", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(280, {
      estimationClass: "volume", estimationMethodClass: "container",
      volumeModel: { referenceVolumeMl: { min: 250, max: 400 }, fillFraction: { min: 0.5, max: 0.9 }, foodVolumeMl: { min: 125, max: 360 }, bulkDensityGPerMl: { min: 0.2, max: 0.5 }, grams: { min: 196, max: 364 } }
    }));
    const parsed = parseNaturalFoodQuery("1 tányér spenót");
    const result = await resolveQuantity(parsed, spinachFood, provider);
    expect(result.estimationClass).toBe("volume");
    expect(result.estimationMethodClass).toBe("container");
    expect(result.volumeModel).toMatchObject({ bulkDensityGPerMl: { min: 0.2, max: 0.5 } });
  });

  it("resolveQuantity: '2 tányér spenót' scales grams by quantity while volumeModel stays per-unit", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(80, { estimationClass: "volume", volumeModel: { referenceVolumeMl: { min: 250, max: 400 }, fillFraction: { min: 0.5, max: 0.9 }, foodVolumeMl: { min: 125, max: 360 }, bulkDensityGPerMl: { min: 0.2, max: 0.5 }, grams: { min: 50, max: 120 } } }));
    const parsed = parseNaturalFoodQuery("2 tányér spenót");
    const result = await resolveQuantity(parsed, spinachFood, provider);
    expect(result.grams).toBe(160); // 2 x 80 gramsPerUnit
    expect(result.rangeGrams).toEqual({ min: parsed.quantity! * (80 * 0.7), max: parsed.quantity! * (80 * 1.3) });
    // The physical model describes ONE plate, not two — it must not be scaled by quantity.
    expect(result.volumeModel).toMatchObject({ grams: { min: 50, max: 120 } });
  });

  it.each([
    ["1 tál spenót", "bowl"],
    ["1 csésze spenót", "cup"],
    ["1 merőkanál leves", "ladle"]
  ] as const)("resolveQuantity: '%s' uses the volume-aware AI path (%s)", async (text, expectedUnit) => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(200, { estimationClass: "volume" }));
    const parsed = parseNaturalFoodQuery(text);
    expect(parsed.unit).toBe(expectedUnit);
    const food = expectedUnit === "ladle" ? { id: "catalog-broth", source: "keto_mentor", sourceId: null, name: "Soup" } : spinachFood;
    const result = await resolveQuantity(parsed, food, provider);
    expect(provider.calls).toBe(1);
    expect(result.status).toBe("resolved");
    expect(result.estimationClass).toBe("volume");
  });

  it("preparation sensitivity: the provider receives distinct physical context for two different foods/preparations sharing the same vessel — no hardcoded 'plate = X grams'", async () => {
    const seen: unknown[] = [];
    const estimate = vi.fn(async ({ parsed, food }: any) => {
      seen.push({ preparation: parsed.preparation, food: food.name });
      return aiEstimate(parsed.preparation === "boiled" ? 90 : 60, { estimationClass: "volume" });
    });
    const provider = { id: "fixture", estimate };
    const raw = await resolveQuantity(parseNaturalFoodQuery("1 tányér spenót"), spinachFood, provider);
    const cookedFood = { id: "catalog-pork-sausage", source: "keto_mentor", sourceId: null, name: "Pork sausage" };
    const cooked = await resolveQuantity({ ...parseNaturalFoodQuery("1 tányér kolbász"), preparation: "boiled" }, cookedFood, provider);
    expect(seen).toEqual([
      { preparation: undefined, food: "Spinach" },
      { preparation: "boiled", food: "Pork sausage" }
    ]);
    // Different foods/preparations must be free to yield different estimates —
    // proving the architecture doesn't collapse every plate to one constant.
    expect(raw.grams).not.toBe(cooked.grams);
  });

  it.each([
    ["1 kis tányér spenót", "small", undefined, undefined],
    ["1 nagy tányér spenót", "large", undefined, undefined],
    ["1 mély tányér spenót", undefined, "deep", undefined],
    ["1 púpozott tányér spenót", undefined, undefined, "heaped"],
    ["1 nagy mély tányér spenót", "large", "deep", undefined]
  ] as const)("modifier '%s' reaches the estimator as parsed size/vesselShape/fill", async (text, size, vesselShape, fill) => {
    const estimate = vi.fn(async () => aiEstimate(100, { estimationClass: "volume" }));
    const parsed = parseNaturalFoodQuery(text);
    expect(parsed.size).toBe(size);
    expect(parsed.vesselShape).toBe(vesselShape);
    expect(parsed.fill).toBe(fill);
    await resolveQuantity(parsed, spinachFood, { id: "fixture", estimate });
    const receivedParsed = estimate.mock.calls[0][0].parsed;
    expect(receivedParsed.size).toBe(size);
    expect(receivedParsed.vesselShape).toBe(vesselShape);
    expect(receivedParsed.fill).toBe(fill);
  });

  it("'fél tányér spenót' halves the quantity via the existing quantity multiplier rather than a fill-level hack", () => {
    const parsed = parseNaturalFoodQuery("fél tányér spenót");
    expect(parsed.quantity).toBe(0.5);
    expect(parsed.unit).toBe("plate");
    expect(parsed.fill).toBeUndefined(); // "fél" stays the existing half-quantity concept, not a fill modifier
  });

  it("interpretMealInput: a volume-class estimate's clarification carries basis='volume' for the confirmation UI", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(80, { estimationClass: "volume" }));
    const result = await interpretMealInput(prisma, "1 tányér spenót", provider);
    expect(result.clarification?.type).toBe("estimate_confirmation");
    expect(result.clarification?.basis).toBe("volume");
  });

  it("interpretMealInput: a geometry-class estimate's clarification has no volume basis", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(30, { estimationClass: "geometry" }));
    const result = await interpretMealInput(prisma, "10 cm lángolt kolbász", provider);
    expect(result.clarification?.basis).toBe("geometry");
  });

  it("resolveQuantity: manual grams is the fallback when no AI provider is configured (aiOutcome: not_configured)", async () => {
    const parsed = parseNaturalFoodQuery("1 tányér spenót");
    const result = await resolveQuantity(parsed, spinachFood, new DisabledQuantityEstimationProvider());
    expect(result.status).toBe("unresolved");
    expect(result.reason).toBe("conversion_missing");
    expect(result.aiOutcome).toBe("not_configured");
  });

  it("resolveQuantity: manual grams is the fallback when the provider times out (aiOutcome: timeout, distinguishable from not_configured)", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", new AiProviderError("timeout"));
    const parsed = parseNaturalFoodQuery("1 tányér spenót");
    const result = await resolveQuantity(parsed, spinachFood, provider);
    expect(result.status).toBe("unresolved");
    expect(result.reason).toBe("conversion_missing");
    expect(result.aiOutcome).toBe("timeout");
  });

  it.each([
    ["invalid_response", "invalid_output"],
    ["http_error", "invalid_output"],
    ["response_too_large", "invalid_output"]
  ] as const)("resolveQuantity: manual grams is the fallback when the provider fails with %s (aiOutcome: %s)", async (code, expectedOutcome) => {
    const provider = new MockQuantityProvider("mock-openrouter", new AiProviderError(code));
    const parsed = parseNaturalFoodQuery("1 tányér spenót");
    const result = await resolveQuantity(parsed, spinachFood, provider);
    expect(result.status).toBe("unresolved");
    expect(result.reason).toBe("conversion_missing");
    expect(result.aiOutcome).toBe(expectedOutcome);
  });

  it("resolveQuantity: a non-AiProviderError thrown by a misbehaving provider still degrades safely (aiOutcome: invalid_output)", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", new Error("unexpected"));
    const parsed = parseNaturalFoodQuery("1 tányér spenót");
    const result = await resolveQuantity(parsed, spinachFood, provider);
    expect(result.status).toBe("unresolved");
    expect(result.aiOutcome).toBe("invalid_output");
  });

  it("resolveQuantity: the provider declining (returns null) is distinguishable from not being configured at all (aiOutcome: declined)", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", null);
    const parsed = parseNaturalFoodQuery("1 tányér spenót");
    const result = await resolveQuantity(parsed, spinachFood, provider);
    expect(provider.calls).toBe(1);
    expect(result.status).toBe("unresolved");
    expect(result.aiOutcome).toBe("declined");
  });

  it("resolveQuantity: an AI estimate can never smuggle nutrition fields into the resolution — only bounded gram/confidence/method/provenance survive", async () => {
    const poisoned = { ...aiEstimate(280), kcal: 999, kcalPer100g: 999, proteinPer100g: 999 } as unknown as QuantityEstimate;
    const provider = new MockQuantityProvider("mock-openrouter", poisoned);
    const parsed = parseNaturalFoodQuery("1 tányér spenót");
    const result = await resolveQuantity(parsed, spinachFood, provider);
    expect(result.status).toBe("resolved");
    expect(Object.keys(result).sort()).toEqual(
      ["aiOutcome", "confidence", "estimated", "estimationClass", "estimationMethodClass", "grams", "gramsPerUnit", "method", "provenance", "rangeGrams", "requiresConfirmation", "status", "volumeModel"].sort()
    );
    expect((result as any).kcal).toBeUndefined();
    expect((result as any).kcalPer100g).toBeUndefined();
  });

  it("end-to-end owner reproduction: '1 tányér spenót, 2 db tükörtojás' — plate spinach gets an AI estimate, fried egg uses its trusted serving, neither collapses straight to manual grams", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(280));
    const result = await interpretMealInput(prisma, "1 tányér spenót, 2 db tükörtojás", provider);
    expect(result.items).toHaveLength(2);
    const [spinachItem, eggItem] = result.items!;

    expect(spinachItem.selectedFood?.id).toBe("catalog-spinach");
    expect(spinachItem.quantity?.status).toBe("resolved");
    expect(spinachItem.quantity?.estimated).toBe(true);
    expect(spinachItem.quantity?.aiOutcome).toBe("estimated");
    expect(spinachItem.quantity?.grams).toBe(280);
    expect(spinachItem.canConfirm).toBe(false); // AI estimate still requires explicit user confirmation

    expect(eggItem.selectedFood?.id).toBe("catalog-fried-egg");
    expect(eggItem.preparation).toBe("fried");
    expect(eggItem.quantity?.estimated).toBe(false); // trusted serving, AI never needed
    expect(eggItem.quantity?.grams).toBe(2 * 46);
    expect(eggItem.canConfirm).toBe(true);

    expect(provider.calls).toBe(1); // only for spinach — the egg never touches the AI provider
  });

  it("end-to-end owner reproduction: '10 cm lángolt parasztkolbász' resolves the sausage cleanly and gets a bounded AI length-to-grams estimate", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(120));
    const result = await interpretMealInput(prisma, "10 cm lángolt parasztkolbász", provider);
    expect(result.selectedFood?.id).toBe("catalog-pork-sausage");
    expect(result.preparation).toBe("grilled");
    expect(result.parsed.unit).toBe("cm");
    expect(result.quantity?.status).toBe("resolved");
    expect(result.quantity?.estimated).toBe(true);
    expect(result.quantity?.aiOutcome).toBe("estimated");
    expect(result.quantity?.grams).toBe(10 * 120);
    expect(result.canConfirm).toBe(false); // still requires explicit confirmation, never auto-applied
  });

  it("end-to-end owner reproduction: '10 cm lángolt parasztkolbász' falls back to manual grams (not invented nutrition) when the AI provider is unavailable", async () => {
    const result = await interpretMealInput(prisma, "10 cm lángolt parasztkolbász");
    expect(result.selectedFood?.id).toBe("catalog-pork-sausage");
    expect(result.quantity?.status).toBe("unresolved");
    expect(result.quantity?.aiOutcome).toBe("not_configured");
    expect(result.quantity?.grams).toBeUndefined();
    expect(result.clarification?.type).toBe("grams_required");
  });

  // Owner-beta retest (real production divergence): the owner's exact new
  // string used the generic "kolbász", not "parasztkolbász". Previous
  // coverage only ever exercised the specific compound word; these prove
  // the generic word resolves too, matching the real catalog entry's
  // Hungarian aliases (both "kolbász" and "parasztkolbász" point at the
  // same trustworthy generic pork sausage record).
  it.each([
    ["kolbász", "catalog-pork-sausage", undefined],
    ["parasztkolbász", "catalog-pork-sausage", undefined],
    ["lángolt kolbász", "catalog-pork-sausage", "grilled"]
  ] as const)("'%s' resolves to the trusted generic sausage Food", async (text, expectedId, expectedPreparation) => {
    const result = await interpretMealInput(prisma, text);
    expect(result.selectedFood?.id).toBe(expectedId);
    expect(result.preparation).toBe(expectedPreparation);
  });

  it("end-to-end owner reproduction: '10 cm lángolt kolbász' (generic word, not parasztkolbász) resolves cleanly and gets a bounded AI length-to-grams estimate", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(90));
    const result = await interpretMealInput(prisma, "10 cm lángolt kolbász", provider);
    expect(result.selectedFood?.id).toBe("catalog-pork-sausage");
    expect(result.preparation).toBe("grilled");
    expect(result.parsed.unit).toBe("cm");
    expect(result.quantity?.status).toBe("resolved");
    expect(result.quantity?.estimated).toBe(true);
    expect(result.quantity?.aiOutcome).toBe("estimated");
    expect(result.quantity?.grams).toBe(10 * 90);
    expect(result.canConfirm).toBe(false);
  });

  it("an uncatalogued sausage-family subtype (e.g. 'hurka') stays unresolved rather than borrowing the generic sausage's nutrition", async () => {
    const result = await interpretMealInput(prisma, "10 cm hurka");
    expect(result.selectedFood?.id ?? null).not.toBe("catalog-pork-sausage");
    expect(["unresolved", "confirmation_required"]).toContain(result.foodResolution);
    expect(result.canConfirm).toBe(false);
  });

  it("end-to-end owner reproduction: '200 g saláta, 2 főtt tojás, sonka és feta' segments into four distinct items, each independently resolved", async () => {
    const result = await interpretMealInput(prisma, "200 g saláta, 2 főtt tojás, sonka és feta");
    expect(result.items).toHaveLength(4);
    const [salad, egg, ham, feta] = result.items!;

    expect(salad.selectedFood?.id).toBe("catalog-lettuce");
    expect(salad.quantity?.grams).toBe(200);
    expect(salad.canConfirm).toBe(true);

    // No boiled-egg Food exists in the catalog: the preparation is honestly
    // surfaced as unavailable rather than silently substituting raw/fried
    // nutrition — same invariant as the existing "főtt tojás" test above.
    expect(egg.preparation).toBe("boiled");
    expect(egg.preparationUnavailable).toBe(true);
    expect(egg.canConfirm).toBe(false);

    expect(ham.selectedFood?.id).toBe("catalog-ham");
    expect(ham.quantity?.reason).toBe("quantity_missing"); // no amount was stated for the ham
    expect(ham.canConfirm).toBe(false);

    expect(feta.selectedFood?.id).toBe("catalog-feta");
    expect(feta.quantity?.reason).toBe("quantity_missing");
    expect(feta.canConfirm).toBe(false);
  });

  it("DE equivalent: 'ein Teller Spinat und 2 Spiegeleier' segments and resolves the same way as the Hungarian original", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(280));
    const result = await interpretMealInput(prisma, "ein Teller Spinat und 2 Spiegeleier", provider);
    expect(result.items).toHaveLength(2);
    expect(result.items?.[0].selectedFood?.id).toBe("catalog-spinach");
    expect(result.items?.[0].quantity?.estimated).toBe(true);
    expect(result.items?.[1].selectedFood?.id).toBe("catalog-fried-egg");
    expect(result.items?.[1].quantity?.estimated).toBe(false);
  });

  it("EN equivalent: '1 plate spinach and 2 fried eggs' segments and resolves the same way as the Hungarian original", async () => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(280));
    const result = await interpretMealInput(prisma, "1 plate spinach and 2 fried eggs", provider);
    expect(result.items).toHaveLength(2);
    expect(result.items?.[0].selectedFood?.id).toBe("catalog-spinach");
    expect(result.items?.[0].quantity?.estimated).toBe(true);
    expect(result.items?.[1].selectedFood?.id).toBe("catalog-fried-egg");
    expect(result.items?.[1].quantity?.estimated).toBe(false);
  });
});

describe("human quantity test matrix (owner-beta finding G)", () => {
  const food = (id: string, servings: any[] = []) => ({ id, source: "keto_mentor", sourceId: null, name: id, servings } as any);

  // Foods WITH a trusted serving for the unit under test — quantity must
  // resolve from that serving alone; the AI provider must never be called.
  it.each([
    ["2 db tojás", "piece", 50, 100],
    ["3 szelet sajt", "slice", 28, 84],
    ["1 evőkanál olívaolaj", "tbsp", 13.5, 13.5],
    ["1 teáskanál vaj", "tsp", 4.7, 4.7]
  ] as const)("'%s': trusted %s serving resolves without ever calling the AI provider", async (text, servingUnit, gramsPerUnit, expectedGrams) => {
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(999_000)); // absurd value: would be obviously wrong if it were used
    const parsed = parseNaturalFoodQuery(text);
    const trustedFood = food("trusted-food", [{ id: "s1", key: servingUnit, unit: servingUnit, labels: {}, grams: gramsPerUnit, isEstimated: false, confidence: 1, provenance: {} }]);
    const result = await resolveQuantity(parsed, trustedFood, provider);
    expect(provider.calls).toBe(0);
    expect(result.status).toBe("resolved");
    expect(result.estimated).toBe(false);
    expect(result.grams).toBeCloseTo(expectedGrams, 5);
  });

  // Foods WITHOUT a trusted serving for the unit under test — must fall to
  // a bounded AI estimate (never a hardcoded conversion, e.g. never
  // assuming 1 ml = 1 g), and the estimate must still require confirmation.
  it.each([
    ["1 tányér spenót", "plate"],
    ["1 tál saláta", "bowl"],
    ["1 pohár tej", "cup"],
    ["330 ml Cola Zero", "ml"],
    ["10 cm kolbász", "cm"]
  ] as const)("'%s': no trusted %s serving falls to a bounded AI estimate, not an invented conversion", async (text, expectedUnit) => {
    // A deliberately non-round-number gramsPerUnit proves the value came
    // from the mocked AI response, not from any hardcoded unit-conversion
    // rule (e.g. NOT silently treating 1 ml as 1 g).
    const provider = new MockQuantityProvider("mock-openrouter", aiEstimate(123.45));
    const parsed = parseNaturalFoodQuery(text);
    expect(parsed.unit).toBe(expectedUnit);
    const untrustedFood = food("untrusted-food");
    const result = await resolveQuantity(parsed, untrustedFood, provider);
    expect(provider.calls).toBe(1);
    expect(result.status).toBe("resolved");
    expect(result.estimated).toBe(true);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.aiOutcome).toBe("estimated");
    expect(result.grams).toBeCloseTo((parsed.quantity ?? 1) * 123.45, 5);
  });

  it("'330 ml Cola Zero' still falls back to manual grams (never invented nutrition/weight) when no AI provider is configured", async () => {
    const parsed = parseNaturalFoodQuery("330 ml Cola Zero");
    expect(parsed.unit).toBe("ml");
    expect(parsed.quantity).toBe(330);
    const result = await resolveQuantity(parsed, food("cola-zero"), new DisabledQuantityEstimationProvider());
    expect(result.status).toBe("unresolved");
    expect(result.aiOutcome).toBe("not_configured");
    expect(result.grams).toBeUndefined();
  });
});

// Owner-beta blocker (2026-09-12): "minden nagyon lassú" — a multi-item meal
// where several items each need their own dynamic-resolution AI call used to
// resolve them one at a time (both the deterministic multi-item path's own
// concurrency and the AI-assisted item loop). These tests prove independent
// items now overlap, but never more than DEFAULT_CONCURRENCY at once — the
// exact bound this checkpoint's performance principle requires, so a busy
// meal gets the latency benefit of overlap without ever bursting more
// simultaneous provider calls than that from a single request.
describe("bounded concurrency for independent meal items (owner-beta blocker, 2026-09-12)", () => {
  function concurrencyProbeIntent(): { provider: SearchIntentProvider; getMaxInFlight: () => number } {
    let inFlight = 0;
    let maxInFlight = 0;
    return {
      provider: {
        id: "concurrency-probe",
        generate: async () => {
          inFlight += 1;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await new Promise((resolve) => setTimeout(resolve, 20));
          inFlight -= 1;
          return null; // degrades to the raw query -> a safe, deterministic "not_found" miss
        }
      },
      getMaxInFlight: () => maxInFlight
    };
  }

  it("the deterministic multi-item path never runs more than DEFAULT_CONCURRENCY dynamic resolutions at once", async () => {
    const { provider, getMaxInFlight } = concurrencyProbeIntent();
    const dynamic: DynamicResolutionDeps = {
      prisma, searchIntentProvider: provider, adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1"
    };
    const text = ["zzzfood1", "zzzfood2", "zzzfood3", "zzzfood4", "zzzfood5", "zzzfood6"].map((f) => `100 g ${f}`).join(", ");
    const result = await interpretMealInput(prisma, text, undefined, undefined, dynamic);
    expect(result.items).toHaveLength(6);
    expect(getMaxInFlight()).toBeLessThanOrEqual(DEFAULT_CONCURRENCY);
    expect(getMaxInFlight()).toBeGreaterThan(1); // proves it is genuinely concurrent, not accidentally serialized
  });

  it("the AI-assisted item loop never runs more than DEFAULT_CONCURRENCY dynamic resolutions at once", async () => {
    const { provider, getMaxInFlight } = concurrencyProbeIntent();
    const dynamic: DynamicResolutionDeps = {
      prisma, searchIntentProvider: provider, adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1"
    };
    const understanding: FoodUnderstanding = {
      language: "en", kind: "multiple_foods", confidence: 0.9, clarificationNeeded: false,
      items: ["zzzfood1", "zzzfood2", "zzzfood3", "zzzfood4", "zzzfood5", "zzzfood6"].map((name) => ({
        originalText: name, canonicalName: name, quantity: 100, unit: "g" as const, evidence: "explicit" as const, confidence: 0.9
      }))
    };
    const ai = new MockFoodNlpProvider(understanding);
    const result = await interpretMealInput(prisma, "six unrelated things I don't have a clean local name for", undefined, ai, dynamic);
    expect(result.items).toHaveLength(6);
    expect(getMaxInFlight()).toBeLessThanOrEqual(DEFAULT_CONCURRENCY);
    expect(getMaxInFlight()).toBeGreaterThan(1);
  });
});

// Owner-beta (2026-09-12): truthful real-stage progress events — published
// ONLY immediately before the corresponding real awaited work begins (see
// meal-input/progress-bus.ts), never a fake percentage, never a timer.
describe("interpretMealInput: real-stage progress events", () => {
  it("H — a fast, fully deterministic trusted match publishes ONLY local_food_search — never food_understanding (no AI was needed)", async () => {
    const stages: string[] = [];
    await interpretMealInput(prisma, "5 tojás", undefined, undefined, null, (stage) => stages.push(stage));
    expect(stages).toEqual(["local_food_search"]);
  });

  it("H2 — an AI-assisted resolution publishes local_food_search BEFORE food_understanding, in that real order", async () => {
    const understanding: FoodUnderstanding = {
      language: "hu", kind: "single_food",
      items: [{ originalText: "krémsajt", canonicalName: "cream cheese", evidence: "explicit", confidence: 0.9 }],
      clarificationNeeded: false, confidence: 0.9
    };
    const stages: string[] = [];
    // "krémsajt" is not in the seeded catalog, so the deterministic pass
    // genuinely finds nothing and shouldUseAiFallback triggers for real.
    await interpretMealInput(prisma, "krémsajt", undefined, new MockFoodNlpProvider(understanding), null, (stage) => stages.push(stage));
    expect(stages[0]).toBe("local_food_search");
    expect(stages).toContain("food_understanding");
    expect(stages.indexOf("local_food_search")).toBeLessThan(stages.indexOf("food_understanding"));
  });

  it("I — a request with no onProgress callback behaves identically to one with a callback (progress is purely additive, never required)", async () => {
    const withCallback = await interpretMealInput(prisma, "5 tojás", undefined, undefined, null, () => {});
    const withoutCallback = await interpretMealInput(prisma, "5 tojás");
    expect(withCallback.selectedFood?.id).toBe(withoutCallback.selectedFood?.id);
    expect(withCallback.quantity?.grams).toBe(withoutCallback.quantity?.grams);
  });
});
