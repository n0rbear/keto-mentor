import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { api, type ApiState } from "./api";
import { authErrorText } from "./auth-error";
import type { Lang } from "./i18n";
import { LEGAL_CONTROLLER, LEGAL_LAST_UPDATED } from "./legal-info";

// Tester release (2026-10-15): the source attribution the data licences
// require (BLS CC BY 4.0 above all) and the privacy notice, reachable from
// every view through the footer (#forrasok, #adatvedelem).

export type LegalPage = "sources" | "privacy";
export const LEGAL_HASHES: Record<LegalPage, string> = { sources: "#forrasok", privacy: "#adatvedelem" };
export function legalPageFromHash(hash: string): LegalPage | null {
  return hash === LEGAL_HASHES.sources ? "sources" : hash === LEGAL_HASHES.privacy ? "privacy" : null;
}

const ui = {
  hu: { back: "Vissza az apphoz", sources: "Források és licencek", privacy: "Adatvédelmi tájékoztató", updated: "Utolsó frissítés", missing: "⚠ kitöltés alatt" },
  de: { back: "Zurück zur App", sources: "Quellen und Lizenzen", privacy: "Datenschutzerklärung", updated: "Zuletzt aktualisiert", missing: "⚠ wird ergänzt" },
  en: { back: "Back to the app", sources: "Sources and licences", privacy: "Privacy notice", updated: "Last updated", missing: "⚠ to be completed" }
} as const;

type Section = { title: string; body: Array<string | { href: string; text: string }>[] };

const BLS = "Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0.";

