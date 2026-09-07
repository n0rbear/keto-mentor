// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecipeBuilder } from "./RecipeBuilder";
import { dict, type Lang } from "./i18n";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const state = { token: "token", setToken: vi.fn() };

const summary = {
  id: "r1", userId: "user", title: "Chicken Bowl", visibility: "private" as const, sourceType: "manual" as const,
  servings: 2, finishedWeightGrams: null, user: { id: "user", username: "me" },
  nutrition: { total: { macros: { kcal: 800, netCarbs: 10 } }, perServing: { macros: { kcal: 400, netCarbs: 5 } }, per100g: null }
};

function stubList(recipes: unknown[]) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname === "/recipes") return new Response(JSON.stringify({ recipes }), { status: 200 });
    throw new Error(`Unexpected request: ${url.pathname}${url.search}`);
  }));
}

describe("recipe library", () => {
  it("renders own recipes as compact cards with a view action", async () => {
    stubList([summary]);
    render(<RecipeBuilder lang="en" state={state} currentUserId="user" onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Chicken Bowl")).toBeTruthy());
    expect(screen.getByText("400", { exact: false })).toBeTruthy(); // per-serving kcal summary shown
    expect(screen.getByRole("button", { name: "View" })).toBeTruthy();
  });

  it("shows an empty state when the library has no recipes", async () => {
    stubList([]);
    render(<RecipeBuilder lang="en" state={state} currentUserId="user" onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("No recipes to show yet.")).toBeTruthy());
  });

  it("switches to the public tab and requests /recipes/public", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      return new Response(JSON.stringify({ recipes: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<RecipeBuilder lang="en" state={state} currentUserId="user" onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Community recipes"));
    await waitFor(() => expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/recipes/public"))).toBe(true));
  });

  it("opens the detail view when View is clicked", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === "/recipes") return new Response(JSON.stringify({ recipes: [summary] }), { status: 200 });
      if (url.pathname === "/recipes/r1") return new Response(JSON.stringify({ recipe: { ...summary, description: "Tasty", instructions: ["Cook"], ingredients: [], nutrition: summary.nutrition } }), { status: 200 });
      throw new Error(`Unexpected request: ${url.pathname}`);
    }));
    render(<RecipeBuilder lang="en" state={state} currentUserId="user" onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Chicken Bowl")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(screen.getByText("Back to recipes")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Tasty")).toBeTruthy());
  });

  it.each(["hu", "de", "en"] as const)("renders the library heading and new-recipe button localized: %s", async (lang: Lang) => {
    stubList([]);
    render(<RecipeBuilder lang={lang} state={state} currentUserId="user" onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText(dict[lang].recipes.emptyLibrary)).toBeTruthy());
    expect(screen.getByText(dict[lang].recipes.heading)).toBeTruthy();
    expect(screen.getByRole("button", { name: new RegExp(dict[lang].recipes.newRecipe) })).toBeTruthy();
    expect(screen.getByText(dict[lang].recipes.myRecipes)).toBeTruthy();
  });
});
