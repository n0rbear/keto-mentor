import { describe, expect, it } from "vitest";
import { searchFoods } from "../catalog/food-search.js";
import { buildSearchText } from "../catalog/normalize.js";
import { applyEverydayExternalAliasTargets, planEverydayAliasUpserts } from "./everyday-alias-overlay.js";
import { EVERYDAY_COVERAGE_V2, EVERYDAY_SEARCH_CORPUS } from "./everyday-coverage-manifest.js";
import { auditProjectedEuropeanEssentials, auditProjectedSearch } from "./everyday-projected-audit.js";
import { EUROPEAN_ESSENTIALS } from "./european-essentials-manifest.js";
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

  it("keeps all 100 original European Essentials searches usable after projected apply", async () => {
    const sourceFoods = EUROPEAN_ESSENTIALS.map((entry) => {
      const source = entry.source === "bls" ? "bls" : "usda_fdc";
      const language = entry.source === "bls" ? "de" : "en";
      const value = {
        id: `essential:${source}:${entry.sourceId}`, source, sourceId: entry.sourceId, createdById: null,
        name: entry.label, originalName: entry.expectedNameTokens.join(" "), names: { [language]: entry.label },
        synonyms: { [language]: [entry.label, ...entry.synonyms] }, servings: []
      };
      return { ...value, searchText: buildSearchText(value) };
    });
    const starters = [
      ["catalog-egg", "Egg", "171287"], ["catalog-avocado", "Avocado", "171705"],
      ["catalog-butter", "Butter", "173430"], ["catalog-spinach", "Spinach", "168462"],
      ["catalog-cucumber", "Cucumber", "168409"], ["catalog-gouda", "Gouda", "171241"],
      ["catalog-cheddar", "Cheddar", "173414"]
    ].map(([id, name, sourceId]) => ({ id, name, originalName: name, names: { en: name }, searchText: name.toLowerCase(), source: "open_database", sourceId, createdById: null, servings: [] }));
    const resolved = EVERYDAY_COVERAGE_V2.map((entry) => {
      const source = entry.source === "bls" ? "bls" : "usda_fdc";
      const language = entry.source === "bls" ? "de" : "en";
      const names = entry.aliasTarget.kind === "source_identity"
        ? Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, aliases[0]]))
        : { [language]: entry.expectedNameTokens.join(" ") };
      const synonyms = entry.aliasTarget.kind === "source_identity"
        ? Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, [...aliases]]))
        : {};
      return {
        source, sourceId: entry.sourceId, originalName: entry.expectedNameTokens.join(" "), name: entry.expectedNameTokens.join(" "),
        names, synonyms, kcalPer100g: 1, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1, fiberPer100g: 1,
        provenance: { source: "test" }, nutrients: []
      } as ImportFood;
    });
    const projected = buildProjectedCatalog({
      foods: [...sourceFoods, ...starters],
      aliases: [
        { foodId: "catalog-gouda", alias: "Käse", normalizedAlias: "kase", locale: "de", kind: "synonym" },
        { foodId: "catalog-cheddar", alias: "Käse", normalizedAlias: "kase", locale: "de", kind: "synonym" }
      ]
    }, resolved);
    const audit = await auditProjectedEuropeanEssentials(projected);
    expect(audit.total).toBe(100);
    expect(audit.wrong).toBe(0);
    expect(audit.missing).toBe(0);
    expect(audit.results.filter((result) => result.category === "AMBIGUOUS").map((result) => result.key)).toEqual(["chicken-breast", "gouda"]);
  });

  it("separates true interpreter ambiguity from a low-confidence generic rank tie", async () => {
    const foods = [
      ["cheddar", "Cheddar"], ["gouda", "Gouda"], ["cod", "Fish cod"],
      ["salmon", "Fish salmon"], ["wheat", "Wheat bread"], ["rye", "Rye bread"]
    ].map(([id, name]) => ({
      id, name, originalName: name, names: { en: name }, searchText: name.toLowerCase(),
      source: "test", sourceId: id, createdById: null, servings: []
    }));
    const aliases = ["sajt", "kase"].flatMap((normalizedAlias) => ["cheddar", "gouda"].map((foodId) => ({
      foodId, alias: normalizedAlias, normalizedAlias, locale: normalizedAlias === "sajt" ? "hu" : "de", kind: "synonym"
    })));
    const genericCases = EVERYDAY_SEARCH_CORPUS.filter((item) => item.expectedAmbiguous);
    const audit = await auditProjectedSearch({ foods, aliases }, genericCases);
    expect(audit.categories.AMBIGUOUS).toBe(4);
    expect(audit.ambiguity).toEqual({ trueInterpreterAmbiguity: 3, genericLowConfidenceTie: 1 });
    expect(audit.results.filter((result) => result.category === "AMBIGUOUS" && !result.interpretWouldBeAmbiguous).map((result) => result.query)).toEqual(["bread"]);
  });
});
