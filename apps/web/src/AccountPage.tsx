import { useState } from "react";
import { ArrowLeft, Bell, KeyRound, LogOut, Mail, SlidersHorizontal, Target, UserRound, UtensilsCrossed } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";
import { AccountDeletion } from "./LegalPages";
import { PalettePicker } from "./PalettePicker";

// Fiókom (owner request 2026-10-16): one place where users manage their own
// account: e-mail, password, profile and targets, language and colour theme,
// shortcuts to plates, reminders and flexible goals, sign-out and deletion.

type Profile = { goal?: string | null; dailyKcal: number; dailyNetCarbs: number; dailyProtein: number; dailyFat: number; dailyFiber: number; preferences?: string[]; avoidedFoods?: string[]; allergies?: string[] };
type AccountUser = { username: string; email?: string | null; emailVerified?: boolean; profile?: Profile | null };
export type AccountShortcut = "plates" | "reminders" | "goals";

const GOALS = ["weight_loss", "maintenance", "energy", "medical_support", "learning"] as const;
const copy = {
  hu: {
    title: "Fiókom", back: "Vissza az apphoz", account: "Fiók", username: "Felhasználónév", email: "E-mail cím", verified: "megerősítve", unverified: "még nincs megerősítve", resend: "Megerősítő levél küldése", resent: "Elküldtük a megerősítő levelet.",
    newEmail: "Új e-mail cím", currentPassword: "Jelenlegi jelszó", saveEmail: "E-mail cím mentése", emailSaved: "Mentve. Küldtünk egy megerősítő levelet az új címre.",
    password: "Jelszó módosítása", newPassword: "Új jelszó (legalább 10 karakter)", savePassword: "Jelszó mentése", passwordSaved: "A jelszavad megváltozott.",
    profile: "Profil és napi célok", goal: "Célom", goals: { weight_loss: "Fogyás", maintenance: "Súlytartás", energy: "Több energia", medical_support: "Orvosi támogatás mellett", learning: "Ismerkedés a ketóval" },
    kcal: "Kalória (kcal)", netCarbs: "Nettó szénhidrát (g)", protein: "Fehérje (g)", fat: "Zsír (g)", fiber: "Rost (g)", preferences: "Kedvelt ételek (vesszővel)", avoided: "Kerülendő ételek (vesszővel)", allergies: "Allergiák (vesszővel)", saveProfile: "Profil mentése", profileSaved: "A profilod mentve.",
    appearance: "Nyelv és megjelenés", language: "Nyelv", more: "További beállítások", plates: "Saját tányérok", reminders: "Emlékeztetők", flexGoals: "Rugalmas célok",
    logout: "Kijelentkezés", errors: { invalid_credentials: "A jelenlegi jelszó nem jó.", email_taken: "Ez az e-mail cím már foglalt.", validation_error: "Ellenőrizd a megadott értékeket.", default: "Most nem sikerült, próbáld újra." }
  },
  de: {
    title: "Mein Konto", back: "Zurück zur App", account: "Konto", username: "Benutzername", email: "E-Mail-Adresse", verified: "bestätigt", unverified: "noch nicht bestätigt", resend: "Bestätigungs-E-Mail senden", resent: "Bestätigungs-E-Mail gesendet.",
    newEmail: "Neue E-Mail-Adresse", currentPassword: "Aktuelles Passwort", saveEmail: "E-Mail speichern", emailSaved: "Gespeichert. Wir haben eine Bestätigung an die neue Adresse geschickt.",
    password: "Passwort ändern", newPassword: "Neues Passwort (mind. 10 Zeichen)", savePassword: "Passwort speichern", passwordSaved: "Dein Passwort wurde geändert.",
    profile: "Profil und Tagesziele", goal: "Mein Ziel", goals: { weight_loss: "Abnehmen", maintenance: "Gewicht halten", energy: "Mehr Energie", medical_support: "Mit ärztlicher Begleitung", learning: "Keto kennenlernen" },
    kcal: "Kalorien (kcal)", netCarbs: "Netto-Kohlenhydrate (g)", protein: "Eiweiß (g)", fat: "Fett (g)", fiber: "Ballaststoffe (g)", preferences: "Lieblingslebensmittel (mit Komma)", avoided: "Gemiedene Lebensmittel (mit Komma)", allergies: "Allergien (mit Komma)", saveProfile: "Profil speichern", profileSaved: "Dein Profil wurde gespeichert.",
    appearance: "Sprache und Darstellung", language: "Sprache", more: "Weitere Einstellungen", plates: "Meine Teller", reminders: "Erinnerungen", flexGoals: "Flexible Ziele",
    logout: "Abmelden", errors: { invalid_credentials: "Das aktuelle Passwort stimmt nicht.", email_taken: "Diese E-Mail-Adresse ist bereits vergeben.", validation_error: "Bitte die Werte prüfen.", default: "Hat gerade nicht geklappt, bitte erneut versuchen." }
  },
  en: {
    title: "My account", back: "Back to the app", account: "Account", username: "Username", email: "E-mail address", verified: "confirmed", unverified: "not confirmed yet", resend: "Send confirmation e-mail", resent: "Confirmation e-mail sent.",
    newEmail: "New e-mail address", currentPassword: "Current password", saveEmail: "Save e-mail", emailSaved: "Saved. We sent a confirmation to the new address.",
    password: "Change password", newPassword: "New password (at least 10 characters)", savePassword: "Save password", passwordSaved: "Your password was changed.",
    profile: "Profile and daily targets", goal: "My goal", goals: { weight_loss: "Weight loss", maintenance: "Maintenance", energy: "More energy", medical_support: "With medical support", learning: "Learning keto" },
    kcal: "Calories (kcal)", netCarbs: "Net carbs (g)", protein: "Protein (g)", fat: "Fat (g)", fiber: "Fiber (g)", preferences: "Favourite foods (comma separated)", avoided: "Foods to avoid (comma separated)", allergies: "Allergies (comma separated)", saveProfile: "Save profile", profileSaved: "Your profile was saved.",
    appearance: "Language and appearance", language: "Language", more: "More settings", plates: "My plates", reminders: "Reminders", flexGoals: "Flexible goals",
    logout: "Sign out", errors: { invalid_credentials: "The current password is wrong.", email_taken: "This e-mail address is already taken.", validation_error: "Please check the values.", default: "That did not work, please try again." }
  }
} as const;

