import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";
import { PremiumBadge, PremiumNote } from "./PremiumBadge";
import { WEEKDAY_KEYS, type WeekdayGoals, type WeekdayKey } from "./goals";

// Rugalmas célok (premium, 2026-10-16): per-weekday net-carb, calorie and
// protein targets (carb cycling). An empty field keeps the base goal.

type Field = "netCarbs" | "kcal" | "protein";
const FIELDS: Field[] = ["netCarbs", "kcal", "protein"];
const DAY_NAMES: Record<Lang, Record<WeekdayKey, string>> = {
  hu: { mon: "Hétfő", tue: "Kedd", wed: "Szerda", thu: "Csütörtök", fri: "Péntek", sat: "Szombat", sun: "Vasárnap" },
  de: { mon: "Montag", tue: "Dienstag", wed: "Mittwoch", thu: "Donnerstag", fri: "Freitag", sat: "Samstag", sun: "Sonntag" },
  en: { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" }
};
const copy = {
  hu: { title: "Rugalmas célok", lead: "Napokra bontott célok, például carb cycling: edzésnapon vagy hétvégén több szénhidrát. Az üres mező az alapcélt használja.", fields: { netCarbs: "Nettó CH (g)", kcal: "kcal", protein: "Fehérje (g)" }, cycling: "Hétvégén +20 g nettó CH", same: "Mindennap ugyanaz", save: "Célok mentése", saved: "Mentve. A napló, a vacsoraajánló, az étrendterv és a statisztika a napi célt használja.", premium_required: "A rugalmas célok prémium funkció.", failed: "Most nem sikerült menteni.", invalid: "Ellenőrizd az értékeket (kcal 800–6000, nettó CH 0–300, fehérje 0–400)." },
  de: { title: "Flexible Ziele", lead: "Ziele je Wochentag, z. B. Carb Cycling: mehr Kohlenhydrate an Trainingstagen oder am Wochenende. Ein leeres Feld nutzt das Grundziel.", fields: { netCarbs: "Netto-KH (g)", kcal: "kcal", protein: "Eiweiß (g)" }, cycling: "Wochenende +20 g Netto-KH", same: "Jeden Tag gleich", save: "Ziele speichern", saved: "Gespeichert. Tagebuch, Abendessen-Vorschlag, Wochenplan und Statistik nutzen das Tagesziel.", premium_required: "Flexible Ziele sind eine Premium-Funktion.", failed: "Speichern gerade nicht möglich.", invalid: "Bitte Werte prüfen (kcal 800–6000, Netto-KH 0–300, Eiweiß 0–400)." },
  en: { title: "Flexible goals", lead: "Goals per weekday, e.g. carb cycling: more carbs on training days or at the weekend. An empty field keeps the base goal.", fields: { netCarbs: "Net carbs (g)", kcal: "kcal", protein: "Protein (g)" }, cycling: "Weekend +20 g net carbs", same: "Same every day", save: "Save goals", saved: "Saved. Diary, dinner ideas, meal plan and stats use each day's goal.", premium_required: "Flexible goals is a premium feature.", failed: "Could not save right now.", invalid: "Check the values (kcal 800–6000, net carbs 0–300, protein 0–400)." }
} as const;
const LIMITS: Record<Field, [number, number]> = { netCarbs: [0, 300], kcal: [800, 6000], protein: [0, 400] };

type Base = { dailyNetCarbs: number; dailyKcal: number; dailyProtein: number };
const baseOf = (b: Base, f: Field) => f === "netCarbs" ? b.dailyNetCarbs : f === "kcal" ? b.dailyKcal : b.dailyProtein;

export function FlexibleGoals({ lang, state, base, value, onSaved }: { lang: Lang; state: ApiState; base: Base; value: WeekdayGoals | null | undefined; onSaved: (profile: any) => void }) {
  const t = copy[lang];
  const toText = (v?: WeekdayGoals | null) => Object.fromEntries(WEEKDAY_KEYS.map((d) => [d, Object.fromEntries(FIELDS.map((f) => [f, v?.[d]?.[f] != null ? String(v[d]![f]) : ""]))])) as Record<WeekdayKey, Record<Field, string>>;
  const [form, setForm] = useState(() => toText(value));
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (d: WeekdayKey, f: Field, v: string) => { setStatus(null); setForm((cur) => ({ ...cur, [d]: { ...cur[d], [f]: v } })); };

  async function save() {
    const out: WeekdayGoals = {};
    for (const d of WEEKDAY_KEYS) for (const f of FIELDS) {
      const raw = form[d][f].trim();
      if (!raw) continue;
      const n = Math.round(Number(raw.replace(",", ".")));
      if (!Number.isFinite(n) || n < LIMITS[f][0] || n > LIMITS[f][1]) { setStatus({ ok: false, text: t.invalid }); return; }
      out[d] = { ...out[d], [f]: n };
    }
    setBusy(true);
    try {
      const r = await api<{ profile: any }>("/me/weekday-goals", { method: "PUT", body: JSON.stringify({ weekdayGoals: out }) }, state);
      onSaved(r.profile);
      setStatus({ ok: true, text: t.saved });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof ApiError && e.code === "premium_required" ? t.premium_required : t.failed });
    } finally { setBusy(false); }
  }

  return (
    <section className="card flex-goals-card is-premium" aria-labelledby="flex-goals-title">
      <div className="dinner-head">
        <h2 id="flex-goals-title" className="section-heading"><SlidersHorizontal size={20} aria-hidden="true"/>{t.title}</h2>
        <PremiumBadge lang={lang}/>
      </div>
      <PremiumNote lang={lang}/>
      <p className="text-sm text-muted">{t.lead}</p>
      <div className="planner-actions">
        <button type="button" className="chip" onClick={() => setForm((cur) => ({ ...cur, sat: { ...cur.sat, netCarbs: String(base.dailyNetCarbs + 20) }, sun: { ...cur.sun, netCarbs: String(base.dailyNetCarbs + 20) } }))}>{t.cycling}</button>
        <button type="button" className="chip" onClick={() => setForm(toText(null))}>{t.same}</button>
      </div>
      <div className="flex-goals-table" role="table" aria-label={t.title}>
        <div role="row" className="flex-goals-row is-head"><span role="columnheader"/>{FIELDS.map((f) => <span key={f} role="columnheader">{t.fields[f]}</span>)}</div>
        {WEEKDAY_KEYS.map((d) => (
          <div role="row" key={d} className="flex-goals-row">
            <span role="rowheader">{DAY_NAMES[lang][d]}</span>
            {FIELDS.map((f) => (
              <input key={f} role="cell" className="field compact" inputMode="numeric" aria-label={`${DAY_NAMES[lang][d]} – ${t.fields[f]}`} placeholder={String(baseOf(base, f))} value={form[d][f]} onChange={(e) => set(d, f, e.target.value)}/>
            ))}
          </div>
        ))}
      </div>
      <button type="button" className="btn primary" onClick={save} disabled={busy}>{t.save}</button>
      {status && <p className={`status ${status.ok ? "success" : "error"}`} role={status.ok ? "status" : "alert"}>{status.text}</p>}
    </section>
  );
}
