import { describe, expect, it } from "vitest";
import { parseNaturalFoodQuery } from "./natural-food-query.js";

describe("natural food query parser", () => {
  it("parses Hungarian pieces", () => expect(parseNaturalFoodQuery("2 db tojás")).toEqual({ quantity: 2, unit: "piece", foodQuery: "tojas" }));
  it("parses exact mass", () => expect(parseNaturalFoodQuery("250 g csirkemell")).toEqual({ quantity: 250, unit: "g", foodQuery: "csirkemell" }));
  it("parses length without pretending it is a weight", () => expect(parseNaturalFoodQuery("15 cm kígyóuborka")).toEqual({ quantity: 15, unit: "cm", foodQuery: "kigyouborka" }));
  it("parses with ékezet nélkül input", () => expect(parseNaturalFoodQuery("12 cm kigyóuborka")).toEqual({ quantity: 12, unit: "cm", foodQuery: "kigyouborka" }));
  it.each([
    ["5 tojás", { quantity: 5, unit: "piece", foodQuery: "tojas" }],
    ["5 db tojás", { quantity: 5, unit: "piece", foodQuery: "tojas" }],
    ["3 szelet gouda", { quantity: 3, unit: "slice", foodQuery: "gouda" }],
    ["fél grillcsirke", { quantity: 1, unit: "half", foodQuery: "grillcsirke" }],
    ["egy nagy csirkecomb", { quantity: 1, unit: "piece", size: "large", foodQuery: "csirkecomb" }],
    ["egy marék dió", { quantity: 1, unit: "handful", foodQuery: "dio" }],
    ["egy kis darab sajt", { quantity: 1, unit: "piece", size: "small", foodQuery: "sajt" }],
    ["egy löttyintés tejszín a kávéba", { quantity: 1, unit: "splash", foodQuery: "tejszin" }],
    ["két harapás uborka", { quantity: 2, unit: "bite", foodQuery: "uborka" }],
    ["fél kígyóuborka", { quantity: 1, unit: "half", foodQuery: "kigyouborka" }],
    ["2 csirkecomb", { quantity: 2, unit: "piece", foodQuery: "csirkecomb" }],
  ])("parses %s", (text, expected) => expect(parseNaturalFoodQuery(text)).toEqual(expected));

  it("separates preparation from base food (tükörtojás -> tojás + fried)", () => expect(parseNaturalFoodQuery("3 tükörtojás")).toEqual({ quantity: 3, unit: "piece", foodQuery: "tojas", preparation: "fried" }));
  it("parses '5 tojásból rántotta' as tojás + scrambled", () => expect(parseNaturalFoodQuery("5 tojásból rántotta")).toEqual({ quantity: 5, unit: "piece", foodQuery: "tojas", preparation: "scrambled" }));
  it("parses 'tojásrántotta 5 tojásból' as tojás + scrambled", () => expect(parseNaturalFoodQuery("tojásrántotta 5 tojásból")).toEqual({ quantity: 5, unit: "piece", foodQuery: "tojas", preparation: "scrambled" }));
  it("parses 'főtt tojás' as tojás + boiled", () => expect(parseNaturalFoodQuery("2 főtt tojás")).toEqual({ quantity: 2, unit: "piece", foodQuery: "tojas", preparation: "boiled" }));
  it("parses '100 g bacon'", () => expect(parseNaturalFoodQuery("100 g bacon")).toEqual({ quantity: 100, unit: "g", foodQuery: "bacon" }));
  it("parses diacritic-free input", () => expect(parseNaturalFoodQuery("kigyouborka")).toEqual({ foodQuery: "kigyouborka" }));
  it("does not strip the Hungarian accusative suffix from German Spinat", () => expect(parseNaturalFoodQuery("Spinat")).toEqual({ foodQuery: "spinat" }));
  it("parses an unknown free-form food without inventing structure", () => expect(parseNaturalFoodQuery("valami különös étel")).toEqual({ foodQuery: "valami kulonos etel" }));
  it("parses Unicode recipe fractions without guessing a weight", () => expect(parseNaturalFoodQuery("½ onion, chopped")).toMatchObject({ quantity: 0.5, unit: "piece", foodQuery: expect.stringContaining("onion") }));
  it.each([
    ["fél avokádó", { quantity: 1, unit: "half", foodQuery: "avokado" }],
    ["halbe Avocado", { quantity: 1, unit: "half", foodQuery: "avocado" }],
    ["half avocado", { quantity: 1, unit: "half", foodQuery: "avocado" }],
    ["whole avocado", { quantity: 1, unit: "piece", foodQuery: "avocado" }],
    ["0.5 avocado", { quantity: 0.5, unit: "piece", foodQuery: "avocado" }],
    ["fél kg vaj", { quantity: 0.5, unit: "kg", foodQuery: "vaj" }]
  ])("keeps half semantics explicit for %s", (text, expected) => expect(parseNaturalFoodQuery(text)).toEqual(expected));

  it.each([
    ["3 Scheiben Gouda", "slice"], ["3 slices Gouda", "slice"],
    ["1 EL Butter", "tbsp"], ["1 Esslöffel Butter", "tbsp"], ["1 tablespoon butter", "tbsp"],
    ["1 TL Butter", "tsp"], ["1 Teelöffel Butter", "tsp"], ["1 teaspoon butter", "tsp"]
  ])("parses multilingual serving unit in %s", (text, unit) => expect(parseNaturalFoodQuery(text).unit).toBe(unit));
  it("splits multiple foods joined by 'és'", () => {
    const result = parseNaturalFoodQuery("2 csirkecomb és fél csirkemell");
    expect(result.items).toHaveLength(2);
    expect(result.items?.[0]).toEqual({ quantity: 2, unit: "piece", foodQuery: "csirkecomb" });
    expect(result.items?.[1]).toEqual({ quantity: 1, unit: "half", foodQuery: "csirkemell" });
  });
});
