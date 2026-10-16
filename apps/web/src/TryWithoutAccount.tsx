import { useState } from "react";
import { Search } from "lucide-react";
import { api, ApiError } from "./api";
import type { Lang } from "./i18n";

// "Próbáld ki regisztráció nélkül" (tier decision 2026-10-15): a visitor types
// what they intend to eat and sees its nutrition. Nothing is saved.

type Macros = { kcal: number; fat: number; protein: number; carbs: number; fiber: number; netCarbs: number };
type Item = { name: string; grams: number | null; status: "ok" | "estimated" | "assumed_100g" | "unclear"; macros: Macros | null; alternatives?: string[] };
type Result = { items: Item[]; totals: Macros };

const copy = {
  hu: { title: "Próbáld ki regisztráció nélkül", lead: "Írd be, mit szeretnél enni, és megmutatom a nettó szénhidrátot és a makrókat. Nem mentjük el, és nem kötjük senkihez.", label: "Mit szeretnél enni?", placeholder: "pl. 2 tojás 3 szelet bacon, vagy egy tányér pörkölt", go: "Mutasd", busy: "Számolom…", total: "Összesen", net: "nettó CH", estimated: "becsült mennyiség", assumed: "100 g-ra számolva", unclear: "Ezt nem ismertem fel – írd le másképp, vagy add meg grammban.", also: "Lehet ez is:", cta: "Naplózni és napi célt követni ingyenes fiókkal tudsz; a prémium funkciókat (pl. vacsoraajánló) a béta alatt ingyen kipróbálhatod.", limited: "Most túl sok próbálkozás érkezett, kérlek, próbáld újra pár perc múlva.", failed: "Most nem sikerült, próbáld újra." },
  de: { title: "Ohne Registrierung ausprobieren", lead: "Gib ein, was du essen möchtest, und ich zeige Netto-Kohlenhydrate und Makros. Nichts wird gespeichert oder einer Person zugeordnet.", label: "Was möchtest du essen?", placeholder: "z. B. 2 Eier 3 Scheiben Speck oder ein Teller Gulasch", go: "Zeigen", busy: "Berechne…", total: "Gesamt", net: "Netto-KH", estimated: "geschätzte Menge", assumed: "für 100 g berechnet", unclear: "Das habe ich nicht erkannt – anders formulieren oder in Gramm angeben.", also: "Könnte auch sein:", cta: "Tagebuch und Tagesziel gibt es mit einem kostenlosen Konto; Premium-Funktionen (z. B. Abendessen-Ideen) kannst du während der Beta gratis testen.", limited: "Gerade zu viele Anfragen, bitte in ein paar Minuten erneut versuchen.", failed: "Hat gerade nicht geklappt, bitte erneut versuchen." },
  en: { title: "Try it without signing up", lead: "Type what you intend to eat and see its net carbs and macros. Nothing is saved or tied to anyone.", label: "What do you want to eat?", placeholder: "e.g. 2 eggs 3 slices of bacon, or a plate of goulash", go: "Show me", busy: "Calculating…", total: "Total", net: "net carbs", estimated: "estimated amount", assumed: "calculated for 100 g", unclear: "I did not recognise this – rephrase it or give grams.", also: "Could also be:", cta: "Logging and a daily target come with a free account; premium features (like dinner ideas) are free to try during the beta.", limited: "Too many tries right now, please try again in a few minutes.", failed: "That did not work, please try again." }
} as const;

const line = (m: Macros, t: (typeof copy)[Lang]) => `${m.kcal} kcal · ${t.net} ${m.netCarbs} g · P ${m.protein} g · Z/F ${m.fat} g`;

export function TryWithoutAccount({ lang, mobileOpen = true }: { lang: Lang; mobileOpen?: boolean }) {
  const t = copy[lang];
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || text.trim().length < 2) return;
    setBusy(true); setError(null);
    try { setResult(await api<Result>("/public/try", { method: "POST", body: JSON.stringify({ text, lang }) })); }
    catch (e) { setResult(null); setError(e instanceof ApiError && e.status === 429 ? t.limited : t.failed); }
    finally { setBusy(false); }
  }
  return (
    <section className={`card try-card ${mobileOpen ? "" : "is-mobile-collapsed"}`} aria-labelledby="try-title">
      <h2 id="try-title" className="section-heading"><Search size={19} aria-hidden="true"/>{t.title}</h2>
      <p className="text-sm text-muted">{t.lead}</p>
      <form className="try-form" onSubmit={submit}>
        <label htmlFor="try-input" className="sr-only">{t.label}</label>
        <input id="try-input" className="field" value={text} maxLength={200} enterKeyHint="go" placeholder={t.placeholder} aria-label={t.label} onChange={(e) => setText(e.target.value)}/>
        <button className="btn primary" disabled={busy || text.trim().length < 2}>{busy ? t.busy : t.go}</button>
      </form>
      {error && <p className="status error" role="alert">{error}</p>}
      {result && (
        <div className="try-result" role="status">
          <ul>
            {result.items.map((item, i) => (
              <li key={i}>
                <strong>{item.name}</strong>{item.grams ? <span className="text-muted"> · {item.grams} g</span> : null}
                {item.macros ? <div className="text-sm">{line(item.macros, t)}</div> : <div className="text-sm text-muted">{t.unclear}</div>}
                {(item.status === "estimated" || item.status === "assumed_100g") && <div className="text-xs text-muted">{item.status === "estimated" ? t.estimated : t.assumed}</div>}
                {item.alternatives?.length ? <div className="text-xs text-muted">{t.also} {item.alternatives.join(", ")}</div> : null}
              </li>
            ))}
          </ul>
          {result.items.filter((i) => i.macros).length > 1 && <p className="try-total"><strong>{t.total}:</strong> {line(result.totals, t)}</p>}
          <p className="text-xs text-muted">{t.cta}</p>
        </div>
      )}
    </section>
  );
}
