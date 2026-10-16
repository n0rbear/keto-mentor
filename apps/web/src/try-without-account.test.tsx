// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TryWithoutAccount } from "./TryWithoutAccount";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const m = (kcal: number, netCarbs: number) => ({ kcal, fat: 20, protein: 15, carbs: netCarbs, fiber: 0, netCarbs });

describe("Próbáld ki regisztráció nélkül", () => {
  it("shows nutrition for what the visitor intends to eat, without an account", async () => {
    let body: any; let auth: string | null = "x";
    vi.stubGlobal("fetch", vi.fn(async (_i: RequestInfo | URL, init?: RequestInit) => {
      body = JSON.parse(String(init?.body)); auth = new Headers(init?.headers).get("authorization");
      return new Response(JSON.stringify({ items: [{ name: "Tojás", grams: 100, status: "ok", macros: m(143, 0.7) }, { name: "Bacon", grams: 30, status: "estimated", macros: m(160, 0.4) }], totals: m(303, 1.1) }));
    }));
    render(<TryWithoutAccount lang="hu"/>);
    fireEvent.change(screen.getByLabelText("Mit szeretnél enni?"), { target: { value: "2 tojás 3 szelet bacon" } });
    fireEvent.click(screen.getByRole("button", { name: "Mutasd" }));
    expect(await screen.findByText("Tojás")).toBeTruthy();
    expect(screen.getByText(/303 kcal · nettó CH 1.1 g/)).toBeTruthy();
    expect(screen.getByText("becsült mennyiség")).toBeTruthy();
    expect(body).toEqual({ text: "2 tojás 3 szelet bacon", lang: "hu" });
    expect(auth).toBeNull();
  });

  it("explains the rate limit", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 })));
    render(<TryWithoutAccount lang="en"/>);
    fireEvent.change(screen.getByLabelText("What do you want to eat?"), { target: { value: "avocado" } });
    fireEvent.click(screen.getByRole("button", { name: "Show me" }));
    expect(await screen.findByText(/Too many tries/)).toBeTruthy();
  });
});
