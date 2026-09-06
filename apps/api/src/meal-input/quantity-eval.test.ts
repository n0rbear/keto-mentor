import { expect, it, vi } from "vitest";
import { QUANTITY_EVAL_CORPUS } from "./quantity-eval-corpus.js";
import { parseNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { resolveQuantity } from "./interpret.js";

it.each(QUANTITY_EVAL_CORPUS)("$language: $text [$category]", async (test) => {
  const parsed = parseNaturalFoodQuery(test.text);
  expect(parsed.quantity).toBe(test.quantity);
  expect(parsed.unit).toBe(test.unit);
  if (test.category === "unresolved") return; // Interpreter safety is tested separately with unresolved catalog identities.
  const estimated = test.category === "estimated";
  const servings = ["authoritative", "estimated"].includes(test.category) ? [{ id: "fixture-serving", key: parsed.unit!, unit: parsed.unit!, labels: {}, grams: 50, isEstimated: estimated, confidence: .95, provenance: { method: estimated ? "estimated" : "authoritative" } }] : [];
  const estimate = vi.fn(async () => ({ gramsPerUnit: 30, rangeGramsPerUnit: { min: 20, max: 40 }, confidence: .8, method: "ai_estimated" as const, provenance: { provider: "fixture", modelOrRule: "fixture", estimatedAt: "2026-09-06T00:00:00Z" } }));
  const result = await resolveQuantity(parsed, { id: "fixture", source: "fixture", sourceId: "fixture", name: "Resolved fixture", servings }, { id: "fixture", estimate });
  expect(estimate).toHaveBeenCalledTimes(test.category === "ai" ? 1 : 0);
  expect(result.requiresConfirmation).toBe(!["exact", "authoritative"].includes(test.category));
  if (test.category === "exact") expect(result.grams).toBe(test.quantity! * (test.unit === "kg" ? 1000 : 1));
  if (test.category === "ai") expect(result.grams).toBe(test.quantity! * 30);
});
