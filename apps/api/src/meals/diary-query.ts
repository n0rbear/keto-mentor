import type { PrismaClient } from "@prisma/client";
import { serializeMeal, serializeMealSummary } from "../nutrition.js";
import type { DiaryDateRange } from "./diary-date.js";

const EMPTY_TOTALS = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

/**
 * Fetches one user's meals for a resolved calendar-day range, in either the
 * slim dashboard `summary` shape or the `detailed` per-item shape — the same
 * two shapes `/meals/today` has always returned, now reusable for any day.
 */
export async function getMealsForDay(
  prisma: Pick<PrismaClient, "meal">,
  userId: string,
  range: DiaryDateRange,
  view: "summary" | "detailed"
) {
  const where = { userId, eatenAt: { gte: range.start, lt: range.end } };
  const serialized = view === "summary"
    ? (await prisma.meal.findMany({
        where,
        orderBy: { eatenAt: "desc" },
        select: {
          id: true, title: true, eatenAt: true,
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
      })).map(serializeMealSummary)
    : (await prisma.meal.findMany({
        where,
        orderBy: { eatenAt: "desc" },
        include: { items: { include: { food: true, recipe: true } } }
      })).map(serializeMeal);
  const totals = serialized.reduce((sum, meal) => ({
    kcal: sum.kcal + meal.totals.kcal,
    fat: sum.fat + meal.totals.fat,
    protein: sum.protein + meal.totals.protein,
    carbs: sum.carbs + meal.totals.carbs,
    fiber: sum.fiber + meal.totals.fiber,
    netCarbs: sum.netCarbs + meal.totals.netCarbs
  }), { ...EMPTY_TOTALS });
  return { date: range.date, meals: serialized, totals };
}
