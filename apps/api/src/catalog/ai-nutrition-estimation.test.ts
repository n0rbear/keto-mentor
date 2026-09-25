import { describe, expect, it } from "vitest";
import { ChatAiNutritionEstimationProvider, DisabledAiNutritionEstimationProvider, type AiNutritionEstimationTransport } from "./ai-nutrition-estimation.js";
import { AiProviderError } from "../ai/chat-completions-provider.js";

function throwingTransport(error: unknown): AiNutritionEstimationTransport {
  return { id: "fixture", model: "fixture-model", complete: async () => { throw error; } };
}

function fakeTransport(response: unknown, opts: { throws?: boolean } = {}): AiNutritionEstimationTransport {
  return {
    id: "fixture", model: "fixture-model",
    complete: async (_instruction, _input, validate) => {
      if (opts.throws) throw new Error("transport failure");
      return validate(response);
    }
  };
}

const goodResponse = {
  canonicalFoodName: "Crucian carp, raw",
  kcalPer100g: 97, proteinPer100g: 17.8, fatPer100g: 2.7, carbsPer100g: 0, fiberPer100g: 0,
  confidence: "low", assumptions: "Assumed a typical raw whole-fish composition; not from a verified source.",
  identityConfidence: "medium"
};

describe("DisabledAiNutritionEstimationProvider", () => {
  it("always returns null, never calls anything", async () => {
    const provider = new DisabledAiNutritionEstimationProvider();
    expect(await provider.estimate({ requestedIdentity: "x", canonicalIdentity: "x" })).toBeNull();
  });
});

