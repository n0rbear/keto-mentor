// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PlatePortion } from "./PlatePortion";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const state = { token: "token", setToken: vi.fn() };

type Call = { url: URL; method: string; body: any };
function stubFetch(handler: (call: Call) => Response) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: new URL(String(input)), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(call);
    return handler(call);
  }));
  return calls;
}
const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("PlatePortion (saját tányérok)", () => {
  it("first use: no plate yet -> measure a deep plate once, then the dish estimate fills the grams", async () => {
    const calls = stubFetch(({ url, method }) => {
      if (url.pathname === "/me/plates" && method === "GET") return ok({ plates: [] });
      if (url.pathname === "/me/plates" && method === "POST") return ok({ plate: { id: "p1", name: "Mély tányér", kind: "deep", capacityMl: 650, diameterMm: null } }, 201);
      return ok({ grams: 498, densityGPerMl: 1.022, basis: "reference" });
    });
    const onEstimate = vi.fn();
    render(<PlatePortion lang="hu" state={state} recipeId="r1" onEstimate={onEstimate}/>);
    fireEvent.click(screen.getByText("Tányér alapján"));
    await screen.findByText(/Töltsd tele vízzel/);
    fireEvent.change(screen.getByLabelText("Név (pl. mély tányér)"), { target: { value: "Mély tányér" } });
    fireEvent.change(screen.getByLabelText("Űrtartalom (ml)"), { target: { value: "650" } });
    fireEvent.click(screen.getByText("Mentés"));
    await screen.findByText(/Mély tányér · Mély tányér · 650 ml/);
    fireEvent.click(screen.getByText("Kiszámolom"));
    fireEvent.click(await screen.findByText("Ezt használom"));
    expect(onEstimate).toHaveBeenCalledWith(498);
    expect(calls.find((c) => c.method === "POST" && c.url.pathname === "/me/plates")?.body).toEqual({ kind: "deep", name: "Mély tányér", capacityMl: 650 });
    expect(calls.find((c) => c.url.pathname === "/me/plates/p1/portion")?.body).toEqual({ fill: "normal", recipeId: "r1" });
  });

  it("a saved flat plate is offered straight away with flat fill levels, entered in cm and sent in mm", async () => {
    const calls = stubFetch(({ url, method }) => {
      if (url.pathname === "/me/plates" && method === "GET") return ok({ plates: [{ id: "f1", name: "Kis lapos", kind: "flat", capacityMl: null, diameterMm: 170 }] });
      return ok({ grams: 172, densityGPerMl: 1, basis: "default" });
    });
    render(<PlatePortion lang="en" state={state} onEstimate={vi.fn()}/>);
    fireEvent.click(screen.getByText("By plate"));
    await screen.findByText(/Kis lapos · Flat plate · Ø 17 cm/);
    expect(screen.queryByText("Half")).toBeNull();
    fireEvent.click(screen.getByLabelText("Heaped"));
    fireEvent.click(screen.getByText("Calculate"));
    expect(await screen.findByText(/General estimate/)).toBeTruthy();
    expect(calls.find((c) => c.url.pathname === "/me/plates/f1/portion")?.body).toEqual({ fill: "heaped" });
  });

  it("deletes a plate and never sends an invalid new one", async () => {
    const calls = stubFetch(({ url, method }) => {
      if (url.pathname === "/me/plates" && method === "GET") return ok({ plates: [{ id: "f1", name: "Régi", kind: "flat", capacityMl: null, diameterMm: 260 }] });
      return new Response(null, { status: 204 });
    });
    render(<PlatePortion lang="hu" state={state} onEstimate={vi.fn()}/>);
    fireEvent.click(screen.getByText("Tányér alapján"));
    fireEvent.click(await screen.findByLabelText("Törlés: Régi"));
    await waitFor(() => expect(calls.some((c) => c.method === "DELETE" && c.url.pathname === "/me/plates/f1")).toBe(true));
    await screen.findByText(/Töltsd tele vízzel/);
    fireEvent.click(screen.getByText("Mentés"));
    expect(await screen.findByText("Adj meg nevet és érvényes méretet.")).toBeTruthy();
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(0);
  });
});
