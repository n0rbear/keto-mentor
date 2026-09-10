// A separate, narrower budget than dynamic Food resolution's own limiter —
// web-knowledge discovery is strictly more expensive (a real third-party
// search credit, not just a local DB query) and is a genuine fallback of
// last resort, so it earns its own, tighter allowance.
export const WEB_KNOWLEDGE_SEARCH_RATE_LIMIT = Object.freeze({ windowMs: 15 * 60 * 1000, limit: 5 });

export class WebKnowledgeSearchRateLimiter {
  private readonly buckets = new Map<string, { startsAt: number; count: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  consume(userId: string) {
    if (!userId) throw new Error("Authenticated user required before web-knowledge search rate limiting");
    const current = this.now();
    const existing = this.buckets.get(userId);
    const bucket = !existing || current - existing.startsAt >= WEB_KNOWLEDGE_SEARCH_RATE_LIMIT.windowMs
      ? { startsAt: current, count: 0 }
      : existing;
    if (bucket.count >= WEB_KNOWLEDGE_SEARCH_RATE_LIMIT.limit) return false;
    bucket.count += 1;
    this.buckets.set(userId, bucket);
    return true;
  }
}