const sources: Record<Lang, { intro: string; sections: Section[] }> = {
  hu: {
    intro: "A Keto Mentor tápértékei hivatalos, nyílt élelmiszer-adatbázisokból származnak. Az alábbi forrásokat a licencük szerint tüntetjük fel.",
    sections: [
      { title: "Bundeslebensmittelschlüssel (BLS)", body: [[BLS], ["Licenc: ", { href: "https://creativecommons.org/licenses/by/4.0/deed.hu", text: "Creative Commons Nevezd meg! 4.0 (CC BY 4.0)" }, ". Forrás: ", { href: "https://www.blsdb.de", text: "blsdb.de" }], ["Módosítások: a szénhidrátot a rosttal együtt (teljes szénhidrátként) tároljuk, magyar és angol neveket adtunk a tételekhez, és egyes tételeket egységsúlyokkal egészítettünk ki."]] },
      { title: "USDA FoodData Central", body: [["U.S. Department of Agriculture, Agricultural Research Service: FoodData Central. ", { href: "https://fdc.nal.usda.gov", text: "fdc.nal.usda.gov" }], ["Licenc: ", { href: "https://creativecommons.org/publicdomain/zero/1.0/", text: "CC0 1.0 (közkincs)" }, "."]] },
      { title: "Open Food Facts", body: [["A vonalkódos termékadatok az Open Food Facts közreműködőitől származnak: ", { href: "https://world.openfoodfacts.org", text: "openfoodfacts.org" }, "."], ["Licenc: ", { href: "https://opendatacommons.org/licenses/odbl/1-0/", text: "Open Database License (ODbL) 1.0" }, "; az egyes adatok a Database Contents License alá tartoznak, a termékfotók CC BY-SA alá."]] },
      { title: "Gyorséttermi termékek", body: [["A lánctermékek tápértékei a láncok saját, nyilvános tápérték-táblázataiból származnak (pl. McDonald's Österreich), a letöltés dátumával."]] },
      { title: "Referenciaételek", body: [["A referenciaételek receptjeit nyilvános receptoldalak alapján állítottuk össze (ételenként legalább két dátumozott forrással). A tápértéket a fenti adatbázisokból számoljuk, nem a receptoldalakról vesszük át."]] },
      { title: "AI-becslések", body: [["Ha egy ételhez nincs hiteles adat, az app AI-val becsülhet. Ezt mindig jelöljük, jóváhagyás nélkül nem mentjük, és a közös adatbázisba nem kerül be."]] }
    ]
  },
  de: {
    intro: "Die Nährwerte in Keto Mentor stammen aus amtlichen, offenen Lebensmitteldatenbanken. Die Quellen sind hier gemäß ihren Lizenzen angegeben.",
    sections: [
      { title: "Bundeslebensmittelschlüssel (BLS)", body: [[BLS], ["Lizenz: ", { href: "https://creativecommons.org/licenses/by/4.0/deed.de", text: "Creative Commons Namensnennung 4.0 (CC BY 4.0)" }, ". Quelle: ", { href: "https://www.blsdb.de", text: "blsdb.de" }], ["Änderungen: Kohlenhydrate werden einschließlich Ballaststoffen (als Gesamtkohlenhydrate) gespeichert, die Einträge haben ungarische und englische Namen erhalten, einzelne Einträge wurden um Stückgewichte ergänzt."]] },
      { title: "USDA FoodData Central", body: [["U.S. Department of Agriculture, Agricultural Research Service: FoodData Central. ", { href: "https://fdc.nal.usda.gov", text: "fdc.nal.usda.gov" }], ["Lizenz: ", { href: "https://creativecommons.org/publicdomain/zero/1.0/deed.de", text: "CC0 1.0 (gemeinfrei)" }, "."]] },
      { title: "Open Food Facts", body: [["Produktdaten zu Barcodes stammen von den Mitwirkenden bei Open Food Facts: ", { href: "https://world.openfoodfacts.org", text: "openfoodfacts.org" }, "."], ["Lizenz: ", { href: "https://opendatacommons.org/licenses/odbl/1-0/", text: "Open Database License (ODbL) 1.0" }, "; einzelne Inhalte unter der Database Contents License, Produktfotos unter CC BY-SA."]] },
      { title: "Fast-Food-Produkte", body: [["Die Nährwerte von Kettenprodukten stammen aus den öffentlichen Nährwerttabellen der Ketten (z. B. McDonald's Österreich), mit Abrufdatum."]] },
      { title: "Referenzgerichte", body: [["Die Rezepte der Referenzgerichte beruhen auf öffentlichen Rezeptseiten (mindestens zwei datierte Quellen je Gericht). Die Nährwerte werden aus den oben genannten Datenbanken berechnet, nicht von den Rezeptseiten übernommen."]] },
      { title: "KI-Schätzungen", body: [["Fehlen amtliche Daten, kann die App mit KI schätzen. Das ist immer gekennzeichnet, wird nicht ohne Bestätigung gespeichert und gelangt nicht in die gemeinsame Datenbank."]] }
    ]
  },
  en: {
    intro: "Keto Mentor's nutrition values come from official, open food databases. The sources are credited here as their licences require.",
    sections: [
      { title: "Bundeslebensmittelschlüssel (BLS)", body: [[BLS], ["Licence: ", { href: "https://creativecommons.org/licenses/by/4.0/", text: "Creative Commons Attribution 4.0 (CC BY 4.0)" }, ". Source: ", { href: "https://www.blsdb.de", text: "blsdb.de" }], ["Changes: carbohydrates are stored including fibre (as total carbohydrate), entries were given Hungarian and English names, and some entries were extended with unit weights."]] },
      { title: "USDA FoodData Central", body: [["U.S. Department of Agriculture, Agricultural Research Service: FoodData Central. ", { href: "https://fdc.nal.usda.gov", text: "fdc.nal.usda.gov" }], ["Licence: ", { href: "https://creativecommons.org/publicdomain/zero/1.0/", text: "CC0 1.0 (public domain)" }, "."]] },
      { title: "Open Food Facts", body: [["Barcode product data comes from the contributors to Open Food Facts: ", { href: "https://world.openfoodfacts.org", text: "openfoodfacts.org" }, "."], ["Licence: ", { href: "https://opendatacommons.org/licenses/odbl/1-0/", text: "Open Database License (ODbL) 1.0" }, "; individual contents under the Database Contents License, product photos under CC BY-SA."]] },
      { title: "Fast-food products", body: [["Chain product nutrition comes from the chains' own public nutrition tables (e.g. McDonald's Austria), with the retrieval date."]] },
      { title: "Reference dishes", body: [["Reference dish recipes are based on public recipe sites (at least two dated sources per dish). Nutrition is calculated from the databases above, not copied from the recipe sites."]] },
      { title: "AI estimates", body: [["When no authoritative data exists, the app may estimate with AI. Such estimates are always labelled, never saved without your confirmation and never added to the shared database."]] }
    ]
  }
};

