// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecipeBuilder } from "./RecipeBuilder";
import { combineRecipeIngredients, ingredientsFromImport } from "./RecipeEditor";
import type { ImportIngredientRow } from "./RecipeEditor";

afterEach(() => vi.restoreAllMocks());

const food = { id: "spinach", name: "Spinach", kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9, carbsPer100g: 3.6, fiberPer100g: 2.2 };
const state = { token: "token", setToken: vi.fn() };
const renderBuilder = () => render(<RecipeBuilder lang="en" state={state} currentUserId="user" onMealAdded={vi.fn()}/>);

describe("recipe URL import UI", () => {
  it("fills a reviewed middle row in source order and excludes only explicit omissions", () => {
    const row = (originalText: string, selectedFood: typeof food | null, omitted = false): ImportIngredientRow => ({ originalText, omitted, parsedFoodQuery: originalText, resolution: selectedFood ? "resolved" : "unresolved", selectedFood, candidates: selectedFood ? [selectedFood] : [], quantity: selectedFood ? { status: "resolved", grams: 100, requiresConfirmation: false } : null, canConfirm: !!selectedFood });
    const rows = [row("first", food), row("middle", null), row("third", { ...food, id: "egg", name: "Egg" })];
    rows[1] = row("middle", { ...food, id: "middle", name: "Middle" });
    expect(ingredientsFromImport(rows).map((item) => [item.originalText, item.sortOrder])).toEqual([["first", 0], ["middle", 1], ["third", 2]]);
    rows[1].omitted = true;
    expect(ingredientsFromImport(rows).map((item) => [item.originalText, item.sortOrder])).toEqual([["first", 0], ["third", 2]]);
    const manual = { foodId: "manual", quantityGrams: 50, food: { ...food, id: "manual", name: "Manual" } };
    expect(combineRecipeIngredients(rows, [manual]).map((item) => [item.originalText ?? item.food.name, item.sortOrder])).toEqual([["first", 0], ["third", 2], ["Manual", 3]]);
    expect(combineRecipeIngredients([], [{ ...manual, sortOrder: 0 }, { ...manual, foodId: "second", sortOrder: 2 }, { ...manual, foodId: "new", sortOrder: 2 }]).map((item) => item.sortOrder)).toEqual([0, 2, 3]);
  });
  it("shows loading, prevents double submit, and renders a resolved preview", async () => {
    let finish!: (value: Response) => void;
    let previewCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/recipes?") && !url.includes("preview")) return new Response(JSON.stringify({ recipes: [] }), { status: 200 });
      if (url.endsWith("/recipes/import-url/preview")) { previewCalls += 1; return new Promise<Response>((resolve) => { finish = resolve; }); }
      throw new Error(`Unexpected request ${url}`);
    }));
    renderBuilder(); fireEvent.click(screen.getByRole("button", { name: /New recipe/i }));
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/recipe" } });
    const button = screen.getByRole("button", { name: "Preview" }); fireEvent.click(button); fireEvent.click(button);
    await waitFor(() => expect(previewCalls).toBe(1)); expect((screen.getByRole("button", { name: "Loading…" }) as HTMLButtonElement).disabled).toBe(true);
    finish(new Response(JSON.stringify({ preview: { title: "Spinach", sourceUrl: "https://example.com/recipe", servings: 2, instructions: ["Mix"], extractionMethod: "schema_org_json_ld", ingredients: [{ originalText: "200 g spinach", parsedQuantity: 200, parsedUnit: "g", parsedFoodQuery: "spinach", resolution: "resolved", selectedFood: food, candidates: [food], quantity: { status: "resolved", grams: 200, requiresConfirmation: false }, canConfirm: true }] } }), { status: 200 }));
    expect(await screen.findByText(/200 g spinach/)).toBeTruthy(); expect(screen.getAllByText("Mix")).toHaveLength(2);
    expect((screen.getByRole("button", { name: /Save/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("renders unresolved ingredients and blocks save", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/recipes?") && !url.includes("preview")) return new Response(JSON.stringify({ recipes: [] }), { status: 200 });
      if (url.endsWith("/recipes/import-url/preview")) return new Response(JSON.stringify({ preview: { title: "Mystery", sourceUrl: "https://example.com/r", instructions: [], extractionMethod: "schema_org_json_ld", ingredients: [{ originalText: "1 mysteryfruit", parsedQuantity: 1, parsedUnit: "piece", parsedFoodQuery: "mysteryfruit", resolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false }] } }), { status: 200 });
      throw new Error(`Unexpected request ${url}`);
    }));
    renderBuilder(); fireEvent.click(screen.getByRole("button", { name: /New recipe/i }));
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/r" } }); fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(await screen.findByText((_text, element) => element?.tagName === "LI" && element.textContent?.includes("Unresolved") === true)).toBeTruthy(); expect((screen.getByRole("button", { name: /Save/i }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Review ingredient" }));
    expect(screen.getByLabelText("Review ingredient")).toBeTruthy();
  });
});

const aiPreview = { title: "AI Spinach Bowl", sourceUrl: "https://example.com/no-jsonld", servings: 2, instructions: ["Cook spinach", "Fry eggs"], extractionMethod: "ai_structured", importProof: "proof.mac", ingredients: [{ originalText: "200 g spinach", parsedQuantity: 200, parsedUnit: "g", parsedFoodQuery: "spinach", resolution: "resolved", selectedFood: food, candidates: [food], quantity: { status: "resolved", grams: 200, requiresConfirmation: false }, canConfirm: true }] };

