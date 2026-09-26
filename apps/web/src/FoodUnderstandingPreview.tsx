import { useState } from "react";
import type { Lang } from "./i18n";
import { CheckCircle2, CircleDashed, Sparkles } from "lucide-react";
import { pickDisplayName } from "./food-display-name";
import type { ApiState } from "./api";
import { PortionPhoto } from "./PortionPhoto";

export type ExternalCandidate = {
  source: "usda_fdc" | "open_food_facts";
  sourceId: string;
  name: string;
  originalName: string;
  names?: Partial<Record<Lang, string>>;
  category?: string;
  confidence: number;
};

// Owner-reported UX bug fix (2026-09-19): a LOCAL/catalog `preview` or
// `confirmation_required` result already carries real, trustworthy Food
// candidates (the exact same shape FoodCombobox's own search results and the
// existing selectedFood state use) — but nothing ever rendered them, so the
// user only ever saw "review and choose the right food" with nothing visible
// to actually choose. Deliberately distinct from ExternalCandidate: an
// ExternalCandidate is an UNCONFIRMED USDA/OpenFoodFacts row that still needs
// a server-side confirm call (see ExternalCandidateList's own doc) before it
// has real nutrition, whereas a CandidateFood is already a persisted, real
// Food row with genuine macros — selecting one needs no confirmation
// round-trip at all, it goes straight into the pre-existing selected-food +
// manual-quantity flow, exactly like a manual catalog search pick.
export type CandidateFood = {
  id: string;
  name: string;
  originalName?: string;
  names?: Partial<Record<Lang, string>>;
  category?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
};

// FINAL FALLBACK: AI-ESTIMATED NUTRITION (2026-09-18 frontend wiring) —
// mirrors apps/api/src/meal-input/interpret.ts's own
// `AiNutritionEstimate & { requestedIdentity, canonicalIdentity, proof }`
// exactly. `proof` is opaque to this component — it is only ever echoed back
// verbatim in the accept payload; the server re-verifies every numeric field
// against it before persisting anything (see ai-estimate-proof.ts). Editing
// any macro invalidates the proof by design, which is exactly why the
// override path below never tries to resubmit it.
export type AiEstimateValue = {
  canonicalFoodName: string;
  localizedFoodName?: string;
  basisGrams: 100;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  optional?: { sugarPer100g?: number; saturatedFatPer100g?: number; saltPer100g?: number };
  confidence: "low" | "medium";
  assumptions: string;
  preparationState?: string;
  identityConfidence: "low" | "medium" | "high";
  requestedIdentity: string;
  canonicalIdentity: string;
  proof: string;
};

// Exactly apps/api's aiEstimateMealItemSchema — the ONLY payload shape the
// server accepts for an as-generated acceptance.
export type AiEstimateAcceptPayload = {
  aiEstimateProof: string; requestedIdentity: string; canonicalFoodName: string;
  kcalPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number; fiberPer100g: number;
  quantityGrams: number;
};

// Exactly apps/api's manualMealItemSchema (source defaults server-side to
// "user_input") — the EXISTING manual-entry contract, reused rather than
// inventing a new one, since the signed proof cannot cover edited numbers.
export type AiEstimateOverridePayload = {
  foodName: string; quantityGrams: number;
  kcalPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number; fiberPer100g: number;
};

// Owner-beta (2026-09-12) — a bounded, display-only projection of the API's
// RecipeDiscoveryPreview (see recipes/recipe-discovery.ts). Never carries
// arbitrary webpage content or AI-invented nutrition: nutritionPer100g is
// only ever the value the server itself already computed from trusted
// ingredient Food records × quantities.
export type RecipeBlockingReason = "food_not_found" | "food_needs_confirmation" | "ai_estimate_only" | "quantity_missing";
export type RecipeIngredientValue = {
  originalText: string; parsedFoodQuery: string; status: string; quantityGrams?: number; aiEstimate?: AiEstimateValue;
  resolvedFood: { id?: string; name: string; source: string; sourceId?: string | null; names?: Record<string, string> } | null;
  localCandidates?: { id: string; name: string; source: string }[];
  externalCandidates?: ExternalCandidate[];
  trustedNutritionReady?: boolean;
  blockingReason?: RecipeBlockingReason;
};
// Mirrors @keto-mentor/shared's recipeIngredientOverrideSchema; the server
// applies these to its own re-derived ingredient list when saving.
export type RecipeIngredientOverride =
  | { ingredientIndex: number; action: "exclude" }
  | { ingredientIndex: number; action: "grams"; grams: number }
  | { ingredientIndex: number; action: "food"; foodId: string; grams?: number };

export type RecipeDiscoveryCandidateValue = {
  title: string;
  instructions?: string[];
  ingredients?: RecipeIngredientValue[];
  domain: string;
  sourceUrl: string;
  servings?: number;
  extractionMethod: "schema_org_json_ld" | "ai_structured";
  // Owner-beta PR #52 final review (2026-09-13): confirming a JUST-DISCOVERED
  // web recipe into a real meal — as opposed to one the user already owns
  // in their library, see RecipeDetail.tsx's addToMeal — was previously
  // impossible from this natural-language flow at all: the preview only
  // ever showed title+domain, with no importProof/servings/trust-state to
  // act on. Never confirmable unless nutritionCalculable is true (every
  // ingredient reached trusted Food data) — a "reviewable" (partially
  // resolved) candidate must stay display-only, exactly like a fully
  // unresolved one; partial nutrition must never masquerade as complete.
  importProof: string;
  nutritionCalculable: boolean;
};

export type RecipeDiscoveryPreviewValue = {
  status: "confirmation_required" | "unresolved" | "local_match";
  reason?: "disabled" | "rate_limited" | "provider_error" | "no_relevant_results" | "no_fully_resolvable_candidate" | "systemic_error" | "ambiguous_local_matches";
  candidate?: RecipeDiscoveryCandidateValue;
  localMatch?: LocalRecipeOption;
  localAlternatives?: LocalRecipeOption[];
};

// A saved recipe the dish matched without any web search: the user's own
// ("own") or a curated Keto Mentor reference dish ("reference").
export type LocalRecipeOption = { recipeId: string; title: string; source?: "own" | "reference"; servings?: number | null; servingGrams?: number | null };

