import { describe, expect, it } from "vitest";
import { interpretMealInput, type InterpretResult } from "./interpret.js";
import { normalizeSearch } from "../catalog/normalize.js";

type Serving = {
  id: string; key: string; unit: string; labels: Record<string, string>; grams: number;
  isEstimated: boolean; confidence: number; provenance: unknown;
};
type Food = {
  id: string; name: string; names: Record<string, string>; synonyms: Record<string, string[]>;
  servings?: Serving[]; kcalPer100g: number;
};

// Everyday catalog used in the authoritative-serving-coverage PR. Serving grams
// mirror the curated seed (USDA-backed standard measures). Estimated servings
// are intentionally marked isEstimated so they must require confirmation.
const baseFoods: Food[] = [
  {
    id: "catalog-egg", name: "Egg", names: { hu: "Tojás", de: "Ei", en: "Egg" },
    synonyms: { hu: ["tojás", "tojas"], de: ["ei", "eier"], en: ["egg", "eggs"] },
    servings: [
      { id: "egg-egg", key: "egg", unit: "egg", labels: { en: "egg" }, grams: 46, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } },
      { id: "egg-piece", key: "piece", unit: "piece", labels: { en: "piece" }, grams: 46, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } }
    ],
    kcalPer100g: 143
  },
  {
    id: "catalog-fried-egg", name: "Fried egg", names: { hu: "Tükörtojás", de: "Spiegelei", en: "Fried egg" },
    synonyms: { hu: ["tükörtojás", "tukortojas", "sült tojás", "sult tojas"], de: ["spiegelei"], en: ["fried egg"] },
    servings: [
      { id: "fried-egg", key: "egg", unit: "egg", labels: { en: "egg" }, grams: 46, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } },
      { id: "fried-piece", key: "piece", unit: "piece", labels: { en: "piece" }, grams: 46, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } }
    ],
    kcalPer100g: 196
  },
  {
    // Scrambled egg intentionally has NO serving: USDA 100 g basis is not a
    // per-egg cooked weight, so no per-egg FoodServing exists.
    id: "catalog-scrambled-egg", name: "Scrambled egg", names: { hu: "Rántotta", de: "Rührei", en: "Scrambled egg" },
    synonyms: { hu: ["rántotta", "rantotta", "tojásrántotta", "tojasrantotta"], de: ["ruhrei"], en: ["scrambled egg", "eggs scrambled"] },
    kcalPer100g: 149
  },
  {
    id: "catalog-avocado", name: "Avocado", names: { hu: "Avokádó", de: "Avocado", en: "Avocado" },
    synonyms: { hu: ["avokádó", "avokado"], de: ["avocado"], en: ["avocado"] },
    servings: [
      { id: "avo-half", key: "half", unit: "half", labels: { en: "half" }, grams: 68, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } },
      { id: "avo-piece", key: "piece", unit: "piece", labels: { en: "piece" }, grams: 136, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } }
    ],
    kcalPer100g: 160
  },
  {
    id: "catalog-butter", name: "Butter", names: { hu: "Vaj", de: "Butter", en: "Butter" },
    synonyms: { hu: ["vaj"], de: ["butter"], en: ["butter"] },
    servings: [
      { id: "butter-tbsp", key: "tbsp", unit: "tbsp", labels: { en: "tbsp" }, grams: 14, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } },
      { id: "butter-tsp", key: "tsp", unit: "tsp", labels: { en: "tsp" }, grams: 4.7, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } }
    ],
    kcalPer100g: 717
  },
  {
    id: "catalog-cheddar", name: "Cheddar cheese", names: { hu: "Cheddar sajt", de: "Cheddar", en: "Cheddar cheese" },
    synonyms: { hu: ["cheddar", "sajt"], de: ["cheddar", "käse", "kase"], en: ["cheddar", "cheese"] },
    servings: [{ id: "cheddar-slice", key: "slice", unit: "slice", labels: { en: "slice" }, grams: 28, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } }],
    kcalPer100g: 403
  },
  {
    id: "catalog-gouda", name: "Gouda cheese", names: { hu: "Gouda sajt", de: "Gouda", en: "Gouda cheese" },
    synonyms: { hu: ["gouda", "sajt"], de: ["gouda", "käse", "kase"], en: ["gouda", "cheese"] },
    servings: [{ id: "gouda-slice", key: "slice", unit: "slice", labels: { en: "slice" }, grams: 28, isEstimated: false, confidence: 1, provenance: { method: "authoritative" } }],
    kcalPer100g: 356
  },
  {
    id: "catalog-cucumber", name: "Cucumber", names: { hu: "Kígyóuborka", de: "Gurke", en: "Cucumber" },
    synonyms: { hu: ["kígyóuborka", "kigyouborka", "uborka"], de: ["gurke", "salatgurke"], en: ["cucumber"] },
    // Estimated serving: must NOT silently auto-confirm.
    servings: [{ id: "cucumber-piece", key: "piece", unit: "piece", labels: { en: "piece" }, grams: 300, isEstimated: true, confidence: 0.7, provenance: { method: "curated_estimate" } }],
    kcalPer100g: 15
  }
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

