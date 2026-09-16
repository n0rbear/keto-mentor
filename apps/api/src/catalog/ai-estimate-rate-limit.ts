// The final, most expensive fallback tier — only ever reached after local,
// authoritative-adapter, AND web-evidence resolution have all genuinely
// failed. Its own independent, tight budget (separate from
// WebEvidenceFallbackRateLimiter) so a user spamming unresolvable queries
// can't run up AI estimation calls at a higher rate than intended, even if
// they've already exhausted the web-evidence budget for other queries.
export const AI_ESTIMATE_RATE_LIMIT = Object.freeze({ windowMs: 15 * 60 * 1000, limit: 3 });

export class AiEstimateRateLimiter {
  private readonly buckets = new Map<string, { startsAt: number; count: number }>();
  constructor(private readonly now: () => number = Date.now) {}
  consume(userId: string) {
    if (!userId) throw new Error("Authenticated user required before AI-estimate rate limiting");
    const current = this.now();
    const existing = this.buckets.get(userId);
    const bucket = !existing || current - existing.startsAt >= AI_ESTIMATE_RATE_LIMIT.windowMs ? { startsAt: current, count: 0 } : existing;
    if (bucket.count >= AI_ESTIMATE_RATE_LIMIT.limit) return false;
    bucket.count += 1;
    this.buckets.set(userId, bucket);
    return true;
  }
}
