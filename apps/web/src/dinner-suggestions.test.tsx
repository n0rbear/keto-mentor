// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DinnerSuggestions } from "./DinnerSuggestions";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const state = { token: "t", setToken: () => undefined };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("Vacsoraajánló", () => {
  it("shows dinners that fit and logs one as dinner at one serving", async () => {
    const posts: Array<{ path: string; body: any }> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/meals/dinner-suggestions") {
        expect(url.searchParams.get("date")).toBe("2026-10-15");
        return json({ remaining: { kcal: 700, protein: 40, netCarbs: 10, fat: 50 }, status: "ok", suggestions: [
          { recipeId: "r1", source: "reference", title: "Csirkepaprikás galuska nélkül", servingGrams: 350, perServing: { kcal: 520, protein: 38, netCarbs: 6, fat: 36 }, after: { kcal: 180, protein: 2, netCarbs: 4, fat: 14 } }
        ] });
      }
      if (url.pathname === "/recipes/r1/meals") { posts.push({ path: url.pathname, body: JSON.parse(String(init?.body)) }); return json({ meal: {} }, 201); }
      throw new Error(`unexpected ${url.pathname}`);
    }));
    const onLogged = vi.fn();
    render(<DinnerSuggestions lang="hu" state={state} date="2026-10-15" onLogged={onLogged}/>);
    fireEvent.click(screen.getByRole("button", { name: "Mit egyek vacsorára?" }));
    expect(await screen.findByText("Csirkepaprikás galuska nélkül")).toBeTruthy();
    expect(screen.getByText(/700 kcal · P 40 g · NCH 10 g/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Naplózom vacsoraként: Csirkepaprikás/ }));
    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(posts[0].body).toEqual({ mealType: "dinner", quantity: 1, unit: "serving" });
    expect(screen.getByText("Naplózva vacsoraként.")).toBeTruthy();
  });

  it("offers lunch leftovers as an extra and logs them as a repeat for dinner", async () => {
    const posts: Array<{ path: string; body: any }> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/meals/dinner-suggestions") return json({ remaining: { kcal: 700, protein: 40, netCarbs: 10, fat: 50 }, status: "ok", suggestions: [], leftovers: [
        { mealId: "m1", title: "Csirkepörkölt", mealType: "lunch", mealTypeLabel: null, perServing: { kcal: 480, protein: 35, netCarbs: 5, fat: 32 }, after: { kcal: 220, protein: 5, netCarbs: 5, fat: 18 } }
      ] });
      if (url.pathname === "/meals/m1/repeat") { posts.push({ path: url.pathname, body: JSON.parse(String(init?.body)) }); return json({ meal: {} }, 201); }
      throw new Error(`unexpected ${url.pathname}`);
    }));
    render(<DinnerSuggestions lang="hu" state={state} date="2026-10-15" onLogged={() => undefined}/>);
    fireEvent.click(screen.getByRole("button", { name: "Mit egyek vacsorára?" }));
    expect(await screen.findByText("Ha maradt az ebédből…")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Naplózom vacsoraként: Csirkepörkölt/ }));
    await waitFor(() => expect(posts).toEqual([{ path: "/meals/m1/repeat", body: { mealType: "dinner" } }]));
  });

  it("explains an exhausted carb budget and a premium lock", async () => {
    let call = 0;
    vi.stubGlobal("fetch", vi.fn(async () => (++call === 1
      ? json({ remaining: { kcal: 300, protein: 10, netCarbs: 0, fat: 20 }, status: "carb_budget_used", suggestions: [] })
      : json({ error: "premium_required" }, 403))));
    render(<DinnerSuggestions lang="hu" state={state} date="2026-10-15" onLogged={() => undefined}/>);
    fireEvent.click(screen.getByRole("button", { name: "Mit egyek vacsorára?" }));
    expect(await screen.findByText(/nettó szénhidrátkereted már elfogyott/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Újraszámolás" }));
    expect(await screen.findByText("A Vacsoraajánló prémium funkció.")).toBeTruthy();
  });
});