type Status = { ok: boolean; text: string } | null;
const list = (value: string) => value.split(",").map((x) => x.trim()).filter(Boolean);

export function AccountPage({ lang, state, user, onClose, onUserChange, onLangChange, onShortcut, onLogout, onDeleted }: {
  lang: Lang; state: ApiState; user: AccountUser; onClose: () => void;
  onUserChange: (patch: Partial<AccountUser>) => void; onLangChange: (lang: Lang) => void;
  onShortcut: (target: AccountShortcut) => void; onLogout: () => void; onDeleted: () => void;
}) {
  const t = copy[lang];
  const err = (e: unknown) => (e instanceof ApiError && (t.errors as Record<string, string>)[e.code]) || t.errors.default;
  const p = user.profile;
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "" });
  const [profile, setProfile] = useState({
    goal: p?.goal ?? "weight_loss", dailyKcal: String(p?.dailyKcal ?? 1800), dailyNetCarbs: String(p?.dailyNetCarbs ?? 25), dailyProtein: String(p?.dailyProtein ?? 110),
    dailyFat: String(p?.dailyFat ?? 130), dailyFiber: String(p?.dailyFiber ?? 25), preferences: (p?.preferences ?? []).join(", "), avoidedFoods: (p?.avoidedFoods ?? []).join(", "), allergies: (p?.allergies ?? []).join(", ")
  });
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const show = (key: string, s: Status) => setStatus((cur) => ({ ...cur, [key]: s }));

  async function run(key: string, call: () => Promise<string>) {
    setBusy(key); show(key, null);
    try { show(key, { ok: true, text: await call() }); } catch (e) { show(key, { ok: false, text: err(e) }); } finally { setBusy(null); }
  }
  const saveEmail = (e: React.FormEvent) => { e.preventDefault(); void run("email", async () => {
    const r = await api<{ email: string }>("/me/email", { method: "PUT", body: JSON.stringify({ email: emailForm.email, currentPassword: emailForm.password }) }, state);
    onUserChange({ email: r.email, emailVerified: false }); setEmailForm({ email: "", password: "" }); return t.emailSaved;
  }); };
  const resend = () => void run("verify", async () => { await api("/me/email/verify-request", { method: "POST" }, state); return t.resent; });
  const savePassword = (e: React.FormEvent) => { e.preventDefault(); void run("password", async () => {
    await api("/me/password", { method: "PUT", body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }) }, state);
    setPwForm({ current: "", next: "" }); return t.passwordSaved;
  }); };
  const saveProfile = (e: React.FormEvent) => { e.preventDefault(); void run("profile", async () => {
    const body = { locale: lang, goal: profile.goal, dailyKcal: Number(profile.dailyKcal), dailyNetCarbs: Number(profile.dailyNetCarbs), dailyProtein: Number(profile.dailyProtein), dailyFat: Number(profile.dailyFat), dailyFiber: Number(profile.dailyFiber), preferences: list(profile.preferences), avoidedFoods: list(profile.avoidedFoods), allergies: list(profile.allergies) };
    const r = await api<{ profile?: Profile }>("/me/onboarding", { method: "PUT", body: JSON.stringify(body) }, state);
    onUserChange({ profile: { ...(p ?? {}), ...(r?.profile ?? body) } as Profile }); return t.profileSaved;
  }); };
  const msg = (key: string) => status[key] && <p className={`status ${status[key]!.ok ? "success" : "error"}`} role={status[key]!.ok ? "status" : "alert"}>{status[key]!.text}</p>;
  const num = (key: "dailyKcal" | "dailyNetCarbs" | "dailyProtein" | "dailyFat" | "dailyFiber", label: string) => (
    <label>{label}<input className="field" inputMode="numeric" value={profile[key]} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}/></label>
  );

  return (
    <article className="card legal-page account-page" aria-labelledby="account-title">
      <button type="button" className="btn ghost" onClick={onClose}><ArrowLeft size={16} aria-hidden="true"/>{t.back}</button>
      <h2 id="account-title"><UserRound size={22} aria-hidden="true"/> {t.title}</h2>

      <section className="account-section">
        <h3><Mail size={17} aria-hidden="true"/>{t.account}</h3>
        <p>{t.username}: <strong>{user.username}</strong></p>
        <p>{t.email}: <strong>{user.email ?? "–"}</strong>{user.email && <span className="text-xs text-muted"> · {user.emailVerified === false ? t.unverified : t.verified}</span>}</p>
        {user.email && user.emailVerified === false && <button type="button" className="btn secondary" onClick={resend} disabled={busy !== null}>{t.resend}</button>}
        {msg("verify")}
        <form className="account-form" onSubmit={saveEmail}>
          <label>{t.newEmail}<input className="field" type="email" autoComplete="email" required value={emailForm.email} onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}/></label>
          <label>{t.currentPassword}<input className="field" type="password" autoComplete="current-password" required value={emailForm.password} onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}/></label>
          <button className="btn secondary" disabled={busy !== null}>{t.saveEmail}</button>
        </form>
        {msg("email")}
      </section>

      <section className="account-section">
        <h3><KeyRound size={17} aria-hidden="true"/>{t.password}</h3>
        <form className="account-form" onSubmit={savePassword}>
          <label>{t.currentPassword}<input className="field" type="password" autoComplete="current-password" required value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}/></label>
          <label>{t.newPassword}<input className="field" type="password" autoComplete="new-password" minLength={10} required value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}/></label>
          <button className="btn secondary" disabled={busy !== null}>{t.savePassword}</button>
        </form>
        {msg("password")}
      </section>

      <section className="account-section">
        <h3><Target size={17} aria-hidden="true"/>{t.profile}</h3>
        <form className="account-form" onSubmit={saveProfile}>
          <label>{t.goal}<select className="field" value={profile.goal} onChange={(e) => setProfile({ ...profile, goal: e.target.value })}>{GOALS.map((g) => <option key={g} value={g}>{t.goals[g]}</option>)}</select></label>
          <div className="account-grid">{num("dailyKcal", t.kcal)}{num("dailyNetCarbs", t.netCarbs)}{num("dailyProtein", t.protein)}{num("dailyFat", t.fat)}{num("dailyFiber", t.fiber)}</div>
          <label>{t.preferences}<input className="field" value={profile.preferences} onChange={(e) => setProfile({ ...profile, preferences: e.target.value })}/></label>
          <label>{t.avoided}<input className="field" value={profile.avoidedFoods} onChange={(e) => setProfile({ ...profile, avoidedFoods: e.target.value })}/></label>
          <label>{t.allergies}<input className="field" value={profile.allergies} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}/></label>
          <button className="btn primary" disabled={busy !== null}>{t.saveProfile}</button>
        </form>
        {msg("profile")}
      </section>

      <section className="account-section">
        <h3><SlidersHorizontal size={17} aria-hidden="true"/>{t.appearance}</h3>
        <label className="palette-picker">{t.language}
          <select className="field compact" value={lang} onChange={(e) => onLangChange(e.target.value as Lang)}><option value="hu">Magyar</option><option value="de">Deutsch</option><option value="en">English</option></select>
        </label>
        <PalettePicker lang={lang} id="palette-picker-account"/>
      </section>

      <section className="account-section">
        <h3>{t.more}</h3>
        <div className="planner-actions">
          <button type="button" className="btn ghost" onClick={() => onShortcut("plates")}><UtensilsCrossed size={16} aria-hidden="true"/>{t.plates}</button>
          <button type="button" className="btn ghost" onClick={() => onShortcut("reminders")}><Bell size={16} aria-hidden="true"/>{t.reminders}</button>
          <button type="button" className="btn ghost" onClick={() => onShortcut("goals")}><SlidersHorizontal size={16} aria-hidden="true"/>{t.flexGoals}</button>
        </div>
        <button type="button" className="btn secondary" onClick={onLogout}><LogOut size={16} aria-hidden="true"/>{t.logout}</button>
      </section>

      <AccountDeletion lang={lang} state={state} onDeleted={onDeleted}/>
    </article>
  );
}
