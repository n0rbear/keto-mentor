import { normalizeSearch } from "../catalog/normalize.js";
import { exclusionTerms, mentions, type DinnerCandidate, type Lang, type Macros } from "./dinner-suggestions.js";

// Heti étrendtervező (premium, owner request 2026-10-15): seven days of
// breakfast, lunch and dinner from the user's own recipes and the reviewed
// reference dishes, one usual serving each, so every day stays under the
// net-carb target and lands near the calorie target with as much of the
// protein target as possible. No AI and no invented numbers. Variety: a dish
// appears at most once a week while others fit, and lunch and dinner differ
// in style and main protein.

export const PLAN_SLOTS = ["breakfast", "lunch", "dinner"] as const;
export type PlanSlot = (typeof PLAN_SLOTS)[number];
export type PlanMeal = { mealType: PlanSlot; recipeId: string; dishId: string; source: "own" | "reference"; titles: { hu: string; de: string; en: string }; servingGrams: number | null; macros: Macros; style: string; protein: string };
export type PlanDay = { date: string; meals: PlanMeal[]; totals: Macros; fits: boolean; goal?: Goals };
export type Goals = { kcal: number; protein: number; netCarbs: number; fat: number };

const TRIES_PER_DAY = 400;
const r1 = (value: number) => Math.round(value * 10) / 10;

function toMeal(slot: PlanSlot, c: DinnerCandidate): PlanMeal {
  const m = c.perServing;
  return {
    mealType: slot, recipeId: c.recipeId, dishId: c.dishId, source: c.source, titles: c.titles, servingGrams: c.servingGrams,
    macros: { kcal: Math.round(m.kcal), protein: r1(m.protein), netCarbs: r1(m.netCarbs), fat: r1(m.fat) }, style: c.style, protein: c.protein
  };
}

export function sumMacros(meals: Array<{ macros: Macros }>): Macros {
  const t = meals.reduce((a, { macros: m }) => ({ kcal: a.kcal + m.kcal, protein: a.protein + m.protein, netCarbs: a.netCarbs + m.netCarbs, fat: a.fat + m.fat }), { kcal: 0, protein: 0, netCarbs: 0, fat: 0 });
  return { kcal: Math.round(t.kcal), protein: r1(t.protein), netCarbs: r1(t.netCarbs), fat: r1(t.fat) };
}

/** Breakfast and main-meal pools, without avoided foods and allergens; each meal at most 60% of the day's net carbs. */
export function planPools(candidates: DinnerCandidate[], goals: Goals, avoid: string[]) {
  const terms = exclusionTerms(avoid);
  const usable = candidates.filter((c) => c.perServing.kcal >= 120 && c.perServing.netCarbs <= goals.netCarbs * 0.6 && !terms.some((term) => mentions(c.haystack, term)));
  const isBreakfast = (c: DinnerCandidate) => (c.tags ?? []).includes("breakfast") || c.style === "eggs" || c.protein === "eggs";
  let breakfast = usable.filter((c) => c.source === "own" || isBreakfast(c));
  // Only a handful of reference breakfasts are keto (eggs, sausages): lighter
  // low-carb dishes widen the choice so the week is not one breakfast.
  if (breakfast.length < 10) breakfast = [...breakfast, ...usable.filter((c) => !breakfast.includes(c) && c.lowCarbFriendly && c.perServing.kcal <= 550)];
  return {
    breakfast,
    main: usable.filter((c) => c.perServing.kcal >= 150 && (c.source === "own" || !(c.tags ?? []).includes("breakfast")))
  };
}

type Pools = ReturnType<typeof planPools>;

function scoreDay(meals: PlanMeal[], goals: Goals, weekDishes: Map<string, number>, weekStyles: Map<string, number>) {
  const t = sumMacros(meals);
  if (t.netCarbs > goals.netCarbs) return { fits: false, score: -1000 - t.netCarbs };
  const kcalRatio = goals.kcal > 0 ? t.kcal / goals.kcal : 1;
  let score = 2 * (goals.protein > 0 ? Math.min(t.protein, goals.protein) / goals.protein : 0.5)
    - 2.5 * Math.max(0, 0.85 - kcalRatio) - 4 * Math.max(0, kcalRatio - 1.05)
    - 0.4 * (t.netCarbs / Math.max(1, goals.netCarbs));
  const [, lunch, dinner] = meals;
  if (lunch && dinner) {
    if (lunch.style === dinner.style) score -= 0.6;
    if (lunch.protein === dinner.protein) score -= 0.5;
  }
  for (const meal of meals) {
    score -= 1.5 * (weekDishes.get(meal.dishId) ?? 0);
    score -= 0.15 * (weekStyles.get(meal.style) ?? 0);
    if (meal.source === "own") score += 0.2;
  }
  return { fits: true, score };
}

