import { describe, expect, it } from "vitest";
import { buildDiagnostics } from "./diagnostics.js";
import type { InterpretResult } from "./interpret.js";

const food = { id: "f1", source: "usda_fdc", sourceId: "1", name: "Gouda" };

function baseResult(overrides: Partial<InterpretResult> = {}): InterpretResult {
  return {
    input: "100 g gouda",
    parsed: { foodQuery: "gouda", quantity: 100, unit: "g" },
    foodResolution: "resolved",
    selectedFood: food as any,
    candidates: [food as any],
    quantity: { status: "resolved", grams: 100, estimated: false, requiresConfirmation: false },
    canConfirm: true,
    confidence: 1,
    interpretationSource: "deterministic",
    ...overrides
  };
}

// Decision-transparency audit (2026-09-19) — real production case ("sajt"
// -> Cheddar sajt / Gouda sajt, both score 95, ambiguous): the trace
// previously only ever said "several similarly good matches exist", with no
// names attached, even though the candidate names were already sitting
// right there on the InterpretResult. These prove the names now reach the
// event, bounded to 5, without requiring any new lookup/call.
describe("buildDiagnostics: local candidate names in ambiguous/preview/confirmation_required events", () => {
  const cheddar = { id: "c1", source: "open_database", sourceId: "1", name: "Cheddar cheese" };
  const gouda = { id: "g1", source: "open_database", sourceId: "2", name: "Gouda cheese" };

  it("an ambiguous local tie names the actual candidates, not just 'several matches'", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "confirmation_required", selectedFood: cheddar as any, candidates: [cheddar as any, gouda as any],
      quantity: null, canConfirm: false, confidence: 0.95, ambiguous: true
    }));
    const event = events.find((e) => e.code === "ambiguous")!;
    expect(event).toBeTruthy();
    expect(event.params?.names).toBe("Cheddar cheese, Gouda cheese");
    expect(event.params?.count).toBe(2);
  });

  it("bounds the named candidate list to 5 even when more are present", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ id: `x${i}`, source: "open_database", sourceId: String(i), name: `Cheese ${i}` }));
    const events = buildDiagnostics(baseResult({
      foodResolution: "confirmation_required", selectedFood: many[0] as any, candidates: many as any,
      quantity: null, canConfirm: false, confidence: 0.5, ambiguous: true
    }));
    const event = events.find((e) => e.code === "ambiguous")!;
    expect(event.params?.names).toBe("Cheese 0, Cheese 1, Cheese 2, Cheese 3, Cheese 4");
  });

  it("a weak 'preview' match also names the candidate(s)", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "preview", selectedFood: gouda as any, candidates: [gouda as any],
      quantity: null, canConfirm: false, confidence: 0.82
    }));
    const event = events.find((e) => e.code === "preview_match")!;
    expect(event.params?.names).toBe("Gouda cheese");
  });

  it("a plain confirmation_required (no ambiguity flag) also names the candidate(s)", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "confirmation_required", selectedFood: gouda as any, candidates: [gouda as any],
      quantity: null, canConfirm: false, confidence: 0.6
    }));
    const event = events.find((e) => e.code === "confirmation_required")!;
    expect(event.params?.names).toBe("Gouda cheese");
  });

  it("never adds a names param when there are no local candidates at all (unresolved stays exactly as before)", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0
    }));
    const event = events.find((e) => e.code === "unresolved")!;
    expect(event.params).toBeUndefined();
  });
});

