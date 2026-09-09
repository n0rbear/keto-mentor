import { describe, expect, it, vi } from "vitest";
import { resolveDynamicFood } from "./dynamic-food-resolution.js";
import { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";
import { DisabledSearchIntentProvider, type SearchIntent, type SearchIntentProvider } from "./search-intent.js";
import type { ExternalFoodCandidate } from "./external-food.js";

function pork(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "172152", originalName: "Pork hock, cooked", name: "Pork hock, cooked",
    names: { en: "Pork hock, cooked" }, kcalPer100g: 280, fatPer100g: 22, proteinPer100g: 20, carbsPer100g: 0, fiberPer100g: 0, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "172152", sourceUrl: "https://fdc.nal.usda.gov/172152", retrievedAt: "2026-09-09T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/172152", normalizedName: "pork hock", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-09T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", language: "en", ...overrides
  };
}

function fakePrisma(options: { seedFoods?: any[] } = {}) {
  const foods: any[] = options.seedFoods ?? [];
  const aliases: Array<{ foodId: string; alias: string; normalizedAlias: string; locale: string; kind: string }> = [];
  const prisma: any = {
    food: {
      findUnique: async ({ where }: any) => foods.find((f) => f.source === where.source_sourceId.source && f.sourceId === where.source_sourceId.sourceId) ?? null,
      // Real enough to prove the "second call is a local hit" lifecycle:
      // matches searchFoods' own searchText-contains query against whatever
      // persistCandidate actually wrote (a real, non-mocked searchText), AND
      // resolves alias-only matches (learned Hungarian search terms) the same
      // way food-search.ts's own missingIds backfill does.
      findMany: async (args: any) => {
        if (args?.where?.id?.in) return foods.filter((food) => args.where.id.in.includes(food.id)).map((food) => ({ ...food, servings: [] }));
        const variants: string[] = (args?.where?.OR ?? []).map((clause: any) => clause.searchText?.contains).filter(Boolean);
        if (!variants.length) return [];
        return foods.filter((food) => variants.some((v) => String(food.searchText ?? "").toLowerCase().includes(String(v).toLowerCase())))
          .map((food) => ({ ...food, servings: [] }));
      },
      create: async ({ data }: any) => { const food = { id: `food-${foods.length}`, ...data }; foods.push(food); return food; }
    },
    foodAlias: {
      findFirst: async () => null,
      findMany: async ({ where }: any) => {
        const variants: string[] = (where?.OR ?? []).map((clause: any) => clause.normalizedAlias?.contains).filter(Boolean);
        return aliases.filter((a) => variants.some((v) => a.normalizedAlias.includes(v))).map((a) => ({ foodId: a.foodId, normalizedAlias: a.normalizedAlias }));
      },
      createMany: async () => ({ count: 1 }),
      upsert: async ({ where, create }: any) => {
        const key = where.foodId_normalizedAlias_locale;
        const existing = aliases.find((a) => a.foodId === key.foodId && a.normalizedAlias === key.normalizedAlias && a.locale === key.locale);
        if (existing) return existing;
        const row = { foodId: create.foodId, alias: create.alias, normalizedAlias: create.normalizedAlias, locale: create.locale, kind: create.kind };
        aliases.push(row);
        return row;
      }
    },
    nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
    foodNutrient: { create: async () => ({}) },
    $transaction: async (fn: any) => fn(prisma)
  };
  return { prisma, foods, aliases };
}

function stubSearchIntent(intent: SearchIntent | null): SearchIntentProvider {
  return { id: "stub", generate: async () => intent };
}

