import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";

// Plate-photo portion estimation (owner request, 2026-09-25). Offered only
// where an amount is missing. Home: the user's own plate is measured once
// with a coin next to it and remembered; later home photos need no coin.
// Restaurant or guest plates always need a coin and are never saved. The
// photo only estimates the total weight on the plate; it is never stored.

type Plate = { id: string; name: string; diameterMm: number };
type Result = { status: "estimated" | "reference_not_found" | "food_not_measurable"; grams?: number; confidence?: number; notes?: string; savedPlate?: Plate | null };

const texts = {
  hu: {
    open: "Adag becslése fotóból", where: "Hol eszel?", homeSaved: "Otthon", homeNew: "Otthon, új saját tányér (érmével, megjegyzem)", away: "Étterem / vendégség (érmével)",
    coin: "Érme a tányér mellett", eur1: "1 €", huf100: "100 Ft", plateName: "A tányér neve (pl. mély tányér)", take: "Fotó készítése",
    coinHint: "Tegyél egy 1 €-s vagy 100 Ft-os érmét a tányér mellé, és felülről fotózd le, hogy a tányér pereme is látsszon.",
    plateHint: "Felülről fotózd le, hogy a tányér teljes pereme látsszon.",
    working: "Becslés…", result: "Becsült adag", use: "Ezt használom", saved: "Megjegyeztem a tányért",
    noReference: "Nem láttam az érmét vagy a tányér peremét. Próbáld újra.", notMeasurable: "Ebből a képből nem tudtam megbecsülni az adagot.",
    failed: "A becslés most nem sikerült. Add meg kézzel.", cancel: "Mégse"
  },
  de: {
    open: "Portion per Foto schätzen", where: "Wo isst du?", homeSaved: "Zuhause", homeNew: "Zuhause, neuer eigener Teller (mit Münze, wird gespeichert)", away: "Restaurant / zu Gast (mit Münze)",
    coin: "Münze neben dem Teller", eur1: "1 €", huf100: "100 Ft", plateName: "Name des Tellers (z. B. tiefer Teller)", take: "Foto aufnehmen",
    coinHint: "Lege eine 1-€- oder 100-Ft-Münze neben den Teller und fotografiere von oben, sodass der Tellerrand sichtbar ist.",
    plateHint: "Von oben fotografieren, sodass der ganze Tellerrand sichtbar ist.",
    working: "Schätzung…", result: "Geschätzte Portion", use: "Übernehmen", saved: "Teller gespeichert",
    noReference: "Münze oder Tellerrand nicht erkannt. Bitte erneut versuchen.", notMeasurable: "Aus diesem Foto ließ sich die Portion nicht schätzen.",
    failed: "Die Schätzung ist fehlgeschlagen. Bitte manuell eingeben.", cancel: "Abbrechen"
  },
  en: {
    open: "Estimate portion from a photo", where: "Where are you eating?", homeSaved: "At home", homeNew: "At home, new own plate (with a coin, remembered)", away: "Restaurant / as a guest (with a coin)",
    coin: "Coin next to the plate", eur1: "€1", huf100: "100 Ft", plateName: "Plate name (e.g. deep plate)", take: "Take photo",
    coinHint: "Put a €1 or 100 Ft coin next to the plate and shoot from above so the plate rim is visible.",
    plateHint: "Shoot from above so the whole plate rim is visible.",
    working: "Estimating…", result: "Estimated portion", use: "Use this", saved: "Plate remembered",
    noReference: "Couldn't see the coin or the plate rim. Please try again.", notMeasurable: "Couldn't estimate the portion from this photo.",
    failed: "Estimation failed right now. Enter it manually.", cancel: "Cancel"
  }
} as const;

// Phones produce multi-megabyte photos; 1280 px JPEG keeps the coin and plate
// rim readable while staying far below the API's 6 MB limit.
async function downscale(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.85));
  } catch {
    return file;
  }
}

