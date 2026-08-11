import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import type { FoodSourceAdapter, ImportFood, ImportNutrient } from "./types.js";

export class PublicFoodCsvAdapter implements FoodSourceAdapter {
  readonly source = "open_database" as const;
  readonly version = "fixture-v1";
  readonly sourceName: string;
  constructor(_source: "open_database", sourceName: string, private readonly sourceUrl: string) {
    this.sourceName = sourceName;
  }

  async *read(filePath: string) {
    const parser = createReadStream(filePath).pipe(parse({ columns: true, bom: true, skip_empty_lines: true, trim: true }));
    let rowNumber = 1;
    for await (const row of parser) {
      rowNumber++;
      const nutrients: ImportNutrient[] = Object.entries(row as Record<string, string>)
        .filter(([key, value]) => key.startsWith("nutrient_") && value !== "")
        .map(([key, value]) => {
          const [, nutrientKey, unit = "mg", group = "micronutrient"] = key.split("_");
          return { key: nutrientKey, label: nutrientKey, unit, group, amountPer100g: Number(value) };
        });
      const names = { hu: row.nameHu, de: row.nameDe, en: row.nameEn };
      const food: ImportFood = {
        source: this.source,
        sourceId: row.sourceId,
        originalName: row.originalName,
        name: row.nameEn || row.originalName,
        names: Object.fromEntries(Object.entries(names).filter(([, value]) => value)),
        synonyms: row.synonyms ? JSON.parse(row.synonyms) : {},
        category: row.category || undefined,
        brand: row.brand || undefined,
        servingUnit: row.servingUnit || undefined,
        servingGrams: row.servingGrams ? Number(row.servingGrams) : undefined,
        kcalPer100g: Number(row.kcal), proteinPer100g: Number(row.protein), fatPer100g: Number(row.fat), carbsPer100g: Number(row.carbs), fiberPer100g: Number(row.fiber || 0),
        provenance: { sourceName: this.sourceName, sourceUrl: this.sourceUrl, importedFrom: filePath, valuesPer: "100 g edible portion" },
        nutrients
      };
      yield { food, row: rowNumber };
    }
  }
}
