// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "./main";

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
beforeEach(() => localStorage.setItem("km_token", "test-token"));

const profile = { onboardingDone: true, dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
const emptyWeek = { weekStart: "2026-01-01", weekEnd: "2026-01-07", days: [], summary: { mealCount: 0, loggedDays: 0 } };
const emptyTotals = { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 };
const nutrition = { kcalPer100g: 300, fatPer100g: 25, proteinPer100g: 15, carbsPer100g: 1, fiberPer100g: 0 };

const egg = { id: "catalog-egg", name: "Egg", names: { hu: "Tojás", de: "Ei", en: "Egg" }, servings: [{ id: "egg", key: "egg", unit: "egg", labels: { hu: "tojás" }, grams: 50, isEstimated: false, confidence: 1 }], ...nutrition };
const rawEgg = { id: "bls-E111100", name: "Hühnerei roh", names: { hu: "tyúktojás (nyers)", de: "Hühnerei roh", en: "chicken egg, raw" }, servings: [], ...nutrition };
const blsBacon = { id: "bls-W415000", name: "Schwein Frühstücksspeck, Rohpökelware, geräuchert", names: { hu: "bacon", de: "Frühstücksspeck", en: "bacon" }, servings: [], ...nutrition };
const usdaBacon = { id: "usda-168277", name: "Pork, cured, bacon, unprepared", names: { hu: "szalonna, pácolt, nyers", en: "Pork, cured, bacon, unprepared" }, servings: [], ...nutrition };
const gouda = { id: "catalog-gouda", name: "Gouda cheese", names: { hu: "Gouda sajt", de: "Gouda", en: "Gouda cheese" }, servings: [{ id: "gouda-slice", key: "slice", unit: "slice", labels: { hu: "szelet" }, grams: 28.35, isEstimated: true, confidence: 0.7 }], ...nutrition };
const generic = (grams: number, key: string, unit: string) => ({ status: "resolved", grams, gramsPerUnit: grams, method: "curated", confidence: 0.8, estimated: true, requiresConfirmation: false, provenance: { method: "generic_unit_weight", key, unit } });

// Shape of the production response for owner report dc9bcf (reproduced
// against the production catalog rows for these words, 2026-10-15).
const interpretation = {
  input: "Egy darab főtt tojás, három szelet bacon, két szelet gouda sajt.", parsed: { foodQuery: "tojás", quantity: 1, unit: "piece" },
  foodResolution: "multi", selectedFood: egg, candidates: [egg, rawEgg], quantity: null, canConfirm: false, confidence: 0.9, interpretationSource: "ai_assisted",
  items: [
    { input: "Egy darab főtt tojás", parsed: { foodQuery: "tojás", quantity: 1, unit: "piece", preparation: "boiled" }, preparation: "boiled", preparationUnavailable: true,
      foodResolution: "confirmation_required", selectedFood: egg, candidates: [egg, rawEgg], canConfirm: false, confidence: 0.9, interpretationSource: "ai_assisted", nutritionEligible: false,
      quantity: { status: "resolved", grams: 50, gramsPerUnit: 50, servingId: "egg", method: "authoritative", confidence: 1, estimated: false, requiresConfirmation: false },
      candidateQuantities: { "catalog-egg": { status: "resolved", grams: 50, gramsPerUnit: 50, servingId: "egg", method: "authoritative", confidence: 1, estimated: false, requiresConfirmation: false }, "bls-E111100": generic(50, "egg", "piece") } },
    { input: "három szelet bacon", parsed: { foodQuery: "bacon", quantity: 3, unit: "slice" }, ambiguous: true,
      foodResolution: "confirmation_required", selectedFood: usdaBacon, candidates: [usdaBacon, blsBacon], canConfirm: false, confidence: 0.9, interpretationSource: "ai_assisted", nutritionEligible: false,
      quantity: generic(30, "bacon", "slice"),
      candidateQuantities: { "usda-168277": generic(30, "bacon", "slice"), "bls-W415000": generic(30, "bacon", "slice") } },
    { input: "két szelet gouda sajt", parsed: { foodQuery: "gouda sajt", quantity: 2, unit: "slice" },
      foodResolution: "resolved", selectedFood: gouda, candidates: [gouda], canConfirm: true, confidence: 0.9, interpretationSource: "ai_assisted", nutritionEligible: true,
      quantity: { status: "resolved", grams: 56.7, gramsPerUnit: 28.35, servingId: "gouda-slice", method: "estimated", confidence: 0.7, estimated: true, requiresConfirmation: false } }
  ]
};

function stubFetch(body: unknown) {
  const posted: any[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === "/me") return new Response(JSON.stringify({ user: { id: "u1", username: "owner", locale: "hu", profile } }), { status: 200 });
    if (url.pathname === "/meals/week") return new Response(JSON.stringify(emptyWeek), { status: 200 });
    if (url.pathname === "/meals/today") return new Response(JSON.stringify({ date: url.searchParams.get("date"), meals: [], totals: emptyTotals }), { status: 200 });
    if (url.pathname === "/meal-input/interpret") return new Response(JSON.stringify(body), { status: 200 });
    if (url.pathname === "/meals" && init?.method === "POST") { posted.push(JSON.parse(String(init.body))); return new Response(JSON.stringify({ id: "m1" }), { status: 201 }); }
    throw new Error(`Unexpected request: ${url.pathname}`);
  }));
  return posted;
}

