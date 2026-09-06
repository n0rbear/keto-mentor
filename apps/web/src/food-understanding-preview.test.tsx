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
});
