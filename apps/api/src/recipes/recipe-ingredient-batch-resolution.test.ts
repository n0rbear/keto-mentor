import { describe, expect, it } from "vitest";
import { resolveRecipeIngredientsBatch } from "./recipe-ingredient-batch-resolution.js";
import { parseNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { normalizeSearch } from "../catalog/normalize.js";
import type { DynamicResolutionDeps } from "../meal-input/interpret.js";
import type { RecipeIngredientNormalizationProvider } from "./recipe-ingredient-normalization.js";
import { DynamicFoodResolutionRateLimiter } from "../catalog/dynamic-food-rate-limit.js";

// Local catalog fixture: "vöröshagyma" (onion) is already a trusted local
// Food (zero-cost, no AI/external call needed); nothing else is local.
function fakePrisma() {
  const foods = [
    { id: "local-onion", name: "Vöröshagyma", names: { hu: "Vöröshagyma", en: "Onion" }, synonyms: { hu: ["vöröshagyma"], en: ["onion"] }, createdById: null, servings: [] }
  ].map((f) => ({ ...f, searchText: normalizeSearch([f.name, ...Object.values(f.synonyms).flat()].join(" ")) }));
  const aliasRows = foods.flatMap((f) => Object.values(f.synonyms).flat().map((a) => ({ foodId: f.id, normalizedAlias: normalizeSearch(a) })));
  const persisted: any[] = [];
  const prisma: any = {
    food: {
      findUnique: async () => null,
      findMany: async ({ where }: any) => {
        if (where?.id?.in) return foods.filter((f) => where.id.in.includes(f.id));
        const variants: string[] = (where?.OR ?? []).map((c: any) => c.searchText?.contains).filter(Boolean);
        return foods.filter((f) => variants.some((v) => f.searchText.includes(v.toLowerCase())));
      },
      create: async ({ data }: any) => { const food = { id: `persisted-${persisted.length}`, ...data }; persisted.push(food); return food; }
    },
    foodAlias: {
      findFirst: async () => null,
      findMany: async ({ where }: any) => {
        const variants: string[] = (where?.OR ?? []).map((c: any) => c.normalizedAlias?.contains).filter(Boolean);
        return aliasRows.filter((r) => variants.some((v) => r.normalizedAlias.includes(v)));
      },
      createMany: async () => ({ count: 1 }),
      upsert: async ({ create }: any) => create
    },
    nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
    foodNutrient: { create: async () => ({}) },
    $transaction: async (fn: any) => fn(prisma)
  };
  return { prisma, persisted };
}

function externalCandidate(overrides: Record<string, unknown> = {}) {
  return {
    source: "usda_fdc", sourceId: "1", originalName: "Garlic, raw", name: "Garlic, raw",
    names: { en: "Garlic, raw" }, kcalPer100g: 149, fatPer100g: 0.5, proteinPer100g: 6.4, carbsPer100g: 33, fiberPer100g: 2.1, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "1", sourceUrl: "https://fdc.nal.usda.gov/1", retrievedAt: "2026-09-13T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/1", normalizedName: "garlic raw", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-13T00:00:00.000Z", confidence: 0.6, matchPolicy: "review_required", language: "en", ...overrides
  };
}

function dynamicDeps(prisma: any, adapterLookup: (q: string) => Promise<unknown[]>, gateApprovesAll = true): DynamicResolutionDeps {
  return {
    prisma, searchIntentProvider: { id: "unused", generate: async () => null },
    adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: adapterLookup }],
    rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1",
    semanticCandidateGateProvider: { id: "fixture", checkRelevance: async (_o, candidates) => new Map(candidates.map((c) => [c.id, gateApprovesAll])) }
  };
}

function normalizationProvider(output: unknown): RecipeIngredientNormalizationProvider {
  return { id: "fixture", normalize: async () => output as any };
}

