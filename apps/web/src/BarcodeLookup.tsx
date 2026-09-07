import { useState } from "react";
import { Barcode } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import { dict, type Lang } from "./i18n";
import type { Food } from "./main";

type BarcodeCandidate = { source: "open_food_facts"; sourceId: string; name: string; brand?: string; kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number };
type BarcodeResolution =
  | { status: "resolved_local"; food: Food }
  | { status: "confirmation_required"; candidate: BarcodeCandidate; reason?: "possible_duplicate" }
  | { status: "incomplete"; product: { name: string; brand?: string; barcode: string } }
  | { status: "not_found" }
  | { status: "external_unavailable" };

function barcodeErrorText(error: unknown, labels: Record<string, string>) {
  if (!(error instanceof ApiError)) return labels.unknown;
  return labels[error.code] ?? (error.status === 401 ? labels.unauthorized : error.status && error.status >= 500 ? labels.server ?? labels.unknown : labels.unknown);
}

/**
 * Manual-barcode entry point for packaged foods: local-first lookup, then an
 * Open Food Facts candidate the user must explicitly confirm before it's
 * ever persisted. Confirmation reuses the exact same trusted
 * /foods/resolve-external/confirm flow already used for USDA candidates, so
 * a confirmed product becomes an ordinary Food usable anywhere FoodCombobox
 * is used — no separate barcode-only catalog.
 */
export function BarcodeLookup({ lang, state, onFoodConfirmed }: { lang: Lang; state: ApiState; onFoodConfirmed: (food: Food) => void }) {
  const t = dict[lang].barcode;
  const errors = dict[lang].barcodeErrors;
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState("");
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState<BarcodeResolution | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  async function lookup() {
    if (looking || !value.trim()) return;
    setLooking(true);
    setError("");
    setResult(null);
    setSuccess(false);
    try {
      const outcome = await api<BarcodeResolution>(`/foods/resolve-barcode?barcode=${encodeURIComponent(value.trim())}`, {}, state);
      if (outcome.status === "resolved_local") {
        onFoodConfirmed(outcome.food);
        setSuccess(true);
      } else {
        setResult(outcome);
      }
    } catch (caught) {
      setError(barcodeErrorText(caught, errors));
    } finally {
      setLooking(false);
    }
  }

  async function confirm(candidate: BarcodeCandidate) {
    if (confirming) return;
    setConfirming(true);
    setError("");
    try {
      const outcome = await api<any>("/foods/resolve-external/confirm", { method: "POST", body: JSON.stringify({ source: candidate.source, sourceId: candidate.sourceId }) }, state);
      if (outcome.status === "confirmed" || outcome.status === "existing") {
        onFoodConfirmed(outcome.food as Food);
        setResult(null);
        setSuccess(true);
      } else if (outcome.status === "confirmation_required") {
        setError(errors.confirmation_required);
      } else {
        setError(errors.invalid_external_data);
      }
    } catch (caught) {
      setError(barcodeErrorText(caught, errors));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="barcode-lookup">
      <button type="button" className="btn secondary" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <Barcode size={16}/>{t.toggleLabel}
      </button>
      {expanded && (
        <div className="barcode-panel">
          <label htmlFor="barcode-input">{t.inputLabel}
            <div className="barcode-input-row">
              <input id="barcode-input" className="field" inputMode="numeric" placeholder={t.placeholder} value={value}
                onChange={(event) => { setValue(event.target.value); setResult(null); setError(""); setSuccess(false); }}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); lookup(); } }}/>
              <button type="button" className="btn secondary" disabled={looking || !value.trim()} aria-busy={looking} onClick={lookup}>{looking ? t.looking : t.lookupButton}</button>
            </div>
          </label>

          {error && <div className="status error" role="alert">{error}</div>}
          {success && <div className="status success" role="status">{t.addedSuccess}</div>}

          {result?.status === "not_found" && <p className="text-sm text-muted" role="status">{t.notFound}</p>}
          {result?.status === "external_unavailable" && <div className="status error" role="alert">{errors.external_unavailable}</div>}

          {result?.status === "incomplete" && (
            <div className="barcode-preview">
              <strong>{result.product.name}</strong>
              {result.product.brand && <span className="text-xs text-muted"> · {result.product.brand}</span>}
              <p className="text-xs text-muted">{t.sourceLabel}: {t.sourceName}</p>
              <p className="status error" role="alert">{t.incompleteWarning}</p>
            </div>
          )}

          {result?.status === "confirmation_required" && (
            <div className="barcode-preview">
              <strong>{result.candidate.name}</strong>
              {result.candidate.brand && <span className="text-xs text-muted"> · {result.candidate.brand}</span>}
              <p className="text-xs text-muted">{t.sourceLabel}: {t.sourceName}</p>
              <div className="nutrition-summary">
                <span>{Math.round(result.candidate.kcalPer100g)} kcal</span>
                <span>{result.candidate.proteinPer100g} g protein</span>
                <span>{result.candidate.fatPer100g} g fat</span>
                <span>{result.candidate.carbsPer100g} g carbs</span>
                <span>{result.candidate.fiberPer100g} g fiber</span>
              </div>
              {result.reason === "possible_duplicate" && <p className="status error" role="alert">{errors.confirmation_required}</p>}
              {result.reason !== "possible_duplicate" && (
                <button type="button" className="btn primary" disabled={confirming} aria-busy={confirming} onClick={() => confirm(result.candidate)}>
                  {confirming ? t.confirming : t.confirmButton}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
