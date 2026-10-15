import { useState } from "react";
import { Moon, Plus } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";

// Vacsoraajánló (owner decisions 2026-10-15): own recipes and reference
// dishes at one usual serving that keep the selected day within the net-carb
// and calorie targets. Premium, open to everyone while in beta.

type Macros = { kcal: number; protein: number; netCarbs: number; fat: number };
type Suggestion = { recipeId: string; source: "own" | "reference"; title: string; servingGrams: number | null; perServing: Macros; after: Macros };
type Result = { remaining: Macros; status: "ok" | "carb_budget_used" | "kcal_budget_used" | "nothing_fits"; suggestions: Suggestion[] };

const copy = {
  hu: {
    title: "Vacsoraajánló", badge: "Prémium · béta", lead: "A nap eddigi étkezései alapján olyan vacsorát ajánl, ami belefér a szénhidrát- és kalóriakeretedbe, és pótolja a hiányzó fehérjét.",
    ask: "Mit egyek vacsorára?", again: "Újraszámolás", loading: "Számolom…", remaining: "Még belefér ma",
    own: "Saját recept", reference: "Referenciaétel", serving: "1 adag", after: "Utána marad", log: "Naplózom vacsoraként", logged: "Naplózva vacsoraként.",
    carb_budget_used: "A mai nettó szénhidrátkereted már elfogyott, ezért most nem ajánlok vacsorát. Egy kis zöldsaláta olajjal vagy tojás jöhet, ha éhes vagy.",
    kcal_budget_used: "A mai kalóriakereted már elfogyott, ezért most nem ajánlok vacsorát.",
    nothing_fits: "Most egyik receptem sem fér bele szokásos adagban a maradék keretbe. Próbálj egy könnyű, saját receptet felvenni.",
    premium_required: "A Vacsoraajánló prémium funkció.", failed: "Az ajánlás most nem sikerült, próbáld újra."
  },
  de: {
    title: "Abendessen-Vorschlag", badge: "Premium · Beta", lead: "Schlägt nach deinen bisherigen Mahlzeiten ein Abendessen vor, das in dein Kohlenhydrat- und Kalorienziel passt und fehlendes Eiweiß ergänzt.",
    ask: "Was esse ich zu Abend?", again: "Neu berechnen", loading: "Berechne…", remaining: "Heute noch frei",
    own: "Eigenes Rezept", reference: "Referenzgericht", serving: "1 Portion", after: "Danach übrig", log: "Als Abendessen eintragen", logged: "Als Abendessen eingetragen.",
    carb_budget_used: "Dein Netto-Kohlenhydratziel für heute ist erreicht, deshalb schlage ich kein Abendessen vor.",
    kcal_budget_used: "Dein Kalorienziel für heute ist erreicht, deshalb schlage ich kein Abendessen vor.",
    nothing_fits: "Gerade passt kein Gericht in üblicher Portion in dein Restbudget.",
    premium_required: "Der Abendessen-Vorschlag ist eine Premium-Funktion.", failed: "Der Vorschlag hat nicht geklappt, bitte erneut versuchen."
  },
  en: {
    title: "Dinner ideas", badge: "Premium · beta", lead: "Suggests a dinner that fits your remaining net-carb and calorie targets for the day and fills the missing protein.",
    ask: "What should I eat for dinner?", again: "Recalculate", loading: "Calculating…", remaining: "Still fits today",
    own: "Own recipe", reference: "Reference dish", serving: "1 serving", after: "Left after", log: "Log as dinner", logged: "Logged as dinner.",
    carb_budget_used: "Today's net-carb target is used up, so no dinner suggestion right now.",
    kcal_budget_used: "Today's calorie target is used up, so no dinner suggestion right now.",
    nothing_fits: "No dish fits your remaining targets at a usual serving right now.",
    premium_required: "Dinner ideas is a premium feature.", failed: "The suggestion failed, please try again."
  }
} as const;

const macroLine = (m: Macros) => `${m.kcal} kcal · P ${m.protein} g · NCH ${m.netCarbs} g`;

export function DinnerSuggestions({ lang, state, date, onLogged }: { lang: Lang; state: ApiState; date: string; onLogged: () => void | Promise<void> }) {
  const t = copy[lang];
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  async function load() {
    setLoading(true); setError(null); setLogged(false);
    try {
      setResult(await api<Result>(`/meals/dinner-suggestions?date=${date}&tzOffsetMinutes=${new Date().getTimezoneOffset()}&lang=${lang}`, {}, state));
    } catch (e) {
      setResult(null);
      setError(e instanceof ApiError && e.code === "premium_required" ? t.premium_required : t.failed);
    } finally { setLoading(false); }
  }

  async function log(s: Suggestion) {
    setLogging(s.recipeId); setError(null);
    try {
      await api(`/recipes/${s.recipeId}/meals`, { method: "POST", body: JSON.stringify({ mealType: "dinner", quantity: 1, unit: "serving" }) }, state);
      setResult(null); setLogged(true);
      await onLogged();
    } catch { setError(t.failed); } finally { setLogging(null); }
  }

  return (
    <section className="card dinner-card" aria-labelledby="dinner-title">
      <div className="dinner-head">
        <h2 id="dinner-title" className="section-heading"><Moon size={20} aria-hidden="true"/>{t.title}</h2>
        <span className="recipe-badge">{t.badge}</span>
      </div>
      <p className="text-sm text-muted">{t.lead}</p>
      <button type="button" className="btn primary" onClick={load} disabled={loading}>{loading ? t.loading : result ? t.again : t.ask}</button>
      {logged && <p className="status success" role="status">{t.logged}</p>}
      {error && <p className="status error" role="alert">{error}</p>}
      {result && (
        <div className="dinner-result">
          <p className="text-sm"><strong>{t.remaining}:</strong> {macroLine(result.remaining)}</p>
          {result.status !== "ok" && <p className="status" role="status">{t[result.status]}</p>}
          <ul className="dinner-list">
            {result.suggestions.map((s) => (
              <li key={s.recipeId} className="dinner-item">
                <div>
                  <strong>{s.title}</strong>
                  <span className="text-xs text-muted"> · {s.source === "own" ? t.own : t.reference} · {t.serving}{s.servingGrams ? ` (${s.servingGrams} g)` : ""}</span>
                  <div className="text-sm">{macroLine(s.perServing)}</div>
                  <div className="text-xs text-muted">{t.after}: {macroLine(s.after)}</div>
                </div>
                <button type="button" className="btn ghost" onClick={() => log(s)} disabled={logging !== null} aria-label={`${t.log}: ${s.title}`}><Plus size={16} aria-hidden="true"/>{t.log}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
