process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/ketomentor?schema=ketomentor";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.JWT_REFRESH_SECRET = "b".repeat(32);

import { describe, expect, it, vi } from "vitest";
import { resolveAuthoritativeFood, validateExternalCandidate, type ExternalFoodCandidate } from "./external-food.js";
import { EXTERNAL_FOOD_RATE_LIMIT, externalFoodRateLimitKey } from "./external-food-rate-limit.js";
import { normalizeUsdaNutrients, UsdaFoodDataCentralLookupAdapter } from "./structured-source-adapters.js";

function candidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "123", originalName: "Raw spinach", name: "Raw spinach",
    names: { en: "Raw spinach" }, kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9,
    carbsPer100g: 3.6, fiberPer100g: 2.2, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "123", sourceUrl: "https://fdc.nal.usda.gov/123", retrievedAt: "2026-08-26T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/123", normalizedName: "raw spinach", nutrientBasis: "per_100_g",
    retrievedAt: "2026-08-26T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", language: "en", ...overrides
  };
}

function fakePrisma(options: { local?: any; sourceDuplicate?: any; nameDuplicate?: any; aliasDuplicate?: any } = {}) {
  let created: any = null;
  const prisma: any = {
    foodAlias: {
      findMany: async () => [],
      findFirst: async () => options.aliasDuplicate ? { foodId: options.aliasDuplicate.id } : null,
      createMany: async () => ({ count: 1 })
    },
    food: {
      findUnique: async () => options.sourceDuplicate ?? null,
      findMany: async (args: any) => {
        if (args.where?.OR?.some((part: any) => part.name?.equals || part.originalName?.equals)) return options.nameDuplicate ? [options.nameDuplicate] : [];
        if (args.where?.OR?.some((part: any) => part.searchText?.contains)) return options.local ? [options.local] : [];
        return [];
      },
      create: async ({ data }: any) => (created = { id: "new-food", ...data })
    },
    nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
    foodNutrient: { create: async () => ({}) },
    $transaction: async (fn: any) => fn(prisma)
  };
  return { prisma, getCreated: () => created };
}

describe("authoritative food resolution", () => {
  it("uses a dedicated authenticated-user external lookup quota", () => {
    expect(EXTERNAL_FOOD_RATE_LIMIT).toEqual({ windowMs: 900_000, limit: 10 });
    expect(externalFoodRateLimitKey({ user: { id: "user-1" } })).toBe("user-1");
    expect(() => externalFoodRateLimitKey({})).toThrow("Authenticated user required");
  });
  it("lets a local match win without calling an external adapter", async () => {
    const local = { id: "local", name: "Spinach", originalName: "Spinach", names: {}, searchText: "spinach", servings: [] };
    const { prisma } = fakePrisma({ local });
    const lookup = vi.fn();
    const result = await resolveAuthoritativeFood(prisma, "spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup }]);
    expect(result.status).toBe("resolved_local");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("returns an existing source mapping instead of overwriting it", async () => {
    const existing = { id: "existing", source: "usda_fdc", sourceId: "123", servings: [] };
    const { prisma, getCreated } = fakePrisma({ sourceDuplicate: existing });
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }]);
    expect(result).toMatchObject({ status: "resolved_local", food: { id: "existing" } });
    expect(getCreated()).toBeNull();
  });

  it("persists one unambiguous high-confidence candidate with provenance", async () => {
    const { prisma, getCreated } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }]);
    expect(result.status).toBe("resolved_external");
    expect(getCreated()).toMatchObject({ source: "usda_fdc", sourceId: "123", provenance: expect.objectContaining({ source: "USDA FoodData Central" }) });
  });

  it("requires confirmation for ambiguous candidates", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate({ confidence: 0.96 }), candidate({ sourceId: "124", name: "Spinach cooked", normalizedName: "spinach cooked", confidence: 0.91 })] }]);
    expect(result).toMatchObject({ status: "confirmation_required", reason: "ambiguous" });
  });

  it("requires review for a near but non-exact result regardless of policy score", async () => {
    const { prisma, getCreated } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate({ confidence: 0.99, matchPolicy: "review_required" })] }]);
    expect(result).toMatchObject({ status: "confirmation_required", reason: "weak_match" });
    expect(getCreated()).toBeNull();
  });

  it("distinguishes successful empty lookup from total provider outage", async () => {
    const { prisma } = fakePrisma();
    await expect(resolveAuthoritativeFood(prisma, "unknown", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }])).resolves.toMatchObject({ reason: "not_found" });
    await expect(resolveAuthoritativeFood(prisma, "unknown", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => { throw new Error("secret upstream detail"); } }])).resolves.toMatchObject({ reason: "external_unavailable" });
  });

  it("continues after one provider fails and uses a later successful result", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [
      { source: "usda_fdc", sourceName: "broken", lookup: async () => { throw new Error("timeout"); } },
      { source: "usda_fdc", sourceName: "working", lookup: async () => [candidate()] }
    ]);
    expect(result.status).toBe("resolved_external");
  });

  it("requires confirmation for a conservative canonical-name duplicate", async () => {
    const duplicate = { id: "similar", name: "Raw spinach", originalName: "Spinach raw", source: "bls", sourceId: "B1", servings: [] };
    const { prisma } = fakePrisma({ nameDuplicate: duplicate });
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }]);
    expect(result).toMatchObject({ status: "confirmation_required", reason: "possible_duplicate" });
  });

  it("rejects malformed and nutritionally incomplete external data", async () => {
    expect(validateExternalCandidate({ name: "invented" })).toBeNull();
    expect(validateExternalCandidate(candidate({ proteinPer100g: Number.NaN }))).toBeNull();
    const { prisma } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "unknown", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [{ name: "No macros" }] }]);
    expect(result).toMatchObject({ status: "unresolved", reason: "invalid_external_data" });
  });
});

