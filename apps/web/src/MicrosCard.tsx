import { useEffect, useState } from "react";
import { Pill } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";
import { PremiumBadge, PremiumNote } from "./PremiumBadge";

// Mikrotápanyagok (premium, 2026-10-16): the selected day's vitamins and
// minerals against the EU reference values (1169/2011, Annex XIII); sodium
// against the WHO upper guideline. Keto electrolytes come first.

type Nutrient = { key: string; group: "vitamin" | "mineral"; unit: string; amount: number; reference: number; kind: "min" | "max"; percent: number };
type Micros = { date: string; items: number; itemsWithData: number; nutrients: Nutrient[] };

const NAMES: Record<Lang, Record<string, string>> = {
  hu: { sodium: "Nátrium", potassium: "Kálium", magnesium: "Magnézium", calcium: "Kalcium", phosphorus: "Foszfor", iron: "Vas", zinc: "Cink", copper: "Réz", manganese: "Mangán", selenium: "Szelén", vitamin_a: "A-vitamin", vitamin_d: "D-vitamin", vitamin_e: "E-vitamin", vitamin_k: "K-vitamin", vitamin_c: "C-vitamin", vitamin_b1: "B1-vitamin (tiamin)", vitamin_b2: "B2-vitamin (riboflavin)", vitamin_b3: "B3-vitamin (niacin)", vitamin_b5: "B5-vitamin (pantoténsav)", vitamin_b6: "B6-vitamin", vitamin_b7: "B7-vitamin (biotin)", vitamin_b9: "B9-vitamin (folát)", vitamin_b12: "B12-vitamin" },
  de: { sodium: "Natrium", potassium: "Kalium", magnesium: "Magnesium", calcium: "Calcium", phosphorus: "Phosphor", iron: "Eisen", zinc: "Zink", copper: "Kupfer", manganese: "Mangan", selenium: "Selen", vitamin_a: "Vitamin A", vitamin_d: "Vitamin D", vitamin_e: "Vitamin E", vitamin_k: "Vitamin K", vitamin_c: "Vitamin C", vitamin_b1: "Vitamin B1 (Thiamin)", vitamin_b2: "Vitamin B2 (Riboflavin)", vitamin_b3: "Vitamin B3 (Niacin)", vitamin_b5: "Vitamin B5 (Pantothensäure)", vitamin_b6: "Vitamin B6", vitamin_b7: "Vitamin B7 (Biotin)", vitamin_b9: "Vitamin B9 (Folat)", vitamin_b12: "Vitamin B12" },
  en: { sodium: "Sodium", potassium: "Potassium", magnesium: "Magnesium", calcium: "Calcium", phosphorus: "Phosphorus", iron: "Iron", zinc: "Zinc", copper: "Copper", manganese: "Manganese", selenium: "Selenium", vitamin_a: "Vitamin A", vitamin_d: "Vitamin D", vitamin_e: "Vitamin E", vitamin_k: "Vitamin K", vitamin_c: "Vitamin C", vitamin_b1: "Vitamin B1 (thiamin)", vitamin_b2: "Vitamin B2 (riboflavin)", vitamin_b3: "Vitamin B3 (niacin)", vitamin_b5: "Vitamin B5 (pantothenic acid)", vitamin_b6: "Vitamin B6", vitamin_b7: "Vitamin B7 (biotin)", vitamin_b9: "Vitamin B9 (folate)", vitamin_b12: "Vitamin B12" }
};
const ELECTROLYTES = ["sodium", "potassium", "magnesium"];

