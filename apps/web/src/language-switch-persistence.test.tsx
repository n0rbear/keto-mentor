// @vitest-environment jsdom
// The persisted User.locale (from /me) is the single canonical source of an
// authenticated user's UI language. Switching the header language selector
// must persist immediately via PATCH /me/locale so it never silently reverts
// on the next login/reload — see main.tsx's changeLang(). This is the
// "establish one canonical rule" requirement for the language-change
// lifecycle: the frontend never keeps its own separate stored copy
// (no localStorage duplication) beyond the one in-flight request round-trip.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const emptyWeek = { weekStart: "2026-01-01", weekEnd: "2026-01-07", days: [], summary: { mealCount: 0, loggedDays: 0 } };
const emptyTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

function stubFetch() {
  const patchCalls: Array<{ body: unknown }> = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/me") return new Response(JSON.stringify({ user: { id: "u1", username: "alice", locale: "hu", profile } }), { status: 200 });
    if (url.pathname === "/meals/week") return new Response(JSON.stringify(emptyWeek), { status: 200 });
    if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: url.searchParams.get("date"), meals: [], totals: emptyTotals }), { status: 200 });
    if (url.pathname === "/me/locale" && init?.method === "PATCH") {
      patchCalls.push({ body: JSON.parse(String(init.body)) });
      return new Response(JSON.stringify({ locale: JSON.parse(String(init.body)).locale }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url.pathname} ${init?.method ?? "GET"}`);
  }));
  return patchCalls;
}

describe("switching the language selector persists it for an authenticated user", () => {
  it("updates the UI immediately AND sends exactly one PATCH /me/locale — never silently local-only", async () => {
    const patchCalls = stubFetch();
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Napi áttekintés")).toBeTruthy());

    const langSelect = screen.getByLabelText("Nyelv") as HTMLSelectElement;
    fireEvent.change(langSelect, { target: { value: "de" } });

    // Optimistic UI: the German heading appears without waiting on the network.
    await waitFor(() => expect(screen.getByText("Tagesübersicht")).toBeTruthy());
    await waitFor(() => expect(patchCalls).toHaveLength(1));
    expect(patchCalls[0].body).toEqual({ locale: "de" });
  });

  it("before login, changing the language never calls the backend — nothing to persist yet", async () => {
    localStorage.clear();
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => { throw new Error(`Unexpected request before login: ${String(input)}`); });
    vi.stubGlobal("fetch", fetchSpy);
    render(<App/>);
    const langSelect = screen.getByLabelText("Nyelv") as HTMLSelectElement;
    fireEvent.change(langSelect, { target: { value: "en" } });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
