import { describe, expect, it } from "vitest";
import { localDay, mondayOf, weeklyProgress } from "./progress.js";

const meal = (iso: string, netCarbs: number, kcal = 600, protein = 40) => ({
  eatenAt: new Date(iso),
  items: [{ quantityGrams: 100, snapshotKcal: kcal, snapshotFat: 40, snapshotProtein: protein, snapshotCarbs: netCarbs, snapshotFiber: 0, snapshotNetCarbs: netCarbs, food: null }] as any
});

describe("haladó statisztika", () => {
  it("uses the user's local day and Monday weeks", () => {
    expect(localDay(new Date("2026-10-15T22:30:00Z"), -120)).toBe("2026-10-16");
    expect(mondayOf("2026-10-18")).toBe("2026-10-12");
    expect(mondayOf("2026-10-12")).toBe("2026-10-12");
  });

  it("counts keto days per week, weekly averages and the current streak", () => {
    const meals = [
      meal("2026-10-13T10:00:00Z", 10), meal("2026-10-13T18:00:00Z", 10), // 20 g: keto
      meal("2026-10-14T12:00:00Z", 30),                                    // over
      meal("2026-10-15T12:00:00Z", 15), meal("2026-10-16T12:00:00Z", 5),  // keto, keto
      meal("2026-10-06T12:00:00Z", 12)                                     // previous week
    ];
    const r = weeklyProgress(meals, { today: "2026-10-16", weeks: 3, tzOffsetMinutes: 0, goalNetCarbs: 25 });
    expect(r.weeks.map((w) => w.weekStart)).toEqual(["2026-09-28", "2026-10-05", "2026-10-12"]);
    expect(r.weeks[0]).toMatchObject({ loggedDays: 0, percent: null, avg: null });
    expect(r.weeks[1]).toMatchObject({ loggedDays: 1, ketoDays: 1, percent: 100 });
    expect(r.weeks[2]).toMatchObject({ loggedDays: 4, ketoDays: 3, percent: 75, avg: { kcal: 750, protein: 50, netCarbs: 17.5 } });
    expect(r.streak).toBe(2);
    expect(r.percent).toBe(80);
  });
});
