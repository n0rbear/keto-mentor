// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, plateSetup: "skipped", dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const user = { id: "u1", username: "alice", locale: "en", profile };
const emptyTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };
const wiener = { id: "bls-wiener", name: "Wiener Würstchen", names: { en: "Wiener sausage" }, kcalPer100g: 290, fatPer100g: 26, proteinPer100g: 13, carbsPer100g: 1, fiberPer100g: 0, source: "bls", sourceId: "W1" };
const offWiener = { ...wiener, id: "off-wiener", name: "Wiener Sausage (brand)", names: { en: "Wiener Sausage (brand)" }, source: "open_food_facts", sourceId: "123" };

describe("picking another candidate keeps the stated amount (\"2 pár virsli\")", () => {
  it("converts 4 pieces for the picked food on the server instead of asking for grams", async () => {
    const bodies: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/me") return new Response(JSON.stringify({ user }));
      if (url.pathname === "/meals/week") return new Response(JSON.stringify({ weekStart: "2026-10-12", weekEnd: "2026-10-18", days: [], summary: { mealCount: 0, loggedDays: 0 } }));
      if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: "2026-10-16", meals: [], totals: emptyTotals }));
      if (url.pathname === "/meal-input/interpret") return new Response(JSON.stringify({
        input: "2 pár virsli", parsed: { quantity: 4, unit: "piece", foodQuery: "virsli" },
        foodResolution: "confirmation_required", selectedFood: wiener, candidates: [wiener, offWiener], ambiguous: true,
        quantity: { status: "resolved", grams: 238, estimated: false, requiresConfirmation: false }, canConfirm: false, confidence: 0.95, interpretationSource: "deterministic"
      }));
      if (url.pathname === "/meal-input/quantity") {
        bodies.push(JSON.parse(String(init?.body)));
        return new Response(JSON.stringify({ quantity: { status: "resolved", grams: 238, gramsPerUnit: 59.5, method: "generic_unit_weight", estimated: true, requiresConfirmation: false } }));
      }
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
    }));
    render(<App/>);
    const input = await screen.findByPlaceholderText("For example: 5 eggs");
    fireEvent.change(input, { target: { value: "2 pár virsli" } });
    fireEvent.click(screen.getByText("Interpret"));
    await waitFor(() => expect(screen.getAllByText("This one").length).toBeGreaterThan(1));
    fireEvent.click(screen.getAllByText("This one")[1]);
    await waitFor(() => expect(bodies).toEqual([{ foodId: "off-wiener", parsed: { quantity: 4, unit: "piece", foodQuery: "virsli" } }]));
    await waitFor(() => expect((screen.getByLabelText(/Quantity/i) as HTMLInputElement).value).toBe("238"));
  });
});
