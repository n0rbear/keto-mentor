import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Lang } from "./i18n";

// Owner-beta beta-diagnostics checkpoint (2026-09-13): a plain-language,
// expandable "Mi történt?" / "Was ist passiert?" / "What happened?" timeline
// — mirrors EXACTLY what apps/api/src/meal-input/diagnostics.ts derived from
// the same interpretation response already shown above it. Never secrets,
// never stack traces, never an internal code shown verbatim — every `code`
// this component doesn't recognize falls back to a generic, still-honest
// "this step needs review" line rather than crashing or showing raw text.
export type DiagnosticEvent = {
  stage: "classification" | "food_identity" | "portion" | "local_recipe_search" | "recipe_web_discovery" | "ingredient_resolution" | "double_counting_guard";
  status: "ok" | "attention" | "blocked";
  code: string;
  blocking: boolean;
  itemLabel?: string;
  params?: Record<string, string | number>;
};

function stageHeading(stage: DiagnosticEvent["stage"], lang: Lang): string {
  const table: Record<DiagnosticEvent["stage"], [string, string, string]> = {
    classification: ["Étel felismerése", "Erkennung des Gerichts", "Understanding the input"],
    food_identity: ["Ételazonosítás", "Lebensmittel-Identifikation", "Food identity"],
    portion: ["Mennyiség / adag", "Menge / Portion", "Quantity / portion"],
    local_recipe_search: ["Saját receptek keresése", "Suche in eigenen Rezepten", "Searching your own recipes"],
    recipe_web_discovery: ["Recept keresése a weben", "Rezeptsuche im Web", "Web recipe discovery"],
    ingredient_resolution: ["Összetevők ellenőrzése", "Zutaten-Prüfung", "Ingredient resolution"],
    double_counting_guard: ["Kettős számolás elleni védelem", "Schutz vor Doppelzählung", "Double-counting guard"]
  };
  return table[stage][lang === "hu" ? 0 : lang === "de" ? 1 : 2];
}

function withLabel(text: string, event: DiagnosticEvent): string {
  return event.itemLabel ? `${event.itemLabel}: ${text}` : text;
}

