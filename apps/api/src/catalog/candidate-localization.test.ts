import { describe, expect, it, vi } from "vitest";
import {
  CANDIDATE_LOCALIZATION_INSTRUCTION, ChatCandidateLocalizationProvider, DisabledCandidateLocalizationProvider,
  localizationBatchOutputSchema, localizeCandidateNames, type CandidateLocalizationTransport
} from "./candidate-localization.js";
import type { ExternalFoodCandidate } from "./external-food.js";

const validBatch = { items: [{ id: "0", displayName: "Pácolt sertéscsülök" }] };

describe("localizationBatchOutputSchema: localization-only trust boundary", () => {
  it("accepts a well-formed batch", () => {
    expect(localizationBatchOutputSchema.safeParse(validBatch).success).toBe(true);
    expect(localizationBatchOutputSchema.safeParse({ items: [{ id: "0", displayName: "A" }, { id: "1", displayName: "B" }] }).success).toBe(true);
  });

  it("requires at least one item, caps at ten", () => {
    expect(localizationBatchOutputSchema.safeParse({ items: [] }).success).toBe(false);
    const eleven = Array.from({ length: 11 }, (_, i) => ({ id: String(i), displayName: "x" }));
    expect(localizationBatchOutputSchema.safeParse({ items: eleven }).success).toBe(false);
    const ten = Array.from({ length: 10 }, (_, i) => ({ id: String(i), displayName: "x" }));
    expect(localizationBatchOutputSchema.safeParse({ items: ten }).success).toBe(true);
  });

  it("rejects an empty displayName or id", () => {
    expect(localizationBatchOutputSchema.safeParse({ items: [{ id: "", displayName: "A" }] }).success).toBe(false);
    expect(localizationBatchOutputSchema.safeParse({ items: [{ id: "0", displayName: "" }] }).success).toBe(false);
  });

  // The whole point of this schema: nutrition, source identity, and
  // provenance are structurally impossible to return, not merely
  // discouraged by prompt wording. A malicious/confused localization
  // response attempting any of these is rejected outright by z.strict().
  it.each(["kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g", "sourceId", "source", "foodId", "provenance", "nutrients", "confidence"])(
    "rejects a forbidden %s field on an item — structurally impossible, not just discouraged",
    (field) => {
      const poisoned = { items: [{ ...validBatch.items[0], [field]: "anything" }] };
      expect(localizationBatchOutputSchema.safeParse(poisoned).success).toBe(false);
    }
  );

  it("rejects a forbidden top-level field alongside items", () => {
    expect(localizationBatchOutputSchema.safeParse({ ...validBatch, sourceId: "169157" }).success).toBe(false);
  });
});

describe("DisabledCandidateLocalizationProvider", () => {
  it("always returns an empty map, never throws", async () => {
    const result = await new DisabledCandidateLocalizationProvider().localize([{ id: "0", authoritativeName: "Pork hock" }], "hu");
    expect(result.size).toBe(0);
  });
});

function fakeTransport(complete: CandidateLocalizationTransport["complete"]): CandidateLocalizationTransport {
  return { id: "fixture-provider", model: "fixture-model", complete };
}

