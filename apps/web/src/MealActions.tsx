import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import { dict, type Lang } from "./i18n";
import { type Totals } from "./main";

export type MealItemDetail = { id: string; quantityGrams: number; displayName: string | null; totals: Totals };
export type MealDetail = { id: string; title: string; eatenAt: string; totals: Totals; items: MealItemDetail[] };

function mealErrorText(error: unknown, labels: Record<string, string>) {
  if (!(error instanceof ApiError)) return labels.unknown;
  return labels[error.code] ?? (error.status === 401 ? labels.unauthorized : error.status && error.status >= 500 ? labels.server : labels.unknown);
}

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function MealEditDialog({ meal, lang, state, onCancel, onSaved }: {
  meal: MealDetail; lang: Lang; state: ApiState; onCancel: () => void; onSaved: () => Promise<void> | void;
}) {
  const t = dict[lang];
  const [title, setTitle] = useState(meal.title);
  const [eatenAtLocal, setEatenAtLocal] = useState(() => toDatetimeLocalValue(meal.eatenAt));
  const [items, setItems] = useState(() => meal.items.map((item) => ({ id: item.id, displayName: item.displayName ?? "", grams: String(item.quantityGrams), removed: false })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = items.filter((item) => !item.removed);
  const gramsValid = (value: string) => { const n = Number(value); return Number.isFinite(n) && n > 0 && n <= 50_000; };
  const allValid = remaining.every((item) => gramsValid(item.grams));
  const canSave = remaining.length > 0 && allValid;

  async function submit() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (title.trim() !== meal.title) body.title = title.trim();
      const eatenAtIso = new Date(eatenAtLocal).toISOString();
      if (eatenAtIso !== new Date(meal.eatenAt).toISOString()) body.eatenAt = eatenAtIso;
      const corrections = items.filter((item) => !item.removed).filter((item) => Number(item.grams) !== meal.items.find((original) => original.id === item.id)?.quantityGrams);
      if (corrections.length) body.items = corrections.map((item) => ({ mealItemId: item.id, quantityGrams: Number(item.grams) }));
      const removeItemIds = items.filter((item) => item.removed).map((item) => item.id);
      if (removeItemIds.length) body.removeItemIds = removeItemIds;

      if (Object.keys(body).length === 0) { onCancel(); return; }

      await api(`/meals/${meal.id}`, { method: "PATCH", body: JSON.stringify(body) }, state);
      await onSaved();
    } catch (caught) {
      setError(mealErrorText(caught, t.mealErrors));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t.diary.editMeal}>
      <div className="modal-panel card">
        <div className="modal-header">
          <h3>{t.diary.editMeal}</h3>
          <button type="button" className="icon-button" aria-label={t.diary.cancel} onClick={onCancel}><X size={18}/></button>
        </div>
        <label className="modal-field">{t.mealName}<input className="field" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100}/></label>
        <label className="modal-field">{t.diary.editTime}<input type="datetime-local" className="field" value={eatenAtLocal} max={toDatetimeLocalValue(new Date().toISOString())} onChange={(event) => setEatenAtLocal(event.target.value)}/></label>
        <div className="edit-items">
          {items.map((item) => !item.removed && (
            <div className="edit-item-row" key={item.id}>
              <span className="edit-item-name">{item.displayName}</span>
              <input type="number" className="field edit-item-grams" min="1" max="50000" step="1" value={item.grams}
                aria-label={`${item.displayName} — ${t.quantity}`}
                onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, grams: event.target.value } : row))}/>
              <span className="edit-item-unit">g</span>
              {remaining.length > 1 && (
                <button type="button" className="icon-button meal-action-btn" aria-label={t.diary.removeItem} onClick={() => setItems((current) => current.map((row) => row.id === item.id ? { ...row, removed: true } : row))}>
                  <Trash2 size={14}/>
                </button>
              )}
            </div>
          ))}
        </div>
        {error && <div className="status error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>{t.diary.cancel}</button>
          <button type="button" className="btn primary" onClick={submit} disabled={!canSave || saving} aria-busy={saving}>{saving ? t.savingMeal : t.save}</button>
        </div>
      </div>
    </div>
  );
}

export function DeleteMealDialog({ lang, onCancel, onConfirm }: { lang: Lang; onCancel: () => void; onConfirm: () => Promise<void> | void }) {
  const t = dict[lang];
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (caught) {
      setError(mealErrorText(caught, t.mealErrors));
      setDeleting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true">
      <div className="modal-panel card">
        <p>{t.diary.confirmDelete}</p>
        {error && <div className="status error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onCancel} disabled={deleting}>{t.diary.cancel}</button>
          <button type="button" className="btn danger" onClick={confirm} disabled={deleting} aria-busy={deleting}>{deleting ? t.savingMeal : t.diary.deleteMeal}</button>
        </div>
      </div>
    </div>
  );
}
