import { describe, expect, it, vi } from "vitest";
import {
  ChatSemanticCandidateGateProvider, DisabledSemanticCandidateGateProvider,
  SEMANTIC_CANDIDATE_GATE_INSTRUCTION, type SemanticCandidateGateTransport
} from "./semantic-candidate-gate.js";
import { z } from "zod";

const validOutput = { results: [{ id: "0", relationship: "same_identity" }, { id: "1", relationship: "different_prepared_food" }] };

// The exact same schema the module uses internally, re-derived here only for
// the "forbidden field" test table (the module doesn't export the schema
// itself, matching search-intent.ts's/candidate-localization.ts's own
// convention of exporting the INSTRUCTION but not necessarily the schema).
const resultItemSchema = z.object({ id: z.string().trim().min(1).max(64), relationship: z.enum(["same_identity", "processed_derivative", "different_prepared_food"]) }).strict();
const outputSchema = z.object({ results: z.array(resultItemSchema).min(1).max(10) }).strict();

describe("semantic candidate gate output schema: identity/relevance-only trust boundary", () => {
  it("accepts a well-formed batch", () => {
    expect(outputSchema.safeParse(validOutput).success).toBe(true);
  });

  it("requires at least one result, caps at ten", () => {
    expect(outputSchema.safeParse({ results: [] }).success).toBe(false);
    const eleven = Array.from({ length: 11 }, (_, i) => ({ id: String(i), relationship: "same_identity" }));
    expect(outputSchema.safeParse({ results: eleven }).success).toBe(false);
  });

  it.each(["kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g", "fiberPer100g", "sourceId", "source", "foodId", "provenance", "nutrients", "confidence", "name", "displayName", "isSameFood"])(
    "rejects a forbidden %s field on a result — structurally impossible, not just discouraged",
    (field) => {
      const poisoned = { results: [{ ...validOutput.results[0], [field]: "anything" }] };
      expect(outputSchema.safeParse(poisoned).success).toBe(false);
    }
  );

  it("rejects a relationship value outside the three-way enum (owner-beta blocker #9.1 — no loose boolean, no free text)", () => {
    expect(outputSchema.safeParse({ results: [{ id: "0", relationship: "kinda_related" }] }).success).toBe(false);
    expect(outputSchema.safeParse({ results: [{ id: "0", relationship: true }] }).success).toBe(false);
  });
});

// Owner-beta blocker #9.1 (2026-09-12): a static guard that the instruction
// text itself actually teaches the "made from / derived from" distinction
// with the exact required example pairs — regressing this text (e.g.
// accidentally reverting to the old "processing degree" wording, or
// dropping an example) would silently reopen the "Potato flour" class of
// bug without any other test noticing, since every other test here uses a
// fixture transport that never actually reads the instruction's content.
describe("SEMANTIC_CANDIDATE_GATE_INSTRUCTION content: the derived-product distinction is explicit, not implied", () => {
  it.each([
    "Potato flour", "Potato starch", "Milk, powder", "Corn flour", "Cornstarch", "Apple juice",
    "Pork sausage", "Bologna, beef and pork", "Cheese, cheddar", "Apple pie", "Bread, potato", "Potato chips"
  ])("mentions %s as a worked example", (example) => {
    expect(SEMANTIC_CANDIDATE_GATE_INSTRUCTION).toContain(example);
  });

  it("names the three-way relationship categories explicitly", () => {
    expect(SEMANTIC_CANDIDATE_GATE_INSTRUCTION).toContain("same_identity");
    expect(SEMANTIC_CANDIDATE_GATE_INSTRUCTION).toContain("processed_derivative");
    expect(SEMANTIC_CANDIDATE_GATE_INSTRUCTION).toContain("different_prepared_food");
  });

  it("explicitly states that being related/made-from/derived-from is never sufficient for same_identity", () => {
    expect(SEMANTIC_CANDIDATE_GATE_INSTRUCTION.toLowerCase()).toContain("never enough");
  });
});

describe("DisabledSemanticCandidateGateProvider: fails CLOSED, not open", () => {
  it("returns an empty map — every candidate absent, meaning REJECTED, never a silent pass-through", async () => {
    const result = await new DisabledSemanticCandidateGateProvider().checkRelevance({ identity: "burgonya" }, [{ id: "0", authoritativeName: "Potatoes, raw" }]);
    expect(result.size).toBe(0);
    expect(result.get("0")).toBeUndefined(); // caller must treat undefined as reject, never default-true
  });
});

function fakeTransport(complete: SemanticCandidateGateTransport["complete"]): SemanticCandidateGateTransport {
  return { id: "fixture-provider", model: "fixture-model", complete };
}

