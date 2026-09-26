import { useState } from "react";
import { UtensilsCrossed, Trash2 } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";

// Saját tányérok (owner decision 2026-09-26, roadmap D): no photo, no scale.
// Each home plate is measured once (deep: fill with water, read the ml;
// flat: rim-to-rim diameter) and saved. Later the user picks the plate and
// how full it was; the server turns that into grams with the dish's density.

type Plate = { id: string; name: string; kind: "deep" | "flat"; capacityMl: number | null; diameterMm: number | null };
type Estimate = { grams: number; densityGPerMl: number; basis: "reference" | "default" };
type Fill = "half" | "normal" | "full" | "small" | "heaped";

const texts = {
  hu: {
    open: "Tányér alapján", heading: "Melyik tányérból ettél?", none: "Még nincs mentett tányérod. Mérd le egyszer, és elmentjük.",
    deep: "Mély tányér", flat: "Lapos tányér", fill: "Mennyire volt tele?",
    fills: { half: "Félig", normal: "Normál", full: "Tele", small: "Kevés", heaped: "Púpozott" },
    calc: "Kiszámolom", result: "Becsült adag", use: "Ezt használom", basisDefault: "Általános becslés (ehhez az ételhez nincs saját sűrűségadat).",
    add: "Új tányér", name: "Név (pl. mély tányér)", capacity: "Űrtartalom (ml)", diameter: "Átmérő (cm)",
    deepHint: "Töltsd tele vízzel a pereméig, öntsd mérőedénybe, és írd be, hány ml.",
    flatHint: "Mérd le a tányér átmérőjét peremtől peremig, centiméterben.",
    save: "Mentés", cancel: "Mégse", remove: "Törlés", failed: "Most nem sikerült. Add meg kézzel a grammot.", invalid: "Adj meg nevet és érvényes méretet."
  },
  de: {
    open: "Nach Teller", heading: "Von welchem Teller hast du gegessen?", none: "Noch kein Teller gespeichert. Einmal ausmessen, dann merken wir ihn uns.",
    deep: "Tiefer Teller", flat: "Flacher Teller", fill: "Wie voll war er?",
    fills: { half: "Halb", normal: "Normal", full: "Voll", small: "Wenig", heaped: "Gehäuft" },
    calc: "Berechnen", result: "Geschätzte Portion", use: "Übernehmen", basisDefault: "Allgemeine Schätzung (für dieses Gericht gibt es keine eigene Dichte).",
    add: "Neuer Teller", name: "Name (z. B. tiefer Teller)", capacity: "Fassungsvermögen (ml)", diameter: "Durchmesser (cm)",
    deepHint: "Bis zum Rand mit Wasser füllen, in einen Messbecher gießen und die ml eintragen.",
    flatHint: "Durchmesser von Rand zu Rand in Zentimetern messen.",
    save: "Speichern", cancel: "Abbrechen", remove: "Löschen", failed: "Gerade nicht möglich. Bitte Gramm manuell eingeben.", invalid: "Bitte Name und gültige Größe angeben."
  },
  en: {
    open: "By plate", heading: "Which plate did you eat from?", none: "No saved plate yet. Measure it once and we'll remember it.",
    deep: "Deep plate", flat: "Flat plate", fill: "How full was it?",
    fills: { half: "Half", normal: "Normal", full: "Full", small: "Light", heaped: "Heaped" },
    calc: "Calculate", result: "Estimated portion", use: "Use this", basisDefault: "General estimate (no dish-specific density for this food).",
    add: "New plate", name: "Name (e.g. deep plate)", capacity: "Capacity (ml)", diameter: "Diameter (cm)",
    deepHint: "Fill it with water to the rim, pour it into a measuring jug and enter the ml.",
    flatHint: "Measure the diameter rim to rim, in centimetres.",
    save: "Save", cancel: "Cancel", remove: "Delete", failed: "Not possible right now. Enter grams manually.", invalid: "Enter a name and a valid size."
  }
} as const;

const plateSize = (plate: Plate) => plate.kind === "deep" ? `${Math.round(plate.capacityMl ?? 0)} ml` : `Ø ${Math.round((plate.diameterMm ?? 0) / 10)} cm`;

