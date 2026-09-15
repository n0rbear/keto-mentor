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
    semanticCandidateGateProvider: { id: "fixture", checkRelevance: async (_o, candidates) => new Map(candidates.map((c) => [c.id, gateApprovesAll])) },
    // The recipe-batch resolver (catalog/dynamic-food-resolution-batch.ts)
    // uses ONLY this batch-shaped gate, never the single-ingredient one
    // above — see the owner-beta checkpoint (2026-09-15) cold-path
    // performance work.
    recipeSemanticGateProvider: {
      id: "fixture",
      checkRelevanceBatch: async (input) => {
        const map = new Map<string, { relationship: "same_identity"; formCompatibility: "compatible"; contextualFit: "best_match" }>();
        if (!gateApprovesAll) return map;
        for (const ingredient of input.ingredients) for (const candidate of ingredient.candidates) map.set(`${ingredient.index}:${candidate.index}`, { relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" });
        return map;
      }
    }
  };
}

function normalizationProvider(output: unknown): RecipeIngredientNormalizationProvider {
  return { id: "fixture", normalize: async () => output as any };
}

describe("resolveRecipeIngredientsBatch", () => {
  it("prefers canonical identity over a misleading exact source-phrase match", async () => {
    const foods = [
      { id: "greens", name: "Mustard greens, raw", names: { hu: "mustár" }, searchText: "mustár mustard greens raw", createdById: null, servings: [] },
      { id: "prepared", name: "Mustard, prepared, yellow", names: { en: "prepared mustard" }, searchText: "prepared mustard yellow", createdById: null, servings: [] }
    ];
    const fake = { food: { findMany: async () => foods }, foodAlias: { findMany: async () => [] } } as any;
    const result = await resolveRecipeIngredientsBatch(fake, normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "prepared mustard" }] }] }), { lines: [{ index: 0, raw: "1 tsp mustár", parsed: parseNaturalFoodQuery("1 tsp mustár") }] }, null);
    expect(result?.[0].selectedFood?.id).toBe("prepared");
  });
  it("reuses a strongly matched persisted authoritative product alias even when its brand name is not the canonical phrase", async () => {
    const product = { id: "eros", name: "Univer Erős Pista", names: { hu: "csípős daráltpaprika-krém" }, searchText: normalizeSearch("csípős daráltpaprika-krém Erős Pista"), source: "manufacturer", createdById: null, servings: [] };
    const fake = { food: { findMany: async () => [product] }, foodAlias: { findMany: async () => [] } } as any;
    const result = await resolveRecipeIngredientsBatch(fake, normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "hot pepper paste" }] }] }), { lines: [{ index: 0, raw: "1 tbsp csípős daráltpaprika-krém", parsed: parseNaturalFoodQuery("1 tbsp csípős daráltpaprika-krém") }] }, null);
    expect(result?.[0].selectedFood?.id).toBe("eros");
  });
  it("prefers the raw canonical record for an as-supplied recipe ingredient but preserves explicit cooked state", async () => {
    const cooked = { id: "cooked", name: "Tomatoes, red, ripe, cooked", originalName: "Tomatoes, red, ripe, cooked", names: { en: "tomato" }, searchText: "tomato tomatoes red ripe cooked", source: "usda_fdc", createdById: null, servings: [] };
    const raw = { ...cooked, id: "raw", name: "Tomatoes, red, ripe, raw", originalName: "Tomatoes, red, ripe, raw", searchText: "tomato tomatoes red ripe raw" };
    const fake = { food: { findMany: async () => [cooked, raw] }, foodAlias: { findMany: async () => [] } } as any;
    const provider = normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "tomato" }] }] });
    const asSupplied = await resolveRecipeIngredientsBatch(fake, provider, { lines: [{ index: 0, raw: "1 tomato", parsed: parseNaturalFoodQuery("1 tomato") }] }, null);
    expect(asSupplied?.[0].selectedFood?.id).toBe("raw");
    const prepared = await resolveRecipeIngredientsBatch(fake, provider, { lines: [{ index: 0, raw: "1 cooked tomato", parsed: parseNaturalFoodQuery("1 cooked tomato") }] }, null);
    expect(prepared?.[0].selectedFood?.id).toBe("cooked");
  });
  // Owner-beta checkpoint (2026-09-15): CRITICAL EXAMPLE — TOMATO STALE
  // CACHE, live/reproduced. When a REAL semantic gate is configured, a
  // locally trusted candidate reached only via an unreviewed dynamic_search
  // alias (learned from an earlier, unrelated resolution) must not
  // permanently win merely because it is cached — see localFormMismatch. The
  // fast path here excludes it, falls through to dynamic resolution, and the
  // full authoritative search + gate correctly finds the raw form instead.
  it("STALE LOCAL CACHE — TOMATO: a form-mismatched dynamic_search-aliased local candidate is excluded from the fast path and dynamic resolution finds the raw form instead", async () => {
    const cookedTomato = { id: "cooked-tomato", name: "Tomatoes, red, ripe, cooked", originalName: "Tomatoes, red, ripe, cooked", names: { en: "Tomatoes, red, ripe, cooked" }, searchText: "tomatoes red ripe cooked", createdById: null, servings: [] };
    const prisma: any = {
      food: {
        findUnique: async () => null,
        findMany: async ({ where }: any) => {
          const variants: string[] = (where?.OR ?? []).map((c: any) => c.searchText?.contains).filter(Boolean);
          return [cookedTomato].filter((f) => variants.some((v) => f.searchText.includes(String(v).toLowerCase())));
        },
        create: async ({ data }: any) => ({ id: "new-tomato", ...data })
      },
      foodAlias: {
        findFirst: async () => null,
        findMany: async ({ where }: any) => {
          const variants: string[] = (where?.OR ?? []).map((c: any) => c.normalizedAlias?.contains).filter(Boolean);
          return variants.some((v) => "tomato".includes(v)) ? [{ foodId: "cooked-tomato", normalizedAlias: "tomato", kind: "dynamic_search" }] : [];
        },
        createMany: async () => ({ count: 1 })
      },
      nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
      foodNutrient: { create: async () => ({}) },
      $transaction: async (fn: any) => fn(prisma)
    };
    const rawTomato = externalCandidate({ sourceId: "170457", originalName: "Tomatoes, red, ripe, raw", name: "Tomatoes, red, ripe, raw", normalizedName: "tomatoes red ripe raw" });
    const dynamic = dynamicDeps(prisma, async () => [rawTomato]);
    const provider = normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "tomato" }] }] });
    const result = await resolveRecipeIngredientsBatch(prisma, provider, { lines: [{ index: 0, raw: "1 db paradicsom", parsed: parseNaturalFoodQuery("1 db paradicsom") }] }, dynamic);
    expect(result?.[0].selectedFood).toMatchObject({ sourceId: "170457" });
  });
  it("retries only quantity indexes omitted by the first batch and stays fail-closed after one retry", async () => {
    const { prisma } = fakePrisma();
    let calls = 0;
    const result = await resolveRecipeIngredientsBatch(prisma, normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "onion" }] }] }),
      { lines: [{ index: 0, raw: "1 piece onion", parsed: parseNaturalFoodQuery("1 piece onion") }] }, null,
      { id: "fixture", estimate: async ({ items }) => { calls += 1; return { estimates: calls === 1 ? [] : [{ index: items[0].index, grams: 100, confidence: .8 }] }; } });
    expect(calls).toBe(2);
    expect(result?.[0]).toMatchObject({ quantityGrams: 100, quantitySource: "estimated" });
  });
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

  it("passes canonical identity, raw ingredient, and recipe title to the batched semantic safety gate", async () => {
    const { prisma } = fakePrisma();
    let captured: any;
    const deps = dynamicDeps(prisma, async () => [externalCandidate({ originalName: "Mustard, prepared, yellow", name: "Mustard, prepared, yellow", normalizedName: "mustard prepared yellow" })]);
    deps.recipeSemanticGateProvider = {
      id: "capturing-fixture",
      checkRelevanceBatch: async (input) => {
        captured = input;
        const map = new Map<string, { relationship: "same_identity"; formCompatibility: "compatible"; contextualFit: "best_match" }>();
        for (const ingredient of input.ingredients) for (const candidate of ingredient.candidates) map.set(`${ingredient.index}:${candidate.index}`, { relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" });
        return map;
      }
    };
    await resolveRecipeIngredientsBatch(
      prisma,
      normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "prepared mustard", localName: "mustár" }] }] }),
      { title: "Klasszikus gulyásleves", locale: "hu", lines: [{ index: 0, raw: "1-2 tk mustár", parsed: parseNaturalFoodQuery("1-2 tk mustár") }] },
      deps
    );
    expect(captured.recipeTitle).toBe("Klasszikus gulyásleves");
    expect(captured.ingredients).toMatchObject([{ identity: "prepared mustard", rawIngredient: "1-2 tk mustár" }]);
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
    expect(result!.map((r) => r.parsedFoodQuery)).toEqual(["salt", "pepper"]);
    // Neither food gets a deterministic quantity — the original line stated
    // no split, so quantity stays unresolved/unconfirmable for both.
    expect(result!.every((r) => r.quantity === null)).toBe(true);
    expect(result!.every((r) => r.canConfirm === false)).toBe(true);
    expect(result!.every((r) => r.quantitySource === "unquantified_seasoning" && r.excludeFromNutrition === true)).toBe(true);
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

  it("preserves explicit grams even when potato identity remains unresolved", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveRecipeIngredientsBatch(prisma, normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "potato", localName: "krumpli" }] }] }), { lines: [{ index: 0, raw: "500 g krumpli", parsed: parseNaturalFoodQuery("500 g krumpli") }] }, null);
    expect(result![0]).toMatchObject({ parsedFoodQuery: "potato", resolution: "unresolved", quantityGrams: 500, quantitySource: "explicit", canConfirm: false });
  });

  it("estimates household quantities once in batch, independently of identity resolution", async () => {
    const { prisma } = fakePrisma();
    let calls = 0;
    const quantityProvider: any = { id: "fixture", estimate: async (input: any) => { calls++; expect(input.items.map((i: any) => i.identity)).toEqual(["garlic", "parsley"]); return { estimates: [{ index: 0, grams: 6, confidence: .8 }, { index: 1, grams: 20, confidence: .7 }] }; } };
    const result = await resolveRecipeIngredientsBatch(prisma, normalizationProvider({ ingredients: [
      { index: 0, foods: [{ canonicalIdentity: "garlic", localName: "fokhagyma" }] },
      { index: 1, foods: [{ canonicalIdentity: "parsley", localName: "petrezselyem" }] }
    ] }), { title: "Soup", lines: [
      { index: 0, raw: "2 gerezd fokhagyma", parsed: parseNaturalFoodQuery("2 gerezd fokhagyma") },
      { index: 1, raw: "1 csokor petrezselyem", parsed: parseNaturalFoodQuery("1 csokor petrezselyem") }
    ] }, null, quantityProvider);
    expect(calls).toBe(1);
    expect(result!.map((i) => [i.parsedFoodQuery, i.quantityGrams, i.quantitySource])).toEqual([["garlic", 6, "estimated"], ["parsley", 20, "estimated"]]);
    expect(result!.every((i) => i.resolution === "unresolved" && i.canConfirm === false)).toBe(true);
  });

  it("rejects a contextually absurd estimate without losing the identity result", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveRecipeIngredientsBatch(prisma, normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "garlic" }] }] }), { lines: [{ index: 0, raw: "2 gerezd fokhagyma", parsed: parseNaturalFoodQuery("2 gerezd fokhagyma") }] }, null, { id: "fixture", estimate: async () => ({ estimates: [{ index: 0, grams: 40_000, confidence: .9 }] }) });
    expect(result![0]).toMatchObject({ parsedFoodQuery: "garlic", quantitySource: "unknown", canConfirm: false });
    expect(result![0].quantityGrams).toBeUndefined();
  });

  it("sends only quantity-free source/canonical identities to local search and keeps material unknown bread blocking", async () => {
    const queries: string[] = [];
    const prisma: any = { food: { findMany: async ({ where }: any) => { queries.push(...(where?.OR ?? []).map((x: any) => x.searchText?.contains).filter(Boolean)); return []; } }, foodAlias: { findMany: async () => [] } };
    const result = await resolveRecipeIngredientsBatch(prisma, normalizationProvider({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "parsley", localName: "petrezselyem" }] }, { index: 1, foods: [{ canonicalIdentity: "bread", localName: "kenyér" }] }] }), { lines: [{ index: 0, raw: "1 csokor petrezselyem", parsed: parseNaturalFoodQuery("1 csokor petrezselyem") }, { index: 1, raw: "friss kenyér", parsed: parseNaturalFoodQuery("friss kenyér") }] }, null, { id: "fixture", estimate: async () => ({ estimates: [{ index: 0, grams: 20, confidence: .7 }] }) });
    expect(queries.every((q) => !q.includes("20") && !q.includes("csokor") && !q.includes("1 "))).toBe(true);
    expect(queries).toEqual(expect.arrayContaining(["petrezselyem", "parsley", "friss kenyer", "bread"]));
    expect(result![1]).toMatchObject({ parsedFoodQuery: "bread", quantitySource: "unknown", excludeFromNutrition: false, canConfirm: false });
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
