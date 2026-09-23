import type { PrismaClient } from "@prisma/client";
import type { FoodUnderstanding, FoodUnderstandingItem, Locale, QuantityClarification } from "@keto-mentor/shared";
import { isBarePreparationToken, parseNaturalFoodQuery, type ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { hasSemanticCoverage, isTrustedLocalMatch, localFormMismatch, searchFoods } from "../catalog/food-search.js";
import type { RecipeDiscoveryPreview } from "../recipes/recipe-discovery.js";
import { DisabledQuantityEstimationProvider, type EstimateMethod, type QuantityEstimationClass, type QuantityEstimationMethodClass, type QuantityEstimationProvider, type VolumeQuantityModel, validateQuantityEstimate } from "./quantity-estimation.js";
import { normalizeSearch } from "../catalog/normalize.js";
import { StubAiProvider, type AiProvider, understandFood } from "../ai/provider.js";
import { AiProviderError } from "../ai/chat-completions-provider.js";
import { resolveDynamicFood } from "../catalog/dynamic-food-resolution.js";
import type { ExternalFoodCandidate, StructuredFoodLookupAdapter } from "../catalog/external-food.js";
import { DisabledSearchIntentProvider, type SearchIntentProvider } from "../catalog/search-intent.js";
import type { CandidateLocalizationProvider } from "../catalog/candidate-localization.js";
import type { DynamicFoodResolutionRateLimiter } from "../catalog/dynamic-food-rate-limit.js";
import type { FoodLocale } from "../catalog/food-locale.js";
import type { SemanticCandidateGateProvider } from "../catalog/semantic-candidate-gate.js";
import type { SemanticRecoveryProvider } from "../catalog/semantic-recovery.js";
import type { RecipeSemanticGateProvider } from "../catalog/semantic-candidate-gate-batch.js";
import { DEFAULT_CONCURRENCY, mapWithConcurrency, timeStage } from "../request-performance.js";
import type { ProgressStage } from "./progress-bus.js";
import type { AiNutritionEstimate } from "../catalog/ai-nutrition-estimation.js";
import { createAiEstimateProof } from "../catalog/ai-estimate-proof.js";
import type { WebEvidenceFallbackDiagnostics } from "../catalog/web-evidence-fallback.js";
import type { DecisionTrace, DynamicResolutionDiagnostics } from "../catalog/dynamic-food-resolution.js";

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
  estimationClass?: QuantityEstimationClass;
  estimationMethodClass?: QuantityEstimationMethodClass;
  volumeModel?: VolumeQuantityModel;
};

export type FoodResolutionStatus = "resolved" | "preview" | "confirmation_required" | "unresolved" | "multi" | "compound" | "ai_estimate_pending";

/**
 * Wired only when a genuine authenticated user + configured gateway/adapters
 * exist; passing `null` (the default for every existing call site) makes
 * dynamic external resolution a strict no-op, so no pre-existing test or
 * caller changes behavior just by this feature existing.
 */
