import { describe, expect, it } from "vitest";
import { cappedPerRequest, RECIPE_FALLBACK_CAP, USER_FALLBACK_WINDOWS, UserResultCache, UserUsageBudget } from "./usage-budget.js";
import { AiEstimateRateLimiter } from "./ai-estimate-rate-limit.js";

describe("fallback usage budget (roadmap E3)", () => {
  it("a user gets 30 per hour, the hour resets, and 100 per day caps the total", () => {
    let now = 0;
    const budget = new UserUsageBudget(USER_FALLBACK_WINDOWS, () => now);
    for (let i = 0; i < 30; i++) expect(budget.consume("u1")).toBe(true);
    expect(budget.consume("u1")).toBe(false);
    expect(budget.consume("u2")).toBe(true);
    for (let hour = 1; hour <= 3; hour++) {
      now = hour * 3_600_000;
      for (let i = 0; i < 30; i++) budget.consume("u1");
    }
    now = 4 * 3_600_000;
    expect(budget.consume("u1")).toBe(false); // 30 + 3 x 30 = 120 > 100 per day
    now = 25 * 3_600_000;
    expect(budget.consume("u1")).toBe(true);
  });

  it("the old failure case: three unknown ingredients no longer exhaust the next dish", () => {
    const limiter = new AiEstimateRateLimiter(() => 0);
    const firstRecipe = cappedPerRequest(limiter, RECIPE_FALLBACK_CAP);
    for (let i = 0; i < 3; i++) expect(firstRecipe.consume("u1")).toBe(true);
    const secondRecipe = cappedPerRequest(limiter, RECIPE_FALLBACK_CAP);
    expect(secondRecipe.consume("u1")).toBe(true);
  });

  it("one recipe never spends more than its cap", () => {
    const capped = cappedPerRequest(new UserUsageBudget(USER_FALLBACK_WINDOWS, () => 0), RECIPE_FALLBACK_CAP);
    const results = Array.from({ length: 12 }, () => capped.consume("u1"));
    expect(results.filter(Boolean)).toHaveLength(8);
  });

  it("the result cache is per user, expires after a day and stays bounded", () => {
    let now = 0;
    const cache = new UserResultCache<string>(86_400_000, 2, () => now);
    cache.set("u1", "virsli", "estimate");
    expect(cache.get("u1", "virsli")).toBe("estimate");
    expect(cache.get("u2", "virsli")).toBeUndefined();
    cache.set("u1", "a", "x"); cache.set("u1", "b", "y");
    expect(cache.get("u1", "virsli")).toBeUndefined();
    now = 86_400_000;
    expect(cache.get("u1", "b")).toBeUndefined();
  });
});
