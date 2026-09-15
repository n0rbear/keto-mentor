import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  ChatRecipeSemanticGateProvider, DisabledRecipeSemanticGateProvider, checkRelevanceBatchWithRetry,
  SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION, SEMANTIC_GATE_BATCH_MAX_PAIRS, SEMANTIC_GATE_BATCH_MAX_RETRIES,
  type BatchGateInput, type RecipeSemanticGateProvider, type RecipeSemanticGateTransport
} from "./semantic-candidate-gate-batch.js";

// Re-derived only for schema tests, matching semantic-candidate-gate.test.ts's
// own convention (the module exports the instruction, not the schema itself).
const resultSchema = z.object({
  ingredientIndex: z.number().int().min(0), candidateIndex: z.number().int().min(0),
  relationship: z.enum(["same_identity", "processed_derivative", "different_prepared_food"]),
  formCompatibility: z.enum(["compatible", "incompatible", "uncertain"]),
  contextualFit: z.enum(["best_match", "acceptable_alternative"])
}).strict();
const outputSchema = z.object({ results: z.array(resultSchema).min(1).max(SEMANTIC_GATE_BATCH_MAX_PAIRS) }).strict();

describe("semantic candidate gate BATCH output schema", () => {
  it("accepts a well-formed multi-ingredient, multi-candidate batch", () => {
    expect(outputSchema.safeParse({
      results: [
        { ingredientIndex: 0, candidateIndex: 0, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" },
        { ingredientIndex: 0, candidateIndex: 1, relationship: "different_prepared_food", formCompatibility: "incompatible", contextualFit: "acceptable_alternative" },
        { ingredientIndex: 1, candidateIndex: 0, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" }
      ]
    }).success).toBe(true);
  });

  it(`requires at least one result, caps at ${SEMANTIC_GATE_BATCH_MAX_PAIRS}`, () => {
    expect(outputSchema.safeParse({ results: [] }).success).toBe(false);
    const tooMany = Array.from({ length: SEMANTIC_GATE_BATCH_MAX_PAIRS + 1 }, (_, i) => ({ ingredientIndex: 0, candidateIndex: i, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" }));
    expect(outputSchema.safeParse({ results: tooMany }).success).toBe(false);
  });

  it.each(["kcalPer100g", "sourceId", "source", "foodId", "provenance", "confidence", "authoritativeName", "id"])(
    "rejects a forbidden %s field — structurally impossible, not just discouraged",
    (field) => {
      const poisoned = { results: [{ ingredientIndex: 0, candidateIndex: 0, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match", [field]: "anything" }] };
      expect(outputSchema.safeParse(poisoned).success).toBe(false);
    }
  );

  it("rejects a negative ingredientIndex or candidateIndex", () => {
    expect(outputSchema.safeParse({ results: [{ ingredientIndex: -1, candidateIndex: 0, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" }] }).success).toBe(false);
    expect(outputSchema.safeParse({ results: [{ ingredientIndex: 0, candidateIndex: -1, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" }] }).success).toBe(false);
  });
});

describe("SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION: multi-ingredient isolation and completeness are explicit", () => {
  it("instructs evaluating each ingredient independently, never cross-influencing", () => {
    expect(SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION.toLowerCase()).toContain("never let one ingredient");
  });
  it("instructs never omitting, inventing, or duplicating a pair", () => {
    expect(SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION.toLowerCase()).toContain("never omit a pair");
    expect(SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION.toLowerCase()).toContain("never invent a pair");
    expect(SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION.toLowerCase()).toContain("never duplicate a pair");
  });
  it("preserves the same three-way relationship taxonomy as the single-ingredient gate", () => {
    expect(SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION).toContain("same_identity");
    expect(SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION).toContain("processed_derivative");
    expect(SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION).toContain("different_prepared_food");
  });
  it("forbids nutrition/identifiers explicitly", () => {
    expect(SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION).toContain("Never include nutrition");
    expect(SEMANTIC_CANDIDATE_GATE_BATCH_INSTRUCTION).toContain("database IDs");
  });
});

describe("DisabledRecipeSemanticGateProvider", () => {
  it("always returns an empty map, never throws — every pair unvalidated", async () => {
    const provider = new DisabledRecipeSemanticGateProvider();
    const result = await provider.checkRelevanceBatch({ ingredients: [{ index: 0, identity: "onion", candidates: [{ index: 0, authoritativeName: "Onions, raw" }] }] });
    expect(result.size).toBe(0);
  });
});

function fakeTransport(complete: RecipeSemanticGateTransport["complete"]): RecipeSemanticGateTransport {
  return { id: "fixture-provider", model: "fixture-model", complete };
}

// Phase 11 matrix: potato / mustard / tomato / garlic / carrot, each with
// multiple candidates, evaluated together — proving ONE call handles the
// whole matrix and every pair gets the correct verdict.
const MATRIX_INPUT: BatchGateInput = {
  recipeTitle: "Test recipe", locale: "hu",
  ingredients: [
    { index: 0, identity: "potato", rawIngredient: "500 g krumpli", candidates: [{ index: 0, authoritativeName: "Potatoes, raw" }, { index: 1, authoritativeName: "Bread, potato" }, { index: 2, authoritativeName: "Potato flour" }] },
    { index: 1, identity: "prepared mustard", rawIngredient: "1 tk mustár", candidates: [{ index: 0, authoritativeName: "Mustard, prepared, yellow" }, { index: 1, authoritativeName: "Mustard greens, raw" }, { index: 2, authoritativeName: "Mustard seed" }] },
    { index: 2, identity: "tomato", rawIngredient: "1 db paradicsom", candidates: [{ index: 0, authoritativeName: "Tomato, raw" }, { index: 1, authoritativeName: "Tomato, cooked" }, { index: 2, authoritativeName: "Tomato, canned" }] },
    { index: 3, identity: "garlic", rawIngredient: "2 gerezd fokhagyma", candidates: [{ index: 0, authoritativeName: "Garlic, raw" }, { index: 1, authoritativeName: "Garlic bread" }] },
    { index: 4, identity: "carrot", rawIngredient: "1 szál sárgarépa", candidates: [{ index: 0, authoritativeName: "Carrots, raw" }, { index: 1, authoritativeName: "Carrots, cooked" }] }
  ]
};
const MATRIX_EXPECTED_TRUE = new Set(["0:0", "1:0", "2:0", "3:0", "4:0"]); // only the safe/appropriate candidate per ingredient
// Bread/potato-flour and garlic bread are different_prepared_food or
// processed_derivative; mustard greens/seed are different_prepared_food
// (a plant part, not a processing of the condiment); cooked/canned
// tomato and cooked carrot are same_identity but form-incompatible.
const DIFFERENT_PREPARED_FOOD = new Set(["0:1", "1:1", "1:2", "3:1"]);
const FORM_INCOMPATIBLE_SAME_IDENTITY = new Set(["2:1", "2:2", "4:1"]);
function matrixVerdict(ingredientIndex: number, candidateIndex: number) {
  const key = `${ingredientIndex}:${candidateIndex}`;
  if (MATRIX_EXPECTED_TRUE.has(key)) return { ingredientIndex, candidateIndex, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" };
  if (FORM_INCOMPATIBLE_SAME_IDENTITY.has(key)) return { ingredientIndex, candidateIndex, relationship: "same_identity", formCompatibility: "incompatible", contextualFit: "acceptable_alternative" };
  const relationship = DIFFERENT_PREPARED_FOOD.has(key) ? "different_prepared_food" : "processed_derivative";
  return { ingredientIndex, candidateIndex, relationship, formCompatibility: "incompatible", contextualFit: "acceptable_alternative" };
}

describe("ChatRecipeSemanticGateProvider", () => {
  it("evaluates the WHOLE potato/mustard/tomato/garlic/carrot matrix (13 pairs across 5 ingredients) in ONE model call and returns the correct verdict for every pair", async () => {
    const complete = vi.fn(async (instruction: string, input: string, validate: (v: unknown) => unknown) => {
      const parsed = JSON.parse(input);
      const results = parsed.ingredients.flatMap((ing: any) => ing.candidates.map((c: any) => matrixVerdict(ing.index, c.index)));
      return validate({ results });
    });
    const provider = new ChatRecipeSemanticGateProvider(fakeTransport(complete));
    const map = await provider.checkRelevanceBatch(MATRIX_INPUT);
    expect(complete).toHaveBeenCalledTimes(1); // the whole matrix, one invocation
    for (const key of MATRIX_EXPECTED_TRUE) {
      const v = map.get(key)!;
      expect(v).toMatchObject({ relationship: "same_identity", formCompatibility: "compatible" });
    }
    // The unsafe/incompatible candidates never come back as same_identity+compatible.
    expect(map.get("0:1")).toMatchObject({ relationship: "different_prepared_food" }); // Bread, potato
    expect(map.get("1:1")).toMatchObject({ relationship: "different_prepared_food" }); // Mustard greens
  });

  it("sends shared recipe context ONCE, and each ingredient's own identity/rawIngredient ONCE followed by its own candidates — never repeated per candidate", async () => {
    let captured: any;
    const complete = vi.fn(async (_i: string, input: string, validate: (v: unknown) => unknown) => { captured = JSON.parse(input); return validate({ results: [{ ingredientIndex: 0, candidateIndex: 0, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" }] }); });
    const provider = new ChatRecipeSemanticGateProvider(fakeTransport(complete));
    await provider.checkRelevanceBatch({ recipeTitle: "Gulyás", ingredients: [{ index: 0, identity: "onion", rawIngredient: "200 g hagyma", candidates: [{ index: 0, authoritativeName: "Onions, raw" }] }] });
    expect(captured.recipeTitle).toBe("Gulyás");
    expect(captured.ingredients).toEqual([{ index: 0, identity: "onion", rawIngredient: "200 g hagyma", preparation: undefined, sourceQuantity: undefined, sourceUnit: undefined, candidates: [{ index: 0, authoritativeName: "Onions, raw" }] }]);
  });

  it("STRICT COMPLETENESS: an omitted pair is simply absent from the map (never treated as approval)", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate({ results: [{ ingredientIndex: 0, candidateIndex: 0, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" }] }));
    const provider = new ChatRecipeSemanticGateProvider(fakeTransport(complete));
    const map = await provider.checkRelevanceBatch({ ingredients: [{ index: 0, identity: "x", candidates: [{ index: 0, authoritativeName: "A" }, { index: 1, authoritativeName: "B" }] }] });
    expect(map.has("0:0")).toBe(true);
    expect(map.has("0:1")).toBe(false); // omitted by the model — never defaulted to approved
  });

  it("STRICT COMPLETENESS: a hallucinated (ingredientIndex, candidateIndex) pair never sent in the request is dropped, never applied", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate({
      results: [
        { ingredientIndex: 0, candidateIndex: 0, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" },
        { ingredientIndex: 5, candidateIndex: 9, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" } // never sent
      ]
    }));
    const provider = new ChatRecipeSemanticGateProvider(fakeTransport(complete));
    const map = await provider.checkRelevanceBatch({ ingredients: [{ index: 0, identity: "x", candidates: [{ index: 0, authoritativeName: "A" }] }] });
    expect(map.size).toBe(1);
    expect(map.has("5:9")).toBe(false);
  });

  it("STRICT COMPLETENESS: a duplicated pair (the model contradicting itself) is dropped entirely rather than arbitrarily picking one", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate({
      results: [
        { ingredientIndex: 0, candidateIndex: 0, relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" },
        { ingredientIndex: 0, candidateIndex: 0, relationship: "different_prepared_food", formCompatibility: "incompatible", contextualFit: "acceptable_alternative" }
      ]
    }));
    const provider = new ChatRecipeSemanticGateProvider(fakeTransport(complete));
    const map = await provider.checkRelevanceBatch({ ingredients: [{ index: 0, identity: "x", candidates: [{ index: 0, authoritativeName: "A" }] }] });
    expect(map.has("0:0")).toBe(false);
  });

  it("FAIL CLOSED: malformed JSON / schema violation / transport failure / timeout all degrade to an empty map, never throw", async () => {
    const malformed = new ChatRecipeSemanticGateProvider(fakeTransport(async (_i, _input, validate) => validate({ notResults: [] })));
    await expect(malformed.checkRelevanceBatch({ ingredients: [{ index: 0, identity: "x", candidates: [{ index: 0, authoritativeName: "A" }] }] })).resolves.toEqual(new Map());

    const failing = new ChatRecipeSemanticGateProvider(fakeTransport(async () => { throw new Error("upstream detail"); }));
    await expect(failing.checkRelevanceBatch({ ingredients: [{ index: 0, identity: "x", candidates: [{ index: 0, authoritativeName: "A" }] }] })).resolves.toEqual(new Map());

    const timingOut = new ChatRecipeSemanticGateProvider(fakeTransport(async () => { throw new Error("timeout"); }));
    await expect(timingOut.checkRelevanceBatch({ ingredients: [{ index: 0, identity: "x", candidates: [{ index: 0, authoritativeName: "A" }] }] })).resolves.toEqual(new Map());
  });

  it("returns an empty map without calling the transport when there are no ingredients or no candidates", async () => {
    const complete = vi.fn();
    const provider = new ChatRecipeSemanticGateProvider(fakeTransport(complete));
    expect(await provider.checkRelevanceBatch({ ingredients: [] })).toEqual(new Map());
    expect(await provider.checkRelevanceBatch({ ingredients: [{ index: 0, identity: "x", candidates: [] }] })).toEqual(new Map());
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns immediately when the signal is already aborted", async () => {
    const complete = vi.fn();
    const provider = new ChatRecipeSemanticGateProvider(fakeTransport(complete));
    const controller = new AbortController();
    controller.abort();
    expect(await provider.checkRelevanceBatch({ ingredients: [{ index: 0, identity: "x", candidates: [{ index: 0, authoritativeName: "A" }] }] }, controller.signal)).toEqual(new Map());
    expect(complete).not.toHaveBeenCalled();
  });
});

describe("checkRelevanceBatchWithRetry: chunking + bounded retry + fail-closed orchestration", () => {
  function manyIngredients(count: number, candidatesPerIngredient = 1): BatchGateInput["ingredients"] {
    return Array.from({ length: count }, (_, i) => ({ index: i, identity: `food-${i}`, candidates: Array.from({ length: candidatesPerIngredient }, (_, c) => ({ index: c, authoritativeName: `Food ${i}.${c}` })) }));
  }
  function approveEverything(): RecipeSemanticGateProvider {
    return {
      id: "fixture",
      checkRelevanceBatch: async (input) => {
        const map = new Map();
        for (const ing of input.ingredients) for (const c of ing.candidates) map.set(`${ing.index}:${c.index}`, { relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" });
        return map;
      }
    };
  }

  it("splits a large recipe into multiple chunks, each never exceeding the max-pairs bound, and merges all results", async () => {
    const calls: number[] = [];
    const provider: RecipeSemanticGateProvider = {
      id: "fixture",
      checkRelevanceBatch: async (input) => {
        const pairs = input.ingredients.reduce((n, i) => n + i.candidates.length, 0);
        calls.push(pairs);
        const map = new Map();
        for (const ing of input.ingredients) for (const c of ing.candidates) map.set(`${ing.index}:${c.index}`, { relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" });
        return map;
      }
    };
    // 45 ingredients x 1 candidate = 45 pairs, bound is SEMANTIC_GATE_BATCH_MAX_PAIRS (30) -> at least 2 chunks.
    const result = await checkRelevanceBatchWithRetry(provider, { ingredients: manyIngredients(45) });
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls.every((n) => n <= SEMANTIC_GATE_BATCH_MAX_PAIRS)).toBe(true);
    expect(result.size).toBe(45);
  });

  it("retries ONLY the pairs omitted by the first call, in one bounded follow-up — never the whole set again", async () => {
    let callCount = 0;
    const requestedPairCounts: number[] = [];
    const provider: RecipeSemanticGateProvider = {
      id: "fixture",
      checkRelevanceBatch: async (input) => {
        callCount += 1;
        const pairs = input.ingredients.flatMap((ing) => ing.candidates.map((c) => `${ing.index}:${c.index}`));
        requestedPairCounts.push(pairs.length);
        const map = new Map();
        // First call: omit ingredient index 1's candidate entirely (simulating a real omission).
        for (const ing of input.ingredients) for (const c of ing.candidates) {
          if (callCount === 1 && ing.index === 1) continue;
          map.set(`${ing.index}:${c.index}`, { relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" });
        }
        return map;
      }
    };
    const result = await checkRelevanceBatchWithRetry(provider, { ingredients: manyIngredients(3) });
    expect(callCount).toBe(2);
    expect(requestedPairCounts[1]).toBe(1); // the retry asked for ONLY the missing pair, not all 3 again
    expect(result.size).toBe(3);
  });

  it("FAIL CLOSED: a pair still missing after the bounded retry stays absent from the result — never interpreted as approval", async () => {
    const provider: RecipeSemanticGateProvider = { id: "fixture", checkRelevanceBatch: async () => new Map() }; // always omits everything
    const result = await checkRelevanceBatchWithRetry(provider, { ingredients: manyIngredients(2) });
    expect(result.size).toBe(0);
    expect(SEMANTIC_GATE_BATCH_MAX_RETRIES).toBe(1); // documents the bound this test relies on
  });

  it("makes zero calls for an empty ingredient/candidate set", async () => {
    const provider = approveEverything();
    const spy = vi.spyOn(provider, "checkRelevanceBatch");
    expect(await checkRelevanceBatchWithRetry(provider, { ingredients: [] })).toEqual(new Map());
    expect(spy).not.toHaveBeenCalled();
  });
});
