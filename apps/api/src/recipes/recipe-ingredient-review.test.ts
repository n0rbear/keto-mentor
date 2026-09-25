import { describe, expect, it } from "vitest";
import { classifyRecipeReview, computeTrustedNutrition, localizeResolvedFoodNames, toIngredientReview, type ReviewableIngredient } from "./recipe-ingredient-review.js";

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
  it("an unresolved serving accompaniment stays visible but does not block base nutrition", () => {
    const review = toIngredientReview(ingredient({ resolution: "unresolved", selectedFood: null, quantity: null, sourceGroup: "For serving", role: "serving_accompaniment", includedInBaseNutrition: false, evidence: "source_group" }));
    expect(review).toMatchObject({ status: "unresolved", role: "serving_accompaniment", includedInBaseNutrition: false, excludeFromNutrition: true, trustedNutritionReady: true });
  });

  it("a material core ingredient with unknown quantity still blocks", () => {
    const review = toIngredientReview(ingredient({ resolution: "resolved", selectedFood: cabbage, quantity: null, role: "core", includedInBaseNutrition: true }));
    expect(review.trustedNutritionReady).toBe(false);
  });
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

  // Live staging RCA (2026-09-24): the real call site (recipe-discovery-
  // fallback.ts's attemptCandidate) reaches this function via an UNSAFE cast
  // (`ingredient as unknown as ReviewableIngredient`) on whatever shape the
  // real dynamic-resolution pipeline actually produced — `candidates` being
  // absent there is not something the type system actually guarantees can't
  // happen at runtime, only something this TYPE claims. Before this fix, an
  // ingredient reaching confirmation_required with a selectedFood preview but
  // no populated `candidates` (and no external candidates) threw a raw
  // TypeError instead of returning a review — exactly the class of exception
  // that (uncaught further up) could abort an entire recipe-discovery search
  // over ONE candidate's ONE ingredient.
  it("a confirmation_required ingredient with a selectedFood preview but no populated candidates array never throws", () => {
    const malformed = { originalText: "x", parsedFoodQuery: "x", resolution: "confirmation_required", selectedFood: egg, candidates: undefined, quantity: null } as unknown as ReviewableIngredient;
    expect(() => toIngredientReview(malformed)).not.toThrow();
    const review = toIngredientReview(malformed);
    expect(review.status).toBe("confirmation_required");
    expect(review.localCandidates).toEqual([{ id: "egg", name: "Egg", source: "open_database" }]);
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
  // the "dkg" unit-parsing bug (root-caused and fixed in natural-food-
  // query.ts's UNITS map — owner-beta checkpoint 2026-09-13) used to
  // pollute parsedFoodQuery to "dkg kolbasz", which made hasSemanticCoverage
  // reject an otherwise-successful dynamic resolution. That specific cause is
  // gone, but this defense-in-depth guarantee is worth keeping regardless —
  // a hand-built, still-corrupted-looking query (however it might arise)
  // must never count as trusted just because it carries a stale preview.
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
  it("excludes a visible unquantified seasoning without blocking calculation", () => {
    const trustedCabbage = toIngredientReview(ingredient({ resolution: "resolved", selectedFood: cabbage, quantity: { status: "resolved", grams: 500 }, quantitySource: "explicit" }));
    const salt = toIngredientReview(ingredient({ originalText: "só ízlés szerint", parsedFoodQuery: "salt", resolution: "unresolved", selectedFood: null, quantity: null, quantitySource: "unquantified_seasoning", excludeFromNutrition: true }));
    expect(salt).toMatchObject({ excludeFromNutrition: true, quantitySource: "unquantified_seasoning", trustedNutritionReady: true });
    expect(computeTrustedNutrition([trustedCabbage, salt]).calculable).toBe(true);
  });
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

// Owner-beta checkpoint (2026-09-15): final recipe nutrition — deterministic
// exact-math proof, computed independently in this test (not via any
// application aggregate function) against known synthetic Food nutrition.
describe("PHASE 3 — single-ingredient contribution formula: authoritativeFoodNutritionPer100g x quantityGrams/100, no premature rounding", () => {
  const preciseFood = { id: "f", name: "Precise Food", source: "usda_fdc", kcalPer100g: 200, fatPer100g: 20, proteinPer100g: 10, carbsPer100g: 5, fiberPer100g: 0 };
  it("250g of (200kcal/10P/20F/5C per 100g) -> exactly 500kcal/25P/50F/12.5C", () => {
    const trusted = toIngredientReview(ingredient({ resolution: "resolved", selectedFood: preciseFood, quantity: { status: "resolved", grams: 250 } }));
    const result = computeTrustedNutrition([trusted]);
    expect(result.calculable).toBe(true);
    // weightGrams === quantityGrams for a single ingredient, so macros
    // (per 100g of total weight) reduces back to the food's own values —
    // the real proof is `total`, the actual 250g contribution.
    expect(result.total).toEqual({ kcal: 500, protein: 25, fat: 50, carbs: 12.5, fiber: 0, netCarbs: 12.5 });
  });
});

describe("PHASE 4/17 — whole-recipe aggregation matrix: explicit + estimated + excluded-seasoning + excluded-accompaniment", () => {
  // A: 200g, 100 kcal/100g, 10P/5F/2C/1Fi -> 200kcal/20P/10F/4C/2Fi, net=2
  const foodA = { id: "a", name: "A", source: "usda_fdc", kcalPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 2, fiberPer100g: 1 };
  // B: 50g, 400 kcal/100g, 20P/30F/10C/3Fi -> 200kcal/10P/15F/5C/1.5Fi, net=3.5
  const foodB = { id: "b", name: "B", source: "usda_fdc", kcalPer100g: 400, proteinPer100g: 20, fatPer100g: 30, carbsPer100g: 10, fiberPer100g: 3 };
  // C: estimated 10g, 300 kcal/100g, 5P/25F/15C/5Fi -> 30kcal/0.5P/2.5F/1.5C/0.5Fi, net=1
  const foodC = { id: "c", name: "C", source: "usda_fdc", kcalPer100g: 300, proteinPer100g: 5, fatPer100g: 25, carbsPer100g: 15, fiberPer100g: 5 };

  function matrix() {
    const a = toIngredientReview(ingredient({ originalText: "200g A", parsedFoodQuery: "a", resolution: "resolved", selectedFood: foodA, quantity: { status: "resolved", grams: 200 }, quantitySource: "explicit" }));
    const b = toIngredientReview(ingredient({ originalText: "50g B", parsedFoodQuery: "b", resolution: "resolved", selectedFood: foodB, quantity: { status: "resolved", grams: 50 }, quantitySource: "explicit" }));
    const c = toIngredientReview(ingredient({ originalText: "10g C (estimated)", parsedFoodQuery: "c", resolution: "resolved", selectedFood: foodC, quantity: { status: "resolved", grams: 10 }, quantitySource: "estimated", quantityConfidence: 0.8 }));
    const salt = toIngredientReview(ingredient({ originalText: "só", parsedFoodQuery: "salt", resolution: "unresolved", selectedFood: null, quantity: null, quantitySource: "unquantified_seasoning", excludeFromNutrition: true }));
    const bread = toIngredientReview(ingredient({ originalText: "friss kenyér", parsedFoodQuery: "bread", resolution: "unresolved", selectedFood: null, quantity: null, sourceGroup: "For serving", role: "serving_accompaniment", includedInBaseNutrition: false, evidence: "source_group" }));
    return { a, b, c, salt, bread, all: [a, b, c, salt, bread] };
  }

  it("every included ingredient's OWN contribution matches the exact hand-computed formula", () => {
    const { all } = matrix();
    const result = computeTrustedNutrition(all, 2);
    expect(result.calculable).toBe(true);
    // Independently hand-computed expected whole-recipe total (Σ contributions of A, B, C only — salt and bread contribute exactly zero).
    const expectedTotal = { kcal: 430, protein: 30.5, fat: 27.5, carbs: 10.5, fiber: 4, netCarbs: 6.5 };
    expect(result.total!.kcal).toBeCloseTo(expectedTotal.kcal, 10);
    expect(result.total!.protein).toBeCloseTo(expectedTotal.protein, 10);
    expect(result.total!.fat).toBeCloseTo(expectedTotal.fat, 10);
    expect(result.total!.carbs).toBeCloseTo(expectedTotal.carbs, 10);
    expect(result.total!.fiber).toBeCloseTo(expectedTotal.fiber, 10);
    expect(result.total!.netCarbs).toBeCloseTo(expectedTotal.netCarbs, 10);
  });

  it("excluded seasoning and excluded serving accompaniment contribute EXACTLY zero to the whole-recipe weight and total", () => {
    const { a, b, c, all } = matrix();
    const withoutExclusions = computeTrustedNutrition([a, b, c]);
    const withExclusions = computeTrustedNutrition(all);
    // Adding salt + bread to the ingredient list must not change the total at all.
    expect(withExclusions.total).toEqual(withoutExclusions.total);
    expect(withExclusions.weightGrams).toEqual(withoutExclusions.weightGrams);
    expect(withExclusions.weightGrams).toBe(260); // 200 + 50 + 10, salt/bread excluded
  });

  it("both excluded ingredients remain VISIBLE in the review (never dropped from the ingredient list itself)", () => {
    const { all } = matrix();
    expect(all).toHaveLength(5);
    expect(all.find((i) => i.parsedFoodQuery === "salt")).toBeDefined();
    expect(all.find((i) => i.parsedFoodQuery === "bread")).toBeDefined();
  });

  it("per-100g basis is exactly Σcontributions x 100/includedWeightGrams — independently recomputed", () => {
    const { all } = matrix();
    const result = computeTrustedNutrition(all);
    const expectedPer100g = { kcal: 430 * 100 / 260, protein: 30.5 * 100 / 260, fat: 27.5 * 100 / 260, carbs: 10.5 * 100 / 260, fiber: 4 * 100 / 260, netCarbs: 6.5 * 100 / 260 };
    expect(result.macros!.kcal).toBeCloseTo(expectedPer100g.kcal, 10);
    expect(result.macros!.protein).toBeCloseTo(expectedPer100g.protein, 10);
    expect(result.macros!.fat).toBeCloseTo(expectedPer100g.fat, 10);
    expect(result.macros!.carbs).toBeCloseTo(expectedPer100g.carbs, 10);
    expect(result.macros!.fiber).toBeCloseTo(expectedPer100g.fiber, 10);
  });

  it("PHASE 6 — per-serving is exactly wholeRecipeTotal / servingCount, independently recomputed for S=1,2,4", () => {
    const { all } = matrix();
    for (const servings of [1, 2, 4]) {
      const result = computeTrustedNutrition(all, servings);
      expect(result.perServing!.kcal).toBeCloseTo(430 / servings, 10);
      expect(result.perServing!.protein).toBeCloseTo(30.5 / servings, 10);
      expect(result.perServing!.fat).toBeCloseTo(27.5 / servings, 10);
      expect(result.perServing!.carbs).toBeCloseTo(10.5 / servings, 10);
    }
  });

  it("PHASE 6 — invalid/missing/zero/negative servings never produce NaN/Infinity/a fabricated perServing — perServing is simply null", () => {
    const { all } = matrix();
    for (const servings of [0, -1, -4, NaN, undefined]) {
      const result = computeTrustedNutrition(all, servings as any);
      expect(result.perServing).toBeNull();
      expect(result.calculable).toBe(true); // the whole-recipe total itself is unaffected by an invalid serving count
    }
  });

  it("PHASE 27 — total.netCarbs and perServing/per100g(.macros).netCarbs never disagree, even when one ingredient's fiber exceeds its own carbs", () => {
    // fiber (5) > carbs (2) -> this ingredient's OWN netCarbs clamps to 0.
    const husk = { id: "husk", name: "Husk", source: "usda_fdc", kcalPer100g: 50, proteinPer100g: 1, fatPer100g: 1, carbsPer100g: 2, fiberPer100g: 5 };
    // ordinary: carbs (10) > fiber (1) -> netCarbs = 9.
    const grain = { id: "grain", name: "Grain", source: "usda_fdc", kcalPer100g: 80, proteinPer100g: 2, fatPer100g: 2, carbsPer100g: 10, fiberPer100g: 1 };
    const a = toIngredientReview(ingredient({ resolution: "resolved", selectedFood: husk, quantity: { status: "resolved", grams: 100 } }));
    const b = toIngredientReview(ingredient({ resolution: "resolved", selectedFood: grain, quantity: { status: "resolved", grams: 100 } }));
    const result = computeTrustedNutrition([a, b], 2);
    // total.netCarbs = max(0, 2-5) + max(0, 10-1) = 0 + 9 = 9 (sum of each ingredient's own clamp).
    expect(result.total!.netCarbs).toBe(9);
    // perServing (S=2) must be EXACTLY total/2 = 4.5 — never a fresh, differently-clamped 3
    // (which max(0, (2+10)*0.5 - (5+1)*0.5) = max(0,6-3) = 3 would silently produce).
    expect(result.perServing!.netCarbs).toBe(4.5);
    // macros (per-100g-of-included-weight, factor=100/200=0.5 here too) must agree with perServing.
    expect(result.macros!.netCarbs).toBe(4.5);
  });

  it("PHASE 11 — rounding: summing full-precision ingredient contributions avoids the error a naively pre-rounded sum would introduce", () => {
    // If each ingredient's OWN contribution were rounded to 2dp before
    // summing (100/3=33.33 x3=99.99 instead of 100.00), the naive approach
    // would be off by a cent-like error. computeTrustedNutrition must not
    // do this: it sums full-precision scaleMacros() results.
    const thirds = { id: "t", name: "Thirds", source: "usda_fdc", kcalPer100g: 100, proteinPer100g: 0, fatPer100g: 0, carbsPer100g: 0, fiberPer100g: 0 };
    const oneThirdGrams = 100 / 3; // 33.333...g x 3 = exactly 100g again
    const three = Array.from({ length: 3 }, (_, i) => toIngredientReview(ingredient({ originalText: `slice ${i}`, parsedFoodQuery: "thirds", resolution: "resolved", selectedFood: thirds, quantity: { status: "resolved", grams: oneThirdGrams } })));
    const result = computeTrustedNutrition(three);
    expect(result.total!.kcal).toBeCloseTo(100, 9); // NOT 99.99 from premature per-ingredient rounding
  });
});

describe("PHASE 18 — incomplete recipe matrix: five blockers vs two non-blockers", () => {
  const known = { id: "k", name: "Known", source: "usda_fdc", kcalPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 2, fiberPer100g: 1 };
  const trustedOne = () => toIngredientReview(ingredient({ resolution: "resolved", selectedFood: known, quantity: { status: "resolved", grams: 100 } }));

  it("1. an unresolved material Food blocks completeness", () => {
    const unresolved = toIngredientReview(ingredient({ resolution: "unresolved", selectedFood: null, quantity: null }));
    expect(computeTrustedNutrition([trustedOne(), unresolved]).calculable).toBe(false);
  });
  it("2. a confirmation_required Food blocks completeness even with a resolved-looking quantity", () => {
    const pending = toIngredientReview(ingredient({ resolution: "confirmation_required", selectedFood: known, quantity: { status: "resolved", grams: 50 } }));
    expect(computeTrustedNutrition([trustedOne(), pending]).calculable).toBe(false);
  });
  it("3. an unknown material quantity blocks completeness even for a resolved Food", () => {
    const noQty = toIngredientReview(ingredient({ resolution: "resolved", selectedFood: known, quantity: null }));
    expect(computeTrustedNutrition([trustedOne(), noQty]).calculable).toBe(false);
  });
  it("6. an excluded unquantified seasoning does NOT block completeness", () => {
    const salt = toIngredientReview(ingredient({ resolution: "unresolved", selectedFood: null, quantity: null, quantitySource: "unquantified_seasoning", excludeFromNutrition: true }));
    expect(computeTrustedNutrition([trustedOne(), salt]).calculable).toBe(true);
  });
  it("7. an excluded serving accompaniment does NOT block completeness, even fully unresolved", () => {
    const bread = toIngredientReview(ingredient({ resolution: "unresolved", selectedFood: null, quantity: null, sourceGroup: "For serving", role: "serving_accompaniment", includedInBaseNutrition: false }));
    expect(computeTrustedNutrition([trustedOne(), bread]).calculable).toBe(true);
  });
});

// Owner request (2026-09-25): each blocking ingredient names its exact reason.
describe("toIngredientReview: blockingReason", () => {
  const food = { id: "f1", name: "Cabbage", source: "bls", kcalPer100g: 25, fatPer100g: 0.1, proteinPer100g: 1.3, carbsPer100g: 5.8, fiberPer100g: 2.5 };
  const base: ReviewableIngredient = { originalText: "x", parsedFoodQuery: "x", resolution: "unresolved", selectedFood: null, candidates: [], quantity: null };
  it.each([
    [{ ...base }, "food_not_found"],
    [{ ...base, aiEstimate: { canonicalFoodName: "x" } as any }, "ai_estimate_only"],
    [{ ...base, resolution: "confirmation_required", selectedFood: food, candidates: [food] }, "food_needs_confirmation"],
    [{ ...base, resolution: "resolved", selectedFood: food, candidates: [food] }, "quantity_missing"],
    [{ ...base, resolution: "resolved", selectedFood: food, candidates: [food], quantity: { status: "resolved", grams: 100 } }, undefined]
  ] as const)("%# -> %s", (ingredient, reason) => {
    expect(toIngredientReview(ingredient as ReviewableIngredient).blockingReason).toBe(reason);
  });
});

// Owner report (2026-09-25): recipe rows showed BLS German / USDA English names.
describe("localizeResolvedFoodNames", () => {
  const food = (name: string, names?: Record<string, string>) => ({ id: name, name, source: "bls", kcalPer100g: 20, fatPer100g: 0, proteinPer100g: 1, carbsPer100g: 4, fiberPer100g: 2, ...(names ? { names } : {}) });
  const review = (resolvedFood: any) => ({ ...toIngredientReview({ originalText: "x", parsedFoodQuery: "x", resolution: "resolved", selectedFood: resolvedFood, candidates: [resolvedFood], quantity: { status: "resolved", grams: 100 } }) });

  it("adds a display name in the user's language only for foods missing it, in one call", async () => {
    const calls: any[] = [];
    const provider = { localize: async (items: any[]) => { calls.push(items); return new Map(items.map((i) => [i.id, i.authoritativeName === "Sauerkraut abgetropft, roh" ? "Savanyú káposzta, lecsepegtetve" : "?"])); } };
    const reviews = [review(food("Sauerkraut abgetropft, roh")), review(food("Gouda", { hu: "Gouda sajt" }))];
    const out = await localizeResolvedFoodNames(reviews, provider, "hu");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(1);
    expect(out[0].resolvedFood!.names!.hu).toBe("Savanyú káposzta, lecsepegtetve");
    expect(out[0].resolvedFood!.name).toBe("Sauerkraut abgetropft, roh");
    expect(out[1].resolvedFood!.names!.hu).toBe("Gouda sajt");
  });

  it("a failing localization leaves the names untouched", async () => {
    const reviews = [review(food("Knoblauch roh"))];
    const out = await localizeResolvedFoodNames(reviews, { localize: async () => { throw new Error("down"); } }, "hu");
    expect(out[0].resolvedFood!.names).toBeUndefined();
  });
});
