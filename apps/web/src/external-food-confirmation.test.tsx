// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FoodCombobox } from "./main";

afterEach(() => vi.restoreAllMocks());

describe("external food confirmation", () => {
  it("submits only source identity, disables double submit, then selects the server Food", async () => {
    let finishConfirmation!: (response: Response) => void;
    let confirmationCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/foods?q=")) return new Response(JSON.stringify({ foods: [] }), { status: 200 });
      if (url.endsWith("/foods/resolve-external")) return new Response(JSON.stringify({ status: "confirmation_required", candidates: [{
        source: "usda_fdc", sourceId: "123", name: "Spinach, raw", confidence: 0.86,
        kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9, carbsPer100g: 3.6, fiberPer100g: 2.2
      }] }), { status: 200 });
      if (url.endsWith("/foods/resolve-external/confirm")) {
        confirmationCalls += 1;
        expect(JSON.parse(String(init?.body))).toEqual({ source: "usda_fdc", sourceId: "123" });
        return new Promise<Response>((resolve) => { finishConfirmation = resolve; });
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const onSelect = vi.fn();
    render(<FoodCombobox lang="en" state={{ token: "token", setToken: vi.fn() }} selected={null} onSelect={onSelect} resetVersion={0}
      labels={{ label: "Food", placeholder: "Search", loading: "Loading", noResults: "None", hint: "Hint", selected: "Selected" }}/>);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "spenót" } });
    await waitFor(() => expect(screen.getByRole("button", { name: "Search trusted external sources" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Search trusted external sources" }));
    const confirm = await screen.findByRole("button", { name: "Add to catalog" });
    fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(confirmationCalls).toBe(1));
    expect((confirm as HTMLButtonElement).disabled).toBe(true);

    finishConfirmation(new Response(JSON.stringify({ status: "confirmed", food: { id: "food-1", name: "Spinach, raw", kcalPer100g: 23 } }), { status: 200 }));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "food-1" })));
  });
});
