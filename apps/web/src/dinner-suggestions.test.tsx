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
          { recipeId: "r1", source: "reference", title: "Csirkepaprikás galuska nélkül", servingGrams: 350, perServing: { kcal: 520, protein: 38, netCarbs: 6, fat: 36 }, after: { kcal: 180, protein: 2, netCarbs: 4, fat: 14 } },
          { recipeId: "r2", source: "reference", title: "Rántotta", servingGrams: 150, quick: true, perServing: { kcal: 260, protein: 20, netCarbs: 1, fat: 19 }, after: { kcal: 440, protein: 20, netCarbs: 9, fat: 31 } }
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
    // Only the quick dish carries the "5–10 perc" badge.
    expect(screen.getAllByText("Gyors, 5–10 perc a hűtőből")).toHaveLength(1);
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

describe("DinnerSuggestions: Újraszámolás", () => {
  it("asks for dishes not shown yet, and explains when old ones had to come back", async () => {
    const urls: URL[] = [];
    const item = (id: string) => ({ recipeId: id, source: "reference", title: `Étel ${id}`, servingGrams: 300, perServing: { kcal: 400, protein: 30, netCarbs: 3, fat: 28 }, after: { kcal: 300, protein: 10, netCarbs: 7, fat: 22 } });
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input)); urls.push(url);
      const round = urls.length;
      return json({ remaining: { kcal: 700, protein: 40, netCarbs: 10, fat: 50 }, status: "ok", repeated: round === 3 || undefined,
        suggestions: round === 1 ? [item("a"), item("b")] : round === 2 ? [item("c")] : [item("a")] });
    }));
    render(<DinnerSuggestions lang="hu" state={state} date="2026-10-17" onLogged={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: "Mit egyek vacsorára?" }));
    await screen.findByText("Étel a");
    expect(urls[0].searchParams.get("shown")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Újraszámolás" }));
    await screen.findByText("Étel c");
    expect(urls[1].searchParams.get("shown")).toBe("a,b");
    fireEvent.click(screen.getByRole("button", { name: "Újraszámolás" }));
    await screen.findByText("Étel a");
    expect(urls[2].searchParams.get("shown")).toBe("a,b,c");
    expect(screen.getByText(/Több új ötletem nincs/)).toBeTruthy();
  });
});

describe("DinnerSuggestions: Nézz be a hűtőbe", () => {
  it("sends the ticked items, remembers them, and shows what is missing", async () => {
    localStorage.clear();
    const urls: URL[] = [];
    const item = (id: string, missing: string[]) => ({ recipeId: id, source: "reference", title: `Étel ${id}`, servingGrams: 300, missing, perServing: { kcal: 400, protein: 30, netCarbs: 3, fat: 28 }, after: { kcal: 300, protein: 10, netCarbs: 7, fat: 22 } });
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input)); urls.push(url);
      if (url.pathname === "/meals/fridge-items") return json({ items: [{ key: "egg", label: "Tojás" }, { key: "ham", label: "Sonka, felvágott" }] });
      return json({ remaining: { kcal: 700, protein: 40, netCarbs: 10, fat: 50 }, status: "ok", suggestions: [item("a", []), item("b", ["majonéz"])] });
    }));
    render(<DinnerSuggestions lang="hu" state={state} date="2026-10-20" onLogged={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button", { name: /Nézz be a hűtőbe/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Tojás" }));
    expect(screen.getByRole("button", { name: /Tojás/ }).getAttribute("aria-pressed")).toBe("true");
    expect(JSON.parse(localStorage.getItem("km_fridge")!)).toEqual(["egg"]);
    fireEvent.click(screen.getByRole("button", { name: "Mit egyek vacsorára?" }));
    await screen.findByText("Étel a");
    expect(urls.find((u) => u.pathname === "/meals/dinner-suggestions")!.searchParams.get("have")).toBe("egg");
    expect(screen.getByText("✓ Minden megvan hozzá")).toBeTruthy();
    expect(screen.getByText("Hiányzik: majonéz")).toBeTruthy();
  });
});
