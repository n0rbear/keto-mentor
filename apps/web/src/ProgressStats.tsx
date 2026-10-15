import { useEffect, useState } from "react";
import { LineChart, Trash2 } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";
import { PremiumBadge, PremiumNote } from "./PremiumBadge";

// Haladó statisztika és testsúlynapló (premium, 2026-10-16): keto adherence
// week by week, the current keto streak, weekly averages and a weight chart.
// Single-series charts in the brand colour, each with a table view.

type Week = { weekStart: string; loggedDays: number; ketoDays: number; percent: number | null; avg: { kcal: number; protein: number; netCarbs: number } | null };
type Weight = { date: string; weightKg: number };
type Progress = { weeks: Week[]; streak: number; percent: number | null; goalNetCarbs: number; today: string; weights: Weight[] };

const copy = {
  hu: {
    title: "Haladó statisztika", adherence: "Keto-tartás (8 hét)", streak: "Keto-sorozat", days: (n: number) => `${n} nap`,
    weekly: "Keto-napok aránya hetente", weekHint: (w: Week, goal: number) => w.loggedDays ? `${w.ketoDays} / ${w.loggedDays} naplózott nap ≤ ${goal} g nettó CH · átlag ${w.avg!.kcal} kcal, ${w.avg!.protein} g fehérje, ${w.avg!.netCarbs} g nettó CH` : "Nincs naplózott nap",
    noData: "Még nincs elég naplózott nap a statisztikához.", weight: "Testsúly", weightLabel: "Testsúly (kg)", dateLabel: "Dátum", save: "Mentés",
    table: "Táblázat", chart: "Grafikon", week: "Hét", ketoDays: "Keto-nap", avg: "Átlag kcal / P / NCH", noWeight: "Még nincs rögzített testsúly. Írd be a mait!",
    change: (d: number) => `${d > 0 ? "+" : ""}${d.toLocaleString("hu-HU", { maximumFractionDigits: 1 })} kg az első mérés óta`, remove: "Törlés",
    premium_required: "A haladó statisztika prémium funkció.", failed: "Most nem sikerült, próbáld újra.", loading: "Betöltés…"
  },
  de: {
    title: "Erweiterte Statistik", adherence: "Keto-Treue (8 Wochen)", streak: "Keto-Serie", days: (n: number) => `${n} Tage`,
    weekly: "Anteil Keto-Tage pro Woche", weekHint: (w: Week, goal: number) => w.loggedDays ? `${w.ketoDays} / ${w.loggedDays} erfasste Tage ≤ ${goal} g Netto-KH · Ø ${w.avg!.kcal} kcal, ${w.avg!.protein} g Eiweiß, ${w.avg!.netCarbs} g Netto-KH` : "Keine erfassten Tage",
    noData: "Noch zu wenige erfasste Tage für eine Statistik.", weight: "Gewicht", weightLabel: "Gewicht (kg)", dateLabel: "Datum", save: "Speichern",
    table: "Tabelle", chart: "Diagramm", week: "Woche", ketoDays: "Keto-Tage", avg: "Ø kcal / E / NKH", noWeight: "Noch kein Gewicht eingetragen. Trag das heutige ein!",
    change: (d: number) => `${d > 0 ? "+" : ""}${d.toLocaleString("de-DE", { maximumFractionDigits: 1 })} kg seit der ersten Messung`, remove: "Löschen",
    premium_required: "Die erweiterte Statistik ist eine Premium-Funktion.", failed: "Hat gerade nicht geklappt, bitte erneut versuchen.", loading: "Lädt…"
  },
  en: {
    title: "Advanced stats", adherence: "Keto adherence (8 weeks)", streak: "Keto streak", days: (n: number) => `${n} days`,
    weekly: "Share of keto days per week", weekHint: (w: Week, goal: number) => w.loggedDays ? `${w.ketoDays} / ${w.loggedDays} logged days ≤ ${goal} g net carbs · avg ${w.avg!.kcal} kcal, ${w.avg!.protein} g protein, ${w.avg!.netCarbs} g net carbs` : "No logged days",
    noData: "Not enough logged days for statistics yet.", weight: "Weight", weightLabel: "Weight (kg)", dateLabel: "Date", save: "Save",
    table: "Table", chart: "Chart", week: "Week", ketoDays: "Keto days", avg: "Avg kcal / P / NC", noWeight: "No weight logged yet. Add today's!",
    change: (d: number) => `${d > 0 ? "+" : ""}${d.toLocaleString("en-GB", { maximumFractionDigits: 1 })} kg since the first entry`, remove: "Delete",
    premium_required: "Advanced stats is a premium feature.", failed: "That did not work, please try again.", loading: "Loading…"
  }
} as const;