function controllerLines(lang: Lang): string[] {
  const missing = ui[lang].missing;
  const { name, email, country } = LEGAL_CONTROLLER;
  const label = lang === "hu" ? ["Név", "E-mail", "Ország"] : lang === "de" ? ["Name", "E-Mail", "Land"] : ["Name", "E-mail", "Country"];
  return [`${label[0]}: ${name ?? missing}`, `${label[1]}: ${email ?? missing}`, `${label[2]}: ${country?.[lang] ?? missing}`];
}

function privacy(lang: Lang): { intro: string; sections: Section[] } {
  const c = controllerLines(lang).map((line) => [line]);
  if (lang === "de") return {
    intro: "Diese Erklärung beschreibt, welche personenbezogenen Daten Keto Mentor by NorbApp verarbeitet, wozu und mit welchen Rechten. Keto Mentor ist ein Ernährungstagebuch zur Information; es stellt keine Diagnose und ersetzt keine ärztliche Beratung.",
    sections: [
      { title: "1. Verantwortlicher", body: c },
      { title: "2. Welche Daten", body: [["Konto: Benutzername, E-Mail-Adresse, Passwort (nur als Argon2-Hash), Sprache."], ["Profil: Ziele und Makrowerte, Vorlieben, gemiedene Lebensmittel, Allergien, deine Teller."], ["Tagebuch: Mahlzeiten mit Mengen und Nährwerten, eigene Rezepte, Wochenplan."], ["Wenn du sie nutzt: Gewichtstagebuch (Datum und Gewicht), Ziele je Wochentag, Erinnerungseinstellungen (Uhrzeit und Zeitzone)."], ["Fehlermeldungen, die du sendest: dein Text, Ansicht, Sprache, App-Version und deine letzte Mahlzeiteingabe."], ["Technische Protokolle beim Hosting-Anbieter: IP-Adresse, Browser, Zeitpunkt und Pfad der Anfrage."]] },
      { title: "3. Zweck und Rechtsgrundlage", body: [["Bereitstellung der App und deines Kontos (Art. 6 Abs. 1 lit. b DSGVO)."], ["Angaben zu Ernährung, Allergien und Gewicht können Gesundheitsdaten sein. Sie werden nur verarbeitet, weil du sie selbst einträgst, mit deiner ausdrücklichen Einwilligung (Art. 9 Abs. 2 lit. a DSGVO); du kannst sie jederzeit widerrufen, indem du die Angaben löschst oder dein Konto löschst."], ["Sicherheit, Fehlersuche und Support (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO). Der Betreiber sieht in einem Admin-Bereich die Kontenliste (Benutzername, E-Mail, Registrierungsdatum, Anzahl Mahlzeiten und Rezepte) und die Fehlermeldungen; nur für Support und gegen Missbrauch."], ["Anonyme, zusammengefasste Nutzungsstatistik (z. B. Anzahl Suchen und KI-Aufrufe pro Tag) zur Weiterentwicklung; ohne Bezug zu dir."], ["Keine Werbung, kein Verkauf von Daten, keine externen Analyse- oder Tracking-Dienste."]] },
      { title: "4. Auftragsverarbeiter und Empfänger", body: [["Render (Hosting und Datenbank, Rechenzentrum Frankfurt, EU); der Datenverkehr läuft über das Netzwerk von Cloudflare."], ["OpenAI (USA): Auslegung deiner eingegebenen oder gesprochenen Mahlzeiten, Rezeptimport und Sprach-zu-Text. Gesendet wird der Mahlzeit- bzw. Rezepttext oder die Sprachaufnahme, nicht dein Name oder deine E-Mail; Aufnahmen speichern wir nicht. Übermittlung auf Grundlage der EU-Standardvertragsklauseln."], ["Resend: Versand der E-Mails zum Zurücksetzen des Passworts, zur Bestätigung und der von dir eingeschalteten Erinnerungen (nur deine E-Mail-Adresse und der Nachrichtentext)."], ["Lebensmitteldatenbanken und Websuche (Open Food Facts, USDA, Websuche nach Nährwertangaben): nur Lebensmittelnamen oder Barcodes, keine personenbezogenen Daten."]] },
      { title: "5. Speicherdauer", body: [["Solange dein Konto besteht. Beim Löschen des Kontos werden deine Daten sofort gelöscht; ein öffentlich geteiltes Rezept, das andere bereits protokolliert haben, und deine gesendeten Fehlermeldungen bleiben ohne Bezug zu dir erhalten."], ["Server-Protokolle werden nach der Aufbewahrungsfrist des Hosting-Anbieters gelöscht."]] },
      { title: "6. Cookies und lokaler Speicher", body: [["Ein technisch notwendiges Cookie (km_refresh, httpOnly) hält dich angemeldet. Im lokalen Speicher des Browsers liegen das Anmelde-Token, die Sprache und Anzeigeeinstellungen. Keine Werbe- oder Tracking-Cookies."]] },
      { title: "7. Deine Rechte", body: [["Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Widerruf einer Einwilligung (Art. 15–21 DSGVO): schreib an die E-Mail-Adresse oben. Dein Konto kannst du unten selbst löschen."], ["Beschwerderecht bei einer Datenschutzaufsichtsbehörde, z. B. in Deutschland der Landesbehörde deines Bundeslands, in Österreich der Datenschutzbehörde, in Ungarn der NAIH."]] }
    ]
  };
  if (lang === "en") return {
    intro: "This notice explains which personal data Keto Mentor by NorbApp processes, why, and what your rights are. Keto Mentor is an informational food diary; it does not diagnose and does not replace medical advice.",
    sections: [
      { title: "1. Controller", body: c },
      { title: "2. What data", body: [["Account: username, e-mail address, password (only as an Argon2 hash), language."], ["Profile: goals and macro targets, preferences, avoided foods, allergies, your plates."], ["Diary: meals with amounts and nutrition, your own recipes, weekly meal plan."], ["If you use them: weight log (date and weight), per-weekday goals, reminder settings (time and time zone)."], ["Bug reports you send: your text, the current screen, language, app version and your last meal entry."], ["Technical logs at the hosting provider: IP address, browser, time and path of each request."]] },
      { title: "3. Purpose and legal basis", body: [["Providing the app and your account (Art. 6(1)(b) GDPR)."], ["Diet, allergy and weight details may be health data. They are processed only because you enter them yourself, with your explicit consent (Art. 9(2)(a) GDPR); you can withdraw it at any time by deleting the details or your account."], ["Security, troubleshooting and support (legitimate interest, Art. 6(1)(f) GDPR). The operator sees, in an admin area, the list of accounts (username, e-mail, registration date, number of meals and recipes) and the bug reports; used only for support and against abuse."], ["Anonymous, aggregated usage statistics (e.g. searches and AI calls per day) to improve the app; not linked to you."], ["No advertising, no selling of data, no third-party analytics or tracking services."]] },
      { title: "4. Processors and recipients", body: [["Render (hosting and database, Frankfurt data centre, EU); traffic passes through Cloudflare's network."], ["OpenAI (USA): interpreting the meals you type or say, recipe import and speech-to-text. What is sent is the meal or recipe text or the voice recording, not your name or e-mail; recordings are not stored. Transfer based on the EU Standard Contractual Clauses."], ["Resend: sending the password reset, confirmation and the reminder e-mails you turn on (only your e-mail address and the message text)."], ["Food databases and web search (Open Food Facts, USDA, web search for nutrition labels): food names or barcodes only, no personal data."]] },
      { title: "5. Retention", body: [["As long as your account exists. Deleting your account deletes your data immediately; a publicly shared recipe that others have already logged and the bug reports you sent stay, without any link to you."], ["Server logs are deleted after the hosting provider's retention period."]] },
      { title: "6. Cookies and local storage", body: [["One strictly necessary cookie (km_refresh, httpOnly) keeps you signed in. The browser's local storage holds the sign-in token, the language and display settings. No advertising or tracking cookies."]] },
      { title: "7. Your rights", body: [["Access, rectification, erasure, restriction, portability, objection and withdrawal of consent (Art. 15–21 GDPR): write to the e-mail address above. You can delete your account yourself below."], ["You may lodge a complaint with a data protection authority, e.g. NAIH in Hungary, the authority of your federal state in Germany, or the Datenschutzbehörde in Austria."]] }
    ]
  };
  return {
    intro: "Ez a tájékoztató leírja, milyen személyes adatokat kezel a Keto Mentor by NorbApp, milyen célból, és milyen jogaid vannak. A Keto Mentor tájékoztató jellegű étkezésnapló; nem diagnosztizál, és nem helyettesíti az orvosi tanácsot.",
    sections: [
      { title: "1. Adatkezelő", body: c },
      { title: "2. Milyen adatokat kezelünk", body: [["Fiók: felhasználónév, e-mail cím, jelszó (csak Argon2-lenyomatként), nyelv."], ["Profil: célok és makróértékek, preferenciák, kerülendő ételek, allergiák, a tányérjaid."], ["Napló: étkezések mennyiséggel és tápértékkel, saját receptek, heti étrendterv."], ["Ha használod: testsúlynapló (dátum és testsúly), napokra bontott célok, emlékeztető-beállítások (időpont és időzóna)."], ["Az általad küldött hibajelentések: a szöveged, az aktuális képernyő, a nyelv, az app verziója és az utoljára beírt étkezésed."], ["Technikai napló a tárhelyszolgáltatónál: IP-cím, böngésző, a kérés ideje és útvonala."]] },
      { title: "3. Cél és jogalap", body: [["Az app és a fiókod működtetése (GDPR 6. cikk (1) b))."], ["Az étkezési, allergia- és testsúlyadatok egészségügyi adatnak minősülhetnek. Csak azért kezeljük őket, mert te magad írod be őket, kifejezett hozzájárulásoddal (GDPR 9. cikk (2) a)); ezt bármikor visszavonhatod az adatok vagy a fiókod törlésével."], ["Biztonság, hibakeresés és támogatás (jogos érdek, GDPR 6. cikk (1) f)). Az üzemeltető egy admin felületen látja a fiókok listáját (felhasználónév, e-mail cím, regisztráció ideje, étkezések és receptek száma) és a hibajelentéseket; ezt csak támogatásra és visszaélések kezelésére használja."], ["Névtelen, összesített használati statisztika (pl. napi keresések és AI-hívások száma) az app fejlesztéséhez; ezek nem kapcsolódnak hozzád."], ["Nincs reklám, nem adjuk el az adatokat, nincs külső elemző vagy követő szolgáltatás."]] },
      { title: "4. Adatfeldolgozók és címzettek", body: [["Render (tárhely és adatbázis, frankfurti adatközpont, EU); a forgalom a Cloudflare hálózatán halad át."], ["OpenAI (USA): a beírt vagy kimondott étkezések értelmezése, receptimport és beszéd-szöveg átírás. Az étkezés vagy recept szövegét, illetve a hangfelvételt küldjük el, a nevedet vagy az e-mail címedet nem; a felvételt nem tároljuk. Az adattovábbítás az EU általános szerződési feltételei alapján történik."], ["Resend: a jelszó-visszaállító, a megerősítő és az általad bekapcsolt emlékeztető e-mailek kiküldése (csak az e-mail címed és az üzenet szövege)."], ["Élelmiszer-adatbázisok és webes keresés (Open Food Facts, USDA, tápérték-címkék keresése): csak ételnevet vagy vonalkódot küldünk, személyes adatot nem."]] },
      { title: "5. Megőrzési idő", body: [["Amíg a fiókod létezik. A fiók törlésekor az adataid azonnal törlődnek; a nyilvánosan megosztott receptjeid közül az, amelyet mások már naplóztak, és az elküldött hibajelentéseid hozzád kötés nélkül megmaradnak."], ["A szervernaplók a tárhelyszolgáltató megőrzési ideje után törlődnek."]] },
      { title: "6. Sütik és helyi tárolás", body: [["Egyetlen, a működéshez szükséges süti (km_refresh, httpOnly) tart bejelentkezve. A böngésző helyi tárolójában a belépési token, a nyelv és a megjelenítési beállítások vannak. Nincs reklám- vagy követő süti."]] },
      { title: "7. Jogaid", body: [["Hozzáférés, helyesbítés, törlés, korlátozás, adathordozhatóság, tiltakozás és a hozzájárulás visszavonása (GDPR 15–21. cikk): írj a fenti e-mail címre. A fiókodat lent magad is törölheted."], ["Panaszt tehetsz az adatvédelmi hatóságnál, pl. Magyarországon a NAIH-nál, Németországban a tartományod adatvédelmi hatóságánál, Ausztriában a Datenschutzbehördénél."]] }
    ]
  };
}

