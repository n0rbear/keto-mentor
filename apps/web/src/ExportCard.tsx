import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileDown, Printer } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";
import { PremiumBadge, PremiumNote } from "./PremiumBadge";
import { MEAL_TYPE_LABELS, type MealType } from "./MealTypePicker";

// Export (premium, 2026-10-16): the diary for a date range as a CSV file
// (Excel-friendly) or as a printable report the browser saves as PDF.

type Totals = { kcal: number; fat: number; protein: number; carbs: number; fiber: number; netCarbs: number };
type Item = Totals & { name: string; grams: number };
type ExportMeal = { time: string; mealType: string | null; mealTypeLabel: string | null; title: string; totals: Totals; items: Item[] };
type ExportDay = { date: string; totals: Totals; meals: ExportMeal[] };
type ExportData = { from: string; to: string; goals: { dailyKcal: number; dailyProtein: number; dailyNetCarbs: number; dailyFat: number; dailyFiber: number } | null; days: ExportDay[] };

const copy = {
  hu: {
    title: "Export orvosnak, dietetikusnak", lead: "A naplód egy időszakra: táblázatként (CSV, Excelben megnyitható) vagy nyomtatható jelentésként, amit PDF-be is menthetsz.",
    last7: "Utolsó 7 nap", last30: "Utolsó 30 nap", from: "Ettől", to: "Eddig", csv: "CSV letöltése", pdf: "Jelentés / PDF", empty: "Ebben az időszakban nincs naplózott étkezés.",
    head: ["Dátum", "Idő", "Étkezés", "Étel", "Tétel", "Gramm", "kcal", "Zsír (g)", "Fehérje (g)", "Szénhidrát (g)", "Rost (g)", "Nettó CH (g)"],
    report: "Étkezési napló", period: "Időszak", goals: "Napi célok", dayTotal: "Napi összesen", avg: "Átlag naplózott naponta", ketoDays: "Keto-napok (nettó CH a cél alatt)",
    disclaimer: "A Keto Mentor tájékoztató jellegű étkezéskövető, nem orvosi eszköz.", premium_required: "Az export prémium funkció.", failed: "Most nem sikerült, próbáld újra.", busy: "Készítem…"
  },
  de: {
    title: "Export für Arzt und Ernährungsberatung", lead: "Dein Tagebuch für einen Zeitraum: als Tabelle (CSV, in Excel zu öffnen) oder als druckbarer Bericht, den du als PDF speichern kannst.",
    last7: "Letzte 7 Tage", last30: "Letzte 30 Tage", from: "Von", to: "Bis", csv: "CSV herunterladen", pdf: "Bericht / PDF", empty: "In diesem Zeitraum gibt es keine Mahlzeiten.",
    head: ["Datum", "Uhrzeit", "Mahlzeit", "Gericht", "Position", "Gramm", "kcal", "Fett (g)", "Eiweiß (g)", "Kohlenhydrate (g)", "Ballaststoffe (g)", "Netto-KH (g)"],
    report: "Ernährungstagebuch", period: "Zeitraum", goals: "Tagesziele", dayTotal: "Tagessumme", avg: "Durchschnitt pro erfasstem Tag", ketoDays: "Keto-Tage (Netto-KH unter Ziel)",
    disclaimer: "Keto Mentor ist ein informativer Ernährungstracker, kein Medizinprodukt.", premium_required: "Der Export ist eine Premium-Funktion.", failed: "Hat gerade nicht geklappt, bitte erneut versuchen.", busy: "Erstelle…"
  },
  en: {
    title: "Export for your doctor or dietitian", lead: "Your diary for a period: as a table (CSV, opens in Excel) or as a printable report you can save as PDF.",
    last7: "Last 7 days", last30: "Last 30 days", from: "From", to: "To", csv: "Download CSV", pdf: "Report / PDF", empty: "No meals logged in this period.",
    head: ["Date", "Time", "Meal", "Dish", "Item", "Grams", "kcal", "Fat (g)", "Protein (g)", "Carbs (g)", "Fiber (g)", "Net carbs (g)"],
    report: "Food diary", period: "Period", goals: "Daily targets", dayTotal: "Day total", avg: "Average per logged day", ketoDays: "Keto days (net carbs under target)",
    disclaimer: "Keto Mentor is an informational food tracker, not a medical device.", premium_required: "Export is a premium feature.", failed: "That did not work, please try again.", busy: "Preparing…"
  }
} as const;

const ABBR = {
  hu: { fat: "Zsír", protein: "Fehérje", carbs: "CH", fiber: "Rost", net: "Nettó CH" },
  de: { fat: "Fett", protein: "Eiweiß", carbs: "KH", fiber: "Ballaststoffe", net: "Netto-KH" },
  en: { fat: "Fat", protein: "Protein", carbs: "Carbs", fiber: "Fiber", net: "Net carbs" }
} as const;
const shift = (date: string, days: number) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const mealName = (m: ExportMeal, lang: Lang) => m.mealType === "custom" ? m.mealTypeLabel ?? "" : m.mealType ? MEAL_TYPE_LABELS[lang][m.mealType as MealType] ?? "" : "";

