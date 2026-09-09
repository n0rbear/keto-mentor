// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const user = { id: "u1", username: "alice", locale: "en", profile };
const emptyWeek = { weekStart: "2026-01-01", weekEnd: "2026-01-07", days: [], summary: { mealCount: 0, loggedDays: 0 } };
const emptyTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

const candidateFood = { id: "dynamic-1", name: "Pork hock, cooked", names: { en: "Pork hock, cooked" }, kcalPer100g: 280, fatPer100g: 22, proteinPer100g: 20, carbsPer100g: 0, fiberPer100g: 0, source: "usda_fdc", sourceId: "172152" };

function stubFetch({ onConfirm }: { onConfirm: () => void }) {
  let confirmed = false;
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/me") return new Response(JSON.stringify({ user }), { status: 200 });
    if (url.pathname === "/meals/week") return new Response(JSON.stringify(emptyWeek), { status: 200 });
    if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: url.searchParams.get("date"), meals: [], totals: emptyTotals }), { status: 200 });
    if (url.pathname === "/foods/resolve-external/confirm") {
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({ source: "usda_fdc", sourceId: "172152" }); // never nutrition
      confirmed = true;
      onConfirm();
      return new Response(JSON.stringify({ status: "confirmed", food: candidateFood }), { status: 200 });
    }
    if (url.pathname === "/meal-input/interpret") {
      if (!confirmed) {
        return new Response(JSON.stringify({
          input: "150 g csülök", parsed: { quantity: 150, unit: "g", foodQuery: "csulok" },
          foodResolution: "confirmation_required", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
          interpretationSource: "deterministic",
          externalCandidates: [{ source: "usda_fdc", sourceId: "172152", name: "Pork hock, cooked", originalName: "Pork hock, cooked", category: "Pork Products", confidence: 0.96 }],
          externalCandidatesReason: "weak_match"
        }), { status: 200 });
      }
      return new Response(JSON.stringify({
        input: "150 g csülök", parsed: { quantity: 150, unit: "g", foodQuery: "csulok" },
        foodResolution: "resolved", selectedFood: candidateFood, candidates: [candidateFood],
        quantity: { status: "resolved", grams: 150, method: "measured", estimated: false, requiresConfirmation: false },
        canConfirm: true, confidence: 1, interpretationSource: "deterministic"
      }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  }));
}

describe("dynamic food resolution: confirming an external candidate re-resolves locally", () => {
  it("shows candidates, confirms via source+sourceId only, then re-interprets to a resolved local Food", async () => {
    let confirmCalled = false;
    stubFetch({ onConfirm: () => { confirmCalled = true; } });
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Daily overview")).toBeTruthy());

    const input = screen.getByPlaceholderText("For example: 5 eggs");
    fireEvent.change(input, { target: { value: "150 g csülök" } });
    fireEvent.click(screen.getByText("Interpret"));

    await waitFor(() => expect(screen.getByText("I found this:")).toBeTruthy());
    expect(screen.getByText("Pork hock, cooked")).toBeTruthy();

    fireEvent.click(screen.getByText("This one"));

    await waitFor(() => expect(confirmCalled).toBe(true));
    await waitFor(() => expect(screen.queryByText("I found this:")).toBeNull());
  });
});
