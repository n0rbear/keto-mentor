import { describe, expect, it } from "vitest";
import { classifyRecipeReview, computeTrustedNutrition, toIngredientReview, type ReviewableIngredient } from "./recipe-ingredient-review.js";

const cabbage = { id: "cabbage", name: "Cabbage", source: "bls", kcalPer100g: 25, fatPer100g: 0.1, proteinPer100g: 1.3, carbsPer100g: 5.8, fiberPer100g: 2.5 };
const egg = { id: "egg", name: "Egg", source: "open_database", kcalPer100g: 155, fatPer100g: 11, proteinPer100g: 13, carbsPer100g: 1.1, fiberPer100g: 0 };

function ingredient(overrides: Partial<ReviewableIngredient>): ReviewableIngredient {
  return {
    originalText: "some ingredient", parsedFoodQuery: "some ingredient",
    resolution: "resolved", selectedFood: null, candidates: [], quantity: null,
    ...overrides
  };
}

describe("toIngredientReview: the trusted-nutrition fix (owner-beta blocker #6)", () => {
  // Test 2 (required) — the exact observed "Főtt tojás" case: a genuine
  // local EXACT match exists as a PREVIEW (interpretOne intentionally keeps
  // `top` around even for confirmation_required — see interpret.ts's
  // prepUnavailable branch), quantity resolves to real grams, but the
  // preparation-mismatch gate keeps identity itself at confirmation_required.
  it("2 — a confirmation_required Food candidate with resolved grams is NOT counted as trusted nutrition", () => {
    const review = toIngredientReview(ingredient({
      originalText: "5 db Főtt tojás", parsedFoodQuery: "tojas", preparation: "boiled",
      resolution: "confirmation_required", selectedFood: egg, candidates: [egg],
      quantity: { status: "resolved", grams: 250 }
    }));
    expect(review.status).toBe("confirmation_required");
    expect(review.quantityStatus).toBe("resolved");
    expect(review.quantityGrams).toBe(250);
    // The preview candidate is visible for review purposes...
    expect(review.localCandidates).toEqual([{ id: "egg", name: "Egg", source: "open_database" }]);
    // ...but it is explicitly NOT the trusted identity.
    expect(review.resolvedFood).toBeNull();
    expect(review.trustedNutritionReady).toBe(false);
  });

  // Test 16 (required) — a WEAKER local match tier ("preview", score 80-94 —
  // not trusted per isTrustedLocalMatch's >=95 bar) with a resolved quantity
  // must also never count, even though it is a genuinely different code path
  // from the preparation-mismatch case above.
  it("16 — a quantity-resolved but identity-untrusted ('preview' tier) ingredient cannot count as trusted", () => {
    const review = toIngredientReview(ingredient({
      resolution: "preview", selectedFood: cabbage, candidates: [cabbage],
      quantity: { status: "resolved", grams: 100 }
    }));
    expect(review.status).toBe("confirmation_required");
    expect(review.resolvedFood).toBeNull();
    expect(review.trustedNutritionReady).toBe(false);
  });

  it("1 — a genuinely resolved identity with resolved grams IS trusted", () => {
    const review = toIngredientReview(ingredient({
      resolution: "resolved", selectedFood: cabbage, candidates: [cabbage],
      quantity: { status: "resolved", grams: 500 }
    }));
    expect(review.status).toBe("resolved");
    expect(review.resolvedFood).toMatchObject({ id: "cabbage", kcalPer100g: 25 });
    expect(review.trustedNutritionReady).toBe(true);
  });

  // Test 5 (required) — a genuine dead end: no local candidate, no external
  // candidate, dynamic resolution itself returned unresolved.
  it("5 — an ingredient with no meaningful candidate is unresolved, never trusted", () => {
    const review = toIngredientReview(ingredient({ resolution: "unresolved", selectedFood: null, quantity: null }));
    expect(review.status).toBe("unresolved");
    expect(review.resolvedFood).toBeNull();
    expect(review.externalCandidates).toBeUndefined();
    expect(review.localCandidates).toBeUndefined();
    expect(review.trustedNutritionReady).toBe(false);
  });

  // Test 15 (required) — the exact real "25 dkg Kolbász" case observed live:
  // the "dkg" unit-parsing bug pollutes parsedFoodQuery to "dkg kolbasz",
  // which causes hasSemanticCoverage to reject an otherwise-successful
  // dynamic resolution — surfacing here as a plain "unresolved" outcome.
  // Never fixed in this checkpoint; only asserting it cannot leak into trust.
  it("15 — a dkg-corrupted ingredient query cannot count as trusted, even if it happened to carry a stale preview", () => {
    const review = toIngredientReview(ingredient({
      originalText: "25 dkg Kolbász", parsedFoodQuery: "dkg kolbasz", parsedUnit: "piece" as any,
      resolution: "unresolved", selectedFood: null, quantity: null
    }));
    expect(review.status).toBe("unresolved");
    expect(review.trustedNutritionReady).toBe(false);
    expect(review.resolvedFood).toBeNull();
  });

  it("a dynamic USDA confirmation_required outcome carries the real ExternalFoodCandidate shape, never a second protocol", () => {
    const candidate = { source: "usda_fdc" as const, sourceId: "12345", name: "Potato", originalName: "Potato", normalizedName: "potato", nutrientBasis: "per_100_g" as const, retrievedAt: new Date().toISOString(), confidence: 0.6, matchPolicy: "review_required" as const, kcalPer100g: 77, fatPer100g: 0.1, proteinPer100g: 2, carbsPer100g: 17, fiberPer100g: 2.2, nutrients: [] } as any;
    const review = toIngredientReview(ingredient({
      originalText: "4 db Burgonya", parsedFoodQuery: "burgonya",
      resolution: "confirmation_required", selectedFood: null, quantity: null,
      externalCandidates: [candidate], externalCandidatesReason: "weak_match"
    }));
    expect(review.status).toBe("confirmation_required");
    expect(review.externalCandidates).toEqual([candidate]);
    expect(review.externalCandidatesReason).toBe("weak_match");
    expect(review.localCandidates).toBeUndefined();
    expect(review.trustedNutritionReady).toBe(false);
  });
});

