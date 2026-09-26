/**
 * Per-user budgets for the expensive last-resort food lookups (owner-approved
 * 2026-09-26, roadmap E3). The old 3-per-15-minutes limit counted every
 * ingredient separately, so one recipe with three unknown ingredients used
 * the whole budget and the next dish stalled (live paprikás krumpli runs).
 *
 * Now: at most RECIPE_FALLBACK_CAP per recipe (see cappedPerRequest), and per
 * user at most 30 per hour and 100 per day. Budgets live in memory (single
 * API instance); a restart resets them, which only ever errs on the
 * generous side.
 */
export type BudgetWindow = { windowMs: number; limit: number };
export type UsageLimiter = { consume(userId: string): boolean };

export const USER_FALLBACK_WINDOWS: readonly BudgetWindow[] = Object.freeze([
  Object.freeze({ windowMs: 60 * 60 * 1000, limit: 30 }),
  Object.freeze({ windowMs: 24 * 60 * 60 * 1000, limit: 100 })
]);
export const RECIPE_FALLBACK_CAP = 8;

export class UserUsageBudget implements UsageLimiter {
  private readonly buckets = new Map<string, Array<{ startsAt: number; count: number }>>();
  constructor(private readonly windows: readonly BudgetWindow[], private readonly now: () => number = Date.now) {}

  consume(userId: string): boolean {
    if (!userId) throw new Error("Authenticated user required before usage budgeting");
    const current = this.now();
    const buckets = this.windows.map((window, index) => {
      const existing = this.buckets.get(userId)?.[index];
      return !existing || current - existing.startsAt >= window.windowMs ? { startsAt: current, count: 0 } : existing;
    });
    if (buckets.some((bucket, index) => bucket.count >= this.windows[index].limit)) return false;
    for (const bucket of buckets) bucket.count += 1;
    this.buckets.set(userId, buckets);
    return true;
  }
}

/** A request-scoped cap in front of a user budget: one recipe never spends more than `cap`. */
export function cappedPerRequest(inner: UsageLimiter, cap: number): UsageLimiter {
  let used = 0;
  return {
    consume(userId: string) {
      if (used >= cap) return false;
      if (!inner.consume(userId)) return false;
      used += 1;
      return true;
    }
  };
}

/**
 * Remembers a per-user result for an identity for a day, so the same unknown
 * ingredient in a repeated recipe neither calls the AI again nor spends
 * budget. Bounded; the oldest entries go first.
 */
export class UserResultCache<T> {
  private readonly entries = new Map<string, { at: number; value: T }>();
  constructor(private readonly ttlMs = 24 * 60 * 60 * 1000, private readonly maxEntries = 5000, private readonly now: () => number = Date.now) {}
  private key(userId: string, identity: string) { return `${userId}\u0000${identity}`; }
  get(userId: string, identity: string): T | undefined {
    const key = this.key(userId, identity);
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (this.now() - entry.at >= this.ttlMs) { this.entries.delete(key); return undefined; }
    return entry.value;
  }
  set(userId: string, identity: string, value: T) {
    const key = this.key(userId, identity);
    this.entries.delete(key);
    this.entries.set(key, { at: this.now(), value });
    while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value!);
  }
}
