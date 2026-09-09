// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const emptyWeek = { weekStart: "2026-01-01", weekEnd: "2026-01-07", days: [], summary: { mealCount: 0, loggedDays: 0 } };
const emptyTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

const huCandidates = [
  { source: "usda_fdc", sourceId: "169157", name: "Pork, pickled pork hocks", originalName: "Pork, pickled pork hocks", names: { en: "Pork, pickled pork hocks", hu: "Pácolt sertéscsülök" }, category: "Pork Products", confidence: 0.9 },
  { source: "usda_fdc", sourceId: "168277", name: "Bologna, pork", originalName: "Bologna, pork", names: { en: "Bologna, pork", hu: "Sertés bolognai felvágott" }, category: "Sausages and Luncheon Meats", confidence: 0.85 }
];

function stubFetch(user: { id: string; username: string; locale: string }) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/me") return new Response(JSON.stringify({ user: { ...user, profile } }), { status: 200 });
    if (url.pathname === "/meals/week") return new Response(JSON.stringify(emptyWeek), { status: 200 });
    if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: url.searchParams.get("date"), meals: [], totals: emptyTotals }), { status: 200 });
    if (url.pathname === "/meal-input/interpret") {
      return new Response(JSON.stringify({
        input: "150 g csülök", parsed: { quantity: 150, unit: "g", foodQuery: "csulok" },
        foodResolution: "confirmation_required", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
        interpretationSource: "deterministic", externalCandidates: huCandidates, externalCandidatesReason: "ambiguous"
      }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  }));
}

describe("candidate lists present in the user's configured app language, not raw English", () => {
  it("a Hungarian-configured user sees Hungarian candidate names and the Hungarian ambiguity heading, with English kept only as secondary metadata", async () => {
    stubFetch({ id: "u1", username: "alice", locale: "hu" });
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Napi áttekintés")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText("Például: 5 tojás"), { target: { value: "150 g csülök" } });
    fireEvent.click(screen.getByText("Értelmezés"));

    await waitFor(() => expect(screen.getByText("Melyikre gondoltál?")).toBeTruthy());
    expect(screen.getByText("Pácolt sertéscsülök")).toBeTruthy();
    expect(screen.getByText("Sertés bolognai felvágott")).toBeTruthy();
    // The authoritative English name is still available (transparency), just secondary.
    expect(screen.getByText("Pork, pickled pork hocks")).toBeTruthy();
    // Never a raw English heading for a Hungarian-configured user.
    expect(screen.queryByText("Which did you mean?")).toBeNull();
  });
});
