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
