// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FlexibleGoals } from "./FlexibleGoals";
import { effectiveGoals } from "./goals";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const state = { token: "t", setToken: () => undefined };
const base = { dailyKcal: 1800, dailyProtein: 110, dailyNetCarbs: 25, dailyFat: 130, dailyFiber: 25 };

describe("Rugalmas célok", () => {
  it("uses the weekday override for that day only", () => {
    const p = { ...base, weekdayGoals: { sat: { netCarbs: 45 } } };
    expect(effectiveGoals(p, "2026-10-17").dailyNetCarbs).toBe(45);
    expect(effectiveGoals(p, "2026-10-16").dailyNetCarbs).toBe(25);
  });

  it("applies the carb-cycling preset and saves only the filled days", async () => {
    let body: any;
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => { body = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ profile: { ...base, weekdayGoals: body.weekdayGoals } }), { status: 200 }); }));
    const onSaved = vi.fn();
    render(<FlexibleGoals lang="hu" state={state} base={base} value={null} onSaved={onSaved}/>);
    fireEvent.click(screen.getByRole("button", { name: "Hétvégén +20 g nettó CH" }));
    fireEvent.change(screen.getByLabelText("Hétfő – kcal"), { target: { value: "2000" } });
    fireEvent.click(screen.getByRole("button", { name: "Célok mentése" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(body).toEqual({ weekdayGoals: { mon: { kcal: 2000 }, sat: { netCarbs: 45 }, sun: { netCarbs: 45 } } });
  });

  it("rejects out-of-range values before sending", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<FlexibleGoals lang="hu" state={state} base={base} value={null} onSaved={() => undefined}/>);
    fireEvent.change(screen.getByLabelText("Kedd – kcal"), { target: { value: "300" } });
    fireEvent.click(screen.getByRole("button", { name: "Célok mentése" }));
    expect(screen.getByRole("alert").textContent).toContain("kcal 800–6000");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
