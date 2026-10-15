// Mirror of @keto-mentor/shared effectiveGoals (the web imports only types
// from the shared package): the targets for one day with that weekday's
// flexible-goal overrides (premium, 2026-10-16).
export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];
export type DayGoal = { kcal?: number; netCarbs?: number; protein?: number; fat?: number };
export type WeekdayGoals = Partial<Record<WeekdayKey, DayGoal>>;
export type Goals = { dailyKcal: number; dailyProtein: number; dailyNetCarbs: number; dailyFat: number; dailyFiber: number };

export const weekdayOf = (date: string): WeekdayKey => WEEKDAY_KEYS[(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7];

export function effectiveGoals(profile: (Partial<Goals> & { weekdayGoals?: WeekdayGoals | null }) | null | undefined, date: string): Goals {
  const base: Goals = { dailyKcal: profile?.dailyKcal ?? 1800, dailyProtein: profile?.dailyProtein ?? 110, dailyNetCarbs: profile?.dailyNetCarbs ?? 25, dailyFat: profile?.dailyFat ?? 130, dailyFiber: profile?.dailyFiber ?? 25 };
  const day = profile?.weekdayGoals?.[weekdayOf(date)];
  if (!day || typeof day !== "object") return base;
  const ok = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;
  return { ...base, dailyKcal: ok(day.kcal) ? day.kcal! : base.dailyKcal, dailyProtein: ok(day.protein) ? day.protein! : base.dailyProtein, dailyNetCarbs: ok(day.netCarbs) ? day.netCarbs! : base.dailyNetCarbs, dailyFat: ok(day.fat) ? day.fat! : base.dailyFat };
}
