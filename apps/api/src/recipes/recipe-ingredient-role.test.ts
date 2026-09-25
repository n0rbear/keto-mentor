import { describe, expect, it } from "vitest";
import { classifyIngredientRole, recoverIngredientRolesFromHtml } from "./recipe-ingredient-role.js";

describe("recipe ingredient roles", () => {
  it.each(["tejföl a tálaláshoz", "sour cream, to serve", "Schmand zum Servieren"])("an ingredient line that says it is for serving (%s) is a serving accompaniment even under a plain heading", (line) => {
    expect(classifyIngredientRole("Hozzávalók", line)).toMatchObject({ role: "serving_accompaniment", includedInBaseNutrition: false, evidence: "ingredient_wording" });
    expect(classifyIngredientRole(undefined, line)).toMatchObject({ role: "serving_accompaniment", includedInBaseNutrition: false });
  });
  it("a core ingredient line without serving wording stays core", () => {
    expect(classifyIngredientRole("Hozzávalók", "200 g tejföl")).toMatchObject({ role: "core", includedInBaseNutrition: true });
  });
  it.each(["A tálaláshoz", "For serving", "Zum Servieren"])("classifies %s as a visible base-recipe exclusion", (heading) => {
    expect(classifyIngredientRole(heading, "fresh bread")).toMatchObject({ role: "serving_accompaniment", includedInBaseNutrition: false });
  });
  // Owner-beta checkpoint (2026-09-15), Phase 5: classification is driven
  // ENTIRELY by SOURCE STRUCTURE (the section heading), never by the
  // ingredient's own identity/food name — "bread"/"kenyér"/"parsley" never
  // appear anywhere in classifyIngredientRole's own logic. The exact same
  // food word must land differently purely based on where the recipe itself
  // places it.
  it("classifies literally 'friss kenyér' / 'Brot' as excluded ONLY under an actual serving-section heading — proving the heading text, not the food word, drives the outcome", () => {
    expect(classifyIngredientRole("A tálaláshoz", "friss kenyér")).toMatchObject({ role: "serving_accompaniment", includedInBaseNutrition: false });
    expect(classifyIngredientRole("Zum Servieren", "Brot")).toMatchObject({ role: "serving_accompaniment", includedInBaseNutrition: false });
  });
  it("a main-ingredient bread/kenyér — no serving-section heading at all — is NEVER automatically excluded merely because of what food it is", () => {
    expect(classifyIngredientRole(undefined, "500 g bread")).toMatchObject({ role: "core", includedInBaseNutrition: true });
    expect(classifyIngredientRole(undefined, "kenyér")).toMatchObject({ role: "core", includedInBaseNutrition: true });
    expect(classifyIngredientRole("Hozzávalók" /* "Ingredients" — an ordinary main-list heading, not a serving section */, "friss kenyér")).toMatchObject({ role: "core", includedInBaseNutrition: true });
  });
  it("a main-ingredient parsley/petrezselyem is NEVER automatically treated as garnish merely because of what food it is", () => {
    expect(classifyIngredientRole(undefined, "petrezselyem")).toMatchObject({ role: "core", includedInBaseNutrition: true });
    expect(classifyIngredientRole("Hozzávalók", "1 csokor petrezselyem")).toMatchObject({ role: "core", includedInBaseNutrition: true });
  });
  it("keeps known garnish in base nutrition and optional garnish separate", () => {
    expect(classifyIngredientRole("For garnish", "20 g parsley")).toMatchObject({ role: "garnish", optional: false, includedInBaseNutrition: true });
    expect(classifyIngredientRole("For garnish", "parsley optional")).toMatchObject({ role: "garnish", optional: true, includedInBaseNutrition: false });
  });
  it("recovers a visible source group lost by flat JSON-LD", () => {
    const html = `<h5>For the soup</h5><p>500 g potato</p><h5>A tálaláshoz</h5><p>fresh bread</p>`;
    expect(recoverIngredientRolesFromHtml(html, ["500 g potato", "fresh bread"])).toEqual([
      expect.objectContaining({ sourceGroup: "For the soup", role: "core", includedInBaseNutrition: true }),
      expect.objectContaining({ sourceGroup: "A tálaláshoz", role: "serving_accompaniment", includedInBaseNutrition: false })
    ]);
  });
  it("uses preparation wording to distinguish an included garnish inside a serving group", () => {
    const html = `<h5>A tálaláshoz</h5><p>1 csokor petrezselyem</p><p>friss kenyér</p>`;
    const roles = recoverIngredientRolesFromHtml(html, ["1 csokor petrezselyem", "friss kenyér"], ["Tálaláskor megszórjuk apróra vágott petrezselyemmel és friss kenyérrel kínáljuk."]);
    expect(roles[0]).toMatchObject({ role: "garnish", includedInBaseNutrition: true, evidence: "ingredient_wording" });
    expect(roles[1]).toMatchObject({ role: "serving_accompaniment", includedInBaseNutrition: false });
  });
  it("keeps source-line roles stable when a previous line expands into multiple foods", () => {
    const html = `<p>salt, pepper</p><p>1 tsp mustard</p><h5>For serving</h5><p>fresh bread</p>`;
    const source = ["salt, pepper", "1 tsp mustard", "fresh bread"];
    const evidence = recoverIngredientRolesFromHtml(html, source);
    const byLine = new Map(source.map((raw, index) => [raw, evidence[index]]));
    expect(["salt, pepper", "salt, pepper", "1 tsp mustard", "fresh bread"].map((raw) => byLine.get(raw)?.role)).toEqual(["core", "core", "core", "serving_accompaniment"]);
  });
});
