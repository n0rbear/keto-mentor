import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { afterEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { searchFoods } from "../catalog/food-search.js";
import { buildSearchText, normalizeSearch } from "../catalog/normalize.js";
import { EverydayCoverageAdapter, auditEverydayMustFind } from "./everyday-coverage-adapter.js";
import { parseEverydayCoverageCliOptions } from "./everyday-coverage-cli-options.js";
import { EVERYDAY_COVERAGE_V2, EVERYDAY_SEARCH_CORPUS } from "./everyday-coverage-manifest.js";
import { aliasesForImportedFood } from "./import-foods.js";
import { planImportFromSnapshot } from "./import-plan.js";
import type { ImportFood } from "./types.js";

let temporary: string | undefined;
afterEach(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); temporary = undefined; });

const fakeFood = (entry: (typeof EVERYDAY_COVERAGE_V2)[number]): ImportFood => ({
  source: entry.source === "bls" ? "bls" : "usda_fdc",
  sourceId: entry.sourceId,
  originalName: entry.expectedNameTokens.join(" "),
  name: entry.expectedNameTokens.join(" "),
  names: Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, aliases[0]])),
  synonyms: Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, [...aliases]])),
  kcalPer100g: 1,
  proteinPer100g: 1,
  fatPer100g: 1,
  carbsPer100g: 1,
  fiberPer100g: 1,
  provenance: { source: "test" },
  nutrients: []
});

