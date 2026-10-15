import { describe, expect, it } from "vitest";
import { normalizeSearch } from "../catalog/normalize.js";
import { rankDinnerSuggestions, type DinnerCandidate } from "./dinner-suggestions.js";
import { generatePlan } from "./meal-plan.js";

// Owner feedback 2026-10-16: "nem állandóan csülköt ... meg tükörtojást".
const c = (id: string, m: Partial<DinnerCandidate["perServing"]>, extra: Partial<DinnerCandidate> = {}): DinnerCandidate => ({
  recipeId: id, source: "reference", titles: { hu: id, de: id, en: id }, dishId: id, servingGrams: 300,
  perServing: { kcal: 550, protein: 30, netCarbs: 5, fat: 40, ...m }, haystack: normalizeSearch(id), lowCarbFriendly: true, style: id, protein: id, tags: [], ingredients: [], ...extra
});
const remaining = { kcal: 900, protein: 50, netCarbs: 15, fat: 70 };

describe("variety", () => {
  it("the richest dish does not win every time", () => {
    const candidates = [c("csülök", { kcal: 880, protein: 70 }), ...Array.from({ length: 12 }, (_, i) => c(`dish${i}`, { protein: 30 + i }))];
    let firstIsHock = 0;
    for (let i = 0; i < 200; i++) {
      const r = rankDinnerSuggestions({ candidates, remaining, avoid: [], eatenRecipeIds: new Set(), eatenTitles: new Set(), lang: "hu" });
      if (r.suggestions[0].recipeId === "csülök") firstIsHock += 1;
    }
    expect(firstIsHock).toBeLessThan(80);
  });

  it("pushes recently eaten and recently shown dishes back", () => {
    const candidates = [c("a", { protein: 40 }), c("b", { protein: 40 }), c("d", { protein: 40 })];
    const r = rankDinnerSuggestions({ candidates, remaining, avoid: [], eatenRecipeIds: new Set(), eatenTitles: new Set(), lang: "hu", random: () => 0, limit: 1, recentDishIds: new Set(["a"]), recentlySuggested: new Set(["b"]) });
    expect(r.suggestions.map((s) => s.recipeId)).toEqual(["d"]);
  });

  it("a week of breakfasts uses each option at most twice when four fit", () => {
    const breakfasts = ["tükörtojás", "omlett", "sonkás tojás", "virsli"].map((id) => c(id, { kcal: 420, protein: 25, netCarbs: 2 }, { tags: ["breakfast"], style: id }));
    const mains = Array.from({ length: 14 }, (_, i) => c(`main${i}`, { kcal: 620, protein: 40, netCarbs: 5 }, { style: `s${i % 7}`, protein: `p${i % 4}` }));
    const days = generatePlan({ candidates: [...breakfasts, ...mains], goals: { kcal: 1800, protein: 110, netCarbs: 25, fat: 130 }, avoid: [], startDate: "2026-10-19" });
    const counts = new Map<string, number>();
    for (const d of days) counts.set(d.meals[0].dishId, (counts.get(d.meals[0].dishId) ?? 0) + 1);
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(2);
  });
});
