import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getWeekOverview } from "./week-query.js";
import { resolveWeekRange } from "./diary-date.js";

const week = resolveWeekRange({ date: "2026-09-09" }, new Date("2026-09-10T12:00:00Z"));
// week.days = [09-07 Mon, 09-08 Tue, 09-09 Wed, 09-10 Thu, 09-11 Fri, 09-12 Sat, 09-13 Sun]

const food = { kcalPer100g: 200, fatPer100g: 15, proteinPer100g: 14, carbsPer100g: 10, fiberPer100g: 4 };
const emptyTotals = { kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 };

function foodItem(quantityGrams: number) {
  return { quantityGrams, snapshotKcal: null, snapshotFat: null, snapshotProtein: null, snapshotCarbs: null, snapshotFiber: null, food };
}

function snapshotItem(overrides: Partial<{ kcal: number; fat: number; protein: number; carbs: number; fiber: number }>) {
  return {
    quantityGrams: 1,
    snapshotKcal: overrides.kcal ?? 300, snapshotFat: overrides.fat ?? 20,
    snapshotProtein: overrides.protein ?? 25, snapshotCarbs: overrides.carbs ?? 8, snapshotFiber: overrides.fiber ?? 3,
    food: null
  };
}

function fakePrisma(meals: Array<{ eatenAt: Date; items: any[] }>) {
  let capturedWhere: any;
  const client = {
    meal: {
      findMany: async ({ where }: any) => { capturedWhere = where; return meals; }
    }
  } as unknown as Pick<PrismaClient, "meal">;
  return { client, where: () => capturedWhere };
}

describe("getWeekOverview", () => {
  it("scopes the query to exactly the requesting user's id with one bounded findMany call", async () => {
    let callCount = 0;
    const client = {
      meal: { findMany: async ({ where }: any) => { callCount += 1; expect(where.userId).toBe("user-a"); expect(where.eatenAt).toEqual({ gte: week.start, lt: week.end }); return []; } }
    } as unknown as Pick<PrismaClient, "meal">;
    await getWeekOverview(client, "user-a", week);
    expect(callCount).toBe(1); // never 7 separate day queries
  });

  it("returns all 7 days as zeros when nothing was logged", async () => {
    const fake = fakePrisma([]);
    const result = await getWeekOverview(fake.client, "user-a", week);
    expect(result.days).toHaveLength(7);
    expect(result.days.map((d) => d.date)).toEqual(week.days);
    for (const day of result.days) expect(day).toEqual({ date: day.date, mealCount: 0, ...emptyTotals });
    expect(result.summary).toEqual({ mealCount: 0, loggedDays: 0 });
  });

  it("buckets a catalog-Food-backed meal into the correct day", async () => {
    const fake = fakePrisma([{ eatenAt: new Date("2026-09-09T12:00:00Z"), items: [foodItem(100)] }]);
    const result = await getWeekOverview(fake.client, "user-a", week);
    const wed = result.days.find((d) => d.date === "2026-09-09")!;
    expect(wed.mealCount).toBe(1);
    expect(wed.kcal).toBe(200); // 100g @ 200 kcal/100g
    expect(wed.netCarbs).toBe(6); // carbs 10 - fiber 4
    for (const other of result.days.filter((d) => d.date !== "2026-09-09")) {
      expect(other).toEqual({ date: other.date, mealCount: 0, ...emptyTotals });
    }
  });

  it("buckets a recipe-snapshot-backed meal into the correct day without recalculating its nutrition", async () => {
    const fake = fakePrisma([{ eatenAt: new Date("2026-09-11T08:00:00Z"), items: [snapshotItem({ kcal: 450, carbs: 12, fiber: 5 })] }]);
    const result = await getWeekOverview(fake.client, "user-a", week);
    const fri = result.days.find((d) => d.date === "2026-09-11")!;
    expect(fri.kcal).toBe(450);
    expect(fri.netCarbs).toBe(7); // 12 - 5
  });

  it("sums multiple meals on the same day", async () => {
    const fake = fakePrisma([
      { eatenAt: new Date("2026-09-07T07:00:00Z"), items: [foodItem(100)] },
      { eatenAt: new Date("2026-09-07T19:00:00Z"), items: [foodItem(200)] }
    ]);
    const result = await getWeekOverview(fake.client, "user-a", week);
    const mon = result.days.find((d) => d.date === "2026-09-07")!;
    expect(mon.mealCount).toBe(2);
    expect(mon.kcal).toBe(600); // 200 + 400
  });

  it("computes summary.mealCount and summary.loggedDays across the whole week", async () => {
    const fake = fakePrisma([
      { eatenAt: new Date("2026-09-07T07:00:00Z"), items: [foodItem(100)] },
      { eatenAt: new Date("2026-09-07T19:00:00Z"), items: [foodItem(100)] },
      { eatenAt: new Date("2026-09-10T12:00:00Z"), items: [foodItem(100)] }
    ]);
    const result = await getWeekOverview(fake.client, "user-a", week);
    expect(result.summary).toEqual({ mealCount: 3, loggedDays: 2 });
  });

  it("never returns another user's meals (query is scoped, buckets only reflect what findMany returned)", async () => {
    const fake = fakePrisma([]); // simulates the where-clause already having excluded user-b's meals
    const result = await getWeekOverview(fake.client, "user-a", week);
    expect(result.summary.mealCount).toBe(0);
  });

  it("correctly attributes a meal logged right at the week's Monday start boundary", async () => {
    const fake = fakePrisma([{ eatenAt: week.start, items: [foodItem(100)] }]);
    const result = await getWeekOverview(fake.client, "user-a", week);
    expect(result.days[0].mealCount).toBe(1);
  });

  it("uses a narrow select, not a full include", async () => {
    let usedSelect = false;
    let usedInclude = false;
    const client = {
      meal: { findMany: async (args: any) => { usedSelect = !!args.select; usedInclude = !!args.include; return []; } }
    } as unknown as Pick<PrismaClient, "meal">;
    await getWeekOverview(client, "user-a", week);
    expect(usedSelect).toBe(true);
    expect(usedInclude).toBe(false);
  });

  it("returns the resolved weekStart/weekEnd on the result", async () => {
    const fake = fakePrisma([]);
    const result = await getWeekOverview(fake.client, "user-a", week);
    expect(result.weekStart).toBe("2026-09-07");
    expect(result.weekEnd).toBe("2026-09-13");
  });
});