type PreviewItem = {
  parsed: { quantity?: number; unit?: string; foodQuery: string; preparation?: string };
  selectedFood: { name: string; names?: Partial<Record<Lang, string>> } | null;
  quantity: null | { status: "resolved" | "unresolved"; grams?: number; estimated: boolean };
  preparation?: string;
  semanticItem?: {
    canonicalName: string;
    evidence: "explicit" | "inferred_common";
    modifiers?: string[];
    excludedModifiers?: string[];
  };
  nutritionEligible?: boolean;
  // Present only after a genuine local catalog miss triggered dynamic
  // external resolution and produced a bounded set of authoritative
  // candidates needing the user's choice — never nutrition-first.
  externalCandidates?: ExternalCandidate[];
  // Present only when this item is a prepared/composite dish whose identity
  // needed local-recipe lookup and/or web recipe discovery — see
  // meal-input/recipe-discovery-fallback.ts. Purely informational in this
  // pass: it tells the user truthfully what the system found (or didn't),
  // never silently invents a resolved identity.
  recipeDiscovery?: RecipeDiscoveryPreviewValue;
  // Per-item resolution status (2026-09-18) — a multi-item result's own
  // `items` are each a full backend InterpretResult, so "ai_estimate_pending"
  // can appear on ANY one item independently of the others (see Task F: one
  // item resolved from the catalog, another pending an AI estimate, a third
  // needing external confirmation, all in the SAME preview). Only
  // "ai_estimate_pending" is currently acted on here; every other value is
  // display-only and already covered by the existing trusted/unresolved icon.
  foodResolution?: string;
  aiEstimate?: AiEstimateValue;
  // Owner-reported UX bug fix (2026-09-19): the backend's local-catalog
  // candidate list for a "preview"/"confirmation_required" item (see
  // apps/api/src/meal-input/interpret.ts's InterpretResult.candidates) —
  // rendered by CatalogCandidateList below. Never populated at the same time
  // as externalCandidates (mutually exclusive backend branches).
  candidates?: CandidateFood[];
};

export type FoodUnderstandingPreviewValue = PreviewItem & {
  interpretationSource?: "deterministic" | "ai_assisted";
  canConfirm: boolean;
  confidence?: number;
  foodResolution: string;
  items?: PreviewItem[];
  semantic?: { dishName?: string; clarificationNeeded: boolean; clarificationReason?: string };
  recipeDiscovery?: RecipeDiscoveryPreviewValue;
};

export type FoodUnderstandingLabels = {
  understood: string;
  aiAssisted: string;
  dish: string;
  preparation: string;
  modifiers: string;
  excluded: string;
  inferred: string;
  trusted: string;
  unresolved: string;
  needsDetail: string;
  conversionMissing: string;
  review: string;
  verified: string;
  estimated: string;
  logAll: string;
  preparationValues: Record<string, string>;
  unitValues: Record<string, string>;
  externalSingleHeading: string;
  externalMultipleHeading: string;
  externalSource: string;
  externalConfirm: string;
  externalConfirming: string;
  externalConfirmFailed: string;
  externalSourceNames: Record<string, string>;
  // Owner-reported UX bug fix (2026-09-19): the local-catalog candidate list
  // (see CandidateFood above) — distinct copy from the external* keys since
  // these describe already-real Food rows, not an unconfirmed external match.
  candidatesHeading: string;
  candidateSelect: string;
  recipeDiscovery: {
    localMatch: string;
    referenceMatch: string;
    ambiguousLocal: string;
    ambiguousReference: string;
    sourceOwn: string;
    sourceReference: string;
    servingApprox: string;
    webFound: string;
    webUnresolvedNoResults: string;
    webUnresolvedNoCandidate: string;
    webDisabled: string;
    webRateLimited: string;
    confirmAdd: string;
    confirmAdding: string;
    confirmQuantity: string;
    confirmUnit: string;
    confirmServingUnit: string;
    blockedHeading: string;
    blockingReasons: Record<RecipeBlockingReason, string>;
    fixExclude: string;
    fixUndo: string;
    fixGrams: string;
    fixFood: string;
    fixFoodPlaceholder: string;
    fixExcluded: string;
    fixReady: string;
    fixPending: string;
    fixExternalFailed: string;
    fixUseEstimate: string;
    fixSearch: string;
    fixChosen: string;
    fixNeedsGrams: string;
  };
  aiEstimate: {
    badge: string;
    disclaimer: string;
    kcal: string;
    protein: string;
    fat: string;
    carbs: string;
    fiber: string;
    per100g: string;
    confidenceLabel: string;
    confidenceValues: { low: string; medium: string };
    assumptionsLabel: string;
    quantityLabel: string;
    accept: string;
    accepting: string;
    edit: string;
    cancelEdit: string;
    saveEdited: string;
    decline: string;
  };
};

function recipeDiscoveryText(discovery: RecipeDiscoveryPreviewValue, labels: FoodUnderstandingLabels): string | null {
  if (discovery.status === "local_match") return `${discovery.localMatch?.source === "reference" ? labels.recipeDiscovery.referenceMatch : labels.recipeDiscovery.localMatch} ${discovery.localMatch?.title ?? ""}`.trim();
  if (discovery.status === "confirmation_required") {
    if (discovery.reason === "ambiguous_local_matches") return discovery.localAlternatives?.some((option) => option.source === "reference") ? labels.recipeDiscovery.ambiguousReference : labels.recipeDiscovery.ambiguousLocal;
    return `${labels.recipeDiscovery.webFound} ${discovery.candidate?.title ?? ""}`.trim();
  }
  switch (discovery.reason) {
    case "disabled": return labels.recipeDiscovery.webDisabled;
    case "rate_limited": return labels.recipeDiscovery.webRateLimited;
    case "no_relevant_results": return labels.recipeDiscovery.webUnresolvedNoResults;
    default: return labels.recipeDiscovery.webUnresolvedNoCandidate;
  }
}

function itemName(item: PreviewItem, lang: Lang) {
  return (item.selectedFood ? pickDisplayName(item.selectedFood, lang) : "") || item.semanticItem?.canonicalName || item.parsed.foodQuery;
}

// The interpretation pipeline's preparation value is a small closed set of
// internal English concept keys (see PREPARATION_CONCEPTS in
// natural-food-query.ts) — display-only, never persisted or sent back to
// the API. Falls back to the raw key for a value the label map doesn't
// (yet) cover, rather than silently rendering nothing.
function preparationLabel(preparation: string | undefined, labels: FoodUnderstandingLabels) {
  if (!preparation) return preparation;
  return labels.preparationValues[preparation] ?? preparation;
}

// Same closed-set-of-internal-English-keys situation as preparation above
// (see PREPARATION_CONCEPTS / NaturalQuantityUnit in natural-food-query.ts):
// household units like "plate"/"piece" need a localized word, while metric
// symbols ("g", "kg", "ml", "l", "cm") are already language-neutral and are
// simply absent from unitValues, so they fall through unchanged.
function unitLabel(unit: string | undefined, labels: FoodUnderstandingLabels) {
  if (!unit) return unit;
  return labels.unitValues[unit] ?? unit;
}

