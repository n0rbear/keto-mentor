import { useState } from "react";
import type { Lang } from "./i18n";
import { CheckCircle2, CircleDashed, Sparkles } from "lucide-react";
import { pickDisplayName } from "./food-display-name";

export type ExternalCandidate = {
  source: "usda_fdc" | "open_food_facts";
  sourceId: string;
  name: string;
  originalName: string;
  names?: Partial<Record<Lang, string>>;
  category?: string;
  confidence: number;
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
export type RecipeDiscoveryCandidateValue = {
  title: string;
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
  localMatch?: { recipeId: string; title: string };
  localAlternatives?: { recipeId: string; title: string }[];
};

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
  recipeDiscovery: {
    localMatch: string;
    ambiguousLocal: string;
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
  if (discovery.status === "local_match") return `${labels.recipeDiscovery.localMatch} ${discovery.localMatch?.title ?? ""}`.trim();
  if (discovery.status === "confirmation_required") {
    if (discovery.reason === "ambiguous_local_matches") return labels.recipeDiscovery.ambiguousLocal;
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
function RecipeConfirmControls({ candidate, lang, labels, busy, onConfirm }: {
  candidate: RecipeDiscoveryCandidateValue; lang: Lang; labels: FoodUnderstandingLabels; busy: boolean;
  onConfirm: (candidate: RecipeDiscoveryCandidateValue, quantity: number, unit: "g" | "serving") => void;
}) {
  const [unit, setUnit] = useState<"g" | "serving">(candidate.servings ? "serving" : "g");
  const [quantity, setQuantity] = useState(candidate.servings ? 1 : 100);
  if (!candidate.nutritionCalculable) return null;
  return <div className="recipe-meal-controls">
    <input aria-label={labels.recipeDiscovery.confirmQuantity} className="field" type="number" min="0.1" step="0.1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/>
    <select aria-label={labels.recipeDiscovery.confirmUnit} className="field" value={unit} onChange={(event) => setUnit(event.target.value as "g" | "serving")}>
      <option value="g">g</option>
      {candidate.servings && <option value="serving">{labels.recipeDiscovery.confirmServingUnit}</option>}
    </select>
    <button type="button" className="btn primary" disabled={busy} aria-busy={busy} onClick={() => onConfirm(candidate, quantity, unit)}>
      {busy ? labels.recipeDiscovery.confirmAdding : labels.recipeDiscovery.confirmAdd}
    </button>
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

function PreviewRow({ item, lang, labels, busy, confirmingId, onConfirmExternal, onConfirmRecipe, onAcceptAiEstimate, onOverrideAiEstimate }: {
  item: PreviewItem; lang: Lang; labels: FoodUnderstandingLabels; busy: boolean; confirmingId: string | null;
  onConfirmExternal?: (candidate: ExternalCandidate) => void;
  onConfirmRecipe?: (candidate: RecipeDiscoveryCandidateValue, quantity: number, unit: "g" | "serving") => void;
  onAcceptAiEstimate?: (estimate: AiEstimateValue, quantityGrams: number) => void;
  onOverrideAiEstimate?: (payload: AiEstimateOverridePayload) => void;
}) {
  const quantity = quantityText(item.parsed.quantity, item.parsed.unit, labels);
  // Owned here (not inside AiEstimateCard) so declining correctly brings
  // back the ordinary trusted/unresolved indicator below — a card that
  // tracked its own "declined" state locally would disappear while this
  // row's indicator stayed hidden, leaving the item with NO status shown
  // at all once declined.
  const [aiEstimateDeclined, setAiEstimateDeclined] = useState(false);
  const isAiEstimatePending = item.foodResolution === "ai_estimate_pending" && !!item.aiEstimate && !aiEstimateDeclined;
  return <li className="understanding-item">
    <div><strong>{quantity ? `${quantity} ${itemName(item, lang)}` : itemName(item, lang)}</strong></div>
    {item.preparation && <small>{labels.preparation}: {preparationLabel(item.preparation, labels)}</small>}
    {!!item.semanticItem?.modifiers?.length && <small>{labels.modifiers}: {item.semanticItem.modifiers.join(", ")}</small>}
    {!!item.semanticItem?.excludedModifiers?.length && <small>{labels.excluded}: {item.semanticItem.excludedModifiers.join(", ")}</small>}
    {item.semanticItem?.evidence === "inferred_common" && <small className="inferred-label">{labels.inferred}</small>}
    {!isAiEstimatePending && <small className="understanding-resolution">{item.selectedFood && item.nutritionEligible !== false ? <CheckCircle2 aria-hidden="true" size={13}/> : <CircleDashed aria-hidden="true" size={13}/>} {item.selectedFood && item.nutritionEligible !== false ? labels.trusted : labels.unresolved}</small>}
    {item.quantity?.status === "resolved" && <small>{item.quantity.estimated ? "≈" : "="} {Math.round((item.quantity.grams ?? 0) * 10) / 10} g</small>}
    {item.recipeDiscovery && <small className="recipe-discovery-note">{recipeDiscoveryText(item.recipeDiscovery, labels)}</small>}
    {item.recipeDiscovery?.candidate && onConfirmRecipe && <RecipeConfirmControls candidate={item.recipeDiscovery.candidate} lang={lang} labels={labels} busy={busy} onConfirm={onConfirmRecipe}/>}
    {!!item.externalCandidates?.length && onConfirmExternal && <ExternalCandidateList candidates={item.externalCandidates} lang={lang} labels={labels} busy={busy} confirmingId={confirmingId} onConfirm={onConfirmExternal}/>}
    {isAiEstimatePending && onAcceptAiEstimate && onOverrideAiEstimate && <AiEstimateCard estimate={item.aiEstimate!} labels={labels.aiEstimate} busy={busy} onAccept={(quantityGrams) => onAcceptAiEstimate(item.aiEstimate!, quantityGrams)} onOverride={onOverrideAiEstimate} onDecline={() => setAiEstimateDeclined(true)}/>}
  </li>;
}

export function FoodUnderstandingPreview({ value, lang, labels, busy, onConfirmAll, onConfirmExternal, confirmingExternalId, onConfirmRecipe, onAcceptAiEstimate, onOverrideAiEstimate }: {
  value: FoodUnderstandingPreviewValue;
  lang: Lang;
  labels: FoodUnderstandingLabels;
  busy: boolean;
  onConfirmAll: () => void;
  onConfirmExternal?: (candidate: ExternalCandidate, itemIndex?: number) => void;
  confirmingExternalId?: string | null;
  onConfirmRecipe?: (candidate: RecipeDiscoveryCandidateValue, quantity: number, unit: "g" | "serving") => void;
  onAcceptAiEstimate?: (estimate: AiEstimateValue, quantityGrams: number, itemIndex?: number) => void;
  onOverrideAiEstimate?: (payload: AiEstimateOverridePayload, itemIndex?: number) => void;
}) {
  const rows = value.items?.length ? value.items : [value];
  const singleReady = !value.items?.length && value.canConfirm && value.selectedFood && value.quantity;
  const singleExternalCandidates = !value.items?.length ? value.externalCandidates : undefined;
  // ai_estimate_pending can reach a SINGLE-item result via either interpretation
  // source (Branch B's deterministic fallback also produces it, not only the
  // AI-assisted path — see dynamic-food-resolution.ts) — checked independently
  // of interpretationSource so the estimate card always gets a chance to render.
  const isSingleAiEstimatePending = !value.items?.length && value.foodResolution === "ai_estimate_pending" && !!value.aiEstimate;
  return <div className={`interpretation ${value.canConfirm ? "ready" : "needs-review"}`} role="status">
    <div className="understanding-heading">
      <strong>{labels.understood}</strong>
      {value.interpretationSource === "ai_assisted" && <span className="ai-assisted-badge"><Sparkles aria-hidden="true" size={11}/>{labels.aiAssisted}</span>}
    </div>
    {value.semantic?.dishName && <div><strong>{labels.dish}:</strong> {value.semantic.dishName}</div>}
    {(value.items?.length || value.interpretationSource === "ai_assisted" || isSingleAiEstimatePending) && <ul className="multi-preview-list">
      {rows.map((item, index) => <PreviewRow key={index} item={item} lang={lang} labels={labels} busy={busy} confirmingId={confirmingExternalId ?? null} onConfirmExternal={onConfirmExternal ? (candidate) => onConfirmExternal(candidate, index) : undefined} onConfirmRecipe={onConfirmRecipe} onAcceptAiEstimate={onAcceptAiEstimate ? (estimate, quantityGrams) => onAcceptAiEstimate(estimate, quantityGrams, value.items?.length ? index : undefined) : undefined} onOverrideAiEstimate={onOverrideAiEstimate ? (payload) => onOverrideAiEstimate(payload, value.items?.length ? index : undefined) : undefined}/>) }
    </ul>}
    {singleReady && <div>
      <strong>{itemName(value, lang)}</strong>
      {value.preparation && <em> · {preparationLabel(value.preparation, labels)}</em>}
      <span> · {value.parsed.quantity != null ? `${quantityText(value.parsed.quantity, value.parsed.unit, labels)} · ` : ""}{value.quantity?.estimated ? "≈" : "="} {Math.round((value.quantity?.grams ?? 0) * 10) / 10} g · {value.quantity?.estimated ? labels.estimated : labels.verified}</span>
    </div>}
    {!!singleExternalCandidates?.length && onConfirmExternal && <ExternalCandidateList candidates={singleExternalCandidates} lang={lang} labels={labels} busy={busy} confirmingId={confirmingExternalId ?? null} onConfirm={(candidate) => onConfirmExternal(candidate)}/>}
    {!value.items?.length && !singleReady && !singleExternalCandidates?.length && !isSingleAiEstimatePending && value.interpretationSource !== "ai_assisted" && <span>
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
