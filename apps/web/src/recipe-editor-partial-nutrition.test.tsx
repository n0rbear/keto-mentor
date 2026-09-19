// @vitest-environment jsdom
// Live staging finding (2026-09-19, mindmegette "citromos pöfeteg keksz"): with
// 3 of 9 ingredients unresolved, the sum of only the 6 RESOLVED rows was
// labeled "Teljes recept" (and scaled per serving / per 100 g) — a partial
// number presented as the complete recipe's nutrition.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecipeBuilder } from "./RecipeBuilder";
import { dict } from "./i18n";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const state = { token: "token", setToken: vi.fn() };
const flour = { id: "flour", name: "Flour", kcalPer100g: 364, fatPer100g: 1, proteinPer100g: 10, carbsPer100g: 76, fiberPer100g: 3 };
const resolvedRow = (text: string) => ({ originalText: text, parsedQuantity: 100, parsedUnit: "g", parsedFoodQuery: "flour", resolution: "resolved", selectedFood: flour, candidates: [flour], quantity: { status: "resolved", grams: 100, requiresConfirmation: false }, canConfirm: true });
const unresolvedRow = (text: string) => ({ originalText: text, parsedFoodQuery: "citromhéj", resolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false });

function previewWith(ingredients: unknown[]) {
  return { title: "Citromos pöfeteg", sourceUrl: "https://example.com/r", servings: 6, instructions: ["Süsd meg."], extractionMethod: "schema_org", importProof: "p", ingredients };
}

async function openPreview(lang: "hu" | "en" | "de", preview: ReturnType<typeof previewWith>) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if ((init?.method ?? "GET") === "GET" && url.pathname === "/recipes") return new Response(JSON.stringify({ recipes: [] }), { status: 200 });
    if (init?.method === "POST" && url.pathname === "/recipes/import-url/preview") return new Response(JSON.stringify({ preview }), { status: 200 });
    throw new Error(`Unexpected request: ${url.pathname}`);
  }));
  const t = dict[lang];
  render(<RecipeBuilder lang={lang} state={state} currentUserId="owner" onMealAdded={vi.fn()}/>);
  await waitFor(() => expect(screen.getByText(t.recipes.emptyLibrary ?? /./)).toBeTruthy()).catch(() => undefined);
  fireEvent.click(await screen.findByRole("button", { name: lang === "hu" ? /Új recept/i : lang === "de" ? /Neues Rezept/i : /New recipe/i }));
  fireEvent.change(screen.getByLabelText(t.recipes.import.url), { target: { value: "https://example.com/r" } });
  fireEvent.click(screen.getByRole("button", { name: t.recipes.import.preview }));
  await screen.findByText("Citromos pöfeteg");
}

describe("RecipeEditor: partial nutrition is never presented as the whole recipe", () => {
  it("with unresolved required ingredients: honest subtotal label, completeness status, and NO per-serving / per-100g", async () => {
    await openPreview("en", previewWith([resolvedRow("100 g flour"), resolvedRow("200 g flour"), unresolvedRow("1 lemon zest")]));
    expect(screen.getByText("Resolved ingredients subtotal")).toBeTruthy();
    expect(screen.queryByText("Whole recipe")).toBeNull();
    expect(screen.queryByText("Per serving")).toBeNull();
    expect(screen.queryByText("Per 100 g")).toBeNull();
    const status = screen.getByTestId("partial-nutrition-status");
    expect(status.textContent).toContain("2 / 3 ingredients resolved");
    expect(status.textContent).toContain("1 ingredients still need review");
  });

  it("Hungarian wording matches the required copy", async () => {
    await openPreview("hu", previewWith([resolvedRow("100 g liszt"), unresolvedRow("1 citrom"), unresolvedRow("só")]));
    expect(screen.getByText("Feloldott összetevők részösszege")).toBeTruthy();
    expect(screen.queryByText("Teljes recept")).toBeNull();
    const status = screen.getByTestId("partial-nutrition-status");
    expect(status.textContent).toContain("1 / 3 összetevő feloldva");
    expect(status.textContent).toContain("2 összetevő még ellenőrzést igényel");
  });

  it("German wording", async () => {
    await openPreview("de", previewWith([resolvedRow("100 g Mehl"), unresolvedRow("Zitrone")]));
    expect(screen.getByText("Zwischensumme der aufgelösten Zutaten")).toBeTruthy();
    expect(screen.queryByText("Gesamtes Rezept")).toBeNull();
  });

  it("an omitted unresolved row does not count as required — recipe is complete again", async () => {
    await openPreview("en", previewWith([resolvedRow("100 g flour"), { ...unresolvedRow("1 lemon zest"), omitted: true }]));
    expect(screen.getByText("Whole recipe")).toBeTruthy();
    expect(screen.getByText("Per serving")).toBeTruthy();
    expect(screen.queryByTestId("partial-nutrition-status")).toBeNull();
  });

  it("with every required ingredient resolved: 'Whole recipe' + per-serving, no partial status", async () => {
    await openPreview("en", previewWith([resolvedRow("100 g flour"), resolvedRow("50 g flour")]));
    expect(screen.getByText("Whole recipe")).toBeTruthy();
    expect(screen.getByText("Per serving")).toBeTruthy();
    expect(screen.queryByText("Resolved ingredients subtotal")).toBeNull();
    expect(screen.queryByTestId("partial-nutrition-status")).toBeNull();
  });
});
