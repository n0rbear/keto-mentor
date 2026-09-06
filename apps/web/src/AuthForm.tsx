import { useState } from "react";
import { api, ApiError, type ApiState } from "./api";
import { authErrorText } from "./auth-error";
import type { Lang } from "./i18n";

type Mode = "login" | "register";

const loadingText: Record<Lang, string> = {
  hu: "Kérlek, várj…",
  de: "Bitte warten…",
  en: "Please wait…"
};

export function AuthForm({ mode: initialMode, lang, state, onSuccess }: { mode: Mode; lang: Lang; state: ApiState; onSuccess: (user: { id: string; username: string; locale: Lang }) => void }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = { register: lang === "hu" ? "Regisztráció" : lang === "de" ? "Registrieren" : "Register", login: lang === "hu" ? "Bejelentkezés" : lang === "de" ? "Anmelden" : "Login", username: lang === "hu" ? "Felhasználónév" : lang === "de" ? "Benutzername" : "Username", password: lang === "hu" ? "Jelszó" : lang === "de" ? "Passwort" : "Password" };
  const passwordMinLength = mode === "register" ? 10 : 1;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body = { username: String(form.get("username")), password: String(form.get("password")), locale: lang };
    try {
      const result = await api<{ user: { id: string; username: string; locale: Lang }; accessToken: string }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
      state.setToken(result.accessToken);
      onSuccess(result.user);
    } catch (err) {
      setError(authErrorText(err, lang));
      if (err instanceof ApiError && err.status === 401) state.setToken(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (

    <form onSubmit={submit} className="card auth-panel space-y-4">
      <div className="auth-intro">
        <p className="panel-kicker">NorbApp · Keto Mentor</p>
        <h2>{lang === "hu" ? "Kezdjük egyszerűen" : lang === "de" ? "Einfach starten" : "Start with clarity"}</h2>
        <p className="panel-copy">{lang === "hu" ? "Jelentkezz be, vagy hozz létre egy biztonságos fiókot." : lang === "de" ? "Anmelden oder ein sicheres Konto erstellen." : "Sign in or create a secure account."}</p>
      </div>
      <div className="auth-mode-switch">
        <button type="button" data-testid="auth-mode-register" className={`seg ${mode === "register" ? "active" : ""}`} disabled={submitting} onClick={() => { setMode("register"); setError(null); }}>{t.register}</button>
        <button type="button" data-testid="auth-mode-login" className={`seg ${mode === "login" ? "active" : ""}`} disabled={submitting} onClick={() => { setMode("login"); setError(null); }}>{t.login}</button>
      </div>
      <label htmlFor="auth-username">{t.username}<input id="auth-username" className="field" name="username" required minLength={3} /></label>
      <label htmlFor="auth-password">{t.password}<input id="auth-password" className="field" name="password" required minLength={passwordMinLength} type="password" /></label>
      {error && <div className="status error" role="alert">{error}</div>}
      <button data-testid="auth-submit" className="btn primary w-full" type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? loadingText[lang] : mode === "register" ? t.register : t.login}</button>
    </form>
  );
}
