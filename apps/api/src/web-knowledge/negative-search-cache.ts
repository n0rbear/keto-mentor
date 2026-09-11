/**
 * "We already searched for this concept and found nothing usable" — a
 * short-lived, in-memory, process-local cache (not a DB table: intentionally
 * cheap and intentionally forgets on restart, so a genuine future web-
 * coverage improvement for the same phrase is never permanently blocked).
 * Never stores raw meal text as the key — only the already-normalized phrase,
 * same convention as every other cache/rate-limit key in this codebase.
 */
export class NegativeSearchCache {
  private readonly entries = new Map<string, number>();

  constructor(private readonly ttlMs = 24 * 60 * 60 * 1000, private readonly now: () => number = Date.now) {}

  has(normalizedKey: string): boolean {
    const expiresAt = this.entries.get(normalizedKey);
    if (expiresAt === undefined) return false;
    if (expiresAt <= this.now()) {
      this.entries.delete(normalizedKey);
      return false;
    }
    return true;
  }

  set(normalizedKey: string): void {
    this.entries.set(normalizedKey, this.now() + this.ttlMs);
  }
}
