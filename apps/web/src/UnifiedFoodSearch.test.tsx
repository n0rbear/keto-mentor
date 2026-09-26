// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UnifiedFoodSearch, isBarcodeInput, wantsMeaningSearch } from "./UnifiedFoodSearch";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const state = { token: "token", setToken: vi.fn() };
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

function stub(handler: (url: URL) => Response) {
  const urls: URL[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => { const url = new URL(String(input)); urls.push(url); return handler(url); }));
  return urls;
}

describe("one search field (roadmap G2)", () => {
  it("recognizes barcodes (8-14 digits, spaces allowed) and nothing else", () => {
    expect(isBarcodeInput("5997523111307")).toBe(true);
    expect(isBarcodeInput("5997 5231 1130 7")).toBe(true);
    expect(isBarcodeInput("2 tojás")).toBe(false);
    expect(isBarcodeInput("1234567")).toBe(false);
  });

  it("typing lists own recipes, reference dishes and ingredients together; picking returns the choice", async () => {
    const urls = stub(() => ok({ kind: "results", query: "pörkölt", meaning: { tried: false, terms: [] }, items: [
      { type: "recipe", recipeId: "own1", title: "A legfinomabb pörkölt", source: "own", servings: 4, servingGrams: 400 },
      { type: "recipe", recipeId: "ref1", title: "Sertéspörkölt nokedlivel", source: "reference", servings: 1, servingGrams: 500 },
      { type: "food", via: "name", food: { id: "f1", name: "Schwein Gulasch", names: { hu: "sertésgulyás" }, kcalPer100g: 1, fatPer100g: 1, proteinPer100g: 1, carbsPer100g: 1, fiberPer100g: 0, match: { stage: "exact", score: 100 } } }
    ] }));
    const onPickRecipe = vi.fn(); const onPickFood = vi.fn();
    render(<UnifiedFoodSearch lang="hu" state={state} value="pörkölt" onPickFood={onPickFood} onPickRecipe={onPickRecipe}/>);
    expect(await screen.findByText("A legfinomabb pörkölt")).toBeTruthy();
    expect(screen.getByText(/Ételadatbázis · 1 adag ≈ 500 g/)).toBeTruthy();
    fireEvent.click(screen.getByText("Sertéspörkölt nokedlivel"));
    expect(onPickRecipe).toHaveBeenCalledWith({ recipeId: "ref1", title: "Sertéspörkölt nokedlivel", source: "reference", servings: 1, servingGrams: 500 });
    expect(urls.every((u) => u.searchParams.get("meaning") !== "1")).toBe(true);
  });

  it("a spoken amount travels with the picked food ('négy tojás' -> 4 egg servings)", async () => {
    stub(() => ok({ kind: "results", query: "Tojásrántotta négy tojásból.", meaning: { tried: false, terms: [] }, quantity: { quantity: 4, unit: "piece" }, items: [
      { type: "food", via: "name", amount: { quantity: 4, servingId: "egg-piece", grams: 200 }, food: { id: "egg", name: "Egg", names: { hu: "Tojás" }, kcalPer100g: 1, fatPer100g: 1, proteinPer100g: 1, carbsPer100g: 1, fiberPer100g: 0, match: { stage: "exact", score: 100 } } }
    ] }));
    const onPickFood = vi.fn();
    render(<UnifiedFoodSearch lang="hu" state={state} value="Tojásrántotta négy tojásból." onPickFood={onPickFood} onPickRecipe={vi.fn()}/>);
    expect(await screen.findByText(/Alapanyag · 200 g/)).toBeTruthy();
    fireEvent.click(screen.getByText("Tojás"));
    expect(onPickFood).toHaveBeenCalledWith(expect.objectContaining({ id: "egg" }), { quantity: 4, servingId: "egg-piece", grams: 200 });
  });

  it("a name miss triggers one meaning-based search and marks what it found", async () => {
    const urls = stub((url) => url.searchParams.get("meaning") === "1"
      ? ok({ kind: "results", query: "virsli", meaning: { tried: true, terms: ["frankfurter"] }, items: [{ type: "food", via: "meaning", food: { id: "w1", name: "Wiener Würstchen", names: { hu: "virsli" }, kcalPer100g: 1, fatPer100g: 1, proteinPer100g: 1, carbsPer100g: 1, fiberPer100g: 0 } }] })
      : ok({ kind: "results", query: "virsli", meaning: { tried: false, terms: [] }, items: [] }));
    const onPickFood = vi.fn();
    render(<UnifiedFoodSearch lang="hu" state={state} value="virsli" onPickFood={onPickFood} onPickRecipe={vi.fn()}/>);
    expect(await screen.findByText(/jelentés szerint/, {}, { timeout: 3000 })).toBeTruthy();
    fireEvent.click(screen.getByText("virsli"));
    expect(onPickFood).toHaveBeenCalledWith(expect.objectContaining({ id: "w1" }), undefined);
    expect(urls.filter((u) => u.searchParams.get("meaning") === "1")).toHaveLength(1);
  });

  it("spends the meaning search only on a finished-looking word, and not while still typing", async () => {
    expect(wantsMeaningSearch("1 t")).toBe(false);
    expect(wantsMeaningSearch("1 tá")).toBe(false);
    expect(wantsMeaningSearch("Rántotta 3")).toBe(false);
    expect(wantsMeaningSearch("1 tányér")).toBe(true);
    const urls = stub(() => ok({ kind: "results", query: "", meaning: { tried: false, terms: [] }, items: [] }));
    const view = render(<UnifiedFoodSearch lang="hu" state={state} value="virs" onPickFood={vi.fn()} onPickRecipe={vi.fn()}/>);
    await new Promise((resolve) => setTimeout(resolve, 500));
    view.rerender(<UnifiedFoodSearch lang="hu" state={state} value="virsli" onPickFood={vi.fn()} onPickRecipe={vi.fn()}/>);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(urls.filter((u) => u.searchParams.get("meaning") === "1").map((u) => u.searchParams.get("q"))).toEqual(["virsli"]);
  });

  it("never searches for a barcode or while interpreting", async () => {
    const urls = stub(() => ok({ kind: "results", query: "", meaning: { tried: false, terms: [] }, items: [] }));
    render(<UnifiedFoodSearch lang="en" state={state} value="5997523111307" onPickFood={vi.fn()} onPickRecipe={vi.fn()}/>);
    render(<UnifiedFoodSearch lang="en" state={state} value="gulyás" disabled onPickFood={vi.fn()} onPickRecipe={vi.fn()}/>);
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(urls).toHaveLength(0);
  });
});
