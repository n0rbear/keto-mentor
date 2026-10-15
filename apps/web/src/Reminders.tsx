import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";
import { PremiumBadge, PremiumNote } from "./PremiumBadge";

// Emlékeztetők (premium, 2026-10-16): an e-mail at the user's chosen times
// when lunch or dinner is not logged yet, and the same reminder as a band
// while the app is open.

export type ReminderSettings = { lunchAt: string | null; dinnerAt: string | null; timeZone: string } | null;
type Kind = "lunch" | "dinner";

const copy = {
  hu: {
    title: "Emlékeztetők", lead: "E-mailt küldök, ha a megadott időpontig nem rögzítetted az ebédet vagy a vacsorát. Naponta legfeljebb egyszer mindkettőből.",
    lunch: "Ebéd emlékeztető", dinner: "Vacsora emlékeztető", at: "Időpont", save: "Emlékeztetők mentése", saved: "Mentve.", off: "Kikapcsolva.",
    needEmail: "Az e-mailes emlékeztetőhöz megerősített e-mail cím kell. Amíg nincs, csak az appban szólok.",
    band: { lunch: "Még nem rögzítetted az ebédet.", dinner: "Még nem rögzítetted a vacsorát." }, logNow: "Rögzítem", dismiss: "Később",
    premium_required: "Az emlékeztetők prémium funkció.", failed: "Most nem sikerült menteni."
  },
  de: {
    title: "Erinnerungen", lead: "Ich schicke eine E-Mail, wenn du Mittag- oder Abendessen bis zur gewählten Uhrzeit nicht eingetragen hast. Höchstens einmal pro Tag und Mahlzeit.",
    lunch: "Erinnerung Mittagessen", dinner: "Erinnerung Abendessen", at: "Uhrzeit", save: "Erinnerungen speichern", saved: "Gespeichert.", off: "Ausgeschaltet.",
    needEmail: "Für E-Mail-Erinnerungen brauchst du eine bestätigte E-Mail-Adresse. Bis dahin erinnere ich nur in der App.",
    band: { lunch: "Mittagessen noch nicht eingetragen.", dinner: "Abendessen noch nicht eingetragen." }, logNow: "Eintragen", dismiss: "Später",
    premium_required: "Erinnerungen sind eine Premium-Funktion.", failed: "Speichern gerade nicht möglich."
  },
  en: {
    title: "Reminders", lead: "I send an e-mail if lunch or dinner is not logged by your chosen time. At most once a day for each.",
    lunch: "Lunch reminder", dinner: "Dinner reminder", at: "Time", save: "Save reminders", saved: "Saved.", off: "Turned off.",
    needEmail: "E-mail reminders need a confirmed e-mail address. Until then I only remind you in the app.",
    band: { lunch: "Lunch not logged yet.", dinner: "Dinner not logged yet." }, logNow: "Log it", dismiss: "Later",
    premium_required: "Reminders is a premium feature.", failed: "Could not save right now."
  }
} as const;

const minutesOf = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
type DayMeal = { eatenAt: string; mealType?: string | null };

/** The reminder the band should show now, if any (same rule as the e-mail). */
export function dueReminder(settings: ReminderSettings, todayMeals: DayMeal[], now = new Date()): Kind | null {
  if (!settings) return null;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const local = (m: DayMeal) => { const d = new Date(m.eatenAt); return d.getHours() * 60 + d.getMinutes(); };
  const logged = (kind: Kind) => todayMeals.some((m) => m.mealType === kind || (kind === "lunch" && m.mealType !== "breakfast" && m.mealType !== "morning_snack" && local(m) >= 600) || (kind === "dinner" && m.mealType !== "lunch" && local(m) >= 1020));
  for (const kind of ["dinner", "lunch"] as const) {
    const at = kind === "lunch" ? settings.lunchAt : settings.dinnerAt;
    if (at && nowMin >= minutesOf(at) && !logged(kind) && (kind === "lunch" ? nowMin < 17 * 60 : true)) return kind;
  }
  return null;
}

export function ReminderBand({ lang, kind, onLog, onDismiss }: { lang: Lang; kind: Kind; onLog: () => void; onDismiss: () => void }) {
  const t = copy[lang];
  return (
    <div className="card announcement-band reminder-band" role="status">
      <BellRing size={18} aria-hidden="true"/><span>{t.band[kind]}</span>
      <button type="button" className="btn primary" onClick={onLog}>{t.logNow}</button>
      <button type="button" className="btn ghost" onClick={onDismiss}>{t.dismiss}</button>
    </div>
  );
}

export function RemindersCard({ lang, state, settings, emailConfirmed, onSaved }: { lang: Lang; state: ApiState; settings: ReminderSettings; emailConfirmed: boolean; onSaved: (next: ReminderSettings) => void }) {
  const t = copy[lang];
  const [lunchOn, setLunchOn] = useState(!!settings?.lunchAt);
  const [dinnerOn, setDinnerOn] = useState(!!settings?.dinnerAt);
  const [lunchAt, setLunchAt] = useState(settings?.lunchAt ?? "14:00");
  const [dinnerAt, setDinnerAt] = useState(settings?.dinnerAt ?? "20:30");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { setLunchOn(!!settings?.lunchAt); setDinnerOn(!!settings?.dinnerAt); if (settings?.lunchAt) setLunchAt(settings.lunchAt); if (settings?.dinnerAt) setDinnerAt(settings.dinnerAt); }, [settings]);

  async function save() {
    const body = { lunchAt: lunchOn ? lunchAt : null, dinnerAt: dinnerOn ? dinnerAt : null, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin" };
    try {
      const r = await api<{ reminders: ReminderSettings }>("/me/reminders", { method: "PUT", body: JSON.stringify(body) }, state);
      onSaved(r.reminders);
      setStatus({ ok: true, text: r.reminders ? t.saved : t.off });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof ApiError && e.code === "premium_required" ? t.premium_required : t.failed });
    }
  }
  const row = (label: string, on: boolean, setOn: (v: boolean) => void, value: string, setValue: (v: string) => void) => (
    <div className="reminder-row">
      <label className="legal-confirm"><input type="checkbox" checked={on} onChange={(e) => { setStatus(null); setOn(e.target.checked); }}/>{label}</label>
      <input className="field compact" type="time" aria-label={`${label} – ${t.at}`} value={value} disabled={!on} onChange={(e) => { setStatus(null); setValue(e.target.value); }}/>
    </div>
  );
  return (
    <section className="card reminders-card is-premium" aria-labelledby="reminders-title">
      <div className="dinner-head">
        <h2 id="reminders-title" className="section-heading"><Bell size={20} aria-hidden="true"/>{t.title}</h2>
        <PremiumBadge lang={lang}/>
      </div>
      <PremiumNote lang={lang}/>
      <p className="text-sm text-muted">{t.lead}</p>
      {!emailConfirmed && <p className="text-sm reminder-note">{t.needEmail}</p>}
      {row(t.lunch, lunchOn, setLunchOn, lunchAt, setLunchAt)}
      {row(t.dinner, dinnerOn, setDinnerOn, dinnerAt, setDinnerAt)}
      <button type="button" className="btn primary" onClick={save}>{t.save}</button>
      {status && <p className={`status ${status.ok ? "success" : "error"}`} role={status.ok ? "status" : "alert"}>{status.text}</p>}
    </section>
  );
}
