import { describe, expect, it } from "vitest";
import { exportDays } from "./export.js";

const t = (netCarbs: number) => ({ kcal: 500, fat: 40, protein: 30, carbs: netCarbs + 2, fiber: 2, netCarbs });
const meal = (id: string, iso: string, netCarbs: number) => ({ id, title: id, mealType: "lunch", mealTypeLabel: null, eatenAt: new Date(iso), totals: t(netCarbs), items: [{ id: `${id}i`, quantityGrams: 250.4, displayName: "Csirkemell", food: null, recipeId: null, snapshotNutrients: null, totals: t(netCarbs) }] }) as any;

describe("diary export", () => {
  it("groups meals by the user's local day in time order with day totals", () => {
    const days = exportDays([meal("b", "2026-10-15T23:30:00Z", 4), meal("a", "2026-10-15T10:00:00Z", 6)], -120);
    expect(days.map((d) => d.date)).toEqual(["2026-10-15", "2026-10-16"]);
    expect(days[0].meals[0]).toMatchObject({ time: "12:00", title: "a", items: [{ name: "Csirkemell", grams: 250, netCarbs: 6 }] });
    expect(days[1].meals[0].time).toBe("01:30");
    expect(days[0].totals.netCarbs).toBe(6);
  });
});