export type DynamicResolutionDeps = {
  // Deliberately its own reference rather than reusing interpretOne's own
  // narrow search-only `prisma` param: persistence needs nutrient/
  // foodNutrient/$transaction, which most test fixtures for the local-search
  // path never implement, and never need to.
  prisma: Parameters<typeof resolveDynamicFood>[0];
  searchIntentProvider: SearchIntentProvider;
  adapters: readonly StructuredFoodLookupAdapter[];
  rateLimiter: DynamicFoodResolutionRateLimiter;
  userId: string;
  // The authenticated user's own persisted locale — see server.ts's /meal-input/interpret
  // handler. Governs only display-name localization for external candidates,
  // never search/matching/trust. Defaulted so existing test fixtures that
  // predate localization keep compiling unchanged.
  locale?: Locale;
  // Owner-beta blocker #8 (2026-09-11): the user's REGIONAL food-vocabulary
  // locale (e.g. "de-AT") — see catalog/food-locale.ts. Optional and
  // independent of `locale` so an existing caller that only wires `locale`
  // keeps working unchanged; passed straight through to resolveDynamicFood.
  foodLocale?: FoodLocale;
  localizationProvider?: CandidateLocalizationProvider;
  // Owner-beta blocker #9 (2026-09-11): see catalog/semantic-candidate-gate.ts
  // and dynamic-food-resolution.ts — validates a candidate against the
  // ORIGINAL identity, independent of the (possibly wrong) canonical search
  // term. Optional in the TYPE only; resolveDynamicFood defaults a missing
  // provider to DisabledSemanticCandidateGateProvider, which FAILS CLOSED
  // (rejects every candidate), never silently skips the check.
  semanticCandidateGateProvider?: SemanticCandidateGateProvider;
  // Unified food-resolution engine (2026-09-23): second-chance search-term
  // recovery, tried only when the shared engine's first attempt already
  // failed or could not safely converge — see dynamic-food-resolution.ts's
  // resolveFoodConcept. Was already threaded through at runtime via each
  // caller's own `dynamic` object literal (server.ts/recipes/router.ts);
  // declared here explicitly so both the single-item path (resolveDynamicFood)
  // and, via this same deps shape, the recipe/batch path
  // (recipe-ingredient-batch-resolution.ts forwarding it into
  // BatchAuthoritativeDeps) are properly typed rather than relying on
  // structural "riding along".
  semanticRecoveryProvider?: SemanticRecoveryProvider;
  // Owner-beta checkpoint (2026-09-15): cold-path performance. Only consumed
  // by resolveRecipeIngredientsBatch's batched dynamic resolution
  // (catalog/dynamic-food-resolution-batch.ts) — interpretOne's own
  // per-item path never reads this field, since it only ever resolves one
  // food at a time and has nothing to batch. Optional so every existing
  // caller/fixture that predates this keeps compiling unchanged; a missing
  // provider degrades to DisabledRecipeSemanticGateProvider inside the
  // recipe-batch resolver, which also fails CLOSED.
  recipeSemanticGateProvider?: RecipeSemanticGateProvider;
  webEvidenceFallback?: Parameters<typeof resolveDynamicFood>[2]["webEvidenceFallback"];
  aiEstimation?: Parameters<typeof resolveDynamicFood>[2]["aiEstimation"];
} | null;

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
    dishQuantity?: number;
    dishUnit?: FoodUnderstanding["dishUnit"];
    clarificationNeeded: boolean;
    clarificationReason?: string;
  };
  semanticItem?: FoodUnderstandingItem;
  nutritionEligible?: boolean;
  ai?: { provider: string; model?: string; confidence: number };
  // Present only when a local catalog miss triggered dynamic external
  // resolution and the result needs the user to pick among a bounded set of
  // authoritative candidates. The browser may only ever send back
  // {source, sourceId} to /foods/resolve-external/confirm — never nutrition.
  externalCandidates?: ExternalFoodCandidate[];
  externalCandidatesReason?: "ambiguous" | "possible_duplicate" | "weak_match";
  // Present only when a composite-dish phrase genuinely exhausted local +
  // structured-source resolution and web recipe discovery was attempted as a
  // fallback (see meal-input/recipe-discovery-fallback.ts, called from the
  // route handler — never set by interpretMealInput itself).
  recipeDiscovery?: RecipeDiscoveryPreview;
  // Owner-beta (2026-09-14): set only on a SIBLING item (never on the dish
  // item itself) when recipe-discovery-fallback's own sibling-overlap check
  // (see detectSiblingOverlap) found this item's selectedFood is the SAME
  // Food as one of the discovered recipe's own resolved ingredients — e.g.
  // "csülökpörkölt krumplival" where the selected csülökpörkölt recipe
  // itself includes potato. Paired with nutritionEligible:false so this
  // item is never independently counted; a future recipe-confirmation save
  // flow must skip it, not merely display it.
  excludedBySiblingRecipe?: { dishItemIndex: number; dishName: string };
  // Owner-beta diagnostics checkpoint (2026-09-13): set only when AI-assisted
  // understanding was ATTEMPTED and failed, so the result fell back to the
  // deterministic-only interpretation — see the catch block below. Distinct
  // from simply never attempting AI (shouldUseAiFallback returning false),
  // which leaves this field unset. Never the raw error message/stack (see
  // AiProviderError's own code enum) — a closed, safe vocabulary only, for
  // diagnostics.ts to translate into a human-readable beta message.
  aiUnderstandingFailure?: { code: string };
  // FINAL FALLBACK: AI-ESTIMATED NUTRITION (2026-09-16). Present only when
  // foodResolution === "ai_estimate_pending" — local + authoritative-adapter
  // + web-evidence resolution all genuinely failed, and the model produced a
  // structurally-plausible estimate. Never treated as authoritative and
  // NEVER auto-persisted: the client must show this clearly marked as an
  // estimate and offer the user exactly two actions — accept it (POST
  // /meals with an aiEstimate item, echoing `proof` back verbatim; the
  // server re-verifies every number against the proof before persisting,
  // see ai-estimate-proof.ts) or enter their own values instead (the
  // existing manual-fallback item, source: "user_input"). `proof` expires
  // in 15 minutes and is bound to this exact user + identity + every
  // numeric value — it cannot be reused for a different food or edited
  // in transit.
  aiEstimate?: AiNutritionEstimate & { requestedIdentity: string; canonicalIdentity: string; proof: string };
  // P0 effectiveness-investigation instrumentation (2026-09-16) — see
  // debugResolutionDiagnostics's own doc. Never present in production.
  webEvidenceDiagnostics?: WebEvidenceFallbackDiagnostics;
  // Production web-evidence effectiveness RCA (2026-09-17) — see
  // debugResolutionDiagnostics's own doc. Never present in production.
  resolutionDiagnostics?: DynamicResolutionDiagnostics;
  // Decision-transparency audit (2026-09-19) — deliberately NOT gated by
  // isProductionDeployment() like webEvidenceDiagnostics/resolutionDiagnostics
  // above: DecisionTrace carries only small, closed, already-safe outcome
  // CATEGORIES (never a domain, URL, search term, or provider message — see
  // its own doc in dynamic-food-resolution.ts), so it is always present when
  // known, in every environment, and is what diagnostics.ts turns into the
  // "Mi történt?" panel's web-evidence/AI-estimation lines.
  decisionTrace?: DecisionTrace;
};

function aiEstimatePendingResult(
  input: string, parsed: ParsedNaturalFoodQuery,
  outcome: Extract<Awaited<ReturnType<typeof resolveDynamicFood>>, { status: "ai_estimate_pending" }>,
  userId: string
): InterpretResult {
  const proof = createAiEstimateProof(userId, {
    requestedIdentity: outcome.requestedIdentity, canonicalFoodName: outcome.estimate.canonicalFoodName,
    kcalPer100g: outcome.estimate.kcalPer100g, proteinPer100g: outcome.estimate.proteinPer100g,
    fatPer100g: outcome.estimate.fatPer100g, carbsPer100g: outcome.estimate.carbsPer100g, fiberPer100g: outcome.estimate.fiberPer100g
  });
  return {
    input, parsed, foodResolution: "ai_estimate_pending", selectedFood: null, candidates: [], quantity: null,
    canConfirm: false, confidence: 0, preparation: parsed.preparation, interpretationSource: "deterministic",
    aiEstimate: { ...outcome.estimate, requestedIdentity: outcome.requestedIdentity, canonicalIdentity: outcome.canonicalIdentity, proof },
    ...(outcome.decisionTrace ? { decisionTrace: outcome.decisionTrace } : {}),
    ...debugResolutionDiagnostics(outcome.webEvidenceDiagnostics, outcome.resolutionDiagnostics)
  };
}

// P0 effectiveness-investigation instrumentation (2026-09-16, extended
// 2026-09-17 with resolutionDiagnostics): both diagnostic traces are ALWAYS
// computed cheaply (see dynamic-food-resolution.ts) but only ever surfaced
// to an API caller outside production — never "noisy permanent production
// logging", an explicit opt-in for verification. No secrets/PII in either
// object (see each type's own doc — domains, tiers, search terms, rejection
// stages only, never page content or provider credentials).
// Staging deliberately runs with NODE_ENV=production (see server.ts's own
// deploymentEnvironment/build-info logic — NODE_ENV alone cannot tell
// staging apart from real production). RENDER_SERVICE_NAME can: Render sets
// it to this exact service's own configured name ("keto-mentor-api-staging"
// vs "keto-mentor-api"). Mirrors that same check here so this diagnostic
// field is available on staging (where this investigation actually runs)
// while still never reaching real production traffic.
function isProductionDeployment(): boolean {
  const renderServiceName = process.env.RENDER_SERVICE_NAME ?? null;
  if (renderServiceName?.includes("staging")) return false;
  return process.env.NODE_ENV === "production";
}

