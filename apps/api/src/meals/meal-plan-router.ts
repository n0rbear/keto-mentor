import express from "express";
import { z } from "zod";
import { getSettings } from "../admin/runtime-settings.js";
import { hasPremiumFeature, loadDinnerCandidates, type DinnerCandidate, type Lang } from "./dinner-suggestions.js";
import { addDays, generatePlan, PLAN_SLOTS, shoppingList, swapMeal, type Goals, type PlanDay } from "./meal-plan.js";

export const MEAL_PLAN_FEATURE = "meal_planner";
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const createSchema = z.object({ startDate: dateSchema }).strict();
const swapSchema = z.object({ date: dateSchema, mealType: z.enum(PLAN_SLOTS) }).strict();

type Deps = { prisma: any; requireAuth: express.RequestHandler; adminOnly: express.RequestHandler; log?: (obj: object, msg: string) => void };

export function mealPlanRouter(deps: Deps) {
  const router = express.Router();
  const { prisma } = deps;

  async function context(req: express.Request) {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { locale: true, profile: true, entitlements: true } });
    const allowed = hasPremiumFeature(user?.entitlements ?? [], MEAL_PLAN_FEATURE, getSettings().premiumAccess);
    const p = user?.profile;
    const goals: Goals = { kcal: p?.dailyKcal ?? 1800, protein: p?.dailyProtein ?? 110, netCarbs: p?.dailyNetCarbs ?? 25, fat: p?.dailyFat ?? 130 };
    const avoid: string[] = [...(p?.avoidedFoods ?? []), ...(p?.allergies ?? [])];
    const lang = (["hu", "de", "en"].includes(String(req.query.lang)) ? req.query.lang : user?.locale ?? "hu") as Lang;
    return { allowed, goals, avoid, lang };
  }

  async function respond(res: express.Response, plan: { id: string; startDate: string; days: PlanDay[] } | null, candidates: DinnerCandidate[] | null, ctx: { goals: Goals; lang: Lang }, userId: string) {
    if (!plan) return res.json({ plan: null, goals: ctx.goals });
    const list = candidates ?? await loadDinnerCandidates(prisma, userId);
    const byId = new Map(list.map((c) => [c.recipeId, c]));
    res.json({ plan: { id: plan.id, startDate: plan.startDate, days: plan.days, shopping: shoppingList(plan.days, byId, ctx.lang) }, goals: ctx.goals });
  }

  router.get("/meal-plans/current", deps.requireAuth, async (req, res, next) => {
    try {
      const ctx = await context(req);
      if (!ctx.allowed) return res.status(403).json({ error: "premium_required" });
      const date = dateSchema.parse(req.query.date);
      const plan = await prisma.mealPlan.findFirst({ where: { userId: req.user!.id, startDate: { lte: date } }, orderBy: { startDate: "desc" } });
      const current = plan && addDays(plan.startDate, 7) > date ? plan : null;
      await respond(res, current, null, ctx, req.user!.id);
    } catch (error) { next(error); }
  });

  router.post("/meal-plans", deps.requireAuth, deps.adminOnly, async (req, res, next) => {
    try {
      const ctx = await context(req);
      if (!ctx.allowed) return res.status(403).json({ error: "premium_required" });
      const { startDate } = createSchema.parse(req.body);
      const candidates = await loadDinnerCandidates(prisma, req.user!.id);
      const days = generatePlan({ candidates, goals: ctx.goals, avoid: ctx.avoid, startDate });
      const plan = await prisma.mealPlan.upsert({
        where: { userId_startDate: { userId: req.user!.id, startDate } },
        create: { userId: req.user!.id, startDate, days: days as any },
        update: { days: days as any }
      });
      deps.log?.({ days: days.length, fitting: days.filter((d) => d.fits).length, candidates: candidates.length }, "meal_plan_generated");
      await respond(res.status(201), { id: plan.id, startDate, days }, candidates, ctx, req.user!.id);
    } catch (error) { next(error); }
  });

  router.post("/meal-plans/:id/swap", deps.requireAuth, deps.adminOnly, async (req, res, next) => {
    try {
      const ctx = await context(req);
      if (!ctx.allowed) return res.status(403).json({ error: "premium_required" });
      const { date, mealType } = swapSchema.parse(req.body);
      const plan = await prisma.mealPlan.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
      if (!plan) return res.status(404).json({ error: "not_found" });
      const candidates = await loadDinnerCandidates(prisma, req.user!.id);
      const days = swapMeal({ days: plan.days as PlanDay[], date, slot: mealType, candidates, goals: ctx.goals, avoid: ctx.avoid });
      await prisma.mealPlan.update({ where: { id: plan.id }, data: { days: days as any } });
      await respond(res, { id: plan.id, startDate: plan.startDate, days }, candidates, ctx, req.user!.id);
    } catch (error) { next(error); }
  });

  return router;
}
