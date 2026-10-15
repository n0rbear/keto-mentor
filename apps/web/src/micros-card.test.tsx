// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MicrosCard } from "./MicrosCard";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const state = { token: "t", setToken: () => undefined };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const n = (key: string, group: string, amount: number, reference: number, kind = "min") => ({ key, group, unit: "mg", amount, reference, kind, percent: Math.round(amount / reference * 100) });

describe("Mikrotápanyagok", () => {
  it("says so instead of showing zeros when no item has data", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ date: "2026-10-16", items: 1, itemsWithData: 0, nutrients: [n("sodium", "mineral", 0, 2000, "max")] })));
    render(<MicrosCard lang="hu" state={state} date="2026-10-16"/>);
    expect(await screen.findByText("A mai tételekhez még nincs vitamin- és ásványianyag-adat az adatbázisban.")).toBeTruthy();
    expect(screen.queryByText("Keto-elektrolitok")).toBeNull();
  });

  it("shows electrolytes first, percentages of the reference and a partial-data note", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ date: "2026-10-16", items: 3, itemsWithData: 2, nutrients: [n("sodium", "mineral", 2600, 2000, "max"), n("potassium", "mineral", 1500, 2000), n("magnesium", "mineral", 135, 375), n("iron", "mineral", 7, 14), n("vitamin_c", "vitamin", 40, 80)] })));
    render(<MicrosCard lang="hu" state={state} date="2026-10-16"/>);
    expect(await screen.findByText("Keto-elektrolitok")).toBeTruthy();
    expect(screen.getByText(/130% felső ajánlás/)).toBeTruthy();
    expect(screen.getByText(/36% a napi referenciaérték/)).toBeTruthy();
    expect(screen.getByText("3 tételből 2 tápanyagadata ismert, a valós érték ennél magasabb lehet.")).toBeTruthy();
    expect(document.querySelector(".micro-fill.is-over")).toBeTruthy();
  });
});