function quantityText(quantity: number | undefined, unit: string | undefined, labels: FoodUnderstandingLabels) {
  if (quantity == null) return null;
  return `${quantity} ${unitLabel(unit, labels) ?? ""}`.trim();
}

// Candidates are shown as name + category + source attribution first —
// nutrition numbers are deliberately not the primary way to tell them apart.
function ExternalCandidateList({ candidates, lang, labels, busy, confirmingId, onConfirm }: {
  candidates: ExternalCandidate[]; lang: Lang; labels: FoodUnderstandingLabels; busy: boolean; confirmingId: string | null;
  onConfirm: (candidate: ExternalCandidate) => void;
}) {
  return <div className="external-candidates">
    <strong>{candidates.length > 1 ? labels.externalMultipleHeading : labels.externalSingleHeading}</strong>
    <ul className="external-candidate-list">
      {candidates.map((candidate) => {
        const key = `${candidate.source}:${candidate.sourceId}`;
        const isConfirming = confirmingId === key;
        // The UI language is always the primary presentation (candidate.names[lang]
        // when a localization call produced one); the authoritative English name is
        // never hidden, just demoted to secondary transparency metadata when it
        // differs, so the user never has to understand English to pick a candidate.
        const displayName = pickDisplayName(candidate, lang);
        const originalName = candidate.originalName || candidate.name;
        return <li className="external-candidate" key={key}>
          <div className="external-candidate-copy">
            <span className="external-candidate-name">{displayName}</span>
            {displayName !== originalName && <small className="external-candidate-original">{originalName}</small>}
            {candidate.category && <small className="external-candidate-category">{candidate.category}</small>}
            <small className="external-candidate-source">{labels.externalSource}: {labels.externalSourceNames[candidate.source] ?? candidate.source}</small>
          </div>
          <button type="button" className="btn secondary" disabled={busy} onClick={() => onConfirm(candidate)}>
            {isConfirming ? labels.externalConfirming : labels.externalConfirm}
          </button>
        </li>;
      })}
    </ul>
  </div>;
}

// Owner-reported UX bug fix (2026-09-19): renders the backend's genuine
// local-catalog `candidates[]` for a preview/confirmation_required result —
// never `externalCandidates` (a completely separate, still-unconfirmed list,
// see ExternalCandidateList above). Nutrition is shown (unlike
// ExternalCandidateList, which deliberately omits it) because these are
// already real, persisted Food rows, not unverified external matches —
// selecting one commits to nothing by itself, it only fills in the existing
// selected-food + manual-quantity form, so showing the numbers up front here
// is honest, not premature.
function CatalogCandidateList({ candidates, lang, labels, busy, onSelect }: {
  candidates: CandidateFood[]; lang: Lang; labels: FoodUnderstandingLabels; busy: boolean;
  onSelect: (candidate: CandidateFood) => void;
}) {
  return <div className="catalog-candidates">
    <strong>{labels.candidatesHeading}</strong>
    <ul className="catalog-candidate-list">
      {candidates.map((candidate) => {
        const displayName = pickDisplayName(candidate, lang);
        const originalName = candidate.originalName || candidate.name;
        return <li className="catalog-candidate" key={candidate.id}>
          <div className="catalog-candidate-copy">
            <span className="catalog-candidate-name">{displayName}</span>
            {displayName !== originalName && <small className="catalog-candidate-original">{originalName}</small>}
            {candidate.category && <small className="catalog-candidate-category">{candidate.category}</small>}
            <div className="catalog-candidate-macros">
              <span>{labels.aiEstimate.kcal}: <b>{Math.round(candidate.kcalPer100g)}</b></span>
              <span>{labels.aiEstimate.protein}: <b>{candidate.proteinPer100g} g</b></span>
              <span>{labels.aiEstimate.fat}: <b>{candidate.fatPer100g} g</b></span>
              <span>{labels.aiEstimate.carbs}: <b>{candidate.carbsPer100g} g</b></span>
              <span>{labels.aiEstimate.fiber}: <b>{candidate.fiberPer100g} g</b></span>
            </div>
            <small className="catalog-candidate-basis">{labels.aiEstimate.per100g}</small>
          </div>
          <button type="button" className="btn secondary" disabled={busy} onClick={() => onSelect(candidate)}>{labels.candidateSelect}</button>
        </li>;
      })}
    </ul>
  </div>;
}

// Owner-beta PR #52 final review (2026-09-13) — Gate 2 (whole-recipe →
// consumed-portion provenance): mirrors RecipeDetail.tsx's own
// RecipeMealControls exactly (same default-unit rule, same "no unit option
// the recipe can't actually support" gating) so an ALREADY-OWNED recipe and
// a JUST-DISCOVERED one offer the identical, already-proven portion UX.
// Grams has a starting value (100) the user must explicitly submit or
// change — never auto-submitted, never treated as a measured fact — exactly
// like the existing owned-recipe flow. "serving" is offered ONLY when the
// recipe actually states a servings count; picking it without one is
// rejected server-side (recipe_servings_required) as a defense-in-depth
// backstop, but the option is never even shown here in that case.
function DiscoveredRecipe({ candidate, lang, labels }: { candidate: RecipeDiscoveryCandidateValue; lang: Lang; labels?: FoodUnderstandingLabels["recipeDiscovery"] }) {
  return <section className="recipe-discovery-preview" aria-label={candidate.title}>
    <h4>{candidate.title}</h4>
    <a href={candidate.sourceUrl} target="_blank" rel="noopener noreferrer">{candidate.domain}</a>
    {candidate.servings != null && <p>{candidate.servings} ×</p>}
    <ul>{candidate.ingredients?.map((ingredient, index) => <li key={index}>
      <strong>{ingredient.originalText}</strong> → {ingredient.resolvedFood ? pickDisplayName(ingredient.resolvedFood, lang) : ingredient.parsedFoodQuery}
      {ingredient.quantityGrams != null && <> · {ingredient.quantityGrams} g</>}
      {/* Readable state instead of raw status/source codes ("confirmation_required", "bls"). */}
      {labels
        ? ingredient.trustedNutritionReady === false && <> · <span className="recipe-ingredient-pending">{labels.fixPending}</span></>
        : <>{" · "}{ingredient.resolvedFood?.source ?? ingredient.status}{ingredient.resolvedFood?.sourceId && <> · {ingredient.resolvedFood.sourceId}</>}</>}
      {ingredient.aiEstimate && <p>{lang === "hu" ? "AI-becslés, még nincs elfogadva" : lang === "de" ? "KI-Schätzung, noch nicht akzeptiert" : "AI estimate, not yet accepted"}: {ingredient.aiEstimate.kcalPer100g} kcal / 100 g · {ingredient.aiEstimate.confidence} · {ingredient.aiEstimate.assumptions}</p>}
    </li>)}</ul>
    {!!candidate.instructions?.length && <ol>{candidate.instructions.map((step, index) => <li key={index}>{step}</li>)}</ol>}
  </section>;
}