function pickDay(date: string, pools: Pools, goals: Goals, weekDishes: Map<string, number>, weekStyles: Map<string, number>, random: () => number, fixed: Partial<Record<PlanSlot, PlanMeal>> = {}): PlanDay {
  const pick = (list: DinnerCandidate[]) => list[Math.floor(random() * list.length)];
  let best: { meals: PlanMeal[]; fits: boolean; score: number } | null = null;
  if (!pools.main.length || !pools.breakfast.length) return { date, meals: Object.values(fixed) as PlanMeal[], totals: sumMacros(Object.values(fixed) as PlanMeal[]), fits: false };
  for (let i = 0; i < TRIES_PER_DAY; i++) {
    const b = fixed.breakfast ?? toMeal("breakfast", pick(pools.breakfast));
    const l = fixed.lunch ?? toMeal("lunch", pick(pools.main));
    const d = fixed.dinner ?? toMeal("dinner", pick(pools.main));
    if (l.dishId === d.dishId || b.dishId === l.dishId || b.dishId === d.dishId) continue;
    const meals = [b, l, d];
    const { fits, score } = scoreDay(meals, goals, weekDishes, weekStyles);
    if (!best || (fits && !best.fits) || (fits === best.fits && score > best.score)) best = { meals, fits, score };
  }
  const meals = best?.meals ?? [];
  return { date, meals, totals: sumMacros(meals), fits: best?.fits ?? false, goal: goals };
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekCounts(days: PlanDay[], skip?: { date: string; slot?: PlanSlot }) {
  const dishes = new Map<string, number>();
  const styles = new Map<string, number>();
  for (const day of days) for (const meal of day.meals) {
    if (skip && day.date === skip.date && (!skip.slot || meal.mealType === skip.slot)) continue;
    dishes.set(meal.dishId, (dishes.get(meal.dishId) ?? 0) + 1);
    styles.set(meal.style, (styles.get(meal.style) ?? 0) + 1);
  }
  return { dishes, styles };
}

// Pools are filtered with the most generous day of the week (flexible goals),
// each day is then scored against its own targets.
function poolGoals(goals: Goals, dates: string[], goalsFor?: (date: string) => Goals): Goals {
  if (!goalsFor) return goals;
  return dates.map(goalsFor).reduce((a, g) => (g.netCarbs > a.netCarbs ? g : a), goals);
}

export function generatePlan(input: { candidates: DinnerCandidate[]; goals: Goals; goalsFor?: (date: string) => Goals; avoid: string[]; startDate: string; days?: number; random?: () => number }): PlanDay[] {
  const random = input.random ?? Math.random;
  const dates = Array.from({ length: input.days ?? 7 }, (_, i) => addDays(input.startDate, i));
  const pools = planPools(input.candidates, poolGoals(input.goals, dates, input.goalsFor), input.avoid);
  const days: PlanDay[] = [];
  for (const date of dates) {
    const { dishes, styles } = weekCounts(days);
    days.push(pickDay(date, pools, input.goalsFor?.(date) ?? input.goals, dishes, styles, random));
  }
  return days;
}

/** A new dish for one slot ("Másikat kérek"), keeping the day's other meals. */
export function swapMeal(input: { days: PlanDay[]; date: string; slot: PlanSlot; candidates: DinnerCandidate[]; goals: Goals; goalsFor?: (date: string) => Goals; avoid: string[]; random?: () => number }): PlanDay[] {
  const random = input.random ?? Math.random;
  const dayGoals = input.goalsFor?.(input.date) ?? input.goals;
  const pools = planPools(input.candidates, dayGoals, input.avoid);
  const { dishes, styles } = weekCounts(input.days, { date: input.date, slot: input.slot });
  return input.days.map((day) => {
    if (day.date !== input.date) return day;
    const current = day.meals.find((meal) => meal.mealType === input.slot);
    if (current) dishes.set(current.dishId, (dishes.get(current.dishId) ?? 0) + 3); // never hand back the same dish
    const fixed = Object.fromEntries(day.meals.filter((meal) => meal.mealType !== input.slot).map((meal) => [meal.mealType, meal])) as Partial<Record<PlanSlot, PlanMeal>>;
    return pickDay(day.date, pools, dayGoals, dishes, styles, random, fixed);
  });
}

export type ShoppingItem = { name: string; grams: number; seasoning: boolean; meals: number };

/** One shopping list for the whole plan: ingredients summed by name, seasonings listed apart. */
export function shoppingList(days: PlanDay[], byRecipeId: Map<string, DinnerCandidate>, lang: Lang): ShoppingItem[] {
  const items = new Map<string, ShoppingItem>();
  for (const day of days) for (const meal of day.meals) {
    const candidate = byRecipeId.get(meal.recipeId);
    for (const ingredient of candidate?.ingredients ?? []) {
      const name = (lang !== "hu" && ingredient.names?.[lang]) || ingredient.name;
      if (!name) continue;
      const key = normalizeSearch(name);
      const item = items.get(key) ?? { name, grams: 0, seasoning: ingredient.seasoning, meals: 0 };
      item.grams += ingredient.grams ?? 0;
      item.meals += 1;
      item.seasoning = item.seasoning && ingredient.seasoning;
      items.set(key, item);
    }
  }
  return [...items.values()]
    .map((item) => ({ ...item, grams: Math.round(item.grams) }))
    .sort((a, b) => Number(a.seasoning) - Number(b.seasoning) || b.grams - a.grams || a.name.localeCompare(b.name, lang));
}
