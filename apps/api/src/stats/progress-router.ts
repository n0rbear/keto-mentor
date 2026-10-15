import express from "express";
import { z } from "zod";
import { getSettings } from "../admin/runtime-settings.js";
import { hasPremiumFeature } from "../meals/dinner-suggestions.js";
import { localDay, weeklyProgress } from "./progress.js";

export const STATS_FEATURE = "advanced_stats";
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const weightSchema = z.object({ date: dateSchema, weightKg: z.number().min(20).max(400) }).strict();

export function progressRouter(deps: { prisma: any; requireAuth: express.RequestHandler; adminOnly: express.RequestHandler }) {
  const router = express.Router();
  const { prisma } = deps;
  const gate: express.RequestHandler = async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { entitlements: true } });
      if (!hasPremiumFeature(user?.entitlements ?? [], STATS_FEATURE, getSettings().premiumAccess)) return res.status(403).json({ error: "premium_required" });
      next();
    } catch (error) { next(error); }
  };

  router.get("/stats/progress", deps.requireAuth, gate, async (req, res, next) => {
    try {
      const tz = Number(req.query.tzOffsetMinutes ?? 0);
      const tzOffsetMinutes = Number.isFinite(tz) && Math.abs(tz) <= 14 * 60 ? tz : 0;
      const weeks = Math.min(Math.max(Number(req.query.weeks ?? 8) || 8, 1), 26);
      const today = localDay(new Date(), tzOffsetMinutes);
      const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id }, select: { dailyNetCarbs: true } });
      const since = new Date(Date.now() - (weeks * 7 + 8) * 24 * 60 * 60 * 1000);
      const meals = await prisma.meal.findMany({
        where: { userId: req.user!.id, eatenAt: { gte: since } },
        select: { eatenAt: true, items: { select: { quantityGrams: true, snapshotKcal: true, snapshotFat: true, snapshotProtein: true, snapshotCarbs: true, snapshotFiber: true, snapshotNetCarbs: true, food: { select: { kcalPer100g: true, fatPer100g: true, proteinPer100g: true, carbsPer100g: true, fiberPer100g: true } } } } }
      });
      const progress = weeklyProgress(meals, { today, weeks, tzOffsetMinutes, goalNetCarbs: profile?.dailyNetCarbs ?? 25 });
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
