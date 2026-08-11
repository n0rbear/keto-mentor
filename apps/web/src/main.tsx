import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, ExternalLink, LogOut, Mail, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { dict, type Lang } from "./i18n";
import { api, ApiError, type ApiState } from "./api";
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
  const [totals, setTotals] = useState<Totals>({ kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 });
  const [mode, setMode] = useState<"login" | "register">("register");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [mealSaving, setMealSaving] = useState(false);
  const [mealStatus, setMealStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [foodResetVersion, setFoodResetVersion] = useState(0);
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
    if (mealSaving) return;
    if (!selectedFood) {
      setMealStatus({ kind: "error", text: t.mealErrors.selectFood });
      return;
    }
    setMealSaving(true);
    setMealStatus(null);
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    try {
      await api("/meals", {
        method: "POST",
        body: JSON.stringify({ title: String(form.get("title")), items: [{ foodId: selectedFood.id, quantity: Number(form.get("quantity")), unit: String(form.get("unit")) }] })
      }, state);
      formElement.reset();
      setSelectedFood(null);
      setFoodResetVersion((value) => value + 1);
      await load();
      setMealStatus({ kind: "success", text: t.mealSaved });
    } catch (error) {
      setMealStatus({ kind: "error", text: mealErrorText(error, t.mealErrors) });
    } finally {
      setMealSaving(false);
    }
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
            <FoodCombobox lang={lang} state={state} selected={selectedFood} onSelect={setSelectedFood} labels={t.foodSearch} resetVersion={foodResetVersion}/>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <label htmlFor="meal-quantity">{t.quantity}<input id="meal-quantity" className="field" name="quantity" defaultValue="1" type="number" min="0.1" max="5000" step="0.1" required/></label>
              <label htmlFor="meal-unit">{t.unit}<select id="meal-unit" className="field" name="unit"><option value="serving">{t.serving}</option><option value="g">g</option></select></label>
            </div>
            <p className="text-xs text-muted">USDA FoodData Central alapú átlagértékek. Csomagolt termék és barcode import későbbi adapterként jön.</p>
            {mealStatus && <div className={`status ${mealStatus.kind}`} role={mealStatus.kind === "error" ? "alert" : "status"}>{mealStatus.text}</div>}
            <button className="btn primary w-full" disabled={mealSaving} aria-busy={mealSaving}>{mealSaving ? t.savingMeal : t.addMeal}</button>
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

type SearchLabels = { label: string; placeholder: string; loading: string; noResults: string; hint: string; selected: string };

function FoodCombobox({ lang, state, selected, onSelect, labels, resetVersion }: { lang: Lang; state: ApiState; selected: Food | null; onSelect: (food: Food | null) => void; labels: SearchLabels; resetVersion: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => { setQuery(""); setResults([]); setOpen(false); setActive(-1); }, [resetVersion]);

  useEffect(() => {
    if (query.trim().length < 2 || selected) { setResults([]); setLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await api<{ foods: Food[] }>(`/foods?q=${encodeURIComponent(query)}`, { signal: controller.signal }, state);
        setResults(result.foods); setOpen(true); setActive(result.foods.length ? 0 : -1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally { setLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, selected, state]);

  const choose = (food: Food) => { onSelect(food); setQuery(food.names?.[lang] ?? food.name); setOpen(false); };
  return (
    <div className="combobox-wrap">
      <label htmlFor="food-search">{labels.label}</label>
      <input id="food-search" className="field" role="combobox" autoComplete="off" value={query} placeholder={labels.placeholder}
        aria-expanded={open} aria-controls="food-results" aria-autocomplete="list" aria-activedescendant={active >= 0 ? `food-option-${active}` : undefined}
        onChange={(event) => { setQuery(event.target.value); onSelect(null); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((value) => Math.min(value + 1, results.length - 1)); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
          if (event.key === "Enter" && open && active >= 0) { event.preventDefault(); choose(results[active]); }
          if (event.key === "Escape") setOpen(false);
        }}/>
      {selected && <div className="selected-food"><strong>{labels.selected}:</strong> {selected.names?.[lang] ?? selected.name} · {Math.round(selected.kcalPer100g)} kcal/100g</div>}
      {!selected && query.length < 2 && <small className="search-hint">{labels.hint}</small>}
      {open && query.length >= 2 && !selected && <div id="food-results" className="food-results" role="listbox">
        {loading ? <div className="food-state">{labels.loading}</div> : results.length === 0 ? <div className="food-state">{labels.noResults}</div> : results.map((food, index) =>
          <button id={`food-option-${index}`} type="button" role="option" aria-selected={index === active} className={`food-option ${index === active ? "active" : ""}`} key={food.id} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(food)}>
            <span>{food.names?.[lang] ?? food.name}</span><small>{Math.round(food.kcalPer100g)} kcal/100g</small>
          </button>)}
      </div>}
    </div>
  );
}

function mealErrorText(error: unknown, labels: Record<string, string>) {
  if (!(error instanceof ApiError)) return labels.unknown;
  return labels[error.code] ?? (error.status === 401 ? labels.unauthorized : error.status && error.status >= 500 ? labels.server : labels.unknown);
}

createRoot(document.getElementById("root")!).render(<App />);