function debugResolutionDiagnostics(webEvidenceDiagnostics?: InterpretResult["webEvidenceDiagnostics"], resolutionDiagnostics?: InterpretResult["resolutionDiagnostics"]) {
  if (isProductionDeployment()) return {};
  return {
    ...(webEvidenceDiagnostics ? { webEvidenceDiagnostics } : {}),
    ...(resolutionDiagnostics ? { resolutionDiagnostics } : {})
  };
}

function unresolvedResult(input: string, parsed: ParsedNaturalFoodQuery, webEvidenceDiagnostics?: InterpretResult["webEvidenceDiagnostics"], resolutionDiagnostics?: InterpretResult["resolutionDiagnostics"], decisionTrace?: InterpretResult["decisionTrace"]): InterpretResult {
  return {
    input, parsed, foodResolution: "unresolved", selectedFood: null, candidates: [], quantity: null,
    canConfirm: false, confidence: 0, preparation: parsed.preparation, interpretationSource: "deterministic",
    ...(decisionTrace ? { decisionTrace } : {}),
    ...debugResolutionDiagnostics(webEvidenceDiagnostics, resolutionDiagnostics)
  };
}

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
  ml: ["ml", "milliliter", "millilitre"], l: ["l", "liter", "litre", "liters", "litres"],
  // Owner-beta checkpoint (2026-09-13): matches the new counting-unit words
  // natural-food-query.ts now recognizes (fej/gerezd/csokor/szál/csipet) —
  // lets a Food's own curated serving data (if any) satisfy these units the
  // same way "piece"/"cup"/etc. already do; a Food with no matching serving
  // still falls through to AI-estimate/confirmation exactly as before, never
  // silently invents a weight.
  head: ["head", "heads", "fej", "kopf", "kopfe"], clove: ["clove", "cloves", "gerezd", "zehe", "zehen"],
  bunch: ["bunch", "bunches", "csokor", "bund", "bunde"], stalk: ["stalk", "stalks", "szal", "stange", "stangen"],
  pinch: ["pinch", "pinches", "csipet", "prise", "prisen"]
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
    logQuantityAiOutcome("not_configured", provider.id);
    return { status: "unresolved", estimated: false, requiresConfirmation: true, reason: "conversion_missing", aiOutcome: "not_configured" };
  }
  try {
    const estimated = await provider.estimate({ parsed, food });
    if (!estimated) {
      logQuantityAiOutcome("declined", provider.id);
      return { status: "unresolved", estimated: false, requiresConfirmation: true, reason: "conversion_missing", aiOutcome: "declined" };
    }
    const valid = validateQuantityEstimate(estimated);
    logQuantityAiOutcome("estimated", provider.id, undefined, valid.estimationMethodClass);
    return {
      status: "resolved", grams: parsed.quantity * valid.gramsPerUnit, gramsPerUnit: valid.gramsPerUnit,
      method: valid.method, confidence: valid.confidence, estimated: true, requiresConfirmation: true, provenance: valid.provenance,
      rangeGrams: valid.rangeGramsPerUnit ? { min: parsed.quantity * valid.rangeGramsPerUnit.min, max: parsed.quantity * valid.rangeGramsPerUnit.max } : undefined,
      aiOutcome: "estimated", estimationClass: valid.estimationClass, estimationMethodClass: valid.estimationMethodClass,
      // Describes ONE unit's physical composition (one plate's worth), so it
      // is never scaled by the user's quantity the way grams/rangeGrams are.
      volumeModel: valid.volumeModel
    };
  } catch (error) {
    const aiOutcome: AiQuantityOutcome = error instanceof AiProviderError && error.code === "timeout" ? "timeout" : "invalid_output";
    const providerCode = error instanceof AiProviderError ? error.code : undefined;
    const httpStatus = error instanceof AiProviderError ? error.httpStatus : undefined;
    logQuantityAiOutcome(aiOutcome, provider.id, providerCode, undefined, httpStatus);
    return { status: "unresolved", estimated: false, requiresConfirmation: true, reason: "conversion_missing", aiOutcome };
  }
}

/**
 * Category-only production observability for the quantity AI fallback: no
 * meal text, food name, tokens, keys or provider payloads — just which typed
 * outcome occurred, for which configured provider, so a real production
 * failure mode (e.g. free-tier truncation vs. genuine timeout) is visible in
 * Render logs without exposing anything private.
 */
function logQuantityAiOutcome(outcome: AiQuantityOutcome, providerId: string, providerErrorCode?: string, methodClass?: string, httpStatus?: number) {
  console.log(`quantity_ai outcome=${outcome} provider=${providerId}${methodClass ? ` class=${methodClass}` : ""}${providerErrorCode ? ` providerError=${providerErrorCode}` : ""}${httpStatus != null ? ` status=${httpStatus}` : ""}`);
}

function servingPriority(serving: Serving) {
  const method = servingMethod(serving);
  return method === "authoritative" ? 0 : method === "curated" ? 1 : 2;
}

