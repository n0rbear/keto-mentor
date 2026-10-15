// @vitest-environment jsdom
// Meal type (owner decision 2026-10-15).
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MealTypePicker, mealTypeFields, mealTypeText, suggestMealType, type MealChoice } from "./MealTypePicker";
import { RepeatMealDialog } from "./MealActions";
import { useState } from "react";

afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });
const at = (h: number, m = 0) => new Date(2026, 9, 15, h, m);

describe("meal type", () => {
  it("suggests the meal from the time of day", () => {
    expect(suggestMealType(at(7))).toBe("breakfast");
    expect(suggestMealType(at(10, 30))).toBe("morning_snack");
    expect(suggestMealType(at(12))).toBe("lunch");
    expect(suggestMealType(at(15))).toBe("afternoon_snack");
    expect(suggestMealType(at(19))).toBe("dinner");
    expect(suggestMealType(at(23))).toBe("snack");
    expect(suggestMealType(at(2))).toBe("snack");
  });

  it("needs a name for a custom type and reads saved types in the UI language", () => {
    expect(mealTypeFields({ type: "lunch", label: "x" })).toEqual({ mealType: "lunch" });
    expect(mealTypeFields({ type: "custom", label: "  " })).toBeNull();
    expect(mealTypeFields({ type: "custom", label: " Edzés után " })).toEqual({ mealType: "custom", mealTypeLabel: "Edzés után" });
    expect(mealTypeText({ mealType: "morning_snack" }, "hu")).toBe("Tízórai");
    expect(mealTypeText({ mealType: "afternoon_snack" }, "hu")).toBe("Uzsonna");
    expect(mealTypeText({ mealType: "custom", mealTypeLabel: "Edzés után" }, "de")).toBe("Edzés után");
    expect(mealTypeText({ mealType: null }, "hu")).toBe("");
  });

  it("offers the six meals plus a custom name", () => {
    function Harness() { const [v, setV] = useState<MealChoice>({ type: "lunch", label: "" }); return <><MealTypePicker lang="hu" value={v} onChange={setV}/><output>{JSON.stringify(v)}</output></>; }
    render(<Harness/>);
    expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual(["Reggeli", "Tízórai", "Ebéd", "Uzsonna", "Vacsora", "Nasi", "Saját…"]);
    expect(screen.getByRole("radio", { name: "Ebéd" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "Saját…" }));
    fireEvent.change(screen.getByLabelText("Saját étkezésnév"), { target: { value: "Edzés után" } });
    expect(screen.getByText('{"type":"custom","label":"Edzés után"}')).toBeTruthy();
  });

  it("asks which meal a repeat is, and refuses a custom type without a name", async () => {
    const onConfirm = vi.fn();
    render(<RepeatMealDialog title="Rántotta" lang="hu" onCancel={vi.fn()} onConfirm={onConfirm}/>);
    fireEvent.click(screen.getByRole("radio", { name: "Vacsora" }));
    fireEvent.click(screen.getByRole("radio", { name: "Saját…" }));
    fireEvent.click(screen.getByRole("button", { name: "Ismét" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: "Vacsora" }));
    fireEvent.click(screen.getByRole("button", { name: "Ismét" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ mealType: "dinner" }));
  });
});
