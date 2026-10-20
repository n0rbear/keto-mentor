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

describe("ticket 5732ac: \"6 tojás, 2 szelet jagdwurst, 2 szelet gouda\"", () => {
  it("logs an item converted with a typical slice weight instead of doing nothing", async () => {
    const egg = { ...wiener, id: "bls-egg", name: "Scrambled egg", names: { en: "Scrambled egg" }, sourceId: "E1" };
    const jagd = { ...wiener, id: "bls-W254000", name: "Jagdwurst/Schinkenwurst grob", names: { en: "Jagdwurst" }, sourceId: "W254000" };
    const meals: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/me") return new Response(JSON.stringify({ user }));
      if (url.pathname === "/meals/week") return new Response(JSON.stringify({ weekStart: "2026-10-19", weekEnd: "2026-10-25", days: [], summary: { mealCount: 0, loggedDays: 0 } }));
      if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: "2026-10-20", meals: [], totals: emptyTotals }));
      if (url.pathname === "/meal-input/interpret") return new Response(JSON.stringify({
        input: "6 tojás, 2 szelet jagdwurst", parsed: { foodQuery: "6 tojás, 2 szelet jagdwurst" }, foodResolution: "multi", canConfirm: false, confidence: 0.9, interpretationSource: "ai_assisted",
        items: [
          { input: "6 tojás", parsed: { quantity: 6, unit: "piece", foodQuery: "tojás" }, foodResolution: "resolved", selectedFood: egg, candidates: [egg], canConfirm: true, confidence: 0.9, interpretationSource: "ai_assisted", nutritionEligible: true,
            quantity: { status: "resolved", grams: 300, servingId: "s-egg", estimated: false, requiresConfirmation: false } },
          { input: "2 szelet jagdwurst", parsed: { quantity: 2, unit: "slice", foodQuery: "jagdwurst" }, foodResolution: "confirmation_required", selectedFood: null, candidates: [jagd], canConfirm: false, confidence: 0.4, interpretationSource: "ai_assisted", nutritionEligible: false, quantity: null }
        ]
      }));
      if (url.pathname === "/meal-input/quantity") return new Response(JSON.stringify({ quantity: { status: "resolved", grams: 30, gramsPerUnit: 15, method: "curated", estimated: true, requiresConfirmation: false } }));
      if (url.pathname === "/meals" && init?.method === "POST") { meals.push(JSON.parse(String(init.body))); return new Response(JSON.stringify({ meal: {} }), { status: 201 }); }
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
    }));
    render(<App/>);
    const input = await screen.findByPlaceholderText("For example: 5 eggs");
    fireEvent.change(input, { target: { value: "6 tojás, 2 szelet jagdwurst" } });
    fireEvent.click(screen.getByText("Interpret"));
    fireEvent.click(await screen.findByText("This one"));
    await waitFor(() => expect((screen.getByText("Log all") as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByText("Log all"));
    await waitFor(() => expect(meals).toHaveLength(1));
    expect(meals[0].items).toEqual([
      { foodId: "bls-egg", quantity: 6, unit: "serving", servingId: "s-egg" },
      { foodId: "bls-W254000", quantity: 30, unit: "g", quantityConfirmation: { method: "estimated", accepted: true, grams: 30 } }
    ]);
  });
});

describe("ticket 90f2d5: several amounts to confirm", () => {
  it("after one estimate, the next estimate is shown even if an item between them still waits for a choice", async () => {
    const lyoner = { ...wiener, id: "bls-lyoner", name: "Lyoner", names: { en: "Lyoner" }, sourceId: "W2" };
    const roll = { ...wiener, id: "bls-roll", name: "Weizenbrötchen", names: { en: "Wheat roll" }, sourceId: "B511000" };
    const egg = { ...wiener, id: "bls-egg", name: "Egg", names: { en: "Egg" }, sourceId: "E1" };
    const est = (grams: number) => ({ status: "resolved", grams, method: "ai_estimated", estimated: true, requiresConfirmation: true, rangeGrams: { min: grams - 10, max: grams + 20 } });
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === "/me") return new Response(JSON.stringify({ user }));
      if (url.pathname === "/meals/week") return new Response(JSON.stringify({ weekStart: "2026-10-19", weekEnd: "2026-10-25", days: [], summary: { mealCount: 0, loggedDays: 0 } }));
      if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: "2026-10-20", meals: [], totals: emptyTotals }));
      if (url.pathname === "/meal-input/interpret") return new Response(JSON.stringify({
        input: "3 tojás, 2 szelet lyoner, 2 zsemle", parsed: { foodQuery: "x" }, foodResolution: "multi", canConfirm: false, confidence: 0.9, interpretationSource: "ai_assisted",
        clarification: { type: "estimate_confirmation", itemIndex: 0, allowCustomGrams: true, suggestedGrams: 150, method: "ai_estimated" },
        items: [
          { input: "3 tojás", parsed: { quantity: 3, unit: "piece", foodQuery: "tojás" }, foodResolution: "resolved", selectedFood: egg, candidates: [egg], canConfirm: false, confidence: 0.9, interpretationSource: "ai_assisted", nutritionEligible: true, quantity: est(150) },
          { input: "2 szelet lyoner", parsed: { quantity: 2, unit: "slice", foodQuery: "lyoner" }, foodResolution: "confirmation_required", selectedFood: null, candidates: [lyoner], canConfirm: false, confidence: 0.4, interpretationSource: "ai_assisted", nutritionEligible: false, quantity: null },
          { input: "2 zsemle", parsed: { quantity: 2, unit: "piece", foodQuery: "zsemle" }, foodResolution: "resolved", selectedFood: roll, candidates: [roll], canConfirm: false, confidence: 0.9, interpretationSource: "ai_assisted", nutritionEligible: true, quantity: est(112) }
        ]
      }));
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });
    }));
    render(<App/>);
    const input = await screen.findByPlaceholderText("For example: 5 eggs");
    fireEvent.change(input, { target: { value: "3 tojás, 2 szelet lyoner, 2 zsemle" } });
    fireEvent.click(screen.getByText("Interpret"));
    fireEvent.click(await screen.findByText("Accept (150 g)"));
    expect(await screen.findByText("Accept (112 g)")).toBeTruthy();
    expect(screen.getByText(/Before logging, still to decide/).textContent).toMatch(/Lyoner|lyoner/);
  });
});