describe("resolveRecipeIngredientsBatch", () => {
  it("returns null when the normalization provider itself returns null — the caller falls back to the per-ingredient path", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveRecipeIngredientsBatch(
      prisma, normalizationProvider(null),
      { lines: [{ index: 0, raw: "200 g vöröshagyma", parsed: parseNaturalFoodQuery("200 g vöröshagyma") }] },
      dynamicDeps(prisma, async () => [])
    );
    expect(result).toBeNull();
  });

  it("a single-food line resolves via the LOCAL catalog (zero external calls) and carries the deterministic quantity", async () => {
    const { prisma } = fakePrisma();
    let adapterCalled = false;
    const result = await resolveRecipeIngredientsBatch(
      prisma, normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "onion", localName: "vöröshagyma" }] }] }),
      { lines: [{ index: 0, raw: "200 g vöröshagyma", parsed: parseNaturalFoodQuery("200 g vöröshagyma") }] },
      dynamicDeps(prisma, async () => { adapterCalled = true; return []; })
    );
    expect(adapterCalled).toBe(false);
    expect(result).toHaveLength(1);
    expect(result![0].resolution).toBe("resolved");
    expect(result![0].selectedFood?.id).toBe("local-onion");
    expect(result![0].quantity).toMatchObject({ status: "resolved", grams: 200 });
    expect(result![0].canConfirm).toBe(true);
  });

  it("a local miss falls through to dynamic (external) resolution using the canonical identity directly — no search_intent call needed", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveRecipeIngredientsBatch(
      prisma, normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "garlic", localName: "fokhagyma", quantity: 2, unit: "clove" }] }] }),
      { lines: [{ index: 0, raw: "2 gerezd fokhagyma", parsed: parseNaturalFoodQuery("2 gerezd fokhagyma") }] },
      dynamicDeps(prisma, async (query) => (query === "garlic" ? [externalCandidate()] : []))
    );
    expect(result).toHaveLength(1);
    expect(result![0].resolution).toBe("resolved");
    expect(result![0].selectedFood?.name).toBe("Garlic, raw");
  });

  // Owner-beta checkpoint (2026-09-13): the "só, bors" case from the
  // ingredient-resolution forensic trace — a real recipe line naming TWO
  // foods must never collapse down to one. `foods` is an array by
  // construction (recipe-ingredient-normalization.ts), so this proves the
  // batch resolver preserves both as independent review entries.
  it("a multi-food line ('só, bors') produces TWO independent entries, never collapsed to one — and never invents a split quantity", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveRecipeIngredientsBatch(
      prisma,
      normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "salt", localName: "só" }, { canonicalIdentity: "pepper", localName: "bors" }] }] }),
      { lines: [{ index: 0, raw: "só, bors", parsed: parseNaturalFoodQuery("só, bors") }] },
      dynamicDeps(prisma, async () => [])
    );
    expect(result).toHaveLength(2);
    expect(result!.map((r) => r.parsedFoodQuery)).toEqual(["só", "bors"]);
    // Neither food gets a deterministic quantity — the original line stated
    // no split, so quantity stays unresolved/unconfirmable for both.
    expect(result!.every((r) => r.quantity === null)).toBe(true);
    expect(result!.every((r) => r.canConfirm === false)).toBe(true);
  });

  it("an ingredient line the model returned no foods for (defensive) is treated as unresolved, never thrown", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveRecipeIngredientsBatch(
      prisma, normalizationProvider({ ingredients: [{ index: 1, foods: [{ canonicalIdentity: "onion" }] }] }), // index 0 missing
      { lines: [{ index: 0, raw: "1 db teljesen ismeretlen étel", parsed: parseNaturalFoodQuery("1 db teljesen ismeretlen étel") }] },
      dynamicDeps(prisma, async () => [])
    );
    expect(result).toHaveLength(1);
    expect(result![0].resolution).toBe("unresolved");
    expect(result![0].selectedFood).toBeNull();
  });

  it("a dynamic confirmation_required outcome carries externalCandidates through, never auto-resolved", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveRecipeIngredientsBatch(
      prisma, normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "garlic", localName: "fokhagyma" }] }] }),
      { lines: [{ index: 0, raw: "1 fej fokhagyma", parsed: parseNaturalFoodQuery("1 fej fokhagyma") }] },
      dynamicDeps(prisma, async () => [externalCandidate(), externalCandidate({ sourceId: "2", name: "Garlic, cooked", originalName: "Garlic, cooked", normalizedName: "garlic cooked" })])
    );
    expect(result).toHaveLength(1);
    expect(result![0].resolution).toBe("confirmation_required");
    expect(result![0].externalCandidates).toHaveLength(2);
    expect(result![0].selectedFood).toBeNull();
  });
});
