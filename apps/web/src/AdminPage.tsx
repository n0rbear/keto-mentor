import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";

// Owner admin screen (2026-10-15), Hungarian only: the owner is its only
// user. Shown at #admin for an account the API reports as isAdmin; every
// call is checked again on the server.

type Overview = {
  generatedAt: string; days: number;
  users: { total: number; new7: number; new30: number; withEmail: number; verified: number; active1: number; active7: number; active30: number };
  meals: { total: number; last24h: number; last7d: number };
  recipes: { total: number; public: number };
  feedback: { open: number; total: number; ideasOpen?: number; ideasTotal?: number };
  reminders?: { today: number; cap: number };
  keto?: { loggedDays: number; adherentDays: number; percent: number | null; users: number; usersMostlyAdherent: number; perUser: Array<{ userId: string; username: string; days: number; adherentDays: number; percent: number; avgNetCarbs: number; goal: number }> };
  usageTotals: Record<string, { count: number; avgMs: number | null; promptTokens: number; completionTokens: number }>;
  perDay: Record<string, Record<string, number>>;
};
type Ticket = { id: string; kind?: string; message: string; status: string; adminNote: string | null; view: string | null; lang: string | null; build: string | null; lastInput: string | null; createdAt: string; user: { username: string; email: string | null } | null };
type AdminUser = { id: string; username: string; email: string | null; emailVerified: boolean; locale: string; createdAt: string; meals: number; recipes: number; lastMealAt: string | null; isAdmin: boolean };
type Settings = { registrationOpen: boolean; announcement: { enabled: boolean; hu: string; de: string; en: string }; aiLimits: { perHour: number; perDay: number; perRecipe: number; premiumPerHour?: number; premiumPerDay?: number }; premiumAccess?: "beta_all" | "premium_only"; reminderDailyCap?: number };
type Tab = "overview" | "feedback" | "users" | "settings";

const KIND_LABELS: Record<string, string> = {
  search: "Gépelés közbeni keresés", food_search: "Alapanyag-keresés (recept)", interpret: "Értelmezés (Enter)", voice: "Hangbevitel",
  external_lookup: "Külső adatbázis-keresés", recipe_import: "Recept-import", meal_saved: "Mentett étkezés", register: "Regisztráció",
  login: "Belépés", feedback: "Hibajelentés", reset_request: "Jelszó-visszaállítás kérése", dinner_suggestions: "Vacsoraajánló", http_5xx: "Szerverhiba (5xx)"
};
const kindLabel = (kind: string) => KIND_LABELS[kind] ?? (kind.startsWith("ai:") ? `AI: ${kind.slice(3)}` : kind.startsWith("ai_error:") ? `AI-hiba: ${kind.slice(9)}` : kind.endsWith(":error") ? `${KIND_LABELS[kind.slice(0, -6)] ?? kind.slice(0, -6)} – hiba` : kind);
const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "–";
const errorText = (error: unknown) => error instanceof ApiError ? (error.status === 403 ? "Nincs admin jogosultság." : `Hiba: ${error.code}`) : "A kérés nem sikerült.";

