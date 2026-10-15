import { itemTotals } from "../nutrition.js";

// Haladó statisztika (premium, owner-approved 2026-10-15): keto adherence
// week by week in the user's own timezone, weekly averages and the weight
// log. A day counts as keto when its net carbs stay at or under the goal;
// only days with at least one logged meal count.

type Item = Parameters<typeof itemTotals>[0];
export type ProgressMeal = { eatenAt: Date; items: Item[] };
export type WeekStat = { weekStart: string; loggedDays: number; ketoDays: number; percent: number | null; avg: { kcal: number; protein: number; netCarbs: number } | null };

/** Local calendar day (YYYY-MM-DD) for a Date.getTimezoneOffset()-style offset. */
export const localDay = (at: Date, tzOffsetMinutes: number) => new Date(at.getTime() - tzOffsetMinutes * 60_000).toISOString().slice(0, 10);

export function mondayOf(day: string) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
const plusDays = (day: string, n: number) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export function weeklyProgress(meals: readonly ProgressMeal[], input: { today: string; weeks: number; tzOffsetMinutes: number; goalNetCarbs: number }) {
  const days = new Map<string, { kcal: number; protein: number; netCarbs: number }>();
  for (const meal of meals) {
    const day = localDay(meal.eatenAt, input.tzOffsetMinutes);
    const sum = days.get(day) ?? { kcal: 0, protein: 0, netCarbs: 0 };
    for (const item of meal.items) { const t = itemTotals(item); sum.kcal += t.kcal; sum.protein += t.protein; sum.netCarbs += t.netCarbs; }
    days.set(day, sum);
  }
  const thisMonday = mondayOf(input.today);
  const weeks: WeekStat[] = [];
  for (let w = input.weeks - 1; w >= 0; w--) {
    const start = plusDays(thisMonday, -7 * w);
    const logged = Array.from({ length: 7 }, (_, i) => days.get(plusDays(start, i))).filter((d): d is NonNullable<typeof d> => !!d);
    const ketoDays = logged.filter((d) => d.netCarbs <= input.goalNetCarbs + 1e-9).length;
    const avg = (key: "kcal" | "protein" | "netCarbs") => logged.reduce((a, d) => a + d[key], 0) / logged.length;
    weeks.push({
      weekStart: start, loggedDays: logged.length, ketoDays,
      percent: logged.length ? Math.round((ketoDays / logged.length) * 100) : null,
      avg: logged.length ? { kcal: Math.round(avg("kcal")), protein: Math.round(avg("protein")), netCarbs: Math.round(avg("netCarbs") * 10) / 10 } : null
    });
  }
  // Keto streak: consecutive logged keto days ending today or yesterday.
  let streak = 0;
  let cursor = days.has(input.today) ? input.today : plusDays(input.today, -1);
  while (days.has(cursor) && days.get(cursor)!.netCarbs <= input.goalNetCarbs + 1e-9) { streak += 1; cursor = plusDays(cursor, -1); }
  const totalLogged = weeks.reduce((a, w) => a + w.loggedDays, 0);
  const totalKeto = weeks.reduce((a, w) => a + w.ketoDays, 0);
  return { weeks, streak, percent: totalLogged ? Math.round((totalKeto / totalLogged) * 100) : null, rangeStart: weeks[0]?.weekStart ?? thisMonday };
}