describe("ChatCandidateLocalizationProvider", () => {
  it("sends only authoritativeName/category per item plus targetLocale — no user id, username, meal history, or profile data", async () => {
    let capturedInput = "";
    const complete = vi.fn(async (instruction: string, input: string, validate: (v: unknown) => unknown) => {
      expect(instruction).toBe(CANDIDATE_LOCALIZATION_INSTRUCTION);
      capturedInput = input;
      return validate(validBatch);
    });
    const provider = new ChatCandidateLocalizationProvider(fakeTransport(complete));
    await provider.localize([{ id: "0", authoritativeName: "Pork, pickled pork hocks", category: "Pork Products" }], "hu");
    const parsed = JSON.parse(capturedInput);
    expect(Object.keys(parsed).sort()).toEqual(["items", "targetLocale"]);
    expect(parsed.targetLocale).toBe("hu");
    expect(parsed.items).toEqual([{ id: "0", authoritativeName: "Pork, pickled pork hocks", category: "Pork Products" }]);
  });

  it("batches an entire candidate set into exactly one transport call", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) =>
      validate({ items: [{ id: "0", displayName: "A" }, { id: "1", displayName: "B" }, { id: "2", displayName: "C" }] }));
    const provider = new ChatCandidateLocalizationProvider(fakeTransport(complete));
    const result = await provider.localize([
      { id: "0", authoritativeName: "Pork hock, raw" },
      { id: "1", authoritativeName: "Pork hock, cured" },
      { id: "2", authoritativeName: "Pork hock, smoked" }
    ], "de");
    expect(complete).toHaveBeenCalledTimes(1);
    expect(result.get("0")).toBe("A");
    expect(result.get("1")).toBe("B");
    expect(result.get("2")).toBe("C");
  });

  it("drops a response id that was never sent — never applies a translated name to a candidate that didn't ask for one", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) =>
      validate({ items: [{ id: "0", displayName: "A" }, { id: "99", displayName: "forged" }] }));
    const provider = new ChatCandidateLocalizationProvider(fakeTransport(complete));
    const result = await provider.localize([{ id: "0", authoritativeName: "Pork hock" }], "hu");
    expect(result.get("0")).toBe("A");
    expect(result.has("99")).toBe(false);
    expect(result.size).toBe(1);
  });

  it("returns an empty map (never throws) when the transport rejects", async () => {
    const provider = new ChatCandidateLocalizationProvider(fakeTransport(async () => { throw new Error("timeout"); }));
    const result = await provider.localize([{ id: "0", authoritativeName: "Pork hock" }], "hu");
    expect(result.size).toBe(0);
  });

  it("returns an empty map (never throws) when the transport returns a schema-invalid/poisoned payload", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) =>
      validate({ items: [{ id: "0", displayName: "A", kcalPer100g: 171 }] }));
    const provider = new ChatCandidateLocalizationProvider(fakeTransport(complete));
    const result = await provider.localize([{ id: "0", authoritativeName: "Pork hock" }], "hu");
    expect(result.size).toBe(0);
  });

  it("never calls the transport for an empty candidate list", async () => {
    const complete = vi.fn();
    const provider = new ChatCandidateLocalizationProvider(fakeTransport(complete));
    await provider.localize([], "hu");
    expect(complete).not.toHaveBeenCalled();
  });
});

const baseCandidate: ExternalFoodCandidate = {
  name: "Pork, pickled pork hocks", originalName: "Pork, pickled pork hocks", names: { en: "Pork, pickled pork hocks" },
  source: "usda_fdc", sourceId: "169157", sourceUrl: "https://fdc.nal.usda.gov/food-details/169157",
  normalizedName: "pork pickled pork hocks", nutrientBasis: "per_100_g", retrievedAt: new Date().toISOString(),
  confidence: 0.98, matchPolicy: "exact_normalized_name", category: "Pork Products",
  kcalPer100g: 171, fatPer100g: 10.5, proteinPer100g: 19.1, carbsPer100g: 0, fiberPer100g: 0, nutrients: []
} as unknown as ExternalFoodCandidate;

describe("localizeCandidateNames", () => {
  it("skips the LLM entirely for English — the authoritative name IS the display name", async () => {
    const localize = vi.fn();
    const input = [baseCandidate];
    const result = await localizeCandidateNames({ id: "fixture", localize }, input, "en");
    expect(localize).not.toHaveBeenCalled();
    expect(result).toBe(input); // the exact same array, completely untouched
  });

  it("merges the returned displayName into names[locale] without disturbing existing names or identity", async () => {
    const localize = vi.fn(async () => new Map([["0", "Pácolt sertéscsülök"]]));
    const [result] = await localizeCandidateNames({ id: "fixture", localize }, [baseCandidate], "hu");
    expect(result.names).toEqual({ en: "Pork, pickled pork hocks", hu: "Pácolt sertéscsülök" });
    // Identity/trust fields are completely untouched by localization.
    expect(result.source).toBe("usda_fdc");
    expect(result.sourceId).toBe("169157");
    expect(result.kcalPer100g).toBe(171);
    expect(result.originalName).toBe("Pork, pickled pork hocks");
  });

  it("batches the whole candidate array into one localize() call, never one per candidate", async () => {
    const localize = vi.fn(async () => new Map([["0", "A"], ["1", "B"]]));
    const second = { ...baseCandidate, sourceId: "999", name: "Pork hock, smoked", originalName: "Pork hock, smoked", names: { en: "Pork hock, smoked" } };
    await localizeCandidateNames({ id: "fixture", localize }, [baseCandidate, second], "de");
    expect(localize).toHaveBeenCalledTimes(1);
  });

  it("falls back to the original, untouched candidates when the provider returns nothing", async () => {
    const localize = vi.fn(async () => new Map());
    const result = await localizeCandidateNames({ id: "fixture", localize }, [baseCandidate], "hu");
    expect(result[0].names).toEqual({ en: "Pork, pickled pork hocks" });
    expect(result[0].name).toBe(baseCandidate.name);
  });
});
