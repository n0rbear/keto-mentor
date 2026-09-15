import { describe, expect, it } from "vitest";
import { addMacros, emptyMacros, scaleMacros, scaleMacroTotals } from "./nutrition-core.js";

describe("scaleMacros vs scaleMacroTotals", () => {
  it("scaleMacros computes netCarbs fresh from raw carbs/fiber — correct for a single ingredient's own per-100g values", () => {
    const result = scaleMacros({ kcal: 50, fat: 1, protein: 1, carbs: 2, fiber: 5 }, 1);
    expect(result.netCarbs).toBe(0); // clamped: fiber (5) exceeds carbs (2)
  });

  // Owner-beta checkpoint (2026-09-16) — final recipe nutrition review: the
  // real bug this fixes. Re-applying scaleMacros to an ALREADY-AGGREGATED
  // total re-clamps netCarbs a second time from the aggregate's raw
  // carbs/fiber, which can silently disagree with the sum of each
  // ingredient's own (already-clamped) netCarbs.
  it("scaleMacroTotals scales an already-computed total's netCarbs LINEARLY, never re-clamping it", () => {
    const husk = scaleMacros({ kcal: 50, fat: 1, protein: 1, carbs: 2, fiber: 5 }, 1); // netCarbs clamps to 0
    const grain = scaleMacros({ kcal: 80, fat: 2, protein: 2, carbs: 10, fiber: 1 }, 1); // netCarbs = 9
    const total = addMacros(addMacros(emptyMacros(), husk), grain);
    expect(total.netCarbs).toBe(9); // sum of each ingredient's own clamp

    // scaleMacros (the wrong function to use here) would re-derive netCarbs
    // from the aggregate's raw carbs (12) and fiber (6): max(0, 6-3) = 3 at
    // factor 0.5 — silently disagreeing with total.netCarbs / 2 = 4.5.
    const wrongly = scaleMacros(total, 0.5);
    expect(wrongly.netCarbs).toBe(3);

    // scaleMacroTotals scales the already-correct netCarbs directly.
    const correctly = scaleMacroTotals(total, 0.5);
    expect(correctly.netCarbs).toBe(4.5);
    expect(correctly.netCarbs).toBe(total.netCarbs * 0.5);
  });

  it("scaleMacroTotals still scales kcal/fat/protein/carbs/fiber identically to scaleMacros", () => {
    const total = { kcal: 400, fat: 20, protein: 30, carbs: 40, fiber: 10, netCarbs: 30 };
    const viaMacroTotals = scaleMacroTotals(total, 0.25);
    expect(viaMacroTotals).toEqual({ kcal: 100, fat: 5, protein: 7.5, carbs: 10, fiber: 2.5, netCarbs: 7.5 });
  });
});
