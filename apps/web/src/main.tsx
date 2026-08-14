import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, ExternalLink, LogOut, Mail, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { dict, type Lang } from "./i18n";
import { api, ApiError, type ApiState } from "./api";
import { authErrorText } from "./auth-error";
import "./styles.css";
import norbappLogo from "./assets/norbapp-logo.webp";
import ketomentorLogo from "./assets/ketomentor-logo.png";
import { RecipeBuilder } from "./RecipeBuilder";

type User = { id: string; username: string; locale: Lang; profile?: any };
export type Totals = { kcal: number; fat: number; protein: number; carbs: number; fiber: number; netCarbs: number };
type Meal = { id: string; title: string; eatenAt: string; totals: Totals };
export type FoodServing = { id: string; key: string; unit: string; labels?: Partial<Record<Lang, string>>; grams: number; isEstimated: boolean; confidence: number; provenance?: unknown };
export type Food = { id: string; name: string; names?: Record<Lang, string>; servings?: FoodServing[]; kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number; provenance?: any; match?: { stage: string; score: number } };
type MealInterpretation = {
  parsed: { quantity?: number; unit?: string; size?: string; foodQuery: string };
  foodResolution: "resolved" | "confirmation_required" | "unresolved";
  selectedFood: Food | null;
  candidates: Food[];
  quantity: null | { status: "resolved" | "unresolved"; grams?: number; servingId?: string; method?: string; confidence?: number; estimated: boolean; requiresConfirmation: boolean; reason?: string };
  canConfirm: boolean;
};

