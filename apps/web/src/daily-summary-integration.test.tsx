// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const user = { id: "u1", username: "alice", locale: "en", profile };
const emptyWeek = { weekStart: "2026-01-01", weekEnd: "2026-01-07", days: [], summary: { mealCount: 0, loggedDays: 0 } };

// Over the 25g net-carb goal (35g), but comfortably under every other goal —
// isolates the over-limit visual treatment to net carbs specifically.
const overLimitTotals = { kcal: 900, fat: 60, protein: 55, carbs: 40, fiber: 5, netCarbs: 35 };
const meals = [
  { id: "m1", title: "Breakfast", eatenAt: new Date().toISOString(), totals: overLimitTotals },
  { id: "m2", title: "Lunch", eatenAt: new Date().toISOString(), totals: { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 } }
];

function stubFetch() {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname === "/me") return new Response(JSON.stringify({ user }), { status: 200 });
    if (url.pathname === "/meals/week") return new Response(JSON.stringify(emptyWeek), { status: 200 });
    if (url.pathname === "/meals/today") {
      return new Response(JSON.stringify({ date: url.searchParams.get("date"), meals, totals: overLimitTotals }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url.pathname}${url.search}`);
  }));
}

describe("daily summary: meal count and over-limit net carbs", () => {
  it("shows the meal count for the selected day", async () => {
    stubFetch();
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Breakfast")).toBeTruthy());
    const macroGrid = screen.getByLabelText("Daily macros");
    expect(within(macroGrid).getByText("2")).toBeTruthy(); // meals.length
  });

  it("visually distinguishes net carbs once it exceeds the daily goal, uncapped past 100%", async () => {
    stubFetch();
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Breakfast")).toBeTruthy());
    const netCarbsTrack = screen.getByRole("progressbar", { name: "net carbs" });
    const tile = netCarbsTrack.closest(".metric-tile");
    expect(tile?.className).toContain("is-over-limit");
    // 35g against a 25g goal is 140% — the number itself must read past 100%.
    expect(screen.getByText("140% · 25")).toBeTruthy();
  });

  it("keeps a within-goal macro capped at 100% and without the over-limit class", async () => {
    stubFetch();
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Breakfast")).toBeTruthy());
    const kcalTrack = screen.getByRole("progressbar", { name: "kcal" });
    const tile = kcalTrack.closest(".metric-tile");
    expect(tile?.className).not.toContain("is-over-limit");
    expect(screen.getByText("50% · 1800")).toBeTruthy(); // 900/1800
  });
});
