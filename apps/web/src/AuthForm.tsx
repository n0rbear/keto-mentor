import { useEffect, useState } from "react";
import { currentCampaignRef } from "./campaign-ref";
import { api, ApiError, type ApiState } from "./api";
import { authErrorText } from "./auth-error";
import type { Lang } from "./i18n";

// "forgot" asks for the e-mail address; "reset" is opened by the link in the
// reset e-mail (#reset=<token>) and sets a new password (tester release,
// 2026-10-15).
type Mode = "login" | "register" | "forgot" | "reset";

const loadingText: Record<Lang, string> = {
  hu: "Kérlek, várj…",
  de: "Bitte warten…",
  en: "Please wait…"
};

const copy = {
  hu: { register: "Regisztráció", login: "Bejelentkezés", username: "Felhasználónév", loginName: "Felhasználónév vagy e-mail", email: "E-mail cím", password: "Jelszó", newPassword: "Új jelszó (legalább 10 karakter)", forgot: "Elfelejtett jelszó?", forgotTitle: "Új jelszó kérése", forgotIntro: "Add meg a fiókodhoz tartozó e-mail címet, és küldünk egy linket az új jelszóhoz.", send: "Link küldése", sent: "Ha ez az e-mail cím regisztrálva van, néhány percen belül megérkezik a link (nézd meg a spam mappát is). A link 1 óráig érvényes.", resetTitle: "Új jelszó beállítása", save: "Jelszó mentése", changed: "Az új jelszó elmentve. Most jelentkezz be vele.", back: "Vissza a bejelentkezéshez", privacy: "A regisztrációval elfogadod az", privacyLink: "Adatvédelmi tájékoztatót", emailHint: "Ezzel tudod visszaállítani a jelszavad, ha elfelejted." },
  de: { register: "Registrieren", login: "Anmelden", username: "Benutzername", loginName: "Benutzername oder E-Mail", email: "E-Mail-Adresse", password: "Passwort", newPassword: "Neues Passwort (mindestens 10 Zeichen)", forgot: "Passwort vergessen?", forgotTitle: "Neues Passwort anfordern", forgotIntro: "Gib die E-Mail-Adresse deines Kontos ein, wir schicken dir einen Link für ein neues Passwort.", send: "Link senden", sent: "Wenn diese E-Mail-Adresse registriert ist, kommt der Link in wenigen Minuten (sieh auch im Spam-Ordner nach). Er ist 1 Stunde gültig.", resetTitle: "Neues Passwort festlegen", save: "Passwort speichern", changed: "Das neue Passwort ist gespeichert. Melde dich jetzt damit an.", back: "Zurück zur Anmeldung", privacy: "Mit der Registrierung akzeptierst du die", privacyLink: "Datenschutzerklärung", emailHint: "Damit kannst du dein Passwort zurücksetzen, wenn du es vergisst." },
  en: { register: "Register", login: "Login", username: "Username", loginName: "Username or e-mail", email: "E-mail address", password: "Password", newPassword: "New password (at least 10 characters)", forgot: "Forgot your password?", forgotTitle: "Request a new password", forgotIntro: "Enter your account's e-mail address and we will send you a link to set a new password.", send: "Send link", sent: "If this e-mail address is registered, the link arrives within a few minutes (check your spam folder too). It is valid for 1 hour.", resetTitle: "Set a new password", save: "Save password", changed: "Your new password is saved. Sign in with it now.", back: "Back to login", privacy: "By registering you accept the", privacyLink: "privacy notice", emailHint: "You need it to reset your password if you forget it." }
} as const;

// The admin can pause registration (2026-10-15); existing users still sign in.
const rememberText: Record<Lang, string> = { hu: "Bejelentkezve maradok", de: "Angemeldet bleiben", en: "Keep me signed in" };
const closedText: Record<Lang, string> = {
  hu: "Az új regisztráció jelenleg szünetel. Ha már van fiókod, jelentkezz be.",
  de: "Neue Registrierungen sind derzeit pausiert. Wenn du schon ein Konto hast, melde dich an.",
  en: "New registrations are paused right now. If you already have an account, sign in."
};

export function resetTokenFromHash(hash: string): string | null {
  const match = /^#reset=([A-Za-z0-9_-]{20,200})$/.exec(hash);
  return match ? match[1] : null;
}