describe("USDA structured lookup adapter", () => {
  it("normalizes authoritative per-100-g macros and traceable provenance", async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ foods: [{ fdcId: 123, description: "Raw spinach", dataType: "Foundation", foodCategory: "Vegetables", foodNutrients: [
      { nutrientId: 1008, nutrientName: "Energy", unitName: "kcal", value: 23 }, { nutrientId: 1003, nutrientName: "Protein", unitName: "g", value: 2.9 },
      { nutrientId: 1004, nutrientName: "Total lipid (fat)", unitName: "g", value: 0.4 }, { nutrientId: 1005, nutrientName: "Carbohydrate, by difference", unitName: "g", value: 3.6 },
      { nutrientId: 1079, nutrientName: "Fiber, total dietary", unitName: "g", value: 2.2 }, { nutrientId: 1087, nutrientName: "Calcium", unitName: "mg", value: 99 }
    ] }] }) })) as any;
    const [food] = await new UsdaFoodDataCentralLookupAdapter("test-key", fetcher).lookup("Raw spinach");
    expect(food).toMatchObject({ source: "usda_fdc", sourceId: "123", normalizedName: "raw spinach", nutrientBasis: "per_100_g", kcalPer100g: 23, confidence: 0.97 });
    expect(food.provenance).toMatchObject({ source: "USDA FoodData Central", valuesPer: "100 g" });
    expect(food.nutrients).toEqual(expect.arrayContaining([expect.objectContaining({ key: "calcium", amountPer100g: 99 })]));
  });

  it.each([
    ["whole milk", "milk"], ["skim milk", "whole milk"], ["scrambled egg", "egg"],
    ["chicken breast", "chicken"], ["spinach raw", "spinach cooked"]
  ])("does not merge preparation/state variants: %s vs %s", async (externalName, existingName) => {
    const duplicate = { id: "different", name: existingName, originalName: existingName, source: "bls", sourceId: "B1", servings: [] };
    const { prisma } = fakePrisma({ nameDuplicate: duplicate });
    const result = await resolveAuthoritativeFood(prisma, externalName, [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate({ name: externalName, originalName: externalName, normalizedName: externalName })] }]);
    expect(result.status).toBe("resolved_external");
  });

  it("uses nutrient IDs and canonical units, ignoring kJ energy regardless of ordering", () => {
    const kcal = { nutrientId: 1008, unitName: "kcal", value: 23 };
    const kj = { nutrientId: 1008, unitName: "kJ", value: 96 };
    for (const rows of [[kj, kcal], [kcal, kj]]) {
      expect(normalizeUsdaNutrients(rows).find((item) => item.key === "energy_kcal")?.amountPer100g).toBe(23);
    }
  });

  it("maps all primary macros by nutrient ID and rejects malformed units", () => {
    const nutrients = normalizeUsdaNutrients([
      { nutrientId: 1003, unitName: "g", value: 2.9 }, { nutrientId: 1004, unitName: "g", value: 0.4 },
      { nutrientId: 1005, unitName: "g", value: 3.6 }, { nutrientId: 1079, unitName: "g", value: 0 },
      { nutrientId: 1008, unitName: "joule", value: 23 }
    ]);
    expect(Object.fromEntries(nutrients.map((item) => [item.key, item.amountPer100g]))).toMatchObject({ protein: 2.9, total_fat: 0.4, carbohydrate: 3.6, fiber: 0 });
    expect(nutrients.some((item) => item.key === "energy_kcal")).toBe(false);
  });

  it("does not turn missing or malformed fiber into zero", async () => {
    const base = [
      { nutrientId: 1008, unitName: "kcal", value: 23 }, { nutrientId: 1003, unitName: "g", value: 2.9 },
      { nutrientId: 1004, unitName: "g", value: 0.4 }, { nutrientId: 1005, unitName: "g", value: 3.6 }
    ];
    for (const extra of [[], [{ nutrientId: 1079, unitName: "mg", value: 2.2 }]]) {
      const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ foods: [{ fdcId: 123, description: "Raw spinach", dataType: "Foundation", foodNutrients: [...base, ...extra] }] }) })) as any;
      const [food] = await new UsdaFoodDataCentralLookupAdapter("test-key", fetcher).lookup("Raw spinach");
      expect(validateExternalCandidate(food)).toBeNull();
    }
  });

  it("rejects branded, malformed, empty and oversized response entries safely", async () => {
    const foods = Array.from({ length: 10 }, (_, index) => ({ fdcId: index + 1, description: "Product", dataType: index === 0 ? "Branded" : "Unknown", foodNutrients: [] }));
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ foods }) })) as any;
    await expect(new UsdaFoodDataCentralLookupAdapter("test-key", fetcher).lookup("Product")).resolves.toEqual([]);
  });

  it("rejects non-OK, malformed JSON and oversized payloads", async () => {
    await expect(new UsdaFoodDataCentralLookupAdapter("test-key", vi.fn(async () => ({ ok: false })) as any).lookup("x")).rejects.toThrow("USDA lookup failed");
    await expect(new UsdaFoodDataCentralLookupAdapter("test-key", vi.fn(async () => ({ ok: true, headers: { get: () => null }, text: async () => "{" })) as any).lookup("x")).rejects.toThrow("USDA response invalid");
    await expect(new UsdaFoodDataCentralLookupAdapter("test-key", vi.fn(async () => ({ ok: true, headers: { get: () => "1000001" }, text: async () => "{}" })) as any).lookup("x")).rejects.toThrow("USDA response too large");
  });
});
