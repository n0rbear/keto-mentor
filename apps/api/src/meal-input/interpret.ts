import type { PrismaClient } from "@prisma/client";
import { parseNaturalFoodQuery, type ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { searchFoods } from "../catalog/food-search.js";
import { DisabledQuantityEstimationProvider, type EstimateMethod, type QuantityEstimationProvider, validateQuantityEstimate } from "./quantity-estimation.js";
import { normalizeSearch } from "../catalog/normalize.js";

type SearchablePrisma = Pick<PrismaClient, "food" | "foodAlias"> & Partial<Pick<PrismaClient, "$queryRaw">>;
type Serving = { id: string; key: string; unit: string; labels: unknown; grams: number; isEstimated: boolean; confidence: number; provenance: unknown };
type ResolvedFood = { id: string; source: string; sourceId: string | null; name: string; originalName?: string; searchText?: string; names?: Record<string, string>; servings?: Serving[]; match?: { stage: string; score: number } };

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
  ambiguous?: boolean;
  preparationUnavailable?: boolean;
  items?: InterpretResult[];
};

const PREP_KEYWORDS: Record<string, readonly string[]> = {
  fried: ["fried", "tukortojas", "tükörtojás", "spiegelei", "sult tojas", "sült tojás"],
  scrambled: ["scrambled", "tojasrantotta", "tojásrántotta", "rantotta", "rántotta", "ruhrei"],
  boiled: ["boiled", "fott", "főtt"]
};

const PREP_SEARCH_TOKEN: Record<string, string> = {
  fried: "tukortojas",
  scrambled: "tojasrantotta",
  boiled: "fott tojas"
};

function foodMatchesPreparation(food: ResolvedFood, preparation: string): boolean {
  const keywords = PREP_KEYWORDS[preparation];
  if (!keywords) return false;
  const haystack = normalizeSearch(
    [food.name, food.originalName, food.searchText, JSON.stringify(food.names ?? {})].filter(Boolean).join(" ")
  );
  return keywords.some((kw) => haystack.includes(normalizeSearch(kw)));
}

function servingMatchesSize(serving: Serving, size: ParsedNaturalFoodQuery["size"]) {
  if (!size) return true;
  return serving.key.toLowerCase().includes(size) || JSON.stringify(serving.labels ?? {}).toLowerCase().includes(size);
}

const SERVING_UNIT_ALIASES: Record<string, readonly string[]> = {
  piece: ["piece", "egg", "item", "whole", "darab", "db", "stuck", "stuk", "stucke", "eier"],
  slice: ["slice", "szelet", "scheibe", "sh"], portion: ["portion", "serving", "adag"],
  tbsp: ["tbsp", "tablespoon", "evokanal", "essloffel", "el"], tsp: ["tsp", "teaspoon", "teaskanal", "teeloffel", "tl"],
  half: ["half", "fel", "fele", "halb", "halbes"],
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
  const baseCandidates = (await searchFoods(prisma, parsed.foodQuery, 8)) as unknown as ResolvedFood[];

  let preparedFood: ResolvedFood | null = null;
  if (parsed.preparation && PREP_SEARCH_TOKEN[parsed.preparation]) {
    const prepCandidates = (await searchFoods(prisma, PREP_SEARCH_TOKEN[parsed.preparation], 8)) as unknown as ResolvedFood[];
    preparedFood = prepCandidates.find((food) => foodMatchesPreparation(food, parsed.preparation!)) ?? null;
  }

  const candidates = preparedFood
    ? [preparedFood, ...baseCandidates.filter((food) => food.id !== preparedFood!.id)]
    : baseCandidates;

  const top = candidates[0] ?? null;
  if (!top) {
    return { input, parsed, foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0, preparation: parsed.preparation };
  }

  const score = top.match?.score ?? 0;
  const stage = top.match?.stage;
  const hasPrep = !!parsed.preparation;
  const preparedFound = !!preparedFood;

  let ambiguous = false;
  if (!hasPrep && candidates.length > 1) {
    const s0 = candidates[0].match?.score ?? 0;
    const s1 = candidates[1].match?.score ?? 0;
    // A real generic ambiguity means top candidates are nearly tied (e.g. two
    // cheeses both at 95). A clear winner (e.g. egg 100 vs 95) must NOT be
    // flagged ambiguous just because a prepared form shares a base alias.
    if (s1 >= 80 && s0 - s1 <= 2) ambiguous = true;
  }

  const quantity = await resolveQuantity(parsed, top, provider);

  const prepUnavailable = hasPrep && !preparedFound;
  let foodResolution: FoodResolutionStatus;
  if (prepUnavailable) foodResolution = "confirmation_required";
  else if (ambiguous) foodResolution = "confirmation_required";
  else if ((stage === "exact" || stage === "alias") && score >= 95) foodResolution = "resolved";
  else if (score >= 80) foodResolution = "preview";
  else foodResolution = "confirmation_required";

  const canConfirm = quantity.status === "resolved" && !quantity.requiresConfirmation && !ambiguous && !prepUnavailable && score >= 80;

  return {
    input,
    parsed,
    foodResolution,
    selectedFood: top,
    candidates,
    quantity,
    canConfirm,
    confidence: score / 100,
    preparation: parsed.preparation,
    ambiguous,
    preparationUnavailable: prepUnavailable
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