export function AuthForm({ mode: initialMode, lang, state, onSuccess, registrationOpen = true }: { mode: "login" | "register"; lang: Lang; state: ApiState; onSuccess: (user: { id: string; username: string; locale: Lang }) => void; registrationOpen?: boolean }) {
  const [resetToken, setResetToken] = useState<string | null>(() => resetTokenFromHash(window.location.hash));
  const [mode, setMode] = useState<Mode>(() => resetTokenFromHash(window.location.hash) ? "reset" : initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const t = copy[lang];
  useEffect(() => { if (!registrationOpen && mode === "register") setMode("login"); }, [registrationOpen, mode]);
  const passwordMinLength = mode === "register" || mode === "reset" ? 10 : 1;

  useEffect(() => {
    const onHash = () => { const token = resetTokenFromHash(window.location.hash); if (token) { setResetToken(token); setMode("reset"); setNotice(null); setError(null); } };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function switchMode(next: Mode) { setMode(next); setError(null); setNotice(null); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "forgot") {
        await api("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email: String(form.get("email")), locale: lang }) });
        setNotice(t.sent);
      } else if (mode === "reset") {
        await api("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token: resetToken, password: String(form.get("password")) }) });
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        setResetToken(null);
        setMode("login");
        setNotice(t.changed);
      } else {
        const body = mode === "register"
          ? { username: String(form.get("username")), email: String(form.get("email")), password: String(form.get("password")), locale: lang, ref: currentCampaignRef() }
          : { username: String(form.get("username")), password: String(form.get("password")), locale: lang, remember: form.get("remember") === "on" };
        // Where the web keeps the access token: across restarts, or only for this browser session.
        try { localStorage.setItem("km_remember", mode === "login" && form.get("remember") !== "on" ? "0" : "1"); } catch { /* storage unavailable */ }
        const result = await api<{ user: { id: string; username: string; locale: Lang }; accessToken: string }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
        state.setToken(result.accessToken);
        onSuccess(result.user);
      }
    } catch (err) {
      setError(authErrorText(err, lang));
      if (err instanceof ApiError && err.status === 401) state.setToken(null);
    } finally {
      setSubmitting(false);
    }
  }

  // Enter in a field moves on to the next empty field, and signs in once all
  // are filled (owner request 2026-10-16: "Enterrel is lépjen be"), instead
  // of the browser's "please fill out this field" bubble on the empty one.
  function enterToNext(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const form = event.currentTarget.form;
    if (!form) return;
    const fields = Array.from(form.querySelectorAll<HTMLInputElement>("input.field"));
    const empty = fields.find((field) => field.required && !field.value);
    if (empty && empty !== event.currentTarget) { event.preventDefault(); empty.focus(); return; }
    if (!empty) { event.preventDefault(); form.requestSubmit(); }
  }

  const submitLabel = mode === "register" ? t.register : mode === "login" ? t.login : mode === "forgot" ? t.send : t.save;

  // method="post" is a defense-in-depth fallback: if this form is ever
  // submitted before React attaches the onSubmit handler (a hydration
  // race), the browser's native submission uses POST instead of the GET
  // default, so credentials never end up in the URL/history.
  return (
    <form key={mode} onSubmit={submit} method="post" className="card auth-panel space-y-4">
      <div className="auth-intro">
        <p className="panel-kicker">Keto Mentor by NorbApp</p>
        {mode === "forgot" || mode === "reset" ? (
          <>
            <h2>{mode === "forgot" ? t.forgotTitle : t.resetTitle}</h2>
            {mode === "forgot" && <p className="panel-copy">{t.forgotIntro}</p>}
          </>
        ) : (
          <>
            <h2>{lang === "hu" ? "Kezdjük egyszerűen" : lang === "de" ? "Einfach starten" : "Start with clarity"}</h2>
            <p className="panel-copy">{lang === "hu" ? "Jelentkezz be, vagy hozz létre egy biztonságos fiókot." : lang === "de" ? "Anmelden oder ein sicheres Konto erstellen." : "Sign in or create a secure account."}</p>
          </>
        )}
      </div>
      {!registrationOpen && mode === "login" && <p className="status" role="status">{closedText[lang]}</p>}
      {registrationOpen && (mode === "login" || mode === "register") && (
        <div className="auth-mode-switch">
          <button type="button" data-testid="auth-mode-register" className={`seg ${mode === "register" ? "active" : ""}`} disabled={submitting} onClick={() => switchMode("register")}>{t.register}</button>
          <button type="button" data-testid="auth-mode-login" className={`seg ${mode === "login" ? "active" : ""}`} disabled={submitting} onClick={() => switchMode("login")}>{t.login}</button>
        </div>
      )}
      {(mode === "login" || mode === "register") && (
        <label htmlFor="auth-username">{mode === "login" ? t.loginName : t.username}<input id="auth-username" className="field" name="username" required minLength={3} autoComplete="username" enterKeyHint="next" onKeyDown={enterToNext} /></label>
      )}
      {(mode === "register" || mode === "forgot") && (
        <>
          <label htmlFor="auth-email">{t.email}<input id="auth-email" className="field" name="email" type="email" required autoComplete="email" aria-describedby={mode === "register" ? "auth-email-hint" : undefined} enterKeyHint={mode === "forgot" ? "send" : "next"} onKeyDown={enterToNext} /></label>
          {mode === "register" && <p id="auth-email-hint" className="text-xs text-muted">{t.emailHint}</p>}
        </>
      )}
      {mode !== "forgot" && (
        <label htmlFor="auth-password">{mode === "reset" ? t.newPassword : t.password}<input id="auth-password" className="field" name="password" required minLength={passwordMinLength} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} enterKeyHint="go" onKeyDown={enterToNext} /></label>
      )}
      {mode === "login" && (
        <label className="legal-confirm remember-me"><input type="checkbox" name="remember" defaultChecked/>{rememberText[lang]}</label>
      )}
      {notice && <div className="status success" role="status">{notice}</div>}
      {error && <div className="status error" role="alert">{error}</div>}
      {!(mode === "forgot" && notice) && (
        <button data-testid="auth-submit" className="btn primary w-full" type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? loadingText[lang] : submitLabel}</button>
      )}
      {mode === "register" && <p className="text-xs text-muted">{t.privacy} <a href="#adatvedelem">{t.privacyLink}</a>.</p>}
      {mode === "login" && <button type="button" className="btn ghost w-full" onClick={() => switchMode("forgot")}>{t.forgot}</button>}
      {(mode === "forgot" || mode === "reset") && <button type="button" className="btn ghost w-full" onClick={() => { window.history.replaceState(null, "", window.location.pathname + window.location.search); switchMode("login"); }}>{t.back}</button>}
    </form>
  );
}