function eventText(event: DiagnosticEvent, lang: Lang): string {
  const p = event.params ?? {};
  const hu = lang === "hu", de = lang === "de";
  switch (event.code) {
    case "direct_match": return hu ? "A bevitt szöveg egyértelmű volt, nem volt szükség AI-értelmezésre." : de ? "Die Eingabe war eindeutig, keine KI-Interpretation nötig." : "The input was unambiguous — no AI interpretation was needed.";
    case "ai_understood": return hu ? `Az AI ${p.dish ? `"${p.dish}"` : "a bevitt szöveget"} ${p.kind === "compound_dish" ? "összetett ételként" : p.kind === "multiple_foods" ? "több ételként" : "egyetlen ételként"} azonosította.` : de ? `Die KI hat ${p.dish ? `"${p.dish}"` : "die Eingabe"} als ${p.kind === "compound_dish" ? "zusammengesetztes Gericht" : p.kind === "multiple_foods" ? "mehrere Lebensmittel" : "ein einzelnes Lebensmittel"} erkannt.` : `The AI understood ${p.dish ? `"${p.dish}"` : "the input"} as ${p.kind === "compound_dish" ? "a compound dish" : p.kind === "multiple_foods" ? "multiple foods" : "a single food"}.`;
    case "ai_failed_timeout": return hu ? "Az AI nem válaszolt időben, ezért a rendszer a beépített felismerést használta." : de ? "Die KI hat nicht rechtzeitig geantwortet, daher wurde die eingebaute Erkennung verwendet." : "The AI didn't respond in time, so built-in recognition was used instead.";
    case "ai_failed_http_error": return hu ? "Az AI szolgáltatás jelenleg nem elérhető (pl. túlterhelt), ezért a beépített felismerés futott le." : de ? "Der KI-Dienst ist derzeit nicht erreichbar (z. B. überlastet), daher wurde die eingebaute Erkennung verwendet." : "The AI service is currently unavailable (e.g. at capacity), so built-in recognition ran instead.";
    case "ai_failed_invalid_response": return hu ? "Az AI válasza nem volt értelmezhető, ezért a beépített felismerés futott le." : de ? "Die KI-Antwort war nicht auswertbar, daher wurde die eingebaute Erkennung verwendet." : "The AI's response couldn't be understood, so built-in recognition ran instead.";
    case "ai_failed_response_too_large": return hu ? "Az AI válasza túl nagy volt, ezért a beépített felismerés futott le." : de ? "Die KI-Antwort war zu groß, daher wurde die eingebaute Erkennung verwendet." : "The AI's response was too large, so built-in recognition ran instead.";
    case "ai_failed_unsupported_capability": return hu ? "Az AI-alapú felismerés jelenleg nincs bekapcsolva." : de ? "Die KI-gestützte Erkennung ist derzeit nicht aktiviert." : "AI-assisted understanding is not currently enabled.";
    case "ai_failed_unknown": return hu ? "Az AI-alapú felismerés váratlan hibába ütközött, ezért a beépített felismerés futott le." : de ? "Bei der KI-gestützten Erkennung ist ein unerwarteter Fehler aufgetreten, daher wurde die eingebaute Erkennung verwendet." : "AI-assisted understanding hit an unexpected error, so built-in recognition ran instead.";
    case "trusted_match": return withLabel(hu ? "Megbízható ételadathoz kapcsolva." : de ? "Mit verlässlichen Lebensmitteldaten verknüpft." : "Matched to a trusted food record.", event);
    case "preview_match": return withLabel(hu ? `Valószínű találat, de nem eléggé biztos — ellenőrzés szükséges.${p.names ? ` (${p.names})` : ""}` : de ? `Wahrscheinlicher Treffer, aber nicht sicher genug — Prüfung nötig.${p.names ? ` (${p.names})` : ""}` : `A likely match, but not confident enough — review needed.${p.names ? ` (${p.names})` : ""}`, event);
    // Decision-transparency audit (2026-09-19): names the actual candidates
    // instead of only saying "several matches exist" — see diagnostics.ts's
    // own doc on why this is safe, already-known data, not a new lookup.
    case "ambiguous": return withLabel(hu ? `Több, hasonlóan jó találat is van${p.names ? `: ${p.names}` : ""} — válassz egyet.` : de ? `Mehrere ähnlich gute Treffer${p.names ? `: ${p.names}` : ""} — bitte auswählen.` : `Multiple similarly-strong matches${p.names ? `: ${p.names}` : ""} — a choice is needed.`, event);
    case "preparation_unavailable": return withLabel(hu ? "Az elkészítési mód (pl. rántotta) miatt ez az étel nem volt automatikusan azonosítható." : de ? "Wegen der Zubereitungsart (z. B. Rührei) konnte dies nicht automatisch erkannt werden." : "The preparation style (e.g. scrambled) meant this couldn't be automatically identified.", event);
    case "confirmation_required": return withLabel(hu ? `Ehhez az ételhez megerősítés szükséges.${p.names ? ` (${p.names})` : ""}` : de ? `Für dieses Lebensmittel ist eine Bestätigung nötig.${p.names ? ` (${p.names})` : ""}` : `This food needs confirmation.${p.names ? ` (${p.names})` : ""}`, event);
    case "unresolved": return withLabel(hu ? "Ezt az ételt nem sikerült megbízható adathoz kapcsolni." : de ? "Dieses Lebensmittel konnte nicht mit verlässlichen Daten verknüpft werden." : "This food couldn't be matched to trusted data.", event);
    case "excluded_double_counting": return withLabel(hu ? `Ez már szerepel a(z) "${p.dish}" recept összetevői között, ezért külön nem számoljuk.` : de ? `Dies ist bereits Teil der Zutaten von "${p.dish}" und wird daher nicht doppelt gezählt.` : `This is already part of "${p.dish}"'s ingredients, so it isn't counted separately.`, event);
    case "external_ambiguous": return withLabel(hu ? `Több külső találat is van (${p.count}) — válassz egyet.` : de ? `Mehrere externe Treffer (${p.count}) — bitte auswählen.` : `Multiple external matches (${p.count}) — a choice is needed.`, event);
    case "external_possible_duplicate": return withLabel(hu ? "Lehetséges duplikátum a katalógusban — megerősítés szükséges." : de ? "Mögliches Duplikat im Katalog — Bestätigung nötig." : "A possible duplicate exists in the catalog — confirmation needed.", event);
    case "external_weak_match": return withLabel(hu ? "Csak gyenge külső egyezés található — megerősítés szükséges." : de ? "Nur eine schwache externe Übereinstimmung gefunden — Bestätigung nötig." : "Only a weak external match was found — confirmation needed.", event);
    case "external_confirmation_required": return withLabel(hu ? "Külső forrásból származó találat — megerősítés szükséges." : de ? "Treffer aus externer Quelle — Bestätigung nötig." : "A match from an external source needs confirmation.", event);
    case "estimate_needs_confirmation": return withLabel(hu ? "Becsült mennyiség — erősítsd meg vagy módosítsd." : de ? "Geschätzte Menge — bitte bestätigen oder ändern." : "Estimated quantity — please confirm or adjust.", event);
    case "needs_confirmation": return withLabel(hu ? "A mennyiség megerősítést igényel." : de ? "Die Menge muss bestätigt werden." : "The quantity needs confirmation.", event);
    case "quantity_missing": return withLabel(hu ? "Nem derült ki, mennyit ettél belőle." : de ? "Es wurde nicht klar, wie viel du davon gegessen hast." : "How much you ate wasn't clear.", event);
    case "portion_ai_timeout": return withLabel(hu ? "A mennyiségbecslő AI nem válaszolt időben — add meg kézzel a grammot." : de ? "Die KI-Mengenschätzung hat nicht rechtzeitig geantwortet — bitte Gramm manuell eingeben." : "The quantity-estimating AI didn't respond in time — please enter grams manually.", event);
    case "portion_ai_invalid_output": return withLabel(hu ? "A mennyiségbecslő AI válasza nem volt használható — add meg kézzel a grammot." : de ? "Die Antwort der KI-Mengenschätzung war nicht brauchbar — bitte Gramm manuell eingeben." : "The quantity-estimating AI's response wasn't usable — please enter grams manually.", event);
    case "portion_ai_declined": return withLabel(hu ? "Az AI nem tudott becslést adni erre a mennyiségre." : de ? "Die KI konnte für diese Menge keine Schätzung abgeben." : "The AI couldn't produce an estimate for this quantity.", event);
    case "portion_ai_not_configured": return withLabel(hu ? "Nincs beállítva mennyiségbecslő AI — add meg kézzel a grammot." : de ? "Keine KI-Mengenschätzung konfiguriert — bitte Gramm manuell eingeben." : "No quantity-estimating AI is configured — please enter grams manually.", event);
    case "conversion_missing": return withLabel(hu ? "Ehhez a mértékegységhez nincs hiteles átváltás — add meg kézzel a grammot." : de ? "Für diese Einheit gibt es keine verlässliche Umrechnung — bitte Gramm manuell eingeben." : "There's no trusted conversion for this unit — please enter grams manually.", event);
    case "local_match": return hu ? `Megtaláltuk a saját receptjeid között: "${p.title}".` : de ? `In deinen eigenen Rezepten gefunden: "${p.title}".` : `Found among your own recipes: "${p.title}".`;
    case "no_local_match": return hu ? "Nincs ilyen saját recepted, ezért a rendszer tovább keresett." : de ? "Kein eigenes Rezept dafür gefunden, daher wurde weitergesucht." : "No matching recipe of your own was found, so the search continued.";
    case "ambiguous_local_matches": return hu ? `${p.count} hasonló nevű saját recepted is van — válassz egyet.` : de ? `${p.count} eigene Rezepte mit ähnlichem Namen — bitte eines wählen.` : `${p.count} of your own recipes share a similar name — a choice is needed.`;
    case "web_disabled": return hu ? "A webes recept-keresés jelenleg nincs bekapcsolva." : de ? "Die Web-Rezeptsuche ist derzeit nicht aktiviert." : "Web recipe search is not currently enabled.";
    case "web_found": return hu ? `Receptet találtunk (${p.domain}): "${p.title}".` : de ? `Rezept gefunden (${p.domain}): "${p.title}".` : `Found a recipe (${p.domain}): "${p.title}".`;
    case "web_rate_limited": return hu ? "Túl sok recept-keresés volt mostanában — próbáld később." : de ? "Zu viele Rezeptsuchen zuletzt — bitte später erneut versuchen." : "Too many recipe searches recently — please try again later.";
    case "web_provider_error": return hu ? "A recept-keresési szolgáltatás jelenleg nem elérhető." : de ? "Der Rezeptsuchdienst ist derzeit nicht erreichbar." : "The recipe search service is currently unavailable.";
    case "web_no_results": return hu ? `Nem találtunk elég releváns receptet (${p.searched} találatból).` : de ? `Keine ausreichend relevanten Rezepte gefunden (von ${p.searched} Treffern).` : `No sufficiently relevant recipes were found (out of ${p.searched} results).`;
    case "web_systemic_error": return hu ? "A recept-keresés közben váratlan hiba történt." : de ? "Bei der Rezeptsuche ist ein unerwarteter Fehler aufgetreten." : "An unexpected error occurred during recipe search.";
    case "web_no_fully_resolvable_candidate": return hu ? `Találtunk recepteket (${p.attempted} kipróbálva), de egyik összetevői sem voltak teljesen ellenőrizhetők.` : de ? `Rezepte gefunden (${p.attempted} versucht), aber bei keinem waren alle Zutaten vollständig prüfbar.` : `Found recipes (${p.attempted} attempted), but none had every ingredient fully verifiable.`;
    case "ingredients_fully_resolved": return hu ? `Mind a(z) ${p.total} összetevő megbízható ételadathoz kapcsolódott.` : de ? `Alle ${p.total} Zutaten wurden mit verlässlichen Daten verknüpft.` : `All ${p.total} ingredients matched trusted food data.`;
    case "ingredients_need_review": return hu ? `${p.resolved}/${p.total} összetevő ellenőrzött, ${p.needsReview} megerősítést igényel, ${p.unresolved} nem azonosítható.` : de ? `${p.resolved}/${p.total} Zutaten geprüft, ${p.needsReview} brauchen Bestätigung, ${p.unresolved} nicht identifizierbar.` : `${p.resolved}/${p.total} ingredients verified, ${p.needsReview} need confirmation, ${p.unresolved} unresolved.`;
    case "sibling_overlap_guarded": return hu ? "A recept és a mellette megadott összetevő közötti átfedést kiszűrtük, hogy ne számoljunk kétszer." : de ? "Eine Überschneidung zwischen Rezept und separat angegebener Zutat wurde erkannt, um Doppelzählung zu vermeiden." : "An overlap between the recipe and a separately-listed ingredient was caught to avoid double-counting.";
    default: return withLabel(hu ? "Ez a lépés ellenőrzést igényel." : de ? "Dieser Schritt braucht eine Prüfung." : "This step needs review.", event);
  }
}

function StatusIcon({ status }: { status: DiagnosticEvent["status"] }) {
  if (status === "ok") return <span className="diagnostic-icon ok" aria-hidden="true">✓</span>;
  if (status === "blocked") return <span className="diagnostic-icon blocked" aria-hidden="true">✗</span>;
  return <span className="diagnostic-icon attention" aria-hidden="true">○</span>;
}

export function DiagnosticsPanel({ events, lang }: { events: DiagnosticEvent[]; lang: Lang }) {
  const [open, setOpen] = useState(false);
  if (!events.length) return null;
  const heading = lang === "hu" ? "Mi történt?" : lang === "de" ? "Was ist passiert?" : "What happened?";
  return (
    <div className="diagnostics-panel">
      <button type="button" className="diagnostics-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>{heading}</span>{open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
      </button>
      {open && (
        <ol className="diagnostics-list">
          {events.map((event, index) => (
            <li key={index} className={`diagnostics-entry status-${event.status}`}>
              <StatusIcon status={event.status}/>
              <div className="diagnostics-entry-copy">
                <small className="diagnostics-stage">{stageHeading(event.stage, lang)}</small>
                <span>{eventText(event, lang)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
