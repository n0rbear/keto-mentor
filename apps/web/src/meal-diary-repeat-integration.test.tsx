// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const user = { id: "u1", username: "alice", locale: "en", profile };
const zeroTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

const todayIso = new Date().toISOString();
const todayMeal = { id: "meal-today", title: "Breakfast", eatenAt: todayIso, totals: zeroTotals };
const pastMeal = { id: "meal-past", title: "Old Lunch", eatenAt: "2026-01-01T12:00:00.000Z", totals: zeroTotals };
const repeatedMeal = { id: "meal-repeated", title: "Old Lunch", eatenAt: todayIso, totals: zeroTotals };

describe("repeating a meal from a historical day", () => {
  it("switches the diary to Today and shows the newly repeated meal there", async () => {
    const dateFetches: string[] = [];
    let repeatCalled = false;
    let todayMealsNow = [todayMeal];

    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";

      if (url.pathname === "/me") return new Response(JSON.stringify({ user }), { status: 200 });

      if (url.pathname === "/meals/today" && method === "GET") {
        const date = url.searchParams.get("date")!;
        dateFetches.push(date);
        const meals = date === "2026-01-01" ? [pastMeal] : todayMealsNow;
        return new Response(JSON.stringify({ date, meals, totals: zeroTotals }), { status: 200 });
      }

      if (url.pathname === "/meals/meal-past/repeat" && method === "POST") {
        expect(JSON.parse(String(init?.body ?? "{}"))).toEqual({});
        repeatCalled = true;
        todayMealsNow = [todayMeal, repeatedMeal];
        return new Response(JSON.stringify({ meal: { ...repeatedMeal, items: [] } }), { status: 201 });
      }

      throw new Error(`Unexpected request: ${method} ${url.pathname}${url.search}`);
    }));

    render(<App/>);

    await waitFor(() => expect(screen.getByText("Breakfast")).toBeTruthy());

    fireEvent.change(screen.getByLabelText("Select date"), { target: { value: "2026-01-01" } });
    await waitFor(() => expect(screen.getByText("Old Lunch")).toBeTruthy());
    expect(screen.queryByText("Breakfast")).toBeNull(); // confirms we're genuinely on the historical day now

    fireEvent.click(screen.getByLabelText("Repeat"));
    await waitFor(() => expect(screen.getByText("Log this meal again now?")).toBeTruthy());

    fireEvent.click(screen.getByText("Repeat", { selector: "button" }));

    await waitFor(() => expect(repeatCalled).toBe(true));
    await waitFor(() => expect((screen.getByLabelText("Select date") as HTMLInputElement).value).not.toBe("2026-01-01"));

    // Today's list must reflect the fresh server state (the repeated meal now
    // present alongside the original), never an optimistic client-side guess.
    await waitFor(() => expect(screen.getByText("Breakfast")).toBeTruthy());
    await waitFor(() => expect(screen.getAllByText("Old Lunch").length).toBeGreaterThan(0));

    const fetchesAfterReturn = dateFetches.slice(dateFetches.lastIndexOf("2026-01-01") + 1);
    expect(fetchesAfterReturn.length).toBeGreaterThan(0);
    expect(fetchesAfterReturn.every((d) => d !== "2026-01-01")).toBe(true);
  });
});
