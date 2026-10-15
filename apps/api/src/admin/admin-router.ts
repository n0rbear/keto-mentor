import express from "express";
import { z } from "zod";
import { isAdminUser } from "./email-verification.js";
import { getSettings, saveSettings, settingsSchema } from "./runtime-settings.js";
import { flushUsage } from "./usage-counters.js";
import { ketoAdherence } from "./keto-adherence.js";

// Admin screen API (owner request 2026-10-15). Every route checks, on every
// request and against the database, that the caller's CONFIRMED e-mail is on
// ADMIN_EMAILS. Every change is logged as one admin_action line (no content).

export type AdminDeps = {
  prisma: any;
  requireAuth: express.RequestHandler;
  admins: readonly string[];
  systemUsername: string;
  deleteAccount(userId: string): Promise<number>;
  sendPasswordReset(user: { id: string; email: string; locale?: string | null }): Promise<string>;
  log?: (line: string) => void;
  now?: () => Date;
};

const DAY = 24 * 60 * 60 * 1000;

export function adminRouter(deps: AdminDeps) {
  const router = express.Router();
  const log = deps.log ?? console.log;
  const now = () => deps.now?.() ?? new Date();

  const requireAdmin: express.RequestHandler = async (req, res, next) => {
    try {
      const user = await deps.prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true, emailVerifiedAt: true } });
      if (!isAdminUser(user, deps.admins)) return res.status(403).json({ error: "forbidden" });
      next();
    } catch (error) { next(error); }
  };
  router.use("/admin", deps.requireAuth, requireAdmin);

  router.get("/admin/overview", async (req, res, next) => {
    try {
      const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
      const at = now();
      const since = (d: number) => new Date(at.getTime() - d * DAY);
      const notSystem = { username: { not: deps.systemUsername } };
      await flushUsage(deps.prisma).catch(() => undefined);
      const [usersTotal, users7, users30, usersWithEmail, usersVerified, mealsTotal, meals1, meals7, recipesTotal, recipesPublic, feedbackOpen, feedbackTotal] = await Promise.all([
        deps.prisma.user.count({ where: notSystem }),
        deps.prisma.user.count({ where: { ...notSystem, createdAt: { gte: since(7) } } }),
        deps.prisma.user.count({ where: { ...notSystem, createdAt: { gte: since(30) } } }),
        deps.prisma.user.count({ where: { ...notSystem, email: { not: null } } }),
        deps.prisma.user.count({ where: { ...notSystem, emailVerifiedAt: { not: null } } }),
        deps.prisma.meal.count(),
        deps.prisma.meal.count({ where: { createdAt: { gte: since(1) } } }),
        deps.prisma.meal.count({ where: { createdAt: { gte: since(7) } } }),
        deps.prisma.recipe.count({ where: { deletedAt: null, user: notSystem } }),
        deps.prisma.recipe.count({ where: { deletedAt: null, visibility: "public", user: notSystem } }),
        deps.prisma.feedback.count({ where: { status: "open", kind: "bug" } }),
        deps.prisma.feedback.count({ where: { kind: "bug" } })
      ]);
      const [ideasOpen, ideasTotal] = await Promise.all([deps.prisma.feedback.count({ where: { status: "open", kind: "idea" } }), deps.prisma.feedback.count({ where: { kind: "idea" } })]);
      const activeIn = async (d: number) => (await deps.prisma.meal.groupBy({ by: ["userId"], where: { createdAt: { gte: since(d) } } })).length;
      const [active1, active7, active30] = await Promise.all([activeIn(1), activeIn(7), activeIn(30)]);
      const startDay = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()) - (days - 1) * DAY);
      const usage = await deps.prisma.usageDaily.findMany({ where: { day: { gte: startDay } }, orderBy: [{ day: "asc" }, { kind: "asc" }] });
      const registrations = await deps.prisma.user.findMany({ where: { ...notSystem, createdAt: { gte: startDay } }, select: { createdAt: true } });
      const mealsByDay = await deps.prisma.meal.findMany({ where: { createdAt: { gte: startDay } }, select: { createdAt: true } });
      const itemSelect = { quantityGrams: true, snapshotKcal: true, snapshotFat: true, snapshotProtein: true, snapshotCarbs: true, snapshotFiber: true, snapshotNetCarbs: true, food: { select: { kcalPer100g: true, fatPer100g: true, proteinPer100g: true, carbsPer100g: true, fiberPer100g: true } } };
      const recentMeals = await deps.prisma.meal.findMany({ where: { eatenAt: { gte: since(30) }, user: notSystem }, select: { userId: true, eatenAt: true, items: { select: itemSelect } } });
      const userIds = [...new Set(recentMeals.map((m: any) => m.userId))];
      const profiles = userIds.length ? await deps.prisma.profile.findMany({ where: { userId: { in: userIds } }, select: { userId: true, dailyNetCarbs: true } }) : [];
      const names = userIds.length ? await deps.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true } }) : [];
      const nameById = new Map(names.map((u: any) => [u.id, u.username]));
      const adherence = ketoAdherence(recentMeals, new Map(profiles.map((p: any) => [p.userId, p.dailyNetCarbs])));
      const keto = { ...adherence, perUser: adherence.perUser.slice(0, 50).map((u) => ({ ...u, username: nameById.get(u.userId) ?? "?" })) };
      const perDay: Record<string, Record<string, number>> = {};
      const bump = (day: string, key: string, by = 1) => { (perDay[day] ??= {})[key] = (perDay[day][key] ?? 0) + by; };
      for (const row of usage) bump(new Date(row.day).toISOString().slice(0, 10), row.kind, row.count);
      for (const r of registrations) bump(r.createdAt.toISOString().slice(0, 10), "register_db");
      for (const m of mealsByDay) bump(m.createdAt.toISOString().slice(0, 10), "meals_db");
      const totals: Record<string, { count: number; avgMs: number | null; promptTokens: number; completionTokens: number }> = {};
      for (const row of usage) {
        const t = totals[row.kind] ??= { count: 0, avgMs: null, promptTokens: 0, completionTokens: 0 };
        const prevMs = (t.avgMs ?? 0) * t.count;
        t.count += row.count;
        t.avgMs = t.count ? Math.round((prevMs + Number(row.totalMs)) / t.count) : null;
        t.promptTokens += Number(row.promptTokens);
        t.completionTokens += Number(row.completionTokens);
      }
      res.json({
        generatedAt: at.toISOString(), days,
        users: { total: usersTotal, new7: users7, new30: users30, withEmail: usersWithEmail, verified: usersVerified, active1, active7, active30 },
        meals: { total: mealsTotal, last24h: meals1, last7d: meals7 },
        recipes: { total: recipesTotal, public: recipesPublic },
        feedback: { open: feedbackOpen, total: feedbackTotal, ideasOpen, ideasTotal },
        keto,
        usageTotals: totals,
        perDay
      });
    } catch (error) { next(error); }
  });

  router.get("/admin/feedback", async (req, res, next) => {
    try {
      const status = req.query.status === "done" ? "done" : req.query.status === "all" ? undefined : "open";
      const kind = req.query.kind === "bug" || req.query.kind === "idea" ? req.query.kind : undefined;
      const items = await deps.prisma.feedback.findMany({
        where: { ...(status ? { status } : {}), ...(kind ? { kind } : {}) }, orderBy: { createdAt: "desc" }, take: 200,
        include: { user: { select: { username: true, email: true } } }
      });
      res.json({ items });
    } catch (error) { next(error); }
  });

  router.patch("/admin/feedback/:id", async (req, res, next) => {
    try {
      const input = z.object({ status: z.enum(["open", "done"]).optional(), adminNote: z.string().max(2000).nullable().optional() }).parse(req.body);
      const item = await deps.prisma.feedback.update({ where: { id: req.params.id }, data: input }).catch((error: any) => { if (error?.code === "P2025") return null; throw error; });
      if (!item) return res.status(404).json({ error: "not_found" });
      log(`admin_action action=feedback_update id=${req.params.id}${input.status ? ` status=${input.status}` : ""}`);
      res.json({ item });
    } catch (error) { next(error); }
  });

  router.get("/admin/users", async (req, res, next) => {
    try {
      const q = String(req.query.q ?? "").trim().toLowerCase().slice(0, 100);
      const where = { username: { not: deps.systemUsername }, ...(q ? { OR: [{ username: { contains: q } }, { email: { contains: q } }] } : {}) };
      const users = await deps.prisma.user.findMany({
        where, orderBy: { createdAt: "desc" }, take: 200,
        select: { id: true, username: true, email: true, emailVerifiedAt: true, locale: true, createdAt: true, _count: { select: { meals: true, recipes: true } } }
      });
      const last = users.length ? await deps.prisma.meal.groupBy({ by: ["userId"], where: { userId: { in: users.map((u: any) => u.id) } }, _max: { createdAt: true } }) : [];
      const lastByUser = new Map(last.map((row: any) => [row.userId, row._max.createdAt]));
      res.json({ users: users.map((u: any) => ({
        id: u.id, username: u.username, email: u.email, emailVerified: !!u.emailVerifiedAt, locale: u.locale, createdAt: u.createdAt,
        meals: u._count.meals, recipes: u._count.recipes, lastMealAt: lastByUser.get(u.id) ?? null,
        isAdmin: isAdminUser(u, deps.admins)
      })) });
    } catch (error) { next(error); }
  });

  router.delete("/admin/users/:id", async (req, res, next) => {
    try {
      if (req.params.id === req.user!.id) return res.status(400).json({ error: "cannot_delete_self" });
      const target = await deps.prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, username: true } });
      if (!target || target.username === deps.systemUsername) return res.status(404).json({ error: "not_found" });
      const kept = await deps.deleteAccount(target.id);
      log(`admin_action action=user_delete target=${target.id} shared_recipes_kept=${kept}`);
      res.status(204).end();
    } catch (error) { next(error); }
  });

  router.post("/admin/users/:id/password-reset", async (req, res, next) => {
    try {
      const target = await deps.prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, email: true, locale: true, username: true } });
      if (!target || target.username === deps.systemUsername) return res.status(404).json({ error: "not_found" });
      if (!target.email) return res.status(400).json({ error: "no_email" });
      const outcome = await deps.sendPasswordReset({ id: target.id, email: target.email, locale: target.locale });
      log(`admin_action action=password_reset target=${target.id} outcome=${outcome}`);
      res.json({ outcome });
    } catch (error) { next(error); }
  });

  router.get("/admin/settings", (_req, res) => res.json({ settings: getSettings() }));
  router.put("/admin/settings", async (req, res, next) => {
    try {
      const settings = await saveSettings(deps.prisma, settingsSchema.parse(req.body));
      log(`admin_action action=settings_update registrationOpen=${settings.registrationOpen} announcement=${settings.announcement.enabled} aiLimits=${settings.aiLimits.perHour}/${settings.aiLimits.perDay}/${settings.aiLimits.perRecipe}`);
      res.json({ settings });
    } catch (error) { next(error); }
  });

  return router;
}
