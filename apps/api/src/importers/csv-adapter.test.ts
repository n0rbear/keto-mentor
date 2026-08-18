import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PublicFoodCsvAdapter } from "./csv-adapter.js";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("public food CSV adapter", () => {
  it("reads the documented fixture including micronutrients", async () => {
    const adapter = new PublicFoodCsvAdapter("open_database", "USDA FoodData Central", "https://fdc.nal.usda.gov/");
    const rows = [];
    for await (const row of adapter.read(join(fixturesDir, "catalog-sample.csv"))) if ("food" in row) rows.push(row.food);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sourceId: "usda-171705", names: { hu: "Avokádó", de: "Avocado", en: "Avocado" }, kcalPer100g: 160 });
    expect(rows[0].nutrients.map((nutrient) => nutrient.key)).toEqual(["sodium", "potassium", "iron"]);
  });
});
