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
    id: provider.id,
    model: provider.model,
    supports: (capability) => provider.supports(capability),
    async run<TInput, TOutput>(capability: AiCapability, input: TInput): Promise<TOutput> {
      if (capability === "food_nlp") limiter.consume(userId);
      return provider.run<TInput, TOutput>(capability, input);
    }
  };
}
