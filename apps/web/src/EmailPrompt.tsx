import { useState } from "react";
import { Mail, X } from "lucide-react";
import { api, type ApiState } from "./api";
import { authErrorText } from "./auth-error";
import type { Lang } from "./i18n";

// Accounts created before the tester release (2026-10-15) have no e-mail,
// so they could never reset a forgotten password. This band asks for one,
// confirmed with the current password, until it is set; "Later" hides it
// for this browser session only.

const copy = {
  hu: { text: "Adj meg egy e-mail címet, hogy elfelejtett jelszó esetén vissza tudd állítani.", email: "E-mail cím", password: "Jelenlegi jelszó", save: "Mentés", later: "Később", saved: "Az e-mail cím elmentve." },
  de: { text: "Gib eine E-Mail-Adresse an, damit du ein vergessenes Passwort zurücksetzen kannst.", email: "E-Mail-Adresse", password: "Aktuelles Passwort", save: "Speichern", later: "Später", saved: "Die E-Mail-Adresse ist gespeichert." },
  en: { text: "Add an e-mail address so you can reset your password if you forget it.", email: "E-mail address", password: "Current password", save: "Save", later: "Later", saved: "Your e-mail address is saved." }
} as const;
const HIDE_KEY = "km_email_prompt_hidden";

export function EmailPrompt({ lang, state, onSaved }: { lang: Lang; state: ApiState; onSaved: (email: string) => void }) {
  const t = copy[lang];
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem(HIDE_KEY) === "1"; } catch { return false; } });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  if (hidden && !saved) return null;
  if (saved) return <div className="card email-prompt" role="status"><Mail size={18} aria-hidden="true"/><span>{t.saved}</span></div>;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ email: string }>("/me/email", { method: "PUT", body: JSON.stringify({ email: String(form.get("email")), currentPassword: String(form.get("currentPassword")) }) }, state);
      setSaved(true);
      onSaved(result.email);
    } catch (err) {
      setError(authErrorText(err, lang));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card email-prompt" method="post" onSubmit={submit} aria-label={t.text}>
      <p className="email-prompt-text"><Mail size={18} aria-hidden="true"/><span>{t.text}</span></p>
      <div className="email-prompt-fields">
        <label>{t.email}<input className="field" name="email" type="email" required autoComplete="email"/></label>
        <label>{t.password}<input className="field" name="currentPassword" type="password" required autoComplete="current-password"/></label>
        <button type="submit" className="btn primary" disabled={saving} aria-busy={saving}>{t.save}</button>
        <button type="button" className="btn ghost" onClick={() => { try { sessionStorage.setItem(HIDE_KEY, "1"); } catch { /* private mode */ } setHidden(true); }}><X size={15} aria-hidden="true"/>{t.later}</button>
      </div>
      {error && <p className="status error" role="alert">{error}</p>}
    </form>
  );
}

// An address that is set but not confirmed (admin release, 2026-10-15):
// confirming is what makes the admin role work, and it proves the address
// for password resets. One button re-sends the link.
const verifyCopy = {
  hu: { text: "Erősítsd meg az e-mail címedet ({email}) – a levélben kapott linkre kattintva.", send: "Megerősítő levél küldése", sent: "Elküldtük. Nézd meg a postafiókodat (a spam mappát is).", cooldown: "Az előző levél 2 percen belül ment ki, várj egy kicsit.", later: "Később" },
  de: { text: "Bestätige deine E-Mail-Adresse ({email}) über den Link in der E-Mail.", send: "Bestätigungs-E-Mail senden", sent: "Gesendet. Sieh in deinem Postfach nach (auch im Spam-Ordner).", cooldown: "Die letzte E-Mail ging vor weniger als 2 Minuten raus, bitte kurz warten.", later: "Später" },
  en: { text: "Confirm your e-mail address ({email}) with the link in the e-mail.", send: "Send confirmation e-mail", sent: "Sent. Check your inbox (and the spam folder).", cooldown: "The last e-mail went out less than 2 minutes ago, please wait a moment.", later: "Later" }
} as const;
const VERIFY_HIDE_KEY = "km_verify_prompt_hidden";

export function VerifyEmailBand({ lang, state, email }: { lang: Lang; state: ApiState; email: string }) {
  const t = verifyCopy[lang];
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem(VERIFY_HIDE_KEY) === "1"; } catch { return false; } });
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (hidden) return null;
  async function send() {
    setBusy(true);
    try {
      const r = await api<{ outcome: string }>("/me/email/verify-request", { method: "POST" }, state);
      setResult(r.outcome === "cooldown" ? t.cooldown : t.sent);
    } catch (err) {
      setResult(authErrorText(err, lang));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="card email-prompt" role="region" aria-label={t.send}>
      <p className="email-prompt-text"><Mail size={18} aria-hidden="true"/><span>{t.text.replace("{email}", email)}</span></p>
      {result ? <p className="status success" role="status">{result}</p> : (
        <div className="email-prompt-fields">
          <button type="button" className="btn primary" disabled={busy} aria-busy={busy} onClick={send}>{t.send}</button>
          <button type="button" className="btn ghost" onClick={() => { try { sessionStorage.setItem(VERIFY_HIDE_KEY, "1"); } catch { /* private mode */ } setHidden(true); }}><X size={15} aria-hidden="true"/>{t.later}</button>
        </div>
      )}
    </div>
  );
}
