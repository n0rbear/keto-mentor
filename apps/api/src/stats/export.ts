import { serializeMeal } from "../nutrition.js";
import { localDay } from "./progress.js";

// Export (premium, owner-approved 2026-10-15): the diary for a date range,
// grouped by the user's local day, for a CSV file or a printable report.

type Totals = { kcal: number; fat: number; protein: number; carbs: number; fiber: number; netCarbs: number };
const r1 = (v: number) => Math.round(v * 10) / 10;
const round = (t: Totals): Totals => ({ kcal: Math.round(t.kcal), fat: r1(t.fat), protein: r1(t.protein), carbs: r1(t.carbs), fiber: r1(t.fiber), netCarbs: r1(t.netCarbs) });
const add = (a: Totals, b: Totals): Totals => ({ kcal: a.kcal + b.kcal, fat: a.fat + b.fat, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fiber: a.fiber + b.fiber, netCarbs: a.netCarbs + b.netCarbs });
const ZERO: Totals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

export function exportDays(meals: Array<ReturnType<typeof serializeMeal>>, tzOffsetMinutes: number) {
  const days = new Map<string, { date: string; totals: Totals; meals: any[] }>();
  for (const meal of [...meals].sort((a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime())) {
    const at = new Date(meal.eatenAt);
    const date = localDay(at, tzOffsetMinutes);
    const local = new Date(at.getTime() - tzOffsetMinutes * 60_000);
    const day = days.get(date) ?? { date, totals: { ...ZERO }, meals: [] };
    day.totals = add(day.totals, meal.totals);
    day.meals.push({
      time: local.toISOString().slice(11, 16), mealType: meal.mealType, mealTypeLabel: meal.mealTypeLabel, title: meal.title, totals: round(meal.totals),
      items: meal.items.map((item) => ({ name: item.displayName ?? "", grams: Math.round(item.quantityGrams ?? 0), ...round(item.totals) }))
    });
    days.set(date, day);
  }
  return [...days.values()].map((day) => ({ ...day, totals: round(day.totals) }));
}
