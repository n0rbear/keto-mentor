import { describe, expect, it } from "vitest";
import { ketoAdherence } from "./keto-adherence.js";

const item = (netCarbs: number) => ({ quantityGrams: 100, snapshotKcal: 100, snapshotFat: 5, snapshotProtein: 5, snapshotCarbs: netCarbs + 2, snapshotFiber: 2, snapshotNetCarbs: netCarbs, food: null });
const meal = (userId: string, iso: string, ...nets: number[]) => ({ userId, eatenAt: new Date(iso), items: nets.map(item) });

describe("keto adherence (owner request 2026-10-15)", () => {
  it("sums each user's day like the diary and compares it with that user's own goal", () => {
    const result = ketoAdherence([
      meal("anna", "2026-10-13T08:00:00Z", 10), meal("anna", "2026-10-13T18:00:00Z", 10), // 20 <= 25
      meal("anna", "2026-10-14T12:00:00Z", 20, 10),                                      // 30 > 25
      meal("anna", "2026-10-15T12:00:00Z", 25),                                          // exactly the goal counts
      meal("bela", "2026-10-15T12:00:00Z", 40)                                           // 40 <= 50 (own goal)
    ], new Map([["anna", 25], ["bela", 50]]));
    expect(result).toMatchObject({ loggedDays: 4, adherentDays: 3, percent: 75, users: 2, usersMostlyAdherent: 1 });
    expect(result.perUser[0]).toEqual({ userId: "anna", days: 3, adherentDays: 2, percent: 67, avgNetCarbs: 25, goal: 25 });
    expect(result.perUser[1]).toMatchObject({ userId: "bela", percent: 100, goal: 50 });
  });

  it("uses the legacy carbs minus fiber and the default goal when nothing else is known", () => {
    const legacy = { ...item(0), snapshotNetCarbs: null, snapshotCarbs: 30, snapshotFiber: 4 };
    expect(ketoAdherence([{ userId: "x", eatenAt: new Date("2026-10-15T10:00:00Z"), items: [legacy] }], new Map())).toMatchObject({ percent: 0, perUser: [{ avgNetCarbs: 26, goal: 25 }] });
    expect(ketoAdherence([], new Map())).toMatchObject({ loggedDays: 0, percent: null, users: 0 });
  });
});
