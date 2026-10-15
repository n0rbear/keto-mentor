// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { diaryCsv, ExportCard } from "./ExportCard";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const state = { token: "t", setToken: () => undefined };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const tot = { kcal: 520, fat: 38.5, protein: 35, carbs: 6, fiber: 1.5, netCarbs: 4.5 };
const data = { from: "2026-10-10", to: "2026-10-16", goals: { dailyKcal: 1800, dailyProtein: 110, dailyNetCarbs: 25, dailyFat: 130, dailyFiber: 25 },
  days: [{ date: "2026-10-15", totals: tot, meals: [{ time: "12:30", mealType: "lunch", mealTypeLabel: null, title: "Csirke; rizs nélkül", totals: tot, items: [{ name: "Csirkemell", grams: 200, ...tot }] }] }] };

describe("Export", () => {
  it("builds an Excel-friendly CSV (semicolons and decimal commas in Hungarian)", () => {
    const csv = diaryCsv(data, "hu");
    expect(csv.startsWith("﻿Dátum;Idő;Étkezés;")).toBe(true);
    expect(csv).toContain('2026-10-15;12:30;Ebéd;"Csirke; rizs nélkül";Csirkemell;200;520;38,5;35;6;1,5;4,5');
    expect(diaryCsv(data, "en")).toContain("2026-10-15,12:30,Lunch,");
  });

  it("asks for the chosen period and opens the printable report", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => { urls.push(String(input)); return json(data); }));
    const print = vi.fn();
    vi.stubGlobal("print", print);
    render(<ExportCard lang="hu" state={state} today="2026-10-16"/>);
    fireEvent.click(screen.getByRole("button", { name: "Utolsó 30 nap" }));
    fireEvent.click(screen.getByRole("button", { name: /Jelentés \/ PDF/ }));
    await waitFor(() => expect(print).toHaveBeenCalled());
    expect(urls[0]).toContain("from=2026-09-17&to=2026-10-16");
    expect(document.querySelector(".print-report")?.textContent).toContain("Csirke; rizs nélkül");
  });

  it("says when the period is empty", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ ...data, days: [] })));
    render(<ExportCard lang="hu" state={state} today="2026-10-16"/>);
    fireEvent.click(screen.getByRole("button", { name: /CSV letöltése/ }));
    expect(await screen.findByText("Ebben az időszakban nincs naplózott étkezés.")).toBeTruthy();
  });
});
