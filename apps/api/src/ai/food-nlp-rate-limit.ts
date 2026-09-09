import type { AiCapability, AiProvider } from "./provider.js";

export const FOOD_NLP_RATE_LIMIT = Object.freeze({ windowMs: 15 * 60 * 1000, limit: 25 });

export class FoodNlpUserRateLimiter {
  private readonly buckets = new Map<string, { startsAt: number; count: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  consume(userId: string) {
    if (!userId) throw new Error("Authenticated user required before AI food-NLP rate limiting");
    const current = this.now();
    const existing = this.buckets.get(userId);
    const bucket = !existing || current - existing.startsAt >= FOOD_NLP_RATE_LIMIT.windowMs
      ? { startsAt: current, count: 0 }
      : existing;
    if (bucket.count >= FOOD_NLP_RATE_LIMIT.limit) throw new Error("food_nlp_rate_limited");
    bucket.count += 1;
    this.buckets.set(userId, bucket);
  }
}

export function rateLimitedFoodNlpProvider(provider: AiProvider, limiter: FoodNlpUserRateLimiter, userId: string): AiProvider {
  return {
    // Live reads, not values captured once here: when `provider` is a
    // failover wrapper, its id/model can change between this call and the
    // eventual run() below (a fallback to the secondary), so a snapshot taken
    // now would misreport which provider actually served this request in
    // both the client-facing `ai.provider`/`ai.model` fields and diagnostics.
    get id() { return provider.id; },
    get model() { return provider.model; },
    supports: (capability) => provider.supports(capability),
    async run<TInput, TOutput>(capability: AiCapability, input: TInput): Promise<TOutput> {
      if (capability === "food_nlp") limiter.consume(userId);
      return provider.run<TInput, TOutput>(capability, input);
    }
  };
}
