// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProgressStats } from "./ProgressStats";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const state = { token: "t", setToken: () => undefined };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const week = (weekStart: string, loggedDays: number, ketoDays: number) => ({ weekStart, loggedDays, ketoDays, percent: loggedDays ? Math.round(ketoDays / loggedDays * 100) : null, avg: loggedDays ? { kcal: 1700, protein: 100, netCarbs: 18 } : null });

describe("Haladó statisztika", () => {
  it("shows adherence, streak, weekly bars with a table view, and saves a weight", async () => {
    let weights = [{ date: "2026-10-01", weightKg: 84 }, { date: "2026-10-10", weightKg: 82.5 }];
    const puts: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/stats/progress") return json({ weeks: [week("2026-09-28", 0, 0), week("2026-10-05", 4, 3), week("2026-10-12", 5, 5)], streak: 5, percent: 89, goalNetCarbs: 25, today: "2026-10-16", weights });
      if (url.pathname === "/stats/weights" && init?.method === "PUT") { const body = JSON.parse(String(init.body)); puts.push(body); weights = [...weights, body]; return json({ weight: body }); }
      throw new Error(`unexpected ${url.pathname}`);
    }));
    render(<ProgressStats lang="hu" state={state} today="2026-10-16"/>);
    expect(await screen.findByText("89%")).toBeTruthy();
    expect(screen.getByText("5 nap")).toBeTruthy();
    expect(screen.getByText(/-1,5 kg az első mérés óta/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Táblázat" }));
    expect(screen.getByText("3/4 (75%)")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Testsúly (kg)"), { target: { value: "81,8" } });
    fireEvent.click(screen.getByRole("button", { name: "Mentés" }));
    await waitFor(() => expect(puts).toEqual([{ date: "2026-10-16", weightKg: 81.8 }]));
    expect(await screen.findByText(/-2,2 kg az első mérés óta/)).toBeTruthy();
  });

  it("shows the premium lock", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ error: "premium_required" }, 403)));
    render(<ProgressStats lang="hu" state={state} today="2026-10-16"/>);
    expect(await screen.findByText("A haladó statisztika prémium funkció.")).toBeTruthy();
  });
});
