process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/ketomentor?schema=ketomentor";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.JWT_REFRESH_SECRET = "b".repeat(32);

import { describe, expect, it, vi } from "vitest";
import { resolveAuthoritativeFood, validateExternalCandidate, type ExternalFoodCandidate } from "./external-food.js";
import { UsdaFoodDataCentralLookupAdapter } from "./structured-source-adapters.js";

function candidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "123", originalName: "Raw spinach", name: "Raw spinach",
    names: { en: "Raw spinach" }, kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9,
    carbsPer100g: 3.6, fiberPer100g: 2.2, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "123", sourceUrl: "https://fdc.nal.usda.gov/123", retrievedAt: "2026-08-26T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/123", normalizedName: "raw spinach", nutrientBasis: "per_100_g",
    retrievedAt: "2026-08-26T00:00:00.000Z", confidence: 0.97, language: "en", ...overrides
  };
}

function fakePrisma(options: { local?: any; sourceDuplicate?: any; nameDuplicate?: any } = {}) {
  let created: any = null;
  const prisma: any = {
    foodAlias: {
      findMany: async () => [],
      findFirst: async () => options.nameDuplicate ? { foodId: options.nameDuplicate.id } : null,
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
    const result = await resolveAuthoritativeFood(prisma, "spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate({ confidence: 0.96 }), candidate({ sourceId: "124", name: "Spinach cooked", normalizedName: "spinach cooked", confidence: 0.91 })] }]);
    expect(result).toMatchObject({ status: "confirmation_required", reason: "ambiguous" });
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
      { nutrientId: 1008, nutrientName: "Energy", value: 23 }, { nutrientId: 1003, nutrientName: "Protein", value: 2.9 },
      { nutrientId: 1004, nutrientName: "Total lipid (fat)", value: 0.4 }, { nutrientId: 1005, nutrientName: "Carbohydrate, by difference", value: 3.6 },
      { nutrientId: 1079, nutrientName: "Fiber, total dietary", value: 2.2 }, { nutrientId: 1087, nutrientName: "Calcium", value: 99 }
    ] }] }) })) as any;
    const [food] = await new UsdaFoodDataCentralLookupAdapter("test-key", fetcher).lookup("Raw spinach");
    expect(food).toMatchObject({ source: "usda_fdc", sourceId: "123", normalizedName: "raw spinach", nutrientBasis: "per_100_g", kcalPer100g: 23, confidence: 0.97 });
    expect(food.provenance).toMatchObject({ source: "USDA FoodData Central", valuesPer: "100 g" });
    expect(food.nutrients).toEqual(expect.arrayContaining([expect.objectContaining({ key: "calcium", amountPer100g: 99 })]));
  });
});
