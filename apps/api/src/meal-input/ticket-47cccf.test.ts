import { describe, expect, it } from "vitest";
import { weightedTokenCoverage } from "../catalog/food-search.js";
import { genericUnitWeight } from "./generic-unit-weights.js";
import { resolveQuantityLocally } from "./interpret.js";

// Owner ticket 47cccf (2026-10-17): "1 adag csirkeszárny pörkölt, 10 cm
// kígyóuborka, 2 db főtt tojás".
describe("47cccf: főtt tojás, 10 cm kígyóuborka", () => {
  it("a preparation word weighs less than the food's own word, so the egg outranks 'marhaháj, főtt'", () => {
    const egg = weightedTokenCoverage("fott tojas", "egg tojas");
    const beefFat = weightedTokenCoverage("fott tojas", "beef retail cuts separable fat cooked marhahaj fott");
    expect(egg).toBeGreaterThan(beefFat);
    expect(egg).toBeCloseTo(1 / 1.3, 3);
    expect(weightedTokenCoverage("csirkemell", "csirkemell sult")).toBe(1);
  });

  it("knows a typical weight per centimetre for cucumber, and uses it for '10 cm'", () => {
    const cucumber = { id: "c", name: "Cucumber", names: { hu: "kígyóuborka" }, servings: [] } as any;
    expect(genericUnitWeight("cm", cucumber)).toMatchObject({ key: "cucumber_cm", grams: 11 });
    expect(resolveQuantityLocally({ foodQuery: "kígyóuborka", quantity: 10, unit: "cm" }, cucumber)).toMatchObject({ status: "resolved", grams: 110, estimated: true });
    expect(genericUnitWeight("cm", { name: "Tojás" } as any)).toBeNull();
  });
});
