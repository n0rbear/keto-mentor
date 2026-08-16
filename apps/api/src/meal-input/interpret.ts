import type { PrismaClient } from "@prisma/client";
import { parseNaturalFoodQuery, type ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { searchFoods } from "../catalog/food-search.js";
import { DisabledQuantityEstimationProvider, type EstimateMethod, type QuantityEstimationProvider, validateQuantityEstimate } from "./quantity-estimation.js";

type SearchablePrisma = Pick<PrismaClient, "food" | "foodAlias"> & Partial<Pick<PrismaClient, "$queryRaw">>;
type Serving = { id: string; key: string; unit: string; labels: unknown; grams: number; isEstimated: boolean; confidence: number; provenance: unknown };
type ResolvedFood = { id: string; source: string; sourceId: string | null; name: string; servings?: Serving[]; match?: { stage: string; score: number } };

export type QuantityResolution = {
  status: "resolved" | "unresolved";
  grams?: number;
  gramsPerUnit?: number;
  servingId?: string;
  method?: EstimateMethod;
  confidence?: number;
  estimated: boolean;
  requiresConfirmation: boolean;
  provenance?: unknown;
  reason?: "quantity_missing" | "conversion_missing";
};

export type FoodResolutionStatus = "resolved" | "preview" | "confirmation_required" | "unresolved" | "multi";

export type InterpretResult = {
  input: string;
  parsed: ParsedNaturalFoodQuery;
  foodResolution: FoodResolutionStatus;
  selectedFood: ResolvedFood | null;
  candidates: ResolvedFood[];
  quantity: QuantityResolution | null;
  canConfirm: boolean;
  confidence: number;
  preparation?: string;
  items?: InterpretResult[];
};

function servingMatchesSize(serving: Serving, size: ParsedNaturalFoodQuery["size"]) {
  if (!size) return true;
  return serving.key.toLowerCase().includes(size) || JSON.stringify(serving.labels ?? {}).toLowerCase().includes(size);
}

const SERVING_UNIT_ALIASES: Record<string, readonly string[]> = {
  piece: ["piece", "egg", "item", "whole", "darab", "db", "stuck", "stuk"],
  slice: ["slice", "szelet", "scheibe"], portion: ["portion", "serving", "adag"],
  tbsp: ["tbsp", "tablespoon", "evokanal", "essloffel"], tsp: ["tsp", "teaspoon", "teaskanal"],
  handful: ["handful", "marek", "handvoll"], cm: ["cm"], bite: ["bite", "harapas", "bissen"], splash: ["splash", "lottyintes", "schuss"]
};

function servingMatchesUnit(serving: Serving, unit: string) {
  const searchable = `${serving.unit} ${serving.key} ${JSON.stringify(serving.labels ?? {})}`.toLowerCase();
  return (SERVING_UNIT_ALIASES[unit] ?? [unit]).some((alias) => searchable.split(/[^a-z0-9]+/).includes(alias));
}

function servingMethod(serving: Serving): EstimateMethod {
  if (serving.isEstimated) return JSON.stringify(serving.provenance).toLowerCase().includes("ai") ? "ai_estimated" : "estimated";
  return JSON.stringify(serving.provenance).toLowerCase().includes("curated") ? "curated" : "authoritative";
}

export async function resolveQuantity(
  parsed: ParsedNaturalFoodQuery,
  food: ResolvedFood,
  provider: QuantityEstimationProvider = new DisabledQuantityEstimationProvider()
): Promise<QuantityResolution> {
  if (parsed.quantity == null || !parsed.unit) return { status: "unresolved", estimated: false, requiresConfirmation: true, reason: "quantity_missing" };
  if (parsed.unit === "g" || parsed.unit === "kg") {
    const gramsPerUnit = parsed.unit === "kg" ? 1000 : 1;
    return { status: "resolved", grams: parsed.quantity * gramsPerUnit, gramsPerUnit, method: "measured", confidence: 1, estimated: false, requiresConfirmation: false, provenance: { method: "exact_mass", unit: parsed.unit } };
  }

  const matching = (food.servings ?? []).filter((serving) => servingMatchesUnit(serving, parsed.unit!) && servingMatchesSize(serving, parsed.size));
  const serving = matching.sort((a, b) => Number(a.isEstimated) - Number(b.isEstimated) || b.confidence - a.confidence)[0];
  if (serving) {
    const method = servingMethod(serving);
    return {
      status: "resolved", grams: parsed.quantity * serving.grams, gramsPerUnit: serving.grams, servingId: serving.id,
      method, confidence: serving.confidence, estimated: serving.isEstimated,
      requiresConfirmation: serving.isEstimated || serving.confidence < 0.85, provenance: serving.provenance
    };
  }

  const estimated = await provider.estimate({ parsed, food });
  if (!estimated) return { status: "unresolved", estimated: false, requiresConfirmation: true, reason: "conversion_missing" };
  const valid = validateQuantityEstimate(estimated);
  return {
    status: "resolved", grams: parsed.quantity * valid.gramsPerUnit, gramsPerUnit: valid.gramsPerUnit,
    method: valid.method, confidence: valid.confidence, estimated: true, requiresConfirmation: true, provenance: valid.provenance
  };
}

async function interpretOne(
  prisma: SearchablePrisma,
  input: string,
  parsed: ParsedNaturalFoodQuery,
  provider: QuantityEstimationProvider
): Promise<InterpretResult> {
  const foods = await searchFoods(prisma, parsed.foodQuery, 5) as unknown as ResolvedFood[];
  const top = foods[0];
  if (!top) {
    return { input, parsed, foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0, preparation: parsed.preparation };
  }

  const score = top.match?.score ?? 0;
  const stage = top.match?.stage;
  const quantity = await resolveQuantity(parsed, top, provider);

  const auto = (stage === "exact" || stage === "alias") && score >= 95;
  const foodResolution: FoodResolutionStatus = auto ? "resolved" : score >= 80 ? "preview" : "confirmation_required";
  const canConfirm = quantity.status === "resolved" && score >= 80;

  return {
    input,
    parsed,
    foodResolution,
    selectedFood: top,
    candidates: foods,
    quantity,
    canConfirm,
    confidence: score / 100,
    preparation: parsed.preparation
  };
}

export async function interpretMealInput(
  prisma: SearchablePrisma,
  text: string,
  provider: QuantityEstimationProvider = new DisabledQuantityEstimationProvider()
): Promise<InterpretResult> {
  const parsed = parseNaturalFoodQuery(text);

  if (parsed.items && parsed.items.length > 1) {
    const items = await Promise.all(parsed.items.map((item) => interpretOne(prisma, text, item, provider)));
    const allConfirmable = items.every((it) => it.canConfirm);
    const top = items[0];
    return {
      input: text,
      parsed,
      foodResolution: "multi",
      selectedFood: top.selectedFood,
      candidates: top.candidates,
      quantity: top.quantity,
      canConfirm: allConfirmable,
      confidence: top.confidence,
      preparation: top.preparation,
      items
    };
  }

  return interpretOne(prisma, text, parsed, provider);
}