// Owner request (2026-09-25): one ingredient must never silently stall a
// whole discovered recipe. Each blocking ingredient shows its exact reason
// and can be fixed by hand: left out, given an amount, or matched to a
// catalog food the backend already offered. Nothing here is trusted as
// nutrition: the fixes travel with the save request and the server applies
// them to its own fresh re-derivation (see meals/recipe-discovery-meal-item.ts).
type IngredientFix = { exclude?: boolean; grams?: string; foodId?: string; choice?: string };

function fixToOverrides(index: number, fix: IngredientFix | undefined): RecipeIngredientOverride[] {
  if (!fix) return [];
  if (fix.exclude) return [{ ingredientIndex: index, action: "exclude" }];
  const grams = Number(fix.grams);
  const hasGrams = !!fix.grams && Number.isFinite(grams) && grams > 0;
  if (fix.foodId) return [{ ingredientIndex: index, action: "food", foodId: fix.foodId, ...(hasGrams ? { grams } : {}) }];
  return hasGrams ? [{ ingredientIndex: index, action: "grams", grams }] : [];
}

// Client-side mirror of the server's readiness rule, only used to decide
// whether to offer the save button; the server re-checks everything.
function fixResolves(ingredient: RecipeIngredientValue, fix: IngredientFix | undefined): boolean {
  if (!fix) return false;
  if (fix.exclude) return true;
  const hasGrams = !!fix.grams && Number(fix.grams) > 0;
  const hasFood = !!fix.foodId || (ingredient.status === "resolved" && !!ingredient.resolvedFood);
  return hasFood && (hasGrams || ingredient.quantityGrams != null);
}

// Resolves a USDA/OFF candidate into a catalog food through the existing,
// server-verified POST /foods/resolve-external/confirm flow; returns the
// catalog food id to use as a "food" override, or null on failure.
export type ResolveExternalFood = (candidate: ExternalCandidate) => Promise<{ id: string; name: string } | null>;
// Services the fix UI needs from the app shell (all server-verified):
// accepting an ingredient's AI estimate as the user's own private food
// (POST /recipes/ingredients/accept-estimate) and free catalog search.
export type RecipeFixServices = {
  resolveExternal?: ResolveExternalFood;
  acceptEstimate?: (estimate: AiEstimateValue, grams: number) => Promise<{ id: string; name: string } | null>;
  searchFoods?: (query: string) => Promise<{ id: string; name: string }[]>;
  // Enables the plate-photo portion estimate next to the recipe amount.
  portionState?: ApiState;
};

