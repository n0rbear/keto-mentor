import type { PrismaClient } from "@prisma/client";
import type { FoodUnderstanding, FoodUnderstandingItem, QuantityClarification } from "@keto-mentor/shared";
import { parseNaturalFoodQuery, type ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { searchFoods } from "../catalog/food-search.js";
import { DisabledQuantityEstimationProvider, type EstimateMethod, type QuantityEstimationProvider, validateQuantityEstimate } from "./quantity-estimation.js";
import { normalizeSearch } from "../catalog/normalize.js";
import { StubAiProvider, type AiProvider, understandFood } from "../ai/provider.js";
import { AiProviderError } from "../ai/chat-completions-provider.js";

type SearchablePrisma = Pick<PrismaClient, "food" | "foodAlias"> & Partial<Pick<PrismaClient, "$queryRaw">>;
type Serving = { id: string; key: string; unit: string; labels: unknown; grams: number; isEstimated: boolean; confidence: number; provenance: unknown };
type ResolvedFood = { id: string; source: string; sourceId: string | null; name: string; originalName?: string; searchText?: string; names?: Record<string, string>; servings?: Serving[]; match?: { stage: string; score: number } };

/**
 * Why an AI quantity estimate did or didn't happen, kept distinct from the
 * public-facing `reason` so tests/diagnostics can tell "no provider is
 * configured" apart from "the provider timed out" apart from "the provider
 * returned something invalid" apart from "the provider genuinely doesn't
 * think this quantity is estimable" — all of which the UI still treats the
 * same simple way (fall back to manual grams), per the product's own design,
 * but which must never be silently indistinguishable internally.
 */
export type AiQuantityOutcome = "not_configured" | "declined" | "timeout" | "invalid_output" | "estimated";

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
  rangeGrams?: { min: number; max: number };
  reason?: "quantity_missing" | "conversion_missing";
  aiOutcome?: AiQuantityOutcome;
};

export type FoodResolutionStatus = "resolved" | "preview" | "confirmation_required" | "unresolved" | "multi" | "compound";

export type InterpretResult = {
  clarification?: QuantityClarification;
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
  interpretationSource: "deterministic" | "ai_assisted";
  semantic?: {
    language: FoodUnderstanding["language"];
    kind: FoodUnderstanding["kind"];
    dishName?: string;
    clarificationNeeded: boolean;
    clarificationReason?: string;
  };
  semanticItem?: FoodUnderstandingItem;
  nutritionEligible?: boolean;
  ai?: { provider: string; model?: string; confidence: number };
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
  piece: ["piece", "pieces", "egg", "item", "whole", "darab", "db", "stuck", "stuk", "stucke"],
  slice: ["slice", "slices", "szelet", "scheibe", "scheiben"], portion: ["portion", "serving", "adag"],
  tbsp: ["tbsp", "tablespoon", "tablespoons", "evokanal", "essloffel", "ek", "el"],
  tsp: ["tsp", "teaspoon", "teaspoons", "teaskanal", "teeloffel", "tk", "tl"],
  half: ["half", "fel", "fele", "halb", "halbe"],
  handful: ["handful", "marek", "handvoll"], cm: ["cm"], bite: ["bite", "harapas", "bissen"], splash: ["splash", "lottyintes", "schuss"],
  plate: ["plate", "tanyer", "teller"], bowl: ["bowl", "tal", "schussel"], ladle: ["ladle", "merokanal", "kelle"],
  cup: ["cup", "csesze", "tasse", "pohar", "glass", "glas"], quarter: ["quarter", "negyed", "viertel"],
  ml: ["ml", "milliliter", "millilitre"], l: ["l", "liter", "litre", "liters", "litres"]
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

  const bestServing = (unit: string) => (food.servings ?? [])
    .filter((candidate) => servingMatchesUnit(candidate, unit) && servingMatchesSize(candidate, parsed.size))
    .sort((a, b) => servingPriority(a) - servingPriority(b) || b.confidence - a.confidence)[0];

  let serving = bestServing(parsed.unit);
  let servingScale = 1;
  let provenance = serving?.provenance;
  if (!serving && (parsed.unit === "half" || parsed.unit === "quarter")) {
    serving = bestServing("piece");
    servingScale = parsed.unit === "half" ? 0.5 : 0.25;
    if (serving) provenance = { method: "half_of_piece", sourceServing: serving.provenance };
  }
  if (serving) {
    const method = servingMethod(serving);
    const gramsPerUnit = serving.grams * servingScale;
    return {
      status: "resolved", grams: parsed.quantity * gramsPerUnit, gramsPerUnit, servingId: serving.id,
      method, confidence: serving.confidence, estimated: serving.isEstimated,
      requiresConfirmation: serving.isEstimated || serving.confidence < 0.85, provenance
    };
  }

  if (provider.id === "disabled") {
    return { status: "unresolved", estimated: false, requiresConfirmation: true, reason: "conversion_missing", aiOutcome: "not_configured" };
  }
  try {
    const estimated = await provider.estimate({ parsed, food });
    if (!estimated) return { status: "unresolved", estimated: false, requiresConfirmation: true, reason: "conversion_missing", aiOutcome: "declined" };
    const valid = validateQuantityEstimate(estimated);
    return {
      status: "resolved", grams: parsed.quantity * valid.gramsPerUnit, gramsPerUnit: valid.gramsPerUnit,
      method: valid.method, confidence: valid.confidence, estimated: true, requiresConfirmation: true, provenance: valid.provenance,
      rangeGrams: valid.rangeGramsPerUnit ? { min: parsed.quantity * valid.rangeGramsPerUnit.min, max: parsed.quantity * valid.rangeGramsPerUnit.max } : undefined,
      aiOutcome: "estimated"
    };
  } catch (error) {
    const aiOutcome: AiQuantityOutcome = error instanceof AiProviderError && error.code === "timeout" ? "timeout" : "invalid_output";
    return { status: "unresolved", estimated: false, requiresConfirmation: true, reason: "conversion_missing", aiOutcome };
  }
}

