// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FoodUnderstandingPreview, type FoodUnderstandingPreviewValue, type RecipeDiscoveryCandidateValue, type AiEstimateValue } from "./FoodUnderstandingPreview";
import { dict, type Lang } from "./i18n";

afterEach(cleanup);

const compound: FoodUnderstandingPreviewValue = {
  parsed: { foodQuery: "lecsó" }, selectedFood: null,
  quantity: null, canConfirm: false, foodResolution: "compound", interpretationSource: "ai_assisted",
  semantic: { dishName: "lecsó", clarificationNeeded: true, clarificationReason: "Base dish portion is unresolved." },
  items: [
    { parsed: { foodQuery: "sausage", quantity: 2, unit: "piece" }, selectedFood: { name: "Sausage" }, quantity: { status: "resolved", grams: 100, estimated: false }, foodResolution: "resolved", semanticItem: { canonicalName: "sausage", evidence: "explicit", modifiers: ["extra meat"], excludedModifiers: ["sauce"] }, nutritionEligible: true },
    { parsed: { foodQuery: "pepper" }, selectedFood: null, quantity: null, semanticItem: { canonicalName: "pepper", evidence: "inferred_common" } }
  ]
};

describe("food-understanding preview", () => {
  it.each(["hu", "de", "en"] as const)("shows AI assistance and uncertainty in %s", (lang: Lang) => {
    render(<FoodUnderstandingPreview value={compound} lang={lang} labels={dict[lang].foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
    expect(screen.getByText(dict[lang].foodUnderstanding.aiAssisted)).toBeTruthy();
    expect(screen.getByText(dict[lang].foodUnderstanding.needsDetail)).toBeTruthy();
    expect(screen.getByText(dict[lang].foodUnderstanding.inferred)).toBeTruthy();
    expect(screen.getByText(/lecsó/i)).toBeTruthy();
  });

  it("shows modifiers, exclusions and trusted resolution without raw JSON or provider internals", () => {
    const { container } = render(<FoodUnderstandingPreview value={compound} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
    expect(screen.getByText(/Modifiers: extra meat/)).toBeTruthy();
    expect(screen.getByText(/Without: sauce/)).toBeTruthy();
    expect(screen.getByText(dict.en.foodUnderstanding.trusted)).toBeTruthy();
    expect(container.textContent).not.toContain("{");
    expect(container.textContent).not.toContain("fixture-v1");
    expect((screen.getByRole("button", { name: dict.en.foodUnderstanding.logAll }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps the concise deterministic confirmation presentation", () => {
    render(<FoodUnderstandingPreview value={{
      parsed: { foodQuery: "egg", quantity: 2, unit: "piece" }, selectedFood: { name: "Egg", names: { en: "Egg" } },
      quantity: { status: "resolved", grams: 100, estimated: false }, canConfirm: true,
      foodResolution: "resolved", interpretationSource: "deterministic"
    }} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
    expect(screen.getByText(/100 g/)).toBeTruthy();
    expect(screen.getByText(/verified/)).toBeTruthy();
    expect(screen.queryByText(dict.en.foodUnderstanding.aiAssisted)).toBeNull();
  });

  // Owner-beta finding F: production HU UI displayed the raw internal
  // English preparation key ("Elkészítés: boiled") instead of a localized
  // word. Covers every preparation value PREPARATION_CONCEPTS can produce,
  // in every supported language, in both the multi-item row and the
  // single-item confirmable presentation.
  const PREPARATIONS = ["scrambled", "fried", "boiled", "roasted", "steamed", "smoked", "raw", "baked", "breaded", "grilled"] as const;

  it.each(["hu", "de", "en"] as const)("never renders the raw English preparation key in the multi-item row (%s)", (lang: Lang) => {
    for (const preparation of PREPARATIONS) {
      cleanup();
      const value: FoodUnderstandingPreviewValue = {
        ...compound,
        items: [{ ...compound.items![0], preparation }]
      };
      render(<FoodUnderstandingPreview value={value} lang={lang} labels={dict[lang].foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
      const expectedLabel = dict[lang].foodUnderstanding.preparationValues[preparation];
      expect(screen.getByText(new RegExp(`${dict[lang].foodUnderstanding.preparation}: ${expectedLabel}`))).toBeTruthy();
      if (lang !== "en") expect(screen.queryByText(new RegExp(`: ${preparation}$`))).toBeNull();
    }
  });

  it.each(["hu", "de", "en"] as const)("never renders the raw English preparation key in the single-item confirmable presentation (%s)", (lang: Lang) => {
    for (const preparation of PREPARATIONS) {
      cleanup();
      const value: FoodUnderstandingPreviewValue = {
        parsed: { foodQuery: "tojás", quantity: 2, unit: "piece" }, selectedFood: { name: "Tojás", names: { hu: "Tojás", de: "Ei", en: "Egg" } },
        quantity: { status: "resolved", grams: 100, estimated: false }, canConfirm: true,
        foodResolution: "resolved", interpretationSource: "deterministic", preparation
      };
      render(<FoodUnderstandingPreview value={value} lang={lang} labels={dict[lang].foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
      const expectedLabel = dict[lang].foodUnderstanding.preparationValues[preparation];
      expect(screen.getByText(new RegExp(expectedLabel))).toBeTruthy();
      if (lang !== "en") expect(screen.queryByText(new RegExp(`· ${preparation}$`))).toBeNull();
    }
  });

  it("reproduces the exact owner report: HU UI must show a localized word, not 'Elkészítés: boiled'", () => {
    const value: FoodUnderstandingPreviewValue = { ...compound, items: [{ ...compound.items![0], preparation: "boiled" }] };
    render(<FoodUnderstandingPreview value={value} lang="hu" labels={dict.hu.foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
    expect(screen.queryByText("Elkészítés: boiled")).toBeNull();
    expect(screen.getByText(`Elkészítés: ${dict.hu.foodUnderstanding.preparationValues.boiled}`)).toBeTruthy();
  });

  // Owner-beta retest (P1 goal): production HU UI displayed raw internal
  // quantity/serving unit words ("1 plate Spenót", "2 piece Tükörtojás")
  // instead of a localized word — a broader gap than preparation alone.
  // Covers every unit NaturalQuantityUnit can produce that isn't already a
  // language-neutral metric symbol (g/kg/ml/l/cm stay as-is on purpose).
  const UNITS = ["piece", "slice", "portion", "plate", "bowl", "ladle", "tbsp", "tsp", "cup", "handful", "quarter", "bite", "splash", "half"] as const;

  it.each(["hu", "de", "en"] as const)("never renders the raw English unit key in the multi-item row (%s)", (lang: Lang) => {
    for (const unit of UNITS) {
      cleanup();
      const value: FoodUnderstandingPreviewValue = {
        ...compound,
        items: [{ ...compound.items![0], parsed: { ...compound.items![0].parsed, quantity: 2, unit } }]
      };
      render(<FoodUnderstandingPreview value={value} lang={lang} labels={dict[lang].foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
      const expectedLabel = dict[lang].foodUnderstanding.unitValues[unit];
      expect(screen.getByText(new RegExp(`2 ${expectedLabel}`))).toBeTruthy();
      if (lang !== "en") expect(screen.queryByText(new RegExp(`2 ${unit}\\b`))).toBeNull();
    }
  });

  it.each(["hu", "de", "en"] as const)("never renders the raw English unit key in the single-item confirmable presentation (%s)", (lang: Lang) => {
    for (const unit of UNITS) {
      cleanup();
      const value: FoodUnderstandingPreviewValue = {
        parsed: { foodQuery: "spenót", quantity: 1, unit }, selectedFood: { name: "Spenót" },
        quantity: { status: "resolved", grams: 80, estimated: true }, canConfirm: true,
        foodResolution: "resolved", interpretationSource: "deterministic"
      };
      render(<FoodUnderstandingPreview value={value} lang={lang} labels={dict[lang].foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
      const expectedLabel = dict[lang].foodUnderstanding.unitValues[unit];
      expect(screen.getByText(new RegExp(`1 ${expectedLabel}`))).toBeTruthy();
      if (lang !== "en") expect(screen.queryByText(new RegExp(`1 ${unit}\\b`))).toBeNull();
    }
  });

  it("reproduces the exact owner report: HU UI must show '1 tányér' and '2 db', not '1 plate' or '2 piece'", () => {
    const value: FoodUnderstandingPreviewValue = {
      ...compound,
      items: [
        { ...compound.items![0], parsed: { foodQuery: "spenót", quantity: 1, unit: "plate" } },
        { ...compound.items![1], parsed: { foodQuery: "tükörtojás", quantity: 2, unit: "piece" } }
      ]
    };
    render(<FoodUnderstandingPreview value={value} lang="hu" labels={dict.hu.foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
    expect(screen.queryByText(/1 plate/)).toBeNull();
    expect(screen.queryByText(/2 piece/)).toBeNull();
    expect(screen.getByText(/1 tányér/)).toBeTruthy();
    expect(screen.getByText(/2 db/)).toBeTruthy();
  });
});

describe("dynamic trusted food resolution: external candidate confirmation UI", () => {
  const porkHockCandidate = { source: "usda_fdc" as const, sourceId: "172152", name: "Pork hock, cooked", originalName: "Pork hock, cooked", category: "Pork Products", confidence: 0.96 };
  const curedVariant = { source: "usda_fdc" as const, sourceId: "172153", name: "Pork hock, cured", originalName: "Pork hock, cured", category: "Pork Products", confidence: 0.9 };

  it.each(["hu", "de", "en"] as const)("single candidate: shows the 'I found this' heading with name, category and source, never nutrition numbers as the primary distinguisher (%s)", (lang: Lang) => {
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "csülök" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "confirmation_required", interpretationSource: "deterministic",
      externalCandidates: [porkHockCandidate]
    };
    render(<FoodUnderstandingPreview value={value} lang={lang} labels={dict[lang].foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmExternal={vi.fn()}/>);
    expect(screen.getByText(dict[lang].foodUnderstanding.externalSingleHeading)).toBeTruthy();
    expect(screen.getByText("Pork hock, cooked")).toBeTruthy();
    expect(screen.getByText(new RegExp(`${dict[lang].foodUnderstanding.externalSource}: USDA FoodData Central`))).toBeTruthy();
    expect(screen.queryByText(/0\.96/)).toBeNull();
  });

  it.each(["hu", "de", "en"] as const)("multiple candidates: shows the 'which did you mean' heading with a bounded list (%s)", (lang: Lang) => {
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "csülök" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "confirmation_required", interpretationSource: "deterministic",
      externalCandidates: [porkHockCandidate, curedVariant]
    };
    render(<FoodUnderstandingPreview value={value} lang={lang} labels={dict[lang].foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmExternal={vi.fn()}/>);
    expect(screen.getByText(dict[lang].foodUnderstanding.externalMultipleHeading)).toBeTruthy();
    expect(screen.getByText("Pork hock, cooked")).toBeTruthy();
    expect(screen.getByText("Pork hock, cured")).toBeTruthy();
  });

  it("clicking a candidate calls onConfirmExternal with exactly that candidate's source/sourceId — no nutrition, no extra fields", () => {
    const onConfirmExternal = vi.fn();
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "csülök" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "confirmation_required", interpretationSource: "deterministic",
      externalCandidates: [porkHockCandidate, curedVariant]
    };
    render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmExternal={onConfirmExternal}/>);
    const buttons = screen.getAllByText(dict.en.foodUnderstanding.externalConfirm);
    buttons[1].click();
    expect(onConfirmExternal).toHaveBeenCalledWith(curedVariant);
  });

  it("shows candidates per-item inside a multi-food result and passes the correct item index back on confirm", () => {
    const onConfirmExternal = vi.fn();
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "csülök, 2 db tojás" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "multi", interpretationSource: "deterministic",
      items: [
        { parsed: { foodQuery: "csülök", quantity: 150, unit: "g" }, selectedFood: null, quantity: null, externalCandidates: [porkHockCandidate] },
        { parsed: { foodQuery: "tojás", quantity: 2, unit: "piece" }, selectedFood: { name: "Egg" }, quantity: { status: "resolved", grams: 100, estimated: false }, nutritionEligible: true }
      ]
    };
    render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmExternal={onConfirmExternal}/>);
    expect(screen.getByText(dict.en.foodUnderstanding.externalSingleHeading)).toBeTruthy();
    screen.getByText(dict.en.foodUnderstanding.externalConfirm).click();
    expect(onConfirmExternal).toHaveBeenCalledWith(porkHockCandidate, 0);
  });

  it("disables candidate buttons while a confirmation is in flight", () => {
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "csülök" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "confirmation_required", interpretationSource: "deterministic",
      externalCandidates: [porkHockCandidate]
    };
    render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={true} confirmingExternalId="usda_fdc:172152" onConfirmAll={vi.fn()} onConfirmExternal={vi.fn()}/>);
    expect(screen.getByText(dict.en.foodUnderstanding.externalConfirming)).toBeTruthy();
    expect((screen.getByText(dict.en.foodUnderstanding.externalConfirming).closest("button") as HTMLButtonElement).disabled).toBe(true);
  });
});

// PR #52 final correctness review (2026-09-13) — Gate 2 (whole-recipe →
// consumed-portion provenance): confirming a JUST-DISCOVERED web recipe
// straight into a meal, previously impossible from this natural-language
// flow at all (see main.tsx's confirmRecipe).
describe("recipe-discovery candidate confirmation UI (Gate 2)", () => {
  const fullyResolvedCandidate: RecipeDiscoveryCandidateValue = {
    title: "Halászlé", domain: "nosalty.hu", sourceUrl: "https://nosalty.hu/halaszle",
    servings: 4, extractionMethod: "schema_org_json_ld", importProof: "proof-token", nutritionCalculable: true
  };
  const reviewableCandidate: RecipeDiscoveryCandidateValue = {
    ...fullyResolvedCandidate, nutritionCalculable: false
  };

  function singleValue(candidate: RecipeDiscoveryCandidateValue): FoodUnderstandingPreviewValue {
    return {
      parsed: { foodQuery: "halászlé" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "compound", interpretationSource: "ai_assisted",
      semantic: { dishName: "halászlé", clarificationNeeded: false },
      recipeDiscovery: { status: "confirmation_required", candidate }
    };
  }

  it("a fully-resolved candidate (nutritionCalculable) shows quantity/unit controls defaulting to servings when the recipe states a servings count", () => {
    render(<FoodUnderstandingPreview value={singleValue(fullyResolvedCandidate)} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmRecipe={vi.fn()}/>);
    expect(screen.getByText(dict.en.foodUnderstanding.recipeDiscovery.confirmAdd)).toBeTruthy();
    expect((screen.getByLabelText(dict.en.foodUnderstanding.recipeDiscovery.confirmUnit) as HTMLSelectElement).value).toBe("serving");
  });

  it("a reviewable (NOT fully-resolved) candidate shows NO confirm controls — partial nutrition can never masquerade as complete", () => {
    render(<FoodUnderstandingPreview value={singleValue(reviewableCandidate)} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmRecipe={vi.fn()}/>);
    expect(screen.queryByText(dict.en.foodUnderstanding.recipeDiscovery.confirmAdd)).toBeNull();
  });

  // Owner request (2026-09-25): a blocking ingredient shows its exact reason
  // and can be fixed by hand; the fixes travel with the save request.
  describe("manual fixes for blocking ingredients", () => {
    const blockedCandidate: RecipeDiscoveryCandidateValue = {
      ...fullyResolvedCandidate, nutritionCalculable: false,
      ingredients: [
        { originalText: "1 kg ponty", parsedFoodQuery: "carp", status: "resolved", quantityGrams: 1000, resolvedFood: { id: "carp", name: "Carp", source: "usda_fdc" }, trustedNutritionReady: true },
        { originalText: "só ízlés szerint", parsedFoodQuery: "salt to taste", status: "unresolved", resolvedFood: null, trustedNutritionReady: false, blockingReason: "food_not_found" },
        { originalText: "2 fej hagyma", parsedFoodQuery: "onion", status: "confirmation_required", resolvedFood: null, trustedNutritionReady: false, blockingReason: "food_needs_confirmation",
          localCandidates: [{ id: "onion-raw", name: "Onion, raw", source: "bls" }] }
      ]
    };

    it.each(["hu", "de", "en"] as const)("names the exact blocking reason per ingredient (%s)", (lang) => {
      render(<FoodUnderstandingPreview value={singleValue(blockedCandidate)} lang={lang} labels={dict[lang].foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmRecipe={vi.fn()}/>);
      const labels = dict[lang].foodUnderstanding.recipeDiscovery;
      expect(screen.getByText(labels.blockedHeading)).toBeTruthy();
      expect(screen.getByText(labels.blockingReasons.food_not_found)).toBeTruthy();
      expect(screen.getByText(labels.blockingReasons.food_needs_confirmation)).toBeTruthy();
      expect(screen.queryByText(labels.confirmAdd)).toBeNull();
    });

    it("offers the save only once every blocking ingredient is fixed, and sends the fixes as overrides", () => {
      const onConfirm = vi.fn();
      render(<FoodUnderstandingPreview value={singleValue(blockedCandidate)} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmRecipe={onConfirm}/>);
      const labels = dict.en.foodUnderstanding.recipeDiscovery;
      fireEvent.click(screen.getAllByText(labels.fixExclude)[0]);
      expect(screen.getByText(labels.fixExcluded)).toBeTruthy();
      expect(screen.queryByText(labels.confirmAdd)).toBeNull();
      fireEvent.change(screen.getByLabelText(`${labels.fixFood}: 2 fej hagyma`), { target: { value: "onion-raw" } });
      expect(screen.queryByText(labels.confirmAdd)).toBeNull(); // food chosen, amount still missing
      fireEvent.change(screen.getByLabelText(`${labels.fixGrams}: 2 fej hagyma`), { target: { value: "220" } });
      fireEvent.click(screen.getByText(labels.confirmAdd));
      expect(onConfirm).toHaveBeenCalledWith(blockedCandidate, 1, "serving", [
        { ingredientIndex: 1, action: "exclude" },
        { ingredientIndex: 2, action: "food", foodId: "onion-raw", grams: 220 }
      ]);
    });

    it("undoing a 'leave out' brings the ingredient back to pending", () => {
      render(<FoodUnderstandingPreview value={singleValue(blockedCandidate)} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmRecipe={vi.fn()}/>);
      const labels = dict.en.foodUnderstanding.recipeDiscovery;
      fireEvent.click(screen.getAllByText(labels.fixExclude)[0]);
      fireEvent.click(screen.getByText(labels.fixUndo));
      expect(screen.queryByText(labels.fixExcluded)).toBeNull();
      expect(screen.getAllByText(labels.fixPending)).toHaveLength(2);
    });
  });

  it("no confirm controls render at all when the caller doesn't pass onConfirmRecipe (display-only preview, e.g. an older client)", () => {
    render(<FoodUnderstandingPreview value={singleValue(fullyResolvedCandidate)} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()}/>);
    expect(screen.queryByText(dict.en.foodUnderstanding.recipeDiscovery.confirmAdd)).toBeNull();
  });

  it("without a known servings count, only 'g' is offered — never a fabricated serving option", () => {
    const noServings: RecipeDiscoveryCandidateValue = { ...fullyResolvedCandidate, servings: undefined };
    render(<FoodUnderstandingPreview value={singleValue(noServings)} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmRecipe={vi.fn()}/>);
    const unitSelect = screen.getByLabelText(dict.en.foodUnderstanding.recipeDiscovery.confirmUnit) as HTMLSelectElement;
    expect(unitSelect.value).toBe("g");
    expect(Array.from(unitSelect.options).map((o) => o.value)).toEqual(["g"]);
  });

  it("clicking confirm calls onConfirmRecipe with exactly the candidate and the user's own stated quantity/unit — never silently substitutes a value", () => {
    const onConfirmRecipe = vi.fn();
    render(<FoodUnderstandingPreview value={singleValue(fullyResolvedCandidate)} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmRecipe={onConfirmRecipe}/>);
    screen.getByText(dict.en.foodUnderstanding.recipeDiscovery.confirmAdd).click();
    expect(onConfirmRecipe).toHaveBeenCalledWith(fullyResolvedCandidate, 1, "serving");
  });

  it("works identically inside a multi-item (dish + independently-resolving side) result", () => {
    const onConfirmRecipe = vi.fn();
    const value: FoodUnderstandingPreviewValue = {
      ...compound,
      items: [{ ...compound.items![0], recipeDiscovery: { status: "confirmation_required", candidate: fullyResolvedCandidate } }]
    };
    render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmRecipe={onConfirmRecipe}/>);
    screen.getByText(dict.en.foodUnderstanding.recipeDiscovery.confirmAdd).click();
    expect(onConfirmRecipe).toHaveBeenCalledWith(fullyResolvedCandidate, 1, "serving");
  });

  it("disables the confirm button while busy (a save is already in flight)", () => {
    render(<FoodUnderstandingPreview value={singleValue(fullyResolvedCandidate)} lang="en" labels={dict.en.foodUnderstanding} busy={true} onConfirmAll={vi.fn()} onConfirmRecipe={vi.fn()}/>);
    expect((screen.getByText(dict.en.foodUnderstanding.recipeDiscovery.confirmAdding).closest("button") as HTMLButtonElement).disabled).toBe(true);
  });
});

// FINAL FALLBACK: AI-ESTIMATED NUTRITION — frontend flow (2026-09-18).
describe("AI nutrition estimate confirmation UI", () => {
  const estimate: AiEstimateValue = {
    canonicalFoodName: "Yeast extract spread", localizedFoodName: "Vegemite", basisGrams: 100,
    kcalPer100g: 180, proteinPer100g: 24, fatPer100g: 1, carbsPer100g: 14, fiberPer100g: 3,
    confidence: "low", assumptions: "Assumed a typical savory yeast extract spread similar to Vegemite.",
    identityConfidence: "high", requestedIdentity: "Vegemite", canonicalIdentity: "yeast extract spread",
    proof: "signed.proof.token"
  };

  function singleAiEstimateValue(overrides: Partial<FoodUnderstandingPreviewValue> = {}): FoodUnderstandingPreviewValue {
    return {
      parsed: { foodQuery: "Vegemite" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "ai_estimate_pending", interpretationSource: "deterministic", aiEstimate: estimate,
      ...overrides
    };
  }

  it("lists covered local catalog candidates before the AI estimate, and keeps them after the estimate is declined", () => {
    const bacon = { id: "bls-w415000", source: "bls", sourceId: "W415000", name: "Schwein Frühstücksspeck", originalName: "Schwein Frühstücksspeck", names: { en: "bacon" }, kcalPer100g: 304, proteinPer100g: 15, fatPer100g: 27, carbsPer100g: 0, fiberPer100g: 0 };
    const onSelect = vi.fn();
    const { container } = render(<FoodUnderstandingPreview value={singleAiEstimateValue({ candidates: [bacon] })} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onAcceptAiEstimate={vi.fn()} onOverrideAiEstimate={vi.fn()} onSelectCandidate={onSelect}/>);
    const list = container.querySelector(".catalog-candidates")!;
    const card = container.querySelector(".ai-estimate-card")!;
    expect(list.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(list.querySelector("button")!);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(bacon, undefined);
  });

  it.each(["hu", "de", "en"] as const)("renders the AI-estimate badge, macros, confidence and assumptions, distinctly from trusted data (%s)", (lang: Lang) => {
    const { container } = render(<FoodUnderstandingPreview value={singleAiEstimateValue()} lang={lang} labels={dict[lang].foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onAcceptAiEstimate={vi.fn()} onOverrideAiEstimate={vi.fn()}/>);
    const labels = dict[lang].foodUnderstanding.aiEstimate;
    expect(screen.getByText(labels.badge)).toBeTruthy();
    expect(screen.getByText(labels.disclaimer)).toBeTruthy();
    // "Vegemite" legitimately appears twice — the item's own heading (from
    // parsed.foodQuery) and the AI-estimate card's own self-contained name.
    expect(screen.getAllByText("Vegemite").length).toBeGreaterThanOrEqual(2);
    // Macro label/value pairs are split across a <span>/<b> (see .ai-estimate-macros'
    // own markup) — matched against the whole card's text content, not a single node.
    const cardText = container.querySelector(".ai-estimate-card")!.textContent!;
    expect(cardText).toMatch(new RegExp(`${labels.kcal}.*180`));
    expect(cardText).toMatch(new RegExp(`${labels.protein}.*24`));
    expect(cardText).toContain(labels.confidenceLabel);
    expect(cardText).toContain(labels.confidenceValues.low);
    expect(screen.getByText(estimate.assumptions)).toBeTruthy();
    expect(screen.getByText(labels.accept)).toBeTruthy();
    expect(screen.getByText(labels.edit)).toBeTruthy();
    expect(screen.getByText(labels.decline)).toBeTruthy();
    // Never shows the ordinary trusted-data indicator alongside it — the
    // whole point is that these two must never look equivalent.
    expect(screen.queryByText(dict[lang].foodUnderstanding.trusted)).toBeNull();
  });

  it("does not fabricate a value the backend never sent (no optional/sugar/salt rendered when absent)", () => {
    render(<FoodUnderstandingPreview value={singleAiEstimateValue()} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onAcceptAiEstimate={vi.fn()} onOverrideAiEstimate={vi.fn()}/>);
    expect(screen.queryByText(/sugar/i)).toBeNull();
  });

  it("accept sends exactly the estimate's own numbers, identity and proof, plus the user's chosen quantity — never recomputed client-side", () => {
    const onAccept = vi.fn();
    render(<FoodUnderstandingPreview value={singleAiEstimateValue()} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onAcceptAiEstimate={onAccept} onOverrideAiEstimate={vi.fn()}/>);
    const quantityInput = screen.getByLabelText(dict.en.foodUnderstanding.aiEstimate.quantityLabel) as HTMLInputElement;
    fireEvent.change(quantityInput, { target: { value: "150" } });
    screen.getByText(dict.en.foodUnderstanding.aiEstimate.accept).click();
    expect(onAccept).toHaveBeenCalledWith(estimate, 150, undefined);
  });

  it("override: editing a value and saving sends the EDITED numbers via the manual-entry contract, never the original estimate or its proof", () => {
    const onOverride = vi.fn();
    render(<FoodUnderstandingPreview value={singleAiEstimateValue()} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onAcceptAiEstimate={vi.fn()} onOverrideAiEstimate={onOverride}/>);
    fireEvent.click(screen.getByText(dict.en.foodUnderstanding.aiEstimate.edit));
    const labels = dict.en.foodUnderstanding.aiEstimate;
    fireEvent.change(screen.getByLabelText(new RegExp(`^${labels.kcal}`)), { target: { value: "210" } });
    fireEvent.change(screen.getByLabelText(labels.quantityLabel), { target: { value: "50" } });
    fireEvent.click(screen.getByText(labels.saveEdited));
    expect(onOverride).toHaveBeenCalledWith({
      foodName: "Vegemite", quantityGrams: 50,
      kcalPer100g: 210, proteinPer100g: 24, fatPer100g: 1, carbsPer100g: 14, fiberPer100g: 3
    }, undefined);
    // The original proof/estimate object is never part of the override payload.
    expect(onOverride.mock.calls[0][0]).not.toHaveProperty("proof");
    expect(onOverride.mock.calls[0][0]).not.toHaveProperty("aiEstimateProof");
  });

  it("cancelling an edit in progress discards the changes and returns to the accept/edit/decline view", () => {
    render(<FoodUnderstandingPreview value={singleAiEstimateValue()} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onAcceptAiEstimate={vi.fn()} onOverrideAiEstimate={vi.fn()}/>);
    const labels = dict.en.foodUnderstanding.aiEstimate;
    fireEvent.click(screen.getByText(labels.edit));
    expect(screen.getByText(labels.cancelEdit)).toBeTruthy();
    fireEvent.click(screen.getByText(labels.cancelEdit));
    expect(screen.getByText(labels.accept)).toBeTruthy();
    expect(screen.queryByText(labels.saveEdited)).toBeNull();
  });

  it("decline never calls the backend and falls back to the ordinary unresolved indicator — nothing is submitted merely by having been displayed", () => {
    const onAccept = vi.fn();
    const onOverride = vi.fn();
    render(<FoodUnderstandingPreview value={singleAiEstimateValue()} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onAcceptAiEstimate={onAccept} onOverrideAiEstimate={onOverride}/>);
    fireEvent.click(screen.getByText(dict.en.foodUnderstanding.aiEstimate.decline));
    expect(screen.queryByText(dict.en.foodUnderstanding.aiEstimate.badge)).toBeNull();
    expect(screen.getByText(dict.en.foodUnderstanding.unresolved)).toBeTruthy();
    expect(onAccept).not.toHaveBeenCalled();
    expect(onOverride).not.toHaveBeenCalled();
  });

  it("disables accept/edit/decline while a save is already in flight", () => {
    render(<FoodUnderstandingPreview value={singleAiEstimateValue()} lang="en" labels={dict.en.foodUnderstanding} busy={true} onConfirmAll={vi.fn()} onAcceptAiEstimate={vi.fn()} onOverrideAiEstimate={vi.fn()}/>);
    const labels = dict.en.foodUnderstanding.aiEstimate;
    expect((screen.getByText(labels.accepting).closest("button") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText(labels.edit).closest("button") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText(labels.decline).closest("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders correctly inside a multi-item result alongside a resolved item and a confirmation-required item, without making the whole meal look ready", () => {
    const onAccept = vi.fn();
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "chicken, Vegemite, cheese" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "multi", interpretationSource: "deterministic",
      items: [
        { parsed: { foodQuery: "chicken breast", quantity: 100, unit: "g" }, selectedFood: { name: "Chicken breast" }, quantity: { status: "resolved", grams: 100, estimated: false }, foodResolution: "resolved", nutritionEligible: true },
        { parsed: { foodQuery: "Vegemite" }, selectedFood: null, quantity: null, foodResolution: "ai_estimate_pending", aiEstimate: estimate },
        { parsed: { foodQuery: "cheese" }, selectedFood: null, quantity: null, externalCandidates: [{ source: "usda_fdc", sourceId: "1", name: "Cheddar cheese", originalName: "Cheddar cheese", confidence: 0.9 }] }
      ]
    };
    render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmExternal={vi.fn()} onAcceptAiEstimate={onAccept} onOverrideAiEstimate={vi.fn()}/>);
    // The resolved item still shows trusted; the AI item shows its own card; neither is confused with the other.
    expect(screen.getByText(dict.en.foodUnderstanding.trusted)).toBeTruthy();
    expect(screen.getByText(dict.en.foodUnderstanding.aiEstimate.badge)).toBeTruthy();
    expect(screen.getByText("Cheddar cheese")).toBeTruthy();
    // "Log all" must stay disabled — an ai_estimate_pending/confirmation_required item present means the meal cannot be confirmed as a whole.
    expect((screen.getByRole("button", { name: dict.en.foodUnderstanding.logAll }) as HTMLButtonElement).disabled).toBe(true);
    // Accepting the AI item passes the multi-item's own index (1), not undefined.
    screen.getByText(dict.en.foodUnderstanding.aiEstimate.accept).click();
    expect(onAccept).toHaveBeenCalledWith(estimate, 100, 1);
  });
});

// Owner-reported UX bug fix (2026-09-19): a "preview"/"confirmation_required"
// result already carries real local-catalog candidates[] — previously never
// rendered, leaving the user staring at "review and choose" with nothing
// visible to pick. See FoodUnderstandingPreview.tsx's own CatalogCandidateList
// doc for why this is deliberately distinct from ExternalCandidateList
// (already-real Food rows, no confirmation round-trip needed).
describe("local-catalog candidate selection UI (preview / confirmation_required)", () => {
  const sconeCandidate = { id: "food-scone-1", name: "Cheese scone", names: { en: "Cheese scone", hu: "Sajtos pogácsa" }, category: "Baked Products", kcalPer100g: 380, proteinPer100g: 11, fatPer100g: 22, carbsPer100g: 34, fiberPer100g: 1.5 };
  const biscuitCandidate = { id: "food-scone-2", name: "Cheese biscuit", names: { en: "Cheese biscuit" }, kcalPer100g: 410, proteinPer100g: 9, fatPer100g: 25, carbsPer100g: 38, fiberPer100g: 1 };

  it("single 'preview' result: renders the candidate list with name, nutrition and a selection button — never the misleading 'choose' text", () => {
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "sajtos pogácsa" }, selectedFood: sconeCandidate, quantity: null, canConfirm: false,
      foodResolution: "preview", interpretationSource: "deterministic",
      candidates: [sconeCandidate, biscuitCandidate]
    };
    const onSelect = vi.fn();
    const { container } = render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onSelectCandidate={onSelect}/>);
    expect(screen.getByText(dict.en.foodUnderstanding.candidatesHeading)).toBeTruthy();
    expect(screen.getByText("Cheese scone")).toBeTruthy();
    expect(screen.getByText("Cheese biscuit")).toBeTruthy();
    // Nutrition text is split across sibling <span>/<b> elements — matched
    // against the rendered container text, same pattern already used for
    // the AI-estimate card's own macro assertions.
    expect(container.querySelector(".catalog-candidate-macros")?.textContent).toContain("380");
    expect(screen.getAllByText(dict.en.foodUnderstanding.candidateSelect)).toHaveLength(2);
    // The old, misleading "review and choose" fallback must never appear
    // alongside an actual, visible list of choices.
    expect(screen.queryByText(dict.en.foodUnderstanding.review)).toBeNull();
  });

  it("single 'confirmation_required' result: same actionable candidate UI as 'preview'", () => {
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "sajtos pogácsa" }, selectedFood: sconeCandidate, quantity: null, canConfirm: false,
      foodResolution: "confirmation_required", interpretationSource: "deterministic",
      candidates: [sconeCandidate]
    };
    render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onSelectCandidate={vi.fn()}/>);
    expect(screen.getByText(dict.en.foodUnderstanding.candidatesHeading)).toBeTruthy();
    expect(screen.getByText("Cheese scone")).toBeTruthy();
    expect(screen.getByText(dict.en.foodUnderstanding.candidateSelect)).toBeTruthy();
  });

  it("no usable candidates: shows the truthful fallback message, never the candidate heading or a 'choose' instruction with nothing to choose", () => {
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "valami ismeretlen étel" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "confirmation_required", interpretationSource: "deterministic",
      candidates: []
    };
    render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onSelectCandidate={vi.fn()}/>);
    expect(screen.getByText(dict.en.foodUnderstanding.review)).toBeTruthy();
    expect(screen.queryByText(dict.en.foodUnderstanding.candidatesHeading)).toBeNull();
    expect(screen.queryByText(dict.en.foodUnderstanding.candidateSelect)).toBeNull();
    // The new copy must be truthful — it must not tell the user to "choose"
    // when nothing was ever shown to choose from.
    expect(dict.en.foodUnderstanding.review.toLowerCase()).not.toContain("choose");
  });

  it("selecting a candidate calls onSelectCandidate with exactly that candidate — the component itself never persists anything", () => {
    const onSelect = vi.fn();
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "sajtos pogácsa" }, selectedFood: sconeCandidate, quantity: null, canConfirm: false,
      foodResolution: "preview", interpretationSource: "deterministic",
      candidates: [sconeCandidate, biscuitCandidate]
    };
    render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onSelectCandidate={onSelect}/>);
    const buttons = screen.getAllByText(dict.en.foodUnderstanding.candidateSelect);
    fireEvent.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(biscuitCandidate);
  });

  it("multi-item: a child row with its own 'preview' candidates renders the candidate list for that row only, and its trusted/unresolved indicator honestly reflects it is NOT yet resolved", () => {
    const onSelect = vi.fn();
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "csirkemell, sajtos pogácsa" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "multi", interpretationSource: "deterministic",
      items: [
        { parsed: { foodQuery: "csirkemell", quantity: 100, unit: "g" }, selectedFood: { name: "Chicken breast" }, quantity: { status: "resolved", grams: 100, estimated: false }, foodResolution: "resolved", nutritionEligible: true },
        { parsed: { foodQuery: "sajtos pogácsa" }, selectedFood: sconeCandidate, quantity: null, foodResolution: "preview", candidates: [sconeCandidate, biscuitCandidate] }
      ]
    };
    render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onSelectCandidate={onSelect}/>);
    expect(screen.getByText(dict.en.foodUnderstanding.trusted)).toBeTruthy();
    expect(screen.getByText(dict.en.foodUnderstanding.unresolved)).toBeTruthy();
    expect(screen.getByText(dict.en.foodUnderstanding.candidatesHeading)).toBeTruthy();
    // "Cheese scone" legitimately appears twice — see the single-item test's
    // own comment above for why.
    expect(screen.getAllByText("Cheese scone").length).toBeGreaterThanOrEqual(2);
    const buttons = screen.getAllByText(dict.en.foodUnderstanding.candidateSelect);
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(sconeCandidate, 1);
    // "Log all" must stay disabled — an unconfirmed preview item is present.
    expect((screen.getByRole("button", { name: dict.en.foodUnderstanding.logAll }) as HTMLButtonElement).disabled).toBe(true);
  });

  // Authoritative catalog data first (owner decision, 2026-09-25): the API
  // only sends local candidates here that cover the user's word, so they are
  // listed BEFORE the external ones instead of being hidden by them.
  it("renders local catalog candidates before external candidates when the backend returns both", () => {
    const value: FoodUnderstandingPreviewValue = {
      parsed: { foodQuery: "csülök" }, selectedFood: null, quantity: null, canConfirm: false,
      foodResolution: "confirmation_required", interpretationSource: "deterministic",
      externalCandidates: [{ source: "usda_fdc", sourceId: "172152", name: "Pork hock, cooked", originalName: "Pork hock, cooked", confidence: 0.96 }],
      candidates: [sconeCandidate]
    };
    const onSelect = vi.fn();
    const { container } = render(<FoodUnderstandingPreview value={value} lang="en" labels={dict.en.foodUnderstanding} busy={false} onConfirmAll={vi.fn()} onConfirmExternal={vi.fn()} onSelectCandidate={onSelect}/>);
    expect(screen.getByText(dict.en.foodUnderstanding.externalSingleHeading)).toBeTruthy();
    const catalogHeading = screen.getByText(dict.en.foodUnderstanding.candidatesHeading);
    const externalHeading = screen.getByText(dict.en.foodUnderstanding.externalSingleHeading);
    expect(catalogHeading.compareDocumentPosition(externalHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(container.querySelector(".catalog-candidate button")!);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(sconeCandidate);
  });
});
