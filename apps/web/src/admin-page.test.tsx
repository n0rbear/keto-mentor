// @vitest-environment jsdom
// Owner admin screen (2026-10-15).
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminPage } from "./AdminPage";
import { AuthForm } from "./AuthForm";
import { App } from "./main";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); window.history.replaceState(null, "", "/"); });
const state = { token: "tok", setToken: vi.fn() };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const overview = {
  generatedAt: "2026-10-15T18:00:00Z", days: 30,
  users: { total: 12, new7: 3, new30: 12, withEmail: 10, verified: 4, active1: 2, active7: 5, active30: 9 },
  meals: { total: 140, last24h: 8, last7d: 60 }, recipes: { total: 7, public: 2 }, feedback: { open: 1, total: 6 },
  keto: { loggedDays: 20, adherentDays: 15, percent: 75, users: 3, usersMostlyAdherent: 2, perUser: [{ userId: "u1", username: "norbi", days: 10, adherentDays: 9, percent: 90, avgNetCarbs: 18.5, goal: 25 }] },
  usageTotals: { search: { count: 40, avgMs: 300, promptTokens: 0, completionTokens: 0 }, "ai:food_nlp": { count: 9, avgMs: 1500, promptTokens: 9000, completionTokens: 900 } },
  perDay: { "2026-10-15": { search: 40, meals_db: 8, register_db: 3 } }
};

describe("AdminPage", () => {
  it("shows the statistics, closes a ticket and saves settings", async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input)); calls.push([url.pathname + url.search, init]);
      if (url.pathname === "/admin/overview") return json(overview);
      if (url.pathname === "/admin/feedback" && !init?.method) return json({ items: [{ id: "dc9bcf", message: "1 db főtt tojás", status: "open", adminNote: null, view: "dashboard", lang: "hu", build: "main@x", lastInput: "Egy darab főtt tojás", createdAt: "2026-10-15T08:09:00Z", user: { username: "norbi", email: "a@b.c" } }] });
      if (url.pathname === "/admin/feedback/dc9bcf") return json({ item: {} });
      if (url.pathname === "/admin/settings" && !init?.method) return json({ settings: { registrationOpen: true, announcement: { enabled: false, hu: "", de: "", en: "" }, aiLimits: { perHour: 30, perDay: 100, perRecipe: 8 } } });
      if (url.pathname === "/admin/settings") return json({ settings: JSON.parse(String(init!.body)) });
      throw new Error(`unexpected ${url.pathname}`);
    }));
    render(<AdminPage state={state} onClose={vi.fn()}/>);
    expect(await screen.findByText("Felhasználók")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Gépelés közbeni keresés")).toBeTruthy();
    expect(screen.getByText("AI: food_nlp")).toBeTruthy();
    expect(screen.getByText("Keto-tartás (elmúlt 30 nap)")).toBeTruthy();
    expect(screen.getByText("% · 15 / 20 nap")).toBeTruthy();
    expect(screen.getByText("90% (9)")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Hibajegyek" }));
    expect(await screen.findByText("1 db főtt tojás")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Késznek jelölöm" }));
    await waitFor(() => expect(calls.some(([p, i]) => p === "/admin/feedback/dc9bcf" && i?.method === "PATCH")).toBe(true));

    fireEvent.click(screen.getByRole("tab", { name: "Beállítások" }));
    fireEvent.click(await screen.findByLabelText("Új felhasználók regisztrálhatnak"));
    fireEvent.click(screen.getByRole("button", { name: "Beállítások mentése" }));
    expect(await screen.findByText("Mentve, azonnal érvényes.")).toBeTruthy();
    const put = calls.find(([p, i]) => p === "/admin/settings" && i?.method === "PUT")!;
    expect(JSON.parse(String(put[1]!.body)).registrationOpen).toBe(false);
  });

  it("tells a non-admin that access is denied", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: "forbidden" }, 403)));
    render(<AdminPage state={state} onClose={vi.fn()}/>);
    expect((await screen.findByRole("alert")).textContent).toBe("Nincs admin jogosultság.");
  });
});

describe("registration closed by the admin", () => {
  it("offers only the sign-in with an explanation", () => {
    render(<AuthForm mode="login" registrationOpen={false} lang="hu" state={{ token: null, setToken: vi.fn() }} onSuccess={vi.fn()}/>);
    expect(screen.queryByTestId("auth-mode-register")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Az új regisztráció jelenleg szünetel");
  });
});

describe("announcement and e-mail confirmation in the app", () => {
  it("shows the announcement before sign-in and confirms an e-mail from the link", async () => {
    window.history.replaceState(null, "", "/#verify=abcdefghijklmnopqrstuvwxyz0123456789");
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input)); calls.push(url.pathname);
      if (url.pathname === "/config") return json({ registrationOpen: true, announcement: { hu: "Ma este karbantartás", de: "", en: "" } });
      if (url.pathname === "/auth/verify-email") return json({ ok: true });
      if (url.pathname === "/build-info") return json({});
      return json({ error: "missing_token" }, 401);
    }));
    render(<App/>);
    expect(await screen.findByText("Ma este karbantartás")).toBeTruthy();
    expect(await screen.findByText(/e-mail címed megerősítve|E-Mail-Adresse ist bestätigt|e-mail address is confirmed/)).toBeTruthy();
    expect(calls).toContain("/auth/verify-email");
    expect(window.location.hash).toBe("");
  });
});

describe("confirming the admin address from the link", () => {
  it("switches to the admin-only screen without a reload", async () => {
    localStorage.setItem("km_token", "tok");
    window.history.replaceState(null, "", "/#verify=abcdefghijklmnopqrstuvwxyz0123456789");
    let confirmed = false;
    const profile = { onboardingDone: true, plateSetup: "skipped", dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === "/config") return json({ registrationOpen: true, announcement: null });
      if (url.pathname === "/auth/verify-email") { confirmed = true; return json({ ok: true }); }
      if (url.pathname === "/me") return json({ user: { id: "a", username: "norbadmin", email: "norbert@norbapp.com", emailVerified: confirmed, isAdmin: confirmed, locale: "hu", profile } });
      if (url.pathname === "/meals/today") return json({ date: "2026-10-15", meals: [], totals: { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 } });
      if (url.pathname === "/meals/week") return json({ weekStart: "2026-10-12", weekEnd: "2026-10-18", days: [], summary: { mealCount: 0, loggedDays: 0 } });
      if (url.pathname === "/recipes") return json({ recipes: [] });
      if (url.pathname === "/admin/overview") return json(overview);
      return json({});
    }));
    render(<App/>);
    expect(await screen.findByRole("heading", { name: "Admin" })).toBeTruthy();
    // The admin account logs nothing: no diary, no recipe builder, no idea/bug buttons.
    await waitFor(() => expect(document.getElementById("today")).toBeNull());
    expect(document.getElementById("recipes")).toBeNull();
    expect(screen.queryByRole("button", { name: /Vissza az apphoz/ })).toBeNull();
  });
});