/** CSV with one row per item; ";" and decimal commas for HU/DE so Excel opens it directly. */
export function diaryCsv(data: ExportData, lang: Lang) {
  const sep = lang === "en" ? "," : ";";
  const num = (v: number) => lang === "en" ? String(v) : String(v).replace(".", ",");
  const cell = (v: string) => /["\n;,]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const rows = [copy[lang].head.join(sep)];
  for (const day of data.days) for (const meal of day.meals) for (const item of meal.items) {
    rows.push([day.date, meal.time, cell(mealName(meal, lang)), cell(meal.title), cell(item.name), num(item.grams), num(item.kcal), num(item.fat), num(item.protein), num(item.carbs), num(item.fiber), num(item.netCarbs)].join(sep));
  }
  return "﻿" + rows.join("\r\n") + "\r\n";
}

function Report({ data, lang }: { data: ExportData; lang: Lang }) {
  const t = copy[lang];
  const n = data.days.length || 1;
  const avg = (k: keyof Totals) => Math.round((data.days.reduce((a, d) => a + d.totals[k], 0) / n) * 10) / 10;
  const keto = data.goals ? data.days.filter((d) => d.totals.netCarbs <= data.goals!.dailyNetCarbs).length : null;
  const a = ABBR[lang];
  const f = (v: number) => v.toLocaleString(lang === "hu" ? "hu-HU" : lang === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: 1 });
  const line = (x: Totals) => `${f(x.kcal)} kcal · ${a.fat} ${f(x.fat)} g · ${a.protein} ${f(x.protein)} g · ${a.carbs} ${f(x.carbs)} g · ${a.fiber} ${f(x.fiber)} g · ${a.net} ${f(x.netCarbs)} g`;
  return (
    <div className="print-report">
      <h1>Keto Mentor – {t.report}</h1>
      <p>{t.period}: {data.from} – {data.to}</p>
      {data.goals && <p>{t.goals}: {data.goals.dailyKcal} kcal · {a.protein} {data.goals.dailyProtein} g · {a.net} ≤ {data.goals.dailyNetCarbs} g · {a.fat} {data.goals.dailyFat} g · {a.fiber} {data.goals.dailyFiber} g</p>}
      {data.days.length > 0 && <p>{t.avg}: {f(avg("kcal"))} kcal · {a.protein} {f(avg("protein"))} g · {a.net} {f(avg("netCarbs"))} g{keto != null ? ` · ${t.ketoDays}: ${keto}/${data.days.length}` : ""}</p>}
      {data.days.map((day) => (
        <section key={day.date}>
          <h2>{day.date}</h2>
          <table>
            <tbody>
              {day.meals.map((meal, i) => (
                <tr key={i}><td>{meal.time}</td><td>{mealName(meal, lang)}</td><td>{meal.title}<div className="print-items">{meal.items.map((it) => `${it.name} ${it.grams} g`).join(", ")}</div></td><td>{line(meal.totals)}</td></tr>
              ))}
              <tr className="print-total"><td colSpan={3}>{t.dayTotal}</td><td>{line(day.totals)}</td></tr>
            </tbody>
          </table>
        </section>
      ))}
      <p className="print-note">{t.disclaimer}</p>
    </div>
  );
}

export function ExportCard({ lang, state, today }: { lang: Lang; state: ApiState; today: string }) {
  const t = copy[lang];
  const [from, setFrom] = useState(shift(today, -6));
  const [to, setTo] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [printing, setPrinting] = useState<ExportData | null>(null);

  useEffect(() => {
    if (!printing) return;
    document.body.classList.add("is-printing");
    const done = () => { document.body.classList.remove("is-printing"); setPrinting(null); };
    window.addEventListener("afterprint", done, { once: true });
    const timer = window.setTimeout(() => window.print?.(), 50);
    return () => { window.clearTimeout(timer); window.removeEventListener("afterprint", done); document.body.classList.remove("is-printing"); };
  }, [printing]);

  async function load(): Promise<ExportData | null> {
    setBusy(true); setError(null); setNotice(null);
    try {
      const data = await api<ExportData>(`/export/diary?from=${from}&to=${to}&tzOffsetMinutes=${new Date().getTimezoneOffset()}`, {}, state);
      if (!data.days.length) { setNotice(t.empty); return null; }
      return data;
    } catch (e) {
      setError(e instanceof ApiError && e.code === "premium_required" ? t.premium_required : t.failed);
      return null;
    } finally { setBusy(false); }
  }
  async function downloadCsv() {
    const data = await load();
    if (!data) return;
    const url = URL.createObjectURL(new Blob([diaryCsv(data, lang)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `keto-mentor-${from}_${to}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function printReport() { const data = await load(); if (data) setPrinting(data); }

  return (
    <section className="card export-card is-premium" aria-labelledby="export-title">
      <div className="dinner-head">
        <h2 id="export-title" className="section-heading"><FileDown size={20} aria-hidden="true"/>{t.title}</h2>
        <PremiumBadge lang={lang}/>
      </div>
      <PremiumNote lang={lang}/>
      <p className="text-sm text-muted">{t.lead}</p>
      <div className="planner-actions">
        <button type="button" className="chip" onClick={() => { setFrom(shift(today, -6)); setTo(today); }}>{t.last7}</button>
        <button type="button" className="chip" onClick={() => { setFrom(shift(today, -29)); setTo(today); }}>{t.last30}</button>
      </div>
      <div className="weight-form">
        <label>{t.from}<input className="field" type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)}/></label>
        <label>{t.to}<input className="field" type="date" value={to} max={today} onChange={(e) => e.target.value && setTo(e.target.value)}/></label>
      </div>
      <div className="planner-actions">
        <button type="button" className="btn primary" onClick={downloadCsv} disabled={busy}><FileDown size={16} aria-hidden="true"/>{busy ? t.busy : t.csv}</button>
        <button type="button" className="btn secondary" onClick={printReport} disabled={busy}><Printer size={16} aria-hidden="true"/>{t.pdf}</button>
      </div>
      {error && <p className="status error" role="alert">{error}</p>}
      {notice && <p className="status" role="status">{notice}</p>}
      {printing && createPortal(<Report data={printing} lang={lang}/>, document.body)}
    </section>
  );
}
