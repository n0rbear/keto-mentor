import { describe, expect, it, vi } from "vitest";
import { MistralQuantityEstimationProvider, configuredQuantityProvider, quantityOutputSchema } from "./mistral-quantity-provider.js";
import { resolveQuantity } from "./interpret.js";
import { FoodNlpUserRateLimiter, rateLimitedFoodNlpProvider } from "../ai/food-nlp-rate-limit.js";
import type { QuantityEstimationProvider } from "./quantity-estimation.js";

const food = { id: "peanuts", source: "USDA", sourceId: "172430", name: "Peanuts" };
// "piece" (a geometry-class unit) is used throughout this file deliberately:
// these tests exercise generic provider/transport behavior (caching, error
// handling, trusted-serving precedence), not the volume-model schema, which
// has its own dedicated coverage in chat-quantity-provider.test.ts.
const parsed = { quantity: 2, unit: "piece" as const, foodQuery: "peanuts" };
const output = { gramsPerUnit: 30, rangeGramsPerUnit: { min: 25, max: 35 }, confidence: 0.8 };
function response(value: unknown) { return new Response(JSON.stringify({ choices: [{ message: { content: typeof value === "string" ? value : JSON.stringify(value) } }] })); }
function provider(fetchImpl: typeof fetch, timeoutMs = 1000) { return new MistralQuantityEstimationProvider({ apiKey: "fixture-secret", model: "fixture-model", fetchImpl, timeoutMs }); }

