import { foodUnderstandingSchema, type FoodUnderstanding } from "@keto-mentor/shared";
import { normalizeSearch } from "../catalog/normalize.js";
import type { FoodUnderstandingEvalCase } from "./food-understanding-eval-corpus.js";

const nutritionKeys = new Set(["kcal", "calories", "protein", "fat", "carbs", "carbohydrates", "fiber", "vitamins", "minerals", "nutrientid", "foodid"]);
function hasUnsafeField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasUnsafeField);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => nutritionKeys.has(normalizeSearch(key).replace(/[^a-z]/g, "")) || hasUnsafeField(child));
}

export async function evaluateFoodUnderstanding(
  cases: readonly FoodUnderstandingEvalCase[],
  understand: (test: FoodUnderstandingEvalCase) => Promise<unknown>,
  trustedResolver?: (canonicalName: string) => Promise<boolean>
) {
  let valid = 0;
  let kindCorrect = 0;
  let explicitItemsCorrect = 0;
  let quantityCorrect = 0;
  let quantityCases = 0;
  let modifierCorrect = 0;
  let modifierCases = 0;
  let exclusionCorrect = 0;
  let exclusionCases = 0;
  let clarificationCount = 0;
  let unsafeNutritionOutputAccepted = 0;
  let trustedResolutionAttempts = 0;
  let trustedResolved = 0;
  const failures: Array<{ id: string; metric: string }> = [];

  for (const test of cases) {
    let raw: unknown;
    try { raw = await understand(test); }
    catch { failures.push({ id: test.id, metric: "provider_error" }); continue; }
    const parsed = foodUnderstandingSchema.safeParse(raw);
    if (!parsed.success) { failures.push({ id: test.id, metric: "schema" }); continue; }
    valid += 1;
    const value: FoodUnderstanding = parsed.data;
    if (hasUnsafeField(raw)) unsafeNutritionOutputAccepted += 1;
    if (value.kind === test.expected.kind) kindCorrect += 1; else failures.push({ id: test.id, metric: "kind" });
    const concepts = value.items.filter((item) => item.evidence === "explicit").map((item) => normalizeSearch(item.canonicalName));
    if (test.expected.concepts.every((concept) => concepts.includes(normalizeSearch(concept)))) explicitItemsCorrect += 1;
    else failures.push({ id: test.id, metric: "explicit_items" });
    if (test.expected.quantities?.length) {
      quantityCases += 1;
      const correct = test.expected.quantities.every((expected) => value.items.some((item) =>
        normalizeSearch(item.canonicalName) === normalizeSearch(expected.concept) && item.quantity === expected.quantity && item.unit === expected.unit
      ));
      if (correct) quantityCorrect += 1; else failures.push({ id: test.id, metric: "quantity" });
    }
    if (test.expected.modifiers?.length) {
      modifierCases += 1;
      const found = value.items.flatMap((item) => item.modifiers ?? []).map(normalizeSearch);
      if (test.expected.modifiers.every((item) => found.includes(normalizeSearch(item)))) modifierCorrect += 1;
      else failures.push({ id: test.id, metric: "modifiers" });
    }
    if (test.expected.exclusions?.length) {
      exclusionCases += 1;
      const found = value.items.flatMap((item) => item.excludedModifiers ?? []).map(normalizeSearch);
      if (test.expected.exclusions.every((item) => found.includes(normalizeSearch(item)))) exclusionCorrect += 1;
      else failures.push({ id: test.id, metric: "exclusions" });
    }
    if (value.clarificationNeeded) clarificationCount += 1;
    if (trustedResolver) {
      for (const item of value.items.filter((candidate) => candidate.evidence === "explicit")) {
        trustedResolutionAttempts += 1;
        if (await trustedResolver(item.canonicalName)) trustedResolved += 1;
      }
    }
  }
  const percent = (count: number, total: number) => total ? Number((count / total * 100).toFixed(1)) : null;
  return {
    total: cases.length,
    validSchema: valid,
    kindClassificationAccuracy: percent(kindCorrect, cases.length),
    explicitItemExtractionAccuracy: percent(explicitItemsCorrect, cases.length),
    quantityExtractionAccuracy: percent(quantityCorrect, quantityCases),
    modifierExtractionAccuracy: percent(modifierCorrect, modifierCases),
    exclusionExtractionAccuracy: percent(exclusionCorrect, exclusionCases),
    trustedFoodResolutionRate: percent(trustedResolved, trustedResolutionAttempts),
    clarificationRate: percent(clarificationCount, valid),
    unsafeNutritionOutputAccepted,
    failures
  };
}
