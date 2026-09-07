// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecipeBuilder } from "./RecipeBuilder";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const state = { token: "token", setToken: vi.fn() };
const food = { id: "spinach", name: "Spinach", kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9, carbsPer100g: 3.6, fiberPer100g: 2.2 };

const aiPreview = {
  title: "AI Spinach Bowl", sourceUrl: "https://example.com/no-jsonld", servings: 2,
  instructions: ["Cook spinach", "Fry eggs"], extractionMethod: "ai_structured", importProof: "signed.proof",
  ingredients: [{ originalText: "200 g spinach", parsedQuantity: 200, parsedUnit: "g", parsedFoodQuery: "spinach", resolution: "resolved", selectedFood: food, candidates: [food], quantity: { status: "resolved", grams: 200, requiresConfirmation: false }, canConfirm: true }]
};

describe("full integration: URL import with no JSON-LD -> AI extraction -> review -> save -> library -> detail", () => {
  it("shows the AI-extracted recipe in the library after saving, and its detail carries URL + AI provenance", async () => {
    let savedRecipe: any = null;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const method = init?.method ?? "GET";

      if (method === "GET" && url.pathname === "/recipes") {
        return new Response(JSON.stringify({ recipes: savedRecipe ? [savedRecipe.summary] : [] }), { status: 200 });
      }
      if (method === "POST" && url.pathname === "/recipes/import-url/preview") {
        const body = JSON.parse(String(init?.body));
        expect(body.url).toBe("https://example.com/no-jsonld"); // the URL the user actually entered
        return new Response(JSON.stringify({ preview: aiPreview }), { status: 200 });
      }
      if (method === "POST" && url.pathname === "/recipes") {
        const body = JSON.parse(String(init?.body));
        // The saved recipe must carry the AI extraction method and the exact matching proof — never a forged/other method.
        expect(body.sourceType).toBe("ai_structured");
        expect(body.sourceUrl).toBe(aiPreview.sourceUrl);
        expect(body.importProof).toBe(aiPreview.importProof);
        savedRecipe = {
          summary: { id: "r1", userId: "owner", title: body.title, visibility: "private", sourceType: "ai_structured", servings: 2, finishedWeightGrams: null, user: { id: "owner", username: "owner" }, nutrition: { total: { macros: { kcal: 46, netCarbs: 3 } }, perServing: null, per100g: null } },
          detail: { id: "r1", userId: "owner", title: body.title, description: "", instructions: body.instructions, servings: 2, finishedWeightGrams: null, visibility: "private", sourceType: "ai_structured", sourceUrl: aiPreview.sourceUrl, user: { id: "owner", username: "owner" }, ingredients: [{ id: "i1", foodId: "spinach", quantityGrams: 200, food }], nutrition: { total: { macros: { kcal: 46, fat: 0.8, protein: 5.8, carbs: 7.2, fiber: 4.4, netCarbs: 2.8 }, nutrients: {} }, perServing: null, per100g: null } }
        };
        return new Response(JSON.stringify({ recipe: { id: "r1" } }), { status: 201 });
      }
      if (method === "GET" && url.pathname === "/recipes/r1") {
        return new Response(JSON.stringify({ recipe: savedRecipe.detail }), { status: 200 });
      }
      throw new Error(`Unexpected request: ${method} ${url.pathname}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<RecipeBuilder lang="en" state={state} currentUserId="owner" onMealAdded={vi.fn()}/>);

    // Library (empty) -> New recipe
    await waitFor(() => expect(screen.getByText("No recipes to show yet.")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /New recipe/i }));

    // URL import with no schema.org data on the page -> AI fallback preview
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/no-jsonld" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(await screen.findByText(/extracted by AI from the page/)).toBeTruthy();

    // Ingredient already resolved to a trusted Food by the same resolution pipeline used for schema.org imports.
    expect(screen.getByText(/200 g spinach/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Save/i }) as HTMLButtonElement).disabled).toBe(false);

    // Save
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));

    // -> Library reflects the newly saved recipe
    await waitFor(() => expect(screen.getByText("AI Spinach Bowl")).toBeTruthy());

    // -> Open detail: shows URL attribution AND that it was AI-extracted (not mislabeled as schema.org)
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "AI Spinach Bowl" })).toBeTruthy());
    expect(screen.getByText("example.com")).toBeTruthy();
    expect(screen.getByText(/AI-extracted/)).toBeTruthy();
  });
});

describe("regression: URL import with valid schema.org data never shows the AI notice", () => {
  it("keeps the existing deterministic preview path visually unchanged", async () => {
    const schemaOrgPreview = { title: "Classic Spinach Bowl", sourceUrl: "https://example.com/classic", servings: 2, instructions: ["Cook"], extractionMethod: "schema_org_json_ld", importProof: "proof", ingredients: aiPreview.ingredients };
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === "/recipes") return new Response(JSON.stringify({ recipes: [] }), { status: 200 });
      if (url.pathname === "/recipes/import-url/preview") return new Response(JSON.stringify({ preview: schemaOrgPreview }), { status: 200 });
      throw new Error(`Unexpected request: ${url.pathname}`);
    }));

    render(<RecipeBuilder lang="en" state={state} currentUserId="owner" onMealAdded={vi.fn()}/>);
    await waitFor(() => expect(screen.getByText("No recipes to show yet.")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /New recipe/i }));
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/classic" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await screen.findByText("Classic Spinach Bowl");
    expect(screen.queryByText(/extracted by AI from the page/)).toBeNull();
  });
});
