// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RecipeBuilder } from "./RecipeBuilder";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const state = { token: "token", setToken: vi.fn() };
const food = { id: "f1", name: "Spinach", kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9, carbsPer100g: 3.6, fiberPer100g: 2.2 };
const nutrition = { total: { macros: { kcal: 46, fat: 0.8, protein: 5.8, carbs: 7.2, fiber: 4.4, netCarbs: 2.8 }, nutrients: {} }, perServing: null, per100g: null };

function summaryRow(title: string) {
  return { id: "r1", userId: "owner", title, visibility: "private" as const, sourceType: "manual" as const, servings: null, finishedWeightGrams: null, user: { id: "owner", username: "owner" }, nutrition };
}
function detailRow(title: string) {
  return { id: "r1", userId: "owner", title, description: "", instructions: [], servings: null, finishedWeightGrams: null, visibility: "private", sourceType: "manual", sourceUrl: null, user: { id: "owner", username: "owner" }, ingredients: [{ id: "i1", foodId: "f1", quantityGrams: 200, food }], nutrition };
}

describe("full recipe-lifecycle integration: library -> detail -> edit -> save -> updated detail -> library reflects update", () => {
  it("shows the title change everywhere after an edit round-trip", async () => {
    let currentTitle = "Original Bowl";
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      if (method === "GET" && url.pathname === "/recipes") return new Response(JSON.stringify({ recipes: [summaryRow(currentTitle)] }), { status: 200 });
      if (method === "GET" && url.pathname === "/recipes/r1") return new Response(JSON.stringify({ recipe: detailRow(currentTitle) }), { status: 200 });
      if (method === "PUT" && url.pathname === "/recipes/r1") {
        const body = JSON.parse(String(init?.body));
        currentTitle = body.title;
        return new Response(JSON.stringify({ recipe: { id: "r1" } }), { status: 200 });
      }
      throw new Error(`Unexpected request: ${method} ${url.pathname}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<RecipeBuilder lang="en" state={state} currentUserId="owner" onMealAdded={vi.fn()}/>);

    // Library
    await waitFor(() => expect(screen.getByText("Original Bowl")).toBeTruthy());

    // -> Detail
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Original Bowl" })).toBeTruthy());

    // -> Edit
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    const titleInput = await screen.findByLabelText("Recipe name") as HTMLInputElement;
    expect(titleInput.value).toBe("Original Bowl");
    fireEvent.change(titleInput, { target: { value: "Updated Bowl" } });

    // -> Save
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    // -> Updated detail (never library first — edit returns to detail)
    await waitFor(() => expect(screen.getByRole("heading", { name: "Updated Bowl" })).toBeTruthy());
    expect(screen.queryByRole("button", { name: "View" })).toBeNull(); // still on detail, not back in the library

    // -> Back to library reflects the update
    fireEvent.click(screen.getByText("Back to recipes"));
    await waitFor(() => expect(screen.getByText("Updated Bowl")).toBeTruthy());
    expect(screen.queryByText("Original Bowl")).toBeNull();
  });
});

describe("full recipe-lifecycle integration: detail -> delete -> confirm -> library -> recipe absent", () => {
  it("removes the deleted recipe from the library after confirmation", async () => {
    let deleted = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";
      if (method === "GET" && url.pathname === "/recipes") return new Response(JSON.stringify({ recipes: deleted ? [] : [summaryRow("Doomed Bowl")] }), { status: 200 });
      if (method === "GET" && url.pathname === "/recipes/r1") return new Response(JSON.stringify({ recipe: detailRow("Doomed Bowl") }), { status: 200 });
      if (method === "DELETE" && url.pathname === "/recipes/r1") { deleted = true; return new Response(null, { status: 204 }); }
      throw new Error(`Unexpected request: ${method} ${url.pathname}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<RecipeBuilder lang="en" state={state} currentUserId="owner" onMealAdded={vi.fn()}/>);

    await waitFor(() => expect(screen.getByText("Doomed Bowl")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Doomed Bowl" })).toBeTruthy());

    fireEvent.click(screen.getByLabelText("Delete"));
    expect(screen.getByText("Delete this recipe?")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.getByText("No recipes to show yet.")).toBeTruthy());
    expect(screen.queryByText("Doomed Bowl")).toBeNull();
  });
});