describe("quantity estimation boundary", () => {
  it.each(["g", "kg"] as const)("%s bypasses AI", async (unit) => {
    const estimate = vi.fn();
    const result = await resolveQuantity({ ...parsed, quantity: 0.5, unit }, food, { id: "spy", estimate });
    expect(result.grams).toBe(unit === "g" ? 0.5 : 500);
    expect(estimate).not.toHaveBeenCalled();
  });
  it.each(["authoritative", "curated", "estimated"])("prefers existing %s serving", async (method) => {
    const estimate = vi.fn();
    const result = await resolveQuantity(parsed, { ...food, servings: [{ id: "s", key: "piece", unit: "piece", labels: {}, grams: 28, isEstimated: method === "estimated", confidence: 1, provenance: { method } }] }, { id: "spy", estimate });
    expect(result.grams).toBe(56);
    expect(result.requiresConfirmation).toBe(method === "estimated");
    expect(estimate).not.toHaveBeenCalled();
  });
  it("prioritizes authoritative over higher-confidence curated serving", async () => {
    const servings = ["curated", "authoritative"].map((method, index) => ({ id: method, key: "piece", unit: "piece", labels: {}, grams: 20 + index, isEstimated: false, confidence: 1 - index * 0.05, provenance: { method } }));
    expect((await resolveQuantity(parsed, { ...food, servings })).servingId).toBe("authoritative");
  });
  it("multiplies per-unit range and always requires confirmation", async () => {
    const result = await resolveQuantity(parsed, food, provider(async () => response({ ...output, confidence: 1 })));
    expect(result).toMatchObject({ grams: 60, rangeGrams: { min: 50, max: 70 }, method: "ai_estimated", requiresConfirmation: true });
  });
  it("does not guess a missing quantity", async () => {
    const estimate = vi.fn();
    expect((await resolveQuantity({ foodQuery: "peanuts" }, food, { id: "spy", estimate })).reason).toBe("quantity_missing");
    expect(estimate).not.toHaveBeenCalled();
  });
  it.each(["kcal", "protein", "fat", "carbs", "fiber", "nutrients", "foodId", "sourceId", "assumption"])("rejects unknown/forbidden %s field", (field) => {
    expect(quantityOutputSchema.safeParse({ ...output, [field]: 10 }).success).toBe(false);
  });
  it.each([
    { ...output, gramsPerUnit: -1 }, { ...output, gramsPerUnit: 100_000 },
    { ...output, rangeGramsPerUnit: { min: 35, max: 25 } },
    { ...output, rangeGramsPerUnit: { min: 30, max: 30 } },
    { ...output, gramsPerUnit: 40 }, { ...output, confidence: 1.1 }
  ])("rejects invalid weights/ranges", (value) => expect(quantityOutputSchema.safeParse(value).success).toBe(false));
  it("rejects an implausibly wide range even though every individual field is within its own absolute bounds — regression for a real production case (2026-09-10: a misrouted '1 bögre mandula' produced a schema-valid but physically meaningless 1g-50,000g range at 10% confidence)", () => {
    const absurd = { gramsPerUnit: 1, rangeGramsPerUnit: { min: 1, max: 50_000 }, confidence: 0.1 };
    expect(quantityOutputSchema.safeParse(absurd).success).toBe(false);
    // A genuinely wide but physically reasonable range (small vs. large
    // interpretation of the same food) must still be accepted.
    const plausible = { gramsPerUnit: 40, rangeGramsPerUnit: { min: 10, max: 100 }, confidence: 0.4 };
    expect(quantityOutputSchema.safeParse(plausible).success).toBe(true);
  });
  it.each(["not json", { ...output, kcal: 500 }])("invalid model data safely asks for grams", async (value) => {
    expect((await resolveQuantity(parsed, food, provider(async () => response(value)))).reason).toBe("conversion_missing");
  });
  it.each([429, 500])("HTTP %s safely asks for grams", async (status) => {
    expect((await resolveQuantity(parsed, food, provider(async () => new Response("fixture-secret", { status })))).reason).toBe("conversion_missing");
  });
  it("timeout safely asks for grams", async () => {
    const fetchImpl: typeof fetch = async (_url, init) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("fixture-secret"))));
    const result = await resolveQuantity(parsed, food, provider(fetchImpl, 5));
    expect(result.reason).toBe("conversion_missing");
    expect(JSON.stringify(result)).not.toContain("fixture-secret");
  });
  it("missing key remains functional", async () => expect((await resolveQuantity(parsed, food, configuredQuantityProvider({}))).reason).toBe("conversion_missing"));
  it("sends only structured food/portion context, caches per-unit weights and uses shared quota on misses", async () => {
    const request = vi.fn(async () => response(output));
    const estimator = provider(request);
    const limiter = new FoodNlpUserRateLimiter();
    const budget = vi.fn(() => limiter.consume("user"));
    const first = await estimator.estimate({ parsed, food }, undefined, budget);
    await estimator.estimate({ parsed: { ...parsed, quantity: 3 }, food }, undefined, budget);
    expect(request).toHaveBeenCalledOnce();
    expect(budget).toHaveBeenCalledOnce();
    expect(first?.provenance).toMatchObject({ provider: "mistral", modelOrRule: "fixture-model", edibleWeight: true });
    const ai = rateLimitedFoodNlpProvider({ id: "fixture", supports: () => true, run: async <T, U>(_cap: unknown, _input: T) => ({}) as U }, limiter, "user");
    for (let i = 0; i < 24; i++) await ai.run("food_nlp", {});
    await expect(estimator.estimate({ parsed: { ...parsed, size: "large" }, food }, undefined, budget)).rejects.toThrow("rate_limited");
    expect(request).toHaveBeenCalledOnce();
  });
  it("bounds cache size and TTL", async () => {
    let now = 0;
    const request = vi.fn(async () => response(output));
    const estimator = new MistralQuantityEstimationProvider({ apiKey: "fixture", model: "fixture", fetchImpl: request }, () => now, 100, 1);
    await estimator.estimate({ parsed, food });
    await estimator.estimate({ parsed, food: { ...food, id: "other" } });
    await estimator.estimate({ parsed, food });
    now = 101;
    await estimator.estimate({ parsed, food });
    expect(request).toHaveBeenCalledTimes(4);
  });
});
