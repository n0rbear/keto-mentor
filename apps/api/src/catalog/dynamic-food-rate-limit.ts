import { EXTERNAL_FOOD_RATE_LIMIT } from "./external-food-rate-limit.js";

/**
 * Gates the automatic local-miss -> search-intent -> external-search path
 * triggered from inside /meal-input/interpret. Separate instance from the
 * manual "Search trusted external sources" button's Express middleware
 * (same window/limit values for consistency) since this one is consulted
 * per meal-input item, not per HTTP request, and must survive across the
 * deterministic and AI-understanding resolution paths within one process.
 */
export class DynamicFoodResolutionRateLimiter {
  private readonly buckets = new Map<string, { startsAt: number; count: number }>();
  private readonly limit: { windowMs: number; limit: number };

  // Owner-beta (2026-09-14): `limit` is an explicit override (defaulting to
  // the original EXTERNAL_FOOD_RATE_LIMIT, so every existing caller/test is
  // byte-for-byte unchanged) so a second, more generously-sized instance can
  // be constructed for recipe-ingredient resolution — see
  // RECIPE_INGREDIENT_DYNAMIC_RATE_LIMIT — without touching this one's
  // original per-meal abuse protection.
  constructor(private readonly now: () => number = Date.now, limit: { windowMs: number; limit: number } = EXTERNAL_FOOD_RATE_LIMIT) {
    this.limit = limit;
  }

  consume(userId: string) {
    if (!userId) throw new Error("Authenticated user required before dynamic food resolution rate limiting");
    const current = this.now();
    const existing = this.buckets.get(userId);
    const bucket = !existing || current - existing.startsAt >= this.limit.windowMs
      ? { startsAt: current, count: 0 }
      : existing;
    if (bucket.count >= this.limit.limit) return false;
    bucket.count += 1;
    this.buckets.set(userId, bucket);
    return true;
  }
}
