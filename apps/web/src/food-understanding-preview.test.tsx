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
});
