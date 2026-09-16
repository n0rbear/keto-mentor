import { describe, expect, it } from "vitest";
import {
  classifySourceTier, domainMatchesRequestedBrand, isAuthoritativeTier, isEnergyConsistent,
  isGroundedInSource, isNutrientGrounded, validateAndNormalizeEvidence, withinPhysicalBounds, type ExtractedNutritionEvidence
} from "./nutrition-evidence.js";

describe("classifySourceTier", () => {
  it.each([
    ["fdc.nal.usda.gov", "tier_a_official"],
    ["blsdb.de", "tier_a_official"],
    ["something.gov", "tier_a_official"],
    ["food.gov.uk", "tier_a_official"],
    ["efsa.europa.eu", "tier_a_official"],
  ])("%s -> %s (government/official pattern or known database)", (domain, expected) => {
    expect(classifySourceTier(domain, "anything")).toBe(expected);
  });

  it("a domain whose own label is genuinely attested as a token of the requested identity is tier_b_manufacturer", () => {
    expect(classifySourceTier("univer.hu", "Univer Erős Pista")).toBe("tier_b_manufacturer");
  });

  it("a domain NOT matching any tier-A pattern and NOT attested in the identity is discovery_only", () => {
    expect(classifySourceTier("some-food-blog.com", "karfiol")).toBe("discovery_only");
    expect(classifySourceTier("recipesite.hu", "Univer Erős Pista")).toBe("discovery_only");
  });

  it("isAuthoritativeTier is false only for discovery_only", () => {
    expect(isAuthoritativeTier("tier_a_official")).toBe(true);
    expect(isAuthoritativeTier("tier_b_manufacturer")).toBe(true);
    expect(isAuthoritativeTier("tier_c_institutional")).toBe(true);
    expect(isAuthoritativeTier("discovery_only")).toBe(false);
  });
});

describe("domainMatchesRequestedBrand", () => {
  it("matches when the domain's own label is a real token of the identity", () => {
    expect(domainMatchesRequestedBrand("univer.hu", "Univer Erős Pista paradicsomos")).toBe(true);
  });
  it("does not match a coincidental short/unrelated label", () => {
    expect(domainMatchesRequestedBrand("aa.com", "Univer Erős Pista")).toBe(false);
    expect(domainMatchesRequestedBrand("unrelatedshop.hu", "Univer Erős Pista")).toBe(false);
  });
});

describe("isGroundedInSource — the mechanical (non-AI) grounding check", () => {
  it("a quote that genuinely appears (whitespace/case-insensitive) in the source text is grounded", () => {
    expect(isGroundedInSource("25 kcal per 100g", "Nutrition facts:\n  25   KCAL per 100g  serving")).toBe(true);
  });
  it("a quote that does NOT appear in the source text is rejected — the load-bearing anti-fabrication check", () => {
    expect(isGroundedInSource("25 kcal per 100g", "This page is about something else entirely.")).toBe(false);
  });
  it("a trivially short/empty quote is never trusted regardless of substring presence", () => {
    expect(isGroundedInSource("2", "the number 2 appears here")).toBe(false);
  });
});

describe("isEnergyConsistent — anomaly detection only, never replaces the source's own kcal", () => {
  it("ordinary rounding/fiber/organic-acid variance is tolerated", () => {
    expect(isEnergyConsistent(52, 0.3, 0.2, 14)).toBe(true);
  });
  it("a gross mismatch (e.g. kJ misread as kcal) is rejected", () => {
    expect(isEnergyConsistent(400, 0.3, 0.2, 14)).toBe(false);
  });
});

describe("withinPhysicalBounds — same plausibility bounds as validateExternalCandidate", () => {
  it("accepts ordinary values", () => {
    expect(withinPhysicalBounds({ kcal: 250, protein: 5, fat: 10, carbs: 30, fiber: 3 })).toBe(true);
  });
  it("rejects impossible/out-of-range values", () => {
    expect(withinPhysicalBounds({ kcal: 5000, protein: 5, fat: 10, carbs: 30, fiber: 3 })).toBe(false);
    expect(withinPhysicalBounds({ kcal: 250, protein: -1, fat: 10, carbs: 30, fiber: 3 })).toBe(false);
    expect(withinPhysicalBounds({ kcal: 250, protein: 5, fat: 10, carbs: 30, fiber: 200 })).toBe(false);
  });
});

const sourceMeta = { sourceUrl: "https://example.gov/food", sourceDomain: "example.gov", sourceTitle: "Food page", sourceTier: "tier_a_official" as const, retrievedAt: "2026-09-16T00:00:00.000Z", requestedIdentity: "karfiol", canonicalIdentity: "cauliflower" };
const pageText = "Cauliflower, raw. Serving size: 100 g. Calories: 25 kcal. Protein: 1.9 g. Fat: 0.3 g. Carbohydrate: 5 g. Dietary fiber: 2 g.";