describe("buildDiagnostics", () => {
  it("a clean, fully-resolved deterministic match produces a minimal, all-ok timeline", () => {
    const events = buildDiagnostics(baseResult());
    expect(events.every((e) => e.status === "ok")).toBe(true);
    expect(events.some((e) => e.code === "direct_match")).toBe(true);
    expect(events.some((e) => e.code === "trusted_match")).toBe(true);
    // An exact, non-estimated, already-confirmed portion is not worth its own line.
    expect(events.some((e) => e.stage === "portion")).toBe(false);
  });

  it("AI-assisted classification of a compound dish is reported with its kind and dish name", () => {
    const events = buildDiagnostics(baseResult({
      interpretationSource: "ai_assisted",
      semantic: { language: "hu", kind: "compound_dish", dishName: "rakott krumpli", clarificationNeeded: false }
    }));
    const classification = events.find((e) => e.stage === "classification")!;
    expect(classification.code).toBe("ai_understood");
    expect(classification.params).toMatchObject({ kind: "compound_dish", dish: "rakott krumpli" });
  });

  it("a failed AI understanding call is reported as non-blocking (deterministic fallback still ran) with the real, closed-vocabulary provider error code — never a raw message/stack", () => {
    const events = buildDiagnostics(baseResult({ aiUnderstandingFailure: { code: "timeout" } }));
    const classification = events.find((e) => e.stage === "classification")!;
    expect(classification).toMatchObject({ status: "attention", code: "ai_failed_timeout", blocking: false });
  });

  it("an unresolved ingredient is reported as blocking, never silently dropped", () => {
    const events = buildDiagnostics(baseResult({ foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0 }));
    const identity = events.find((e) => e.stage === "food_identity")!;
    expect(identity).toMatchObject({ status: "blocked", code: "unresolved", blocking: true });
  });

  it("an AI quantity provider outcome of invalid_output is surfaced by its real, closed-vocabulary code, distinct from a timeout", () => {
    const events = buildDiagnostics(baseResult({ quantity: { status: "unresolved", estimated: false, requiresConfirmation: true, reason: "conversion_missing", aiOutcome: "invalid_output" } }));
    const portion = events.find((e) => e.stage === "portion")!;
    expect(portion).toMatchObject({ status: "blocked", code: "portion_ai_invalid_output", blocking: true });
  });

  it("recipe web discovery finding nothing usable reports the real reason code (rate_limited), never a bare 'not found'", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      semantic: { language: "hu", kind: "compound_dish", dishName: "halászlé", clarificationNeeded: false },
      recipeDiscovery: { status: "unresolved", searchAttempted: true, resultCount: 3, candidatesAfterRelevanceFilter: 2, candidatesAttempted: 2, reason: "rate_limited" }
    }));
    const web = events.find((e) => e.stage === "recipe_web_discovery")!;
    expect(web).toMatchObject({ status: "blocked", code: "web_rate_limited", blocking: true });
  });

  it("a fully-resolved discovered recipe is reported ok, including which ingredient counts actually resolved", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      semantic: { language: "hu", kind: "compound_dish", dishName: "halászlé", clarificationNeeded: false },
      recipeDiscovery: {
        status: "confirmation_required", searchAttempted: true, resultCount: 3, candidatesAfterRelevanceFilter: 2, candidatesAttempted: 1,
        candidate: { title: "Halászlé", sourceUrl: "https://example.com/h", domain: "example.com", extractionMethod: "schema_org_json_ld", ingredientCount: 7, resolvedIngredientCount: 7, confirmationRequiredIngredientCount: 0, unresolvedIngredientCount: 0, ingredientSummary: [], nutritionPer100g: null, nutritionPerServing: null, nutritionCalculable: true, ingredientWeightGrams: 1000, recipeState: "fully_resolved", ingredients: [], importProof: "proof" }
      } as any
    }));
    const ingredientEvent = events.find((e) => e.stage === "ingredient_resolution")!;
    expect(ingredientEvent).toMatchObject({ status: "ok", code: "ingredients_fully_resolved", blocking: false, params: { resolved: 7, total: 7 } });
  });

  it("a double-counting guard firing (sibling overlap) is surfaced as its own non-blocking event, never silently absorbed", () => {
    const events = buildDiagnostics(baseResult({
      items: [
        { input: "csülökpörkölt", parsed: { foodQuery: "csülökpörkölt" }, foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: true, confidence: 0, interpretationSource: "ai_assisted",
          recipeDiscovery: {
            status: "confirmation_required", searchAttempted: true, resultCount: 1, candidatesAfterRelevanceFilter: 1, candidatesAttempted: 1,
            candidate: { title: "Csülökpörkölt", sourceUrl: "https://x", domain: "x", extractionMethod: "schema_org_json_ld", ingredientCount: 3, resolvedIngredientCount: 3, confirmationRequiredIngredientCount: 0, unresolvedIngredientCount: 0, ingredientSummary: [], nutritionPer100g: null, nutritionPerServing: null, nutritionCalculable: true, ingredientWeightGrams: 800, recipeState: "fully_resolved", ingredients: [], importProof: "p", overlapsWithSiblingItems: [{ itemIndex: 1, canonicalName: "krumpli" }] }
          } as any
        },
        { input: "krumpli", parsed: { foodQuery: "krumpli" }, foodResolution: "resolved", selectedFood: food as any, candidates: [food as any], quantity: { status: "resolved", grams: 200, estimated: false, requiresConfirmation: false }, canConfirm: true, confidence: 1, interpretationSource: "ai_assisted", nutritionEligible: false, excludedBySiblingRecipe: { dishItemIndex: 0, dishName: "csülökpörkölt" } }
      ]
    }));
    expect(events.some((e) => e.stage === "double_counting_guard" && e.code === "sibling_overlap_guarded")).toBe(true);
    expect(events.some((e) => e.code === "excluded_double_counting")).toBe(true);
  });

  it("diagnostic events never carry secrets, tokens, or raw provider payloads — only the closed code/params vocabulary", () => {
    const events = buildDiagnostics(baseResult({ aiUnderstandingFailure: { code: "http_error" } }));
    const serialized = JSON.stringify(events);
    expect(serialized).not.toMatch(/gsk_|tvly-|Bearer |api[_-]?key/i);
  });

  it("is a pure function of its input — calling it twice on fresh, unrelated results never leaks state between calls", () => {
    const a = buildDiagnostics(baseResult());
    const b = buildDiagnostics(baseResult({ foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0 }));
    const aAgain = buildDiagnostics(baseResult());
    expect(aAgain).toEqual(a);
    expect(b.some((e) => e.code === "unresolved")).toBe(true);
    expect(a.some((e) => e.code === "unresolved")).toBe(false);
  });
});
