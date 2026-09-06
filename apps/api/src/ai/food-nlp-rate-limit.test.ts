import { describe, expect, it, vi } from "vitest";
import { FOOD_NLP_RATE_LIMIT, FoodNlpUserRateLimiter, rateLimitedFoodNlpProvider } from "./food-nlp-rate-limit.js";

describe("AI food-NLP rate limiting", () => {
  it("allows 25 calls per 15-minute user window and isolates users", () => {
    let now = 1_000;
    const limiter = new FoodNlpUserRateLimiter(() => now);
    for (let index = 0; index < FOOD_NLP_RATE_LIMIT.limit; index++) limiter.consume("user-a");
    expect(() => limiter.consume("user-a")).toThrow("food_nlp_rate_limited");
    expect(() => limiter.consume("user-b")).not.toThrow();
    now += FOOD_NLP_RATE_LIMIT.windowMs;
    expect(() => limiter.consume("user-a")).not.toThrow();
  });

  it("consumes quota only when food_nlp is actually called", async () => {
    const consume = vi.fn();
    const limiter = { consume } as unknown as FoodNlpUserRateLimiter;
    const provider = { id: "mock", supports: () => true, run: vi.fn(async () => ({ ok: true })) };
    const wrapped = rateLimitedFoodNlpProvider(provider, limiter, "user-a");
    await wrapped.run("recipe", {});
    expect(consume).not.toHaveBeenCalled();
    await wrapped.run("food_nlp", {});
    expect(consume).toHaveBeenCalledOnce();
  });

  it("requires an authenticated user identity", () => {
    expect(() => new FoodNlpUserRateLimiter().consume("")).toThrow("Authenticated user required");
  });
});
