import type { ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";

export type EstimateMethod = "measured" | "authoritative" | "curated" | "estimated" | "ai_estimated" | "user_corrected";

export type QuantityEstimate = {
  gramsPerUnit: number;
  confidence: number;
  method: "estimated" | "ai_estimated";
  provenance: Record<string, unknown>;
  rangeGramsPerUnit?: { min: number; max: number };
};

export interface QuantityEstimationProvider {
  readonly id: string;
  estimate(input: {
    parsed: ParsedNaturalFoodQuery;
    food: { id: string; source: string; sourceId: string | null; name: string };
  }, signal?: AbortSignal, beforeCall?: () => void): Promise<QuantityEstimate | null>;
}

export class DisabledQuantityEstimationProvider implements QuantityEstimationProvider {
  readonly id = "disabled";
  async estimate() { return null; }
}

export function validateQuantityEstimate(value: QuantityEstimate) {
  if (!Number.isFinite(value.gramsPerUnit) || value.gramsPerUnit <= 0 || value.gramsPerUnit > 50_000) throw new Error("invalid_estimated_weight");
  if (!Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) throw new Error("invalid_estimate_confidence");
  if (value.method !== "estimated" && value.method !== "ai_estimated") throw new Error("invalid_estimate_method");
  if (!value.provenance.provider || !value.provenance.modelOrRule || !value.provenance.estimatedAt) throw new Error("incomplete_estimate_provenance");
  const range = value.rangeGramsPerUnit;
  if (range && (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min <= 0 || range.max > 50_000 || range.max <= range.min || value.gramsPerUnit < range.min || value.gramsPerUnit > range.max)) throw new Error("invalid_estimate_range");
  return value;
}
