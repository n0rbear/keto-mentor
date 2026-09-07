// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RecipeDetail } from "./RecipeDetail";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const state = { token: "token", setToken: vi.fn() };
const food = { id: "f1", name: "Spinach", kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9, carbsPer100g: 3.6, fiberPer100g: 2.2 };

function ownedRecipe(overrides: Record<string, unknown> = {}) {
  return {
    id: "r1", userId: "owner", title: "Spinach Bowl", description: "A quick bowl", instructions: ["Wash", "Cook", "Serve"],
    servings: 2, finishedWeightGrams: 400, visibility: "private", sourceType: "manual", sourceUrl: null,
    user: { id: "owner", username: "owner" },
    ingredients: [{ id: "i1", foodId: "f1", quantityGrams: 200, food }],
    nutrition: {
      total: { macros: { kcal: 46, fat: 0.8, protein: 5.8, carbs: 7.2, fiber: 4.4, netCarbs: 2.8 }, nutrients: {} },
      perServing: { macros: { kcal: 23, fat: 0.4, protein: 2.9, carbs: 3.6, fiber: 2.2, netCarbs: 1.4 }, nutrients: {} },
      per100g: { macros: { kcal: 11.5, fat: 0.2, protein: 1.45, carbs: 1.8, fiber: 1.1, netCarbs: 0.7 }, nutrients: {} }
    },
    ...overrides
  };
}

function stubFetch(handlers: Record<string, () => Response>) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const key = `${init?.method ?? "GET"} ${url.pathname}`;
    if (handlers[key]) return handlers[key]();
    throw new Error(`Unexpected request: ${key}`);
  }));
}

describe("RecipeDetail", () => {
  it("shows ingredients, ordered instructions, and total/per-serving/per-100g nutrition", async () => {
    stubFetch({ "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe() }), { status: 200 }) });
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={vi.fn()} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    expect(screen.getByText(/Spinach.*200 g/)).toBeTruthy();
    const steps = screen.getAllByRole("listitem").map((el) => el.textContent);
    expect(steps.indexOf("Wash")).toBeLessThan(steps.indexOf("Cook"));
    expect(steps.indexOf("Cook")).toBeLessThan(steps.indexOf("Serve"));
    expect(screen.getByText("Whole recipe")).toBeTruthy();
    expect(screen.getByText("Per serving")).toBeTruthy();
    expect(screen.getByText("Per 100 g")).toBeTruthy();
  });

  it("shows owner actions (Edit, Delete) for the recipe's owner", async () => {
    stubFetch({ "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe() }), { status: 200 }) });
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={vi.fn()} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Edit/ })).toBeTruthy();
    expect(screen.getByLabelText("Delete")).toBeTruthy();
    expect(screen.queryByText("Save as mine")).toBeNull();
  });

  it("shows Save as mine instead of owner actions for a public recipe owned by someone else", async () => {
    stubFetch({ "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe({ userId: "someone-else", visibility: "public" }) }), { status: 200 }) });
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="viewer" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={vi.fn()} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    expect(screen.getByText("Save as mine")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Edit/ })).toBeNull();
    expect(screen.queryByLabelText("Delete")).toBeNull();
  });

  it("shows imported-recipe source attribution when sourceUrl is present", async () => {
    stubFetch({ "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe({ sourceType: "schema_org", sourceUrl: "https://example.com/recipes/spinach" }) }), { status: 200 }) });
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={vi.fn()} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    expect(screen.getByText("Source:", { exact: false })).toBeTruthy();
    const link = screen.getByText("example.com") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("https://example.com/recipes/spinach");
  });

  it("labels an AI-extracted recipe distinctly from a schema.org one, without misattributing it", async () => {
    stubFetch({ "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe({ sourceType: "ai_structured", sourceUrl: "https://example.com/recipes/spinach" }) }), { status: 200 }) });
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={vi.fn()} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    expect(screen.getByText(/AI-extracted/)).toBeTruthy();
  });

  it("does not show the AI-extracted tag for a schema.org-imported recipe", async () => {
    stubFetch({ "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe({ sourceType: "schema_org", sourceUrl: "https://example.com/recipes/spinach" }) }), { status: 200 }) });
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={vi.fn()} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    expect(screen.queryByText(/AI-extracted/)).toBeNull();
  });

  it("shows no source line for a manual recipe", async () => {
    stubFetch({ "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe() }), { status: 200 }) });
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={vi.fn()} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    expect(screen.queryByText("Source:", { exact: false })).toBeNull();
  });

  it("calls onEdit with the loaded recipe when Edit is clicked", async () => {
    stubFetch({ "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe() }), { status: 200 }) });
    const onEdit = vi.fn();
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={onEdit} onDeleted={vi.fn()} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "r1", title: "Spinach Bowl" }));
  });

  it("requires explicit confirmation before deleting, and communicates diary safety", async () => {
    stubFetch({
      "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe() }), { status: 200 }),
      "DELETE /recipes/r1": () => new Response(null, { status: 204 })
    });
    const onDeleted = vi.fn();
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={onDeleted} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    fireEvent.click(screen.getByLabelText("Delete"));
    expect(screen.getByText("Delete this recipe?")).toBeTruthy();
    expect(screen.getByText(/Past diary entries stay unchanged/)).toBeTruthy();
    expect(onDeleted).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  });

  it("cancelling the delete dialog never deletes anything", async () => {
    stubFetch({ "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe() }), { status: 200 }) });
    const onDeleted = vi.fn();
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={onDeleted} onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    fireEvent.click(screen.getByLabelText("Delete"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Delete this recipe?")).toBeNull();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("adds the recipe to today's meal and reports success", async () => {
    stubFetch({
      "GET /recipes/r1": () => new Response(JSON.stringify({ recipe: ownedRecipe() }), { status: 200 }),
      "POST /recipes/r1/meals": () => new Response(JSON.stringify({ meal: { id: "m1" } }), { status: 201 })
    });
    const onMealAdded = vi.fn().mockResolvedValue(undefined);
    render(<RecipeDetail recipeId="r1" lang="en" state={state} currentUserId="owner" onBack={vi.fn()} onEdit={vi.fn()} onDeleted={vi.fn()} onMealAdded={onMealAdded}/>);
    await waitFor(() => expect(screen.getByText("Spinach Bowl")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Add to meal" }));
    await waitFor(() => expect(onMealAdded).toHaveBeenCalled());
    expect(await screen.findByText(/added to today's meal/)).toBeTruthy();
  });
});
