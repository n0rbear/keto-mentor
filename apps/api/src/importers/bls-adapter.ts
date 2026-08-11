import ExcelJS from "exceljs";
import type { ImportFood, ImportRow } from "./types.js";
import { BLS_NUTRIENT_MAP, mapNutrient } from "./nutrient-mapping.js";
import { balancedPilot } from "./pilot.js";

type BlsRow = { row: number; values: Record<string, unknown> };
const CATEGORIES: Record<string, string> = { B: "Bread and baked goods", C: "Cereals", E: "Eggs", F: "Fruit", G: "Vegetables", H: "Legumes", K: "Potatoes", M: "Dairy", N: "Nuts and seeds", Q: "Fish", R: "Meat", S: "Poultry", U: "Oils and fats" };

export class BlsAdapter {
  readonly source = "bls" as const;
  readonly sourceName = "Bundeslebensmittelschlüssel";
  constructor(readonly version = "4.0 (2025)", private readonly pilotLimit?: number) {}

  async *read(filePath: string): AsyncIterable<ImportRow> {
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(String);
    const raw: BlsRow[] = [];
    sheet.eachRow((row, rowNumber) => { if (rowNumber === 1) return; const values: Record<string, unknown> = {}; headers.forEach((header, index) => { const code = header.split(" ")[0]; if (!header.includes("Datenherkunft") && !header.includes("Referenz")) values[code] = row.getCell(index + 1).value; }); raw.push({ row: rowNumber, values }); });
    const selected = balancedPilot(raw, ({ values }) => String(values["BLS"] ?? "").slice(0, 1), this.pilotLimit);
    for (const item of selected) {
      const code = String(item.values["BLS"] ?? "");
      const originalName = String(item.values["Lebensmittelbezeichnung"] ?? "");
      const nutrients = Object.entries(item.values).map(([key, value]) => mapNutrient(BLS_NUTRIENT_MAP, key, value)).filter((value): value is NonNullable<typeof value> => Boolean(value));
      const amount = (key: string) => nutrients.find((nutrient) => nutrient.key === key)?.amountPer100g;
      const required = [amount("energy_kcal"), amount("protein"), amount("total_fat"), amount("carbohydrate")];
      if (!code || !originalName || required.some((value) => value === undefined)) { yield { row: item.row, sourceId: code, error: "missing identity, name, or required macro" }; continue; }
      const food: ImportFood = { source: this.source, sourceId: code, originalName, name: originalName, names: { de: originalName }, category: CATEGORIES[code[0]] ?? `BLS group ${code[0]}`,
        kcalPer100g: required[0]!, proteinPer100g: required[1]!, fatPer100g: required[2]!, carbsPer100g: required[3]!, fiberPer100g: amount("fiber") ?? 0,
        provenance: { source: this.sourceName, version: this.version, sourceUrl: "https://blsdb.de/download", license: "CC-BY-4.0", attribution: "Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 - Deutsche Nährstoffdatenbank.", valuesPer: "100 g" }, nutrients };
      yield { food, row: item.row };
    }
  }
}
