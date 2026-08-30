import { describe, expect, it } from "vitest";
import { importFoods } from "./import-foods.js";
import type { FoodSourceAdapter, ImportFood, ImportRow } from "./types.js";

const food = (sourceId: string): ImportFood => ({ source: "usda_fdc", sourceId, originalName: `Food ${sourceId}`, name: `Food ${sourceId}`, names: { en: `Food ${sourceId}` }, kcalPer100g: 10, proteinPer100g: 1, fatPer100g: 2, carbsPer100g: 3, fiberPer100g: 0, provenance: { source: "test" }, nutrients: [{ key: "sodium", label: "Sodium", unit: "mg", group: "mineral", amountPer100g: 4 }] });
const adapter = (items: ImportRow[]): FoodSourceAdapter => ({ source: "usda_fdc", sourceName: "USDA", version: "test", async *read() { yield* items; } });
function mock(existing: string[] = []) {
  let writes = 0; let queries = 0;
  const tx = { food: { upsert: async ({ create }: any) => { writes++; return { id: create.sourceId }; } }, foodAlias: { upsert: async () => undefined }, nutrient: { upsert: async ({ create }: any) => ({ id: create.key }) }, foodNutrient: { upsert: async () => undefined } };
  const prisma: any = { nutrient: { findMany: async () => [] }, food: { findMany: async ({ where }: any) => { queries++; return where.sourceId.in.filter((id: string) => existing.includes(id)).map((sourceId: string) => ({ sourceId })); } }, $transaction: async (fn: any) => fn(tx) };
  return { prisma, writes: () => writes, queries: () => queries };
}

describe("catalog import runner", () => {
  it("dry-run reports without writes and batches lookups", async () => { const db = mock(["2"]); const report = await importFoods(db.prisma, adapter([{ food: food("1"), row: 1 }, { food: food("2"), row: 2 }]), "x", { dryRun: true, batchSize: 1 }); expect(db.writes()).toBe(0); expect(db.queries()).toBe(2); expect(report).toMatchObject({ foodsToCreate: 1, foodsToUpdate: 1, foodNutrientsExpected: 2 }); });
  it("deduplicates source/sourceId and skips malformed rows", async () => { const db = mock(); const report = await importFoods(db.prisma, adapter([{ food: food("1"), row: 1 }, { food: food("1"), row: 2 }, { error: "bad row", row: 3 }]), "x", { dryRun: true }); expect(report).toMatchObject({ validRecords: 1, duplicateRecords: 1, skippedRecords: 1 }); expect(report.parsingErrors[0].error).toBe("bad row"); });
  it("writes valid rows in restart-safe per-food transactions", async () => { const db = mock(); await importFoods(db.prisma, adapter([{ food: food("1"), row: 1 }, { food: food("2"), row: 2 }]), "x", { batchSize: 2 }); expect(db.writes()).toBe(2); });
});