const deletion = {
  hu: { title: "Fiók törlése", text: "A törlés végleges: a profilod, a naplód, a receptjeid, a tányérjaid, az étrendterveid és a testsúlynaplód azonnal törlődnek, és ez nem vonható vissza.", password: "Jelenlegi jelszó", confirm: "Megértettem, véglegesen törlöm a fiókomat", button: "Fiók végleges törlése", done: "A fiókod törölve." },
  de: { title: "Konto löschen", text: "Das Löschen ist endgültig: Profil, Tagebuch, Rezepte, Teller, Wochenpläne und Gewichtstagebuch werden sofort gelöscht und können nicht wiederhergestellt werden.", password: "Aktuelles Passwort", confirm: "Ich habe verstanden und lösche mein Konto endgültig", button: "Konto endgültig löschen", done: "Dein Konto wurde gelöscht." },
  en: { title: "Delete account", text: "Deletion is permanent: your profile, diary, recipes, plates, meal plans and weight log are deleted at once and cannot be restored.", password: "Current password", confirm: "I understand and permanently delete my account", button: "Permanently delete account", done: "Your account has been deleted." }
} as const;

function AccountDeletion({ lang, state, onDeleted }: { lang: Lang; state: ApiState; onDeleted: () => void }) {
  const t = deletion[lang];
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await api("/me", { method: "DELETE", body: JSON.stringify({ currentPassword: String(new FormData(event.currentTarget).get("currentPassword")) }) }, state);
      onDeleted();
    } catch (err) {
      setError(authErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="legal-delete" method="post" onSubmit={submit} aria-label={t.title}>
      <h3>{t.title}</h3>
      <p>{t.text}</p>
      <label>{t.password}<input className="field" name="currentPassword" type="password" required autoComplete="current-password"/></label>
      <label className="legal-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/>{t.confirm}</label>
      {error && <p className="status error" role="alert">{error}</p>}
      <button type="submit" className="btn danger" disabled={!confirmed || busy} aria-busy={busy}>{t.button}</button>
    </form>
  );
}