describe("ChatSemanticCandidateGateProvider", () => {
  it("sends only the original identity and candidate authoritative names — no user id, username, meal history, or profile data", async () => {
    let capturedInput = "";
    const complete = vi.fn(async (instruction: string, input: string, validate: (v: unknown) => unknown) => {
      expect(instruction).toBe(SEMANTIC_CANDIDATE_GATE_INSTRUCTION);
      capturedInput = input;
      return validate(validOutput);
    });
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(complete));
    await provider.checkRelevance({ identity: "burgonya", locale: "hu-HU" }, [{ id: "0", authoritativeName: "Potatoes, raw" }, { id: "1", authoritativeName: "Bread, potato" }]);
    const parsed = JSON.parse(capturedInput);
    expect(Object.keys(parsed).sort()).toEqual(["candidates", "originalIdentity", "originalLocale"]);
    expect(parsed.originalIdentity).toBe("burgonya");
    expect(parsed.candidates).toEqual([{ id: "0", authoritativeName: "Potatoes, raw" }, { id: "1", authoritativeName: "Bread, potato" }]);
  });

  it("batches the WHOLE candidate set into exactly one transport call", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate(validOutput));
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(complete));
    await provider.checkRelevance({ identity: "burgonya" }, [{ id: "0", authoritativeName: "Potatoes, raw" }, { id: "1", authoritativeName: "Bread, potato" }]);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("maps 'same_identity' to true and 'different_prepared_food' to false, keyed by candidate id", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate(validOutput));
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(complete));
    const result = await provider.checkRelevance({ identity: "burgonya" }, [{ id: "0", authoritativeName: "Potatoes, raw" }, { id: "1", authoritativeName: "Bread, potato" }]);
    expect(result.get("0")).toBe(true);
    expect(result.get("1")).toBe(false);
  });

  // Owner-beta blocker #9.1 (2026-09-12): the exact real failure — a
  // processed derivative must resolve to false, not merely "not explicitly
  // same" — proving the three-way classification is actually wired to a
  // strict allowlist (only "same_identity" is true), not an inverted
  // denylist that could accidentally admit an unrecognized category.
  it("maps 'processed_derivative' to false — a milled/extracted product is never the same identity as its source ingredient", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate({ results: [{ id: "0", relationship: "processed_derivative" }] }));
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(complete));
    const result = await provider.checkRelevance({ identity: "burgonya" }, [{ id: "0", authoritativeName: "Potato flour" }]);
    expect(result.get("0")).toBe(false);
  });

  it("drops a response id that was never sent — never applies a validation result to a candidate that didn't ask for one", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate({ results: [{ id: "0", relationship: "same_identity" }, { id: "99", relationship: "same_identity" }] }));
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(complete));
    const result = await provider.checkRelevance({ identity: "burgonya" }, [{ id: "0", authoritativeName: "Potatoes, raw" }]);
    expect(result.get("0")).toBe(true);
    expect(result.has("99")).toBe(false);
    expect(result.size).toBe(1);
  });

  // FAIL CLOSED — the defining safety property of this provider.
  it("returns an EMPTY map (never throws, never defaults to true) when the transport rejects", async () => {
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(async () => { throw new Error("timeout"); }));
    const result = await provider.checkRelevance({ identity: "burgonya" }, [{ id: "0", authoritativeName: "Potatoes, raw" }]);
    expect(result.size).toBe(0);
  });

  it("returns an EMPTY map when the transport returns a schema-invalid/poisoned payload", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate({ results: [{ id: "0", relationship: "same_identity", kcalPer100g: 77 }] }));
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(complete));
    const result = await provider.checkRelevance({ identity: "burgonya" }, [{ id: "0", authoritativeName: "Potatoes, raw" }]);
    expect(result.size).toBe(0);
  });

  it("returns an EMPTY map when the transport returns a relationship value outside the enum (e.g. a stray boolean or free text)", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate({ results: [{ id: "0", relationship: "sort_of_the_same" }] }));
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(complete));
    const result = await provider.checkRelevance({ identity: "burgonya" }, [{ id: "0", authoritativeName: "Potatoes, raw" }]);
    expect(result.size).toBe(0);
  });

  it("never calls the transport for an empty candidate list or empty identity", async () => {
    const complete = vi.fn();
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(complete));
    await provider.checkRelevance({ identity: "burgonya" }, []);
    await provider.checkRelevance({ identity: "   " }, [{ id: "0", authoritativeName: "Potatoes, raw" }]);
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns an empty map immediately when the signal is already aborted", async () => {
    const complete = vi.fn();
    const provider = new ChatSemanticCandidateGateProvider(fakeTransport(complete));
    const controller = new AbortController();
    controller.abort();
    const result = await provider.checkRelevance({ identity: "burgonya" }, [{ id: "0", authoritativeName: "Potatoes, raw" }], controller.signal);
    expect(result.size).toBe(0);
    expect(complete).not.toHaveBeenCalled();
  });
});
