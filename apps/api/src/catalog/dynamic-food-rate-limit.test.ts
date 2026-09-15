import { describe, expect, it } from "vitest";
import { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";
import { EXTERNAL_FOOD_RATE_LIMIT, RECIPE_INGREDIENT_DYNAMIC_RATE_LIMIT } from "./external-food-rate-limit.js";

describe("DynamicFoodResolutionRateLimiter", () => {
  it("defaults to EXTERNAL_FOOD_RATE_LIMIT when no override is given, unchanged from before this checkpoint", () => {
    const limiter = new DynamicFoodResolutionRateLimiter(() => 0);
    for (let i = 0; i < EXTERNAL_FOOD_RATE_LIMIT.limit; i++) expect(limiter.consume("user-1")).toBe(true);
    expect(limiter.consume("user-1")).toBe(false);
  });

  // Owner-beta (2026-09-14): live pre-merge validation proved a single real
  // recipe candidate (8-12 ingredients) exhausted the default 10/15min
  // budget partway through its own ingredient resolution, failing later
  // ingredients with reason="rate_limited" regardless of whether they were
  // actually resolvable. This proves the override lets a second,
  // appropriately-sized instance exist for that specific bounded use.
  it("accepts an explicit {windowMs, limit} override — proves recipeIngredientDynamicResolutionLimiter's larger budget actually works", () => {
    const limiter = new DynamicFoodResolutionRateLimiter(() => 0, RECIPE_INGREDIENT_DYNAMIC_RATE_LIMIT);
    for (let i = 0; i < RECIPE_INGREDIENT_DYNAMIC_RATE_LIMIT.limit; i++) expect(limiter.consume("user-1")).toBe(true);
    expect(limiter.consume("user-1")).toBe(false);
    // Meaningfully larger than the ordinary per-meal budget — this is the
    // whole point of the override existing.
    expect(RECIPE_INGREDIENT_DYNAMIC_RATE_LIMIT.limit).toBeGreaterThan(EXTERNAL_FOOD_RATE_LIMIT.limit);
  });

  it("a small custom limit rejects strictly after that many calls within the window, and resets once the window elapses", () => {
    let now = 0;
    const limiter = new DynamicFoodResolutionRateLimiter(() => now, { windowMs: 1000, limit: 3 });
    expect(limiter.consume("user-1")).toBe(true);
    expect(limiter.consume("user-1")).toBe(true);
    expect(limiter.consume("user-1")).toBe(true);
    expect(limiter.consume("user-1")).toBe(false);
    now = 1001;
    expect(limiter.consume("user-1")).toBe(true);
  });

  it("buckets are per-user and per-instance — a custom-limit instance never shares budget with a default instance", () => {
    const defaultLimiter = new DynamicFoodResolutionRateLimiter(() => 0);
    const customLimiter = new DynamicFoodResolutionRateLimiter(() => 0, { windowMs: 1000, limit: 1 });
    expect(customLimiter.consume("user-1")).toBe(true);
    expect(customLimiter.consume("user-1")).toBe(false);
    // The default-limit instance for the SAME user is a completely separate
    // budget — exhausting the custom one must not affect it.
    expect(defaultLimiter.consume("user-1")).toBe(true);
  });
});
