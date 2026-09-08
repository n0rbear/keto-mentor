// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); });

// App defaults to lang="hu" before any server response can set it, so both
// mocked users stay on "hu" too — this suite is about the login→dashboard
// state machine, not language switching, and mixing the two would make the
// assertions ambiguous about which language is active at each step.
const profile = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const fullUser = { id: "u1", username: "alice", locale: "hu", profile };
const loginResponseUser = { id: "u1", username: "alice", locale: "hu" }; // /auth/login never includes `profile`
const emptyWeek = { weekStart: "2026-01-01", weekEnd: "2026-01-07", days: [], summary: { mealCount: 0, loggedDays: 0 } };
const emptyTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

type Gate = { resolve: () => void; promise: Promise<void> };
function gate(): Gate {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => { resolve = r; });
  return { resolve, promise };
}

function stubFetch({ meGate, weekGate }: { meGate?: Gate; weekGate?: Gate } = {}) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/auth/login") return new Response(JSON.stringify({ user: loginResponseUser, accessToken: "tok" }), { status: 200 });
    if (url.pathname === "/me") {
      if (meGate) await meGate.promise;
      return new Response(JSON.stringify({ user: fullUser }), { status: 200 });
    }
    if (url.pathname === "/meals/week") {
      if (weekGate) await weekGate.promise;
      return new Response(JSON.stringify(emptyWeek), { status: 200 });
    }
    if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: url.searchParams.get("date"), meals: [], totals: emptyTotals }), { status: 200 });
    throw new Error(`Unexpected request: ${url.pathname}${url.search} ${init?.method ?? "GET"}`);
  }));
}

async function submitLogin() {
  render(<App/>);
  fireEvent.click(screen.getByTestId("auth-mode-login"));
  fireEvent.change(screen.getByLabelText("Felhasználónév"), { target: { value: "alice" } });
  fireEvent.change(screen.getByLabelText("Jelszó"), { target: { value: "supersecret" } });
  fireEvent.click(screen.getByTestId("auth-submit"));
}

describe("login startup: no onboarding-form flash for a returning, already-onboarded user", () => {
  it("never renders the onboarding form between login success and /me resolving", async () => {
    const meGate = gate();
    stubFetch({ meGate });
    await submitLogin();

    // /auth/login has resolved (its response user has no `profile`), but /me
    // is still pending — the bootstrapping placeholder must show instead of
    // ever rendering the onboarding form for this already-onboarded user.
    await waitFor(() => expect(screen.getByText("Bejelentkezve, profil betöltése…")).toBeTruthy());
    expect(screen.queryByText("Kezdő beállítások")).toBeNull();

    meGate.resolve();
    await waitFor(() => expect(screen.queryByText("Bejelentkezve, profil betöltése…")).toBeNull());
    expect(screen.queryByText("Kezdő beállítások")).toBeNull();
    expect(screen.getByText("Napi áttekintés")).toBeTruthy();
  });

  it("renders the primary dashboard as soon as /me and today resolve, without waiting for a slow /meals/week", async () => {
    const weekGate = gate();
    stubFetch({ weekGate });
    await submitLogin();

    // /me and /meals/today can resolve immediately; the dashboard must not
    // wait on the still-pending week overview.
    await waitFor(() => expect(screen.getByText("Napi áttekintés")).toBeTruthy());

    weekGate.resolve();
    await waitFor(() => expect(screen.getByText("Heti áttekintés")).toBeTruthy());
  });
});

describe("login startup: delayed cold-start notice", () => {
  it("never shows the slow-server notice for a fast login", async () => {
    stubFetch();
    await submitLogin();
    await waitFor(() => expect(screen.getByText("Napi áttekintés")).toBeTruthy());
    expect(screen.queryByText(/szervere ébred/)).toBeNull();
  });

  it("shows the localized slow-server notice only after bootstrapping takes unusually long", async () => {
    const meGate = gate();
    stubFetch({ meGate });
    await submitLogin();
    await waitFor(() => expect(screen.getByText("Bejelentkezve, profil betöltése…")).toBeTruthy());
    expect(screen.queryByText(/szervere ébred/)).toBeNull();

    // Real timers deliberately (mixing vitest fake timers with RTL's
    // fetch-driven async waitFor is unreliable) — the notice must appear
    // once bootstrapping has genuinely run past the delay threshold.
    await new Promise((resolve) => setTimeout(resolve, 2700));
    await waitFor(() => expect(screen.getByText(/szervere ébred/)).toBeTruthy());

    meGate.resolve();
    await waitFor(() => expect(screen.getByText("Napi áttekintés")).toBeTruthy());
  }, 10000);
});