describe("ChatAiNutritionEstimationProvider", () => {
  it("returns a valid, structurally-plausible estimate", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport(goodResponse));
    const result = await provider.estimate({ requestedIdentity: "kárász", canonicalIdentity: "crucian carp" });
    expect(result).toMatchObject({ canonicalFoodName: "Crucian carp, raw", kcalPer100g: 97, basisGrams: 100, confidence: "low" });
  });

  it("never auto-marks high confidence as a default — schema requires an explicit choice", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport({ ...goodResponse, confidence: "invalid" }));
    expect(await provider.estimate({ requestedIdentity: "x", canonicalIdentity: "x" })).toBeNull();
  });

  it("rejects malformed/schema-violating output (Part H)", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport({ canonicalFoodName: "X", kcalPer100g: "not-a-number" }));
    expect(await provider.estimate({ requestedIdentity: "x", canonicalIdentity: "x" })).toBeNull();
  });

  it("rejects negative macro values", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport({ ...goodResponse, proteinPer100g: -5 }));
    expect(await provider.estimate({ requestedIdentity: "x", canonicalIdentity: "x" })).toBeNull();
  });

  it("rejects missing required fields", async () => {
    const { kcalPer100g, ...withoutKcal } = goodResponse;
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport(withoutKcal));
    expect(await provider.estimate({ requestedIdentity: "x", canonicalIdentity: "x" })).toBeNull();
  });

  it("rejects an absurdly high kcal value (out of physical bounds)", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport({ ...goodResponse, kcalPer100g: 50_000 }));
    expect(await provider.estimate({ requestedIdentity: "x", canonicalIdentity: "x" })).toBeNull();
  });

  it("rejects a grossly energy-inconsistent estimate (sanity check, generous tolerance)", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport({ ...goodResponse, kcalPer100g: 900, proteinPer100g: 5, fatPer100g: 1, carbsPer100g: 2 }));
    expect(await provider.estimate({ requestedIdentity: "x", canonicalIdentity: "x" })).toBeNull();
  });

  it("provider/transport failure returns null, never throws", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport(goodResponse, { throws: true }));
    await expect(provider.estimate({ requestedIdentity: "x", canonicalIdentity: "x" })).resolves.toBeNull();
  });

  it("empty requestedIdentity -> null without calling the transport", async () => {
    let called = false;
    const transport: AiNutritionEstimationTransport = { id: "fixture", model: "m", complete: async (...args) => { called = true; return (args[2] as any)(goodResponse); } };
    const provider = new ChatAiNutritionEstimationProvider(transport);
    const result = await provider.estimate({ requestedIdentity: "   ", canonicalIdentity: "x" });
    expect(result).toBeNull();
    expect(called).toBe(false);
  });

  it("carries the assumptions summary through for user-facing display, never hidden reasoning", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport(goodResponse));
    const result = await provider.estimate({ requestedIdentity: "kárász", canonicalIdentity: "crucian carp" });
    expect(result?.assumptions).toBe(goodResponse.assumptions);
    expect(result?.assumptions.length).toBeLessThan(500);
  });

  it("surfaces optional fields (sugar/saturated fat/salt) only when the model actually provided them", async () => {
    const withOptional = new ChatAiNutritionEstimationProvider(fakeTransport({ ...goodResponse, sugarPer100g: 0.5 }));
    const result = await withOptional.estimate({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(result?.optional).toEqual({ sugarPer100g: 0.5 });

    const withoutOptional = new ChatAiNutritionEstimationProvider(fakeTransport(goodResponse));
    const result2 = await withoutOptional.estimate({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(result2?.optional).toBeUndefined();
  });
});

// Decision-transparency audit (2026-09-19): estimate() itself is UNCHANGED
// (every test above still passes byte-for-byte) — estimateDetailed() is the
// new, additive surface that finally distinguishes WHY a null happened, so
// the "Mi történt?" panel can attribute the real cause instead of a flat
// "couldn't estimate". Real live motivation: a "túrós muffin" request whose
// downstream web-evidence AND AI-estimation both silently failed for
// different, previously indistinguishable reasons.
describe("ChatAiNutritionEstimationProvider.estimateDetailed", () => {
  it("success: outcome='success' alongside the same estimate estimate() would return", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport(goodResponse));
    const result = await provider.estimateDetailed({ requestedIdentity: "kárász", canonicalIdentity: "crucian carp" });
    expect(result.outcome).toBe("success");
    expect(result.estimate).toMatchObject({ canonicalFoodName: "Crucian carp, raw" });
  });

  it("structurally_implausible: a well-formed but energy-inconsistent response is distinguished from every other failure", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport({ ...goodResponse, kcalPer100g: 900, proteinPer100g: 5, fatPer100g: 1, carbsPer100g: 2 }));
    const result = await provider.estimateDetailed({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(result).toEqual({ estimate: null, outcome: "structurally_implausible" });
  });

  it("invalid_response: schema-violating output (a genuine zod validation failure)", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport({ canonicalFoodName: "X", kcalPer100g: "not-a-number" }));
    const result = await provider.estimateDetailed({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(result).toEqual({ estimate: null, outcome: "invalid_response" });
  });

  it("timeout: AiProviderError('timeout') maps to its own distinct category", async () => {
    const provider = new ChatAiNutritionEstimationProvider(throwingTransport(new AiProviderError("timeout")));
    const result = await provider.estimateDetailed({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(result).toEqual({ estimate: null, outcome: "timeout" });
  });

  it("provider_rate_limited: AiProviderError('http_error', 429) is DISTINCT from our own internal rate limiter (that distinction lives one layer up, in dynamic-food-resolution.ts)", async () => {
    const provider = new ChatAiNutritionEstimationProvider(throwingTransport(new AiProviderError("http_error", 429)));
    const result = await provider.estimateDetailed({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(result).toEqual({ estimate: null, outcome: "provider_rate_limited" });
  });

  it("provider_error: a 5xx / other HTTP failure never gets mislabeled as a timeout or invalid_response", async () => {
    const provider = new ChatAiNutritionEstimationProvider(throwingTransport(new AiProviderError("http_error", 503)));
    const result = await provider.estimateDetailed({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(result).toEqual({ estimate: null, outcome: "provider_error" });
  });

  it("invalid_response: AiProviderError('response_too_large') is also invalid_response, not a generic provider_error", async () => {
    const provider = new ChatAiNutritionEstimationProvider(throwingTransport(new AiProviderError("response_too_large")));
    const result = await provider.estimateDetailed({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(result).toEqual({ estimate: null, outcome: "invalid_response" });
  });

  it("provider_error: a genuinely unexpected (non-AiProviderError) exception still degrades safely, never throws or leaks the raw error", async () => {
    const provider = new ChatAiNutritionEstimationProvider(throwingTransport(new Error("some unexpected internal detail")));
    const result = await provider.estimateDetailed({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(result).toEqual({ estimate: null, outcome: "provider_error" });
  });

  it("estimate() and estimateDetailed() never disagree on the estimate value itself", async () => {
    const provider = new ChatAiNutritionEstimationProvider(fakeTransport(goodResponse));
    const viaEstimate = await provider.estimate({ requestedIdentity: "x", canonicalIdentity: "x" });
    const viaDetailed = await provider.estimateDetailed({ requestedIdentity: "x", canonicalIdentity: "x" });
    expect(viaDetailed.estimate).toEqual(viaEstimate);
  });
});
