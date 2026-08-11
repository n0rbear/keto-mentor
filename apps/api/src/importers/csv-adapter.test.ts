import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PublicFoodCsvAdapter } from "./csv-adapter.js";

describe("public food CSV adapter", () => {
  it("reads the documented fixture including micronutrients", async () => {
    const adapter = new PublicFoodCsvAdapter("open_database", "USDA FoodData Central", "https://fdc.nal.usda.gov/");
    const rows = [];
    for await (const food of adapter.read(resolve("fixtures/catalog-sample.csv"))) rows.push(food);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sourceId: "usda-171705", names: { hu: "Avokádó", de: "Avocado", en: "Avocado" }, kcalPer100g: 160 });
    expect(rows[0].nutrients.map((nutrient) => nutrient.key)).toEqual(["sodium", "potassium", "iron"]);
  });
});
