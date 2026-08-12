import { createReadStream } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse";
import type { ImportFood, ImportNutrient, ImportRow } from "./types.js";
import { mapNutrient, USDA_NUTRIENT_MAP } from "./nutrient-mapping.js";
import { balancedPilot } from "./pilot.js";

type Row = Record<string, string>;
async function rows(path: string): Promise<Row[]> {
  const result: Row[] = [];
  for await (const row of createReadStream(path).pipe(parse({ columns: true, bom: true, skip_empty_lines: true, trim: true }))) result.push(row as Row);
  return result;
}

export class UsdaFoodDataCentralAdapter {
  readonly diagnostics: string[] = [];
  readonly source = "usda_fdc" as const;
  readonly sourceName = "USDA FoodData Central";
  constructor(
    readonly dataType: "foundation" | "sr_legacy",
    readonly version: string,
    private readonly pilotLimit?: number,
    private readonly selectedSourceIds?: ReadonlySet<string>
  ) {}

  async *read(directory: string): AsyncIterable<ImportRow> {
    const membershipFile = this.dataType === "foundation" ? "foundation_food.csv" : "sr_legacy_food.csv";
    const membership = new Set((await rows(join(directory, membershipFile))).map((row) => row.fdc_id));
    const categories = new Map((await rows(join(directory, "food_category.csv"))).map((row) => [row.id, row.description]));
    const eligibleFoods = (await rows(join(directory, "food.csv"))).filter((row) =>
      membership.has(row.fdc_id) && (!this.selectedSourceIds || this.selectedSourceIds.has(row.fdc_id))
    );
    const foods = balancedPilot(eligibleFoods, (row) => row.food_category_id, this.pilotLimit);
    const selected = new Set(foods.map((row) => row.fdc_id));
    const nutrientLists = new Map<string, ImportNutrient[]>();
    for (const row of await rows(join(directory, "food_nutrient.csv"))) {
      if (!selected.has(row.fdc_id)) continue;
      const nutrient = mapNutrient(USDA_NUTRIENT_MAP, row.nutrient_id, row.amount);
      if (!nutrient) { if (this.diagnostics.length < 100) this.diagnostics.push(`unknown USDA nutrient id skipped: ${row.nutrient_id}`); continue; }
      if (!(nutrientLists.get(row.fdc_id) ?? []).some((item) => item.key === nutrient.key)) nutrientLists.set(row.fdc_id, [...(nutrientLists.get(row.fdc_id) ?? []), nutrient]);
    }
    let rowNumber = 1;
    for (const row of foods) {
      rowNumber++;
      const nutrients = nutrientLists.get(row.fdc_id) ?? [];
      const amount = (key: string) => nutrients.find((item) => item.key === key)?.amountPer100g;
      const required = [amount("energy_kcal"), amount("protein"), amount("total_fat"), amount("carbohydrate")];
      if (!row.fdc_id || !row.description || required.some((value) => value === undefined)) { yield { row: rowNumber, sourceId: row.fdc_id, error: "missing identity, name, or required macro" }; continue; }
      const food: ImportFood = {
        source: this.source, sourceId: row.fdc_id, originalName: row.description, name: row.description, names: { en: row.description },
        category: categories.get(row.food_category_id) ?? row.food_category_id, kcalPer100g: required[0]!, proteinPer100g: required[1]!, fatPer100g: required[2]!, carbsPer100g: required[3]!, fiberPer100g: amount("fiber") ?? 0,
        provenance: { source: this.sourceName, dataset: this.dataType, version: this.version, fdcId: row.fdc_id, sourceUrl: "https://fdc.nal.usda.gov/", license: "CC0-1.0", valuesPer: "100 g edible portion" }, nutrients
      };
      yield { food, row: rowNumber };
    }
  }
}
