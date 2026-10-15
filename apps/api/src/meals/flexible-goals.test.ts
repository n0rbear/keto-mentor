import { describe, expect, it } from "vitest";
import { effectiveGoals, weekdayGoalsSchema } from "@keto-mentor/shared";
import { weeklyProgress } from "../stats/progress.js";

const profile = { dailyKcal: 1800, dailyProtein: 110, dailyNetCarbs: 25, dailyFat: 130, dailyFiber: 25, weekdayGoals: { sat: { netCarbs: 50, kcal: 2200 }, sun: { netCarbs: 50 } } };

describe("rugalmas célok", () => {
  it("applies the weekday's overrides and keeps the base goal elsewhere", () => {
    expect(effectiveGoals(profile, "2026-10-17")).toMatchObject({ dailyNetCarbs: 50, dailyKcal: 2200, dailyProtein: 110 }); // Saturday
    expect(effectiveGoals(profile, "2026-10-18")).toMatchObject({ dailyNetCarbs: 50, dailyKcal: 1800 });                    // Sunday
    expect(effectiveGoals(profile, "2026-10-16")).toMatchObject({ dailyNetCarbs: 25, dailyKcal: 1800 });                    // Friday
    expect(effectiveGoals({ ...profile, weekdayGoals: { sat: { netCarbs: -3 } } }, "2026-10-17").dailyNetCarbs).toBe(25);   // invalid data: base
  });

  it("validates the input", () => {
    expect(weekdayGoalsSchema.safeParse({ mon: { netCarbs: 30 } }).success).toBe(true);
    expect(weekdayGoalsSchema.safeParse({ funday: {} }).success).toBe(false);
    expect(weekdayGoalsSchema.safeParse({ mon: { kcal: 100 } }).success).toBe(false);
  });

  it("judges each day's keto status against that day's goal", () => {
    const meal = (iso: string, nc: number) => ({ eatenAt: new Date(iso), items: [{ quantityGrams: 100, snapshotKcal: 600, snapshotFat: 40, snapshotProtein: 40, snapshotCarbs: nc, snapshotFiber: 0, snapshotNetCarbs: nc, food: null }] as any });
    const r = weeklyProgress([meal("2026-10-16T12:00:00Z", 40), meal("2026-10-17T12:00:00Z", 40)], { today: "2026-10-17", weeks: 1, tzOffsetMinutes: 0, goalNetCarbs: 25, goalNetCarbsFor: (d) => effectiveGoals(profile, d).dailyNetCarbs });
    expect(r.weeks[0]).toMatchObject({ loggedDays: 2, ketoDays: 1 });
    expect(r.streak).toBe(1);
  });
});
