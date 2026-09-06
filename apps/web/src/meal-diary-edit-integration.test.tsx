// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const user = { id: "u1", username: "alice", locale: "en", profile };
const zeroTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

const todayMeal = { id: "meal-today", title: "Breakfast", eatenAt: new Date().toISOString(), totals: zeroTotals };
const pastMeal = { id: "meal-past", title: "Old Lunch", eatenAt: "2026-01-01T12:00:00.000Z", totals: zeroTotals };
const pastMealDetail = { ...pastMeal, items: [{ id: "item-1", quantityGrams: 100, displayName: "Fried egg", totals: zeroTotals }] };

function mockFetchTracking(dateFetches: string[]) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";

    if (url.pathname === "/me") return new Response(JSON.stringify({ user }), { status: 200 });

    if (url.pathname === "/meals/today" && method === "GET") {
      const date = url.searchParams.get("date")!;
      dateFetches.push(date);
      const meal = date === "2026-01-01" ? pastMeal : todayMeal;
      return new Response(JSON.stringify({ date, meals: [meal], totals: zeroTotals }), { status: 200 });
    }

    if (url.pathname === "/meals/meal-past" && method === "GET") {
      return new Response(JSON.stringify({ meal: pastMealDetail }), { status: 200 });
    }

    if (url.pathname === "/meals/meal-past" && method === "PATCH") {
      return new Response(JSON.stringify({ meal: { ...pastMealDetail, items: [{ ...pastMealDetail.items[0], quantityGrams: 150 }] } }), { status: 200 });
    }

    throw new Error(`Unexpected request: ${method} ${url.pathname}${url.search}`);
  });
}

describe("editing while browsing a historical day keeps the diary on that day", () => {
  it("stays on the selected historical date after a successful edit, and never re-requests today's date", async () => {
    const dateFetches: string[] = [];
    vi.stubGlobal("fetch", mockFetchTracking(dateFetches));

    render(<App/>);

    await waitFor(() => expect(screen.getByText("Breakfast")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Select date"), { target: { value: "2026-01-01" } });
    await waitFor(() => expect(screen.getByText("Old Lunch")).toBeTruthy());

    fireEvent.click(screen.getByLabelText("Edit meal"));
    await waitFor(() => expect(screen.getByText("Fried egg")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Fried egg — Quantity"), { target: { value: "150" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => expect(screen.queryByText("Fried egg")).toBeNull()); // dialog closed

    // Every /meals/today fetch after selecting the historical date — including the
    // post-edit refresh — must have used that same date, never silently reverting to today.
    const fetchesAfterNavigation = dateFetches.slice(dateFetches.indexOf("2026-01-01"));
    expect(fetchesAfterNavigation.every((d) => d === "2026-01-01")).toBe(true);
    expect(fetchesAfterNavigation.length).toBeGreaterThanOrEqual(2); // the navigation fetch + the post-edit refresh
  });
});