describe("resolveDynamicFood: bounded local-miss fallback", () => {
  it("no adapters configured -> unresolved(no_adapters), never calls search-intent or rate limiter", async () => {
    const { prisma } = fakePrisma();
    const generate = vi.fn();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: { id: "s", generate },
      adapters: [],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(result).toEqual({ status: "unresolved", reason: "no_adapters" });
    expect(generate).not.toHaveBeenCalled();
  });

  it("rate-limited user -> unresolved(rate_limited), never calls search-intent or the adapter", async () => {
    const { prisma } = fakePrisma();
    const limiter = new DynamicFoodResolutionRateLimiter();
    vi.spyOn(limiter, "consume").mockReturnValue(false);
    const generate = vi.fn();
    const lookup = vi.fn();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: { id: "s", generate },
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }],
      rateLimiter: limiter,
      userId: "user-1"
    });
    expect(result).toEqual({ status: "unresolved", reason: "rate_limited" });
    expect(generate).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("uses the search-intent's first English term as the single search query when available", async () => {
    const { prisma } = fakePrisma();
    const lookup = vi.fn(async () => [pork()]);
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock", "pork knuckle"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(lookup).toHaveBeenCalledOnce();
    expect(lookup).toHaveBeenCalledWith("pork hock");
    expect(result).toMatchObject({ status: "resolved", via: "search_intent" });
  });

  it("degrades to the raw food phrase when search-intent is disabled/unavailable — still attempts the lookup", async () => {
    const { prisma } = fakePrisma();
    const lookup = vi.fn(async (q: string) => (q === "csülök" ? [pork({ normalizedName: "csülök" })] : []));
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: new DisabledSearchIntentProvider(),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(lookup).toHaveBeenCalledWith("csülök");
    expect(result).toMatchObject({ status: "resolved", via: "raw_query" });
  });

  it("makes exactly one external search call — never a search-intent -> USDA -> search-intent -> USDA chain", async () => {
    const { prisma } = fakePrisma();
    const lookup = vi.fn(async () => [pork()]);
    await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(lookup).toHaveBeenCalledOnce();
  });

  it("surfaces ambiguous candidates for confirmation rather than silently choosing", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [pork({ confidence: 0.96 }), pork({ sourceId: "172153", name: "Pork, cured, hock", normalizedName: "pork hock cured", confidence: 0.9 })] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(result).toMatchObject({ status: "confirmation_required", reason: "ambiguous" });
    expect((result as any).candidates).toHaveLength(2);
  });

  it("no candidate found -> unresolved(not_found), never invents a Food", async () => {
    const { prisma, foods } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "teljesen ismeretlen étel" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "unknown", searchTerms: ["unknown food xyz"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(result).toEqual({ status: "unresolved", reason: "not_found" });
    expect(foods).toHaveLength(0);
  });

  it("external provider outage -> unresolved(external_unavailable), no crash, no invented Food", async () => {
    const { prisma, foods } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => { throw new Error("upstream secret timeout detail"); } }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(result).toEqual({ status: "unresolved", reason: "external_unavailable" });
    expect(foods).toHaveLength(0);
  });
});

describe("resolveDynamicFood: persist once, reuse forever", () => {
  it("first miss resolves+persists via one external call; a second miss with the same intent hits locally with zero external calls", async () => {
    const { prisma, foods } = fakePrisma();
    let externalCalls = 0;
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => { externalCalls += 1; return [pork()]; } }];
    const deps = {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters, rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1"
    };

    const first = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, deps);
    expect(first.status).toBe("resolved");
    expect(externalCalls).toBe(1);
    expect(foods).toHaveLength(1);
    expect(foods[0]).toMatchObject({ source: "usda_fdc", sourceId: "172152" });

    // A DIFFERENT user, same concept: resolveAuthoritativeFood's own local
    // search (inside resolveDynamicFood) finds the now-persisted Food before
    // ever reaching the adapter again.
    const second = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, { ...deps, userId: "user-2" });
    expect(second).toMatchObject({ status: "resolved", food: { id: "food-0" } });
    expect(externalCalls).toBe(1); // unchanged
    expect(foods).toHaveLength(1); // no duplicate
  });

  it("learns the raw user phrase as a conservative alias so the SAME Hungarian text hits locally even without search-intent running again", async () => {
    const { prisma, foods, aliases } = fakePrisma();
    let externalCalls = 0;
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => { externalCalls += 1; return [pork()]; } }];

    await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"], sourceLanguage: "hu" }),
      adapters, rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1"
    });
    expect(aliases).toContainEqual(expect.objectContaining({ normalizedAlias: "csulok", locale: "hu", kind: "dynamic_search" }));

    // Search-intent disabled this time (simulating an LLM outage) — the raw
    // Hungarian phrase alone must still resolve locally via the learned alias.
    const outageResult = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: new DisabledSearchIntentProvider(),
      adapters, rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-3"
    });
    expect(outageResult).toMatchObject({ status: "resolved", food: { id: "food-0" } });
    expect(externalCalls).toBe(1); // still just the original resolution
    expect(foods).toHaveLength(1);
  });
});
