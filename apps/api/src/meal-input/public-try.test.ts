import { describe, expect, it } from "vitest";
import { tryFromInterpretation } from "./public-try.js";

const food = (id: string, name: string, hu: string, kcal: number, carbs: number, fiber = 0) => ({ id, name, names: { hu }, kcalPer100g: kcal, fatPer100g: 10, proteinPer100g: 12, carbsPer100g: carbs, fiberPer100g: fiber, source: "bls", sourceId: id });

describe("regisztráció nélküli kipróbálás", () => {
  it("returns amounts and nutrition per item and in total, in the visitor's language", () => {
    const r = tryFromInterpretation({
      input: "2 tojás és 100 g spenót",
      items: [
        { parsed: { foodQuery: "tojas", quantity: 2, unit: "piece" }, foodResolution: "resolved", selectedFood: food("egg", "Egg", "Tojás", 143, 0.7), candidates: [], quantity: { status: "resolved", grams: 100, estimated: false } },
        { parsed: { foodQuery: "spenot", quantity: 100, unit: "g" }, foodResolution: "resolved", selectedFood: food("sp", "Spinach", "Spenót", 23, 3.6, 2.2), candidates: [], quantity: { status: "resolved", grams: 100, estimated: false } },
        { parsed: { foodQuery: "valami ismeretlen" }, foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null }
      ]
    } as any, "hu");
    expect(r.items.map((i) => [i.name, i.grams, i.status])).toEqual([["Tojás", 100, "ok"], ["Spenót", 100, "ok"], ["valami ismeretlen", null, "unclear"]]);
    expect(r.items[1].macros?.netCarbs).toBe(1.4);
    expect(r.totals.kcal).toBe(166);
  });

  it("assumes 100 g when the amount is missing and says so", () => {
    const r = tryFromInterpretation({ input: "avokádó", parsed: { foodQuery: "avokado" }, foodResolution: "resolved", selectedFood: food("av", "Avocado", "Avokádó", 160, 8.5, 6.7), candidates: [], quantity: { status: "unresolved", reason: "quantity_missing" } } as any, "hu");
    expect(r.items[0]).toMatchObject({ name: "Avokádó", grams: 100, status: "assumed_100g" });
  });
});