function servingPriority(serving: Serving) {
  const method = servingMethod(serving);
  return method === "authoritative" ? 0 : method === "curated" ? 1 : 2;
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
    return { input, parsed, foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null, canConfirm: false, confidence: 0, preparation: parsed.preparation, interpretationSource: "deterministic" };
  }

  const score = top.match?.score ?? 0;
  const stage = top.match?.stage;
  // Only a preparation the architecture actually tracks as needing a
  // DISTINCT catalog entry (currently: fried/scrambled/boiled egg, where
  // cooking method genuinely changes weight/composition) can make
  // resolution incomplete. Every other preparation concept (grilled,
  // roasted, steamed, smoked, baked, ...) is descriptive metadata on an
  // already-correctly-resolved food — e.g. "grilled sausage" is still just
  // the trusted "sausage" Food, grilled is not a different nutrition
  // profile requiring its own entry. Conflating "no specialized lookup
  // exists for this preparation" with "preparation unavailable" was
  // blocking confirmation for any food modified by a common cooking-method
  // word outside that narrow egg-specific set (e.g. a perfectly, exactly
  // matched sausage).
  const hasPrep = !!parsed.preparation;
  const needsPreparedFormLookup = hasPrep && !!PREP_SEARCH_TOKEN[parsed.preparation!];
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

  const prepUnavailable = needsPreparedFormLookup && !preparedFound;
  let foodResolution: FoodResolutionStatus;
  if (prepUnavailable) foodResolution = "confirmation_required";
  else if (ambiguous) foodResolution = "confirmation_required";
  else if ((stage === "exact" || stage === "alias") && score >= 95) foodResolution = "resolved";
  else if (score >= 80) foodResolution = "preview";
  else foodResolution = "confirmation_required";

  const quantity = await resolveQuantity(parsed, top, foodResolution === "resolved" ? provider : new DisabledQuantityEstimationProvider());

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
    preparationUnavailable: prepUnavailable,
    interpretationSource: "deterministic"
  };
}

async function interpretDeterministically(
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
      items,
      interpretationSource: "deterministic"
    };
  }

  return interpretOne(prisma, text, parsed, provider);
}

function shouldUseAiFallback(result: InterpretResult, aiProvider: AiProvider) {
  if (!aiProvider.supports("food_nlp")) return false;
  if (result.ambiguous) return false;
  if (result.items?.length) {
    return !result.items.every((item) => item.selectedFood && item.confidence >= 0.8 && !item.preparationUnavailable);
  }
  if (result.selectedFood && result.confidence >= 0.95 && !result.preparationUnavailable) return false;
  return result.foodResolution === "unresolved" || result.confidence < 0.95 || !!result.preparationUnavailable;
}

function semanticParsed(item: FoodUnderstandingItem): ParsedNaturalFoodQuery {
  const parsed: ParsedNaturalFoodQuery = { foodQuery: item.canonicalName };
  if (item.quantity != null) parsed.quantity = item.quantity;
  if (item.unit) parsed.unit = item.unit;
  if (item.size) parsed.size = item.size;
  if (item.preparation) parsed.preparation = item.preparation;
  return parsed;
}

function unresolvedSemanticItem(input: string, item: FoodUnderstandingItem): InterpretResult {
  return {
    input,
    parsed: semanticParsed(item),
    foodResolution: "unresolved",
    selectedFood: null,
    candidates: [],
    quantity: null,
    canConfirm: false,
    confidence: item.confidence,
    preparation: item.preparation,
    interpretationSource: "ai_assisted",
    semanticItem: item,
    nutritionEligible: false
  };
}