function App() {
  const [lang, setLang] = useState<Lang>("hu");
  const [token, setToken] = useState(localStorage.getItem("km_token"));
  const [user, setUser] = useState<User | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<Totals>({ kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 });
  const [mode, setMode] = useState<"login" | "register">("register");
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [mealSaving, setMealSaving] = useState(false);
  const [mealStatus, setMealStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [foodResetVersion, setFoodResetVersion] = useState(0);
  const [mealMeasure, setMealMeasure] = useState("g");
  const [gramsOverride, setGramsOverride] = useState("");
  const [mealQuantity, setMealQuantity] = useState("1");
  const [naturalInput, setNaturalInput] = useState("");
  const [interpretation, setInterpretation] = useState<MealInterpretation | null>(null);
  const [interpreting, setInterpreting] = useState(false);
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
    setAuthError(null);
    const form = new FormData(event.currentTarget);
    const body = { username: String(form.get("username")), password: String(form.get("password")), locale: lang };
    try {
      const result = await api<{ user: User; accessToken: string }>(`/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
      setUser(result.user);
      setToken(result.accessToken);
    } catch (error) {
      setAuthError(authErrorText(error, lang));
    }
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
      const servingId = mealMeasure.startsWith("serving:") ? mealMeasure.slice(8) : undefined;
      const selectedServing = selectedFood.servings?.find((serving) => serving.id === servingId);
      await api("/meals", {
        method: "POST",
        body: JSON.stringify({ title: String(form.get("title")), items: [{ foodId: selectedFood.id, quantity: Number(form.get("quantity")), unit: servingId ? "serving" : mealMeasure, servingId, gramsOverride: selectedServing?.isEstimated && gramsOverride ? Number(gramsOverride) : undefined }] })
      }, state);
      formElement.reset();
      setSelectedFood(null);
      setMealMeasure("g");
      setMealQuantity("1");
      setGramsOverride("");
      setFoodResetVersion((value) => value + 1);
      await load();
      setMealStatus({ kind: "success", text: t.mealSaved });
    } catch (error) {
      setMealStatus({ kind: "error", text: mealErrorText(error, t.mealErrors) });
    } finally {
      setMealSaving(false);
    }
  }

  async function interpretNaturalInput() {
    if (naturalInput.trim().length < 2 || interpreting) return;
    setInterpreting(true);
    try {
      const result = await api<MealInterpretation>("/meal-input/interpret", { method: "POST", body: JSON.stringify({ text: naturalInput }) }, state);
      setInterpretation(result);
      if (result.canConfirm && result.selectedFood && result.parsed.quantity) {
        setSelectedFood(result.selectedFood);
        setMealQuantity(String(result.parsed.quantity));
        setMealMeasure(result.quantity?.servingId ? `serving:${result.quantity.servingId}` : result.parsed.unit === "kg" ? "kg" : "g");
        setGramsOverride("");
      } else {
        setSelectedFood(null);
        setMealQuantity("1");
        setMealMeasure("g");
        setGramsOverride("");
      }
    } catch {
      setInterpretation(null);
    } finally {
      setInterpreting(false);
    }
  }

  const profile = user?.profile;
  const goals = profile ?? { dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-borderSoft/80 bg-appBg/90 backdrop-blur">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] items-center justify-between py-4">
          <div className="flex items-center gap-3 font-extrabold text-ink">
<img
  src={ketomentorLogo}
  alt="Keto Mentor"
  className="h-12 w-auto object-contain"
/>            {t.app}
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
              <button type="button" className={`seg ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setAuthError(null); }}>{t.register}</button>
              <button type="button" className={`seg ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setAuthError(null); }}>{t.login}</button>
            </div>
            <label htmlFor="auth-username">{t.username}<input id="auth-username" className="field" name="username" required minLength={3}/></label>
            <label htmlFor="auth-password">{t.password}<input id="auth-password" className="field" name="password" required minLength={10} type="password"/></label>
            {authError && <div className="status error" role="alert">{authError}</div>}
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

      {user && profile?.onboardingDone && <div className="mx-auto w-[min(1180px,calc(100%-32px))] pb-5"><RecipeBuilder lang={lang} state={state} currentUserId={user.id} onMealAdded={load}/></div>}
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
            <div className="natural-input">
              <label htmlFor="natural-meal-input">{lang === "hu" ? "Mondd el, mit ettél" : lang === "de" ? "Beschreibe, was du gegessen hast" : "Describe what you ate"}</label>
              <div className="natural-input-row"><input id="natural-meal-input" className="field" value={naturalInput} onChange={(event) => { setNaturalInput(event.target.value); setInterpretation(null); setSelectedFood(null); setMealQuantity("1"); setMealMeasure("g"); setGramsOverride(""); }} placeholder={lang === "hu" ? "Például: 5 tojás" : lang === "de" ? "Zum Beispiel: 3 Scheiben Gouda" : "For example: 5 eggs"}/><button type="button" className="btn secondary" disabled={interpreting || naturalInput.trim().length < 2} onClick={interpretNaturalInput}>{interpreting ? "…" : lang === "hu" ? "Értelmezés" : lang === "de" ? "Verstehen" : "Interpret"}</button></div>
              {interpretation && <div className={`interpretation ${interpretation.canConfirm ? "ready" : "needs-review"}`} role="status">
                {interpretation.canConfirm && interpretation.selectedFood && interpretation.quantity ? <>
                  <strong>{interpretation.selectedFood.names?.[lang] ?? interpretation.selectedFood.name}</strong>
                  <span>{interpretation.quantity.estimated ? "≈" : "="} {Math.round((interpretation.quantity.grams ?? 0) * 10) / 10} g · {interpretation.quantity.estimated ? (lang === "hu" ? "becsült, ellenőrizd" : lang === "de" ? "geschätzt, bitte prüfen" : "estimated, please check") : (lang === "hu" ? "ellenőrzött átváltás" : lang === "de" ? "geprüfte Umrechnung" : "verified conversion")}</span>
                </> : <span>{interpretation.foodResolution === "unresolved" ? (lang === "hu" ? "Az ételt nem találtam meg biztonságosan. Válaszd ki kézzel." : lang === "de" ? "Lebensmittel nicht sicher gefunden. Bitte manuell wählen." : "Food was not resolved safely. Choose it manually.") : interpretation.quantity?.reason === "conversion_missing" ? (lang === "hu" ? "Az étel megvan, de ehhez a mértékhez nincs hiteles grammsúly. Add meg kézzel a grammot." : lang === "de" ? "Lebensmittel gefunden, aber kein verlässliches Grammgewicht. Bitte Gramm eingeben." : "Food found, but no reliable gram conversion exists. Enter grams manually.") : (lang === "hu" ? "Ellenőrizd és válaszd ki a megfelelő ételt." : lang === "de" ? "Bitte das richtige Lebensmittel auswählen." : "Review and choose the correct food.")}</span>}
              </div>}
            </div>
            <input className="field" name="title" placeholder={t.mealName} required/>
            <FoodCombobox lang={lang} state={state} selected={selectedFood} onSelect={(food) => { setSelectedFood(food); setMealMeasure("g"); setGramsOverride(""); }} labels={t.foodSearch} resetVersion={foodResetVersion}/>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <label htmlFor="meal-quantity">{t.quantity}<input id="meal-quantity" className="field" name="quantity" value={mealQuantity} onChange={(event) => setMealQuantity(event.target.value)} type="number" min="0.1" max="5000" step="0.1" required/></label>
              <label htmlFor="meal-unit">{t.unit}<select id="meal-unit" className="field" value={mealMeasure} onChange={(event) => { setMealMeasure(event.target.value); setGramsOverride(""); }}><option value="g">g</option><option value="kg">kg</option>{selectedFood?.servings?.map((serving) => <option key={serving.id} value={`serving:${serving.id}`}>{serving.labels?.[lang] ?? serving.unit}</option>)}</select></label>
            </div>
            {mealMeasure.startsWith("serving:") && (() => {
              const serving = selectedFood?.servings?.find((candidate) => candidate.id === mealMeasure.slice(8));
              if (!serving) return null;
              return <div className="serving-detail"><strong>1 {serving.labels?.[lang] ?? serving.unit} = {serving.grams} g</strong>{serving.isEstimated && <><span>{lang === "hu" ? "Becsült átváltás – módosítható" : lang === "de" ? "Geschätzte Umrechnung – bearbeitbar" : "Estimated conversion – editable"}</span><input className="field" aria-label="Gram equivalent" type="number" min="0.1" max="50000" step="0.1" placeholder={String(serving.grams)} value={gramsOverride} onChange={(event) => setGramsOverride(event.target.value)}/></>}</div>;
            })()}
            <p className="text-xs text-muted">USDA FoodData Central alapú átlagértékek. Csomagolt termék és barcode import későbbi adapterként jön.</p>
            {mealStatus && <div className={`status ${mealStatus.kind}`} role={mealStatus.kind === "error" ? "alert" : "status"}>{mealStatus.text}</div>}
            <button className="btn primary w-full" disabled={mealSaving} aria-busy={mealSaving}>{mealSaving ? t.savingMeal : t.addMeal}</button>
          </form>
        </section>
      )}
      <footer className="border-t border-borderSoft bg-white/70">
        <div className="mx-auto flex w-[min(1180px,calc(100%-32px))] flex-col gap-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <a className="brand-link" href="https://norbapp.com" target="_blank" rel="noreferrer" aria-label="NorbApp weboldal megnyitasa">
            <img src={norbappLogo} alt="NorbApp" className="h-10 w-auto object-contain"/>
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

export function FoodCombobox({ lang, state, selected, onSelect, labels, resetVersion, idPrefix = "food" }: { lang: Lang; state: ApiState; selected: Food | null; onSelect: (food: Food | null) => void; labels: SearchLabels; resetVersion: number; idPrefix?: string }) {
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
      <label htmlFor={`${idPrefix}-search`}>{labels.label}</label>
      <input id={`${idPrefix}-search`} className="field" role="combobox" autoComplete="off" value={query} placeholder={labels.placeholder}
        aria-expanded={open} aria-controls={`${idPrefix}-results`} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${idPrefix}-option-${active}` : undefined}
        onChange={(event) => { setQuery(event.target.value); onSelect(null); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((value) => Math.min(value + 1, results.length - 1)); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
          if (event.key === "Enter" && open && active >= 0) { event.preventDefault(); choose(results[active]); }
          if (event.key === "Escape") setOpen(false);
        }}/>
      {selected && <div className="selected-food"><strong>{labels.selected}:</strong> {selected.names?.[lang] ?? selected.name} · {Math.round(selected.kcalPer100g)} kcal/100g</div>}
      {!selected && query.length < 2 && <small className="search-hint">{labels.hint}</small>}
      {open && query.length >= 2 && !selected && <div id={`${idPrefix}-results`} className="food-results" role="listbox">
        {loading ? <div className="food-state">{labels.loading}</div> : results.length === 0 ? <div className="food-state">{labels.noResults}</div> : results.map((food, index) =>
          <button id={`${idPrefix}-option-${index}`} type="button" role="option" aria-selected={index === active} className={`food-option ${index === active ? "active" : ""}`} key={food.id} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(food)}>
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
