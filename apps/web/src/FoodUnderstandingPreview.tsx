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
};

export type FoodUnderstandingPreviewValue = PreviewItem & {
  interpretationSource?: "deterministic" | "ai_assisted";
  canConfirm: boolean;
  confidence?: number;
  foodResolution: string;
  items?: PreviewItem[];
  semantic?: { dishName?: string; clarificationNeeded: boolean; clarificationReason?: string };
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
};

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

function PreviewRow({ item, lang, labels, busy, confirmingId, onConfirmExternal }: {
  item: PreviewItem; lang: Lang; labels: FoodUnderstandingLabels; busy: boolean; confirmingId: string | null;
  onConfirmExternal?: (candidate: ExternalCandidate) => void;
}) {
  const quantity = quantityText(item.parsed.quantity, item.parsed.unit, labels);
  return <li className="understanding-item">
    <div><strong>{quantity ? `${quantity} ${itemName(item, lang)}` : itemName(item, lang)}</strong></div>
    {item.preparation && <small>{labels.preparation}: {preparationLabel(item.preparation, labels)}</small>}
    {!!item.semanticItem?.modifiers?.length && <small>{labels.modifiers}: {item.semanticItem.modifiers.join(", ")}</small>}
    {!!item.semanticItem?.excludedModifiers?.length && <small>{labels.excluded}: {item.semanticItem.excludedModifiers.join(", ")}</small>}
    {item.semanticItem?.evidence === "inferred_common" && <small className="inferred-label">{labels.inferred}</small>}
    <small className="understanding-resolution">{item.selectedFood && item.nutritionEligible !== false ? <CheckCircle2 aria-hidden="true" size={13}/> : <CircleDashed aria-hidden="true" size={13}/>} {item.selectedFood && item.nutritionEligible !== false ? labels.trusted : labels.unresolved}</small>
    {item.quantity?.status === "resolved" && <small>{item.quantity.estimated ? "≈" : "="} {Math.round((item.quantity.grams ?? 0) * 10) / 10} g</small>}
    {!!item.externalCandidates?.length && onConfirmExternal && <ExternalCandidateList candidates={item.externalCandidates} lang={lang} labels={labels} busy={busy} confirmingId={confirmingId} onConfirm={onConfirmExternal}/>}
  </li>;
}

export function FoodUnderstandingPreview({ value, lang, labels, busy, onConfirmAll, onConfirmExternal, confirmingExternalId }: {
  value: FoodUnderstandingPreviewValue;
  lang: Lang;
  labels: FoodUnderstandingLabels;
  busy: boolean;
  onConfirmAll: () => void;
  onConfirmExternal?: (candidate: ExternalCandidate, itemIndex?: number) => void;
  confirmingExternalId?: string | null;
}) {
  const rows = value.items?.length ? value.items : [value];
  const singleReady = !value.items?.length && value.canConfirm && value.selectedFood && value.quantity;
  const singleExternalCandidates = !value.items?.length ? value.externalCandidates : undefined;
  return <div className={`interpretation ${value.canConfirm ? "ready" : "needs-review"}`} role="status">
    <div className="understanding-heading">
      <strong>{labels.understood}</strong>
      {value.interpretationSource === "ai_assisted" && <span className="ai-assisted-badge"><Sparkles aria-hidden="true" size={11}/>{labels.aiAssisted}</span>}
    </div>
    {value.semantic?.dishName && <div><strong>{labels.dish}:</strong> {value.semantic.dishName}</div>}
    {(value.items?.length || value.interpretationSource === "ai_assisted") && <ul className="multi-preview-list">
      {rows.map((item, index) => <PreviewRow key={index} item={item} lang={lang} labels={labels} busy={busy} confirmingId={confirmingExternalId ?? null} onConfirmExternal={onConfirmExternal ? (candidate) => onConfirmExternal(candidate, index) : undefined}/>) }
    </ul>}
    {singleReady && <div>
      <strong>{itemName(value, lang)}</strong>
      {value.preparation && <em> · {preparationLabel(value.preparation, labels)}</em>}
      <span> · {value.parsed.quantity != null ? `${quantityText(value.parsed.quantity, value.parsed.unit, labels)} · ` : ""}{value.quantity?.estimated ? "≈" : "="} {Math.round((value.quantity?.grams ?? 0) * 10) / 10} g · {value.quantity?.estimated ? labels.estimated : labels.verified}</span>
    </div>}
    {!!singleExternalCandidates?.length && onConfirmExternal && <ExternalCandidateList candidates={singleExternalCandidates} lang={lang} labels={labels} busy={busy} confirmingId={confirmingExternalId ?? null} onConfirm={(candidate) => onConfirmExternal(candidate)}/>}
    {!value.items?.length && !singleReady && !singleExternalCandidates?.length && value.interpretationSource !== "ai_assisted" && <span>
      {value.foodResolution === "unresolved" ? labels.unresolved : value.quantity && "reason" in value.quantity ? labels.conversionMissing : labels.review}
    </span>}
    {(value.semantic?.clarificationNeeded || value.semantic?.clarificationReason) && <div className="clarification-note"><strong>{labels.needsDetail}</strong>{value.semantic.clarificationReason ? ` ${value.semantic.clarificationReason}` : ""}</div>}
    {!!value.items?.length && <button type="button" className="btn primary" disabled={!value.canConfirm || busy} onClick={onConfirmAll}>{busy ? "…" : labels.logAll}</button>}
  </div>;
}