describe("classifyRecipeReview: recipe-level state (FULLY_RESOLVED / REVIEWABLE / UNUSABLE)", () => {
  function resolved() { return toIngredientReview(ingredient({ resolution: "resolved", selectedFood: cabbage, quantity: { status: "resolved", grams: 100 } })); }
  function confirmationRequired() { return toIngredientReview(ingredient({ resolution: "confirmation_required", selectedFood: egg, quantity: { status: "resolved", grams: 50 } })); }
  function unresolved() { return toIngredientReview(ingredient({ resolution: "unresolved", selectedFood: null, quantity: null })); }

  it("1 — fully resolved recipe -> final nutrition calculable", () => {
    const summary = classifyRecipeReview([resolved(), resolved()]);
    expect(summary.state).toBe("fully_resolved");
    expect(summary.trustedNutritionReadyCount).toBe(2);
  });

  // Test 3 (required)
  it("3 — a 3 resolved / 2 confirmation_required / 1 unresolved mixture reports correct counts and is REVIEWABLE", () => {
    const reviews = [resolved(), resolved(), resolved(), confirmationRequired(), confirmationRequired(), unresolved()];
    const summary = classifyRecipeReview(reviews);
    expect(summary.resolvedCount).toBe(3);
    expect(summary.confirmationRequiredCount).toBe(2);
    expect(summary.unresolvedCount).toBe(1);
    expect(summary.state).toBe("reviewable");
  });

  // Test 4 (required)
  it("4 — all ingredients confirmation_required with meaningful candidates -> REVIEWABLE, never falsely fully_resolved", () => {
    const summary = classifyRecipeReview([confirmationRequired(), confirmationRequired(), confirmationRequired()]);
    expect(summary.state).toBe("reviewable");
    expect(summary.trustedNutritionReadyCount).toBe(0);
  });

  // Test 8 (required) — nothing meaningful to review at all.
  it("8 — a candidate where every ingredient is a dead end is never made reviewable (UNUSABLE)", () => {
    const summary = classifyRecipeReview([unresolved(), unresolved()]);
    expect(summary.state).toBe("unusable");
  });

  it("zero extracted ingredients is UNUSABLE", () => {
    expect(classifyRecipeReview([]).state).toBe("unusable");
  });
});

describe("computeTrustedNutrition: final nutrition only from trusted ingredients", () => {
  it("refuses to compute anything when even one ingredient is merely confirmation_required", () => {
    const trustedCabbage = toIngredientReview(ingredient({ resolution: "resolved", selectedFood: cabbage, quantity: { status: "resolved", grams: 500 } }));
    const previewEgg = toIngredientReview(ingredient({ resolution: "confirmation_required", selectedFood: egg, quantity: { status: "resolved", grams: 250 } }));
    const result = computeTrustedNutrition([trustedCabbage, previewEgg]);
    expect(result.calculable).toBe(false);
    expect(result.macros).toBeNull();
  });

  it("computes real per-100g macros once every ingredient is genuinely trusted", () => {
    const trustedCabbage = toIngredientReview(ingredient({ resolution: "resolved", selectedFood: cabbage, quantity: { status: "resolved", grams: 500 } }));
    const result = computeTrustedNutrition([trustedCabbage]);
    expect(result.calculable).toBe(true);
    expect(result.macros?.kcal).toBeCloseTo(25, 5);
  });
});
