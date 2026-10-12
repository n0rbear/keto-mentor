// @vitest-environment jsdom
// Owner decision 2026-10-12: own recipes carry a "Mély tányérban eszem"
// choice (servedIn), so "egy tányér babgulyás" uses the deep plate.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecipeEditor } from "./RecipeEditor";
import type { RecipeDetailData } from "./RecipeDetail";
import { dict } from "./i18n";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const state = { token: "token", setToken: vi.fn() };
const beans = { id: "beans", name: "Bab", kcalPer100g: 100, fatPer100g: 1, proteinPer100g: 7, carbsPer100g: 10, fiberPer100g: 5 };
const slice = { macros: { kcal: 100, fat: 1, protein: 7, carbs: 10, fiber: 5, netCarbs: 5 }, nutrients: [] };
function recipe(overrides: Partial<RecipeDetailData> = {}): RecipeDetailData {
  return { id: "r1", userId: "owner", title: "Babgulyás", visibility: "private", sourceType: "manual", user: { id: "owner", username: "owner" }, ingredients: [{ id: "i1", foodId: "beans", quantityGrams: 300, food: beans } as any], nutrition: { total: slice, perServing: null, per100g: null } as any, ...overrides };
}
function captureSaves() {
  const bodies: Array<{ method: string; path: string; body: any }> = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (init?.method === "PUT" || init?.method === "POST") {
      if (url.pathname === "/recipes/import-url/preview") return new Response(JSON.stringify({ preview: { title: "Babgulyás", sourceUrl: "https://example.com/r", instructions: [], extractionMethod: "schema_org", importProof: "p", ingredients: [{ originalText: "300 g bab", parsedFoodQuery: "bab", resolution: "resolved", selectedFood: beans, candidates: [beans], quantity: { status: "resolved", grams: 300, requiresConfirmation: false }, canConfirm: true }] } }), { status: 200 });
      bodies.push({ method: init.method, path: url.pathname, body: JSON.parse(String(init.body)) });
      return new Response(JSON.stringify({ recipe: { id: "r1" } }), { status: 200 });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  }));
  return bodies;
}

describe("RecipeEditor: served-in choice", () => {
  it.each(["hu", "de", "en"] as const)("shows flat (default) and deep options in %s", (lang) => {
    render(<RecipeEditor lang={lang} state={state} editing={null} onSaved={vi.fn()} onCancel={vi.fn()}/>);
    const t = dict[lang].recipes;
    expect((screen.getByLabelText(t.servedInFlatOption) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(t.servedInDeepOption) as HTMLInputElement).checked).toBe(false);
  });

  it("HU wording is 'Mély tányérban eszem'", () => {
    expect(dict.hu.recipes.servedInDeepOption).toBe("Mély tányérban eszem");
    expect(dict.de.recipes.servedInDeepOption).toBe("Wird im tiefen Teller gegessen");
    expect(dict.en.recipes.servedInDeepOption).toBe("Served in a deep plate");
  });

  it("create: saves the deep choice", async () => {
    const bodies = captureSaves();
    const onSaved = vi.fn();
    render(<RecipeEditor lang="hu" state={state} editing={null} onSaved={onSaved} onCancel={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText(dict.hu.recipes.import.url), { target: { value: "https://example.com/r" } });
    fireEvent.click(screen.getByRole("button", { name: dict.hu.recipes.import.preview }));
    await screen.findByText(/300 g bab/);
    fireEvent.change(screen.getByLabelText(dict.hu.recipes.titleLabel), { target: { value: "Babgulyás" } });
    fireEvent.click(screen.getByLabelText("Mély tányérban eszem"));
    fireEvent.click(screen.getByRole("button", { name: dict.hu.save }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({ method: "POST", path: "/recipes", body: { servedIn: "deep_plate" } });
  });

  it("edit: marks an existing own recipe deep", async () => {
    const bodies = captureSaves();
    const onSaved = vi.fn();
    render(<RecipeEditor lang="en" state={state} editing={recipe({ servedIn: null })} onSaved={onSaved} onCancel={vi.fn()}/>);
    expect((screen.getByLabelText("Served on a flat plate") as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByLabelText("Served in a deep plate"));
    fireEvent.click(screen.getByRole("button", { name: dict.en.save }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(bodies[0]).toMatchObject({ method: "PUT", path: "/recipes/r1", body: { servedIn: "deep_plate" } });
  });

  it("edit: a copy of a reference soup shows its deep value, can switch to flat, and an untouched save keeps it", async () => {
    const bodies = captureSaves();
    const onSaved = vi.fn();
    render(<RecipeEditor lang="de" state={state} editing={recipe({ servedIn: "deep_plate" })} onSaved={onSaved} onCancel={vi.fn()}/>);
    expect((screen.getByLabelText("Wird im tiefen Teller gegessen") as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: dict.de.save }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(bodies[0].body).not.toHaveProperty("servedIn");
    fireEvent.click(screen.getByLabelText("Wird vom flachen Teller gegessen"));
    fireEvent.click(screen.getByRole("button", { name: dict.de.save }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(2));
    expect(bodies[1].body).toMatchObject({ servedIn: "flat_plate" });
  });
});