describe("authoritative serving coverage", () => {
  it("authoritative unit -> grams -> confirmable (3 slices gouda)", async () => {
    const r: InterpretResult = await interpretMealInput(prisma, "3 szelet gouda");
    expect(r.selectedFood?.id).toBe("catalog-gouda");
    expect(r.quantity?.status).toBe("resolved");
    expect(r.quantity?.grams).toBe(3 * 28);
    expect(r.quantity?.estimated).toBe(false);
    expect(r.quantity?.requiresConfirmation).toBe(false);
    expect(r.canConfirm).toBe(true);
    expect(r.quantity?.method).toBe("authoritative");
  });

  it("missing conversion -> conversion_missing (scrambled egg)", async () => {
    const r = await interpretMealInput(prisma, "5 tojásból rántotta");
    expect(r.selectedFood?.id).toBe("catalog-scrambled-egg");
    expect(r.preparation).toBe("scrambled");
    expect(r.foodResolution).toBe("resolved");
    expect(r.quantity?.status).toBe("unresolved");
    expect(r.quantity?.reason).toBe("conversion_missing");
    expect(r.quantity?.grams).toBeUndefined();
    expect(r.canConfirm).toBe(false);
  });

  it("estimated conversion must not silently auto-confirm (1 db uborka)", async () => {
    const r = await interpretMealInput(prisma, "1 db uborka");
    expect(r.selectedFood?.id).toBe("catalog-cucumber");
    expect(r.quantity?.status).toBe("resolved");
    expect(r.quantity?.grams).toBe(300);
    expect(r.quantity?.estimated).toBe(true);
    expect(r.quantity?.requiresConfirmation).toBe(true);
    expect(r.canConfirm).toBe(false);
  });

  it("preparation-specific Foods preserve their own nutrition identity (fried vs raw)", async () => {
    const fried = await interpretMealInput(prisma, "3 tükörtojás");
    expect(fried.selectedFood?.id).toBe("catalog-fried-egg");
    expect(fried.preparation).toBe("fried");
    expect(fried.quantity?.grams).toBe(3 * 46);
    expect(fried.canConfirm).toBe(true);

    const raw = await interpretMealInput(prisma, "3 tojás");
    expect(raw.selectedFood?.id).toBe("catalog-egg");
    expect(raw.preparation).toBeUndefined();
    expect(raw.quantity?.grams).toBe(3 * 46);
  });

  it("HU / DE / EN equivalent inputs resolve consistently (cheese slices)", async () => {
    const hu = await interpretMealInput(prisma, "3 szelet gouda");
    const de = await interpretMealInput(prisma, "3 Scheiben Gouda");
    const en = await interpretMealInput(prisma, "3 slices gouda");
    for (const r of [hu, de, en]) {
      expect(r.selectedFood?.id).toBe("catalog-gouda");
      expect(r.quantity?.grams).toBe(3 * 28);
      expect(r.canConfirm).toBe(true);
    }
  });

  it("HU / DE / EN equivalent inputs resolve consistently (eggs)", async () => {
    const hu = await interpretMealInput(prisma, "2 tojás");
    const de = await interpretMealInput(prisma, "2 Eier");
    const en = await interpretMealInput(prisma, "2 eggs");
    // All three must resolve to the base Egg with the same authoritative grams.
    for (const r of [hu, de, en]) {
      expect(r.selectedFood?.id).toBe("catalog-egg");
      expect(r.quantity?.status).toBe("resolved");
      expect(r.quantity?.grams).toBe(2 * 46);
    }
    // HU/DE have a single clear match and auto-confirm. EN "eggs" is a substring
    // of the scrambled-egg alias "eggs scrambled", so it ties with the scrambled
    // Food and is correctly held for confirmation rather than silently bound.
    expect(hu.canConfirm).toBe(true);
    expect(de.canConfirm).toBe(true);
    expect(en.canConfirm).toBe(false);
    expect(en.ambiguous).toBe(true);
  });

  it("HU / DE / EN equivalent inputs resolve consistently (half avocado)", async () => {
    const hu = await interpretMealInput(prisma, "fél avokádó");
    const de = await interpretMealInput(prisma, "halbe avocado");
    const en = await interpretMealInput(prisma, "half avocado");
    for (const r of [hu, de, en]) {
      expect(r.selectedFood?.id).toBe("catalog-avocado");
      expect(r.quantity?.grams).toBe(68);
      expect(r.quantity?.method).toBe("authoritative");
      expect(r.canConfirm).toBe(true);
    }
  });

  it("HU / DE / EN equivalent inputs resolve consistently (butter spoon)", async () => {
    const hu = await interpretMealInput(prisma, "1 evőkanál vaj");
    const de = await interpretMealInput(prisma, "1 EL Butter");
    const en = await interpretMealInput(prisma, "1 tbsp butter");
    for (const r of [hu, de, en]) {
      expect(r.selectedFood?.id).toBe("catalog-butter");
      expect(r.quantity?.grams).toBe(14);
      expect(r.canConfirm).toBe(true);
    }
  });

  it("butter teaspoon is authoritative and distinct from tablespoon", async () => {
    const r = await interpretMealInput(prisma, "1 tk vaj");
    expect(r.selectedFood?.id).toBe("catalog-butter");
    expect(r.quantity?.grams).toBe(4.7);
    expect(r.quantity?.method).toBe("authoritative");
    expect(r.canConfirm).toBe(true);
  });

  it("ambiguous generic sajt / Käse / cheese stays unresolved without explicit choice", async () => {
    for (const input of ["sajt", "Käse", "cheese"]) {
      const r = await interpretMealInput(prisma, input);
      expect(r.ambiguous).toBe(true);
      expect(r.canConfirm).toBe(false);
      expect(r.candidates.map((c) => c.id)).toEqual(expect.arrayContaining(["catalog-cheddar", "catalog-gouda"]));
      expect(r.foodResolution).toBe("confirmation_required");
    }
  });
});