import type { Lang } from "./i18n";

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
};

function itemName(item: PreviewItem, lang: Lang) {
  return item.selectedFood?.names?.[lang] ?? item.selectedFood?.name ?? item.semanticItem?.canonicalName ?? item.parsed.foodQuery;
}

function PreviewRow({ item, lang, labels }: { item: PreviewItem; lang: Lang; labels: FoodUnderstandingLabels }) {
  const quantity = item.parsed.quantity != null ? `${item.parsed.quantity} ${item.parsed.unit ?? ""}`.trim() : null;
  return <li className="understanding-item">
    <div><strong>{quantity ? `${quantity} ${itemName(item, lang)}` : itemName(item, lang)}</strong></div>
    {item.preparation && <small>{labels.preparation}: {item.preparation}</small>}
    {!!item.semanticItem?.modifiers?.length && <small>{labels.modifiers}: {item.semanticItem.modifiers.join(", ")}</small>}
    {!!item.semanticItem?.excludedModifiers?.length && <small>{labels.excluded}: {item.semanticItem.excludedModifiers.join(", ")}</small>}
    {item.semanticItem?.evidence === "inferred_common" && <small className="inferred-label">{labels.inferred}</small>}
    <small>{item.selectedFood && item.nutritionEligible !== false ? labels.trusted : labels.unresolved}</small>
    {item.quantity?.status === "resolved" && <small>{item.quantity.estimated ? "≈" : "="} {Math.round((item.quantity.grams ?? 0) * 10) / 10} g</small>}
  </li>;
}

export function FoodUnderstandingPreview({ value, lang, labels, busy, onConfirmAll }: {
  value: FoodUnderstandingPreviewValue;
  lang: Lang;
  labels: FoodUnderstandingLabels;
  busy: boolean;
  onConfirmAll: () => void;
}) {
  const rows = value.items?.length ? value.items : [value];
  const singleReady = !value.items?.length && value.canConfirm && value.selectedFood && value.quantity;
  return <div className={`interpretation ${value.canConfirm ? "ready" : "needs-review"}`} role="status">
    <div className="understanding-heading">
      <strong>{labels.understood}</strong>
      {value.interpretationSource === "ai_assisted" && <span className="ai-assisted-badge">{labels.aiAssisted}</span>}
    </div>
    {value.semantic?.dishName && <div><strong>{labels.dish}:</strong> {value.semantic.dishName}</div>}
    {(value.items?.length || value.interpretationSource === "ai_assisted") && <ul className="multi-preview-list">
      {rows.map((item, index) => <PreviewRow key={index} item={item} lang={lang} labels={labels}/>) }
    </ul>}
    {singleReady && <div>
      <strong>{itemName(value, lang)}</strong>
      {value.preparation && <em> · {value.preparation}</em>}
      <span> · {value.parsed.quantity != null ? `${value.parsed.quantity} ${value.parsed.unit ?? ""} · ` : ""}{value.quantity?.estimated ? "≈" : "="} {Math.round((value.quantity?.grams ?? 0) * 10) / 10} g · {value.quantity?.estimated ? labels.estimated : labels.verified}</span>
    </div>}
    {!value.items?.length && !singleReady && value.interpretationSource !== "ai_assisted" && <span>
      {value.foodResolution === "unresolved" ? labels.unresolved : value.quantity && "reason" in value.quantity ? labels.conversionMissing : labels.review}
    </span>}
    {(value.semantic?.clarificationNeeded || value.semantic?.clarificationReason) && <div className="clarification-note"><strong>{labels.needsDetail}</strong>{value.semantic.clarificationReason ? ` ${value.semantic.clarificationReason}` : ""}</div>}
    {!!value.items?.length && <button type="button" className="btn primary" disabled={!value.canConfirm || busy} onClick={onConfirmAll}>{busy ? "…" : labels.logAll}</button>}
  </div>;
}
