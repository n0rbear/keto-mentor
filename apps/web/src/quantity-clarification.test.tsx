// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QuantityClarification } from "./QuantityClarification";
import { quantityLabels, type Lang } from "./i18n";

afterEach(cleanup);
const estimate = { type: "estimate_confirmation" as const, itemIndex: 0, suggestedGrams: 30, rangeGrams: { min: 25, max: 35 }, confidence: .8, method: "ai_estimated" as const, allowCustomGrams: true };
it.each(["hu", "de", "en"] as const)("shows localized estimate and accepts only on click: %s", (lang) => {
  const resolve = vi.fn();
  render(<QuantityClarification value={estimate} foodName="Peanuts" lang={lang} onResolve={resolve}/>);
  expect(screen.getByText(/25–35 g/)).toBeTruthy();
  expect(resolve).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText(quantityLabels[lang].accept));
  expect(resolve).toHaveBeenCalledWith(30, false);
});
it("changes estimate to explicit meal-only grams", () => {
  const resolve = vi.fn();
  render(<QuantityClarification value={estimate} foodName="Peanuts" lang="en" onResolve={resolve}/>);
  fireEvent.click(screen.getByText("Change"));
  fireEvent.change(screen.getByLabelText("Grams consumed"), { target: { value: "42" } });
  fireEvent.click(screen.getByText("Accept"));
  expect(resolve).toHaveBeenCalledWith(42, true);
});
it.each(["quantity_missing", "grams_required"] as const)("manual fallback %s has no default weight", (type) => {
  const resolve = vi.fn();
  render(<QuantityClarification value={{ type, itemIndex: 0, allowCustomGrams: true }} foodName="Peanuts" lang="en" onResolve={resolve}/>);
  expect((screen.getByLabelText("Grams consumed") as HTMLInputElement).value).toBe("");
  fireEvent.click(screen.getByText("Accept"));
  expect(resolve).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Grams consumed"), { target: { value: "-1" } });
  fireEvent.click(screen.getByText("Accept"));
  expect(resolve).not.toHaveBeenCalled();
});

const volumeEstimate = {
  type: "estimate_confirmation" as const, itemIndex: 0, allowCustomGrams: true,
  suggestedGrams: 80, rangeGrams: { min: 50, max: 120 }, confidence: 0.6, method: "ai_estimated" as const, basis: "volume" as const
};

const geometryEstimate = { ...volumeEstimate, basis: "geometry" as const };

describe("QuantityClarification: volume-model basis explanation", () => {
  it.each(["hu", "de", "en"] as const)("shows the localized volume-basis note in %s for a volume-class estimate", (lang: Lang) => {
    render(<QuantityClarification value={volumeEstimate} foodName="Spenót" lang={lang} onResolve={vi.fn()}/>);
    expect(screen.getByText(quantityLabels[lang].basisVolume)).toBeTruthy();
  });

  it.each(["hu", "de", "en"] as const)("does not show the volume-basis note for a geometry-class estimate (%s)", (lang: Lang) => {
    render(<QuantityClarification value={geometryEstimate} foodName="Kolbász" lang={lang} onResolve={vi.fn()}/>);
    expect(screen.queryByText(quantityLabels[lang].basisVolume)).toBeNull();
  });

  it("still shows range and confidence alongside the volume-basis note", () => {
    render(<QuantityClarification value={volumeEstimate} foodName="Spenót" lang="hu" onResolve={vi.fn()}/>);
    expect(screen.getByText(quantityLabels.hu.basisVolume)).toBeTruthy();
    expect(screen.getByText(/50–120 g/)).toBeTruthy();
    expect(screen.getByText(/60%/)).toBeTruthy();
  });

  it("Accept/Modify stay available for a volume-class estimate exactly as for any AI estimate", () => {
    const onResolve = vi.fn();
    render(<QuantityClarification value={volumeEstimate} foodName="Spenót" lang="en" onResolve={onResolve}/>);
    expect(screen.getByText(quantityLabels.en.accept)).toBeTruthy();
    expect(screen.getByText(quantityLabels.en.change)).toBeTruthy();
  });
});
