import type { NaturalQuantityUnit, ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";

export type EstimateMethod = "measured" | "authoritative" | "curated" | "estimated" | "ai_estimated" | "user_corrected";

// Container/volume-style units ("plate", "bowl", ...) and the hand-packed
// "handful" both warrant physically-grounded reasoning (a vessel or hand has
// a volume; the food occupies some fraction of it at some density) — the AI
// provider is asked to show that intermediate physical reasoning so it can
// be bounds-checked, rather than emitting one ungrounded grams number.
// Count/geometry units (piece, slice, cm, ...) have no meaningful "volume":
// forcing them through a container model would be nonsensical, so they keep
// the existing direct-estimate schema. "handful" is volume-class but tagged
// as "packing" everywhere it matters (provenance, diagnostics, UI) since a
// cupped hand is a much less precise reference than a plate or cup.
export type QuantityEstimationClass = "volume" | "geometry";
export type QuantityEstimationMethodClass = "container" | "packing" | "direct";

const VOLUME_UNITS = new Set<NaturalQuantityUnit>(["plate", "bowl", "cup", "ladle", "tbsp", "tsp", "splash", "handful"]);
const PACKING_UNITS = new Set<NaturalQuantityUnit>(["handful"]);

export function quantityEstimationClass(unit: NaturalQuantityUnit | undefined): QuantityEstimationClass {
  return unit && VOLUME_UNITS.has(unit) ? "volume" : "geometry";
}

export function quantityEstimationMethodClass(unit: NaturalQuantityUnit | undefined): QuantityEstimationMethodClass {
  if (unit && PACKING_UNITS.has(unit)) return "packing";
  return quantityEstimationClass(unit) === "volume" ? "container" : "direct";
}

// The structured physical reasoning behind a volume-class AI estimate —
// present only when the provider actually ran the volume model. Kept
// separate from nutrition entirely: every field here is physical (ml, g/ml,
// a fraction), never a nutrient, so there is nothing here for the AI to
// smuggle nutrition through even before the strict Zod schema rejects it.
export type VolumeQuantityModel = {
  referenceVolumeMl: { min: number; max: number };
  fillFraction: { min: number; max: number };
  foodVolumeMl: { min: number; max: number };
  bulkDensityGPerMl: { min: number; max: number };
  grams: { min: number; max: number };
};

export type QuantityEstimate = {
  gramsPerUnit: number;
  confidence: number;
  method: "estimated" | "ai_estimated";
  provenance: Record<string, unknown>;
  rangeGramsPerUnit?: { min: number; max: number };
  estimationClass?: QuantityEstimationClass;
  estimationMethodClass?: QuantityEstimationMethodClass;
  volumeModel?: VolumeQuantityModel;
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
