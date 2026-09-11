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

// Owner-beta blocker (2026-09-12): a live trace showed "sour cream sauce"
// canonicalized to searchTerms ["sour cream"], losing "sauce" entirely — an
// ingredient described as containing/based-on X is not automatically X. A
// static guard on the instruction text itself, since every other test here
// uses a fixture transport that never reads its content.
describe("SEARCH_INTENT_INSTRUCTION: a stated product category is preserved, never dropped as a 'preparation'", () => {
  it("explicitly instructs preserving a stated sauce/dressing/spread category rather than simplifying it away", () => {
    expect(SEARCH_INTENT_INSTRUCTION.toLowerCase()).toContain("sauce");
    expect(SEARCH_INTENT_INSTRUCTION).toContain("sour cream sauce");
    expect(SEARCH_INTENT_INSTRUCTION.toLowerCase()).toContain("never simplified down to bare");
  });

  it("clarifies that 'preparation' is for doneness/cut/state only, never a product-category signal", () => {
    expect(SEARCH_INTENT_INSTRUCTION.toLowerCase()).toContain('never move that category word into the "preparation" field');
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

// Owner-beta blocker #8 (2026-09-11): canonical food search normalization is
// locale-aware, not merely language-aware — a regional tag (e.g. "de-AT")
// changes the instruction sent to the model and is included in the request
// context, so region-specific vocabulary (Austrian "Erdapfel" vs standard
// German "Kartoffel") can be normalized correctly. Deterministic provider
// stubs throughout — no live Groq call in this file.
describe("ChatSearchIntentProvider: locale-aware canonical search normalization", () => {
  it("threads foodLocale into both the request context and the instruction text, and omits it entirely when not supplied", async () => {
    let capturedInstruction = "";
    let capturedInput = "";
    const complete = vi.fn(async (instruction: string, input: string, validate: (v: unknown) => unknown) => {
      capturedInstruction = instruction;
      capturedInput = input;
      return validate(validIntent);
    });
    const provider = new ChatSearchIntentProvider(fakeTransport(complete));
    await provider.generate({ foodQuery: "Erdapfel", foodLocale: "de-AT" });
    expect(JSON.parse(capturedInput)).toMatchObject({ foodQuery: "Erdapfel", foodLocale: "de-AT" });
    expect(capturedInstruction).toContain("de-AT");
    expect(capturedInstruction).not.toBe(SEARCH_INTENT_INSTRUCTION); // locale-specific guidance was actually added

    // No foodLocale supplied -> identical to the pre-existing default instruction (backward compatible).
    await provider.generate({ foodQuery: "csülök" });
    expect(capturedInstruction).toBe(SEARCH_INTENT_INSTRUCTION);
    expect(Object.keys(JSON.parse(capturedInput))).not.toContain("foodLocale");
  });

  it.each([
    ["hu-HU", "burgonya"], ["de-DE", "Kartoffel"], ["de-AT", "Erdapfel"], ["de-CH", "Härdöpfel"],
    ["en-US", "ground beef"], ["en-GB", "minced beef"], ["en-IE", "minced beef"],
    ["en-CA", "ground beef"], ["en-AU", "capsicum"], ["en-NZ", "capsicum"]
  ] as const)("deterministic cross-locale normalization for %s %s never lets the phrase's own locale leak into the CANONICAL en-US search term", async (foodLocale, phrase) => {
    // Deterministic stub standing in for Groq — proves the PIPELINE (not any
    // live model) correctly carries a distinct canonical en-US term per
    // locale without conflating regions of the same language.
    const canonicalByLocale: Record<string, string> = {
      "hu-HU": "potato", "de-DE": "potato", "de-AT": "potato", "de-CH": "potato",
      "en-US": "ground beef", "en-GB": "ground beef", "en-IE": "ground beef",
      "en-CA": "ground beef", "en-AU": "bell pepper", "en-NZ": "bell pepper"
    };
    const provider = new ChatSearchIntentProvider(fakeTransport(async (_i, input, validate) => {
      const parsed = JSON.parse(input);
      expect(parsed.foodLocale).toBe(foodLocale); // the stub receives the real locale tag, not a collapsed language
      return validate({ canonicalConcept: canonicalByLocale[foodLocale], searchTerms: [canonicalByLocale[foodLocale]] });
    }));
    const result = await provider.generate({ foodQuery: phrase, foodLocale });
    expect(result?.searchTerms[0]).toBe(canonicalByLocale[foodLocale]);
  });
});