function OverviewTab({ state }: { state: ApiState }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => { setError(null); api<Overview>("/admin/overview?days=30", {}, state).then(setData).catch((e) => setError(errorText(e))); };
  useEffect(load, []);
  if (error) return <p className="status error" role="alert">{error}</p>;
  if (!data) return <p role="status">Betöltés…</p>;
  const kinds = Object.entries(data.usageTotals).sort((a, b) => b[1].count - a[1].count);
  const tokens = kinds.filter(([k]) => k.startsWith("ai:")).reduce((sum, [, v]) => ({ p: sum.p + v.promptTokens, c: sum.c + v.completionTokens }), { p: 0, c: 0 });
  const days = Object.keys(data.perDay).sort().reverse();
  const dayCols = ["register_db", "meals_db", "search", "interpret", "recipe_import", "voice", "feedback"];
  return (
    <div className="admin-stack">
      <div className="admin-actions"><span className="text-xs text-muted">Frissítve: {fmtDate(data.generatedAt)}</span><button type="button" className="btn ghost" onClick={load}><RefreshCw size={15} aria-hidden="true"/>Frissítés</button></div>
      <div className="admin-kpis">
        <Kpi label="Felhasználók" value={data.users.total} sub={`+${data.users.new7} (7 nap) · +${data.users.new30} (30 nap)`}/>
        <Kpi label="Aktív (étkezést rögzített)" value={data.users.active7} sub={`24 óra: ${data.users.active1} · 30 nap: ${data.users.active30}`}/>
        <Kpi label="Étkezések" value={data.meals.total} sub={`24 óra: ${data.meals.last24h} · 7 nap: ${data.meals.last7d}`}/>
        <Kpi label="Receptek" value={data.recipes.total} sub={`ebből nyilvános: ${data.recipes.public}`}/>
        <Kpi label="Nyitott hibajegy" value={data.feedback.open} sub={`összesen: ${data.feedback.total}`}/>
        <Kpi label="Nyitott ötlet" value={data.feedback.ideasOpen ?? 0} sub={`összesen: ${data.feedback.ideasTotal ?? 0}`}/>
        <Kpi label="E-mail cím" value={data.users.withEmail} sub={`megerősítve: ${data.users.verified}`}/>
        {data.reminders && <Kpi label="Emlékeztető e-mail ma" value={data.reminders.today} sub={`napi plafon: ${data.reminders.cap}${data.reminders.today >= data.reminders.cap ? " – betelt" : ""}`}/>}
      </div>
      {data.keto && (
        <section>
          <h3>Keto-tartás (elmúlt 30 nap)</h3>
          <p className="text-xs text-muted">A naplózott napok közül hányon maradt a felhasználó a saját napi nettó szénhidrát-célja alatt (vagy pontosan azon). Részlegesen naplózott nap is számít; a nap UTC szerint értendő.</p>
          <div className="admin-kpis">
            <Kpi label="Célon belüli napok" value={data.keto.percent ?? 0} sub={data.keto.percent == null ? "még nincs naplózott nap" : `% · ${data.keto.adherentDays} / ${data.keto.loggedDays} nap`}/>
            <Kpi label="Többnyire tartja (≥ 80%)" value={data.keto.usersMostlyAdherent} sub={`${data.keto.users} naplózó felhasználóból`}/>
          </div>
          {data.keto.perUser.length > 0 && (
            <div className="admin-table-wrap"><table className="admin-table">
              <thead><tr><th>Felhasználó</th><th>Naplózott nap</th><th>Célon belül</th><th>Átl. nettó szh.</th><th>Cél</th></tr></thead>
              <tbody>{data.keto.perUser.map((u) => <tr key={u.userId}><td>{u.username}</td><td>{u.days}</td><td>{u.percent}% ({u.adherentDays})</td><td>{u.avgNetCarbs} g</td><td>{u.goal} g</td></tr>)}</tbody>
            </table></div>
          )}
        </section>
      )}
      <section>
        <h3>Használat az elmúlt {data.days} napban</h3>
        <p className="text-xs text-muted">Névtelen, összesített számlálók (2026-10-15 óta gyűlnek). AI-tokenek összesen: {tokens.p.toLocaleString("hu-HU")} bemenet · {tokens.c.toLocaleString("hu-HU")} kimenet.</p>
        {kinds.length === 0 ? <p>Még nincs adat.</p> : (
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>Művelet</th><th>Darab</th><th>Átl. idő</th><th>Tokenek (be/ki)</th></tr></thead>
            <tbody>{kinds.map(([kind, v]) => <tr key={kind}><td>{kindLabel(kind)}</td><td>{v.count}</td><td>{v.avgMs != null ? `${(v.avgMs / 1000).toFixed(1)} s` : "–"}</td><td>{v.promptTokens || v.completionTokens ? `${v.promptTokens} / ${v.completionTokens}` : "–"}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
      <section>
        <h3>Napi bontás</h3>
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>Nap</th><th>Regisztráció</th><th>Étkezés</th><th>Keresés</th><th>Értelmezés</th><th>Recept-import</th><th>Hang</th><th>Hibajegy</th></tr></thead>
          <tbody>{days.map((day) => <tr key={day}><td>{day}</td>{dayCols.map((c) => <td key={c}>{data.perDay[day][c] ?? 0}</td>)}</tr>)}</tbody>
        </table></div>
      </section>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: number; sub: string }) {
  return <div className="admin-kpi"><span className="text-xs text-muted">{label}</span><strong>{value}</strong><span className="text-xs text-muted">{sub}</span></div>;
}

function FeedbackTab({ state }: { state: ApiState }) {
  const [status, setStatus] = useState<"open" | "done" | "all">("open");
  const [kind, setKind] = useState<"all" | "bug" | "idea">("all");
  const [items, setItems] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = () => { setError(null); api<{ items: Ticket[] }>(`/admin/feedback?status=${status}${kind === "all" ? "" : `&kind=${kind}`}`, {}, state).then((r) => setItems(r.items)).catch((e) => setError(errorText(e))); };
  useEffect(load, [status, kind]);
  async function update(id: string, patch: { status?: string; adminNote?: string }) {
    try { await api(`/admin/feedback/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, state); load(); } catch (e) { setError(errorText(e)); }
  }
  return (
    <div className="admin-stack">
      <div className="auth-mode-switch">
        {(["open", "done", "all"] as const).map((s) => <button key={s} type="button" className={`seg ${status === s ? "active" : ""}`} onClick={() => setStatus(s)}>{s === "open" ? "Nyitott" : s === "done" ? "Kész" : "Mind"}</button>)}
      </div>
      <div className="auth-mode-switch" aria-label="Típus">
        {(["all", "bug", "idea"] as const).map((k) => <button key={k} type="button" className={`seg ${kind === k ? "active" : ""}`} onClick={() => setKind(k)}>{k === "all" ? "Hibák és ötletek" : k === "bug" ? "Hibák" : "Ötletek"}</button>)}
      </div>
      {error && <p className="status error" role="alert">{error}</p>}
      {!items ? <p role="status">Betöltés…</p> : items.length === 0 ? <p>Nincs ilyen hibajegy.</p> : items.map((t) => (
        <article key={t.id} className="admin-ticket">
          <header><strong>#{t.id}</strong><span className={`admin-badge ${t.kind === "idea" ? "is-idea" : ""}`}>{t.kind === "idea" ? "ötlet" : "hiba"}</span><span className="text-xs text-muted">{fmtDate(t.createdAt)} · {t.user ? `${t.user.username}${t.user.email ? ` (${t.user.email})` : ""}` : "törölt fiók"} · {t.view ?? "?"} · {t.lang ?? "?"}</span></header>
          <p>{t.message}</p>
          {t.lastInput && <p className="text-xs text-muted">Utolsó bevitel: „{t.lastInput}”</p>}
          {t.build && <p className="text-xs text-muted">Verzió: {t.build}</p>}
          <label className="text-xs">Jegyzet<textarea className="field" rows={2} defaultValue={t.adminNote ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [t.id]: e.target.value }))}/></label>
          <div className="admin-actions">
            {notes[t.id] !== undefined && <button type="button" className="btn ghost" onClick={() => update(t.id, { adminNote: notes[t.id] })}>Jegyzet mentése</button>}
            <button type="button" className="btn primary" onClick={() => update(t.id, { status: t.status === "open" ? "done" : "open", ...(notes[t.id] !== undefined ? { adminNote: notes[t.id] } : {}) })}>{t.status === "open" ? "Késznek jelölöm" : "Újranyitom"}</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function UsersTab({ state }: { state: ApiState }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const load = (query = q) => { setError(null); api<{ users: AdminUser[] }>(`/admin/users?q=${encodeURIComponent(query)}`, {}, state).then((r) => setUsers(r.users)).catch((e) => setError(errorText(e))); };
  useEffect(() => load(""), []);
  async function sendReset(u: AdminUser) {
    try { const r = await api<{ outcome: string }>(`/admin/users/${u.id}/password-reset`, { method: "POST" }, state); setNotice(r.outcome === "sent" ? `Visszaállító link elküldve: ${u.email}` : r.outcome === "cooldown" ? "Az előző link 2 percen belül ment ki, várj egy kicsit." : `Eredmény: ${r.outcome}`); } catch (e) { setError(errorText(e)); }
  }
  async function remove(u: AdminUser) {
    if (!window.confirm(`Biztosan véglegesen törlöd ${u.username} fiókját? Ez nem vonható vissza.`)) return;
    try { await api(`/admin/users/${u.id}`, { method: "DELETE" }, state); setNotice(`${u.username} fiókja törölve.`); load(); } catch (e) { setError(errorText(e)); }
  }
  return (
    <div className="admin-stack">
      <TopTesters state={state}/>
      <form className="admin-actions" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input className="field" placeholder="Felhasználónév vagy e-mail" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Felhasználó keresése"/>
        <button type="submit" className="btn ghost">Keresés</button>
      </form>
      {notice && <p className="status success" role="status">{notice}</p>}
      {error && <p className="status error" role="alert">{error}</p>}
      {!users ? <p role="status">Betöltés…</p> : (
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>Felhasználó</th><th>E-mail</th><th>Regisztrált</th><th>Étkezés</th><th>Recept</th><th>Utolsó étkezés</th><th></th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}{u.isAdmin && <span className="admin-badge">admin</span>}</td>
              <td>{u.email ?? "–"}{u.email && !u.emailVerified && <span className="text-xs text-muted"> (nincs megerősítve)</span>}</td>
              <td>{fmtDate(u.createdAt)}</td><td>{u.meals}</td><td>{u.recipes}</td><td>{fmtDate(u.lastMealAt)}</td>
              <td className="admin-row-actions">
                {u.email && <button type="button" className="btn ghost" onClick={() => sendReset(u)}>Jelszó-link</button>}
                {!u.isAdmin && <button type="button" className="btn danger" onClick={() => remove(u)}>Törlés</button>}
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

function SettingsTab({ state }: { state: ApiState }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { api<{ settings: Settings }>("/admin/settings", {}, state).then((r) => setSettings(r.settings)).catch((e) => setError(errorText(e))); }, []);
  if (error && !settings) return <p className="status error" role="alert">{error}</p>;
  if (!settings) return <p role="status">Betöltés…</p>;
  const set = (patch: Partial<Settings>) => { setSaved(false); setSettings({ ...settings, ...patch }); };
  async function save() {
    try { const r = await api<{ settings: Settings }>("/admin/settings", { method: "PUT", body: JSON.stringify(settings) }, state); setSettings(r.settings); setSaved(true); setError(null); } catch (e) { setError(errorText(e)); }
  }
  const limit = (key: keyof Settings["aiLimits"], label: string, hint: string) => (
    <label>{label}<input className="field" type="number" min={0} value={settings.aiLimits[key] ?? 0} onChange={(e) => set({ aiLimits: { ...settings.aiLimits, [key]: Number(e.target.value) } })}/><span className="text-xs text-muted">{hint}</span></label>
  );
  return (
    <div className="admin-stack admin-settings">
      <section>
        <h3>Regisztráció</h3>
        <label className="legal-confirm"><input type="checkbox" checked={settings.registrationOpen} onChange={(e) => set({ registrationOpen: e.target.checked })}/>Új felhasználók regisztrálhatnak</label>
        <p className="text-xs text-muted">Kikapcsolva a meglévő felhasználók továbbra is be tudnak lépni.</p>
      </section>
      <section>
        <h3>Üzenet minden felhasználónak</h3>
        <label className="legal-confirm"><input type="checkbox" checked={settings.announcement.enabled} onChange={(e) => set({ announcement: { ...settings.announcement, enabled: e.target.checked } })}/>Üzenetsáv megjelenítése az app tetején</label>
        {(["hu", "de", "en"] as const).map((l) => (
          <label key={l}>{l === "hu" ? "Magyar" : l === "de" ? "Német" : "Angol"}<input className="field" maxLength={300} value={settings.announcement[l]} onChange={(e) => set({ announcement: { ...settings.announcement, [l]: e.target.value } })}/></label>
        ))}
        <p className="text-xs text-muted">Ha egy nyelv üresen marad, ott a magyar szöveg jelenik meg.</p>
      </section>
      <section>
        <h3>AI-keretek (felhasználónként)</h3>
        {limit("perHour", "Óránként", "AI-becslés és webes tápérték-keresés óránként (alap: 30)")}
        {limit("perDay", "Naponta", "Ugyanez naponta (alap: 100)")}
        {limit("perRecipe", "Receptenként", "Egy recept importálásakor legfeljebb (alap: 8)")}
        <h3>Bővebb AI-keret (prémium)</h3>
        {limit("premiumPerHour", "Prémium: óránként", "Prémium felhasználóknak, bétában mindenkinek (alap: 60)")}
        {limit("premiumPerDay", "Prémium: naponta", "Ugyanez naponta (alap: 200)")}
      </section>
      <section>
        <h3>Prémium funkciók</h3>
        <label className="legal-confirm"><input type="checkbox" checked={(settings.premiumAccess ?? "beta_all") === "beta_all"} onChange={(e) => set({ premiumAccess: e.target.checked ? "beta_all" : "premium_only" })}/>Béta: minden felhasználó kipróbálhatja (pl. Vacsoraajánló)</label>
        <p className="text-xs text-muted">Kikapcsolva csak a prémium jogosultságú felhasználók érik el.</p>
      </section>
      <section>
        <h3>E-mail emlékeztetők</h3>
        <label>Napi plafon<input className="field" type="number" min={0} value={settings.reminderDailyCap ?? 70} onChange={(e) => set({ reminderDailyCap: Number(e.target.value) })}/><span className="text-xs text-muted">Naponta (UTC szerint) legfeljebb ennyi emlékeztető e-mail megy ki (alap: 70). A Resend ingyenes csomagja összesen napi 100 e-mailt enged; a maradék a regisztráció-megerősítő és jelszó-visszaállító leveleknek kell. Ha a plafon betelik, aznap a többi emlékeztető kimarad. Fizetős Resend-csomaggal nyugodtan emelheted.</span></label>
      </section>
      {error && <p className="status error" role="alert">{error}</p>}
      {saved && <p className="status success" role="status">Mentve, azonnal érvényes.</p>}
      <button type="button" className="btn primary" onClick={save}>Beállítások mentése</button>
    </div>
  );
}

export function AdminPage({ state, onClose }: { state: ApiState; onClose?: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const tabs: Array<[Tab, string]> = [["overview", "Áttekintés"], ["feedback", "Hibajegyek"], ["users", "Felhasználók"], ["settings", "Beállítások"]];
  return (
    <article className="card legal-page admin-page" aria-labelledby="admin-title">
      {onClose && <button type="button" className="btn ghost" onClick={onClose}><ArrowLeft size={16} aria-hidden="true"/>Vissza az apphoz</button>}
      <h2 id="admin-title">Admin</h2>
      <div className="admin-tabs" role="tablist">
        {tabs.map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={tab === key} className={`seg ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>)}
      </div>
      {tab === "overview" && <OverviewTab state={state}/>}
      {tab === "feedback" && <FeedbackTab state={state}/>}
      {tab === "users" && <UsersTab state={state}/>}
      {tab === "settings" && <SettingsTab state={state}/>}
    </article>
  );
}

type TopTester = { rank: number; id: string; username: string; email: string | null; createdAt: string; meals: number };

// Beta reward: the 10 testers with the most logged meals get lifetime premium.
function TopTesters({ state }: { state: ApiState }) {
  const [testers, setTesters] = useState<TopTester[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<{ testers: TopTester[] }>("/admin/top-testers", {}, state).then((r) => setTesters(r.testers)).catch((e) => setError(errorText(e))); }, []);
  return (
    <div className="card admin-top-testers">
      <h3>Top 10 tesztelő – élethosszig tartó prémium</h3>
      <p className="text-xs text-muted">A legtöbb naplózott étkezés alapján, a béta első körének végéig (november 30.). A saját „norbi” profilod és az admin fiókok nem számítanak.</p>
      {error && <p className="status error" role="alert">{error}</p>}
      {!testers ? !error && <p role="status">Betöltés…</p> : testers.length === 0 ? <p className="text-sm text-muted">Még senki nem naplózott étkezést.</p> : (
        <ol className="admin-top-list">{testers.map((t) => <li key={t.id}><b>{t.username}</b> <span className="text-muted">{t.email ?? "nincs e-mail"}</span> · {t.meals} étkezés</li>)}</ol>
      )}
    </div>
  );
}