function baseExtracted(overrides: Partial<ExtractedNutritionEvidence> = {}): ExtractedNutritionEvidence {
  return {
    sourceFoodName: "Cauliflower, raw",
    basis: { amountGrams: 100, quote: "Serving size: 100 g" },
    kcal: { value: 25, quote: "Calories: 25 kcal" },
    protein: { value: 1.9, quote: "Protein: 1.9 g" },
    fat: { value: 0.3, quote: "Fat: 0.3 g" },
    carbs: { value: 5, quote: "Carbohydrate: 5 g" },
    fiber: { value: 2, quote: "Dietary fiber: 2 g" },
    extractionMethod: "llm_grounded",
    ...overrides
  };
}

describe("validateAndNormalizeEvidence — the full mechanical gate before persistence", () => {
  it("fully grounded, complete, energy-consistent evidence at 100g basis passes through unchanged", () => {
    const result = validateAndNormalizeEvidence(baseExtracted(), pageText, sourceMeta);
    expect(result).toMatchObject({ kcalPer100g: 25, proteinPer100g: 1.9, fatPer100g: 0.3, carbsPer100g: 5, fiberPer100g: 2 });
  });

  it("normalizes a non-100g basis linearly (per 50g -> x2)", () => {
    const extracted = baseExtracted({
      basis: { amountGrams: 50, quote: "per 50 g serving" },
      kcal: { value: 12.5, quote: "12.5 kcal" }, protein: { value: 0.95, quote: "0.95 g protein" },
      fat: { value: 0.15, quote: "0.15 g fat" }, carbs: { value: 2.5, quote: "2.5 g carb" }, fiber: { value: 1, quote: "1 g fiber" }
    });
    const text = "per 50 g serving: 12.5 kcal, 0.95 g protein, 0.15 g fat, 2.5 g carb, 1 g fiber";
    const result = validateAndNormalizeEvidence(extracted, text, sourceMeta);
    expect(result).toMatchObject({ kcalPer100g: 25, proteinPer100g: 1.9, fatPer100g: 0.3, carbsPer100g: 5, fiberPer100g: 2 });
  });

  it('REJECTS a basis with no explicit gram equivalent — "one medium fish" must never be converted', () => {
    const extracted = baseExtracted({ basis: null });
    expect(validateAndNormalizeEvidence(extracted, pageText, sourceMeta)).toBeNull();
  });

  it("REJECTS when fiber is not stated — never assumes 0 (Phase 6's hard requirement)", () => {
    const extracted = baseExtracted({ fiber: null });
    expect(validateAndNormalizeEvidence(extracted, pageText, sourceMeta)).toBeNull();
  });

  it("REJECTS when a required macro (kcal/protein/fat/carbs) is missing", () => {
    expect(validateAndNormalizeEvidence(baseExtracted({ kcal: null }), pageText, sourceMeta)).toBeNull();
    expect(validateAndNormalizeEvidence(baseExtracted({ carbs: null }), pageText, sourceMeta)).toBeNull();
  });

  it("REJECTS a claimed quote that is not actually present in the source text — the fabrication defense", () => {
    const extracted = baseExtracted({ kcal: { value: 999, quote: "this text does not appear on the page" } });
    expect(validateAndNormalizeEvidence(extracted, pageText, sourceMeta)).toBeNull();
  });

  it("REJECTS a discovery_only source tier outright, regardless of how clean the evidence looks", () => {
    const result = validateAndNormalizeEvidence(baseExtracted(), pageText, { ...sourceMeta, sourceTier: "discovery_only" });
    expect(result).toBeNull();
  });

  it("REJECTS grossly energy-inconsistent evidence (unit-confusion anomaly)", () => {
    const extracted = baseExtracted({ kcal: { value: 400, quote: "400 kcal" } });
    const text = pageText.replace("25 kcal", "400 kcal");
    expect(validateAndNormalizeEvidence(extracted, text, sourceMeta)).toBeNull();
  });

  it("REJECTS out-of-physical-bounds normalized values (e.g. a nonsensical tiny basis amount inflating values past plausibility)", () => {
    const extracted = baseExtracted({ basis: { amountGrams: 1, quote: "per 1 g" }, kcal: { value: 25, quote: "25 kcal" } });
    const text = "per 1 g: 25 kcal, 1.9 g protein, 0.3 g fat, 5 g carb, 2 g fiber";
    expect(validateAndNormalizeEvidence(extracted, text, sourceMeta)).toBeNull();
  });
});

