import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { getMealsForDay } from "./diary-query.js";
import { resolveDiaryDateRange } from "./diary-date.js";

const range = resolveDiaryDateRange({ date: "2026-09-06" }, new Date("2026-09-06T12:00:00Z"));

const food = { kcalPer100g: 200, fatPer100g: 15, proteinPer100g: 14, carbsPer100g: 1, fiberPer100g: 0 };

function fakePrisma(mealsByUser: Record<string, any[]>) {
  let capturedWhere: any;
  const client = {
    meal: {
      findMany: async ({ where }: any) => {
        capturedWhere = where;
        return mealsByUser[where.userId] ?? [];
      }
    }
  } as unknown as Pick<PrismaClient, "meal">;
  return { client, where: () => capturedWhere };
}

describe("getMealsForDay", () => {
  it("scopes the query to exactly the requesting user's id", async () => {
    const fake = fakePrisma({});
    await getMealsForDay(fake.client, "user-a", range, "summary");
    expect(fake.where().userId).toBe("user-a");
    expect(fake.where().eatenAt).toEqual({ gte: range.start, lt: range.end });
  });

  it("never returns another user's meals even if present in the data source", async () => {
    const fake = fakePrisma({
      "user-a": [{ id: "m1", title: "Lunch", eatenAt: new Date(), items: [{ quantityGrams: 100, snapshotKcal: null, snapshotFat: null, snapshotProtein: null, snapshotCarbs: null, snapshotFiber: null, food }] }],
      "user-b": [{ id: "m2", title: "Someone else's lunch", eatenAt: new Date(), items: [] }]
    });
    const result = await getMealsForDay(fake.client, "user-a", range, "summary");
    expect(result.meals).toHaveLength(1);
    expect(result.meals[0].id).toBe("m1");
  });

  it("returns a sensible empty result for a day with no meals", async () => {
    const fake = fakePrisma({});
    const result = await getMealsForDay(fake.client, "user-a", range, "summary");
    expect(result).toEqual({ date: "2026-09-06", meals: [], totals: { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 } });
  });

  it("sums totals correctly across multiple meals and items", async () => {
    const fake = fakePrisma({
      "user-a": [
        { id: "m1", title: "Breakfast", eatenAt: new Date(), items: [{ quantityGrams: 100, snapshotKcal: null, snapshotFat: null, snapshotProtein: null, snapshotCarbs: null, snapshotFiber: null, food }] },
        { id: "m2", title: "Lunch", eatenAt: new Date(), items: [{ quantityGrams: 200, snapshotKcal: null, snapshotFat: null, snapshotProtein: null, snapshotCarbs: null, snapshotFiber: null, food }] }
      ]
    });
    const result = await getMealsForDay(fake.client, "user-a", range, "summary");
    // 100g @ 200 kcal/100g (=200) + 200g @ 200 kcal/100g (=400) => 600 kcal total.
    expect(result.totals.kcal).toBe(600);
  });

  it("uses a narrow select (not a full include) for the summary view", async () => {
    let usedSelect = false;
    let usedInclude = false;
    const client = {
      meal: { findMany: async (args: any) => { usedSelect = !!args.select; usedInclude = !!args.include; return []; } }
    } as unknown as Pick<PrismaClient, "meal">;
    await getMealsForDay(client, "user-a", range, "summary");
    expect(usedSelect).toBe(true);
    expect(usedInclude).toBe(false);
  });

  it("uses a full include for the detailed view", async () => {
    let usedSelect = false;
    let usedInclude = false;
    const client = {
      meal: { findMany: async (args: any) => { usedSelect = !!args.select; usedInclude = !!args.include; return []; } }
    } as unknown as Pick<PrismaClient, "meal">;
    await getMealsForDay(client, "user-a", range, "detailed");
    expect(usedSelect).toBe(false);
    expect(usedInclude).toBe(true);
  });
});
