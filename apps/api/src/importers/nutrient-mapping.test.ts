import { describe, expect, it } from "vitest";
import { BLS_NUTRIENT_MAP, USDA_NUTRIENT_MAP, mapNutrient } from "./nutrient-mapping.js";

describe("normalized nutrient mapping", () => {
  it("maps USDA ids to shared keys and units", () => expect(mapNutrient(USDA_NUTRIENT_MAP, "1093", "12.5")).toMatchObject({ key: "sodium", unit: "mg", amountPer100g: 12.5 }));
  it("maps and converts BLS microgram values", () => expect(mapNutrient(BLS_NUTRIENT_MAP, "CU", 850)).toMatchObject({ key: "copper", unit: "mg", amountPer100g: .85 }));
  it("skips unknown nutrients", () => expect(mapNutrient(USDA_NUTRIENT_MAP, "999999", 4)).toBeUndefined());
  it("uses one normalized key across sources", () => expect([USDA_NUTRIENT_MAP["1162"].key, BLS_NUTRIENT_MAP.VITC.key]).toEqual(["vitamin_c", "vitamin_c"]));
});
