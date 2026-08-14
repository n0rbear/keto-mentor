import { describe, expect, it } from "vitest";
import { convertFoodQuantity, type FoodServingValue } from "./food-quantity.js";

const exact: FoodServingValue = { id: "egg", key: "piece:medium", unit: "piece", grams: 46, isEstimated: false, confidence: 1, provenance: { source: "USDA" } };
const estimate: FoodServingValue = { id: "slice", key: "slice", unit: "slice", grams: 28, isEstimated: true, confidence: .7, provenance: { method: "curated" } };

describe("food quantity conversion", () => {
  it("converts grams and kilograms exactly", () => { expect(convertFoodQuantity({ quantity: 50, unit: "g" }, []).grams).toBe(50); expect(convertFoodQuantity({ quantity: 1.2, unit: "kg" }, []).grams).toBe(1200); });
  it("uses a Food-specific serving", () => expect(convertFoodQuantity({ quantity: 2, unit: "serving", servingId: "egg" }, [exact]).grams).toBe(92));
  it("preserves estimate and correction for privacy-safe learning", () => expect(convertFoodQuantity({ quantity: 2, unit: "serving", servingId: "slice", gramsOverride: 30 }, [estimate]).snapshot).toMatchObject({ gramsPerUnit: 30, proposedGramsPerUnit: 28, method: "user_corrected", estimated: true, userCorrected: true }));
  it("never falls back to an invented 100 grams", () => expect(() => convertFoodQuantity({ quantity: 1, unit: "serving", servingId: "missing" }, [])).toThrow("serving_not_found"));
  it("protects exact sourced conversions from overrides", () => expect(() => convertFoodQuantity({ quantity: 1, unit: "serving", servingId: "egg", gramsOverride: 50 }, [exact])).toThrow("exact_serving_cannot_be_overridden"));
});