async function interpretOne(
  prisma: SearchablePrisma,
  input: string,
  parsed: ParsedNaturalFoodQuery,
  provider: QuantityEstimationProvider,
  dynamic: DynamicResolutionDeps = null
): Promise<InterpretResult> {
  const baseCandidates = await timeStage("local_search", async () => (await searchFoods(prisma, parsed.foodQuery, 8)) as unknown as ResolvedFood[]);

  let preparedFood: ResolvedFood | null = null;
  const prepSearchToken = parsed.preparation ? PREP_SEARCH_TOKEN[parsed.preparation] : undefined;
  if (prepSearchToken) {
    const prepCandidates = await timeStage("local_search", async () => (await searchFoods(prisma, prepSearchToken, 8)) as unknown as ResolvedFood[]);
    const prepCandidate = prepCandidates.find((food) => foodMatchesPreparation(food, parsed.preparation!)) ?? null;
    // Owner-reported checkpoint (2026-09-16) — real, reproduced bug: this
    // lookup exists ONLY for the narrow "fried/scrambled/boiled EGG" catalog
    // gap (PREP_SEARCH_TOKEN is entirely egg-specific), meant to catch bare
    // Hungarian preparation-word shorthand for an egg dish ("sült" alone ->
    // fried egg). It was being trusted unconditionally whenever the BASE
    // foodQuery search came up empty — so "sült oldalas" (fried ribs), "sült
    // hal" (fried fish) and "sült csirke" (fried chicken) were all silently
    // "resolved" as Fried egg, since the local catalog has no "oldalas"/
    // "hal"/"csirke" entry and nothing re-checked that the user's ACTUAL
    // stated food word (oldalas/hal/csirke) has anything to do with eggs. A
    // confident wrong identity is worse than an honest unresolved/
    // confirmation_required result. Only trust this shortcut when either (a)
    // no distinct food noun was stated at all beyond the bare preparation
    // word itself (isBarePreparationToken — the genuinely-intended
    // shorthand), or (b) the stated foodQuery is actually attested in the
    // candidate's own full identity vocabulary. (b) deliberately checks
    // `searchText` (name + names + SYNONYMS, all languages) rather than just
    // `foodNameRepresentations` (name/names only): "tojásból rántotta"'s
    // foodQuery ("tojas") never appears in Scrambled Egg's own display names
    // ("Rántotta"/"Rührei"), only in its synonym list ("tojásrántotta") —
    // still genuine evidence the query means egg, just not in the display
    // name. Anything else (a real, distinct, unrelated food word — oldalas/
    // hal/csirke) must fall through to genuine local/dynamic resolution
    // against what the user actually said, never be silently reinterpreted
    // as egg.
    if (prepCandidate) {
      const normalizedQuery = normalizeSearch(parsed.foodQuery);
      const candidateVocabulary = normalizeSearch(prepCandidate.searchText || prepCandidate.name);
      if (isBarePreparationToken(normalizedQuery) || hasSemanticCoverage(normalizedQuery, [candidateVocabulary])) {
        preparedFood = prepCandidate;
      }
    }
  }

  const candidates = preparedFood
    ? [preparedFood, ...baseCandidates.filter((food) => food.id !== preparedFood!.id)]
    : baseCandidates;

  const top = candidates[0] ?? null;
  if (!top) {
    // A genuine local miss (deterministic search AND the prepared-form
    // lookup both found nothing) — the one place dynamic external
    // resolution may run. A local hit never reaches this branch at all, so
    // it costs zero external calls and zero extra LLM calls by construction.
    if (dynamic && parsed.foodQuery) {
      const outcome = await timeStage("dynamic_resolution", () => resolveDynamicFood(dynamic.prisma, { foodQuery: parsed.foodQuery, preparation: parsed.preparation }, dynamic));
      if (outcome.status === "resolved") {
        const resolvedFood = outcome.food as ResolvedFood;
        // Convergence gate (defense-in-depth, owner-beta blocker #3,
        // 2026-09-10; CENTRALIZED into resolveFromSearchTerm 2026-09-17 —
        // see dynamic-food-resolution.ts's own doc): a "resolved" outcome
        // here has ALREADY been re-verified against the ORIGINAL identity
        // (parsed.foodQuery) inside resolveDynamicFood itself — a rejected
        // candidate now falls through to the same web-evidence/AI-estimate
        // chain a genuine miss gets, rather than reaching here at all. No
        // separate re-check is needed (or safe to duplicate: re-deriving it
        // here would silently diverge from the centralized one again,
        // exactly the bug this centralization fixes).
        const quantity = await timeStage("quantity_resolution", () => resolveQuantity(parsed, resolvedFood, provider));
        return {
          input, parsed, foodResolution: "resolved", selectedFood: resolvedFood, candidates: [resolvedFood], quantity,
          canConfirm: quantity.status === "resolved" && !quantity.requiresConfirmation,
          confidence: 1, preparation: parsed.preparation, interpretationSource: "deterministic",
          ...debugResolutionDiagnostics(undefined, outcome.resolutionDiagnostics)
        };
      }
      if (outcome.status === "confirmation_required") {
        return {
          input, parsed, foodResolution: "confirmation_required", selectedFood: null, candidates: [], quantity: null,
          canConfirm: false, confidence: 0, preparation: parsed.preparation, interpretationSource: "deterministic",
          externalCandidates: outcome.candidates, externalCandidatesReason: outcome.reason
        };
      }
      if (outcome.status === "ai_estimate_pending") {
        return aiEstimatePendingResult(input, parsed, outcome, dynamic.userId);
      }
      if (outcome.status === "unresolved") {
        return unresolvedResult(input, parsed, outcome.webEvidenceDiagnostics, outcome.resolutionDiagnostics, outcome.decisionTrace);
      }
    }
    return unresolvedResult(input, parsed);
  }

  const score = top.match?.score ?? 0;
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
  // Owner-beta checkpoint (2026-09-15): a trusted local match must not win
  // merely because it is already cached — see localFormMismatch. Only
  // relevant when a REAL (non-disabled) semantic gate is actually
  // configured — without one, skipping the local match has nowhere safe to
  // fall through to (a disabled gate approves nothing) and would just
  // regress a perfectly good, zero-cost local/confirmed-alias match to a
  // wasted call or an outright miss.
  const hasRealSemanticGate = !!dynamic?.semanticCandidateGateProvider && dynamic.semanticCandidateGateProvider.id !== "disabled";
  const localFormMismatched = !!top.match && isTrustedLocalMatch(top.match) && hasRealSemanticGate
    && localFormMismatch(top.originalName ?? top.name, { rawIngredient: input }, top.match);
  const locallyTrusted = !!top.match && isTrustedLocalMatch(top.match) && !localFormMismatched;

  // Owner-beta checkpoint (2026-09-13): the ingredient-resolution forensic
  // trace proved a WEAK local partial match (e.g. "zsír" scoring low enough
  // to need confirmation) previously short-circuited resolution entirely —
  // dynamic external resolution is only ever attempted from the `!top`
  // branch above, so any nonzero-score local candidate, however weak,
  // permanently prevented the (potentially much better) search-intent/
  // authoritative-search/semantic-gate chain from ever running. This
  // doesn't automatically prefer either source: the WEAK local candidate is
  // kept as a fallback candidate, and dynamic resolution is additionally
  // attempted; a genuine dynamic "resolved" (stronger evidence — an actual
  // verified authoritative match) wins, a dynamic "confirmation_required"
  // offers the external candidates instead of the weak local one (more
  // actionable evidence for the user), and a dynamic "unresolved" leaves
  // the existing weak-local-match behavior completely unchanged (never
  // regresses to worse than before this checkpoint). Scoped narrowly to the
  // plain weak-match case — prepUnavailable/ambiguous keep their own
  // pre-existing, unrelated handling below, untouched.
  if (!locallyTrusted && !prepUnavailable && !ambiguous && dynamic && parsed.foodQuery) {
    let fallbackDiagnostics: ReturnType<typeof debugResolutionDiagnostics> = {};
    let weakMatchDecisionTrace: InterpretResult["decisionTrace"];
    const outcome = await timeStage("dynamic_resolution", () => resolveDynamicFood(dynamic.prisma, { foodQuery: parsed.foodQuery, preparation: parsed.preparation }, dynamic));
    if (outcome.status === "resolved") {
      // Convergence gate now CENTRALIZED into resolveDynamicFood itself (see
      // dynamic-food-resolution.ts's own doc) — a "resolved" outcome here
      // has already been re-verified against the user's original phrase,
      // and a rejected candidate has already been given its own chance at
      // web-evidence/AI-estimate before ever falling through to "unresolved"
      // below. No separate re-check needed here.
      const resolvedFood = outcome.food as ResolvedFood;
      const quantity = await timeStage("quantity_resolution", () => resolveQuantity(parsed, resolvedFood, provider));
      return {
        input, parsed, foodResolution: "resolved", selectedFood: resolvedFood, candidates: [resolvedFood], quantity,
        canConfirm: quantity.status === "resolved" && !quantity.requiresConfirmation,
        confidence: 1, preparation: parsed.preparation, interpretationSource: "deterministic",
        ...debugResolutionDiagnostics(undefined, outcome.resolutionDiagnostics)
      };
    } else if (outcome.status === "confirmation_required") {
      return {
        input, parsed, foodResolution: "confirmation_required", selectedFood: null, candidates, quantity: null,
        canConfirm: false, confidence: score / 100, preparation: parsed.preparation, interpretationSource: "deterministic",
        externalCandidates: outcome.candidates, externalCandidatesReason: outcome.reason
      };
    } else if (outcome.status === "ai_estimate_pending") {
      return aiEstimatePendingResult(input, parsed, outcome, dynamic.userId);
    } else {
      fallbackDiagnostics = debugResolutionDiagnostics(outcome.webEvidenceDiagnostics, outcome.resolutionDiagnostics);
      weakMatchDecisionTrace = outcome.decisionTrace;
    }
    // "unresolved" (now only ever a GENUINE miss — local, USDA/OFF,
    // web-evidence, AND AI-estimate all tried) falls through to the
    // existing weak-local-match handling below — the local candidate
    // remains the best available evidence.
    if (Object.keys(fallbackDiagnostics).length || weakMatchDecisionTrace) {
      const quantity = await timeStage("quantity_resolution", () => resolveQuantity(parsed, top, new DisabledQuantityEstimationProvider()));
      return {
        input, parsed, foodResolution: score >= 80 ? "preview" : "confirmation_required", selectedFood: top, candidates, quantity,
        canConfirm: false, confidence: score / 100, preparation: parsed.preparation, interpretationSource: "deterministic",
        ...(weakMatchDecisionTrace ? { decisionTrace: weakMatchDecisionTrace } : {}),
        ...fallbackDiagnostics
      };
    }
  }

  let foodResolution: FoodResolutionStatus;
  if (prepUnavailable) foodResolution = "confirmation_required";
  else if (ambiguous) foodResolution = "confirmation_required";
  else if (locallyTrusted) foodResolution = "resolved";
  else if (score >= 80) foodResolution = "preview";
  else foodResolution = "confirmation_required";

  const quantity = await timeStage("quantity_resolution", () => resolveQuantity(parsed, top, foodResolution === "resolved" ? provider : new DisabledQuantityEstimationProvider()));

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
  provider: QuantityEstimationProvider = new DisabledQuantityEstimationProvider(),
  dynamic: DynamicResolutionDeps = null
): Promise<InterpretResult> {
  const parsed = parseNaturalFoodQuery(text);

  if (parsed.items && parsed.items.length > 1) {
    // Bounded concurrency (owner-beta performance principle): independent
    // items resolve in parallel for latency, but never more than
    // DEFAULT_CONCURRENCY at once — an unbounded Promise.all here could fire
    // one search-intent/semantic-gate/quantity AI call per item simultaneously
    // on a meal with several local misses, exactly the kind of provider burst
    // that has repeatedly triggered Groq/OpenRouter 429s in this project.
    const items = await mapWithConcurrency(parsed.items, DEFAULT_CONCURRENCY, (item) => interpretOne(prisma, text, item, provider, dynamic));
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

  return interpretOne(prisma, text, parsed, provider, dynamic);
}

// Owner-beta (2026-09-14): "weak_match" is the one externalCandidatesReason
// that does NOT represent an exact-identity match — see external-food.ts:
// it fires specifically when the top dynamic candidate's matchPolicy isn't
// exact_normalized_name (a token-similar result, never a confirmed
// identity), the weakest signal dynamic resolution can produce. Treating it
// as "already a complete, meaningful outcome" — the same bar "ambiguous"
// (an exact-name match, just low-confidence or tied) and "possible_duplicate"
// (a genuine near-identical existing Food) correctly clear — blocked
// AI-assisted compound-dish classification entirely for any phrase whose
// bare name happens to token-overlap an unrelated USDA/BLS row (proven live:
// "halászlé" got a weak fish-product match and never reached the AI at all).
// ambiguous/possible_duplicate keep skipping AI fallback exactly as before —
// both required an exact-name match, which IS meaningful evidence AI
// reclassification must not silently discard (see the "2 tányér
// marhahúsleves" precedent below, a similar but stronger case).
function hasStrongExternalCandidateSignal(result: InterpretResult): boolean {
  const isStrong = (reason?: "ambiguous" | "possible_duplicate" | "weak_match") => !!reason && reason !== "weak_match";
  if (result.externalCandidates?.length && isStrong(result.externalCandidatesReason)) return true;
  return !!result.items?.some((item) => item.externalCandidates?.length && isStrong(item.externalCandidatesReason));
}

// FINAL FALLBACK: AI-ESTIMATED NUTRITION duplicate-resolution fix
// (2026-09-19) — real Render staging logs proved a valid ai_estimate_pending
// result was being silently discarded: local+authoritative+web-evidence all
// missed, ai_nutrition_estimation succeeded, dynamic_food_resolution logged
// status=ai_estimate_pending — and THEN this function ran anyway (because an
// ai_estimate_pending result has selectedFood:null and confidence:0, which
// the old logic read as "still needs understanding"), triggering a second,
// redundant food-understanding pass whose own re-run of interpretOne could
// invoke the ENTIRE dynamic-resolution chain again for the same food,
// burning a second AI_ESTIMATE_RATE_LIMIT token (of only 3 per 15 minutes)
// and sometimes replacing the perfectly good estimate with "unresolved" when
// that second attempt failed. A successful ai_estimate_pending is already
// the terminal outcome for this tier (every earlier source already ran) and
// must be treated exactly like an already-resolved trusted match below —
// never as a "needs more understanding" signal.
function isSettledAiEstimate(item: InterpretResult): boolean {
  return item.foodResolution === "ai_estimate_pending";
}

function shouldUseAiFallback(result: InterpretResult, aiProvider: AiProvider) {
  if (!aiProvider.supports("food_nlp")) return false;
  if (result.ambiguous) return false;
  // A pending external-candidate confirmation is already a complete,
  // meaningful outcome — food-understanding AI reinterpretation must never
  // silently discard it and start over. See hasStrongExternalCandidateSignal
  // for why a mere weak_match does NOT count as that outcome.
  if (hasStrongExternalCandidateSignal(result)) return false;
  // Prepared-dish routing audit (2026-09-19): the single-item terminal case
  // used to short-circuit here unconditionally (see isSettledAiEstimate's
  // own doc for why that guard exists — a real, separate bug about wasted
  // re-resolution). But that also meant a bare single-word phrase like
  // "gulyásleves" could NEVER reach food-understanding at all once its own
  // deterministic per-item resolution (interpretOne -> resolveDynamicFood)
  // happened to reach AI-estimation first — live-proven root cause of ALL
  // SIX tested prepared dishes silently skipping recipe discovery entirely
  // (findEligibleDiscoveryTarget requires semantic.kind === "compound_dish",
  // which only food-understanding AI ever sets). Falling through here now
  // lets food-understanding run for that case too, purely to give a genuine
  // compound-dish classification a chance — interpretAiUnderstanding below
  // REUSES the already-settled deterministic result instead of re-resolving
  // it (see its own doc), so this costs exactly one extra food_nlp call
  // (25/15min budget) and NEVER a second AI-estimate/search/web-evidence
  // call. The multi-item branch immediately below is unaffected: a genuine
  // multi-item deterministic result's top-level foodResolution is always
  // "multi", never "ai_estimate_pending", so isSettledAiEstimate(result)
  // here only ever applied to the true single-item case anyway.
  if (result.items?.length) {
    // A multi-item child that already reached its own terminal
    // ai_estimate_pending counts as settled too — same reasoning as the
    // single-item case above, extended per-item. A MIXED result (one
    // settled ai_estimate_pending child alongside another item that
    // genuinely still needs understanding) still returns true here, since
    // `every` fails on the unsettled sibling — interpretMealInput's own
    // post-processing (preserveAiEstimatePendingChildren) is what protects
    // the already-settled child from being overwritten by that necessary
    // re-run, rather than suppressing the re-run itself.
    return !result.items.every((item) => (item.selectedFood && item.confidence >= 0.8 && !item.preparationUnavailable) || isSettledAiEstimate(item));
  }
  if (result.selectedFood && result.confidence >= 0.95 && !result.preparationUnavailable) return false;
  return result.foodResolution === "unresolved" || result.confidence < 0.95 || !!result.preparationUnavailable;
}

// Guards the MIXED multi-item case identified above: when the deterministic
// pass already settled one or more child items as a valid ai_estimate_pending
// (each carrying its own already-spent AI_ESTIMATE_RATE_LIMIT token and
// signed proof) but another sibling genuinely needed the food-understanding
// AI re-run, that re-run re-derives its OWN items from scratch via a fresh
// AI classification of the whole phrase — it has no knowledge of which food
// was already settled, so it can (and in the reproduced bug, did) re-attempt
// dynamic resolution for that same food and overwrite a good estimate with a
// worse one (or unresolved). This restores any deterministic
// ai_estimate_pending child, matched to the AI-assisted result's own items by
// normalized identity text, whenever the AI-assisted pass produced a
// DIFFERENT (non-ai_estimate_pending) outcome for that same food — i.e. only
// ever recovers a result that would otherwise have been silently downgraded,
// never overrides a re-run that itself also reached (or improved on)
// ai_estimate_pending. Deliberately narrow: an ambiguous match (two
// deterministic pending items normalizing to the same key, or no
// corresponding item found at all — e.g. the AI regrouped/merged items
// differently) is left unmerged rather than guessed at.
function preserveAiEstimatePendingChildren(deterministic: InterpretResult, aiAssisted: InterpretResult): InterpretResult {
  if (!deterministic.items?.length || !aiAssisted.items?.length) return aiAssisted;
  const pendingByKey = new Map<string, InterpretResult | null>();
  for (const item of deterministic.items) {
    if (!isSettledAiEstimate(item)) continue;
    const key = normalizeSearch(item.parsed.foodQuery);
    pendingByKey.set(key, pendingByKey.has(key) ? null : item);
  }
  if (!pendingByKey.size) return aiAssisted;
  let changed = false;
  const mergedItems = aiAssisted.items.map((newItem) => {
    const key = normalizeSearch(newItem.semanticItem?.originalText ?? newItem.parsed.foodQuery);
    const original = pendingByKey.get(key);
    if (original && !isSettledAiEstimate(newItem)) {
      changed = true;
      return original;
    }
    return newItem;
  });
  return changed ? { ...aiAssisted, items: mergedItems } : aiAssisted;
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
  aiProvider: AiProvider,
  dynamic: DynamicResolutionDeps = null,
  // Prepared-dish routing audit (2026-09-19): only ever passed when
  // shouldUseAiFallback let a SETTLED single-item ai_estimate_pending
  // deterministic result through (see that function's own doc) — i.e. this
  // is the exact InterpretResult whose own resolveDynamicFood chain already
  // spent an AI_ESTIMATE_RATE_LIMIT token. Used below to detect the one
  // semantic item that names the SAME identity, so it can be reused as-is
  // instead of re-resolved — never to change classification/routing itself.
  settledDeterministic: InterpretResult | undefined = undefined
): Promise<InterpretResult> {
  // Some providers occasionally label "a plate/bowl of X + Y" as a flat
  // multi-food list even though the primary plated/bowled item is clearly a
  // prepared-dish portion. Promote that STRUCTURE (not any food name) so the
  // dish remains eligible for recipe resolution while Y stays an explicit
  // sibling meal item.
  const platedDishItem = !understanding.dishName && understanding.items.length > 1
    ? understanding.items.find((item) => item.unit === "plate" || item.unit === "bowl")
    : undefined;
  const effectiveDishName = understanding.dishName ?? platedDishItem?.canonicalName;
  const effectiveKind = platedDishItem ? "compound_dish" : understanding.kind;
  const dishNormalized = normalizeSearch(effectiveDishName ?? "");
  const HOUSEHOLD_CONTAINER_NAMES = new Set(["plate", "tanyer", "tányér", "teller", "bowl", "tal", "tál", "schussel", "schüssel", "cup", "csesze", "csésze", "tasse", "glass", "pohar", "pohár", "glas", "mug", "bogre", "bögre"]);
  const containerItem = effectiveKind === "compound_dish"
    ? understanding.items.find((item) => HOUSEHOLD_CONTAINER_NAMES.has(normalizeSearch(item.canonicalName)))
    : undefined;
  const cleanedItems = containerItem ? understanding.items.filter((item) => item !== containerItem) : understanding.items;
  const inferredDishQuantity = understanding.dishQuantity ?? platedDishItem?.quantity ?? containerItem?.quantity;
  const inferredDishUnit = understanding.dishUnit ?? platedDishItem?.unit ?? (containerItem ? ((HOUSEHOLD_CONTAINER_NAMES.has(normalizeSearch(containerItem.canonicalName)) ? normalizeSearch(containerItem.canonicalName) : containerItem.unit) as FoodUnderstanding["dishUnit"]) : undefined);
  const normalizedDishUnit = ({ tanyer: "plate", tányér: "plate", teller: "plate", tal: "bowl", tál: "bowl", schussel: "bowl", schüssel: "bowl", csesze: "cup", csésze: "cup", tasse: "cup", pohar: "cup", pohár: "cup", glas: "cup", bogre: "cup", bögre: "cup" } as Record<string, FoodUnderstanding["dishUnit"]>)[String(inferredDishUnit)] ?? inferredDishUnit;
  const hasDishItem = !!dishNormalized && cleanedItems.some((item) => normalizeSearch(item.canonicalName) === dishNormalized);
  // Owner-beta blocker (2026-09-12): when the user explicitly stated the
  // dish's FULL composition ("a következőkből" / "bestehend aus" / "made
  // from" / ...), the AI sets dishIsComposition — the dish name is a group
  // LABEL for the items that already follow it, not an independent food, and
  // must never be synthesized as an extra item on top of its own listed
  // ingredients (that would double-count the dish: once as itself, once as
  // the sum of its parts). Without an explicit composition cue, the prior
  // behavior is unchanged — a named dish mentioned alongside a few add-ons
  // (not fully defined by them) still gets its own resolution attempt.
  const semanticItems = hasDishItem || !effectiveDishName || understanding.dishIsComposition
    ? cleanedItems
    : [{
        originalText: effectiveDishName,
        canonicalName: effectiveDishName,
        quantity: inferredDishQuantity,
        unit: normalizedDishUnit,
        evidence: "explicit" as const,
        confidence: understanding.confidence
      }, ...cleanedItems];
  // Bounded concurrency (owner-beta performance principle): each explicit
  // item's own resolution is independent of the others (its own local
  // search, and on a miss its own search-intent/semantic-gate/quantity AI
  // calls) — resolving them one at a time was a real, measured latency
  // multiplier on any multi-ingredient compound dish (e.g. a mixed salad
  // with several ingredients each needing their own resolution). Same
  // DEFAULT_CONCURRENCY cap as the deterministic multi-item path, so the two
  // paths cannot drift into different burst-risk behavior.
  // Prepared-dish routing audit (2026-09-19): the ONE semantic item (if any)
  // naming the exact same identity the deterministic pass already settled
  // via a real AI nutrition estimate — reusing it below means the AI_ESTIMATE_
  // RATE_LIMIT token it already spent is never spent again just to let
  // classification see the phrase. Only single-item settled results ever
  // reach here (see shouldUseAiFallback/interpretMealInput's call site) — a
  // multi-item deterministic result's top-level foodResolution is always
  // "multi", never "ai_estimate_pending".
  const settledKey = settledDeterministic && !settledDeterministic.items?.length && isSettledAiEstimate(settledDeterministic)
    ? normalizeSearch(settledDeterministic.parsed.foodQuery) : undefined;
  const items = await mapWithConcurrency(semanticItems, DEFAULT_CONCURRENCY, async (item) => {
    if (item.evidence !== "explicit") return unresolvedSemanticItem(text, item);
    // A named prepared dish is resolved by the recipe layer. Never send its
    // whole identity through food nutrition estimation, even on a cache miss.
    if (effectiveKind === "compound_dish" && !understanding.dishIsComposition
      && normalizeSearch(item.canonicalName) === dishNormalized && dynamic) {
      return unresolvedSemanticItem(text, item);
    }
    if (settledKey && normalizeSearch(item.canonicalName) === settledKey) {
      return {
        ...settledDeterministic!,
        interpretationSource: "ai_assisted" as const,
        semanticItem: item,
        nutritionEligible: false
      };
    }
    const resolved = await interpretOne(prisma, item.originalText, semanticParsed(item), quantityProvider, dynamic);
    return {
      ...resolved,
      interpretationSource: "ai_assisted" as const,
      semanticItem: item,
      nutritionEligible: !!resolved.selectedFood && resolved.foodResolution === "resolved"
    };
  });
  const metadata = {
    language: understanding.language,
    kind: effectiveKind,
    dishName: effectiveDishName,
    dishQuantity: inferredDishQuantity,
    dishUnit: normalizedDishUnit,
    clarificationNeeded: understanding.clarificationNeeded,
    clarificationReason: understanding.clarificationReason
  };
  const ai = { provider: aiProvider.id, model: aiProvider.model, confidence: understanding.confidence };
  // Trusted-match precedence: AI classifying a phrase as a compound/prepared
  // dish is a real, useful signal (rakott krumpli, lecsó, ...) — but it must
  // not discard an identity the deterministic item-level search already
  // resolved with genuine strength ("resolved" tier requires an exact name
  // match or a trusted/coverage-verified alias — see food-search.ts, never a
  // weak partial-token match). Real production case (2026-09-10): "2 tányér
  // marhahúsleves" already had a correct, previously-confirmed trusted Food;
  // classifying the phrase as compound_dish buried that answer behind a
  // clarification flow instead of letting the user confirm what the system
  // already knew. Scoped narrowly to a single explicit item — a genuine
  // multi-item or multi-food phrase still goes through the compound/multi
  // path below unchanged.
  const singleStrongMatch = items.length === 1 && items[0].foodResolution === "resolved" && !!items[0].selectedFood;
  if ((effectiveKind === "single_food" || singleStrongMatch) && items.length === 1) {
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
    foodResolution: effectiveKind === "compound_dish" ? "compound" : "multi",
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
  aiProvider: AiProvider = new StubAiProvider(),
  dynamic: DynamicResolutionDeps = null,
  onProgress?: (stage: ProgressStage) => void
): Promise<InterpretResult> {
  const requestStartedAt = performance.now();
  // Resolve food semantics before allowing any external weight estimation.
  const disabled = new DisabledQuantityEstimationProvider();
  onProgress?.("local_food_search");
  // Classify unknown input before a dynamic resolver can estimate nutrition.
  // Trusted simple local foods keep their zero-AI fast path. Ingredient import
  // uses a disabled understanding provider and retains its existing resolver.
  const classifyFirst = !!dynamic && aiProvider.supports("food_nlp");
  const deterministic = await timeStage("deterministic_pass", () => interpretDeterministically(prisma, text, disabled, classifyFirst ? null : dynamic));
  let result = deterministic;
  if (shouldUseAiFallback(deterministic, aiProvider)) {
    try {
      onProgress?.("food_understanding");
      const understanding = await timeStage("food_understanding_ai", () => understandFood(aiProvider, { text }));
      result = await timeStage("ai_assisted_items", () => interpretAiUnderstanding(prisma, text, understanding, disabled, aiProvider, dynamic, deterministic));
      result = preserveAiEstimatePendingChildren(deterministic, result);
    } catch (error) {
      // Owner-beta (2026-09-12): previously silent — indistinguishable from
      // "the AI genuinely classified this as simple/already-resolved". Both
      // ai_failover (per-provider) AND this line together make the real
      // cause traceable: a provider error code if the underlying AiProvider
      // threw one, or "unknown" for anything else — never the raw error
      // message/stack, which could echo back request content.
      const code = error instanceof AiProviderError ? error.code : "unknown";
      console.log(`ai_understanding_fallback outcome=deterministic_only reason=${code}`);
      result = deterministic;
      result.aiUnderstandingFailure = { code };
    }
  }
  if (!result.semantic?.clarificationNeeded && result.foodResolution !== "compound") {
    const pending = (result.items ?? [result]).filter((item) => item.foodResolution === "resolved" && item.selectedFood && !item.ambiguous && !item.preparationUnavailable && item.nutritionEligible !== false);
    // Only a genuine AI quantity estimate (conversion_missing) is real work
    // worth announcing — an already-resolved trusted serving needs no
    // further stage, matching this loop's own inner condition exactly.
    if (pending.some((item) => item.quantity?.reason === "conversion_missing")) onProgress?.("quantity_resolution");
    // Same bounded-concurrency reasoning as the resolution passes above —
    // several items each needing their own AI quantity estimate (e.g. a
    // multi-ingredient salad) must not be estimated one at a time.
    await timeStage("quantity_postprocess", () => mapWithConcurrency(pending, DEFAULT_CONCURRENCY, async (item) => {
      if (item.quantity?.reason === "conversion_missing") item.quantity = await timeStage("quantity_resolution", () => resolveQuantity(item.parsed, item.selectedFood!, quantityProvider));
      item.canConfirm = item.quantity?.status === "resolved" && !item.quantity.requiresConfirmation;
    }));
    if (result.items) result.canConfirm = result.items.every((item) => item.canConfirm);
  }
  result.clarification = firstQuantityClarification(result);
  console.log(`timing_stage stage=TOTAL ms=${Math.round(performance.now() - requestStartedAt)}`);
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
      rangeGrams: quantity.rangeGrams, confidence: quantity.confidence, method: quantity.method === "ai_estimated" ? "ai_estimated" : "estimated",
      basis: quantity.estimationClass
    };
    return { type: "grams_required", itemIndex, allowCustomGrams: true };
  }
}
