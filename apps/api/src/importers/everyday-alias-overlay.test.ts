import { describe, expect, it } from "vitest";
import { searchFoods } from "../catalog/food-search.js";
import { applyEverydayExternalAliasTargets, planEverydayAliasUpserts } from "./everyday-alias-overlay.js";
import { EVERYDAY_COVERAGE_V2 } from "./everyday-coverage-manifest.js";
import { buildProjectedCatalog, projectedCatalogPrisma, type ProjectedCatalog } from "./projected-catalog.js";
import type { ImportFood } from "./types.js";

const importedEgg: ImportFood = {
  source: "bls", sourceId: "E111100", originalName: "Hühnerei roh", name: "Hühnerei roh", names: { de: "Hühnerei roh" },
  kcalPer100g: 140, proteinPer100g: 12, fatPer100g: 10, carbsPer100g: 1, fiberPer100g: 0,
  provenance: { source: "test" }, nutrients: []
};
const current: ProjectedCatalog = {
  foods: [{ id: "catalog-egg", name: "Egg", originalName: "Egg", names: { hu: "Tojás", de: "Ei", en: "Egg" }, searchText: "egg tojas ei", source: "open_database", sourceId: "171287", createdById: null, servings: [{ id: "egg-serving", key: "egg", unit: "egg", labels: {}, grams: 50, isEstimated: false, confidence: 1, provenance: {} }] }],
  aliases: [{ foodId: "catalog-egg", alias: "egg", normalizedAlias: "egg", locale: "en", kind: "synonym" }]
};

describe("Everyday alias overlay", () => {
  it("targets the explicit starter Food and preserves serving data without a cross-source merge", async () => {
    const eggEntry = EVERYDAY_COVERAGE_V2.filter((entry) => entry.key === "egg");
    const projected = buildProjectedCatalog(current, [importedEgg], eggEntry);
    expect(projected.foods).toHaveLength(2);
    expect(projected.foods.find((food) => food.id === "catalog-egg")?.servings).toHaveLength(1);
    expect(projected.aliases.filter((alias) => alias.normalizedAlias === "eggs").map((alias) => alias.foodId)).toEqual(["catalog-egg"]);
    expect((await searchFoods(projectedCatalogPrisma(projected), "eggs"))[0]).toMatchObject({ id: "catalog-egg", match: { stage: "alias", score: 95 } });
  });

  it("reports create/update counts using production uniqueness semantics", () => {
    const eggEntry = EVERYDAY_COVERAGE_V2.filter((entry) => entry.key === "egg");
    const plan = planEverydayAliasUpserts([importedEgg], current.foods, current.aliases, eggEntry);
    expect(plan.targetFoodIds).toEqual(["catalog-egg"]);
    expect(plan.aliasesToUpdate).toBe(1);
    expect(plan.aliasesToCreate).toBeGreaterThan(0);
  });

  it("fails closed before writing when an explicit target is missing", async () => {
    let writes = 0;
    const prisma = {
      food: { findMany: async () => [] },
      foodAlias: { upsert: async () => { writes++; } }
    } as any;
    await expect(applyEverydayExternalAliasTargets(prisma, EVERYDAY_COVERAGE_V2.filter((entry) => entry.key === "egg"))).rejects.toThrow(/catalog-egg/);
    expect(writes).toBe(0);
  });

  it("uses idempotent scoped upserts and does not touch nutrition", async () => {
    const calls: any[] = [];
    const prisma = {
      food: { findMany: async (args: any) => { expect(args.where.createdById).toBeNull(); return [{ id: "catalog-egg" }]; } },
      foodAlias: { upsert: async (args: any) => { calls.push(args); } }
    } as any;
    const entries = EVERYDAY_COVERAGE_V2.filter((entry) => entry.key === "egg");
    await applyEverydayExternalAliasTargets(prisma, entries);
    const first = calls.map((call) => call.where);
    calls.length = 0;
    await applyEverydayExternalAliasTargets(prisma, entries);
    expect(calls.map((call) => call.where)).toEqual(first);
    expect(calls.every((call) => call.create.foodId === "catalog-egg")).toBe(true);
  });
});