const locale = (lang: Lang) => lang === "hu" ? "hu-HU" : lang === "de" ? "de-DE" : "en-GB";
const shortDate = (date: string, lang: Lang) => new Intl.DateTimeFormat(locale(lang), { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
// Bar labels need the narrowest form ("9. 14.", "14.9.", "14/09") to fit eight weeks on a phone.
const tinyDate = (date: string, lang: Lang) => new Intl.DateTimeFormat(locale(lang), { month: "numeric", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

function WeeklyBars({ weeks, goal, lang }: { weeks: Week[]; goal: number; lang: Lang }) {
  const t = copy[lang];
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="stats-bars-wrap">
      <div className="stats-bars" role="img" aria-label={`${t.weekly}: ${weeks.map((w) => `${shortDate(w.weekStart, lang)} ${w.percent ?? "–"}%`).join(", ")}`}>
        {weeks.map((w, i) => (
          <div key={w.weekStart} className="stats-bar-slot" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(hover === i ? null : i)}>
            <span className="stats-bar-value">{w.percent == null ? "–" : `${w.percent}%`}</span>
            <div className="stats-bar-track"><div className={`stats-bar ${w.percent == null ? "is-empty" : ""}`} style={{ height: `${w.percent ?? 0}%` }}/></div>
            <span className="stats-bar-label">{tinyDate(w.weekStart, lang)}</span>
          </div>
        ))}
      </div>
      {hover != null && <p className="stats-tooltip text-xs">{shortDate(weeks[hover].weekStart, lang)}: {t.weekHint(weeks[hover], goal)}</p>}
    </div>
  );
}

function WeightChart({ weights, lang }: { weights: Weight[]; lang: Lang }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320, H = 140, P = { l: 34, r: 10, t: 12, b: 22 };
  const values = weights.map((w) => w.weightKg);
  const min = Math.floor(Math.min(...values) - 0.5), max = Math.ceil(Math.max(...values) + 0.5);
  const times = weights.map((w) => new Date(`${w.date}T12:00:00Z`).getTime());
  const t0 = times[0], t1 = times[times.length - 1];
  const x = (t: number) => P.l + (t1 === t0 ? (W - P.l - P.r) / 2 : ((t - t0) / (t1 - t0)) * (W - P.l - P.r));
  const y = (v: number) => P.t + ((max - v) / (max - min || 1)) * (H - P.t - P.b);
  const path = weights.map((w, i) => `${i ? "L" : "M"}${x(times[i]).toFixed(1)},${y(w.weightKg).toFixed(1)}`).join(" ");
  const fmt = (v: number) => v.toLocaleString(locale(lang), { maximumFractionDigits: 1 });
  return (
    <svg className="weight-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={weights.map((w) => `${shortDate(w.date, lang)} ${fmt(w.weightKg)} kg`).join(", ")}>
      {[min, (min + max) / 2, max].map((v) => (
        <g key={v}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className="chart-grid"/><text x={P.l - 6} y={y(v) + 3} className="chart-axis" textAnchor="end">{fmt(v)}</text></g>
      ))}
      <text x={P.l} y={H - 6} className="chart-axis">{shortDate(weights[0].date, lang)}</text>
      {weights.length > 1 && <text x={W - P.r} y={H - 6} className="chart-axis" textAnchor="end">{shortDate(weights[weights.length - 1].date, lang)}</text>}
      <path d={path} className="chart-line"/>
      {weights.map((w, i) => (
        <g key={w.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
          <circle cx={x(times[i])} cy={y(w.weightKg)} r={12} className="chart-hit"/>
          <circle cx={x(times[i])} cy={y(w.weightKg)} r={hover === i ? 5 : 4} className="chart-dot"/>
        </g>
      ))}
      {hover != null && (() => {
        const w = weights[hover]; const cx = Math.min(Math.max(x(times[hover]), P.l + 40), W - P.r - 40); const cy = Math.max(y(w.weightKg) - 14, 12);
        return <g className="chart-tip"><rect x={cx - 40} y={cy - 12} width={80} height={18} rx={4}/><text x={cx} y={cy + 1} textAnchor="middle">{shortDate(w.date, lang)} · {fmt(w.weightKg)} kg</text></g>;
      })()}
    </svg>
  );
}

export function ProgressStats({ lang, state, today }: { lang: Lang; state: ApiState; today: string }) {
  const t = copy[lang];
  const [data, setData] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asTable, setAsTable] = useState(false);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const fail = (e: unknown) => setError(e instanceof ApiError && e.code === "premium_required" ? t.premium_required : t.failed);
  const load = () => api<Progress>(`/stats/progress?weeks=8&tzOffsetMinutes=${new Date().getTimezoneOffset()}`, {}, state).then((r) => { setData(r); setError(null); }).catch(fail);
  useEffect(() => { void load(); }, [today]);

  async function saveWeight(event: React.FormEvent) {
    event.preventDefault();
    const kg = Number(weight.replace(",", "."));
    if (!Number.isFinite(kg) || kg < 20 || kg > 400) return;
    setBusy(true);
    try { await api(`/stats/weights`, { method: "PUT", body: JSON.stringify({ date, weightKg: kg }) }, state); setWeight(""); await load(); } catch (e) { fail(e); } finally { setBusy(false); }
  }
  async function remove(d: string) {
    setBusy(true);
    try { await api(`/stats/weights/${d}`, { method: "DELETE" }, state); await load(); } catch (e) { fail(e); } finally { setBusy(false); }
  }

  const weights = data?.weights ?? [];
  const recent = weights.slice(-60);
  const hasDays = !!data?.weeks.some((w) => w.loggedDays > 0);
  return (
    <section className="card stats-card is-premium" aria-labelledby="stats-title">
      <div className="dinner-head">
        <h2 id="stats-title" className="section-heading"><LineChart size={20} aria-hidden="true"/>{t.title}</h2>
        <PremiumBadge lang={lang}/>
      </div>
      <PremiumNote lang={lang}/>
      {error && <p className="status error" role="alert">{error}</p>}
      {!data && !error && <p role="status">{t.loading}</p>}
      {data && (
        <>
          <div className="stats-tiles">
            <div className="metric-tile"><div className="metric-label">{t.adherence}</div><strong className="metric-value">{data.percent == null ? "–" : `${data.percent}%`}</strong></div>
            <div className="metric-tile"><div className="metric-label">{t.streak}</div><strong className="metric-value">{t.days(data.streak)}</strong></div>
          </div>
          <div className="stats-section-head">
            <h3>{t.weekly}</h3>
            {(hasDays || weights.length > 0) && <button type="button" className="btn ghost" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>{asTable ? t.chart : t.table}</button>}
          </div>
          {!hasDays ? <p className="text-sm text-muted">{t.noData}</p> : asTable ? (
            <table className="stats-table">
              <thead><tr><th>{t.week}</th><th>{t.ketoDays}</th><th>{t.avg}</th></tr></thead>
              <tbody>{data.weeks.map((w) => <tr key={w.weekStart}><td>{shortDate(w.weekStart, lang)}</td><td>{w.loggedDays ? `${w.ketoDays}/${w.loggedDays} (${w.percent}%)` : "–"}</td><td>{w.avg ? `${w.avg.kcal} / ${w.avg.protein} / ${w.avg.netCarbs}` : "–"}</td></tr>)}</tbody>
            </table>
          ) : <WeeklyBars weeks={data.weeks} goal={data.goalNetCarbs} lang={lang}/>}

          <h3>{t.weight}</h3>
          <form className="weight-form" onSubmit={saveWeight}>
            <label>{t.weightLabel}<input className="field" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="80,5" required/></label>
            <label>{t.dateLabel}<input className="field" type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)}/></label>
            <button className="btn primary" disabled={busy}>{t.save}</button>
          </form>
          {!weights.length ? <p className="text-sm text-muted">{t.noWeight}</p> : (
            <>
              {weights.length > 1 && <p className="text-sm">{t.change(Math.round((weights[weights.length - 1].weightKg - weights[0].weightKg) * 10) / 10)}</p>}
              {asTable ? (
                <table className="stats-table">
                  <tbody>{[...recent].reverse().map((w) => <tr key={w.date}><td>{shortDate(w.date, lang)}</td><td>{w.weightKg.toLocaleString(locale(lang))} kg</td><td><button type="button" className="icon-button" aria-label={`${t.remove}: ${w.date}`} onClick={() => remove(w.date)} disabled={busy}><Trash2 size={14}/></button></td></tr>)}</tbody>
                </table>
              ) : <WeightChart weights={recent} lang={lang}/>}
            </>
          )}
        </>
      )}
    </section>
  );
}
