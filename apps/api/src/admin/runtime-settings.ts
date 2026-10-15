import { z } from "zod";

// Admin-editable runtime settings (owner request 2026-10-15). Stored in
// ketomentor.AppSetting, held in memory (single API instance), loaded at
// boot and replaced when the admin saves. Defaults are the values the code
// used before the admin screen existed.

export const aiLimitsSchema = z.object({
  perHour: z.number().int().min(0).max(1000),
  perDay: z.number().int().min(0).max(10000),
  perRecipe: z.number().int().min(0).max(50),
  // "Bővebb AI-keretek" (premium, 2026-10-16): the larger allowance for
  // premium users (everyone while premiumAccess is "beta_all").
  premiumPerHour: z.number().int().min(0).max(1000).default(60),
  premiumPerDay: z.number().int().min(0).max(10000).default(200)
});
export const announcementSchema = z.object({
  enabled: z.boolean(),
  hu: z.string().max(300),
  de: z.string().max(300),
  en: z.string().max(300)
});
export const settingsSchema = z.object({
  registrationOpen: z.boolean(),
  announcement: announcementSchema,
  aiLimits: aiLimitsSchema,
  // Premium features while there is no payment yet (2026-10-15): "beta_all"
  // lets every signed-in user try them, "premium_only" needs an entitlement.
  premiumAccess: z.enum(["beta_all", "premium_only"]).default("beta_all")
});
export type AppSettings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: AppSettings = Object.freeze({
  registrationOpen: true,
  announcement: { enabled: false, hu: "", de: "", en: "" },
  aiLimits: { perHour: 30, perDay: 100, perRecipe: 8, premiumPerHour: 60, premiumPerDay: 200 },
  premiumAccess: "beta_all"
}) as AppSettings;

let current: AppSettings = structuredClone(DEFAULT_SETTINGS);

export const getSettings = (): AppSettings => current;
export function setSettings(next: AppSettings) { current = settingsSchema.parse(next); }
export function resetSettingsForTests() { current = structuredClone(DEFAULT_SETTINGS); }

type SettingsDb = {
  appSetting: { findMany(args?: any): Promise<Array<{ key: string; value: unknown }>>; upsert(args: any): Promise<unknown> };
};

/** Merges stored rows over the defaults; an unreadable row keeps its default. */
export async function loadSettings(prisma: SettingsDb): Promise<AppSettings> {
  const rows = await prisma.appSetting.findMany();
  const merged: any = structuredClone(DEFAULT_SETTINGS);
  for (const row of rows) {
    if (!(row.key in merged)) continue;
    const field = (settingsSchema.shape as any)[row.key];
    const parsed = field.safeParse(row.value);
    if (parsed.success) merged[row.key] = parsed.data;
  }
  setSettings(merged);
  return current;
}

export async function saveSettings(prisma: SettingsDb, next: AppSettings): Promise<AppSettings> {
  const valid = settingsSchema.parse(next);
  for (const key of Object.keys(valid) as Array<keyof AppSettings>) {
    await prisma.appSetting.upsert({ where: { key }, create: { key, value: valid[key] as any }, update: { value: valid[key] as any } });
  }
  setSettings(valid);
  return current;
}

// Users with an active premium entitlement (plan premium or feature
// "ai_plus"), refreshed from the database every few minutes so the budget
// check stays synchronous.
const AI_PLUS_FEATURE = "ai_plus";
let premiumUsers = new Set<string>();
export function setPremiumUsersForTests(ids: string[]) { premiumUsers = new Set(ids); }
export async function refreshPremiumUsers(prisma: { entitlement: { findMany(args: any): Promise<Array<{ userId: string }>> } }, now = new Date()) {
  const rows = await prisma.entitlement.findMany({
    where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }], AND: [{ OR: [{ plan: "premium" }, { features: { has: AI_PLUS_FEATURE } }] }] },
    select: { userId: true }
  });
  premiumUsers = new Set(rows.map((row) => row.userId));
}
export function startPremiumUsersRefresher(prisma: Parameters<typeof refreshPremiumUsers>[0], intervalMs = 5 * 60 * 1000) {
  const run = () => { refreshPremiumUsers(prisma).catch(() => undefined); };
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
export const hasAiPlus = (userId?: string) => current.premiumAccess === "beta_all" || (!!userId && premiumUsers.has(userId));

/** The per-user windows the AI-estimate and web-evidence budgets read on every call. */
export const userFallbackWindows = (userId?: string) => {
  const plus = hasAiPlus(userId);
  return [
    { windowMs: 60 * 60 * 1000, limit: plus ? Math.max(current.aiLimits.premiumPerHour, current.aiLimits.perHour) : current.aiLimits.perHour },
    { windowMs: 24 * 60 * 60 * 1000, limit: plus ? Math.max(current.aiLimits.premiumPerDay, current.aiLimits.perDay) : current.aiLimits.perDay }
  ];
};
