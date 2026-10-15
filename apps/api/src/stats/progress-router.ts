import express from "express";
import { effectiveGoals } from "@keto-mentor/shared";
import { z } from "zod";
import { getSettings } from "../admin/runtime-settings.js";
import { hasPremiumFeature } from "../meals/dinner-suggestions.js";
import { localDay, weeklyProgress } from "./progress.js";
import { exportDays } from "./export.js";
import { dayMicros } from "./micros.js";
import { serializeMeal } from "../nutrition.js";

export const STATS_FEATURE = "advanced_stats";
export const EXPORT_FEATURE = "export";
export const MICROS_FEATURE = "micronutrients";
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const weightSchema = z.object({ date: dateSchema, weightKg: z.number().min(20).max(400) }).strict();

export function progressRouter(deps: { prisma: any; requireAuth: express.RequestHandler; adminOnly: express.RequestHandler }) {
  const router = express.Router();
  const { prisma } = deps;
  const gateFor = (feature: string): express.RequestHandler => async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { entitlements: true } });
      if (!hasPremiumFeature(user?.entitlements ?? [], feature, getSettings().premiumAccess)) return res.status(403).json({ error: "premium_required" });
      next();
    } catch (error) { next(error); }
  };
  const gate = gateFor(STATS_FEATURE);

  // A day's vitamins and minerals against the EU reference values.
  router.get("/stats/micros", deps.requireAuth, gateFor(MICROS_FEATURE), async (req, res, next) => {
    try {
      const date = dateSchema.parse(req.query.date);
      const tz = Number(req.query.tzOffsetMinutes ?? 0);
      const tzOffsetMinutes = Number.isFinite(tz) && Math.abs(tz) <= 14 * 60 ? tz : 0;
      const start = new Date(new Date(`${date}T00:00:00Z`).getTime() + tzOffsetMinutes * 60_000);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const meals = await prisma.meal.findMany({
        where: { userId: req.user!.id, eatenAt: { gte: start, lt: end } },
        select: { items: { select: { quantityGrams: true, snapshotNutrients: true, food: { select: { nutrients: { select: { amountPer100g: true, nutrient: { select: { key: true } } } } } } } } }
      });
      res.json({ date, ...dayMicros(meals.flatMap((meal: any) => meal.items)) });
    } catch (error) { next(error); }
  });

  // Diary export for a CSV file or a printable report (at most 92 days).
  router.get("/export/diary", deps.requireAuth, gateFor(EXPORT_FEATURE), async (req, res, next) => {
    try {
      const from = dateSchema.parse(req.query.from);
      const to = dateSchema.parse(req.query.to);
      const tz = Number(req.query.tzOffsetMinutes ?? 0);
      const tzOffsetMinutes = Number.isFinite(tz) && Math.abs(tz) <= 14 * 60 ? tz : 0;
      const start = new Date(new Date(`${from}T00:00:00Z`).getTime() + tzOffsetMinutes * 60_000);
      const end = new Date(new Date(`${to}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000 + tzOffsetMinutes * 60_000);
      if (!(end > start) || end.getTime() - start.getTime() > 93 * 24 * 60 * 60 * 1000) return res.status(400).json({ error: "invalid_range" });
      const [meals, profile] = await Promise.all([
        prisma.meal.findMany({ where: { userId: req.user!.id, eatenAt: { gte: start, lt: end } }, include: { items: { include: { food: true, recipe: true } } } }),
        prisma.profile.findUnique({ where: { userId: req.user!.id }, select: { dailyKcal: true, dailyProtein: true, dailyNetCarbs: true, dailyFat: true, dailyFiber: true } })
      ]);
      res.json({ from, to, goals: profile, days: exportDays(meals.map(serializeMeal), tzOffsetMinutes) });
    } catch (error) { next(error); }
  });

  router.get("/stats/progress", deps.requireAuth, gate, async (req, res, next) => {
    try {
      const tz = Number(req.query.tzOffsetMinutes ?? 0);
      const tzOffsetMinutes = Number.isFinite(tz) && Math.abs(tz) <= 14 * 60 ? tz : 0;
      const weeks = Math.min(Math.max(Number(req.query.weeks ?? 8) || 8, 1), 26);
      const today = localDay(new Date(), tzOffsetMinutes);
      const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id }, select: { dailyNetCarbs: true, weekdayGoals: true } });
      const since = new Date(Date.now() - (weeks * 7 + 8) * 24 * 60 * 60 * 1000);
      const meals = await prisma.meal.findMany({
        where: { userId: req.user!.id, eatenAt: { gte: since } },
        select: { eatenAt: true, items: { select: { quantityGrams: true, snapshotKcal: true, snapshotFat: true, snapshotProtein: true, snapshotCarbs: true, snapshotFiber: true, snapshotNetCarbs: true, food: { select: { kcalPer100g: true, fatPer100g: true, proteinPer100g: true, carbsPer100g: true, fiberPer100g: true } } } } }
      });
      const progress = weeklyProgress(meals, { today, weeks, tzOffsetMinutes, goalNetCarbs: profile?.dailyNetCarbs ?? 25, goalNetCarbsFor: (day) => effectiveGoals(profile, day).dailyNetCarbs });
      const weights = await prisma.weightEntry.findMany({ where: { userId: req.user!.id }, orderBy: { date: "asc" }, select: { date: true, weightKg: true }, take: 400 });
      res.json({ ...progress, goalNetCarbs: profile?.dailyNetCarbs ?? 25, today, weights });
    } catch (error) { next(error); }
  });

  router.put("/stats/weights", deps.requireAuth, deps.adminOnly, gate, async (req, res, next) => {
    try {
      const { date, weightKg } = weightSchema.parse(req.body);
      const rounded = Math.round(weightKg * 10) / 10;
      const entry = await prisma.weightEntry.upsert({
        where: { userId_date: { userId: req.user!.id, date } },
        create: { userId: req.user!.id, date, weightKg: rounded },
        update: { weightKg: rounded },
        select: { date: true, weightKg: true }
      });
      res.json({ weight: entry });
    } catch (error) { next(error); }
  });

  router.delete("/stats/weights/:date", deps.requireAuth, deps.adminOnly, gate, async (req, res, next) => {
    try {
      const date = dateSchema.parse(req.params.date);
      await prisma.weightEntry.deleteMany({ where: { userId: req.user!.id, date } });
      res.status(204).end();
    } catch (error) { next(error); }
  });

  return router;
}
