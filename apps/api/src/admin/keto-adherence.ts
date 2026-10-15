import { itemTotals } from "../nutrition.js";

// Keto adherence for the admin statistics (owner request 2026-10-15): of the
// days a user logged at least one meal, how many stayed at or under that
// user's own daily net-carb goal. Net carbs are summed exactly as the diary
// does (nutrition.ts itemTotals). Days are UTC calendar days — close to the
// users' local day in HU/AT/DE, but a meal near midnight can land on the
// neighbouring day. A partly logged day counts like any other logged day.

export const MOSTLY_ADHERENT = 0.8;

type Item = Parameters<typeof itemTotals>[0];
export type AdherenceMeal = { userId: string; eatenAt: Date; items: Item[] };
export type UserAdherence = { userId: string; days: number; adherentDays: number; percent: number; avgNetCarbs: number; goal: number };

export function ketoAdherence(meals: readonly AdherenceMeal[], goals: ReadonlyMap<string, number>, defaultGoal = 25) {
  const perUserDay = new Map<string, Map<string, number>>();
  for (const meal of meals) {
    const day = meal.eatenAt.toISOString().slice(0, 10);
    const net = meal.items.reduce((sum, item) => sum + itemTotals(item).netCarbs, 0);
    const days = perUserDay.get(meal.userId) ?? new Map<string, number>();
    days.set(day, (days.get(day) ?? 0) + net);
    perUserDay.set(meal.userId, days);
  }
  const users: UserAdherence[] = [];
  for (const [userId, days] of perUserDay) {
    const goal = goals.get(userId) ?? defaultGoal;
    const values = [...days.values()];
    const adherentDays = values.filter((net) => net <= goal + 1e-9).length;
    users.push({ userId, days: values.length, adherentDays, percent: Math.round((adherentDays / values.length) * 100), avgNetCarbs: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10, goal });
  }
  users.sort((a, b) => b.days - a.days || a.userId.localeCompare(b.userId));
  const loggedDays = users.reduce((sum, u) => sum + u.days, 0);
  const adherentDays = users.reduce((sum, u) => sum + u.adherentDays, 0);
  return {
    loggedDays, adherentDays,
    percent: loggedDays ? Math.round((adherentDays / loggedDays) * 100) : null,
    users: users.length,
    usersMostlyAdherent: users.filter((u) => u.adherentDays / u.days >= MOSTLY_ADHERENT).length,
    perUser: users
  };
}
