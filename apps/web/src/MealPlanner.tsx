import { useEffect, useState } from "react";
import { CalendarRange, Plus, RefreshCw, ShoppingCart } from "lucide-react";
import { api, ApiError, type ApiState } from "./api";
import type { Lang } from "./i18n";
import { PremiumBadge, PremiumNote } from "./PremiumBadge";

// Heti étrendtervező (premium, 2026-10-15): seven days of breakfast, lunch
// and dinner within the user's targets, one tap to swap or log a meal, and
// one shopping list for the week (ticks remembered in this browser).

type Macros = { kcal: number; protein: number; netCarbs: number; fat: number };
type Slot = "breakfast" | "lunch" | "dinner";
type PlanMeal = { mealType: Slot; recipeId: string; titles: { hu: string; de: string; en: string }; servingGrams: number | null; macros: Macros; source: "own" | "reference" };
type PlanDay = { date: string; meals: PlanMeal[]; totals: Macros; fits: boolean };
type ShoppingItem = { name: string; grams: number; seasoning: boolean; meals: number };
type Plan = { id: string; startDate: string; days: PlanDay[]; shopping: ShoppingItem[] };
type Response = { plan: Plan | null; goals: Macros };

const copy = {
  hu: {
    title: "Heti étrendterv", lead: "Egy hét reggeli, ebéd és vacsora, ami belefér a szénhidrát- és kalóriacélodba, sok fehérjével. A saját receptjeidből és a referenciaételekből válogatok.",
    create: "Heti terv készítése", recreate: "Új terv", creating: "Tervezem…", loading: "Betöltés…",
    slots: { breakfast: "Reggeli", lunch: "Ebéd", dinner: "Vacsora" }, swap: "Másikat kérek", log: "Naplózom", logged: "Naplózva.",
    day: "Napi összesen", goal: "cél", notFits: "Erre a napra nem találtam olyan összeállítást, ami a szénhidrátcél alatt marad. Cserélj egy ételt, vagy vegyél fel saját receptet.",
    shopping: "Bevásárlólista", hideShopping: "Terv mutatása", seasonings: "Fűszerek, ízesítők", forMeals: (n: number) => `${n} étkezéshez`,
    premium_required: "A heti étrendterv prémium funkció.", failed: "Most nem sikerült, próbáld újra.", confirmRecreate: "Új tervet készítsek? A mostani terv lecserélődik."
  },
  de: {
    title: "Wochenplan", lead: "Eine Woche Frühstück, Mittag- und Abendessen passend zu deinem Kohlenhydrat- und Kalorienziel, mit viel Eiweiß. Aus deinen Rezepten und den Referenzgerichten.",
    create: "Wochenplan erstellen", recreate: "Neuer Plan", creating: "Plane…", loading: "Lädt…",
    slots: { breakfast: "Frühstück", lunch: "Mittagessen", dinner: "Abendessen" }, swap: "Etwas anderes", log: "Eintragen", logged: "Eingetragen.",
    day: "Tagessumme", goal: "Ziel", notFits: "Für diesen Tag passt keine Kombination unter dein Kohlenhydratziel. Tausche ein Gericht oder lege ein eigenes Rezept an.",
    shopping: "Einkaufsliste", hideShopping: "Plan anzeigen", seasonings: "Gewürze", forMeals: (n: number) => `für ${n} Mahlzeiten`,
    premium_required: "Der Wochenplan ist eine Premium-Funktion.", failed: "Hat gerade nicht geklappt, bitte erneut versuchen.", confirmRecreate: "Neuen Plan erstellen? Der aktuelle wird ersetzt."
  },
  en: {
    title: "Weekly meal plan", lead: "A week of breakfasts, lunches and dinners within your carb and calorie targets, high in protein, from your recipes and the reference dishes.",
    create: "Create weekly plan", recreate: "New plan", creating: "Planning…", loading: "Loading…",
    slots: { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" }, swap: "Something else", log: "Log", logged: "Logged.",
    day: "Day total", goal: "target", notFits: "No combination for this day stays under your carb target. Swap a dish or add your own recipe.",
    shopping: "Shopping list", hideShopping: "Show plan", seasonings: "Seasonings", forMeals: (n: number) => `for ${n} meals`,
    premium_required: "The weekly meal plan is a premium feature.", failed: "That did not work, please try again.", confirmRecreate: "Create a new plan? The current one will be replaced."
  }
} as const;

const macroLine = (m: Macros) => `${m.kcal} kcal · P ${m.protein} g · NCH ${m.netCarbs} g`;
const grams = (g: number) => g >= 1000 ? `${(g / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : `${g} g`;
const dayLabel = (date: string, lang: Lang) => new Intl.DateTimeFormat(lang === "hu" ? "hu-HU" : lang === "de" ? "de-DE" : "en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

function readTicks(planId: string): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(`km_shopping_${planId}`) ?? "{}"); } catch { return {}; }
}

export function MealPlanner({ lang, state, today, onLogged }: { lang: Lang; state: ApiState; today: string; onLogged: () => void | Promise<void> }) {
  const t = copy[lang];
  const [data, setData] = useState<Response | null>(null);
  const [busy, setBusy] = useState<string | null>("load");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState(today);
  const [showShopping, setShowShopping] = useState(false);
  const [ticks, setTicks] = useState<Record<string, boolean>>({});

  const fail = (e: unknown) => setError(e instanceof ApiError && e.code === "premium_required" ? t.premium_required : t.failed);
  const apply = (next: Response) => { setData(next); if (next.plan) { setTicks(readTicks(next.plan.id)); if (!next.plan.days.some((d) => d.date === selected)) setSelected(next.plan.days[0]?.date ?? today); } };

  useEffect(() => {
    let alive = true;
    api<Response>(`/meal-plans/current?date=${today}&lang=${lang}`, {}, state)
      .then((r) => { if (alive) apply(r); }).catch((e) => { if (alive) fail(e); }).finally(() => { if (alive) setBusy(null); });
    return () => { alive = false; };
  }, [today, lang]);

  async function run(key: string, call: () => Promise<Response>) {
    setBusy(key); setError(null); setNotice(null);
    try { apply(await call()); } catch (e) { fail(e); } finally { setBusy(null); }
  }
  const create = () => {
    if (data?.plan && !window.confirm(t.confirmRecreate)) return;
    void run("create", () => api<Response>(`/meal-plans?lang=${lang}`, { method: "POST", body: JSON.stringify({ startDate: today }) }, state));
  };
  const swap = (date: string, mealType: Slot) => run(`swap:${date}:${mealType}`, () => api<Response>(`/meal-plans/${data!.plan!.id}/swap?lang=${lang}`, { method: "POST", body: JSON.stringify({ date, mealType }) }, state));
  async function log(meal: PlanMeal) {
    setBusy(`log:${meal.recipeId}`); setError(null); setNotice(null);
    try {
      await api(`/recipes/${meal.recipeId}/meals`, { method: "POST", body: JSON.stringify({ mealType: meal.mealType, quantity: 1, unit: "serving" }) }, state);
      setNotice(t.logged);
      await onLogged();
    } catch (e) { fail(e); } finally { setBusy(null); }
  }
  function tick(name: string) {
    if (!data?.plan) return;
    const next = { ...ticks, [name]: !ticks[name] };
    setTicks(next);
    try { localStorage.setItem(`km_shopping_${data.plan.id}`, JSON.stringify(next)); } catch { /* storage unavailable */ }
  }

  const plan = data?.plan ?? null;
  const day = plan?.days.find((d) => d.date === selected) ?? plan?.days[0];
  const goals = data?.goals;

  return (
    <section className="card planner-card is-premium" aria-labelledby="planner-title">
      <div className="dinner-head">
        <h2 id="planner-title" className="section-heading"><CalendarRange size={20} aria-hidden="true"/>{t.title}</h2>
        <PremiumBadge lang={lang}/>
      </div>
      <PremiumNote lang={lang}/>
      {!plan && <p className="text-sm text-muted">{t.lead}</p>}
      <div className="planner-actions">
        <button type="button" className={`btn ${plan ? "secondary" : "primary"}`} onClick={create} disabled={busy !== null}>{busy === "create" ? t.creating : busy === "load" ? t.loading : plan ? t.recreate : t.create}</button>
        {plan && <button type="button" className="btn ghost" onClick={() => setShowShopping((v) => !v)} aria-pressed={showShopping}><ShoppingCart size={16} aria-hidden="true"/>{showShopping ? t.hideShopping : t.shopping}</button>}
      </div>
      {error && <p className="status error" role="alert">{error}</p>}
      {notice && <p className="status success" role="status">{notice}</p>}

      {plan && !showShopping && day && (
        <>
          <div className="planner-days" role="tablist" aria-label={t.title}>
            {plan.days.map((d) => (
              <button key={d.date} type="button" role="tab" aria-selected={d.date === day.date} className={`chip ${d.date === day.date ? "active" : ""} ${d.fits ? "" : "is-warning"}`} onClick={() => setSelected(d.date)}>{dayLabel(d.date, lang)}</button>
            ))}
          </div>
          {!day.fits && <p className="status" role="status">{t.notFits}</p>}
          <ul className="dinner-list">
            {day.meals.map((meal) => (
              <li key={meal.mealType} className="dinner-item">
                <div>
                  <span className="meal-type-tag">{t.slots[meal.mealType]}</span>
                  <strong>{meal.titles[lang]}</strong>
                  <div className="text-sm">{macroLine(meal.macros)}{meal.servingGrams ? ` · ${meal.servingGrams} g` : ""}</div>
                </div>
                <div className="planner-meal-actions">
                  <button type="button" className="btn ghost" onClick={() => swap(day.date, meal.mealType)} disabled={busy !== null} aria-label={`${t.swap}: ${t.slots[meal.mealType]}`}><RefreshCw size={15} aria-hidden="true"/>{t.swap}</button>
                  {day.date === today && <button type="button" className="btn ghost" onClick={() => log(meal)} disabled={busy !== null} aria-label={`${t.log}: ${meal.titles[lang]}`}><Plus size={15} aria-hidden="true"/>{t.log}</button>}
                </div>
              </li>
            ))}
          </ul>
          {goals && <p className="text-sm"><strong>{t.day}:</strong> {macroLine(day.totals)} <span className="text-muted">({t.goal}: {goals.kcal} kcal · P {goals.protein} g · NCH ≤ {goals.netCarbs} g)</span></p>}
        </>
      )}

      {plan && showShopping && (
        <div className="shopping-list">
          {[false, true].map((seasoning) => {
            const items = plan.shopping.filter((item) => item.seasoning === seasoning);
            if (!items.length) return null;
            return (
              <div key={String(seasoning)}>
                {seasoning && <h3 className="text-sm">{t.seasonings}</h3>}
                <ul>
                  {items.map((item) => (
                    <li key={item.name}>
                      <label className={ticks[item.name] ? "is-done" : ""}>
                        <input type="checkbox" checked={!!ticks[item.name]} onChange={() => tick(item.name)}/>
                        <span>{item.name}</span>
                        <span className="text-xs text-muted">{item.grams > 0 ? grams(item.grams) : ""} · {t.forMeals(item.meals)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