const copy = {
  hu: { title: "Mikrotápanyagok", electrolytes: "Keto-elektrolitok", vitamins: "Vitaminok", minerals: "Ásványi anyagok", of: "a napi referenciaérték", max: "felső ajánlás", empty: "Erre a napra még nincs naplózott étkezés.", noData: "A mai tételekhez még nincs vitamin- és ásványianyag-adat az adatbázisban.", partial: (a: number, b: number) => `${b} tételből ${a} tápanyagadata ismert, a valós érték ennél magasabb lehet.`, source: "Referencia: EU tápanyag-referenciaértékek felnőtteknek (1169/2011/EU, XIII. melléklet); nátrium: WHO felső ajánlás. Tájékoztató adat, nem orvosi tanács.", premium_required: "A mikrotápanyagok prémium funkció.", failed: "Most nem sikerült betölteni.", loading: "Betöltés…" },
  de: { title: "Mikronährstoffe", electrolytes: "Keto-Elektrolyte", vitamins: "Vitamine", minerals: "Mineralstoffe", of: "des Tagesreferenzwerts", max: "Obergrenze", empty: "Für diesen Tag ist noch keine Mahlzeit erfasst.", noData: "Für die heutigen Positionen gibt es noch keine Vitamin- und Mineralstoffdaten.", partial: (a: number, b: number) => `Nährstoffdaten für ${a} von ${b} Positionen bekannt, der echte Wert kann höher sein.`, source: "Referenz: EU-Nährstoffbezugswerte für Erwachsene (VO (EU) 1169/2011, Anhang XIII); Natrium: WHO-Obergrenze. Information, keine ärztliche Beratung.", premium_required: "Mikronährstoffe sind eine Premium-Funktion.", failed: "Konnte gerade nicht geladen werden.", loading: "Lädt…" },
  en: { title: "Micronutrients", electrolytes: "Keto electrolytes", vitamins: "Vitamins", minerals: "Minerals", of: "of the daily reference", max: "upper guideline", empty: "No meal logged for this day yet.", noData: "Today's items have no vitamin and mineral data yet.", partial: (a: number, b: number) => `Nutrient data known for ${a} of ${b} items; the real value may be higher.`, source: "Reference: EU nutrient reference values for adults (Regulation (EU) 1169/2011, Annex XIII); sodium: WHO upper guideline. Information only, not medical advice.", premium_required: "Micronutrients is a premium feature.", failed: "Could not load right now.", loading: "Loading…" }
} as const;

const unitText = (u: string) => u === "ug" ? "µg" : u;

function Row({ n, lang }: { n: Nutrient; lang: Lang }) {
  const t = copy[lang];
  const fill = Math.min(n.percent, 100);
  const over = n.kind === "max" && n.percent > 100;
  return (
    <li className="micro-row">
      <div className="micro-head"><span>{NAMES[lang][n.key] ?? n.key}</span><span className="text-xs text-muted">{n.amount.toLocaleString(lang === "hu" ? "hu-HU" : lang === "de" ? "de-DE" : "en-GB")} {unitText(n.unit)} · {n.percent}% {n.kind === "max" ? t.max : t.of}</span></div>
      <div className="micro-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fill} aria-label={NAMES[lang][n.key]}><div className={`micro-fill ${over ? "is-over" : ""}`} style={{ width: `${fill}%` }}/></div>
    </li>
  );
}

export function MicrosCard({ lang, state, date }: { lang: Lang; state: ApiState; date: string }) {
  const t = copy[lang];
  const [data, setData] = useState<Micros | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setData(null); setError(null);
    api<Micros>(`/stats/micros?date=${date}&tzOffsetMinutes=${new Date().getTimezoneOffset()}`, {}, state)
      .then((r) => { if (alive) setData(r); })
      .catch((e) => { if (alive) setError(e instanceof ApiError && e.code === "premium_required" ? t.premium_required : t.failed); });
    return () => { alive = false; };
  }, [date, lang]);
  const group = (list: Nutrient[]) => <ul className="micro-list">{list.map((n) => <Row key={n.key} n={n} lang={lang}/>)}</ul>;
  return (
    <section className="card micros-card is-premium" aria-labelledby="micros-title">
      <div className="dinner-head">
        <h2 id="micros-title" className="section-heading"><Pill size={20} aria-hidden="true"/>{t.title} · {date}</h2>
        <PremiumBadge lang={lang}/>
      </div>
      <PremiumNote lang={lang}/>
      {error && <p className="status error" role="alert">{error}</p>}
      {!data && !error && <p role="status">{t.loading}</p>}
      {data && data.items === 0 && <p className="text-sm text-muted">{t.empty}</p>}
      {data && data.items > 0 && data.itemsWithData === 0 && <p className="text-sm text-muted">{t.noData}</p>}
      {data && data.itemsWithData > 0 && (
        <>
          {data.itemsWithData < data.items && <p className="status" role="status">{t.partial(data.itemsWithData, data.items)}</p>}
          <h3>{t.electrolytes}</h3>
          {group(ELECTROLYTES.map((k) => data.nutrients.find((n) => n.key === k)!).filter(Boolean))}
          <h3>{t.vitamins}</h3>
          {group(data.nutrients.filter((n) => n.group === "vitamin"))}
          <h3>{t.minerals}</h3>
          {group(data.nutrients.filter((n) => n.group === "mineral" && !ELECTROLYTES.includes(n.key)))}
        </>
      )}
      <p className="text-xs text-muted">{t.source}</p>
    </section>
  );
}
