import { describe, expect, it, vi } from "vitest";
import { ChatSearchIntentProvider, DisabledSearchIntentProvider, searchIntentOutputSchema, SEARCH_INTENT_INSTRUCTION, type SearchIntentTransport } from "./search-intent.js";

const validIntent = { canonicalConcept: "pork hock", searchTerms: ["pork hock", "pork knuckle"], preparation: "boiled", sourceLanguage: "hu" as const };

describe("searchIntentOutputSchema: search-aid-only trust boundary", () => {
  it("accepts a well-formed intent", () => {
    expect(searchIntentOutputSchema.safeParse(validIntent).success).toBe(true);
    expect(searchIntentOutputSchema.safeParse({ canonicalConcept: "sausage", searchTerms: ["sausage"] }).success).toBe(true);
  });

  it("requires at least one search term, caps at three", () => {
    expect(searchIntentOutputSchema.safeParse({ canonicalConcept: "x", searchTerms: [] }).success).toBe(false);
    expect(searchIntentOutputSchema.safeParse({ canonicalConcept: "x", searchTerms: ["a", "b", "c", "d"] }).success).toBe(false);
    expect(searchIntentOutputSchema.safeParse({ canonicalConcept: "x", searchTerms: ["a", "b", "c"] }).success).toBe(true);
  });

  it.each(["kcal", "protein", "fat", "carbs", "fiber", "kcalPer100g", "fdcId", "sourceId", "source", "foodId", "provenance", "nutrients"])(
    "rejects a forbidden %s field — structurally impossible, not just discouraged",
    (field) => {
      expect(searchIntentOutputSchema.safeParse({ ...validIntent, [field]: "anything" }).success).toBe(false);
    }
  );

  it("rejects an empty canonical concept or search term", () => {
    expect(searchIntentOutputSchema.safeParse({ ...validIntent, canonicalConcept: "" }).success).toBe(false);
    expect(searchIntentOutputSchema.safeParse({ ...validIntent, searchTerms: [""] }).success).toBe(false);
  });

  it("rejects an unrecognized sourceLanguage", () => {
    expect(searchIntentOutputSchema.safeParse({ ...validIntent, sourceLanguage: "fr" }).success).toBe(false);
  });
});

describe("DisabledSearchIntentProvider", () => {
  it("always returns null, never throws", async () => {
    expect(await new DisabledSearchIntentProvider().generate({ foodQuery: "csülök" })).toBeNull();
  });
});

function fakeTransport(complete: SearchIntentTransport["complete"]): SearchIntentTransport {
  return { id: "fixture-provider", model: "fixture-model", complete };
}

describe("ChatSearchIntentProvider", () => {
  it("sends only the food phrase and preparation — no username, user id, or profile data", async () => {
    let capturedInput = "";
    const complete = vi.fn(async (instruction: string, input: string, validate: (v: unknown) => unknown) => {
      expect(instruction).toBe(SEARCH_INTENT_INSTRUCTION);
      capturedInput = input;
      return validate(validIntent);
    });
    const provider = new ChatSearchIntentProvider(fakeTransport(complete));
    await provider.generate({ foodQuery: "csülök", preparation: "boiled" });
    const parsed = JSON.parse(capturedInput);
    expect(Object.keys(parsed).sort()).toEqual(["foodQuery", "preparation"]);
    expect(parsed).toEqual({ foodQuery: "csülök", preparation: "boiled" });
  });

  it("returns the validated intent on success", async () => {
    const provider = new ChatSearchIntentProvider(fakeTransport(async (_i, _input, validate) => validate(validIntent)));
    expect(await provider.generate({ foodQuery: "csülök" })).toEqual(validIntent);
  });

  it("degrades to null (never throws) on malformed output, timeout, or transport failure", async () => {
    const malformed = new ChatSearchIntentProvider(fakeTransport(async (_i, _input, validate) => validate({ kcal: 100 })));
    await expect(malformed.generate({ foodQuery: "csülök" })).resolves.toBeNull();

    const failing = new ChatSearchIntentProvider(fakeTransport(async () => { throw new Error("upstream secret detail"); }));
    const result = await failing.generate({ foodQuery: "csülök" });
    expect(result).toBeNull();
  });

  it("returns null for an empty food query without calling the transport", async () => {
    const complete = vi.fn();
    const provider = new ChatSearchIntentProvider(fakeTransport(complete));
    expect(await provider.generate({ foodQuery: "   " })).toBeNull();
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns null immediately when the signal is already aborted", async () => {
    const complete = vi.fn();
    const provider = new ChatSearchIntentProvider(fakeTransport(complete));
    const controller = new AbortController();
    controller.abort();
    expect(await provider.generate({ foodQuery: "csülök" }, controller.signal)).toBeNull();
    expect(complete).not.toHaveBeenCalled();
  });
});
