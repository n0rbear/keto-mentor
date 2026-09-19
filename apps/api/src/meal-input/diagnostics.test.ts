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

// Human decision trace (2026-09-19) — real production case: a live staging
// request for "túrós muffin" returned foodResolution=unresolved,
// interpretationSource=ai_assisted (classification.code=ai_understood), with
// webEvidenceDiagnostics.rejectionReason="rate_limited" — i.e. identity was
// NEVER in question (the AI correctly understood "túrós muffin" as one
// food); what actually happened downstream was that web-evidence's OWN
// 3-per-15-minute budget refused the call before it ever reached a provider.
// The OLD panel collapsed this into one flat "food_identity: unresolved"
// line under ÉTELAZONOSÍTÁS. This proves the new decisionTrace-derived
// events name the REAL, differently-attributed stages instead.
describe("Human decision trace: real 'túrós muffin' live case + full outcome taxonomy", () => {
  it("MANDATORY: the real live 'túrós muffin' shape produces distinct web_evidence + ai_estimation events, never just one flat 'unresolved' line", () => {
    const events = buildDiagnostics(baseResult({
      input: "túrós muffin", parsed: { foodQuery: "turos muffin" },
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      interpretationSource: "ai_assisted", semantic: { language: "hu", kind: "single_food", clarificationNeeded: false },
      semanticItem: { canonicalName: "túrós muffin", evidence: "explicit" },
      // Real live shape: web-evidence's own rate limiter refused the call;
      // AI-estimation's own separate rate limiter also refused it — two
      // DIFFERENT internal budgets, reconstructed here from the real
      // observed webEvidenceOutcome plus a plausible, clearly-labeled
      // aiEstimationOutcome (the exact live AI-estimation category wasn't
      // itself capturable by the OLD code — this fix is precisely what
      // makes it capturable going forward).
      decisionTrace: { webEvidenceOutcome: "rate_limited", aiEstimationOutcome: "internal_rate_limited" }
    }));
    // Identity itself was never in question — must NOT show a generic
    // ÉTELAZONOSÍTÁS-bucketed failure for what is actually a downstream gap.
    const identity = events.find((e) => e.stage === "food_identity");
    expect(identity?.code).toBe("unresolved");
    // The two REAL, distinctly-attributed stages must both be present.
    const webEvidence = events.find((e) => e.stage === "web_evidence");
    expect(webEvidence).toMatchObject({ code: "web_evidence_rate_limited", status: "blocked" });
    const aiEstimation = events.find((e) => e.stage === "ai_estimation");
    expect(aiEstimation).toMatchObject({ code: "ai_estimation_internal_rate_limited", status: "blocked" });
    // Never collapsed into a single event — at least 3 distinct, correctly
    // staged events for this one item (classification + food_identity +
    // web_evidence + ai_estimation = 4).
    expect(events.length).toBeGreaterThanOrEqual(4);
  });

  it("exact catalog hit: no web_evidence/ai_estimation events at all (neither tier was ever reached)", () => {
    const events = buildDiagnostics(baseResult());
    expect(events.some((e) => e.stage === "web_evidence")).toBe(false);
    expect(events.some((e) => e.stage === "ai_estimation")).toBe(false);
  });

  it("web evidence: rate_limited (our own budget, before any provider call)", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { webEvidenceOutcome: "rate_limited" }
    }));
    expect(events.find((e) => e.stage === "web_evidence")).toMatchObject({ code: "web_evidence_rate_limited", status: "blocked" });
  });

  it("web evidence: search itself failed (the search call transport-failed)", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { webEvidenceOutcome: "search_failed" }
    }));
    expect(events.find((e) => e.stage === "web_evidence")).toMatchObject({ code: "web_evidence_search_failed", status: "blocked" });
  });

  it("web evidence: no authoritative source among the search results", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { webEvidenceOutcome: "no_authoritative_source" }
    }));
    expect(events.find((e) => e.stage === "web_evidence")).toMatchObject({ code: "web_evidence_no_authoritative_source", status: "attention" });
  });

  it("web evidence: an authoritative page was fetched but had no usable nutrition numbers", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { webEvidenceOutcome: "nutrition_missing" }
    }));
    expect(events.find((e) => e.stage === "web_evidence")).toMatchObject({ code: "web_evidence_nutrition_missing", status: "attention" });
  });

  it("web evidence: numbers were found but couldn't be confirmed as the right food", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { webEvidenceOutcome: "identity_mismatch" }
    }));
    expect(events.find((e) => e.stage === "web_evidence")).toMatchObject({ code: "web_evidence_identity_mismatch", status: "attention" });
  });

  it("AI estimation: internal rate limit blocked the call before the provider was ever contacted", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { aiEstimationOutcome: "internal_rate_limited" }
    }));
    expect(events.find((e) => e.stage === "ai_estimation")).toMatchObject({ code: "ai_estimation_internal_rate_limited", status: "blocked" });
  });

  it("AI estimation: the provider itself was rate-limited (429) — DISTINCT from our own internal limiter", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { aiEstimationOutcome: "provider_rate_limited" }
    }));
    const event = events.find((e) => e.stage === "ai_estimation")!;
    expect(event.code).toBe("ai_estimation_provider_rate_limited");
    expect(event.code).not.toBe("ai_estimation_internal_rate_limited");
  });

  it("AI estimation: timeout", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { aiEstimationOutcome: "timeout" }
    }));
    expect(events.find((e) => e.stage === "ai_estimation")).toMatchObject({ code: "ai_estimation_timeout", status: "blocked" });
  });

  it("AI estimation: malformed/schema-invalid response", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { aiEstimationOutcome: "invalid_response" }
    }));
    expect(events.find((e) => e.stage === "ai_estimation")).toMatchObject({ code: "ai_estimation_invalid_response", status: "blocked" });
  });

  it("AI estimation: structurally implausible nutrition (well-formed, but the numbers don't add up)", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { aiEstimationOutcome: "structurally_implausible" }
    }));
    expect(events.find((e) => e.stage === "ai_estimation")).toMatchObject({ code: "ai_estimation_implausible", status: "attention" });
  });

  it("AI estimation: a valid estimate was produced (success)", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "ai_estimate_pending", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      aiEstimate: { canonicalFoodName: "x", basisGrams: 100, kcalPer100g: 1, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 1, fiberPer100g: 1, confidence: "low", assumptions: "a", identityConfidence: "low", requestedIdentity: "x", canonicalIdentity: "x", proof: "p" },
      decisionTrace: { aiEstimationOutcome: "success" }
    }));
    expect(events.find((e) => e.stage === "ai_estimation")).toMatchObject({ code: "ai_estimation_success", status: "ok" });
  });

  it("provider outage/generic error: distinct from every other category, never silently relabeled as invalid_response or timeout", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
      decisionTrace: { aiEstimationOutcome: "provider_error" }
    }));
    expect(events.find((e) => e.stage === "ai_estimation")).toMatchObject({ code: "ai_estimation_provider_error", status: "blocked" });
  });

  it("stage not attempted because an earlier branch already stopped: decisionTrace is entirely absent, never rendered as a failure", () => {
    // A plain local ambiguity (two local candidates, e.g. "sajt") never even
    // reaches the dynamic-resolution chain, so `decisionTrace` is correctly
    // absent altogether — must produce NO web_evidence/ai_estimation events,
    // not a false "blocked" one.
    const events = buildDiagnostics(baseResult({
      foodResolution: "confirmation_required", selectedFood: food as any, candidates: [food as any],
      quantity: null, canConfirm: false, confidence: 0.95, ambiguous: true
    }));
    expect(events.some((e) => e.stage === "web_evidence" || e.stage === "ai_estimation")).toBe(false);
  });

  it("recipe: unresolved ingredient names are named (not just a count) when the backend already knows them", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: true, confidence: 0, interpretationSource: "ai_assisted",
      semantic: { language: "hu", kind: "compound_dish", dishName: "gulyásleves", clarificationNeeded: false },
      recipeDiscovery: {
        status: "confirmation_required", searchAttempted: true, resultCount: 3, candidatesAfterRelevanceFilter: 2, candidatesAttempted: 1,
        candidate: {
          title: "Gulyásleves", sourceUrl: "https://example.com/g", domain: "example.com", extractionMethod: "schema_org_json_ld",
          ingredientCount: 3, resolvedIngredientCount: 1, confirmationRequiredIngredientCount: 1, unresolvedIngredientCount: 1,
          ingredientSummary: [], nutritionPer100g: null, nutritionPerServing: null, nutritionTotal: null, nutritionCalculable: false,
          ingredientWeightGrams: null, recipeState: "reviewable", importProof: "proof",
          ingredients: [
            { originalText: "marhalábszár", parsedFoodQuery: "marhalábszár", status: "resolved" },
            { originalText: "pirospaprika", parsedFoodQuery: "pirospaprika", status: "unresolved" },
            { originalText: "köménymag", parsedFoodQuery: "köménymag", status: "confirmation_required" }
          ]
        } as any
      } as any
    }));
    const event = events.find((e) => e.code === "ingredients_need_review")!;
    expect(event.params?.names).toBe("pirospaprika, köménymag");
  });

  it("recipe not found: no candidate at all, blocked at recipe_web_discovery, never fabricated as a resolved dish", () => {
    const events = buildDiagnostics(baseResult({
      foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0, interpretationSource: "ai_assisted",
      semantic: { language: "hu", kind: "compound_dish", dishName: "ismeretlen étel", clarificationNeeded: false },
      recipeDiscovery: {
        status: "unresolved", searchAttempted: true, resultCount: 2, candidatesAfterRelevanceFilter: 0, candidatesAttempted: 0,
        reason: "no_fully_resolvable_candidate"
      } as any
    }));
    expect(events.find((e) => e.stage === "recipe_web_discovery")).toMatchObject({ status: "blocked", code: "web_no_fully_resolvable_candidate" });
    expect(events.some((e) => e.code === "ingredients_fully_resolved" || e.code === "ingredients_need_review")).toBe(false);
  });
});
