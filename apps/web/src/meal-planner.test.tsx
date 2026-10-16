// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MealPlanner } from "./MealPlanner";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });
const state = { token: "t", setToken: () => undefined };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const goals = { kcal: 1800, protein: 110, netCarbs: 25, fat: 130 };
const meal = (mealType: string, title: string, recipeId: string) => ({ mealType, recipeId, source: "reference", titles: { hu: title, de: title, en: title }, servingGrams: 300, macros: { kcal: 550, protein: 35, netCarbs: 5, fat: 40 } });
const plan = (dinner = "Csirkepaprikás") => ({
  id: "p1", startDate: "2026-10-16",
  days: [{ date: "2026-10-16", fits: true, totals: { kcal: 1650, protein: 105, netCarbs: 15, fat: 120 }, meals: [meal("breakfast", "Rántotta", "r1"), meal("lunch", "Sült karaj", "r2"), meal("dinner", dinner, "r3")] }],
  shopping: [{ name: "Sertéskaraj", grams: 1200, seasoning: false, meals: 4 }, { name: "só", grams: 10, seasoning: true, meals: 6 }]
});

describe("Heti étrendterv", () => {
  it("creates a plan, swaps a dinner, logs today's meal and ticks the shopping list", async () => {
    const calls: Array<{ method: string; path: string; body?: any }> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input)); const method = init?.method ?? "GET";
      calls.push({ method, path: url.pathname, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (url.pathname === "/meal-plans/current") return json({ plan: null, goals });
      if (url.pathname === "/meal-plans" && method === "POST") return json({ plan: plan(), goals }, 201);
      if (url.pathname === "/meal-plans/p1/alternatives") return json({ alternatives: [
        { ...meal("dinner", "Halászlé", "r9"), effort: "long", dayTotals: { kcal: 1600, protein: 100, netCarbs: 14, fat: 110 } },
        { ...meal("dinner", "Tonhalsaláta", "r10"), effort: "quick", dayTotals: { kcal: 1500, protein: 95, netCarbs: 12, fat: 100 } }
      ] });
      if (url.pathname === "/meal-plans/p1/swap") return json({ plan: plan("Halászlé"), goals });
      if (url.pathname === "/recipes/r3/meals") return json({ meal: {} }, 201);
      throw new Error(`unexpected ${method} ${url.pathname}`);
    }));
    const onLogged = vi.fn();
    render(<MealPlanner lang="hu" state={state} today="2026-10-16" onLogged={onLogged}/>);
    fireEvent.click(await screen.findByRole("button", { name: "Heti terv készítése" }));
    expect(await screen.findByText("Csirkepaprikás")).toBeTruthy();
    expect(calls.find((c) => c.path === "/meal-plans")?.body).toEqual({ startDate: "2026-10-16" });

    fireEvent.click(screen.getByRole("button", { name: "Másikat kérek: Vacsora" }));
    expect(await screen.findByText("Válassz helyette:")).toBeTruthy();
    expect(screen.getByText("Hosszabb főzés")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ezt választom: Halászlé" }));
    expect(await screen.findByText("Halászlé")).toBeTruthy();
    expect(calls.find((c) => c.path === "/meal-plans/p1/swap")?.body).toEqual({ date: "2026-10-16", mealType: "dinner", recipeId: "r9" });

    fireEvent.click(screen.getByRole("button", { name: "Naplózom: Halászlé" }));
    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(calls.find((c) => c.path === "/recipes/r3/meals")?.body).toEqual({ mealType: "dinner", quantity: 1, unit: "serving" });

    fireEvent.click(screen.getByRole("button", { name: /Bevásárlólista/ }));
    expect(screen.getByText("1.2 kg", { exact: false })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: /Sertéskaraj/ }));
    expect(JSON.parse(localStorage.getItem("km_shopping_p1")!)).toEqual({ Sertéskaraj: true });
    // Share as a checklist note (clipboard fallback when the share sheet is missing).
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    fireEvent.click(screen.getByRole("button", { name: /Megosztás telefonra/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const text = (writeText.mock.calls[0] as unknown as string[])[0];
    expect(text).toContain("☑ Sertéskaraj – 1.2 kg");
    expect(text).toContain("☐ só – 10 g");
    const print = vi.fn(); vi.stubGlobal("print", print);
    fireEvent.click(screen.getByRole("button", { name: /Nyomtatás \/ PDF/ }));
    await waitFor(() => expect(print).toHaveBeenCalled());
    expect(document.querySelector(".print-report")?.textContent).toContain("Sertéskaraj");
  });

  it("builds an own plan: empty week, search and pick a dish, remove it", async () => {
    const calls: Array<{ method: string; path: string; body?: any }> = [];
    const empty = { id: "p2", startDate: "2026-10-16", days: [{ date: "2026-10-16", fits: true, totals: { kcal: 0, protein: 0, netCarbs: 0, fat: 0 }, meals: [] }], shopping: [] };
    const withLunch = { ...empty, days: [{ ...empty.days[0], totals: { kcal: 550, protein: 35, netCarbs: 5, fat: 40 }, meals: [meal("lunch", "Cézár saláta", "r20")] }] };
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input)); const method = init?.method ?? "GET";
      calls.push({ method, path: url.pathname + (url.pathname.endsWith("/dishes") ? `?q=${url.searchParams.get("q")}` : ""), body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (url.pathname === "/meal-plans/current") return json({ plan: null, goals });
      if (url.pathname === "/meal-plans" && method === "POST") return json({ plan: empty, goals }, 201);
      if (url.pathname === "/meal-plans/p2/dishes") return json({ dishes: [{ ...meal("lunch", "Cézár saláta", "r20"), effort: "quick", dayTotals: { kcal: 550, protein: 35, netCarbs: 5, fat: 40 }, fits: true }] });
      if (url.pathname === "/meal-plans/p2/swap") return json({ plan: withLunch, goals });
      if (url.pathname === "/meal-plans/p2/clear") return json({ plan: empty, goals });
      throw new Error(`unexpected ${method} ${url.pathname}`);
    }));
    render(<MealPlanner lang="hu" state={state} today="2026-10-16" onLogged={() => undefined}/>);
    fireEvent.click(await screen.findByRole("button", { name: /Saját terv összeállítása/ }));
    await waitFor(() => expect(screen.getAllByText("Még üres – válassz ételt.")).toHaveLength(3));
    expect(calls.find((c) => c.path === "/meal-plans")?.body).toEqual({ startDate: "2026-10-16", mode: "empty" });
    fireEvent.click(screen.getByRole("button", { name: "Étel hozzáadása: Ebéd" }));
    fireEvent.change(await screen.findByPlaceholderText(/Keress ételt/), { target: { value: "saláta" } });
    fireEvent.click(await screen.findByRole("button", { name: "Ezt választom: Cézár saláta" }));
    await waitFor(() => expect(calls.find((c) => c.path === "/meal-plans/p2/swap")?.body).toEqual({ date: "2026-10-16", mealType: "lunch", recipeId: "r20" }));
    await waitFor(() => expect(screen.getAllByText("Még üres – válassz ételt.")).toHaveLength(2));
    expect(calls.some((c) => c.path === "/meal-plans/p2/dishes?q=saláta")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Törlés: Ebéd" }));
    await waitFor(() => expect(screen.getAllByText("Még üres – válassz ételt.")).toHaveLength(3));
  });

  it("shows the premium lock", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: "premium_required" }, 403)));
    render(<MealPlanner lang="hu" state={state} today="2026-10-16" onLogged={() => undefined}/>);
    expect(await screen.findByText("A heti étrendterv prémium funkció.")).toBeTruthy();
  });
});