// P0 grounding-hardening review (2026-09-16): adversarial cases proving
// grounding binds LABEL + VALUE + UNIT together, not merely "this text
// exists somewhere on the page".
describe("isNutrientGrounded — adversarial label/value/unit binding", () => {
  it("REJECTS an unrelated number elsewhere on the page merely because the digits match", () => {
    const text = "Page view count: 20. Serving size 100 g.";
    expect(isNutrientGrounded("protein", 20, "Page view count: 20", text)).toBe(false);
  });

  it("REJECTS a calories/protein swap — citing the calories line as evidence for protein", () => {
    const text = "Calories 111 kcal. Protein 5.51 g.";
    expect(isNutrientGrounded("protein", 111, "Calories 111 kcal", text)).toBe(false);
  });

  it("REJECTS a quote borrowed from an entirely different nutrient's line even when both numbers coincidentally match", () => {
    const text = "Sodium 20 mg. Protein 20 g.";
    // A quote of the sodium line has no "protein" label token -> rejected for the protein field.
    expect(isNutrientGrounded("protein", 20, "Sodium 20 mg", text)).toBe(false);
    // The genuine protein line is accepted.
    expect(isNutrientGrounded("protein", 20, "Protein 20 g", text)).toBe(true);
  });

  it("REJECTS 20 mg being misread as 20 g for a gram-denominated macro field", () => {
    const text = "Sodium 20 mg. Fiber content unclear.";
    expect(isNutrientGrounded("fiber", 20, "Sodium 20 mg", text)).toBe(false);
  });

  it("kcal is exempt from the mg/g unit check (kcal has no gram unit to confuse)", () => {
    const text = "Energy 111 kcal per serving.";
    expect(isNutrientGrounded("kcal", 111, "Energy 111 kcal", text)).toBe(true);
  });

  it("REJECTS two nutrition tables on the same page when the quote is from the WRONG table's matching-but-irrelevant field", () => {
    const text = "Product A - Protein: 8 g. ---- Product B - Protein: 20 g.";
    // Value 20 is only genuinely grounded against Product B's own line.
    expect(isNutrientGrounded("protein", 20, "Product B - Protein: 20 g", text)).toBe(true);
    expect(isNutrientGrounded("protein", 20, "Product A - Protein: 8 g", text)).toBe(false);
  });

  it("REJECTS unrelated product nutrition appearing elsewhere on the page (cross-product contamination)", () => {
    const text = "You might also like: Granola Bar, Calories 150 kcal. Our product: Calories 111 kcal.";
    expect(isNutrientGrounded("kcal", 150, "Our product: Calories 111 kcal", text)).toBe(false);
  });

  it("ACCEPTS a decimal-comma value (European formatting)", () => {
    const text = "Eiweiß 5,51 g";
    expect(isNutrientGrounded("protein", 5.51, "Eiweiß 5,51 g", text)).toBe(true);
  });

  it("ACCEPTS localized HU/DE/EN nutrient labels", () => {
    expect(isNutrientGrounded("protein", 5.51, "Fehérje: 5,51 g", "Fehérje: 5,51 g")).toBe(true);
    expect(isNutrientGrounded("fat", 6.96, "Zsírtartalom 6.96g", "Zsírtartalom 6.96g")).toBe(true);
    expect(isNutrientGrounded("fiber", 4.5, "Ballaststoffe: 4.5 g", "Ballaststoffe: 4.5 g")).toBe(true);
    expect(isNutrientGrounded("carbs", 2.94, "Szénhidrát 2.94 g", "Szénhidrát 2.94 g")).toBe(true);
  });

  it("REJECTS a quote with the right label but the WRONG number (LLM cites the right line but a hallucinated value)", () => {
    const text = "Protein: 5.51 g";
    expect(isNutrientGrounded("protein", 99, "Protein: 5.51 g", text)).toBe(false);
  });

  it("REJECTS a quote with the right number but no label at all (bare number, no nutrient context)", () => {
    const text = "The product code is 111.";
    expect(isNutrientGrounded("kcal", 111, "The product code is 111", text)).toBe(false);
  });
});

describe("validateAndNormalizeEvidence — end-to-end with the hardened grounding", () => {
  it("REJECTS a hallucinated value even when its quote is a real, verbatim (but irrelevant) substring of the page", () => {
    // The old (pre-hardening) grounding check would have accepted this: the
    // quote genuinely appears on the page, it just has nothing to do with protein.
    const extracted = baseExtracted({ protein: { value: 1.9, quote: "Serving size: 100 g" } });
    expect(validateAndNormalizeEvidence(extracted, pageText, sourceMeta)).toBeNull();
  });

  it("REJECTS a basis quote that states the amount but with no gram unit attached", () => {
    const extracted = baseExtracted({ basis: { amountGrams: 100, quote: "About 100 servings sold" } });
    const text = pageText + " About 100 servings sold";
    expect(validateAndNormalizeEvidence(extracted, text, sourceMeta)).toBeNull();
  });
});