async function interpret(text: string) {
  render(<App/>);
  await waitFor(() => expect(screen.getByText("Napi áttekintés")).toBeTruthy());
  fireEvent.change(screen.getByPlaceholderText("Például: 5 tojás"), { target: { value: text } });
  fireEvent.click(screen.getByText("Értelmezés"));
}

describe("picking a candidate keeps its unit weight (owner report dc9bcf)", () => {
  it("1 db főtt tojás and 3 szelet bacon are logged without asking for grams", async () => {
    const posted = stubFetch(interpretation);
    await interpret(interpretation.input);
    await waitFor(() => expect(screen.getAllByText("Ez az").length).toBe(4));

    fireEvent.click(screen.getAllByText("Ez az")[0]); // Tojás
    expect(screen.queryByText("Mennyit ettél belőle?")).toBeNull();
    expect(screen.queryByText("Hány grammot ettél belőle?")).toBeNull();
    fireEvent.click(screen.getAllByText("Ez az")[1]); // bacon (BLS Frühstücksspeck)
    expect(screen.queryByText("Mennyit ettél belőle?")).toBeNull();
    expect(screen.queryByText("Hány grammot ettél belőle?")).toBeNull();

    const logAll = screen.getByText("Összes naplózása") as HTMLButtonElement;
    expect(logAll.disabled).toBe(false);
    fireEvent.click(logAll);
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].items).toEqual([
      { foodId: "catalog-egg", quantity: 1, unit: "serving", servingId: "egg" },
      { foodId: "bls-W415000", quantity: 30, unit: "g", quantityConfirmation: { method: "estimated", accepted: true, grams: 30 } },
      { foodId: "catalog-gouda", quantity: 2, unit: "serving", servingId: "gouda-slice" }
    ]);
  });

  it("a typical-weight item resolved by the server is logged as estimated grams", async () => {
    const bacon = { ...interpretation.items[1], ambiguous: false, foodResolution: "resolved", canConfirm: true, nutritionEligible: true, selectedFood: blsBacon, candidates: [blsBacon], candidateQuantities: undefined };
    const posted = stubFetch({ ...interpretation, canConfirm: true, items: [bacon, interpretation.items[2]] });
    await interpret("három szelet bacon, két szelet gouda sajt");
    await waitFor(() => expect(screen.getByText("Összes naplózása")).toBeTruthy());
    fireEvent.click(screen.getByText("Összes naplózása"));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].items[0]).toEqual({ foodId: "bls-W415000", quantity: 30, unit: "g", quantityConfirmation: { method: "estimated", accepted: true, grams: 30 } });
  });

  it("a single typical-weight item fills the form with its grams, not the slice count", async () => {
    const bacon = { ...interpretation.items[1], input: "három szelet bacon", ambiguous: false, foodResolution: "resolved", canConfirm: true, nutritionEligible: true, selectedFood: blsBacon, candidates: [blsBacon], candidateQuantities: undefined };
    stubFetch(bacon);
    await interpret("három szelet bacon");
    await waitFor(() => expect((document.getElementById("meal-quantity") as HTMLInputElement | null)?.value).toBe("30"));
    expect((document.getElementById("meal-unit") as HTMLSelectElement).value).toBe("g");
  });
});
