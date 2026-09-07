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
const todayDate = todayIso.slice(0, 10);
const todayMeal = { id: "meal-today", title: "Breakfast", eatenAt: todayIso, totals: zeroTotals };

const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(todayIso);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1 + i); // rough Monday-based fill, values don't need to be exact
  return { date: d.toISOString().slice(0, 10), mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 };
});
const currentWeek = { weekStart: currentWeekDays[0].date, weekEnd: currentWeekDays[6].date, days: currentWeekDays, summary: { mealCount: 0, loggedDays: 0 } };

const priorWeekMeal = { id: "meal-prior-week", title: "Old Dinner", eatenAt: "2025-12-30T19:00:00.000Z", totals: zeroTotals };
const priorWeek = {
  weekStart: "2025-12-29", weekEnd: "2026-01-04",
  days: [
    { date: "2025-12-29", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 },
    { date: "2025-12-30", mealCount: 1, kcal: 500, netCarbs: 12, protein: 30, fat: 20, fiber: 3 },
    { date: "2025-12-31", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 },
    { date: "2026-01-01", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 },
    { date: "2026-01-02", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 },
    { date: "2026-01-03", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 },
    { date: "2026-01-04", mealCount: 0, kcal: 0, netCarbs: 0, protein: 0, fat: 0, fiber: 0 }
  ],
  summary: { mealCount: 1, loggedDays: 1 }
};

function stubFetch(dayMealsByDate: Record<string, any[]>) {
  const weekFetches: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));

    if (url.pathname === "/me") return new Response(JSON.stringify({ user }), { status: 200 });

    if (url.pathname === "/meals/today") {
      const date = url.searchParams.get("date")!;
      const meals = dayMealsByDate[date] ?? [];
      return new Response(JSON.stringify({ date, meals, totals: zeroTotals }), { status: 200 });
    }

    if (url.pathname === "/meals/week") {
      const date = url.searchParams.get("date")!;
      weekFetches.push(date);
      const week = date === "2025-12-30" ? priorWeek : currentWeek;
      return new Response(JSON.stringify(week), { status: 200 });
    }

    throw new Error(`Unexpected request: ${url.pathname}${url.search}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { weekFetches };
}

describe("full-App: historical date navigation drives the week overview, and the week overview drives the diary", () => {
  it("switching to a date in a different week re-fetches that week, and clicking a week day switches the selected diary date", async () => {
    stubFetch({ [todayDate]: [todayMeal], "2025-12-30": [priorWeekMeal] });

    render(<App/>);

    await waitFor(() => expect(screen.getByText("Breakfast")).toBeTruthy());
    // Initial week overview shows the current week's zeroed days.
    expect(screen.getAllByRole("listitem")).toHaveLength(7);

    // Jump the diary directly to a date inside a different (prior) week via the date picker.
    fireEvent.change(screen.getByLabelText("Select date"), { target: { value: "2025-12-30" } });
    await waitFor(() => expect(screen.getByText("Old Dinner")).toBeTruthy());

    // The week overview must now reflect that prior week (its logged day/meal summary).
    await waitFor(() => expect(screen.getByText(/1 \/ 7 days logged/)).toBeTruthy());

    // Clicking a different day within the now-displayed prior week changes the selected diary date,
    // reusing the same diary UI rather than a separate view.
    const emptyDayCell = screen.getByRole("listitem", { name: /29 December/i });
    fireEvent.click(emptyDayCell);
    await waitFor(() => expect((screen.getByLabelText("Select date") as HTMLInputElement).value).toBe("2025-12-29"));
    await waitFor(() => expect(screen.getByText("No meals logged for this day.")).toBeTruthy());
  });

  it("previous/next week navigation does not move the selected diary date", async () => {
    stubFetch({ [todayDate]: [todayMeal] });
    render(<App/>);

    await waitFor(() => expect(screen.getByText("Breakfast")).toBeTruthy());
    const dateInput = screen.getByLabelText("Select date") as HTMLInputElement;
    const initialValue = dateInput.value;

    fireEvent.click(screen.getByLabelText("Previous week"));
    await waitFor(() => expect(screen.getByText(/0 \/ 7 days logged/)).toBeTruthy());

    expect(dateInput.value).toBe(initialValue); // week nav alone must never change the selected day
  });

  it("disables the next-week button while viewing the current week", async () => {
    stubFetch({ [todayDate]: [todayMeal] });
    render(<App/>);

    await waitFor(() => expect(screen.getByText("Breakfast")).toBeTruthy());
    expect((screen.getByLabelText("Next week") as HTMLButtonElement).disabled).toBe(true);
  });
});
