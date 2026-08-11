import type { PrismaClient } from "@prisma/client";
import { buildSearchText } from "../catalog/normalize.js";
import type { FoodSourceAdapter, ImportFood, ImportOptions, ImportReport } from "./types.js";

export async function upsertImportedFood(prisma: PrismaClient, food: ImportFood) {
  const searchText = buildSearchText(food);
  const { nutrients, ...foodData } = food;
  return prisma.$transaction(async (tx) => {
    const saved = await tx.food.upsert({
      where: { source_sourceId: { source: food.source, sourceId: food.sourceId } },
      create: { ...foodData, searchText, createdById: null }, update: { ...foodData, searchText, createdById: null }
    });
    for (const nutrient of nutrients) {
      const { amountPer100g, ...definitionData } = nutrient;
      const definition = await tx.nutrient.upsert({ where: { key: nutrient.key }, create: definitionData, update: definitionData });
      await tx.foodNutrient.upsert({
        where: { foodId_nutrientId: { foodId: saved.id, nutrientId: definition.id } },
        create: { foodId: saved.id, nutrientId: definition.id, amountPer100g }, update: { amountPer100g }
      });
    }
    return saved;
  });
}

export async function importFoods(prisma: PrismaClient, adapter: FoodSourceAdapter, filePath: string, options: ImportOptions = {}): Promise<ImportReport> {
  const dryRun = options.dryRun ?? false;
  const batchSize = Math.max(1, options.batchSize ?? 100);
  const report: ImportReport = { source: adapter.sourceName, version: adapter.version, dryRun, inputRecords: 0, validRecords: 0, skippedRecords: 0, duplicateRecords: 0, foodsToCreate: 0, foodsToUpdate: 0, nutrientsToCreate: 0, foodNutrientsExpected: 0, estimatedGrowthBytes: 0, parsingErrors: [], warnings: [], processed: 0 };
  const seen = new Set<string>();
  const knownNutrients = new Set((await prisma.nutrient.findMany({ select: { key: true } })).map((item) => item.key));
  let batch: ImportFood[] = [];
  const flush = async () => {
    if (!batch.length) return;
    const ids = batch.map((food) => food.sourceId);
    const existing = new Set((await prisma.food.findMany({ where: { source: adapter.source, sourceId: { in: ids } }, select: { sourceId: true } })).map((item) => item.sourceId));
    for (const food of batch) {
      if (existing.has(food.sourceId)) report.foodsToUpdate++; else report.foodsToCreate++;
      report.foodNutrientsExpected += food.nutrients.length;
      for (const nutrient of food.nutrients) if (!knownNutrients.has(nutrient.key)) { knownNutrients.add(nutrient.key); report.nutrientsToCreate++; }
      if (!dryRun) await upsertImportedFood(prisma, food);
      report.processed++;
    }
    // Conservative planning estimate: food row/search/provenance + nutrient links + indexes.
    report.estimatedGrowthBytes += batch.reduce((sum, food) => sum + 900 + food.nutrients.length * 96 + buildSearchText(food).length, 0);
    batch = [];
    options.onProgress?.({ ...report, parsingErrors: [...report.parsingErrors] });
  };
  for await (const row of adapter.read(filePath)) {
    report.inputRecords++;
    if ("error" in row) { report.skippedRecords++; if (report.parsingErrors.length < 100) report.parsingErrors.push({ row: row.row, sourceId: row.sourceId, error: row.error }); continue; }
    if (options.maxRecords && report.validRecords >= options.maxRecords) break;
    const identity = `${row.food.source}:${row.food.sourceId}`;
    if (seen.has(identity)) { report.duplicateRecords++; continue; }
    seen.add(identity); report.validRecords++; batch.push(row.food);
    if (batch.length >= batchSize) await flush();
  }
  await flush();
  report.warnings = [...new Set(adapter.diagnostics ?? [])].slice(0, 100);
  return report;
}