function stubPreviewThenSave(previewResponse: Response, opts: { onSave?: (body: any) => void } = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    if (url.includes("/recipes?") && !url.includes("preview") && method === "GET") return new Response(JSON.stringify({ recipes: [] }), { status: 200 });
    if (url.endsWith("/recipes/import-url/preview")) return previewResponse;
    if (url.endsWith("/recipes") && method === "POST") {
      const body = JSON.parse(String(init?.body));
      opts.onSave?.(body);
      return new Response(JSON.stringify({ recipe: { id: "r1" } }), { status: 201 });
    }
    throw new Error(`Unexpected request: ${method} ${url}`);
  });
}

describe("AI fallback import UI", () => {
  it("renders the AI extraction notice and source attribution, with editable title and instructions", async () => {
    vi.stubGlobal("fetch", stubPreviewThenSave(new Response(JSON.stringify({ preview: aiPreview }), { status: 200 })));
    renderBuilder(); fireEvent.click(screen.getByRole("button", { name: /New recipe/i }));
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/no-jsonld" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(await screen.findByText(/extracted by AI from the page/)).toBeTruthy();

    const titleInput = screen.getByLabelText("Recipe name") as HTMLInputElement;
    expect(titleInput.value).toBe("AI Spinach Bowl");
    fireEvent.change(titleInput, { target: { value: "Edited AI Bowl" } });
    expect(titleInput.value).toBe("Edited AI Bowl");

    const instructionsField = screen.getByLabelText("Instructions") as HTMLTextAreaElement;
    expect(instructionsField.value).toContain("Cook spinach");
    fireEvent.change(instructionsField, { target: { value: "Cook spinach\nFry eggs\nServe warm" } });
    expect(instructionsField.value).toContain("Serve warm");
  });

  it("does NOT show the AI extraction notice for a schema.org preview (regression)", async () => {
    const schemaOrgPreview = { ...aiPreview, extractionMethod: "schema_org_json_ld" };
    vi.stubGlobal("fetch", stubPreviewThenSave(new Response(JSON.stringify({ preview: schemaOrgPreview }), { status: 200 })));
    renderBuilder(); fireEvent.click(screen.getByRole("button", { name: /New recipe/i }));
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/recipe" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await screen.findByText("AI Spinach Bowl");
    expect(screen.queryByText(/extracted by AI from the page/)).toBeNull();
  });

  it("saves an AI-extracted recipe with sourceType=ai_structured and the matching import proof", async () => {
    let savedBody: any;
    vi.stubGlobal("fetch", stubPreviewThenSave(new Response(JSON.stringify({ preview: aiPreview }), { status: 200 }), { onSave: (body) => { savedBody = body; } }));
    renderBuilder(); fireEvent.click(screen.getByRole("button", { name: /New recipe/i }));
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/no-jsonld" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    await screen.findByText("AI Spinach Bowl");
    fireEvent.click(screen.getByRole("button", { name: /Save/i }));
    await waitFor(() => expect(savedBody).toBeTruthy());
    expect(savedBody.sourceType).toBe("ai_structured");
    expect(savedBody.sourceUrl).toBe(aiPreview.sourceUrl);
    expect(savedBody.importProof).toBe(aiPreview.importProof);
  });

  it.each([
    ["recipe_ai_unavailable", "Automatic extraction is currently unavailable"],
    ["recipe_ai_timeout", "Automatic extraction took too long"],
    ["recipe_ai_invalid_output", "Automatic extraction didn't produce a usable result"]
  ])("shows a localized error for %s", async (code, expectedText) => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/recipes?")) return new Response(JSON.stringify({ recipes: [] }), { status: 200 });
      if (url.endsWith("/recipes/import-url/preview")) return new Response(JSON.stringify({ error: code }), { status: 502 });
      throw new Error(`Unexpected request ${url}`);
    }));
    renderBuilder(); fireEvent.click(screen.getByRole("button", { name: /New recipe/i }));
    fireEvent.change(screen.getByLabelText("Public recipe URL"), { target: { value: "https://example.com/r" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(await screen.findByText(new RegExp(expectedText))).toBeTruthy();
  });

  it.each(["hu", "de", "en"] as const)("renders the AI extraction notice localized: %s", async (lang) => {
    vi.stubGlobal("fetch", stubPreviewThenSave(new Response(JSON.stringify({ preview: aiPreview }), { status: 200 })));
    render(<RecipeBuilder lang={lang} state={state} currentUserId="user" onMealAdded={vi.fn()}/>);
    const newRecipeLabel = { hu: /Új recept/i, de: /Neues Rezept/i, en: /New recipe/i }[lang];
    fireEvent.click(screen.getByRole("button", { name: newRecipeLabel }));
    const urlLabel = { hu: "Nyilvános recept URL", de: "Öffentliche Rezept-URL", en: "Public recipe URL" }[lang];
    fireEvent.change(screen.getByLabelText(urlLabel), { target: { value: "https://example.com/no-jsonld" } });
    const previewLabel = { hu: "Előnézet", de: "Vorschau", en: "Preview" }[lang];
    fireEvent.click(screen.getByRole("button", { name: previewLabel }));
    const expectedNotice = {
      hu: "A recept adatait AI nyerte ki az oldalról",
      de: "wurden von der KI aus der Seite extrahiert",
      en: "extracted by AI from the page"
    }[lang];
    expect(await screen.findByText(new RegExp(expectedNotice))).toBeTruthy();
  });
});
