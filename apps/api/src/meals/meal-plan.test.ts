import { describe, expect, it } from "vitest";
import { normalizeSearch } from "../catalog/normalize.js";
import type { DinnerCandidate } from "./dinner-suggestions.js";
import { addDays, clearPlanMeal, emptyPlan, generatePlan, planAlternatives, planPools, searchPlanDishes, setPlanMeal, shoppingList, swapMeal } from "./meal-plan.js";

let seed = 7;
const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const c = (id: string, m: Partial<DinnerCandidate["perServing"]>, extra: Partial<DinnerCandidate> = {}): DinnerCandidate => ({
  recipeId: id, source: "reference", titles: { hu: id, de: id, en: id }, dishId: id, servingGrams: 300,
  perServing: { kcal: 550, protein: 35, netCarbs: 6, fat: 40, ...m }, haystack: normalizeSearch(id), lowCarbFriendly: true,
  style: `s-${id}`, protein: `p-${id}`, tags: [], ingredients: [{ name: "Sertéskaraj", grams: 150, seasoning: false }, { name: "só", grams: 2, seasoning: true }], ...extra
});
const goals = { kcal: 1800, protein: 110, netCarbs: 25, fat: 130 };
const breakfasts = ["rántotta", "tükörtojás", "ham and eggs", "omlett"].map((id, i) => c(id, { kcal: 400 + i * 20, netCarbs: 2 }, { tags: ["breakfast", "eggs"], style: "eggs", protein: "eggs" }));
const mains = Array.from({ length: 14 }, (_, i) => c(`main${i}`, { kcal: 600 + (i % 4) * 40, protein: 30 + (i % 5) * 4, netCarbs: 4 + (i % 6) }, { style: ["roast", "stew", "soup", "fried", "salad", "grilled", "fish"][i % 7], protein: ["pork", "beef", "poultry", "fish"][i % 4] }));

describe("heti étrendterv", () => {
  it("plans seven days of breakfast, lunch and dinner that stay under the net-carb target", () => {
    const days = generatePlan({ candidates: [...breakfasts, ...mains], goals, avoid: [], startDate: "2026-10-16", random });
    expect(days.map((d) => d.date)).toEqual(Array.from({ length: 7 }, (_, i) => addDays("2026-10-16", i)));
    for (const day of days) {
      expect(day.meals.map((m) => m.mealType)).toEqual(["breakfast", "lunch", "dinner"]);
      expect(day.fits).toBe(true);
      expect(day.totals.netCarbs).toBeLessThanOrEqual(25);
      const [, lunch, dinner] = day.meals;
      expect(lunch.dishId).not.toBe(dinner.dishId);
    }
    // Variety: with 14 mains for 14 lunch/dinner slots, little repetition.
    const mainIds = days.flatMap((d) => d.meals.slice(1).map((m) => m.dishId));
    expect(new Set(mainIds).size).toBeGreaterThanOrEqual(11);
  });

  it("leaves out avoided foods; breakfast only quick dishes, lunch nothing long-cooked", () => {
    const gulyas = c("marhagulyás", { kcal: 480 }, { style: "stew", tags: ["traditional", "stew"] });
    const salad = c("csirkesaláta", { kcal: 420 }, { style: "salad", tags: ["salad"] });
    const pools = planPools([...breakfasts.slice(0, 1), ...mains, gulyas, salad, c("halas", { kcal: 500 }, { haystack: normalizeSearch("ponty filé") })], goals, ["hal"]);
    expect(pools.main.some((x) => x.recipeId === "halas")).toBe(false);
    expect(pools.breakfast.map((x) => x.recipeId)).toContain("csirkesaláta");
    expect(pools.breakfast.some((x) => x.recipeId === "marhagulyás")).toBe(false);
    expect(pools.lunch.some((x) => x.recipeId === "marhagulyás")).toBe(false);
    expect(pools.dinner.some((x) => x.recipeId === "marhagulyás")).toBe(true);
  });

  it("swaps one meal for a different dish and keeps the rest of the day", () => {
    const days = generatePlan({ candidates: [...breakfasts, ...mains], goals, avoid: [], startDate: "2026-10-16", random });
    const before = days[2];
    const after = swapMeal({ days, date: before.date, slot: "dinner", candidates: [...breakfasts, ...mains], goals, avoid: [], random })[2];
    expect(after.meals[0]).toEqual(before.meals[0]);
    expect(after.meals[1]).toEqual(before.meals[1]);
    expect(after.meals[2].dishId).not.toBe(before.meals[2].dishId);
  });

  it("builds one shopping list summed by ingredient, seasonings last", () => {
    const days = generatePlan({ candidates: [...breakfasts, ...mains], goals, avoid: [], startDate: "2026-10-16", days: 1, random });
    const byId = new Map([...breakfasts, ...mains].map((x) => [x.recipeId, x]));
    const list = shoppingList(days, byId, "hu");
    expect(list[0]).toMatchObject({ name: "Sertéskaraj", grams: 450, seasoning: false, meals: 3 });
    expect(list[list.length - 1]).toMatchObject({ name: "só", seasoning: true });
  });

  it("marks a day that cannot stay under the carb target", () => {
    const days = generatePlan({ candidates: [c("b", { netCarbs: 14 }, { tags: ["breakfast"] }), c("x", { netCarbs: 14 }), c("y", { netCarbs: 14 })], goals, avoid: [], startDate: "2026-10-16", days: 1, random });
    expect(days[0].fits).toBe(false);
  });

  it("offers 6-8 different alternatives for one meal that keep the day under the carb target", () => {
    const days = generatePlan({ candidates: [...breakfasts, ...mains], goals, avoid: [], startDate: "2026-10-16", random });
    const alts = planAlternatives({ days, date: days[1].date, slot: "dinner", candidates: [...breakfasts, ...mains], goals, avoid: [], random });
    expect(alts.length).toBeGreaterThanOrEqual(6);
    expect(alts.length).toBeLessThanOrEqual(8);
    expect(new Set(alts.map((a) => a.dishId)).size).toBe(alts.length);
    expect(alts.every((a) => a.dayTotals.netCarbs <= goals.netCarbs)).toBe(true);
    expect(alts.some((a) => a.dishId === days[1].meals[2].dishId)).toBe(false);
    const chosen = [...breakfasts, ...mains].find((x) => x.recipeId === alts[3].recipeId)!;
    const next = setPlanMeal(days, days[1].date, "dinner", chosen, goals);
    expect(next[1].meals[2].recipeId).toBe(chosen.recipeId);
    expect(next[1].meals[0]).toEqual(days[1].meals[0]);
  });

  it("builds a plan by hand: empty week, search a dish, set it, clear it", () => {
    let days = emptyPlan("2026-10-19", () => goals);
    expect(days).toHaveLength(7);
    expect(days.every((d) => d.meals.length === 0)).toBe(true);
    const found = searchPlanDishes({ days, date: "2026-10-20", slot: "lunch", candidates: [...breakfasts, ...mains], goals, avoid: [], query: "main1", lang: "hu" });
    expect(found.map((f) => f.recipeId)).toEqual(expect.arrayContaining(["main1", "main10"]));
    const chosen = [...breakfasts, ...mains].find((x) => x.recipeId === "main1")!;
    days = setPlanMeal(days, "2026-10-20", "lunch", chosen, goals);
    expect(days[1].meals.map((m) => m.recipeId)).toEqual(["main1"]);
    expect(days[1].totals.kcal).toBeGreaterThan(0);
    days = clearPlanMeal(days, "2026-10-20", "lunch", goals);
    expect(days[1].meals).toEqual([]);
  });
});
