// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FoodUnderstandingPreview, type FoodUnderstandingPreviewValue } from "./FoodUnderstandingPreview";
import { dict, type Lang } from "./i18n";

afterEach(cleanup);

const compound: FoodUnderstandingPreviewValue = {
  parsed: { foodQuery: "lecsó" }, selectedFood: null,
  quantity: null, canConfirm: false, foodResolution: "compound", interpretationSource: "ai_assisted",
  semantic: { dishName: "lecsó", clarificationNeeded: true, clarificationReason: "Base dish portion is unresolved." },
  items: [
    { parsed: { foodQuery: "sausage", quantity: 2, unit: "piece" }, selectedFood: { name: "Sausage" }, quantity: { status: "resolved", grams: 100, estimated: false }, semanticItem: { canonicalName: "sausage", evidence: "explicit", modifiers: ["extra meat"], excludedModifiers: ["sauce"] }, nutritionEligible: true },
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
