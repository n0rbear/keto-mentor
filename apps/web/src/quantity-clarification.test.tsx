import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QuantityClarification } from "./QuantityClarification";
import { quantityLabels } from "./i18n";
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
