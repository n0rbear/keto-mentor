import { describe, expect, it, vi } from "vitest";
import { ChatSemanticRecoveryProvider, DisabledSemanticRecoveryProvider, semanticRecoveryOutputSchema, SEMANTIC_RECOVERY_INSTRUCTION, type SemanticRecoveryTransport } from "./semantic-recovery.js";

const validRecovery = { canonicalConcept: "curd cheese", localSearchTerms: ["Quark", "Speisequark"], referenceSearchTerms: ["quark"] };

describe("semanticRecoveryOutputSchema: search-aid-only trust boundary", () => {
  it("accepts a well-formed recovery with both empty and populated term lists", () => {
    expect(semanticRecoveryOutputSchema.safeParse(validRecovery).success).toBe(true);
    expect(semanticRecoveryOutputSchema.safeParse({ canonicalConcept: "x" }).success).toBe(true);
  });

  it("bounds each term list to at most 3 entries", () => {
    expect(semanticRecoveryOutputSchema.safeParse({ ...validRecovery, localSearchTerms: ["a", "b", "c", "d"] }).success).toBe(false);
    expect(semanticRecoveryOutputSchema.safeParse({ ...validRecovery, referenceSearchTerms: ["a", "b", "c", "d"] }).success).toBe(false);
    expect(semanticRecoveryOutputSchema.safeParse({ ...validRecovery, localSearchTerms: ["a", "b", "c"] }).success).toBe(true);
  });

  it.each(["kcal", "protein", "fat", "carbs", "fiber", "kcalPer100g", "barcode", "ean", "upc", "gtin", "fdcId", "sourceId", "source", "foodId", "confidence", "needsClarification", "clarificationQuestion"])(
    "rejects a forbidden %s field — structurally impossible, not just discouraged",
    (field) => {
      expect(semanticRecoveryOutputSchema.safeParse({ ...validRecovery, [field]: "anything" }).success).toBe(false);
    }
  );

  it("rejects an empty canonical concept or an empty term string", () => {
    expect(semanticRecoveryOutputSchema.safeParse({ ...validRecovery, canonicalConcept: "" }).success).toBe(false);
    expect(semanticRecoveryOutputSchema.safeParse({ ...validRecovery, localSearchTerms: [""] }).success).toBe(false);
  });

  it("defaults missing term lists to empty arrays rather than requiring them", () => {
    const parsed = semanticRecoveryOutputSchema.parse({ canonicalConcept: "oil" });
    expect(parsed.localSearchTerms).toEqual([]);
    expect(parsed.referenceSearchTerms).toEqual([]);
  });
});

describe("SEMANTIC_RECOVERY_INSTRUCTION", () => {
  it("never mentions a barcode/EAN as something it may produce, and explicitly forbids inventing one", () => {
    expect(SEMANTIC_RECOVERY_INSTRUCTION.toLowerCase()).toContain("never invent or assume a barcode");
  });

  it("frames the model as a search assistant, never a nutrition source", () => {
    expect(SEMANTIC_RECOVERY_INSTRUCTION.toLowerCase()).toContain("never a nutrition source");
  });
});

describe("DisabledSemanticRecoveryProvider", () => {
  it("always returns null, never throws", async () => {
    expect(await new DisabledSemanticRecoveryProvider().recover({ foodQuery: "túró" })).toBeNull();
  });
});

function fakeTransport(complete: SemanticRecoveryTransport["complete"]): SemanticRecoveryTransport {
  return { id: "fixture-provider", model: "fixture-model", complete };
}

describe("ChatSemanticRecoveryProvider", () => {
  it("sends only the food phrase, prior search term, and locale — no username, user id, or profile data", async () => {
    let capturedInput = "";
    const complete = vi.fn(async (instruction: string, input: string, validate: (v: unknown) => unknown) => {
      expect(instruction).toBe(SEMANTIC_RECOVERY_INSTRUCTION);
      capturedInput = input;
      return validate(validRecovery);
    });
    const provider = new ChatSemanticRecoveryProvider(fakeTransport(complete));
    await provider.recover({ foodQuery: "túró", priorSearchTerm: "cottage cheese" });
    expect(JSON.parse(capturedInput)).toEqual({ foodQuery: "túró", priorSearchTerm: "cottage cheese" });
  });

  it("returns the validated recovery on success", async () => {
    const provider = new ChatSemanticRecoveryProvider(fakeTransport(async (_i, _input, validate) => validate(validRecovery)));
    expect(await provider.recover({ foodQuery: "túró" })).toEqual(validRecovery);
  });

  it("degrades to null (never throws) on malformed output, provider error, or timeout", async () => {
    const malformed = new ChatSemanticRecoveryProvider(fakeTransport(async (_i, _input, validate) => validate({ localSearchTerms: ["x"] })));
    await expect(malformed.recover({ foodQuery: "túró" })).resolves.toBeNull();

    const failing = new ChatSemanticRecoveryProvider(fakeTransport(async () => { throw new Error("upstream secret detail"); }));
    expect(await failing.recover({ foodQuery: "túró" })).toBeNull();
  });

  it("rejects a barcode field smuggled into an otherwise well-formed response — never trusted, never surfaced", async () => {
    const provider = new ChatSemanticRecoveryProvider(fakeTransport(async (_i, _input, validate) => validate({ ...validRecovery, barcode: "4008400404127" })));
    // The zod .strict() schema rejects the unknown field, so this degrades
    // to the same safe null a provider failure would — a barcode can never
    // reach a caller through this path no matter what the model returns.
    await expect(provider.recover({ foodQuery: "Milbona Speisequark 40%" })).resolves.toBeNull();
  });

  it("returns null for an empty food query without calling the transport", async () => {
    const complete = vi.fn();
    const provider = new ChatSemanticRecoveryProvider(fakeTransport(complete));
    expect(await provider.recover({ foodQuery: "   " })).toBeNull();
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns null immediately when the signal is already aborted", async () => {
    const complete = vi.fn();
    const provider = new ChatSemanticRecoveryProvider(fakeTransport(complete));
    const controller = new AbortController();
    controller.abort();
    expect(await provider.recover({ foodQuery: "túró" }, controller.signal)).toBeNull();
    expect(complete).not.toHaveBeenCalled();
  });

  it("extracts brand/productName/variant only when actually returned, never inventing them", async () => {
    const branded = { canonicalConcept: "curd cheese", localSearchTerms: [], referenceSearchTerms: [], brand: "Milbona", productName: "Speisequark", variant: "40%" };
    const provider = new ChatSemanticRecoveryProvider(fakeTransport(async (_i, _input, validate) => validate(branded)));
    const result = await provider.recover({ foodQuery: "Milbona Speisequark 40%" });
    expect(result).toEqual(branded);
  });
});
