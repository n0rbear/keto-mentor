import { describe, expect, it } from "vitest";
import { mergeEggDishItems, normalizeEggDishPhrases } from "./egg-dishes.js";
import { parseNaturalFoodQuery } from "../catalog/natural-food-query.js";

// Owner feedback 2026-10-20: eggs and the egg dish made of them are one item.
describe("egg dishes with an egg count", () => {
  it.each([
    ["3 tojásos rántotta", "3 tojás rántotta"],
    ["rántotta 3 tojásból és 2 szelet sonka", "3 tojás rántotta és 2 szelet sonka"],
    ["6 tojás rántottának, 2 szelet jagdwurst", "6 tojás rántotta, 2 szelet jagdwurst"],
    ["két tojásos omlett", "két tojás omlett"],
    ["tükörtojás 2 tojásból", "2 tojás tükörtojás"],
    ["Rührei aus 3 Eiern", "3 Eier Rührei"],
    ["3-Eier-Omelett", "3 Eier Omelett"],
    ["omelette with 3 eggs", "3 eggs omelette"],
    ["3-egg omelette", "3 eggs omelette"],
    ["rántotta", "rántotta"],
    ["sonkás-sajtos omlett", "sonkás-sajtos omlett"]
  ])("%s -> %s", (input, expected) => expect(normalizeEggDishPhrases(input)).toBe(expected));

  it.each([
    ["3 tojás rántotta", "tojas", "scrambled"],
    ["2 tojás omlett", "tojas", "scrambled"],
    ["2 tojás tükörtojás", "tojas", "fried"],
    ["3 Eier Rührei", "eier", "scrambled"],
    ["3 eggs omelette", "eggs", "scrambled"]
  ])("parses %s as eggs, prepared", (input, foodQuery, preparation) => {
    expect(parseNaturalFoodQuery(input)).toMatchObject({ foodQuery, quantity: expect.any(Number), unit: "piece", preparation });
  });

  it("leaves a dish without eggs alone", () => {
    expect(parseNaturalFoodQuery("sonkás-sajtos omlett").preparation).toBeUndefined();
  });

  it("merges an AI 'rántotta' item into the eggs", () => {
    const merged = mergeEggDishItems({ language: "hu", kind: "compound_dish", dishName: "rántotta", clarificationNeeded: false, confidence: 0.9, items: [
      { originalText: "rántotta", canonicalName: "rántotta", evidence: "explicit", confidence: 0.9 },
      { originalText: "3 tojásból", canonicalName: "tojás", quantity: 3, unit: "piece", evidence: "explicit", confidence: 0.9 },
      { originalText: "2 szelet sonka", canonicalName: "sonka", quantity: 2, unit: "slice", evidence: "explicit", confidence: 0.9 }
    ] } as any);
    expect(merged.items.map((i) => [i.canonicalName, i.preparation])).toEqual([["tojás", "scrambled"], ["sonka", undefined]]);
    expect(merged.dishName).toBeUndefined();
    expect(merged.kind).toBe("multiple_foods");
  });

  it("does not touch eggs that come with another dish", () => {
    const lecso = { language: "hu", kind: "compound_dish", dishName: "lecsó", clarificationNeeded: false, confidence: 0.9, items: [
      { originalText: "lecsó", canonicalName: "lecsó", evidence: "explicit", confidence: 0.9 },
      { originalText: "3 tojással", canonicalName: "tojás", quantity: 3, unit: "piece", evidence: "explicit", confidence: 0.9 }
    ] } as any;
    expect(mergeEggDishItems(lecso)).toBe(lecso);
  });
});
