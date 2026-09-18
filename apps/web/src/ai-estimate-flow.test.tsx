// @vitest-environment jsdom
// FINAL FALLBACK: AI-ESTIMATED NUTRITION — frontend integration (2026-09-18).
// Exercises the real App component end-to-end against a stubbed fetch, the
// same pattern dynamic-food-resolution-confirm.test.tsx already established
// for external-candidate confirmation — proves the accept/override payloads
// actually reach POST /meals shaped exactly as apps/api's
// aiEstimateMealItemSchema / manualMealItemSchema require, not just that the
// UI renders in isolation.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const user = { id: "u1", username: "alice", locale: "en", profile };
const emptyWeek = { weekStart: "2026-01-01", weekEnd: "2026-01-07", days: [], summary: { mealCount: 0, loggedDays: 0 } };
const emptyTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };

const aiEstimate = {
  canonicalFoodName: "Yeast extract spread", localizedFoodName: "Vegemite", basisGrams: 100,
  kcalPer100g: 180, proteinPer100g: 24, fatPer100g: 1, carbsPer100g: 14, fiberPer100g: 3,
  confidence: "low", assumptions: "Assumed a typical savory yeast extract spread similar to Vegemite.",
  identityConfidence: "high", requestedIdentity: "Vegemite", canonicalIdentity: "yeast extract spread",
  proof: "signed.proof.token"
};

function baseRoutes(onMealsPost: (body: any) => void) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/me") return new Response(JSON.stringify({ user }), { status: 200 });
    if (url.pathname === "/meals/week") return new Response(JSON.stringify(emptyWeek), { status: 200 });
    if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: url.searchParams.get("date"), meals: [], totals: emptyTotals }), { status: 200 });
    if (url.pathname === "/meals" && init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      onMealsPost(body);
      return new Response(JSON.stringify({ meal: { id: "meal-1", title: body.title, eatenAt: new Date().toISOString(), totals: emptyTotals } }), { status: 201 });
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  };
}

describe("AI nutrition estimate — accept flow", () => {
  it("clicking Accept sends exactly the aiEstimateMealItemSchema shape — proof, identity and numbers echoed verbatim, plus the chosen quantity", async () => {
    const posts: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/meal-input/interpret") {
        return new Response(JSON.stringify({
          input: "Vegemite", parsed: { foodQuery: "Vegemite" }, foodResolution: "ai_estimate_pending",
          selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
          interpretationSource: "deterministic", aiEstimate
        }), { status: 200 });
      }
      return baseRoutes((body) => posts.push(body))(input, init);
    }));
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Daily overview")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText("For example: 5 eggs"), { target: { value: "Vegemite" } });
    fireEvent.click(screen.getByText("Interpret"));

    await waitFor(() => expect(screen.getByText("AI estimate")).toBeTruthy());
    expect(screen.getByText("AI estimate — not an authoritative nutrition source")).toBeTruthy();

    fireEvent.click(screen.getByText("Accept"));

    await waitFor(() => expect(posts.length).toBe(1));
    expect(posts[0].items).toEqual([{
      aiEstimateProof: "signed.proof.token", requestedIdentity: "Vegemite", canonicalFoodName: "Yeast extract spread",
      kcalPer100g: 180, proteinPer100g: 24, fatPer100g: 1, carbsPer100g: 14, fiberPer100g: 3, quantityGrams: 100
    }]);
    // The interpretation preview is cleared and the meal is treated as logged.
    await waitFor(() => expect(screen.queryByText("AI estimate")).toBeNull());
    expect(screen.getByText("Meal saved and daily totals updated.")).toBeTruthy();
  });

  it("an expired/invalid proof surfaces a clear, recoverable error — never a raw backend error string", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/meal-input/interpret") {
        return new Response(JSON.stringify({
          input: "Vegemite", parsed: { foodQuery: "Vegemite" }, foodResolution: "ai_estimate_pending",
          selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
          interpretationSource: "deterministic", aiEstimate
        }), { status: 200 });
      }
      if (url.pathname === "/meals" && init?.method === "POST") {
        return new Response(JSON.stringify({ error: "invalid_ai_estimate_proof" }), { status: 400 });
      }
      return baseRoutes(() => {})(input, init);
    }));
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Daily overview")).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText("For example: 5 eggs"), { target: { value: "Vegemite" } });
    fireEvent.click(screen.getByText("Interpret"));
    await waitFor(() => expect(screen.getByText("AI estimate")).toBeTruthy());
    fireEvent.click(screen.getByText("Accept"));
    await waitFor(() => expect(screen.getByText("This AI estimate has expired or changed. Request a new estimate and try again.")).toBeTruthy());
    // Recoverable: the card is still there, nothing was silently discarded.
    expect(screen.getByText("AI estimate")).toBeTruthy();
    expect(screen.queryByText("undefined")).toBeNull();
    expect(screen.queryByText(/invalid_ai_estimate_proof/)).toBeNull();
  });
});