export function PortionPhoto({ lang, state, dish, onEstimate }: { lang: Lang; state: ApiState; dish: string; onEstimate: (grams: number) => void }) {
  const t = texts[lang];
  const [open, setOpen] = useState(false);
  const [plates, setPlates] = useState<Plate[] | null>(null);
  const [mode, setMode] = useState<string>("away");
  const [coin, setCoin] = useState<"eur1" | "huf100">("huf100");
  const [plateName, setPlateName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [failed, setFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function start() {
    setOpen(true);
    try {
      const list = (await api<{ plates: Plate[] }>("/me/plates", {}, state)).plates;
      setPlates(list);
      setMode(list.length ? `plate:${list[0].id}` : "new");
    } catch {
      setPlates([]);
      setMode("new");
    }
  }

  async function upload(file: File) {
    setBusy(true); setResult(null); setFailed(false);
    try {
      const params = new URLSearchParams({ dish });
      if (mode.startsWith("plate:")) { params.set("reference", "plate"); params.set("plateId", mode.slice(6)); }
      else {
        params.set("reference", "coin"); params.set("coin", coin);
        if (mode === "new") { params.set("savePlate", "1"); if (plateName.trim()) params.set("plateName", plateName.trim()); }
      }
      const body = await downscale(file);
      const res = await api<Result>(`/meal-input/portion-photo?${params}`, { method: "POST", body, headers: { "Content-Type": "image/jpeg" } }, state);
      setResult(res);
      if (res.savedPlate) setPlates((list) => [...(list ?? []), res.savedPlate!]);
    } catch (error) {
      setFailed(true);
      if (!(error instanceof ApiError)) console.warn("portion_photo_failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return <button type="button" className="btn secondary portion-photo-open" onClick={() => { void start(); }}><Camera aria-hidden="true" size={16}/> {t.open}</button>;

  const usesCoin = !mode.startsWith("plate:");
  return <div className="portion-photo">
    <strong>{t.where}</strong>
    <div className="portion-photo-modes" role="radiogroup" aria-label={t.where}>
      {plates?.map((plate) => <label key={plate.id}><input type="radio" name="portion-mode" checked={mode === `plate:${plate.id}`} onChange={() => setMode(`plate:${plate.id}`)}/> {t.homeSaved}: {plate.name} (Ø {Math.round(plate.diameterMm / 10)} cm)</label>)}
      <label><input type="radio" name="portion-mode" checked={mode === "new"} onChange={() => setMode("new")}/> {t.homeNew}</label>
      <label><input type="radio" name="portion-mode" checked={mode === "away"} onChange={() => setMode("away")}/> {t.away}</label>
    </div>
    {usesCoin && <label className="portion-photo-coin">{t.coin}
      <select className="field" value={coin} onChange={(event) => setCoin(event.target.value as "eur1" | "huf100")}><option value="huf100">{t.huf100}</option><option value="eur1">{t.eur1}</option></select>
    </label>}
    {mode === "new" && <input className="field" aria-label={t.plateName} placeholder={t.plateName} value={plateName} onChange={(event) => setPlateName(event.target.value)}/>}
    <small>{usesCoin ? t.coinHint : t.plateHint}</small>
    <input ref={fileRef} className="portion-photo-file" type="file" accept="image/*" capture="environment" aria-label={t.take} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }}/>
    <div className="portion-photo-actions">
      <button type="button" className="btn primary" disabled={busy} onClick={() => fileRef.current?.click()}><Camera aria-hidden="true" size={16}/> {busy ? t.working : t.take}</button>
      <button type="button" className="btn secondary" disabled={busy} onClick={() => { setOpen(false); setResult(null); }}>{t.cancel}</button>
    </div>
    {result?.savedPlate && <small className="portion-photo-saved">{t.saved}: {result.savedPlate.name} (Ø {Math.round(result.savedPlate.diameterMm / 10)} cm)</small>}
    {result?.status === "estimated" && result.grams != null && <div className="portion-photo-result">
      <span>{t.result}: ≈ <b>{result.grams} g</b>{result.confidence != null ? ` · ${Math.round(result.confidence * 100)}%` : ""}</span>
      {result.notes && <small>{result.notes}</small>}
      <button type="button" className="btn primary" onClick={() => { onEstimate(result.grams!); setOpen(false); }}>{t.use}</button>
    </div>}
    {result?.status === "reference_not_found" && <small className="portion-photo-error">{t.noReference}</small>}
    {result?.status === "food_not_measurable" && <small className="portion-photo-error">{t.notMeasurable}</small>}
    {failed && <small className="portion-photo-error">{t.failed}</small>}
  </div>;
}