function renderBody(parts: Section["body"][number]) {
  return parts.map((part, index) => typeof part === "string" ? <span key={index}>{part}</span> : <a key={index} href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>);
}

export function LegalPageView({ page, lang, state, signedIn, onClose, onAccountDeleted }: { page: LegalPage; lang: Lang; state: ApiState; signedIn: boolean; onClose: () => void; onAccountDeleted: () => void }) {
  const t = ui[lang];
  const content = page === "sources" ? sources[lang] : privacy(lang);
  return (
    <article className="card legal-page" aria-labelledby="legal-title">
      <button type="button" className="btn ghost" onClick={onClose}><ArrowLeft size={16} aria-hidden="true"/>{t.back}</button>
      <h2 id="legal-title">{page === "sources" ? t.sources : t.privacy}</h2>
      <p className="text-xs text-muted">{t.updated}: {LEGAL_LAST_UPDATED}</p>
      <p>{content.intro}</p>
      {content.sections.map((section) => (
        <section key={section.title}>
          <h3>{section.title}</h3>
          {section.body.map((parts, index) => <p key={index}>{renderBody(parts)}</p>)}
        </section>
      ))}
      {page === "privacy" && signedIn && <AccountDeletion lang={lang} state={state} onDeleted={onAccountDeleted}/>}
    </article>
  );
}

export function LegalFooter({ lang }: { lang: Lang }) {
  const t = ui[lang];
  return (
    <footer className="legal-footer">
      <a href={LEGAL_HASHES.sources}>{t.sources}</a>
      <span aria-hidden="true">·</span>
      <a href={LEGAL_HASHES.privacy}>{t.privacy}</a>
    </footer>
  );
}
