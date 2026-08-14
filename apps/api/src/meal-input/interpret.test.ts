import { describe, expect, it } from "vitest";
import { resolveQuantity } from "./interpret.js";
import { DisabledQuantityEstimationProvider, validateQuantityEstimate } from "./quantity-estimation.js";

const food = { id: "egg", source: "usda_fdc", sourceId: "1", name: "Egg", servings: [
  { id: "piece", key: "egg", unit: "egg", labels: { en: "egg" }, grams: 46, isEstimated: false, confidence: 1, provenance: { source: "USDA food_portion" } },
  { id: "slice", key: "slice", unit: "slice", labels: { en: "slice" }, grams: 28, isEstimated: true, confidence: .7, provenance: { method: "curated estimate" } }
] };

describe("human quantity resolution", () => {
  it("keeps measured mass exact", async () => expect(await resolveQuantity({ quantity: 125, unit: "g", foodQuery: "uborka" }, food)).toMatchObject({ grams: 125, method: "measured", confidence: 1, estimated: false, requiresConfirmation: false }));
  it("uses an authoritative Food serving", async () => expect(await resolveQuantity({ quantity: 5, unit: "piece", foodQuery: "tojas" }, food)).toMatchObject({ grams: 230, servingId: "piece", method: "authoritative", requiresConfirmation: false }));
  it("makes estimates visible and confirmable", async () => expect(await resolveQuantity({ quantity: 3, unit: "slice", foodQuery: "gouda" }, food)).toMatchObject({ grams: 84, method: "estimated", confidence: .7, estimated: true, requiresConfirmation: true }));
  it("does not invent a centimetre conversion when no provider is configured", async () => expect(await resolveQuantity({ quantity: 15, unit: "cm", foodQuery: "uborka" }, food, new DisabledQuantityEstimationProvider())).toMatchObject({ status: "unresolved", reason: "conversion_missing" }));
  it("accepts a structured AI estimate but never nutrition", async () => expect(await resolveQuantity({ quantity: 15, unit: "cm", foodQuery: "uborka" }, food, { id: "test", async estimate() { return { gramsPerUnit: 8.5, confidence: .62, method: "ai_estimated", provenance: { provider: "test", modelOrRule: "fixture", estimatedAt: "2026-08-14T00:00:00Z" } }; } })).toMatchObject({ grams: 127.5, method: "ai_estimated", requiresConfirmation: true }));
  it("rejects estimates without traceable provenance", () => expect(() => validateQuantityEstimate({ gramsPerUnit: 10, confidence: .5, method: "estimated", provenance: {} })).toThrow("incomplete_estimate_provenance"));
});
