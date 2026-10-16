import express from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSettings } from "../admin/runtime-settings.js";
import { isAdminUser } from "../admin/email-verification.js";
import { hasPremiumFeature } from "../meals/dinner-suggestions.js";
import type { Mailer } from "../mail/mailer.js";
import { countUsage, pendingUsageCount, usageDay } from "../admin/usage-counters.js";

// Emlékeztetők (premium, owner-approved 2026-10-15): "még nem rögzítetted az
// ebédet / a vacsorát" by e-mail to the confirmed address, at the user's own
// times in their own time zone, at most once per reminder and day, and only
// within two hours of the chosen time (no late-night mail after a restart).
// The web shows the same reminder as a band while the app is open.

export const REMINDERS_FEATURE = "reminders";
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable();
export const remindersSchema = z.object({ lunchAt: time, dinnerAt: time, timeZone: z.string().min(1).max(64) }).strict();
export type Reminders = z.infer<typeof remindersSchema> & { lastSent?: { lunch?: string; dinner?: string } };
type Kind = "lunch" | "dinner";
const WINDOW_MIN = 120;

export function validTimeZone(tz: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}

/** Local date (YYYY-MM-DD) and minutes since midnight in a time zone. */
export function localClock(at: Date, timeZone: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Which reminders are due now: past the chosen time, within the window, not sent today. */
export function dueReminders(r: Reminders, at: Date): Array<{ kind: Kind; date: string }> {
  if (!validTimeZone(r.timeZone)) return [];
  const clock = localClock(at, r.timeZone);
  const out: Array<{ kind: Kind; date: string }> = [];
  for (const kind of ["lunch", "dinner"] as const) {
    const t = kind === "lunch" ? r.lunchAt : r.dinnerAt;
    if (!t) continue;
    const since = clock.minutes - toMinutes(t);
    if (since >= 0 && since <= WINDOW_MIN && r.lastSent?.[kind] !== clock.date) out.push({ kind, date: clock.date });
  }
  return out;
}

const COPY = {
  hu: { lunch: ["Még nem rögzítetted az ebédet", "Ma még nem rögzítettél ebédet a Keto Mentorban. Ha már ettél, egy perc az egész:"], dinner: ["Még nem rögzítetted a vacsorát", "Ma még nem rögzítettél vacsorát a Keto Mentorban. Ha már ettél, egy perc az egész:"], open: "Megnyitom a Keto Mentort", off: "Az emlékeztetőket az appban kapcsolhatod ki: Menü → Emlékeztetők." },
  de: { lunch: ["Mittagessen noch nicht eingetragen", "Du hast heute in Keto Mentor noch kein Mittagessen eingetragen. Falls du schon gegessen hast, dauert es eine Minute:"], dinner: ["Abendessen noch nicht eingetragen", "Du hast heute in Keto Mentor noch kein Abendessen eingetragen. Falls du schon gegessen hast, dauert es eine Minute:"], open: "Keto Mentor öffnen", off: "Erinnerungen kannst du in der App ausschalten: Menü → Erinnerungen." },
  en: { lunch: ["Lunch not logged yet", "You have not logged lunch in Keto Mentor today. If you already ate, it takes a minute:"], dinner: ["Dinner not logged yet", "You have not logged dinner in Keto Mentor today. If you already ate, it takes a minute:"], open: "Open Keto Mentor", off: "You can turn reminders off in the app: Menu → Reminders." }
} as const;

type Db = any;

export const REMINDER_USAGE_KIND = "reminder_email";

/** Reminder e-mails sent this UTC day: the stored counter plus the not yet flushed tally. */
export async function remindersSentToday(prisma: Db, at = new Date()): Promise<number> {
  const day = usageDay(at);
  let stored = 0;
  try {
    const row = await prisma.usageDaily.findUnique({ where: { day_kind: { day: new Date(`${day}T00:00:00Z`), kind: REMINDER_USAGE_KIND } }, select: { count: true } });
    stored = row?.count ?? 0;
  } catch { /* counter unreadable: fall back to this process's tally */ }
  return stored + pendingUsageCount(REMINDER_USAGE_KIND, day);
}

/** One scheduler pass: sends due reminders and records them. Returns the number sent. */
export async function runReminders(deps: { prisma: Db; mailer: Mailer; webAppUrl: string; admins: readonly string[]; now?: () => Date; log?: (line: string) => void }) {
  const at = deps.now?.() ?? new Date();
  const access = getSettings().premiumAccess;
  const profiles = await deps.prisma.profile.findMany({
    where: { reminders: { not: Prisma.DbNull } },
    select: { userId: true, reminders: true, user: { select: { email: true, emailVerifiedAt: true, locale: true, entitlements: true } } }
  });
  let sent = 0;
  const cap = getSettings().reminderDailyCap;
  let sentToday = profiles.length ? await remindersSentToday(deps.prisma, at) : 0;
  let capped = false;
  for (const p of profiles) {
    if (capped) break;
    const r = p.reminders as Reminders | null;
    const user = p.user;
    if (!r || !user?.email || !user.emailVerifiedAt || isAdminUser(user, deps.admins)) continue;
    if (!hasPremiumFeature(user.entitlements ?? [], REMINDERS_FEATURE, access)) continue;
    const due = dueReminders(r, at);
    if (!due.length) continue;
    const lastSent = { ...(r.lastSent ?? {}) };
    for (const { kind, date } of due) {
      // Already logged? Any meal of that type, or for lunch any meal after 10:00 local, counts.
      const dayStart = new Date(at.getTime() - 26 * 60 * 60 * 1000);
      const meals = await deps.prisma.meal.findMany({ where: { userId: p.userId, eatenAt: { gte: dayStart } }, select: { eatenAt: true, mealType: true } });
      const today = meals.filter((m: any) => localClock(m.eatenAt, r.timeZone).date === date);
      const logged = today.some((m: any) => m.mealType === kind || (kind === "lunch" && m.mealType !== "breakfast" && m.mealType !== "morning_snack" && localClock(m.eatenAt, r.timeZone).minutes >= 10 * 60) || (kind === "dinner" && m.mealType !== "lunch" && localClock(m.eatenAt, r.timeZone).minutes >= 17 * 60));
      if (logged) { lastSent[kind] = date; continue; }
      // Daily ceiling reached: skip (not marked sent) so account e-mails still go out.
      if (sentToday >= cap) { capped = true; (deps.log ?? console.log)(`reminder_skipped reason=daily_cap cap=${cap}`); break; }
      lastSent[kind] = date;
      const c = COPY[(["hu", "de", "en"].includes(user.locale) ? user.locale : "hu") as "hu" | "de" | "en"];
      const [subject, body] = c[kind];
      const link = deps.webAppUrl.replace(/\/+$/, "") + "/";
      const result = await deps.mailer.send({ to: user.email, subject, text: `${body}\n\n${link}\n\n${c.off}\n`, html: `<p>${body}</p><p><a href="${link}">${c.open}</a></p><p style="color:#666">${c.off}</p>` });
      (deps.log ?? console.log)(`reminder_sent kind=${kind} outcome=${result.outcome}`);
      if (result.outcome === "sent") { sent += 1; sentToday += 1; countUsage(REMINDER_USAGE_KIND, {}, at); }
    }
    await deps.prisma.profile.update({ where: { userId: p.userId }, data: { reminders: { ...r, lastSent } } });
  }
  return sent;
}

export function startReminders(deps: Parameters<typeof runReminders>[0], intervalMs = 5 * 60 * 1000) {
  const tick = () => { runReminders(deps).catch((error) => (deps.log ?? console.log)(`reminder_error ${error?.message ?? error}`)); };
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

export function remindersRouter(deps: { prisma: Db; requireAuth: express.RequestHandler; adminOnly: express.RequestHandler }) {
  const router = express.Router();
  router.get("/me/reminders", deps.requireAuth, async (req, res, next) => {
    try {
      const profile = await deps.prisma.profile.findUnique({ where: { userId: req.user!.id }, select: { reminders: true } });
      const r = profile?.reminders as Reminders | null;
      res.json({ reminders: r ? { lunchAt: r.lunchAt, dinnerAt: r.dinnerAt, timeZone: r.timeZone } : null });
    } catch (error) { next(error); }
  });
  router.put("/me/reminders", deps.requireAuth, deps.adminOnly, async (req, res, next) => {
    try {
      const user = await deps.prisma.user.findUnique({ where: { id: req.user!.id }, select: { entitlements: true } });
      if (!hasPremiumFeature(user?.entitlements ?? [], REMINDERS_FEATURE, getSettings().premiumAccess)) return res.status(403).json({ error: "premium_required" });
      const input = remindersSchema.parse(req.body);
      if (!validTimeZone(input.timeZone)) return res.status(400).json({ error: "invalid_time_zone" });
      const off = !input.lunchAt && !input.dinnerAt;
      const current = await deps.prisma.profile.findUnique({ where: { userId: req.user!.id }, select: { reminders: true } });
      const lastSent = (current?.reminders as Reminders | null)?.lastSent;
      await deps.prisma.profile.update({ where: { userId: req.user!.id }, data: { reminders: off ? Prisma.DbNull : { ...input, ...(lastSent ? { lastSent } : {}) } } });
      res.json({ reminders: off ? null : input });
    } catch (error) { next(error); }
  });
  return router;
}
