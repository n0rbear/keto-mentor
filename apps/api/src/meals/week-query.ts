import type { PrismaClient } from "@prisma/client";
import { addMacros, emptyMacros } from "../nutrition-core.js";
import { mealTotals } from "../nutrition.js";
import type { DiaryWeekRange } from "./diary-date.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fetches one user's meals across a resolved Monday-Sunday week range with a
 * single bounded query (never 7 separate day queries), then buckets and
 * aggregates them per day in memory — reusing the same trusted `mealTotals`
 * nutrition math as `/meals/today`, never recomputing it.
 */
export async function getWeekOverview(
  prisma: Pick<PrismaClient, "meal">,
  userId: string,
  week: DiaryWeekRange
) {
  const meals = await prisma.meal.findMany({
    where: { userId, eatenAt: { gte: week.start, lt: week.end } },
    select: {
      eatenAt: true,
      items: { select: {
        quantityGrams: true,
        snapshotKcal: true, snapshotFat: true, snapshotProtein: true,
        snapshotCarbs: true, snapshotFiber: true,
        food: { select: {
          kcalPer100g: true, fatPer100g: true, proteinPer100g: true,
          carbsPer100g: true, fiberPer100g: true
        } }
      } }
    }
  });

  const buckets = week.days.map((date) => ({ date, mealCount: 0, totals: emptyMacros() }));

  for (const meal of meals) {
    const dayIndex = Math.floor((meal.eatenAt.getTime() - week.start.getTime()) / DAY_MS);
    const bucket = buckets[dayIndex];
    if (!bucket) continue; // defensive: should be unreachable given the query's own range filter
    bucket.mealCount += 1;
    bucket.totals = addMacros(bucket.totals, mealTotals(meal));
  }

  const days = buckets.map(({ date, mealCount, totals }) => ({
    date, mealCount,
    kcal: totals.kcal, netCarbs: totals.netCarbs, protein: totals.protein, fat: totals.fat, fiber: totals.fiber
  }));

  const summary = buckets.reduce(
    (sum, day) => ({
      mealCount: sum.mealCount + day.mealCount,
      loggedDays: sum.loggedDays + (day.mealCount > 0 ? 1 : 0)
    }),
    { mealCount: 0, loggedDays: 0 }
  );

  return { weekStart: week.weekStart, weekEnd: week.weekEnd, days, summary };
}
