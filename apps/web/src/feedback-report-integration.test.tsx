// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, plateSetup: "skipped", dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const user = { id: "u1", username: "alice", locale: "en", profile };
const emptyWeek = { weekStart: "2026-01-01", weekEnd: "2026-01-07", days: [], summary: { mealCount: 0, loggedDays: 0 } };
const zero = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

describe("in-app bug report from the header", () => {
  it("includes the view, the last submitted meal text and its operation id", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/me") return new Response(JSON.stringify({ user }), { status: 200 });
      if (url.pathname === "/meals/week") return new Response(JSON.stringify(emptyWeek), { status: 200 });
      if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: url.searchParams.get("date"), meals: [], totals: zero }), { status: 200 });
      if (url.pathname === "/build-info") return new Response(JSON.stringify({ environment: "production", branch: "main", commit: "f96919a", bootedAt: "x" }), { status: 200 });
      if (url.pathname.startsWith("/meal-input/progress/")) return new Response("", { status: 200 });
      if (url.pathname === "/meal-input/interpret") return new Response(JSON.stringify({ error: "internal_error" }), { status: 500 });
      if (url.pathname === "/feedback") return new Response(JSON.stringify({ id: "f00d42" }), { status: 201 });
      throw new Error(`Unexpected request: ${url.pathname}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App/>);
    await waitFor(() => expect(screen.getByPlaceholderText("For example: 5 eggs")).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText("For example: 5 eggs"), { target: { value: "3 eggs with bacon" } });
    fireEvent.click(screen.getByText("Interpret"));
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes("/meal-input/interpret"))).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: "Report a problem" }));
    fireEvent.change(screen.getByPlaceholderText("What didn’t work? What did you type, what did you expect?"), { target: { value: "Interpret failed" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Ticket: #f00d42"));

    const interpretBody = JSON.parse(fetchMock.mock.calls.find(([u]) => String(u).includes("/meal-input/interpret"))![1]!.body as string);
    const feedbackBody = JSON.parse(fetchMock.mock.calls.find(([u]) => String(u).endsWith("/feedback"))![1]!.body as string);
    expect(feedbackBody.context).toMatchObject({ view: "dashboard", lang: "en", build: "main@f96919a production", lastInput: "3 eggs with bacon", operationId: interpretBody.operationId });
    expect(JSON.stringify(feedbackBody)).not.toContain("test-token");
  });
});
