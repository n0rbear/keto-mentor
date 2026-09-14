import { describe, expect, it } from "vitest";
import { classifyIngredientRole, recoverIngredientRolesFromHtml } from "./recipe-ingredient-role.js";

describe("recipe ingredient roles", () => {
  it.each(["A tálaláshoz", "For serving", "Zum Servieren"])("classifies %s as a visible base-recipe exclusion", (heading) => {
    expect(classifyIngredientRole(heading, "fresh bread")).toMatchObject({ role: "serving_accompaniment", includedInBaseNutrition: false });
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
});
