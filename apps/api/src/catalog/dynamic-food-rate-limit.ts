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

  constructor(private readonly now: () => number = Date.now) {}

  consume(userId: string) {
    if (!userId) throw new Error("Authenticated user required before dynamic food resolution rate limiting");
    const current = this.now();
    const existing = this.buckets.get(userId);
    const bucket = !existing || current - existing.startsAt >= EXTERNAL_FOOD_RATE_LIMIT.windowMs
      ? { startsAt: current, count: 0 }
      : existing;
    if (bucket.count >= EXTERNAL_FOOD_RATE_LIMIT.limit) return false;
    bucket.count += 1;
    this.buckets.set(userId, bucket);
    return true;
  }
}
