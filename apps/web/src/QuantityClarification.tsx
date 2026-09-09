import { useState } from "react";
import type { QuantityClarification as Clarification } from "@keto-mentor/shared";
import { quantityLabels, type Lang } from "./i18n";

const unitNames: Record<Lang, Record<string, string>> = {
  hu: { piece: "darab", slice: "szelet", portion: "adag", plate: "tányér", bowl: "tál", ladle: "merőkanál", tbsp: "evőkanál", tsp: "teáskanál", cup: "csésze", handful: "marék", half: "fél", quarter: "negyed" },
  de: { piece: "Stück", slice: "Scheibe", portion: "Portion", plate: "Teller", bowl: "Schüssel", ladle: "Kelle", tbsp: "Esslöffel", tsp: "Teelöffel", cup: "Tasse", handful: "Handvoll", half: "Hälfte", quarter: "Viertel" },
  en: { piece: "piece", slice: "slice", portion: "portion", plate: "plate", bowl: "bowl", ladle: "ladle", tbsp: "tablespoon", tsp: "teaspoon", cup: "cup", handful: "handful", half: "half", quarter: "quarter" }
};

export function QuantityClarification({ value, foodName, quantity, unit, lang, onResolve }: {
  value: Clarification; foodName: string; lang: Lang;
  quantity?: number; unit?: string;
  onResolve: (grams: number, corrected: boolean) => void;
}) {
  const [editing, setEditing] = useState(value.type !== "estimate_confirmation");
  const [grams, setGrams] = useState("");
  const labels = quantityLabels[lang];
  const valid = Number.isFinite(Number(grams)) && Number(grams) > 0 && Number(grams) <= 5000;
  return <div className="quantity-clarification" aria-live="polite">
    <strong>{value.type === "estimate_confirmation" ? `${quantity ?? 1} ${unitNames[lang][unit ?? ""] ?? unit ?? ""} ${foodName} ≈ ${value.suggestedGrams?.toLocaleString(lang)} g` : foodName}</strong>
    {value.type === "estimate_confirmation" ? <>
      <span>{value.method === "ai_estimated" ? labels.aiEstimated : labels.estimated}</span>
      {value.basis === "volume" && <small className="quantity-basis-note">{labels.basisVolume}</small>}
      {value.rangeGrams && <small>{labels.range}: {value.rangeGrams.min.toLocaleString(lang)}–{value.rangeGrams.max.toLocaleString(lang)} g</small>}
      {value.confidence != null && <small>{labels.confidence}: {Math.round(value.confidence * 100)}%</small>}
    </> : <span>{value.type === "quantity_missing" ? labels.missing : labels.gramsRequired}</span>}
    {!editing ? <div className="quantity-actions">
      <button type="button" className="btn primary" disabled={!value.suggestedGrams || value.suggestedGrams > 5000} onClick={() => onResolve(value.suggestedGrams!, false)}>{labels.accept}</button>
      <button type="button" className="btn secondary" onClick={() => setEditing(true)}>{labels.change}</button>
    </div> : <div className="quantity-actions">
      <label>{labels.grams}<input className="field" aria-label={labels.grams} type="number" min="0.1" max="5000" step="any" value={grams} onChange={(event) => setGrams(event.target.value)}/></label>
      <button type="button" className="btn primary" disabled={!valid} onClick={() => onResolve(Number(grams), true)}>{labels.accept}</button>
    </div>}
  </div>;
}