describe("Everyday Coverage v2", () => {
  it("is a unique, bounded identity increment with a multilingual evaluation corpus", () => {
    expect(EVERYDAY_COVERAGE_V2).toHaveLength(106);
    expect(EVERYDAY_COVERAGE_V2.filter((entry) => entry.reusesEuropeanEssential)).toHaveLength(81);
    expect(EVERYDAY_COVERAGE_V2.filter((entry) => !entry.reusesEuropeanEssential)).toHaveLength(25);
    expect(new Set(EVERYDAY_COVERAGE_V2.map((entry) => `${entry.source}:${entry.sourceId}`)).size).toBe(106);
    expect(EVERYDAY_COVERAGE_V2.filter((entry) => entry.source === "bls")).toHaveLength(101);
    expect(EVERYDAY_COVERAGE_V2.filter((entry) => entry.source !== "bls")).toHaveLength(5);
    expect(EVERYDAY_SEARCH_CORPUS).toHaveLength(244);
    expect(new Set(EVERYDAY_SEARCH_CORPUS.map((item) => item.expectedConcept)).size).toBe(109);
    expect(EVERYDAY_SEARCH_CORPUS.filter((item) => item.expectedAmbiguous)).toHaveLength(4);
    expect(EVERYDAY_SEARCH_CORPUS.filter((item) => item.expectedConcept === "red-onion").every((item) => item.expectedSourceId === "790577")).toBe(true);
    expect(EVERYDAY_SEARCH_CORPUS.some((item) => item.query === "weisskohl")).toBe(true);
    expect(EVERYDAY_SEARCH_CORPUS.some((item) => item.query === "susskirsche")).toBe(true);
    expect(EVERYDAY_COVERAGE_V2.filter((entry) => entry.aliasTarget.kind === "food_id").map((entry) => entry.key).sort()).toEqual([
      "avocado", "butter", "cheddar", "cucumber", "egg", "gouda", "spinach"
    ]);
  });

  it("has no duplicate normalized alias for a food and covers HU, DE and EN", () => {
    const owners = new Map<string, Set<string>>();
    for (const entry of EVERYDAY_COVERAGE_V2) {
      const aliases = aliasesForImportedFood(fakeFood(entry));
      expect(new Set(aliases.map((alias) => `${alias.locale}:${alias.normalizedAlias}`)).size).toBe(aliases.length);
      expect(new Set(aliases.map((alias) => alias.locale))).toEqual(new Set(["hu", "de", "en"]));
      for (const alias of aliases) owners.set(alias.normalizedAlias, new Set([...(owners.get(alias.normalizedAlias) ?? []), entry.key]));
    }
    expect([...owners].filter(([, concepts]) => concepts.size > 1)).toEqual([]);
    expect(normalizeSearch("Weißkohl Süßkirsche")).toBe("weisskohl susskirsche");
  });

  it("passes every source-bound must-find case once curated aliases are present", () => {
    expect(auditEverydayMustFind(EVERYDAY_COVERAGE_V2.map(fakeFood))).toEqual({ total: 240, passed: 240, failed: [] });
  });

  it("ranks exact curated aliases above pre-existing partial wrong-top candidates", async () => {
    const curated = EVERYDAY_COVERAGE_V2.filter((entry) => ["chicken-thigh", "pork-loin", "ground-pork"].includes(entry.key)).map((entry) => {
      const food = fakeFood(entry);
      return { ...food, id: entry.key, createdById: null, searchText: buildSearchText(food), servings: [] };
    });
    const distractors = [
      { id: "old-thigh", source: "usda_fdc", sourceId: "2646171", name: "Chicken, thigh, boneless, skinless, raw", originalName: "Chicken, thigh, boneless, skinless, raw", names: {}, searchText: "chicken thigh boneless skinless raw", createdById: null, servings: [] },
      { id: "old-loin", source: "usda_fdc", sourceId: "2646168", name: "Pork, loin, boneless, raw", originalName: "Pork, loin, boneless, raw", names: {}, searchText: "pork loin boneless raw", createdById: null, servings: [] }
    ];
    const records = [...curated, ...distractors];
    const aliases = curated.flatMap((food) => aliasesForImportedFood(food).map((alias) => ({ foodId: food.id, normalizedAlias: alias.normalizedAlias })));
    const prisma = {
      foodAlias: { findMany: async ({ where, take = 60 }: any) => aliases.filter((alias) => where.OR.some((part: any) => alias.normalizedAlias.includes(part.normalizedAlias.contains))).slice(0, take) },
      food: { findMany: async ({ where, take = 90 }: any) => {
        if (where.id?.in) return records.filter((food) => where.id.in.includes(food.id));
        return records.filter((food) => where.OR.some((part: any) => food.searchText.includes(part.searchText.contains))).slice(0, take);
      } }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;
    for (const [query, expected] of [["chicken thigh", "chicken-thigh"], ["pork loin", "pork-loin"], ["darált sertéshús", "ground-pork"]]) {
      const top = (await searchFoods(prisma, query))[0];
      expect(top.id).toBe(expected);
      expect(["exact", "alias"]).toContain(top.match.stage);
      expect(top.match.score).toBeGreaterThanOrEqual(95);
    }
  });

  it("keeps a generic cheese query ambiguous instead of binding it to one food", async () => {
    const records = ["gouda", "cheddar"].map((name) => ({ id: name, name, originalName: name, names: { hu: `${name} sajt` }, searchText: `${name} sajt`, createdById: null, servings: [] }));
    const prisma = {
      foodAlias: { findMany: async () => [] },
      food: { findMany: async () => records }
    } as unknown as Pick<PrismaClient, "food" | "foodAlias">;
    const results = await searchFoods(prisma, "sajt");
    expect(results).toHaveLength(2);
    expect(results[0].match.score).toBe(results[1].match.score);
    expect(results[0].match.score).toBeLessThan(90);
  });

  it("requires both explicit apply flags and bounds the batch size", () => {
    const paths = ["--bls", "bls.xlsx", "--usda-sr", "sr", "--usda-foundation", "foundation"];
    expect(parseEverydayCoverageCliOptions(paths)).toMatchObject({ apply: false, batchSize: 75 });
    expect(() => parseEverydayCoverageCliOptions([...paths, "--apply"])).toThrow(/requires --apply --confirm/);
    expect(() => parseEverydayCoverageCliOptions([...paths, "--batch-size", "101"])).toThrow(/50 to 100/);
    expect(() => parseEverydayCoverageCliOptions([...paths, "--snapshot", "snapshot.json", "--apply", "--confirm", "everyday-coverage-v2"])).toThrow(/dry-run only/);
  });

  it("resolves only the approved exact BLS identity and plans without database writes", async () => {
    temporary = await mkdtemp(join(tmpdir(), "coverage-test-"));
    const file = join(temporary, "bls.xlsx");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("BLS");
    sheet.addRow(["BLS Code", "Lebensmittelbezeichnung", "ENERCC Energie [kcal/100g]", "PROT625 Protein [g/100g]", "FAT Fett [g/100g]", "CHO Kohlenhydrate [g/100g]", "FIBT Ballaststoffe [g/100g]"]);
    sheet.addRow(["V4A5100", "Hähnchen Oberschenkel roh", 173, 18.2, 11, 0, 0]);
    sheet.addRow(["V4A5199", "Hähnchen Oberschenkel roh ähnlich", 999, 99, 99, 99, 99]);
    await workbook.xlsx.writeFile(file);
    const entry = EVERYDAY_COVERAGE_V2.filter((item) => item.key === "chicken-thigh");
    const adapter = new EverydayCoverageAdapter("bls", entry);
    const planned = await planImportFromSnapshot(adapter, file, {
      capturedAt: "2026-08-30T00:00:00.000Z",
      schema: "ketomentor",
      identities: [],
      nutrientKeys: ["energy_kcal", "protein", "total_fat", "carbohydrate", "fiber"]
    });
    expect(planned.report).toMatchObject({ dryRun: true, inputRecords: 1, validRecords: 1, skippedRecords: 0, foodsToCreate: 1, foodsToUpdate: 0, nutrientsToCreate: 0 });
    expect(planned.foods[0]).toMatchObject({ source: "bls", sourceId: "V4A5100", kcalPer100g: 173, names: { hu: "csirke felsőcomb", de: "Hähnchenoberschenkel", en: "chicken thigh" } });
    expect(planned.foods[0].synonyms?.hu).toContain("csirkefelsőcomb");
  });

  it("rejects an exact source ID whose publisher name does not match the reviewed identity", async () => {
    temporary = await mkdtemp(join(tmpdir(), "coverage-test-"));
    const file = join(temporary, "bls.xlsx");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("BLS");
    sheet.addRow(["BLS Code", "Lebensmittelbezeichnung", "ENERCC Energie [kcal/100g]", "PROT625 Protein [g/100g]", "FAT Fett [g/100g]", "CHO Kohlenhydrate [g/100g]"]);
    sheet.addRow(["V4A5100", "Rind Steak roh", 173, 18.2, 11, 0]);
    await workbook.xlsx.writeFile(file);
    const rows = [];
    for await (const row of new EverydayCoverageAdapter("bls", EVERYDAY_COVERAGE_V2.filter((item) => item.key === "chicken-thigh")).read(file)) rows.push(row);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sourceId: "V4A5100" });
    expect("error" in rows[0] && rows[0].error).toMatch(/source name does not match/);
  });

  it("binds red onion to the reviewed USDA Foundation identity", async () => {
    temporary = await mkdtemp(join(tmpdir(), "coverage-foundation-test-"));
    await writeFile(join(temporary, "foundation_food.csv"), "fdc_id\n790577\n");
    await writeFile(join(temporary, "food_category.csv"), "id,description\n11,Vegetables\n");
    await writeFile(join(temporary, "food.csv"), "fdc_id,description,food_category_id\n790577,Onions red raw,11\n790578,Onions yellow raw,11\n");
    await writeFile(join(temporary, "food_nutrient.csv"), "fdc_id,nutrient_id,amount\n790577,1008,44\n790577,1003,0.94\n790577,1004,0.1\n790577,1005,9.93\n790577,1079,1.7\n");
    const rows = [];
    for await (const row of new EverydayCoverageAdapter("usda_foundation", EVERYDAY_COVERAGE_V2.filter((item) => item.key === "red-onion")).read(temporary)) rows.push(row);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ food: { source: "usda_fdc", sourceId: "790577", names: { hu: "lilahagyma", de: "Rote Zwiebel", en: "red onion" } } });
  });
});
