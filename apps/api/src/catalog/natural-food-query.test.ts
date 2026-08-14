import { describe, expect, it } from "vitest";
import { parseNaturalFoodQuery } from "./natural-food-query.js";

describe("natural food query parser", () => {
  it("parses Hungarian pieces", () => expect(parseNaturalFoodQuery("2 db tojás")).toEqual({ quantity: 2, unit: "piece", foodQuery: "tojas" }));
  it("parses exact mass", () => expect(parseNaturalFoodQuery("250 g csirkemell")).toEqual({ quantity: 250, unit: "g", foodQuery: "csirkemell" }));
  it("keeps unknown units unresolved", () => expect(parseNaturalFoodQuery("12 cm uborka")).toEqual({ foodQuery: "12 cm uborka" }));
});
