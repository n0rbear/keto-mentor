import { useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck } from "lucide-react";
import { api, type ApiState } from "./api";
import { authErrorText } from "./auth-error";
import type { Lang } from "./i18n";

// Health-data consent (owner, 2026-10-28). Diet, allergy and weight details
// may be health data (GDPR Art. 9), so they need explicit consent: a required
// box at sign-up, and once for accounts created before it. The server keeps
// the time of the consent (User.healthConsentAt).

export const healthConsentText = {
  hu: "Kifejezetten hozzájárulok, hogy a Keto Mentor az általam megadott étkezési, allergia- és testsúlyadatokat – amelyek egészségügyi adatnak minősülhetnek – az app működtetéséhez kezelje. A hozzájárulást bármikor visszavonhatom az adatok vagy a fiókom törlésével.",
  de: "Ich willige ausdrücklich ein, dass Keto Mentor meine Angaben zu Ernährung, Allergien und Gewicht – die Gesundheitsdaten sein können – für den Betrieb der App verarbeitet. Ich kann die Einwilligung jederzeit widerrufen, indem ich die Angaben oder mein Konto lösche.",
  en: "I explicitly consent to Keto Mentor processing the diet, allergy and weight details I enter – which may be health data – to run the app. I can withdraw this consent at any time by deleting those details or my account."
} as const;

const copy = {
  hu: { title: "Hozzájárulás az egészségügyi adatokhoz", intro: "Az étkezési napló adatai egészségügyi adatnak minősülhetnek, ezért a további használathoz a kifejezett hozzájárulásodat kérjük.", agree: "Hozzájárulok", privacy: "Adatvédelmi tájékoztató és fióktörlés", logout: "Kijelentkezés", required: "A folytatáshoz jelöld be a négyzetet." },
  de: { title: "Einwilligung zu Gesundheitsdaten", intro: "Die Angaben im Ernährungstagebuch können Gesundheitsdaten sein, deshalb brauchen wir für die weitere Nutzung deine ausdrückliche Einwilligung.", agree: "Ich willige ein", privacy: "Datenschutzerklärung und Konto löschen", logout: "Abmelden", required: "Setze das Häkchen, um fortzufahren." },
  en: { title: "Consent to health data", intro: "The details in your food diary may be health data, so we need your explicit consent to keep using the app.", agree: "I consent", privacy: "Privacy notice and account deletion", logout: "Log out", required: "Tick the box to continue." }
} as const;

/** Required box for the sign-up form. */
export function HealthConsentCheckbox({ lang }: { lang: Lang }) {
  return (
    <label className="legal-confirm health-consent">
      <input type="checkbox" name="healthConsent" required data-testid="health-consent"/>
      <span>{healthConsentText[lang]}</span>
    </label>
  );
}

/** One-time question for accounts created before the box existed; blocks the app until answered. */
export function HealthConsentGate({ lang, state, onGiven, onLogout }: { lang: Lang; state: ApiState; onGiven: () => void; onLogout: () => void }) {
  const t = copy[lang];
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!checked) { setError(t.required); return; }
    setBusy(true);
    setError(null);
    try {
      await api("/me/health-consent", { method: "POST", body: JSON.stringify({ consent: true }) }, state);
      onGiven();
    } catch (err) {
      setError(authErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="modal-backdrop" role="presentation">
      <form className="card modal-panel" method="post" role="dialog" aria-modal="true" aria-labelledby="health-consent-title" onSubmit={submit}>
        <h2 id="health-consent-title" className="section-heading"><ShieldCheck size={20} aria-hidden="true"/>{t.title}</h2>
        <p>{t.intro}</p>
        <label className="legal-confirm health-consent">
          <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} data-testid="health-consent"/>
          <span>{healthConsentText[lang]}</span>
        </label>
        {error && <p className="status error" role="alert">{error}</p>}
        <button type="submit" className="btn primary w-full" disabled={busy} aria-busy={busy}>{t.agree}</button>
        <p className="text-xs text-muted"><a href="#adatvedelem">{t.privacy}</a> · <button type="button" className="btn ghost" onClick={onLogout}>{t.logout}</button></p>
      </form>
    </div>,
    document.body
  );
}
