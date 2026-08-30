import { buildSearchText } from "../catalog/normalize.js";
import { aliasesForImportedFood } from "./import-foods.js";
import type { FoodSourceAdapter, ImportFood, ImportReport } from "./types.js";

export type CatalogReadOnlySnapshot = {
  capturedAt: string;
  schema: string;
  identities: string[];
  nutrientKeys: string[];
  foodCount?: number;
  foodNutrientCount?: number;
  totalBytes?: number;
};

export async function planImportFromSnapshot(
  adapter: FoodSourceAdapter,
  filePath: string,
  snapshot: CatalogReadOnlySnapshot,
  knownNutrients = new Set(snapshot.nutrientKeys)
): Promise<{ report: ImportReport; foods: ImportFood[] }> {
  const report: ImportReport = {
    source: adapter.sourceName,
    version: adapter.version,
    dryRun: true,
    inputRecords: 0,
    validRecords: 0,
    skippedRecords: 0,
    duplicateRecords: 0,
    foodsToCreate: 0,
    foodsToUpdate: 0,
    nutrientsToCreate: 0,
    foodNutrientsExpected: 0,
    estimatedGrowthBytes: 0,
    parsingErrors: [],
    warnings: [],
    processed: 0
  };
  const identities = new Set(snapshot.identities);
  const seen = new Set<string>();
  const foods: ImportFood[] = [];
  for await (const row of adapter.read(filePath)) {
    report.inputRecords++;
    if ("error" in row) {
      report.skippedRecords++;
      if (report.parsingErrors.length < 100) report.parsingErrors.push({ row: row.row, sourceId: row.sourceId, error: row.error });
      continue;
    }
    const identity = `${row.food.source}:${row.food.sourceId}`;
    if (seen.has(identity)) { report.duplicateRecords++; continue; }
    seen.add(identity);
    foods.push(row.food);
    report.validRecords++;
    report.processed++;
    if (identities.has(identity)) report.foodsToUpdate++; else report.foodsToCreate++;
    report.foodNutrientsExpected += row.food.nutrients.length;
    for (const nutrient of row.food.nutrients) {
      if (!knownNutrients.has(nutrient.key)) { knownNutrients.add(nutrient.key); report.nutrientsToCreate++; }
    }
    report.estimatedGrowthBytes += 900 + row.food.nutrients.length * 96 + buildSearchText(row.food).length + aliasesForImportedFood(row.food).length * 180;
  }
  report.warnings = [...new Set(adapter.diagnostics ?? [])].slice(0, 100);
  return { report, foods };
}
