import { describe, expect, it } from "vitest";
import { hasPremiumFeature, rankDinnerSuggestions, type DinnerCandidate } from "./dinner-suggestions.js";
import { normalizeSearch } from "../catalog/normalize.js";

const dish = (id: string, m: Partial<DinnerCandidate["perServing"]>, extra: Partial<DinnerCandidate> = {}): DinnerCandidate => ({
  recipeId: id, source: "reference", titles: { hu: id, de: id, en: id }, dishId: id, servingGrams: 300,
  perServing: { kcal: 500, protein: 30, netCarbs: 5, fat: 35, ...m }, haystack: normalizeSearch(id), lowCarbFriendly: false, ...extra
});
const remaining = { kcal: 700, protein: 40, netCarbs: 10, fat: 50 };
const base = { remaining, avoid: [], eatenRecipeIds: new Set<string>(), eatenTitles: new Set<string>(), lang: "hu" as const };

describe("vacsoraajánló ranking", () => {
  it("keeps only dishes that fit the remaining net carbs and calories at one serving", () => {
    const result = rankDinnerSuggestions({ ...base, candidates: [dish("fits", {}), dish("too carby", { netCarbs: 12 }), dish("too big", { kcal: 900 })] });
    expect(result.status).toBe("ok");
    expect(result.suggestions.map((s) => s.recipeId)).toEqual(["fits"]);
    expect(result.suggestions[0].after).toEqual({ kcal: 200, protein: 10, netCarbs: 5, fat: 15 });
  });

  it("prefers the dish that fills the missing protein", () => {
    const result = rankDinnerSuggestions({ ...base, candidates: [dish("lean", { protein: 8 }), dish("protein", { protein: 40 })] });
    expect(result.suggestions[0].recipeId).toBe("protein");
  });

  it("leaves out avoided foods and allergen groups by ingredient", () => {
    const cheesy = dish("rántott sajt", {}, { haystack: normalizeSearch("rántott sajt trappista sajt tojás zsemlemorzsa") });
    const fish = dish("lazac", {}, { haystack: normalizeSearch("lazac vaj citrom") });
    const steak = dish("steak", {}, { haystack: normalizeSearch("marhabélszín olaj só") });
    const result = rankDinnerSuggestions({ ...base, avoid: ["laktóz", "Hal"], candidates: [cheesy, fish, steak] });
    expect(result.suggestions.map((s) => s.recipeId)).toEqual(["steak"]);
  });

  it("never repeats what was eaten that day, by recipe or by name, and offers one variant per dish", () => {
    const result = rankDinnerSuggestions({
      ...base,
      eatenRecipeIds: new Set(["a"]), eatenTitles: new Set([normalizeSearch("Pörkölt")]),
      candidates: [dish("a", {}), dish("Pörkölt", {}), dish("v1", {}, { dishId: "rantott" }), dish("v2", { protein: 10 }, { dishId: "rantott" })]
    });
    expect(result.suggestions.map((s) => s.recipeId)).toEqual(["v1"]);
  });

  it("says so when the carb or calorie budget is already used", () => {
    expect(rankDinnerSuggestions({ ...base, remaining: { ...remaining, netCarbs: 0 }, candidates: [dish("x", {})] }).status).toBe("carb_budget_used");
    expect(rankDinnerSuggestions({ ...base, remaining: { ...remaining, kcal: -5 }, candidates: [dish("x", {})] }).status).toBe("kcal_budget_used");
    expect(rankDinnerSuggestions({ ...base, candidates: [dish("x", { netCarbs: 20 })] }).status).toBe("nothing_fits");
  });
});

describe("premium access while in beta", () => {
  const free = [{ plan: "free", features: ["meal_tracking"], active: true, expiresAt: null }];
  it("is open to everyone in beta, entitlement-only otherwise", () => {
    expect(hasPremiumFeature(free, "dinner_recommender", "beta_all")).toBe(true);
    expect(hasPremiumFeature(free, "dinner_recommender", "premium_only")).toBe(false);
    expect(hasPremiumFeature([{ plan: "premium", features: [], active: true, expiresAt: null }], "dinner_recommender", "premium_only")).toBe(true);
    expect(hasPremiumFeature([{ plan: "free", features: ["dinner_recommender"], active: true, expiresAt: new Date(0) }], "dinner_recommender", "premium_only")).toBe(false);
  });
});
