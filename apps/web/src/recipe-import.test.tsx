// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecipeBuilder } from "./RecipeBuilder";

afterEach(() => vi.restoreAllMocks());

const food = { id: "spinach", name: "Spinach", kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9, carbsPer100g: 3.6, fiberPer100g: 2.2 };
const state = { token: "token", setToken: vi.fn() };
const renderBuilder = () => render(<RecipeBuilder lang="en" state={state} currentUserId="user" onMealAdded={vi.fn()}/>);

describe("recipe URL import UI", () => {
  it("shows loading, prevents double submit, and renders a resolved preview", async () => {
    let finish!: (value: Response) => void;
    let previewCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/recipes?") && !url.includes("preview")) return new Response(JSON.stringify({ recipes: [] }), { status: 200 });
      if (url.endsWith("/recipes/import-url/preview")) { previewCalls += 1; return new Promise<Response>((resolve) => { finish = resolve; }); }
      throw new Error(`Unexpected request ${url}`);
    }));
    renderBuilder(); fireEvent.click(screen.getByRole("button", { name: /Új recept/i }));
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/recipe" } });
    const button = screen.getByRole("button", { name: "Preview" }); fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(previewCalls).toBe(1)); expect((screen.getByRole("button", { name: "Loading…" }) as HTMLButtonElement).disabled).toBe(true);
    finish(new Response(JSON.stringify({ preview: { title: "Spinach", sourceUrl: "https://example.com/recipe", servings: 2, instructions: ["Mix"], extractionMethod: "schema_org_json_ld", ingredients: [{ originalText: "200 g spinach", parsedQuantity: 200, parsedUnit: "g", parsedFoodQuery: "spinach", resolution: "resolved", selectedFood: food, candidates: [food], quantity: { status: "resolved", grams: 200, requiresConfirmation: false }, canConfirm: true }] } }), { status: 200 }));
    expect(await screen.findByText(/200 g spinach/)).toBeTruthy(); expect(screen.getByText("Mix")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Mentés/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("renders unresolved ingredients and blocks save", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/recipes?") && !url.includes("preview")) return new Response(JSON.stringify({ recipes: [] }), { status: 200 });
      if (url.endsWith("/recipes/import-url/preview")) return new Response(JSON.stringify({ preview: { title: "Mystery", sourceUrl: "https://example.com/r", instructions: [], extractionMethod: "schema_org_json_ld", ingredients: [{ originalText: "1 mysteryfruit", parsedQuantity: 1, parsedUnit: "piece", parsedFoodQuery: "mysteryfruit", resolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false }] } }), { status: 200 });
      throw new Error(`Unexpected request ${url}`);
    }));
    renderBuilder(); fireEvent.click(screen.getByRole("button", { name: /Új recept/i }));
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/r" } }); fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(await screen.findByText((_text, element) => element?.tagName === "LI" && element.textContent?.includes("Unresolved") === true)).toBeTruthy(); expect((screen.getByRole("button", { name: /Mentés/i }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Review ingredient" }));
    expect(screen.getByLabelText("Review ingredient")).toBeTruthy();
  });
});
