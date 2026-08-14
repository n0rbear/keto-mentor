import { describe, expect, it } from "vitest";
import { parseNaturalFoodQuery } from "./natural-food-query.js";

describe("natural food query parser", () => {
  it("parses Hungarian pieces", () => expect(parseNaturalFoodQuery("2 db tojás")).toEqual({ quantity: 2, unit: "piece", foodQuery: "tojas" }));
  it("parses exact mass", () => expect(parseNaturalFoodQuery("250 g csirkemell")).toEqual({ quantity: 250, unit: "g", foodQuery: "csirkemell" }));
  it("parses length without pretending it is a weight", () => expect(parseNaturalFoodQuery("15 cm kígyóuborka")).toEqual({ quantity: 15, unit: "cm", foodQuery: "kigyouborka" }));
  it.each([
    ["5 tojás", { quantity: 5, unit: "piece", foodQuery: "tojas" }],
    ["3 szelet gouda", { quantity: 3, unit: "slice", foodQuery: "gouda" }],
    ["fél grillcsirke", { quantity: 0.5, unit: "piece", foodQuery: "grillcsirke" }],
    ["egy nagy csirkecomb", { quantity: 1, unit: "piece", size: "large", foodQuery: "csirkecomb" }],
    ["egy marék dió", { quantity: 1, unit: "handful", foodQuery: "dio" }],
    ["egy kis darab sajt", { quantity: 1, unit: "piece", size: "small", foodQuery: "sajt" }],
    ["egy löttyintés tejszín a kávéba", { quantity: 1, unit: "splash", foodQuery: "tejszin" }],
    ["két harapás uborka", { quantity: 2, unit: "bite", foodQuery: "uborka" }]
  ])("parses %s", (text, expected) => expect(parseNaturalFoodQuery(text)).toEqual(expected));
});