describe("AI nutrition estimate — override flow", () => {
  it("editing values and saving sends the manualMealItemSchema shape (source: user_input, no proof) with the EDITED numbers", async () => {
    const posts: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/meal-input/interpret") {
        return new Response(JSON.stringify({
          input: "Vegemite", parsed: { foodQuery: "Vegemite" }, foodResolution: "ai_estimate_pending",
          selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
          interpretationSource: "deterministic", aiEstimate
        }), { status: 200 });
      }
      return baseRoutes((body) => posts.push(body))(input, init);
    }));
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Daily overview")).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText("For example: 5 eggs"), { target: { value: "Vegemite" } });
    fireEvent.click(screen.getByText("Interpret"));
    await waitFor(() => expect(screen.getByText("AI estimate")).toBeTruthy());

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByLabelText(/^kcal/), { target: { value: "160" } });
    fireEvent.click(screen.getByText("Save edited values"));

    await waitFor(() => expect(posts.length).toBe(1));
    expect(posts[0].items).toEqual([{
      foodName: "Vegemite", quantityGrams: 100, source: "user_input",
      kcalPer100g: 160, proteinPer100g: 24, fatPer100g: 1, carbsPer100g: 14, fiberPer100g: 3
    }]);
    // Never resubmits the proof once the user has corrected the numbers.
    expect(posts[0].items[0]).not.toHaveProperty("aiEstimateProof");
  });
});

describe("AI nutrition estimate — multi-item safety", () => {
  it("a resolved item and an ai_estimate_pending item can coexist; 'Log all' stays disabled and never submits the unconfirmed estimate", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      if (url.pathname === "/meal-input/interpret") {
        return new Response(JSON.stringify({
          input: "chicken breast, Vegemite", parsed: { foodQuery: "chicken breast, Vegemite" },
          foodResolution: "multi", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0,
          interpretationSource: "ai_assisted",
          items: [
            {
              parsed: { foodQuery: "chicken breast", quantity: 100, unit: "g" },
              selectedFood: { name: "Chicken breast", id: "food-1" }, candidates: [], quantity: { status: "resolved", grams: 100, estimated: false },
              canConfirm: true, confidence: 1, foodResolution: "resolved", nutritionEligible: true
            },
            {
              parsed: { foodQuery: "Vegemite" }, selectedFood: null, candidates: [], quantity: null,
              canConfirm: false, confidence: 0, foodResolution: "ai_estimate_pending", aiEstimate
            }
          ]
        }), { status: 200 });
      }
      if (url.pathname === "/meals" && init?.method === "POST") {
        throw new Error("POST /meals must never be called for the whole batch while an item is unconfirmed");
      }
      return baseRoutes(() => {})(input, init);
    }));
    render(<App/>);
    await waitFor(() => expect(screen.getByText("Daily overview")).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText("For example: 5 eggs"), { target: { value: "chicken breast, Vegemite" } });
    fireEvent.click(screen.getByText("Interpret"));

    await waitFor(() => expect(screen.getByText("AI estimate")).toBeTruthy());
    expect(screen.getByText("Linked to trusted food data")).toBeTruthy();
    const logAllButton = screen.getByRole("button", { name: "Log all" }) as HTMLButtonElement;
    expect(logAllButton.disabled).toBe(true);
    fireEvent.click(logAllButton);
    // Disabled buttons don't fire onClick in jsdom either way, but this also
    // proves no request was attempted (the stub above throws if it is).
    await waitFor(() => expect(screen.getByText("AI estimate")).toBeTruthy());
  });
});
