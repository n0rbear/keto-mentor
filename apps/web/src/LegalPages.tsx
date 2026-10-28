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
  const role = lang === "hu" ? " (magánszemély, NorbApp néven)" : lang === "de" ? " (Privatperson, tätig unter dem Namen NorbApp)" : " (private individual, operating under the name NorbApp)";
  return [`${label[0]}: ${name ? name + role : missing}`, `${label[1]}: ${email ?? missing}`, `${label[2]}: ${country?.[lang] ?? missing}`];
}

function privacy(lang: Lang): { intro: string; sections: Section[] } {
  const c = controllerLines(lang).map((line) => [line]);
  const email = LEGAL_CONTROLLER.email ?? "";
  if (lang === "de") return {
    intro: "Diese Erklärung beschreibt nach Art. 13 und 21 DSGVO, welche personenbezogenen Daten Keto Mentor by NorbApp (ketomentor.norbapp.com) verarbeitet, wozu, wie lange, wer sie erhält und welche Rechte du hast. Keto Mentor ist ein Ernährungstagebuch zur Information; es stellt keine Diagnose und ersetzt keine ärztliche Beratung.",
    sections: [
      { title: "1. Verantwortlicher", body: [...c, ["Ein Datenschutzbeauftragter ist nicht bestellt, da keine Pflicht dazu besteht. Für alle Datenschutzfragen und deine Rechte schreib an die E-Mail-Adresse oben."]] },
      { title: "2. Welche Daten", body: [["Konto: Benutzername, E-Mail-Adresse, Passwort (nur als Argon2-Hash), Sprache, Zeitpunkt der Registrierung und der E-Mail-Bestätigung."], ["Profil: Ziele und Makrowerte, Vorlieben, gemiedene Lebensmittel, Allergien, deine Teller."], ["Tagebuch: Mahlzeiten mit Mengen und Nährwerten, eigene Rezepte, Wochenplan."], ["Wenn du sie nutzt: Gewichtstagebuch (Datum und Gewicht), Ziele je Wochentag, Erinnerungseinstellungen (Uhrzeit und Zeitzone)."], ["Fehlermeldungen und Ideen, die du sendest: dein Text, Ansicht, Sprache, App-Version und deine letzte Mahlzeiteingabe."], ["Ausprobieren ohne Registrierung: der eingegebene Text wird nur für die Antwort verarbeitet (bei Bedarf mit einem KI-Dienst), nicht gespeichert und keiner Person zugeordnet."], ["Nutzung: welche Ansicht der App geöffnet wird (z. B. Tagebuch, Rezepte), Gerätetyp und Betriebssystem, über welchen Kampagnenlink jemand gekommen ist – nur als anonyme Zähler bzw. für die Benachrichtigungen an den Betreiber (Abschnitt 5)."], ["Technische Protokolle beim Hosting-Anbieter: IP-Adresse, Browser, Zeitpunkt und Pfad der Anfrage."]] },
      { title: "3. Zweck und Rechtsgrundlage", body: [["Bereitstellung der App und deines Kontos, E-Mails zur Bestätigung und zum Zurücksetzen des Passworts, eingeschaltete Erinnerungen (Art. 6 Abs. 1 lit. b DSGVO)."], ["Angaben zu Ernährung, Allergien und Gewicht können Gesundheitsdaten sein. Sie werden nur verarbeitet, weil du sie selbst einträgst, mit deiner ausdrücklichen Einwilligung (Art. 9 Abs. 2 lit. a DSGVO); du kannst sie jederzeit widerrufen, indem du die Angaben oder dein Konto löschst. Die bis dahin erfolgte Verarbeitung bleibt rechtmäßig."], ["Sicherheit, Fehlersuche und Support (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO). Der Betreiber sieht in einem Admin-Bereich die Kontenliste (Benutzername, E-Mail, Registrierungsdatum, Anzahl Mahlzeiten und Rezepte) und die Fehlermeldungen; nur für Support und gegen Missbrauch."], ["Beta-Aktion: Die 10 Tester mit den meisten erfassten Mahlzeiten bis zum Ende der ersten Beta-Runde erhalten Premium auf Lebenszeit. Dafür wird die Zahl deiner Mahlzeiten gezählt und deine Platzierung nur dir angezeigt; die Gewinner werden per E-Mail benachrichtigt (Art. 6 Abs. 1 lit. b DSGVO)."], ["Anonyme, zusammengefasste Nutzungsstatistik (z. B. Anzahl Suchen, KI-Aufrufe und Registrierungen je Kampagnenlink pro Tag) zur Weiterentwicklung; ohne Bezug zu dir (Art. 6 Abs. 1 lit. f DSGVO)."], ["Keine Werbung, kein Verkauf von Daten, keine externen Analyse- oder Tracking-Dienste, keine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO."]] },
      { title: "4. Auftragsverarbeiter und Empfänger", body: [["Render (Render Services, Inc., USA): Hosting und Datenbank im Rechenzentrum Frankfurt (EU); der Datenverkehr läuft über das Netzwerk von Cloudflare, Inc. (USA). Beide sind unter dem EU-US Data Privacy Framework zertifiziert (Art. 45 DSGVO)."], ["OpenAI (USA): Auslegung deiner eingegebenen oder gesprochenen Mahlzeiten, Rezeptimport und Sprach-zu-Text. Gesendet wird der Mahlzeit- bzw. Rezepttext oder die Sprachaufnahme, nicht dein Name oder deine E-Mail; Aufnahmen speichern wir nicht. Übermittlung auf Grundlage der EU-Standardvertragsklauseln (Art. 46 DSGVO)."], ["Resend (USA): Versand der E-Mails zum Zurücksetzen des Passworts, zur Bestätigung und der von dir eingeschalteten Erinnerungen (nur deine E-Mail-Adresse und der Nachrichtentext); Resend ist unter dem EU-US Data Privacy Framework zertifiziert."], ["Lebensmitteldatenbanken und Websuche (Open Food Facts, USDA, Websuche über Tavily nach Nährwertangaben): nur Lebensmittelnamen oder Barcodes, keine personenbezogenen Daten."], ["Benachrichtigungsdienst des Betreibers, MaxMind und ntfy.sh – siehe Abschnitt 5."]] },
      { title: "5. Benachrichtigungen an den Betreiber", body: [["Bei manchen Ereignissen erhält der Betreiber eine kurze Push-Benachrichtigung auf sein Handy, um die Nutzung zu verfolgen, schnell auf Fehlermeldungen zu reagieren und Missbrauch zu bemerken: bei Registrierung und Anmeldung (dein Benutzername), bei einer Fehlermeldung oder Idee (ihr Text), beim Öffnen einer Ansicht (Ansicht, Gerätetyp und Betriebssystem), beim Löschen eines Kontos und bei der E-Mail-Bestätigung (ohne Namen). Dazu kommt der ungefähre Standort (Stadt und Land); die IP-Adresse selbst steht nicht in der Nachricht."], ["Die Benachrichtigungen laufen über den Benachrichtigungsdienst von NorbApp (bei Render in Frankfurt). Der ungefähre Standort wird aus der IP-Adresse ermittelt: das Land aus einer Datenbank auf diesem Server (DB-IP), die Stadt über den GeoLite-Webdienst der MaxMind, Inc. (USA, unter dem EU-US Data Privacy Framework zertifiziert), an den die IP-Adresse dafür gesendet wird. Die Antwort wird höchstens 24 Stunden im Arbeitsspeicher gehalten, die IP-Adresse nicht gespeichert."], ["Zugestellt wird über ntfy.sh, einen Push-Dienst von Philipp C. Heckel, der Nachrichten höchstens 12 Stunden vorhält und dann löscht; für die Zustellung aufs Handy kann er die Push-Dienste von Apple oder Google nutzen. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sicherer Betrieb, schneller Support). Du kannst widersprechen (Abschnitt 9)."]] },
      { title: "6. Speicherdauer", body: [["Solange dein Konto besteht. Beim Löschen des Kontos werden deine Daten sofort gelöscht; ein öffentlich geteiltes Rezept, das andere bereits protokolliert haben, und deine gesendeten Fehlermeldungen bleiben ohne Bezug zu dir erhalten."], ["Server-Protokolle werden nach der Aufbewahrungsfrist des Hosting-Anbieters gelöscht (höchstens einige Wochen), Push-Benachrichtigungen bei ntfy.sh nach höchstens 12 Stunden."]] },
      { title: "7. Cookies und lokaler Speicher", body: [["Ein technisch notwendiges Cookie (km_refresh, httpOnly) hält dich angemeldet. Im lokalen Speicher des Browsers liegen das Anmelde-Token, die Sprache und Anzeigeeinstellungen; mit „Angemeldet bleiben“ zusätzlich ein Erneuerungs-Token, weil manche Browser (z. B. Safari auf dem iPhone) das Cookie blockieren. Beim Abmelden wird es gelöscht. Das ist für den von dir gewünschten Dienst unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Keine Werbe- oder Tracking-Cookies."]] },
      { title: "8. Deine Rechte", body: [["Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerruf einer Einwilligung (Art. 7 Abs. 3): schreib an " + email + "; wir antworten innerhalb eines Monats. Dein Konto kannst du unten selbst löschen."], ["Beschwerderecht bei einer Datenschutzaufsichtsbehörde (Art. 77 DSGVO), insbesondere in dem EU-Land, in dem du wohnst oder arbeitest: z. B. in Deutschland bei der Landesbehörde deines Bundeslands, in Österreich bei der Datenschutzbehörde, in Ungarn bei der NAIH (naih.hu)."]] },
      { title: "9. Widerspruchsrecht (Art. 21 DSGVO)", body: [["Soweit wir Daten auf Grundlage berechtigter Interessen verarbeiten (Art. 6 Abs. 1 lit. f DSGVO), kannst du aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit widersprechen. Wir verarbeiten die Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die deine Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen. Eine formlose E-Mail genügt."]] },
      { title: "10. Weitere Hinweise", body: [["Für ein Konto brauchen wir Benutzername, E-Mail-Adresse und Passwort; ohne sie kann kein Konto angelegt werden. Alle weiteren Angaben sind freiwillig. Wir passen diese Erklärung an, wenn sich die App oder die genutzten Dienste ändern; das Datum oben zeigt die aktuelle Fassung."]] }
    ]
  };
  if (lang === "en") return {
    intro: "As required by Articles 13 and 21 GDPR, this notice explains which personal data Keto Mentor by NorbApp (ketomentor.norbapp.com) processes, why, for how long, who receives it and what your rights are. Keto Mentor is an informational food diary; it does not diagnose and does not replace medical advice.",
    sections: [
      { title: "1. Controller", body: [...c, ["No data protection officer has been appointed, as none is required. Write to the e-mail address above with any privacy question or to exercise your rights."]] },
      { title: "2. What data", body: [["Account: username, e-mail address, password (only as an Argon2 hash), language, time of registration and of e-mail confirmation."], ["Profile: goals and macro targets, preferences, avoided foods, allergies, your plates."], ["Diary: meals with amounts and nutrition, your own recipes, weekly meal plan."], ["If you use them: weight log (date and weight), per-weekday goals, reminder settings (time and time zone)."], ["Bug reports and ideas you send: your text, the current screen, language, app version and your last meal entry."], ["Trying it without an account: the text you type is processed only to answer (with an AI service where needed), not stored and not linked to a person."], ["Usage: which view of the app is opened (e.g. diary, recipes), device type and operating system, which campaign link someone came through – only as anonymous counters or for the notifications to the operator (section 5)."], ["Technical logs at the hosting provider: IP address, browser, time and path of each request."]] },
      { title: "3. Purpose and legal basis", body: [["Providing the app and your account, e-mails to confirm your address and reset your password, reminders you turn on (Art. 6(1)(b) GDPR)."], ["Diet, allergy and weight details may be health data. They are processed only because you enter them yourself, with your explicit consent (Art. 9(2)(a) GDPR); you can withdraw it at any time by deleting the details or your account. Processing before the withdrawal remains lawful."], ["Security, troubleshooting and support (legitimate interest, Art. 6(1)(f) GDPR). The operator sees, in an admin area, the list of accounts (username, e-mail, registration date, number of meals and recipes) and the bug reports; used only for support and against abuse."], ["Beta reward: the 10 testers with the most logged meals by the end of the first beta round get lifetime premium. For this the number of your meals is counted, your rank is shown only to you, and the winners are notified by e-mail (Art. 6(1)(b) GDPR)."], ["Anonymous, aggregated usage statistics (e.g. searches, AI calls and sign-ups per campaign link per day) to improve the app; not linked to you (Art. 6(1)(f) GDPR)."], ["No advertising, no selling of data, no third-party analytics or tracking services, no automated decision-making within the meaning of Art. 22 GDPR."]] },
      { title: "4. Processors and recipients", body: [["Render (Render Services, Inc., USA): hosting and database in the Frankfurt data centre (EU); traffic passes through the network of Cloudflare, Inc. (USA). Both are certified under the EU-US Data Privacy Framework (Art. 45 GDPR)."], ["OpenAI (USA): interpreting the meals you type or say, recipe import and speech-to-text. What is sent is the meal or recipe text or the voice recording, not your name or e-mail; recordings are not stored. Transfer based on the EU Standard Contractual Clauses (Art. 46 GDPR)."], ["Resend (USA): sending the password reset, confirmation and the reminder e-mails you turn on (only your e-mail address and the message text); Resend is certified under the EU-US Data Privacy Framework."], ["Food databases and web search (Open Food Facts, USDA, web search via Tavily for nutrition labels): food names or barcodes only, no personal data."], ["The operator's notification service, MaxMind and ntfy.sh – see section 5."]] },
      { title: "5. Notifications to the operator", body: [["For some events the operator receives a short push notification on his phone, so he can follow how the app is used, react quickly to bug reports and spot misuse: registration and sign-in (your username), a bug report or idea (its text), opening a view (the view, device type and operating system), deleting an account and confirming an e-mail address (without a name). The approximate location (city and country) is added; the IP address itself is not in the message."], ["The notifications go through NorbApp's notification service (at Render in Frankfurt). The approximate location is derived from the IP address: the country from a database on that server (DB-IP), the city through the GeoLite web service of MaxMind, Inc. (USA, certified under the EU-US Data Privacy Framework), to which the IP address is sent for this. The answer is kept in memory for at most 24 hours; the IP address is not stored."], ["Delivery is through ntfy.sh, a push service operated by Philipp C. Heckel, which keeps messages for at most 12 hours and then deletes them; to reach the phone it may use the push services of Apple or Google. Legal basis: Art. 6(1)(f) GDPR (secure operation, quick support). You can object (section 9)."]] },
      { title: "6. Retention", body: [["As long as your account exists. Deleting your account deletes your data immediately; a publicly shared recipe that others have already logged and the bug reports you sent stay, without any link to you."], ["Server logs are deleted after the hosting provider's retention period (a few weeks at most), push notifications at ntfy.sh after at most 12 hours."]] },
      { title: "7. Cookies and local storage", body: [["One strictly necessary cookie (km_refresh, httpOnly) keeps you signed in. The browser's local storage holds the sign-in token, the language and display settings; with “Keep me signed in” also a renewal token, because some browsers (e.g. Safari on iPhone) block the cookie. Signing out deletes it. This is strictly necessary for the service you asked for (§ 25(2) no. 2 TDDDG). No advertising or tracking cookies."]] },
      { title: "8. Your rights", body: [["Access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20) and withdrawal of consent (Art. 7(3)): write to " + email + "; we answer within one month. You can delete your account yourself below."], ["You may lodge a complaint with a data protection authority (Art. 77 GDPR), in particular in the EU country where you live or work: e.g. NAIH in Hungary (naih.hu), the authority of your federal state in Germany, or the Datenschutzbehörde in Austria."]] },
      { title: "9. Right to object (Art. 21 GDPR)", body: [["Where we process data on the basis of legitimate interests (Art. 6(1)(f) GDPR), you have the right to object at any time, on grounds relating to your particular situation. We then stop the processing unless we can demonstrate compelling legitimate grounds that override your interests, rights and freedoms, or the processing serves the establishment, exercise or defence of legal claims. An informal e-mail is enough."]] },
      { title: "10. Other information", body: [["An account needs a username, an e-mail address and a password; without them no account can be created. Everything else is optional. We will update this notice when the app or the services it uses change; the date at the top shows the current version."]] }
    ]
  };
  return {
    intro: "Ez a tájékoztató a GDPR 13. és 21. cikke szerint leírja, milyen személyes adatokat kezel a Keto Mentor by NorbApp (ketomentor.norbapp.com), milyen célból, mennyi ideig, kik kapják meg, és milyen jogaid vannak. A Keto Mentor tájékoztató jellegű étkezésnapló; nem diagnosztizál, és nem helyettesíti az orvosi tanácsot.",
    sections: [
      { title: "1. Adatkezelő", body: [...c, ["Adatvédelmi tisztviselőt nem neveztünk ki, mert erre nincs kötelezettség. Adatvédelmi kérdéssel és a jogaid gyakorlásához a fenti e-mail címre írj."]] },
      { title: "2. Milyen adatokat kezelünk", body: [["Fiók: felhasználónév, e-mail cím, jelszó (csak Argon2-lenyomatként), nyelv, a regisztráció és az e-mail-megerősítés ideje."], ["Profil: célok és makróértékek, preferenciák, kerülendő ételek, allergiák, a tányérjaid."], ["Napló: étkezések mennyiséggel és tápértékkel, saját receptek, heti étrendterv."], ["Ha használod: testsúlynapló (dátum és testsúly), napokra bontott célok, emlékeztető-beállítások (időpont és időzóna)."], ["Az általad küldött hibajelentések és ötletek: a szöveged, az aktuális képernyő, a nyelv, az app verziója és az utoljára beírt étkezésed."], ["Regisztráció nélküli kipróbálás: a beírt szöveget csak a válaszhoz dolgozzuk fel (szükség esetén egy AI-szolgáltatással), nem tároljuk, és nem kapcsoljuk személyhez."], ["Használat: az app melyik nézete nyílik meg (pl. napló, receptek), az eszköz típusa és operációs rendszere, melyik kampánylinken érkezett valaki – csak névtelen számlálóként, illetve az üzemeltetőnek küldött értesítésekhez (5. pont)."], ["Technikai napló a tárhelyszolgáltatónál: IP-cím, böngésző, a kérés ideje és útvonala."]] },
      { title: "3. Cél és jogalap", body: [["Az app és a fiókod működtetése, az e-mail-megerősítő és jelszó-visszaállító levelek, az általad bekapcsolt emlékeztetők (GDPR 6. cikk (1) b))."], ["Az étkezési, allergia- és testsúlyadatok egészségügyi adatnak minősülhetnek. Csak azért kezeljük őket, mert te magad írod be őket, kifejezett hozzájárulásoddal (GDPR 9. cikk (2) a)); ezt bármikor visszavonhatod az adatok vagy a fiókod törlésével. A visszavonás előtti adatkezelés jogszerűségét ez nem érinti."], ["Biztonság, hibakeresés és támogatás (jogos érdek, GDPR 6. cikk (1) f)). Az üzemeltető egy admin felületen látja a fiókok listáját (felhasználónév, e-mail cím, regisztráció ideje, étkezések és receptek száma) és a hibajelentéseket; ezt csak támogatásra és visszaélések kezelésére használja."], ["Béta-akció: az első béta-kör végéig a legtöbb étkezést naplózó 10 tesztelő élethosszig tartó prémiumot kap. Ehhez megszámoljuk az étkezéseid számát, a helyezésedet csak te látod, a nyerteseket e-mailben értesítjük (GDPR 6. cikk (1) b))."], ["Névtelen, összesített használati statisztika (pl. napi keresések, AI-hívások és kampánylinkenkénti regisztrációk száma) az app fejlesztéséhez; ezek nem kapcsolódnak hozzád (GDPR 6. cikk (1) f))."], ["Nincs reklám, nem adjuk el az adatokat, nincs külső elemző vagy követő szolgáltatás, és nincs a GDPR 22. cikke szerinti automatizált döntéshozatal."]] },
      { title: "4. Adatfeldolgozók és címzettek", body: [["Render (Render Services, Inc., USA): tárhely és adatbázis a frankfurti adatközpontban (EU); a forgalom a Cloudflare, Inc. (USA) hálózatán halad át. Mindkettő az EU–USA adatvédelmi keretrendszer alapján tanúsított (GDPR 45. cikk)."], ["OpenAI (USA): a beírt vagy kimondott étkezések értelmezése, receptimport és beszéd-szöveg átírás. Az étkezés vagy recept szövegét, illetve a hangfelvételt küldjük el, a nevedet vagy az e-mail címedet nem; a felvételt nem tároljuk. Az adattovábbítás az EU általános szerződési feltételei alapján történik (GDPR 46. cikk)."], ["Resend (USA): a jelszó-visszaállító, a megerősítő és az általad bekapcsolt emlékeztető e-mailek kiküldése (csak az e-mail címed és az üzenet szövege); a Resend az EU–USA adatvédelmi keretrendszer alapján tanúsított."], ["Élelmiszer-adatbázisok és webes keresés (Open Food Facts, USDA, tápérték-címkék keresése a Tavilyn keresztül): csak ételnevet vagy vonalkódot küldünk, személyes adatot nem."], ["Az üzemeltető értesítési szolgáltatása, a MaxMind és az ntfy.sh – lásd az 5. pontot."]] },
      { title: "5. Értesítések az üzemeltetőnek", body: [["Egyes eseményekről az üzemeltető rövid push-értesítést kap a telefonjára, hogy kövesse az app használatát, gyorsan reagáljon a hibajelentésekre, és észrevegye a visszaéléseket: regisztráció és bejelentkezés (a felhasználóneved), hibajelentés vagy ötlet (a szövege), egy nézet megnyitása (a nézet, az eszköz típusa és operációs rendszere), fióktörlés és e-mail-megerősítés (név nélkül). Ehhez hozzákerül a hozzávetőleges hely (város és ország); magát az IP-címet az üzenet nem tartalmazza."], ["Az értesítések a NorbApp értesítési szolgáltatásán (Render, Frankfurt) keresztül mennek. A hozzávetőleges helyet az IP-címből állapítjuk meg: az országot az ottani szerveren lévő adatbázisból (DB-IP), a várost a MaxMind, Inc. (USA, az EU–USA adatvédelmi keretrendszer alapján tanúsított) GeoLite webszolgáltatásával, amelynek ehhez elküldjük az IP-címet. A választ legfeljebb 24 óráig a memóriában tartjuk, az IP-címet nem tároljuk."], ["A kézbesítést az ntfy.sh push-szolgáltatás (üzemeltető: Philipp C. Heckel) végzi, amely az üzeneteket legfeljebb 12 óráig őrzi, majd törli; a telefonra juttatáshoz az Apple vagy a Google push-szolgáltatását is használhatja. Jogalap: GDPR 6. cikk (1) f) (biztonságos működés, gyors támogatás). Tiltakozhatsz ellene (9. pont)."]] },
      { title: "6. Megőrzési idő", body: [["Amíg a fiókod létezik. A fiók törlésekor az adataid azonnal törlődnek; a nyilvánosan megosztott receptjeid közül az, amelyet mások már naplóztak, és az elküldött hibajelentéseid hozzád kötés nélkül megmaradnak."], ["A szervernaplók a tárhelyszolgáltató megőrzési ideje (legfeljebb néhány hét) után törlődnek, a push-értesítések az ntfy.sh-n legfeljebb 12 óra után."]] },
      { title: "7. Sütik és helyi tárolás", body: [["Egyetlen, a működéshez szükséges süti (km_refresh, httpOnly) tart bejelentkezve. A böngésző helyi tárolójában a belépési token, a nyelv és a megjelenítési beállítások vannak; „Bejelentkezve maradok” esetén egy megújító token is, mert egyes böngészők (pl. az iPhone-os Safari) letiltják a sütit. Kijelentkezéskor törlődik. Ezek az általad kért szolgáltatáshoz feltétlenül szükségesek, ezért hozzájárulást nem igényelnek. Nincs reklám- vagy követő süti."]] },
      { title: "8. Jogaid", body: [["Hozzáférés (GDPR 15. cikk), helyesbítés (16. cikk), törlés (17. cikk), korlátozás (18. cikk), adathordozhatóság (20. cikk) és a hozzájárulás visszavonása (7. cikk (3)): írj a " + email + " címre; egy hónapon belül válaszolunk. A fiókodat lent magad is törölheted."], ["Panaszt tehetsz adatvédelmi hatóságnál (GDPR 77. cikk), különösen abban az EU-országban, ahol élsz vagy dolgozol: Magyarországon a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH, 1055 Budapest, Falk Miksa utca 9–11., naih.hu), Németországban a tartományod adatvédelmi hatóságánál, Ausztriában a Datenschutzbehördénél. Bírósághoz is fordulhatsz (GDPR 79. cikk)."]] },
      { title: "9. Tiltakozási jog (GDPR 21. cikk)", body: [["Ha az adatkezelés jogos érdeken alapul (GDPR 6. cikk (1) f)), a saját helyzeteddel kapcsolatos okból bármikor tiltakozhatsz ellene. Ilyenkor az adatot nem kezeljük tovább, kivéve, ha olyan kényszerítő erejű jogos okot igazolunk, amely elsőbbséget élvez az érdekeiddel, jogaiddal és szabadságaiddal szemben, vagy ha az adatkezelés jogi igények előterjesztéséhez, érvényesítéséhez vagy védelméhez szükséges. Elég egy egyszerű e-mail."]] },
      { title: "10. Egyéb tudnivalók", body: [["A fiókhoz felhasználónév, e-mail cím és jelszó kell; ezek nélkül nem hozható létre fiók. Minden más adat megadása önkéntes. A tájékoztatót frissítjük, ha az app vagy az általa használt szolgáltatások változnak; a fenti dátum a hatályos változatot mutatja."]] }
    ]
  };
}

const deletion = {
  hu: { title: "Fiók törlése", text: "A törlés végleges: a profilod, a naplód, a receptjeid, a tányérjaid, az étrendterveid és a testsúlynaplód azonnal törlődnek, és ez nem vonható vissza.", password: "Jelenlegi jelszó", confirm: "Megértettem, véglegesen törlöm a fiókomat", button: "Fiók végleges törlése", done: "A fiókod törölve." },
  de: { title: "Konto löschen", text: "Das Löschen ist endgültig: Profil, Tagebuch, Rezepte, Teller, Wochenpläne und Gewichtstagebuch werden sofort gelöscht und können nicht wiederhergestellt werden.", password: "Aktuelles Passwort", confirm: "Ich habe verstanden und lösche mein Konto endgültig", button: "Konto endgültig löschen", done: "Dein Konto wurde gelöscht." },
  en: { title: "Delete account", text: "Deletion is permanent: your profile, diary, recipes, plates, meal plans and weight log are deleted at once and cannot be restored.", password: "Current password", confirm: "I understand and permanently delete my account", button: "Permanently delete account", done: "Your account has been deleted." }
} as const;

export function AccountDeletion({ lang, state, onDeleted }: { lang: Lang; state: ApiState; onDeleted: () => void }) {
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