export function PlatePortion({ lang, state, recipeId, onEstimate }: { lang: Lang; state: ApiState; recipeId?: string; onEstimate: (grams: number) => void }) {
  const t = texts[lang];
  const [open, setOpen] = useState(false);
  const [plates, setPlates] = useState<Plate[] | null>(null);
  const [plateId, setPlateId] = useState<string | null>(null);
  const [fill, setFill] = useState<Fill>("normal");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ name: string; kind: "deep" | "flat"; size: string }>({ name: "", kind: "deep", size: "" });

  const selected = plates?.find((plate) => plate.id === plateId) ?? null;
  const fills: Fill[] = selected?.kind === "flat" ? ["small", "normal", "heaped"] : ["half", "normal", "full"];

  async function start() {
    setOpen(true); setFailed(null);
    try {
      const list = (await api<{ plates: Plate[] }>("/me/plates", {}, state)).plates;
      setPlates(list); setPlateId(list[0]?.id ?? null); setAdding(list.length === 0);
    } catch { setPlates([]); setAdding(true); }
  }

  async function calculate() {
    if (!selected) return;
    setBusy(true); setFailed(null); setEstimate(null);
    try {
      setEstimate(await api<Estimate>(`/me/plates/${encodeURIComponent(selected.id)}/portion`, { method: "POST", body: JSON.stringify({ fill, ...(recipeId ? { recipeId } : {}) }) }, state));
    } catch (error) {
      setFailed(t.failed);
      if (!(error instanceof ApiError)) console.warn("plate_portion_failed");
    } finally { setBusy(false); }
  }

  async function savePlate() {
    const size = Number(draft.size.replace(",", "."));
    if (!draft.name.trim() || !(size > 0)) { setFailed(t.invalid); return; }
    setBusy(true); setFailed(null);
    try {
      const body = draft.kind === "deep" ? { kind: "deep", name: draft.name.trim(), capacityMl: size } : { kind: "flat", name: draft.name.trim(), diameterMm: size * 10 };
      const plate = (await api<{ plate: Plate }>("/me/plates", { method: "POST", body: JSON.stringify(body) }, state)).plate;
      setPlates((list) => [...(list ?? []), plate]); setPlateId(plate.id); setFill("normal"); setEstimate(null);
      setAdding(false); setDraft({ name: "", kind: "deep", size: "" });
    } catch { setFailed(t.invalid); } finally { setBusy(false); }
  }

  async function removePlate(id: string) {
    try { await api(`/me/plates/${encodeURIComponent(id)}`, { method: "DELETE" }, state); } catch { return; }
    const rest = (plates ?? []).filter((plate) => plate.id !== id);
    setPlates(rest); setPlateId(rest[0]?.id ?? null); setEstimate(null);
    if (!rest.length) setAdding(true);
  }

  if (!open) return <button type="button" className="btn secondary plate-portion-open" onClick={() => { void start(); }}><UtensilsCrossed aria-hidden="true" size={16}/> {t.open}</button>;

  return <div className="plate-portion">
    <strong>{t.heading}</strong>
    {!!plates?.length && <div className="plate-portion-list" role="radiogroup" aria-label={t.heading}>
      {plates.map((plate) => <div key={plate.id} className="plate-portion-row">
        <label><input type="radio" name="plate" checked={plateId === plate.id} onChange={() => { setPlateId(plate.id); setFill("normal"); setEstimate(null); }}/> {plate.name} · {plate.kind === "deep" ? t.deep : t.flat} · {plateSize(plate)}</label>
        <button type="button" className="icon-button" aria-label={`${t.remove}: ${plate.name}`} onClick={() => { void removePlate(plate.id); }}><Trash2 aria-hidden="true" size={15}/></button>
      </div>)}
    </div>}
    {plates && !plates.length && !adding && <small>{t.none}</small>}
    {selected && !adding && <>
      <span>{t.fill}</span>
      <div className="plate-portion-fills" role="radiogroup" aria-label={t.fill}>
        {fills.map((value) => <label key={value}><input type="radio" name="fill" checked={fill === value} onChange={() => { setFill(value); setEstimate(null); }}/> {t.fills[value]}</label>)}
      </div>
      <button type="button" className="btn primary" disabled={busy} onClick={() => { void calculate(); }}>{t.calc}</button>
    </>}
    {estimate && <div className="plate-portion-result">
      <span>{t.result}: ≈ <b>{estimate.grams} g</b></span>
      {estimate.basis === "default" && <small>{t.basisDefault}</small>}
      <button type="button" className="btn primary" onClick={() => { onEstimate(estimate.grams); setOpen(false); }}>{t.use}</button>
    </div>}
    {adding ? <div className="plate-portion-add">
      {plates && !plates.length && <small>{t.none}</small>}
      <input className="field" aria-label={t.name} placeholder={t.name} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/>
      <div className="plate-portion-fills" role="radiogroup" aria-label={t.add}>
        <label><input type="radio" name="plate-kind" checked={draft.kind === "deep"} onChange={() => setDraft({ ...draft, kind: "deep", size: "" })}/> {t.deep}</label>
        <label><input type="radio" name="plate-kind" checked={draft.kind === "flat"} onChange={() => setDraft({ ...draft, kind: "flat", size: "" })}/> {t.flat}</label>
      </div>
      <input className="field" inputMode="decimal" aria-label={draft.kind === "deep" ? t.capacity : t.diameter} placeholder={draft.kind === "deep" ? t.capacity : t.diameter} value={draft.size} onChange={(event) => setDraft({ ...draft, size: event.target.value })}/>
      <small>{draft.kind === "deep" ? t.deepHint : t.flatHint}</small>
      <div className="plate-portion-actions">
        <button type="button" className="btn primary" disabled={busy} onClick={() => { void savePlate(); }}>{t.save}</button>
        {!!plates?.length && <button type="button" className="btn secondary" onClick={() => setAdding(false)}>{t.cancel}</button>}
      </div>
    </div> : <button type="button" className="btn secondary" onClick={() => { setAdding(true); setEstimate(null); }}>{t.add}</button>}
    {failed && <small className="plate-portion-error">{failed}</small>}
    <button type="button" className="btn secondary" onClick={() => setOpen(false)}>{t.cancel}</button>
  </div>;
}
