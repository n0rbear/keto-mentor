// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MealEditDialog, DeleteMealDialog, RepeatMealDialog, type MealDetail } from "./MealActions";
import { dict } from "./i18n";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const meal: MealDetail = {
  id: "meal-1",
  title: "Lunch",
  eatenAt: "2026-09-06T12:00:00.000Z",
  totals: { kcal: 400, fat: 20, protein: 30, carbs: 10, fiber: 4, netCarbs: 6 },
  items: [
    { id: "item-1", quantityGrams: 100, displayName: "Fried egg", totals: { kcal: 200, fat: 15, protein: 14, carbs: 1, fiber: 0, netCarbs: 1 } },
    { id: "item-2", quantityGrams: 200, displayName: "Chili", totals: { kcal: 200, fat: 5, protein: 16, carbs: 9, fiber: 4, netCarbs: 5 } }
  ]
};

describe("MealEditDialog", () => {
  it("renders the meal's existing items with their current grams", () => {
    render(<MealEditDialog meal={meal} lang="en" state={{ token: "t", setToken: vi.fn() }} onCancel={vi.fn()} onSaved={vi.fn()}/>);
    expect(screen.getByText("Fried egg")).toBeTruthy();
    expect(screen.getByText("Chili")).toBeTruthy();
    expect((screen.getByLabelText("Fried egg — Quantity") as HTMLInputElement).value).toBe("100");
  });

  it("submits only the corrected item's grams as a PATCH, never nutrition fields", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/meals/meal-1") && init?.method === "PATCH") {
        const body = JSON.parse(String(init.body));
        expect(body).toEqual({ items: [{ mealItemId: "item-1", quantityGrams: 150 }] });
        expect(body.kcal).toBeUndefined();
        expect(body.snapshotKcal).toBeUndefined();
        return new Response(JSON.stringify({ meal }), { status: 200 });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const onSaved = vi.fn();
    render(<MealEditDialog meal={meal} lang="en" state={{ token: "t", setToken: vi.fn() }} onCancel={vi.fn()} onSaved={onSaved}/>);

    fireEvent.change(screen.getByLabelText("Fried egg — Quantity"), { target: { value: "150" } });
    fireEvent.click(screen.getByText(dict.en.save));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalled();
  });

  it("disables Save when a quantity is invalid", () => {
    render(<MealEditDialog meal={meal} lang="en" state={{ token: "t", setToken: vi.fn() }} onCancel={vi.fn()} onSaved={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText("Fried egg — Quantity"), { target: { value: "0" } });
    expect((screen.getByText(dict.en.save) as HTMLButtonElement).disabled).toBe(true);
  });

  it("never allows removing the last remaining item from within the dialog", () => {
    const singleItemMeal: MealDetail = { ...meal, items: [meal.items[0]] };
    render(<MealEditDialog meal={singleItemMeal} lang="en" state={{ token: "t", setToken: vi.fn() }} onCancel={vi.fn()} onSaved={vi.fn()}/>);
    expect(screen.queryByLabelText("Remove item")).toBeNull();
  });

  it("calls onCancel without any network request when nothing changed", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const onCancel = vi.fn();
    render(<MealEditDialog meal={meal} lang="en" state={{ token: "t", setToken: vi.fn() }} onCancel={onCancel} onSaved={vi.fn()}/>);
    fireEvent.click(screen.getByText(dict.en.save));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("DeleteMealDialog", () => {
  it.each(["hu", "de", "en"] as const)("shows a localized confirmation before deleting: %s", (lang) => {
    const onConfirm = vi.fn();
    render(<DeleteMealDialog lang={lang} onCancel={vi.fn()} onConfirm={onConfirm}/>);
    expect(screen.getByText(dict[lang].diary.confirmDelete)).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("only deletes after the destructive button is explicitly clicked", () => {
    const onConfirm = vi.fn();
    render(<DeleteMealDialog lang="en" onCancel={vi.fn()} onConfirm={onConfirm}/>);
    fireEvent.click(screen.getByText(dict.en.diary.deleteMeal));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("clicking cancel never triggers deletion", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DeleteMealDialog lang="en" onCancel={onCancel} onConfirm={onConfirm}/>);
    fireEvent.click(screen.getByText(dict.en.diary.cancel));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("RepeatMealDialog", () => {
  it.each(["hu", "de", "en"] as const)("shows the meal title and a localized repeat confirmation: %s", (lang) => {
    render(<RepeatMealDialog title="Breakfast" lang={lang} onCancel={vi.fn()} onConfirm={vi.fn()}/>);
    expect(screen.getByText("Breakfast")).toBeTruthy();
    expect(screen.getByText(dict[lang].diary.confirmRepeat)).toBeTruthy();
    expect(screen.getByText(dict[lang].diary.repeatMeal)).toBeTruthy();
  });

  it("only repeats after the confirm button is explicitly clicked", () => {
    const onConfirm = vi.fn();
    render(<RepeatMealDialog title="Breakfast" lang="en" onCancel={vi.fn()} onConfirm={onConfirm}/>);
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(dict.en.diary.repeatMeal));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("clicking cancel never triggers a repeat", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<RepeatMealDialog title="Breakfast" lang="en" onCancel={onCancel} onConfirm={onConfirm}/>);
    fireEvent.click(screen.getByText(dict.en.diary.cancel));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the confirm button while the request is pending, preventing a double-click duplicate", async () => {
    let resolveConfirm!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => { resolveConfirm = resolve; }));
    render(<RepeatMealDialog title="Breakfast" lang="en" onCancel={vi.fn()} onConfirm={onConfirm}/>);
    const confirmButton = screen.getByText(dict.en.diary.repeatMeal) as HTMLButtonElement;
    fireEvent.click(confirmButton);
    await waitFor(() => expect(confirmButton.disabled).toBe(true));
    fireEvent.click(confirmButton); // a second click while pending must not fire a second request
    expect(onConfirm).toHaveBeenCalledTimes(1);
    resolveConfirm();
  });

  it("shows a localized error and re-enables the button when the repeat fails", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("boom"));
    render(<RepeatMealDialog title="Breakfast" lang="en" onCancel={vi.fn()} onConfirm={onConfirm}/>);
    fireEvent.click(screen.getByText(dict.en.diary.repeatMeal));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect((screen.getByText(dict.en.diary.repeatMeal) as HTMLButtonElement).disabled).toBe(false);
  });
});
