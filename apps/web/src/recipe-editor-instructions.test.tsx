// @vitest-environment jsdom
// Owner report a8c9ed (2026-10-14): typing recipe steps, neither the space nor
// Enter worked — the textarea was re-normalized on every keystroke.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RecipeEditor } from "./RecipeEditor";
import type { RecipeDetailData } from "./RecipeDetail";
import { dict } from "./i18n";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const state = { token: "token", setToken: vi.fn() };
const beans = { id: "beans", name: "Bab", kcalPer100g: 100, fatPer100g: 1, proteinPer100g: 7, carbsPer100g: 10, fiberPer100g: 5 };
const slice = { macros: { kcal: 100, fat: 1, protein: 7, carbs: 10, fiber: 5, netCarbs: 5 }, nutrients: [] };
const recipe: RecipeDetailData = { id: "r1", userId: "owner", title: "Babgulyás", visibility: "private", sourceType: "manual", user: { id: "owner", username: "owner" }, instructions: ["Áztasd be a babot."], ingredients: [{ id: "i1", foodId: "beans", quantityGrams: 300, food: beans } as any], nutrition: { total: slice, perServing: null, per100g: null } as any } as any;

describe("RecipeEditor: instructions textarea", () => {
  it("keeps a trailing space and a new empty line while typing, saves trimmed steps", async () => {
    const bodies: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ recipe: { id: "r1" } }), { status: 200 });
    }));
    const onSaved = vi.fn();
    render(<RecipeEditor lang="hu" state={state} editing={recipe} onSaved={onSaved} onCancel={vi.fn()}/>);
    const textarea = screen.getByLabelText(dict.hu.recipes.instructionsLabel) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Áztasd be a babot.");
    fireEvent.change(textarea, { target: { value: "Áztasd be a babot.\nFőzd " } });
    expect(textarea.value).toBe("Áztasd be a babot.\nFőzd ");
    fireEvent.change(textarea, { target: { value: "Áztasd be a babot.\nFőzd puhára.\n" } });
    expect(textarea.value).toBe("Áztasd be a babot.\nFőzd puhára.\n");
    fireEvent.change(textarea, { target: { value: "Áztasd be a babot.\n\n  Főzd puhára.  \n" } });
    fireEvent.click(screen.getByRole("button", { name: dict.hu.save }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(bodies[0].instructions).toEqual(["Áztasd be a babot.", "Főzd puhára."]);
  });
});