async function interpretAiUnderstanding(
  prisma: SearchablePrisma,
  text: string,
  understanding: FoodUnderstanding,
  quantityProvider: QuantityEstimationProvider,
  aiProvider: AiProvider
): Promise<InterpretResult> {
  const dishNormalized = normalizeSearch(understanding.dishName ?? "");
  const hasDishItem = !!dishNormalized && understanding.items.some((item) => normalizeSearch(item.canonicalName) === dishNormalized);
  const semanticItems = hasDishItem || !understanding.dishName
    ? understanding.items
    : [{
        originalText: understanding.dishName,
        canonicalName: understanding.dishName,
        evidence: "explicit" as const,
        confidence: understanding.confidence
      }, ...understanding.items];
  const items: InterpretResult[] = [];
  for (const item of semanticItems) {
    if (item.evidence !== "explicit") {
      items.push(unresolvedSemanticItem(text, item));
      continue;
    }
    const resolved = await interpretOne(prisma, item.originalText, semanticParsed(item), quantityProvider);
    items.push({
      ...resolved,
      interpretationSource: "ai_assisted",
      semanticItem: item,
      nutritionEligible: !!resolved.selectedFood && resolved.foodResolution === "resolved"
    });
  }
  const metadata = {
    language: understanding.language,
    kind: understanding.kind,
    dishName: understanding.dishName,
    clarificationNeeded: understanding.clarificationNeeded,
    clarificationReason: understanding.clarificationReason
  };
  const ai = { provider: aiProvider.id, model: aiProvider.model, confidence: understanding.confidence };
  if (understanding.kind === "single_food" && items.length === 1) {
    return {
      ...items[0],
      input: text,
      canConfirm: items[0].canConfirm && !understanding.clarificationNeeded,
      interpretationSource: "ai_assisted",
      semantic: metadata,
      ai
    };
  }
  const explicitItems = items.filter((item) => item.semanticItem?.evidence === "explicit");
  const allExplicitConfirmable = explicitItems.length > 0 && explicitItems.every((item) => item.canConfirm);
  const hasInferred = items.some((item) => item.semanticItem?.evidence === "inferred_common");
  const top = items[0] ?? unresolvedSemanticItem(text, semanticItems[0]);
  return {
    input: text,
    parsed: top.parsed,
    foodResolution: understanding.kind === "compound_dish" ? "compound" : "multi",
    selectedFood: top.selectedFood,
    candidates: top.candidates,
    quantity: top.quantity,
    canConfirm: allExplicitConfirmable && !hasInferred && !understanding.clarificationNeeded,
    confidence: understanding.confidence,
    preparation: top.preparation,
    items,
    interpretationSource: "ai_assisted",
    semantic: metadata,
    nutritionEligible: false,
    ai
  };
}

export async function interpretMealInput(
  prisma: SearchablePrisma,
  text: string,
  quantityProvider: QuantityEstimationProvider = new DisabledQuantityEstimationProvider(),
  aiProvider: AiProvider = new StubAiProvider()
): Promise<InterpretResult> {
  // Resolve food semantics before allowing any external weight estimation.
  const disabled = new DisabledQuantityEstimationProvider();
  const deterministic = await interpretDeterministically(prisma, text, disabled);
  let result = deterministic;
  if (shouldUseAiFallback(deterministic, aiProvider)) {
    try {
      const understanding = await understandFood(aiProvider, { text });
      result = await interpretAiUnderstanding(prisma, text, understanding, disabled, aiProvider);
    } catch {
      result = deterministic;
    }
  }
  if (!result.semantic?.clarificationNeeded && result.foodResolution !== "compound") {
    for (const item of result.items ?? [result]) {
      if (item.foodResolution !== "resolved" || !item.selectedFood || item.ambiguous || item.preparationUnavailable || item.nutritionEligible === false) continue;
      if (item.quantity?.reason === "conversion_missing") item.quantity = await resolveQuantity(item.parsed, item.selectedFood, quantityProvider);
      item.canConfirm = item.quantity?.status === "resolved" && !item.quantity.requiresConfirmation;
    }
    if (result.items) result.canConfirm = result.items.every((item) => item.canConfirm);
  }
  result.clarification = firstQuantityClarification(result);
  return result;
}

export function firstQuantityClarification(result: InterpretResult): QuantityClarification | undefined {
  if (result.semantic?.clarificationNeeded || result.foodResolution === "compound") return;
  const items = result.items ?? [result];
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    const item = items[itemIndex];
    if (item.canConfirm) continue;
    if (!item.selectedFood || item.foodResolution !== "resolved" || item.ambiguous || item.preparationUnavailable || item.nutritionEligible === false) return;
    const quantity = item.quantity;
    if (!quantity || quantity.reason === "quantity_missing") return { type: "quantity_missing", itemIndex, allowCustomGrams: true };
    if (quantity.status === "resolved" && quantity.requiresConfirmation) return {
      type: "estimate_confirmation", itemIndex, allowCustomGrams: true, suggestedGrams: quantity.grams,
      rangeGrams: quantity.rangeGrams, confidence: quantity.confidence, method: quantity.method === "ai_estimated" ? "ai_estimated" : "estimated"
    };
    return { type: "grams_required", itemIndex, allowCustomGrams: true };
  }
}
