import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, ExternalLink, LogOut, Mail, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { dict, type Lang } from "./i18n";
import { api } from "./api";
import "./styles.css";
import norbappMark from "./assets/norbapp-mark.svg";

type User = { id: string; username: string; locale: Lang; profile?: any };
type Totals = { kcal: number; fat: number; protein: number; carbs: number; fiber: number; netCarbs: number };
type Meal = { id: string; title: string; eatenAt: string; totals: Totals };
type Food = { id: string; name: string; names?: Record<Lang, string>; servingUnit?: string; servingGrams?: number; kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number; provenance?: any };

function App() {
  const [lang, setLang] = useState<Lang>("hu");
  const [token, setToken] = useState(localStorage.getItem("km_token"));
  const [user, setUser] = useState<User | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [totals, setTotals] = useState<Totals>({ kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 });
  const [mode, setMode] = useState<"login" | "register">("register");
  const t = dict[lang];
  const state = useMemo(() => ({ token, setToken }), [token]);

  useEffect(() => {
    if (token) localStorage.setItem("km_token", token);
    else localStorage.removeItem("km_token");
  }, [token]);

  async function load() {
    if (!token) return;
    const me = await api<{ user: User }>("/me", {}, state);
    setUser(me.user);
    setLang(me.user.locale);
    const today = await api<{ meals: Meal[]; totals: Totals }>("/meals/today", {}, state);
    setMeals(today.meals);
    setTotals(today.totals);
    const catalog = await api<{ foods: Food[] }>("/foods", {}, state);
    setFoods(catalog.foods);
  }

  useEffect(() => { load().catch(() => setToken(null)); }, [token]);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { username: String(form.get("username")), password: String(form.get("password")), locale: lang };
    const result = await api<{ user: User; accessToken: string }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
    setUser(result.user);
    setToken(result.accessToken);
  }

  async function saveOnboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/me/onboarding", {
      method: "PUT",
      body: JSON.stringify({
        locale: lang,
        goal: form.get("goal"),
        dailyKcal: Number(form.get("dailyKcal")),
        dailyNetCarbs: Number(form.get("dailyNetCarbs")),
        dailyProtein: Number(form.get("dailyProtein")),
        dailyFat: Number(form.get("dailyFat")),
        dailyFiber: Number(form.get("dailyFiber")),
        preferences: String(form.get("preferences")).split(",").map((x) => x.trim()).filter(Boolean),
        avoidedFoods: String(form.get("avoidedFoods")).split(",").map((x) => x.trim()).filter(Boolean),
        allergies: String(form.get("allergies")).split(",").map((x) => x.trim()).filter(Boolean)
      })
    }, state);
    await load();
  }

  async function addMeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api("/meals", {
      method: "POST",
      body: JSON.stringify({
        title: String(form.get("title")),
        items: [{
          foodId: String(form.get("foodId")),
          quantity: Number(form.get("quantity")),
          unit: String(form.get("unit"))
        }]
      })
    }, state);
    event.currentTarget.reset();
    await load();
  }

  const profile = user?.profile;
  const goals = profile ?? { dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-borderSoft/80 bg-appBg/90 backdrop-blur">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between py-4">
          <div className="flex items-center gap-3 font-extrabold text-ink">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-cyan text-white shadow-norb" role="img" aria-label="Keto Mentor logó">N</span>
            {t.app}
          </div>
          <div className="flex items-center gap-2">
            <select className="field compact" value={lang} onChange={(e) => setLang(e.target.value as Lang)}><option value="hu">HU</option><option value="de">DE</option><option value="en">EN</option></select>
            {user && <button className="btn secondary" onClick={async () => { await api("/auth/logout", { method: "POST" }, state); setToken(null); setUser(null); }}><LogOut size={16}/>{t.logout}</button>}
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 py-8 md:grid-cols-[1fr_.9fr] md:py-14">
        <div>
          <div className="eyebrow"><Sparkles size={14}/> NorbApp MVP</div>
          <h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-none tracking-tight text-ink md:text-7xl">{t.hero}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{t.lead}</p>
          <p className="mt-5 rounded-2xl border border-borderSoft bg-white/80 p-4 text-sm text-muted"><ShieldCheck className="mr-2 inline text-brandDark" size={18}/>{t.disclaimer}</p>
        </div>

        {!user ? (
          <form onSubmit={submitAuth} className="card space-y-4">
            <div className="flex rounded-2xl bg-appBg p-1">
              <button type="button" className={`seg ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>{t.register}</button>
              <button type="button" className={`seg ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>{t.login}</button>
            </div>
            <label htmlFor="auth-username">{t.username}<input id="auth-username" className="field" name="username" required minLength={3}/></label>
            <label htmlFor="auth-password">{t.password}<input id="auth-password" className="field" name="password" required minLength={10} type="password"/></label>
            <button className="btn primary w-full" type="submit">{mode === "register" ? t.register : t.login}</button>
          </form>
        ) : !profile?.onboardingDone ? (
          <form onSubmit={saveOnboarding} className="card space-y-3">
            <h2>{t.onboarding}</h2>
            <label htmlFor="goal">{t.goal}<select id="goal" name="goal" className="field"><option value="weight_loss">{t.goals.weight_loss}</option><option value="maintenance">{t.goals.maintenance}</option><option value="energy">{t.goals.energy}</option><option value="medical_support">{t.goals.medical_support}</option><option value="learning">{t.goals.learning}</option></select></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <OnboardingField id="dailyKcal" label={t.fields.dailyKcal[0]} help={t.fields.dailyKcal[1]} defaultValue="1800"/>
              <OnboardingField id="dailyNetCarbs" label={t.fields.dailyNetCarbs[0]} help={t.fields.dailyNetCarbs[1]} defaultValue="25"/>
              <OnboardingField id="dailyProtein" label={t.fields.dailyProtein[0]} help={t.fields.dailyProtein[1]} defaultValue="110"/>
              <OnboardingField id="dailyFat" label={t.fields.dailyFat[0]} help={t.fields.dailyFat[1]} defaultValue="130"/>
              <OnboardingField id="dailyFiber" label={t.fields.dailyFiber[0]} help={t.fields.dailyFiber[1]} defaultValue="25"/>
            </div>
            <OnboardingField id="preferences" label={t.fields.preferences[0]} help={t.fields.preferences[1]} placeholder="tojás, avokádó"/>
            <OnboardingField id="avoidedFoods" label={t.fields.avoidedFoods[0]} help={t.fields.avoidedFoods[1]} placeholder="cukor, kenyér"/>
            <OnboardingField id="allergies" label={t.fields.allergies[0]} help={t.fields.allergies[1]} placeholder="laktóz, diófélék"/>
            <button className="btn primary w-full">{t.save}</button>
          </form>
        ) : (
          <div className="card"><h2>{t.dashboard}</h2><p className="mt-3 text-muted">{t.explain}</p></div>
        )}
      </section>

      {user && profile?.onboardingDone && (
        <section className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-5 pb-12 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Macro label="kcal" value={totals.kcal} goal={goals.dailyKcal}/>
              <Macro label="fat" value={totals.fat} goal={goals.dailyFat}/>
              <Macro label="protein" value={totals.protein} goal={goals.dailyProtein}/>
              <Macro label="net carbs" value={totals.netCarbs} goal={goals.dailyNetCarbs}/>
              <Macro label="fiber" value={totals.fiber} goal={goals.dailyFiber}/>
            </div>
            <div className="card">
              <h2 className="mb-4 flex items-center gap-2"><Activity size={20}/>{t.today}</h2>
              <div className="space-y-3">{meals.map((m) => <div className="meal" key={m.id}><strong>{m.title}</strong><span>{Math.round(m.totals.kcal)} kcal / {Math.round(m.totals.netCarbs)}g net</span></div>)}</div>
            </div>
          </div>
          <form onSubmit={addMeal} className="card space-y-3">
            <h2 className="flex items-center gap-2"><Plus size={20}/>{t.addMeal}</h2>
            <input className="field" name="title" placeholder={t.mealName} required/>
            <select className="field" name="foodId" required>
              {foods.map((food) => <option key={food.id} value={food.id}>{food.names?.[lang] ?? food.name} ({Math.round(food.kcalPer100g)} kcal/100g)</option>)}
            </select>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <input className="field" name="quantity" placeholder={t.quantity} defaultValue="1" type="number" step="0.1" required/>
              <select className="field" name="unit"><option value="serving">adag</option><option value="g">g</option></select>
            </div>
            <p className="text-xs text-muted">USDA FoodData Central alapú átlagértékek. Csomagolt termék és barcode import későbbi adapterként jön.</p>
            <button className="btn primary w-full">{t.addMeal}</button>
          </form>
        </section>
      )}
      <footer className="border-t border-borderSoft bg-white/70">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col gap-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <a className="brand-link" href="https://norbapp.com" target="_blank" rel="noreferrer" aria-label="NorbApp weboldal megnyitasa">
            <img src={norbappMark} alt="NorbApp" className="h-10 w-10 rounded-xl"/>
            <span>NorbApp</span>
          </a>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <a className="contact-link" href="https://norbapp.com" target="_blank" rel="noreferrer"><ExternalLink size={15}/>norbapp.com</a>
            <a className="contact-link" href="mailto:norbert@norbapp.com"><Mail size={15}/>norbert@norbapp.com</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Macro({ label, value, goal }: { label: string; value: number; goal: number }) {
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return <div className="card !p-4"><div className="text-xs font-bold uppercase tracking-wider text-muted">{label}</div><strong className="text-2xl text-ink">{Math.round(value)}</strong><div className="mt-2 h-2 rounded-full bg-appBg"><div className="h-2 rounded-full bg-gradient-to-r from-brand to-cyan" style={{ width: `${pct}%` }}/></div><small className="text-muted">/ {goal}</small></div>;
}

function OnboardingField({ id, label, help, defaultValue, placeholder }: { id: string; label: string; help: string; defaultValue?: string; placeholder?: string }) {
  const helpId = `${id}-help`;
  const isNumber = defaultValue != null;
  return (
    <label htmlFor={id} className="onboarding-field">
      <span>{label}</span>
      <small id={helpId}>{help}</small>
      <input
        id={id}
        className="field"
        name={id}
        defaultValue={defaultValue}
        placeholder={placeholder}
        type={isNumber ? "number" : "text"}
        min={isNumber ? 0 : undefined}
        step={isNumber ? 1 : undefined}
        aria-describedby={helpId}
      />
    </label>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