function BlockedIngredientFix({ ingredient, fix, lang, labels, busy, onChange, services }: {
  ingredient: RecipeIngredientValue; fix: IngredientFix | undefined; lang: Lang; labels: FoodUnderstandingLabels["recipeDiscovery"]; busy: boolean;
  onChange: (fix: IngredientFix | undefined) => void;
  services?: RecipeFixServices;
}) {
  const [resolving, setResolving] = useState(false);
  const [resolveFailed, setResolveFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const [chosenName, setChosenName] = useState<string | null>(null);
  const reason = ingredient.blockingReason ?? (ingredient.status === "resolved" ? "quantity_missing" : ingredient.status === "confirmation_required" ? "food_needs_confirmation" : "food_not_found");
  const needsFood = reason !== "quantity_missing";
  const external = services?.resolveExternal ? ingredient.externalCandidates ?? [] : [];
  const estimate = services?.acceptEstimate ? ingredient.aiEstimate : undefined;
  const hasChoices = !!ingredient.localCandidates?.length || !!external.length || !!estimate;
  const resolved = fixResolves(ingredient, fix);

  async function pick(value: string, name: string | null, run?: () => Promise<{ id: string; name: string } | null>) {
    setResolveFailed(false);
    if (!run) return;
    setResolving(true);
    try {
      const food = await run();
      if (food) { onChange({ ...fix, foodId: food.id, choice: value }); setChosenName(name ?? food.name); }
      else setResolveFailed(true);
    } catch {
      setResolveFailed(true);
    } finally {
      setResolving(false);
    }
  }

  async function choose(value: string) {
    if (!value) { setChosenName(null); return onChange({ ...fix, foodId: undefined, choice: undefined }); }
    if (value.startsWith("local:")) { setChosenName(null); return onChange({ ...fix, foodId: value.slice(6), choice: value }); }
    if (value === "ai" && estimate && services?.acceptEstimate) {
      const grams = Number(fix?.grams) > 0 ? Number(fix!.grams) : ingredient.quantityGrams ?? 100;
      return pick(value, null, () => services.acceptEstimate!(estimate, grams));
    }
    const candidate = external.find((c) => `ext:${c.source}:${c.sourceId}` === value);
    if (candidate && services?.resolveExternal) return pick(value, null, () => services.resolveExternal!(candidate));
  }

  async function search(text: string) {
    setQuery(text);
    if (!services?.searchFoods || text.trim().length < 2) { setResults([]); return; }
    try { setResults((await services.searchFoods(text.trim())).slice(0, 5)); } catch { setResults([]); }
  }

  return <li className="blocked-ingredient">
    <strong>{ingredient.originalText}</strong>
    <small className="blocked-ingredient-reason">{labels.blockingReasons[reason]}</small>
    {fix?.exclude
      ? <div className="blocked-ingredient-controls"><small>{labels.fixExcluded}</small><button type="button" className="btn secondary" disabled={busy} onClick={() => onChange(undefined)}>{labels.fixUndo}</button></div>
      : <div className="blocked-ingredient-controls">
        {needsFood && hasChoices && <select aria-label={`${labels.fixFood}: ${ingredient.originalText}`} className="field" disabled={busy || resolving} value={fix?.choice?.startsWith("search:") ? "" : fix?.choice ?? ""} onChange={(event) => { void choose(event.target.value); }}>
          <option value="">{resolving ? "…" : labels.fixFoodPlaceholder}</option>
          {ingredient.localCandidates?.map((candidate) => <option key={candidate.id} value={`local:${candidate.id}`}>{candidate.name}</option>)}
          {external.map((candidate) => <option key={`${candidate.source}:${candidate.sourceId}`} value={`ext:${candidate.source}:${candidate.sourceId}`}>{pickDisplayName(candidate, lang)}</option>)}
          {estimate && <option value="ai">{labels.fixUseEstimate}: {estimate.localizedFoodName || estimate.canonicalFoodName} · {Math.round(estimate.kcalPer100g)} kcal/100 g</option>}
        </select>}
        {needsFood && services?.searchFoods && <input aria-label={`${labels.fixSearch}: ${ingredient.originalText}`} className="field" type="search" placeholder={labels.fixSearch} disabled={busy} value={query} onChange={(event) => { void search(event.target.value); }}/>}
        {!!results.length && <ul className="blocked-ingredient-results">{results.map((food) => <li key={food.id}>
          <button type="button" className="btn secondary" disabled={busy} onClick={() => { onChange({ ...fix, foodId: food.id, choice: `search:${food.id}` }); setChosenName(food.name); setResults([]); setQuery(""); }}>{food.name}</button>
        </li>)}</ul>}
        {chosenName && fix?.foodId && <small className="blocked-ingredient-chosen">{labels.fixChosen}: {chosenName}</small>}
        <input aria-label={`${labels.fixGrams}: ${ingredient.originalText}`} className="field" type="number" min="1" step="1" inputMode="decimal" placeholder={labels.fixGrams} disabled={busy} value={fix?.grams ?? ""} onChange={(event) => onChange({ ...fix, grams: event.target.value })}/>
        <button type="button" className="btn secondary" disabled={busy} onClick={() => onChange({ exclude: true })}>{labels.fixExclude}</button>
      </div>}
    {resolveFailed && <small className="blocked-ingredient-reason">{labels.fixExternalFailed}</small>}
    {!fix?.exclude && <small className={resolved ? "blocked-ingredient-status ready" : "blocked-ingredient-status"}>{resolved ? labels.fixReady : ingredient.quantityGrams == null && fix?.foodId ? labels.fixNeedsGrams : labels.fixPending}</small>}
  </li>;
}

function RecipeCandidateReview({ candidate, lang, labels, busy, onConfirm, services }: {
  candidate: RecipeDiscoveryCandidateValue; lang: Lang; labels: FoodUnderstandingLabels; busy: boolean;
  onConfirm?: (candidate: RecipeDiscoveryCandidateValue, quantity: number, unit: "g" | "serving", overrides?: RecipeIngredientOverride[]) => void;
  services?: RecipeFixServices;
}) {
  const [fixes, setFixes] = useState<Record<number, IngredientFix>>({});
  const ingredients = candidate.ingredients ?? [];
  const blocked = ingredients.map((ingredient, index) => ({ ingredient, index })).filter(({ ingredient }) => ingredient.trustedNutritionReady === false);
  const allFixed = blocked.length > 0 && blocked.every(({ ingredient, index }) => fixResolves(ingredient, fixes[index]));
  const overrides = blocked.flatMap(({ index }) => fixToOverrides(index, fixes[index]));
  return <>
    <DiscoveredRecipe candidate={candidate} lang={lang} labels={labels.recipeDiscovery}/>
    {!candidate.nutritionCalculable && !!blocked.length && onConfirm && <section className="blocked-ingredients">
      <strong>{labels.recipeDiscovery.blockedHeading}</strong>
      <ul>{blocked.map(({ ingredient, index }) => <BlockedIngredientFix key={index} ingredient={ingredient} fix={fixes[index]} lang={lang} labels={labels.recipeDiscovery} busy={busy} services={services}
        onChange={(fix) => setFixes((current) => { const next = { ...current }; if (fix) next[index] = fix; else delete next[index]; return next; })}/>)}</ul>
    </section>}
    {onConfirm && <RecipeConfirmControls candidate={candidate} lang={lang} labels={labels} busy={busy} portionState={services?.portionState}
      ready={candidate.nutritionCalculable || allFixed}
      onConfirm={(c, quantity, unit) => candidate.nutritionCalculable ? onConfirm(c, quantity, unit) : onConfirm(c, quantity, unit, overrides)}/>}
  </>;
}

// The portion photo stays reachable while blocked ingredients are still being
// fixed (owner report 2026-09-25); the add button appears only once every
// blocking ingredient is fixed, so partial nutrition is never saved.
function RecipeConfirmControls({ candidate, lang, labels, busy, ready, onConfirm, portionState }: {
  candidate: RecipeDiscoveryCandidateValue; lang: Lang; labels: FoodUnderstandingLabels; busy: boolean; ready: boolean;
  onConfirm: (candidate: RecipeDiscoveryCandidateValue, quantity: number, unit: "g" | "serving") => void;
  portionState?: ApiState;
}) {
  const [unit, setUnit] = useState<"g" | "serving">(candidate.servings ? "serving" : "g");
  const [quantity, setQuantity] = useState(candidate.servings ? 1 : 100);
  return <div className="recipe-meal-controls">
    <input aria-label={labels.recipeDiscovery.confirmQuantity} className="field" type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/>
    <select aria-label={labels.recipeDiscovery.confirmUnit} className="field" value={unit} onChange={(event) => setUnit(event.target.value as "g" | "serving")}>
      <option value="g">g</option>
      {candidate.servings && <option value="serving">{labels.recipeDiscovery.confirmServingUnit}</option>}
    </select>
    {ready && <button type="button" className="btn primary" disabled={busy} aria-busy={busy} onClick={() => onConfirm(candidate, quantity, unit)}>
      {busy ? labels.recipeDiscovery.confirmAdding : labels.recipeDiscovery.confirmAdd}
    </button>}
    {portionState && <div className="recipe-portion-photo"><PortionPhoto lang={lang} state={portionState} dish={candidate.title} onEstimate={(grams) => { setUnit("g"); setQuantity(grams); }}/></div>}
  </div>;
}

// FINAL FALLBACK: AI-ESTIMATED NUTRITION — frontend wiring (2026-09-18).
// Two, and only two, ways out of this card: accept (echoes the estimate's
// numbers + its signed proof back verbatim — see AiEstimateAcceptPayload's
// own doc) or override (abandons the proof entirely and goes through the
// pre-existing manual-entry contract instead, since editing a number
// invalidates the proof by construction). A third, purely local action —
// decline — never calls the backend at all: it just stops rendering this
// card so the item falls back to the existing "unresolved" presentation,
// where the ordinary food-search box already lets the user pick something
// else. Nothing here can be submitted merely by having been displayed.
function AiEstimateCard({ estimate, labels, busy, onAccept, onOverride, onDecline }: {
  estimate: AiEstimateValue; labels: FoodUnderstandingLabels["aiEstimate"]; busy: boolean;
  onAccept: (quantityGrams: number) => void;
  onOverride: (payload: AiEstimateOverridePayload) => void;
  onDecline: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const name = estimate.localizedFoodName || estimate.canonicalFoodName;
  const [quantity, setQuantity] = useState("100");
  const [kcal, setKcal] = useState(String(estimate.kcalPer100g));
  const [protein, setProtein] = useState(String(estimate.proteinPer100g));
  const [fat, setFat] = useState(String(estimate.fatPer100g));
  const [carbs, setCarbs] = useState(String(estimate.carbsPer100g));
  const [fiber, setFiber] = useState(String(estimate.fiberPer100g));

  const quantityValue = Number(quantity);
  const quantityValid = Number.isFinite(quantityValue) && quantityValue > 0 && quantityValue <= 5000;

  if (editing) {
    const editedValid = quantityValid && [kcal, protein, fat, carbs, fiber].every((v) => Number.isFinite(Number(v)) && Number(v) >= 0);
    return <div className="ai-estimate-card">
      <div className="ai-estimate-badge"><Sparkles aria-hidden="true" size={12}/>{labels.badge}</div>
      <strong className="ai-estimate-name">{name}</strong>
      <div className="ai-estimate-edit-grid">
        <label>{labels.quantityLabel}<input className="field compact" type="number" min="1" max="5000" value={quantity} onChange={(event) => setQuantity(event.target.value)}/></label>
        <label>{labels.kcal}<input className="field compact" type="number" min="0" max="1000" value={kcal} onChange={(event) => setKcal(event.target.value)}/></label>
        <label>{labels.protein}<input className="field compact" type="number" min="0" max="200" value={protein} onChange={(event) => setProtein(event.target.value)}/></label>
        <label>{labels.fat}<input className="field compact" type="number" min="0" max="200" value={fat} onChange={(event) => setFat(event.target.value)}/></label>
        <label>{labels.carbs}<input className="field compact" type="number" min="0" max="200" value={carbs} onChange={(event) => setCarbs(event.target.value)}/></label>
        <label>{labels.fiber}<input className="field compact" type="number" min="0" max="100" value={fiber} onChange={(event) => setFiber(event.target.value)}/></label>
      </div>
      <div className="ai-estimate-actions">
        <button type="button" className="btn ghost" disabled={busy} onClick={() => setEditing(false)}>{labels.cancelEdit}</button>
        <button type="button" className="btn primary" disabled={busy || !editedValid} aria-busy={busy} onClick={() => onOverride({
          foodName: name, quantityGrams: quantityValue,
          kcalPer100g: Number(kcal), proteinPer100g: Number(protein), fatPer100g: Number(fat), carbsPer100g: Number(carbs), fiberPer100g: Number(fiber)
        })}>{labels.saveEdited}</button>
      </div>
    </div>;
  }

  return <div className="ai-estimate-card">
    <div className="ai-estimate-badge"><Sparkles aria-hidden="true" size={12}/>{labels.badge}</div>
    <p className="ai-estimate-disclaimer">{labels.disclaimer}</p>
    <strong className="ai-estimate-name">{name}</strong>
    <div className="ai-estimate-macros">
      <span>{labels.kcal}: <b>{Math.round(estimate.kcalPer100g)}</b></span>
      <span>{labels.protein}: <b>{estimate.proteinPer100g} g</b></span>
      <span>{labels.fat}: <b>{estimate.fatPer100g} g</b></span>
      <span>{labels.carbs}: <b>{estimate.carbsPer100g} g</b></span>
      <span>{labels.fiber}: <b>{estimate.fiberPer100g} g</b></span>
    </div>
    <small className="ai-estimate-basis">{labels.per100g}</small>
    <small className="ai-estimate-confidence">{labels.confidenceLabel}: {labels.confidenceValues[estimate.confidence]}</small>
    {estimate.assumptions && <small className="ai-estimate-assumptions">{estimate.assumptions}</small>}
    <label className="ai-estimate-quantity">{labels.quantityLabel}
      <input className="field compact" type="number" min="1" max="5000" value={quantity} onChange={(event) => setQuantity(event.target.value)}/>
    </label>
    <div className="ai-estimate-actions">
      <button type="button" className="btn ghost" disabled={busy} onClick={onDecline}>{labels.decline}</button>
      <button type="button" className="btn secondary" disabled={busy} onClick={() => setEditing(true)}>{labels.edit}</button>
      <button type="button" className="btn primary" disabled={busy || !quantityValid} aria-busy={busy} onClick={() => onAccept(quantityValue)}>
        {busy ? labels.accepting : labels.accept}
      </button>
    </div>
  </div>;
}

// Owner report (2026-09-26): a dish found among saved recipes only showed a
// note, with no way to add it or to pick between several matches. One
// option: amount + add. Several (e.g. a reference dish with an open side):
// pick first, then add.
function LocalRecipePicker({ discovery, labels, busy, onConfirm }: {
  discovery: RecipeDiscoveryPreviewValue; labels: FoodUnderstandingLabels["recipeDiscovery"]; busy: boolean;
  onConfirm: (option: LocalRecipeOption, quantity: number, unit: "g" | "serving") => void;
}) {
  const options = discovery.status === "local_match" && discovery.localMatch ? [discovery.localMatch] : discovery.localAlternatives ?? [];
  const [picked, setPicked] = useState<LocalRecipeOption | null>(options.length === 1 ? options[0] : null);
  const [quantity, setQuantity] = useState(picked && !picked.servings ? 100 : 1);
  const [unit, setUnit] = useState<"g" | "serving">(picked?.servings ? "serving" : "g");
  if (!options.length) return null;
  const pick = (option: LocalRecipeOption) => { setPicked(option); setUnit(option.servings ? "serving" : "g"); setQuantity(option.servings ? 1 : 100); };
  return <div className="local-recipe-picker">
    {options.length > 1 && <div className="local-recipe-options" role="radiogroup">
      {options.map((option) => <label key={option.recipeId}><input type="radio" name="local-recipe" checked={picked?.recipeId === option.recipeId} onChange={() => pick(option)}/> {option.title}</label>)}
    </div>}
    {picked && <>
      <small>{picked.source === "reference" ? labels.sourceReference : labels.sourceOwn}{picked.servingGrams ? ` · ${labels.servingApprox.replace("{g}", String(Math.round(picked.servingGrams)))}` : ""}</small>
      <div className="recipe-meal-controls">
        <input aria-label={labels.confirmQuantity} className="field" type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/>
        <select aria-label={labels.confirmUnit} className="field" value={unit} onChange={(event) => setUnit(event.target.value as "g" | "serving")}>
          <option value="g">g</option>
          {picked.servings && <option value="serving">{labels.confirmServingUnit}</option>}
        </select>
        <button type="button" className="btn primary" disabled={busy || !(quantity > 0)} aria-busy={busy} onClick={() => onConfirm(picked, quantity, unit)}>{busy ? labels.confirmAdding : labels.confirmAdd}</button>
      </div>
    </>}
  </div>;
}

function PreviewRow({ item, lang, labels, busy, confirmingId, onConfirmExternal, onConfirmRecipe, onConfirmLocalRecipe, onAcceptAiEstimate, onOverrideAiEstimate, onSelectCandidate, recipeFixServices }: {
  item: PreviewItem; lang: Lang; labels: FoodUnderstandingLabels; busy: boolean; confirmingId: string | null;
  onConfirmLocalRecipe?: (option: LocalRecipeOption, quantity: number, unit: "g" | "serving") => void;
  onConfirmExternal?: (candidate: ExternalCandidate) => void;
  onConfirmRecipe?: (candidate: RecipeDiscoveryCandidateValue, quantity: number, unit: "g" | "serving", overrides?: RecipeIngredientOverride[]) => void;
  onAcceptAiEstimate?: (estimate: AiEstimateValue, quantityGrams: number) => void;
  onOverrideAiEstimate?: (payload: AiEstimateOverridePayload) => void;
  onSelectCandidate?: (candidate: CandidateFood) => void;
  recipeFixServices?: RecipeFixServices;
}) {
  const quantity = quantityText(item.parsed.quantity, item.parsed.unit, labels);
  // Owned here (not inside AiEstimateCard) so declining correctly brings
  // back the ordinary trusted/unresolved indicator below — a card that
  // tracked its own "declined" state locally would disappear while this
  // row's indicator stayed hidden, leaving the item with NO status shown
  // at all once declined.
  const [aiEstimateDeclined, setAiEstimateDeclined] = useState(false);
  const isAiEstimatePending = item.foodResolution === "ai_estimate_pending" && !!item.aiEstimate && !aiEstimateDeclined;
  // Owner-reported UX bug fix (2026-09-19): a "preview"/"confirmation_required"
  // item DOES carry a `selectedFood` (the backend's best unconfirmed guess —
  // see interpret.ts), which previously made this indicator claim "trusted"
  // for a food the user never actually confirmed. Only a genuine
  // foodResolution: "resolved" item is trustworthy; anything else must show
  // the same honest "not yet linked" state as a true miss.
  const isTrusted = !!item.selectedFood && item.foodResolution === "resolved" && item.nutritionEligible !== false;
  // Authoritative catalog data first (owner decision, 2026-09-25): local
  // catalog candidates stay selectable next to external candidates and next
  // to an AI estimate, listed before either, instead of being hidden by them.
  const hasCatalogCandidates = !!item.candidates?.length && (item.foodResolution === "preview" || item.foodResolution === "confirmation_required" || item.foodResolution === "ai_estimate_pending");
  return <li className="understanding-item">
    <div><strong>{quantity ? `${quantity} ${itemName(item, lang)}` : itemName(item, lang)}</strong></div>
    {item.preparation && <small>{labels.preparation}: {preparationLabel(item.preparation, labels)}</small>}
    {!!item.semanticItem?.modifiers?.length && <small>{labels.modifiers}: {item.semanticItem.modifiers.join(", ")}</small>}
    {!!item.semanticItem?.excludedModifiers?.length && <small>{labels.excluded}: {item.semanticItem.excludedModifiers.join(", ")}</small>}
    {item.semanticItem?.evidence === "inferred_common" && <small className="inferred-label">{labels.inferred}</small>}
    {!isAiEstimatePending && <small className="understanding-resolution">{isTrusted ? <CheckCircle2 aria-hidden="true" size={13}/> : <CircleDashed aria-hidden="true" size={13}/>} {isTrusted ? labels.trusted : labels.unresolved}</small>}
    {item.quantity?.status === "resolved" && <small>{item.quantity.estimated ? "≈" : "="} {Math.round((item.quantity.grams ?? 0) * 10) / 10} g</small>}
    {item.recipeDiscovery && <small className="recipe-discovery-note">{recipeDiscoveryText(item.recipeDiscovery, labels)}</small>}
    {item.recipeDiscovery?.candidate && <RecipeCandidateReview candidate={item.recipeDiscovery.candidate} lang={lang} labels={labels} busy={busy} onConfirm={onConfirmRecipe} services={recipeFixServices}/>}
    {item.recipeDiscovery && onConfirmLocalRecipe && (item.recipeDiscovery.status === "local_match" || item.recipeDiscovery.reason === "ambiguous_local_matches") && <LocalRecipePicker discovery={item.recipeDiscovery} labels={labels.recipeDiscovery} busy={busy} onConfirm={onConfirmLocalRecipe}/>}
    {hasCatalogCandidates && onSelectCandidate && <CatalogCandidateList candidates={item.candidates!} lang={lang} labels={labels} busy={busy} onSelect={onSelectCandidate}/>}
    {!!item.externalCandidates?.length && onConfirmExternal && <ExternalCandidateList candidates={item.externalCandidates} lang={lang} labels={labels} busy={busy} confirmingId={confirmingId} onConfirm={onConfirmExternal}/>}
    {isAiEstimatePending && onAcceptAiEstimate && onOverrideAiEstimate && <AiEstimateCard estimate={item.aiEstimate!} labels={labels.aiEstimate} busy={busy} onAccept={(quantityGrams) => onAcceptAiEstimate(item.aiEstimate!, quantityGrams)} onOverride={onOverrideAiEstimate} onDecline={() => setAiEstimateDeclined(true)}/>}
  </li>;
}

export function FoodUnderstandingPreview({ value, lang, labels, busy, onConfirmAll, onConfirmExternal, confirmingExternalId, onConfirmRecipe, onConfirmLocalRecipe, onAcceptAiEstimate, onOverrideAiEstimate, onSelectCandidate, recipeFixServices }: {
  value: FoodUnderstandingPreviewValue;
  lang: Lang;
  labels: FoodUnderstandingLabels;
  busy: boolean;
  onConfirmAll: () => void;
  onConfirmExternal?: (candidate: ExternalCandidate, itemIndex?: number) => void;
  confirmingExternalId?: string | null;
  onConfirmRecipe?: (candidate: RecipeDiscoveryCandidateValue, quantity: number, unit: "g" | "serving", overrides?: RecipeIngredientOverride[]) => void;
  onConfirmLocalRecipe?: (option: LocalRecipeOption, quantity: number, unit: "g" | "serving") => void;
  onAcceptAiEstimate?: (estimate: AiEstimateValue, quantityGrams: number, itemIndex?: number) => void;
  onOverrideAiEstimate?: (payload: AiEstimateOverridePayload, itemIndex?: number) => void;
  onSelectCandidate?: (candidate: CandidateFood, itemIndex?: number) => void;
  recipeFixServices?: RecipeFixServices;
}) {
  const rows = value.items?.length ? value.items : [value];
  const singleReady = !value.items?.length && value.canConfirm && value.selectedFood && value.quantity;
  const singleExternalCandidates = !value.items?.length ? value.externalCandidates : undefined;
  // ai_estimate_pending can reach a SINGLE-item result via either interpretation
  // source (Branch B's deterministic fallback also produces it, not only the
  // AI-assisted path — see dynamic-food-resolution.ts) — checked independently
  // of interpretationSource so the estimate card always gets a chance to render.
  const isSingleAiEstimatePending = !value.items?.length && value.foodResolution === "ai_estimate_pending" && !!value.aiEstimate;
  // Owner-reported UX bug fix (2026-09-19): a PURE deterministic single-item
  // preview/confirmation_required (interpretationSource: "deterministic", no
  // items array) never enters the PreviewRow-based list below — the AI-
  // assisted / multi-item / ai_estimate_pending gate on that list simply
  // doesn't fire for it — so this exact backend candidate list needs its own
  // top-level rendering, parallel to singleExternalCandidates. A single item
  // that DOES enter the list below (ai_assisted-classified single food, or a
  // genuine multi-item child) gets its candidate list from PreviewRow itself.
  const singleCandidates = !value.items?.length && !isSingleAiEstimatePending
    && (value.foodResolution === "preview" || value.foodResolution === "confirmation_required")
    ? value.candidates : undefined;
  return <div className={`interpretation ${value.canConfirm ? "ready" : "needs-review"}`} role="status">
    <div className="understanding-heading">
      <strong>{labels.understood}</strong>
      {value.interpretationSource === "ai_assisted" && <span className="ai-assisted-badge"><Sparkles aria-hidden="true" size={11}/>{labels.aiAssisted}</span>}
    </div>
    {value.semantic?.dishName && <div><strong>{labels.dish}:</strong> {value.semantic.dishName}</div>}
    {/* Live report (2026-09-25): a dish recognized as several items kept its
        discovered recipe here as display only, so "needs confirmation" had
        no button at all. It now gets the same fix + confirm controls. */}
    {!!value.items?.length && value.recipeDiscovery?.candidate && <RecipeCandidateReview candidate={value.recipeDiscovery.candidate} lang={lang} labels={labels} busy={busy} onConfirm={onConfirmRecipe} services={recipeFixServices}/>}
    {(value.items?.length || value.interpretationSource === "ai_assisted" || isSingleAiEstimatePending) && <ul className="multi-preview-list">
      {rows.map((item, index) => <PreviewRow key={index} item={item} lang={lang} labels={labels} busy={busy} confirmingId={confirmingExternalId ?? null} onConfirmExternal={onConfirmExternal ? (candidate) => onConfirmExternal(candidate, value.items?.length ? index : undefined) : undefined} onConfirmRecipe={onConfirmRecipe} onConfirmLocalRecipe={onConfirmLocalRecipe} onAcceptAiEstimate={onAcceptAiEstimate ? (estimate, quantityGrams) => onAcceptAiEstimate(estimate, quantityGrams, value.items?.length ? index : undefined) : undefined} onOverrideAiEstimate={onOverrideAiEstimate ? (payload) => onOverrideAiEstimate(payload, value.items?.length ? index : undefined) : undefined} onSelectCandidate={onSelectCandidate ? (candidate) => onSelectCandidate(candidate, value.items?.length ? index : undefined) : undefined} recipeFixServices={recipeFixServices}/>) }
    </ul>}
    {singleReady && <div>
      <strong>{itemName(value, lang)}</strong>
      {value.preparation && <em> · {preparationLabel(value.preparation, labels)}</em>}
      <span> · {value.parsed.quantity != null ? `${quantityText(value.parsed.quantity, value.parsed.unit, labels)} · ` : ""}{value.quantity?.estimated ? "≈" : "="} {Math.round((value.quantity?.grams ?? 0) * 10) / 10} g · {value.quantity?.estimated ? labels.estimated : labels.verified}</span>
    </div>}
    {!!singleCandidates?.length && value.interpretationSource !== "ai_assisted" && onSelectCandidate && <CatalogCandidateList candidates={singleCandidates} lang={lang} labels={labels} busy={busy} onSelect={onSelectCandidate}/>}
    {!!singleExternalCandidates?.length && onConfirmExternal && <ExternalCandidateList candidates={singleExternalCandidates} lang={lang} labels={labels} busy={busy} confirmingId={confirmingExternalId ?? null} onConfirm={(candidate) => onConfirmExternal(candidate)}/>}
    {!value.items?.length && !singleReady && !singleExternalCandidates?.length && !isSingleAiEstimatePending && !singleCandidates?.length && value.interpretationSource !== "ai_assisted" && <span>
      {value.foodResolution === "unresolved" ? labels.unresolved : value.quantity && "reason" in value.quantity ? labels.conversionMissing : labels.review}
    </span>}
    {/* recipeDiscovery can only ever be set on an ai_assisted result (see
        recipe-discovery-fallback.ts's findEligibleDiscoveryTarget — it
        requires semantic.kind, which only interpretAiUnderstanding ever
        sets), and the list above already renders every ai_assisted result
        (single-item or multi) via PreviewRow — including its own
        recipeDiscovery note and RecipeConfirmControls. Rendering it again
        here would duplicate the note AND, worse, offer two independent
        confirm forms for the exact same recipe. */}
    {(value.semantic?.clarificationNeeded || value.semantic?.clarificationReason) && <div className="clarification-note"><strong>{labels.needsDetail}</strong>{value.semantic.clarificationReason ? ` ${value.semantic.clarificationReason}` : ""}</div>}
    {!!value.items?.length && <button type="button" className="btn primary" disabled={!value.canConfirm || busy} onClick={onConfirmAll}>{busy ? "…" : labels.logAll}</button>}
  </div>;
}
