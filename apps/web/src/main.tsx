import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, ChevronLeft, ChevronRight, ExternalLink, LogOut, Mail, Pencil, Plus, Repeat, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

import { dict, type Lang } from "./i18n";
import { api, ApiError, type ApiState } from "./api";
import { mondayOf, shiftDate, todayLocalDate } from "./date";
import "./styles.css";
import norbappLogo from "./assets/norbapp-logo-new.png";

import { RecipeBuilder } from "./RecipeBuilder";
import { MealEditDialog, DeleteMealDialog, RepeatMealDialog, type MealDetail } from "./MealActions";
import { WeekOverviewCard, type WeekOverviewData } from "./WeekOverview";
import { AuthForm } from "./AuthForm";
import { FoodUnderstandingPreview } from "./FoodUnderstandingPreview";
import { QuantityClarification } from "./QuantityClarification";
import { BarcodeLookup } from "./BarcodeLookup";
import { MobileNav } from "./MobileNav";
import { InstallPrompt } from "./InstallPrompt";
import { UpdateBanner } from "./UpdateBanner";
import { OfflineBanner } from "./OfflineBanner";
import type { QuantityClarification as Clarification } from "@keto-mentor/shared";

type User = { id: string; username: string; locale: Lang; profile?: any };
export type Totals = { kcal: number; fat: number; protein: number; carbs: number; fiber: number; netCarbs: number };
type Meal = { id: string; title: string; eatenAt: string; totals: Totals };
export type FoodServing = { id: string; key: string; unit: string; labels?: Partial<Record<Lang, string>>; grams: number; isEstimated: boolean; confidence: number; provenance?: unknown };
export type Food = { id: string; name: string; names?: Record<Lang, string>; servings?: FoodServing[]; kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number; provenance?: any; match?: { stage: string; score: number } };
type MealInterpretation = {
  clarification?: Clarification;
  quantityConfirmation?: { method: "estimated" | "ai_estimated" | "user_corrected"; accepted: true; grams: number };
  input?: string;
  parsed: { quantity?: number; unit?: string; size?: string; foodQuery: string; preparation?: string };
  foodResolution: "resolved" | "preview" | "confirmation_required" | "unresolved" | "multi" | "compound";
  selectedFood: Food | null;
  candidates: Food[];
  quantity: null | { status: "resolved" | "unresolved"; grams?: number; servingId?: string; method?: string; confidence?: number; estimated: boolean; requiresConfirmation: boolean; reason?: string; rangeGrams?: { min: number; max: number } };
  canConfirm: boolean;
  confidence?: number;
  preparation?: string;
  items?: MealInterpretation[];
  interpretationSource?: "deterministic" | "ai_assisted";
  semantic?: { language: Lang | "unknown"; kind: "single_food" | "multiple_foods" | "compound_dish"; dishName?: string; clarificationNeeded: boolean; clarificationReason?: string };
  semanticItem?: { canonicalName: string; evidence: "explicit" | "inferred_common"; modifiers?: string[]; excludedModifiers?: string[] };
  nutritionEligible?: boolean;
};

export function App() {
  const [lang, setLang] = useState<Lang>("hu");
  const [token, setToken] = useState(localStorage.getItem("km_token"));
  const [user, setUser] = useState<User | null>(null);

  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<Totals>({ kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 });
  const [selectedDate, setSelectedDate] = useState(() => todayLocalDate());
  const [weekAnchor, setWeekAnchor] = useState(() => todayLocalDate());
  const [week, setWeek] = useState<WeekOverviewData | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealDetail | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [repeatingMeal, setRepeatingMeal] = useState<{ id: string; title: string } | null>(null);
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

  function fetchMealsForDate(dateStr: string) {
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    return api<{ meals: Meal[]; totals: Totals; date: string }>(
      `/meals/today?view=summary&date=${dateStr}&tzOffsetMinutes=${tzOffsetMinutes}`, {}, state
    );
  }

  function fetchWeekForAnchor(dateStr: string) {
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    return api<WeekOverviewData>(`/meals/week?date=${dateStr}&tzOffsetMinutes=${tzOffsetMinutes}`, {}, state);
  }

  function applyMealsResult(result: { meals: Meal[]; totals: Totals }) {
    setMeals(result.meals);
    setTotals(result.totals);
  }

  async function loadAll(dateStr: string) {
    if (!token) return;
    // /me, the diary day and the week overview are independent; fetch them
    // concurrently to cut initial dashboard latency.
    const [me, day, weekResult] = await Promise.all([
      api<{ user: User }>("/me", {}, state),
      fetchMealsForDate(dateStr),
      fetchWeekForAnchor(dateStr)
    ]);
    setUser(me.user);
    setLang(me.user.locale);
    applyMealsResult(day);
    setWeek(weekResult);
    setWeekAnchor(dateStr);
  }

  // A meal is always logged against "now", so jump the diary back to today
  // when one is added — otherwise a meal added while browsing a past day
  // would silently not appear in the list the user is looking at.
  async function handleMealLogged() {
    const today = todayLocalDate();
    setSelectedDate(today);
    await loadAll(today);
  }

  // Editing/deleting must keep the user on whatever day they're currently
  // viewing — refresh that same selected day, never snap back to today.
  async function openEditMeal(mealId: string) {
    try {
      const result = await api<{ meal: MealDetail }>(`/meals/${mealId}`, {}, state);
      setEditingMeal(result.meal);
    } catch (error) {
      setMealStatus({ kind: "error", text: mealErrorText(error, t.mealErrors) });
    }
  }

  async function handleMealEdited() {
    await fetchMealsForDate(selectedDate).then(applyMealsResult);
    setEditingMeal(null);
    setMealStatus({ kind: "success", text: t.diary.mealUpdated });
  }

  async function confirmDeleteMeal() {
    if (!deletingMealId) return;
    await api(`/meals/${deletingMealId}`, { method: "DELETE" }, state);
    await fetchMealsForDate(selectedDate).then(applyMealsResult);
    setDeletingMealId(null);
    setMealStatus({ kind: "success", text: t.diary.mealDeleted });
  }

  // Repeat always logs at now, so — unlike Edit/Delete — jump the diary to
  // today even when repeating from a historical date, so the new entry is
  // immediately visible instead of appearing to do nothing.
  async function confirmRepeatMeal() {
    if (!repeatingMeal) return;
    await api(`/meals/${repeatingMeal.id}/repeat`, { method: "POST", body: JSON.stringify({}) }, state);
    setRepeatingMeal(null);
    await handleMealLogged();
    setMealStatus({ kind: "success", text: t.diary.mealRepeated });
  }

  useEffect(() => { loadAll(selectedDate).catch(() => setToken(null)); }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    fetchMealsForDate(selectedDate).then(applyMealsResult).catch(() => {});
    // Keep the week strip showing the week that contains whatever day the
    // user is now looking at (prev/next day, or the date picker) — but only
    // re-anchor when it actually left the currently displayed week, so
    // explicit prev/next-week navigation (which doesn't move selectedDate)
    // is never fought by this effect.
    if (mondayOf(selectedDate) !== mondayOf(weekAnchor)) setWeekAnchor(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!token || !user) return;
    fetchWeekForAnchor(weekAnchor).then(setWeek).catch(() => {});
  }, [weekAnchor]);

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
    await loadAll(selectedDate);
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
        body: JSON.stringify({ title: String(form.get("title")), items: [{ foodId: selectedFood.id, quantity: Number(form.get("quantity")), unit: servingId ? "serving" : mealMeasure, servingId, gramsOverride: selectedServing?.isEstimated && gramsOverride ? Number(gramsOverride) : undefined, quantityConfirmation: interpretation?.selectedFood?.id === selectedFood.id && mealMeasure === "g" && interpretation.quantityConfirmation ? { ...interpretation.quantityConfirmation, grams: Number(form.get("quantity")), method: Number(form.get("quantity")) === interpretation.quantityConfirmation.grams ? interpretation.quantityConfirmation.method : "user_corrected" } : undefined }] })
      }, state);
      formElement.reset();
      setSelectedFood(null);
      setMealMeasure("g");
      setMealQuantity("1");
      setGramsOverride("");
      setFoodResetVersion((value) => value + 1);
      await handleMealLogged();
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
      // Auto-fill the single-food form only for a single, confirmable interpretation.
      if (result.canConfirm && result.selectedFood && result.parsed.quantity && !result.items) {
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

  async function confirmMultiMeal() {
    if (!interpretation?.items || mealSaving) return;
    const items: Array<{ foodId: string; quantity: number; unit: "g" | "kg" | "serving"; servingId?: string; quantityConfirmation?: MealInterpretation["quantityConfirmation"] }> = [];
    for (const it of interpretation.items) {
      if (!it.canConfirm || !it.selectedFood || it.quantity?.status !== "resolved") {
        setMealStatus({ kind: "error", text: lang === "hu" ? "Néhány étel nem erősíthető meg biztonságosan." : lang === "de" ? "Einige Lebensmittel konnten nicht sicher bestätigt werden." : "Some items could not be confirmed safely." });
        return;
      }
      const q = it.quantity;
      if (!q.grams || q.requiresConfirmation) return;
      if (it.quantityConfirmation) items.push({ foodId: it.selectedFood.id, quantity: q.grams, unit: "g", quantityConfirmation: it.quantityConfirmation });
      else if (q.servingId) items.push({ foodId: it.selectedFood.id, quantity: it.parsed.quantity ?? 1, unit: "serving", servingId: q.servingId });
      else if (it.parsed.unit === "g" || it.parsed.unit === "kg") items.push({ foodId: it.selectedFood.id, quantity: it.parsed.quantity ?? 0, unit: it.parsed.unit });
      else return;
    }
    if (!items.length) return;
    setMealSaving(true);
    setMealStatus(null);
    try {
      await api("/meals", { method: "POST", body: JSON.stringify({ title: interpretation.input || (lang === "hu" ? "Ebéd" : lang === "de" ? "Mahlzeit" : "Meal"), items }) }, state);
      setInterpretation(null);
      setNaturalInput("");
      await handleMealLogged();
      setMealStatus({ kind: "success", text: t.mealSaved });
    } catch (error) {
      setMealStatus({ kind: "error", text: mealErrorText(error, t.mealErrors) });
    } finally {
      setMealSaving(false);
    }
  }

  function resolveClarification(grams: number, corrected: boolean) {
    if (!interpretation?.clarification || !Number.isFinite(grams) || grams <= 0 || grams > 5000) return;
    const next = structuredClone(interpretation);
    const rows = next.items ?? [next];
    const item = rows[next.clarification!.itemIndex];
    if (!item?.selectedFood || item.foodResolution !== "resolved" || item.nutritionEligible === false) return;
    const method = corrected ? "user_corrected" : next.clarification!.method ?? "estimated";
    item.quantityConfirmation = { method, accepted: true, grams };
    item.quantity = { ...item.quantity, status: "resolved", grams, method, estimated: !corrected, requiresConfirmation: false };
    item.canConfirm = true;
    next.canConfirm = rows.every((row) => row.canConfirm);
    next.clarification = undefined;
    const index = rows.findIndex((row) => !row.canConfirm);
    if (index >= 0) {
      const row = rows[index];
      if (row.foodResolution === "resolved" && row.selectedFood && row.nutritionEligible !== false) {
        const q = row.quantity;
        next.clarification = { type: q?.status === "resolved" ? "estimate_confirmation" : q?.reason === "quantity_missing" ? "quantity_missing" : "grams_required", itemIndex: index, allowCustomGrams: true, suggestedGrams: q?.grams, rangeGrams: q?.rangeGrams, confidence: q?.confidence, method: q?.method === "ai_estimated" ? "ai_estimated" : "estimated" };
      }
    }
    setInterpretation(next);
    if (!next.items && next.canConfirm) {
      setSelectedFood(next.selectedFood);
      setMealQuantity(String(grams));
      setMealMeasure("g");
      setGramsOverride("");
    }
  }

  const profile = user?.profile;
  const goals = profile ?? { dailyKcal: 1800, dailyFat: 130, dailyProtein: 110, dailyNetCarbs: 25, dailyFiber: 25 };
  const today = todayLocalDate();
  const isCurrentWeek = mondayOf(weekAnchor) === mondayOf(today);

  return (
    <main className="min-h-screen">
      <header className="app-header">
        <div className="app-header-inner">
          <a className="product-lockup" href="#top" aria-label="NorbApp Keto Mentor">
            <span className="brand-logo-slot"><img src={norbappLogo} alt="NorbApp"/></span>
            <span className="product-lockup-copy"><small>NorbApp health</small><strong>{t.app}</strong></span>
          </a>
          <div className="header-actions">
            <select aria-label={lang === "hu" ? "Nyelv" : lang === "de" ? "Sprache" : "Language"} className="field compact" value={lang} onChange={(e) => setLang(e.target.value as Lang)}><option value="hu">HU</option><option value="de">DE</option><option value="en">EN</option></select>

            {user && (
              <button
                className="btn ghost"
                aria-label={t.logout}
                onClick={async () => {
                  // Always clear local auth state so the user is never left
                  // visually logged in with a null/invalid token, even if the
                  // server-side logout request fails.
                  try {
                    await api("/auth/logout", { method: "POST" }, state);
                  } finally {
                    setToken(null);
                    setUser(null);
                  }
                }}
              >
                <LogOut size={17} /><span>{t.logout}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <OfflineBanner lang={lang}/>
      <UpdateBanner lang={lang}/>
      <InstallPrompt lang={lang}/>

      <section id="top" className={`hero-shell ${user ? "is-authenticated" : ""}`}>
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={13}/> NorbApp · Keto Mentor</div>
          <h1 className="hero-title">{t.hero}</h1>
          <p className="hero-lead">{t.lead}</p>
          <p className="health-note"><ShieldCheck size={18}/><span>{t.disclaimer}</span></p>
        </div>


        {!user ? (
          <AuthForm mode="register" lang={lang} state={state} onSuccess={setUser} />
        ) : !profile?.onboardingDone ? (
          <form onSubmit={saveOnboarding} className="card onboarding-panel">
            <div className="auth-intro"><p className="panel-kicker">01 · {lang === "hu" ? "Személyre szabás" : lang === "de" ? "Personalisierung" : "Personal setup"}</p><h2>{t.onboarding}</h2></div>
            <div className="onboarding-groups">
              <section className="setup-group"><span className="setup-group-title">{lang === "hu" ? "Cél" : lang === "de" ? "Ziel" : "Goal"}</span><label htmlFor="goal">{t.goal}<select id="goal" name="goal" className="field"><option value="weight_loss">{t.goals.weight_loss}</option><option value="maintenance">{t.goals.maintenance}</option><option value="energy">{t.goals.energy}</option><option value="medical_support">{t.goals.medical_support}</option><option value="learning">{t.goals.learning}</option></select></label></section>
              <section className="setup-group"><span className="setup-group-title">{lang === "hu" ? "Napi célértékek" : lang === "de" ? "Tagesziele" : "Daily targets"}</span><div className="grid gap-3 sm:grid-cols-2">
                <OnboardingField id="dailyKcal" label={t.fields.dailyKcal[0]} help={t.fields.dailyKcal[1]} defaultValue="1800"/>
                <OnboardingField id="dailyNetCarbs" label={t.fields.dailyNetCarbs[0]} help={t.fields.dailyNetCarbs[1]} defaultValue="25"/>
                <OnboardingField id="dailyProtein" label={t.fields.dailyProtein[0]} help={t.fields.dailyProtein[1]} defaultValue="110"/>
                <OnboardingField id="dailyFat" label={t.fields.dailyFat[0]} help={t.fields.dailyFat[1]} defaultValue="130"/>
                <OnboardingField id="dailyFiber" label={t.fields.dailyFiber[0]} help={t.fields.dailyFiber[1]} defaultValue="25"/>
              </div></section>
              <section className="setup-group"><span className="setup-group-title">{lang === "hu" ? "Ételprofil" : lang === "de" ? "Lebensmittelprofil" : "Food profile"}</span><div className="grid gap-3 sm:grid-cols-2">
                <OnboardingField id="preferences" label={t.fields.preferences[0]} help={t.fields.preferences[1]} placeholder="tojás, avokádó"/>
                <OnboardingField id="avoidedFoods" label={t.fields.avoidedFoods[0]} help={t.fields.avoidedFoods[1]} placeholder="cukor, kenyér"/>
                <OnboardingField id="allergies" label={t.fields.allergies[0]} help={t.fields.allergies[1]} placeholder="laktóz, diófélék"/>
              </div></section>
              <button className="btn primary w-full">{t.save}</button>
            </div>
          </form>
        ) : (
          <div className="card welcome-panel"><p className="panel-kicker">{lang === "hu" ? "Mai fókusz" : lang === "de" ? "Heutiger Fokus" : "Today’s focus"}</p><h2>{t.dashboard}</h2><p>{t.explain}</p></div>
        )}
      </section>

      {user && profile?.onboardingDone && (
        <section id="today" className="dashboard-shell">
          <div className="dashboard-main">
            <div className="macro-grid" aria-label={lang === "hu" ? "Napi makrók" : lang === "de" ? "Tägliche Makros" : "Daily macros"}>
              <Macro label="kcal" value={totals.kcal} goal={goals.dailyKcal}/>
              <Macro label="fat" value={totals.fat} goal={goals.dailyFat}/>
              <Macro label="protein" value={totals.protein} goal={goals.dailyProtein}/>
              <Macro label="net carbs" value={totals.netCarbs} goal={goals.dailyNetCarbs} emphasis warnOverLimit/>
              <Macro label="fiber" value={totals.fiber} goal={goals.dailyFiber}/>
              <MealCountTile label={t.diary.mealsLabel} value={meals.length}/>
            </div>
            <WeekOverviewCard
              week={week}
              lang={lang}
              selectedDate={selectedDate}
              today={today}
              isCurrentWeek={isCurrentWeek}
              onSelectDate={setSelectedDate}
              onPrevWeek={() => setWeekAnchor((current) => shiftDate(current, -7))}
              onNextWeek={() => setWeekAnchor((current) => shiftDate(current, 7))}
              labels={{ previousWeek: t.diary.week.previousWeek, nextWeek: t.diary.week.nextWeek, heading: t.diary.week.heading, loggedDaysSuffix: t.diary.week.loggedDaysSuffix, mealsLabel: t.diary.mealsLabel }}
            />
            <div className="card today-card">
              <div className="diary-date-nav">
                <button type="button" className="btn secondary icon-button" aria-label={t.diary.previousDay} onClick={() => setSelectedDate((current) => shiftDate(current, -1))}><ChevronLeft size={18}/></button>
                <h2 className="section-heading diary-date-heading"><Activity size={20}/>{selectedDate === todayLocalDate() ? t.today : formatDiaryDate(selectedDate, lang)}</h2>
                <button type="button" className="btn secondary icon-button" aria-label={t.diary.nextDay} disabled={selectedDate === todayLocalDate()} onClick={() => setSelectedDate((current) => shiftDate(current, 1))}><ChevronRight size={18}/></button>
              </div>
              <input type="date" className="field diary-date-input" aria-label={t.diary.selectDate} value={selectedDate} max={todayLocalDate()} onChange={(event) => event.target.value && setSelectedDate(event.target.value)}/>
              {mealStatus && <div className={`status ${mealStatus.kind}`} role={mealStatus.kind === "error" ? "alert" : "status"}>{mealStatus.text}</div>}
              {meals.length === 0 ? (
                <p className="diary-empty text-xs text-muted">{t.diary.noMeals}</p>
              ) : (
                <div className="meal-list">{meals.map((m) => (
                  <div className="meal" key={m.id}>
                    <div className="meal-copy"><strong>{m.title}</strong><time dateTime={m.eatenAt}>{formatMealTime(m.eatenAt, lang)}</time></div>
                    <span className="meal-macros">{Math.round(m.totals.kcal)} kcal · <b>{Math.round(m.totals.netCarbs)} g net</b></span>
                    <div className="meal-actions">
                      <button type="button" className="icon-button meal-action-btn" aria-label={t.diary.repeatMeal} onClick={() => setRepeatingMeal({ id: m.id, title: m.title })}><Repeat size={14}/></button>
                      <button type="button" className="icon-button meal-action-btn" aria-label={t.diary.editMeal} onClick={() => openEditMeal(m.id)}><Pencil size={14}/></button>
                      <button type="button" className="icon-button meal-action-btn" aria-label={t.diary.deleteMeal} onClick={() => setDeletingMealId(m.id)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
          <form id="log-meal" onSubmit={addMeal} className="card meal-entry-card space-y-3">
            <h2 className="section-heading"><Plus size={20}/>{t.addMeal}</h2>
            <div className="natural-input">
              <label htmlFor="natural-meal-input">{lang === "hu" ? "Mondd el, mit ettél" : lang === "de" ? "Beschreibe, was du gegessen hast" : "Describe what you ate"}</label>
              <p className="natural-input-helper">{lang === "hu" ? "Írj természetesen — az ellenőrzött tápértékeket mindig a katalógus adja." : lang === "de" ? "Natürlich formulieren — geprüfte Nährwerte kommen immer aus dem Katalog." : "Use natural language — verified nutrition always comes from the catalog."}</p>
              <div className="natural-input-row"><input id="natural-meal-input" className="field" value={naturalInput} onChange={(event) => { setNaturalInput(event.target.value); setInterpretation(null); setSelectedFood(null); setMealQuantity("1"); setMealMeasure("g"); setGramsOverride(""); }} placeholder={lang === "hu" ? "Például: 5 tojás" : lang === "de" ? "Zum Beispiel: 3 Scheiben Gouda" : "For example: 5 eggs"}/><button type="button" className="btn primary" disabled={interpreting || naturalInput.trim().length < 2} onClick={interpretNaturalInput}>{interpreting ? "…" : lang === "hu" ? "Értelmezés" : lang === "de" ? "Verstehen" : "Interpret"}</button></div>
              {interpretation && <FoodUnderstandingPreview value={interpretation} lang={lang} labels={t.foodUnderstanding} busy={mealSaving} onConfirmAll={confirmMultiMeal}/>}
              {interpretation?.clarification && (() => { const row = (interpretation.items ?? [interpretation])[interpretation.clarification!.itemIndex]; return <QuantityClarification key={`${interpretation.input}:${interpretation.clarification.itemIndex}`} value={interpretation.clarification} foodName={row?.selectedFood?.names?.[lang] ?? row?.selectedFood?.name ?? ""} quantity={row?.parsed.quantity} unit={row?.parsed.unit} lang={lang} onResolve={resolveClarification}/>; })()}
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
      {user && profile?.onboardingDone && (
        <section id="recipes">
          <RecipeBuilder lang={lang} state={state} currentUserId={user.id} onMealAdded={handleMealLogged}/>
        </section>
      )}
      {user && profile?.onboardingDone && <MobileNav lang={lang}/>}
      <footer className="app-footer">
        <div className="footer-inner">
          <a className="brand-link" href="https://norbapp.com" target="_blank" rel="noreferrer" aria-label="NorbApp weboldal megnyitasa">
            <img src={norbappLogo} alt="NorbApp"/><span>NorbApp · Keto Mentor</span>
          </a>
          <div className="footer-links">
            <a className="contact-link" href="https://norbapp.com" target="_blank" rel="noreferrer"><ExternalLink size={15}/>norbapp.com</a>
            <a className="contact-link" href="mailto:norbert@norbapp.com"><Mail size={15}/>norbert@norbapp.com</a>
          </div>
        </div>
      </footer>
      {editingMeal && <MealEditDialog meal={editingMeal} lang={lang} state={state} onCancel={() => setEditingMeal(null)} onSaved={handleMealEdited}/>}
      {deletingMealId && <DeleteMealDialog lang={lang} onCancel={() => setDeletingMealId(null)} onConfirm={confirmDeleteMeal}/>}
      {repeatingMeal && <RepeatMealDialog title={repeatingMeal.title} lang={lang} onCancel={() => setRepeatingMeal(null)} onConfirm={confirmRepeatMeal}/>}
    </main>
  );
}

function Macro({ label, value, goal, emphasis = false, warnOverLimit = false }: { label: string; value: number; goal: number; emphasis?: boolean; warnOverLimit?: boolean }) {
  const rawPct = goal > 0 ? Math.round((value / goal) * 100) : 0;
  const isOverLimit = warnOverLimit && value > goal;
  const barPct = Math.min(100, rawPct);
  // Every other macro caps its displayed percentage at 100%, same as the
  // progress bar. Net carbs (warnOverLimit) is the one macro where going
  // over the limit is itself the signal worth seeing, so its number is
  // allowed to read past 100% instead of looking identical to "on target".
  const displayPct = warnOverLimit ? rawPct : barPct;
  return (
    <div className={`metric-tile ${emphasis ? "is-primary" : ""} ${isOverLimit ? "is-over-limit" : ""}`}>
      <div className="metric-label">{label}</div>
      <strong className="metric-value">{Math.round(value)}</strong>
      <div className="metric-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.round(value)}><div className="metric-progress" style={{ width: `${barPct}%` }}/></div>
      <small className="metric-goal">{displayPct}% · {goal}</small>
    </div>
  );
}

function MealCountTile({ label, value }: { label: string; value: number }) {
  return <div className="metric-tile metric-tile-count"><div className="metric-label">{label}</div><strong className="metric-value">{value}</strong></div>;
}

function formatMealTime(value: string, lang: Lang) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "hu" ? "hu-HU" : lang === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatDiaryDate(dateStr: string, lang: Lang) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat(lang === "hu" ? "hu-HU" : lang === "de" ? "de-DE" : "en-GB", { weekday: "short", month: "short", day: "numeric" }).format(date);
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

export function externalConfirmationSuccessText(lang: Lang, status: "confirmed" | "existing") {
  if (status === "confirmed") return lang === "hu" ? "Az élelmiszer hozzá lett adva és ki lett választva." : lang === "de" ? "Das Lebensmittel wurde hinzugefügt und ausgewählt." : "The food was added and selected.";
  return lang === "hu" ? "Meglévő katalóguselem található, és ki lett választva." : lang === "de" ? "Ein vorhandener Katalogeintrag wurde gefunden und ausgewählt." : "An existing catalog item was found and selected.";
}

export function FoodCombobox({ lang, state, selected, onSelect, labels, resetVersion, idPrefix = "food" }: { lang: Lang; state: ApiState; selected: Food | null; onSelect: (food: Food | null) => void; labels: SearchLabels; resetVersion: number; idPrefix?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalMessage, setExternalMessage] = useState("");
  const [externalCandidates, setExternalCandidates] = useState<Array<{ name: string; source: "usda_fdc"; sourceId: string; confidence: number; kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number }>>([]);
  const [confirmingSourceId, setConfirmingSourceId] = useState<string | null>(null);

  useEffect(() => { setQuery(""); setResults([]); setOpen(false); setActive(-1); setExternalMessage(""); setExternalCandidates([]); }, [resetVersion]);

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

  const choose = (food: Food) => { onSelect(food); setQuery(food.names?.[lang] ?? food.name); setOpen(false); setExternalMessage(""); setExternalCandidates([]); };
  async function searchExternal() {
    if (externalLoading || query.trim().length < 2) return;
    setOpen(false); setExternalLoading(true); setExternalMessage(""); setExternalCandidates([]);
    try {
      const result = await api<any>("/foods/resolve-external", { method: "POST", body: JSON.stringify({ query }) }, state);
      if (result.status === "resolved_local" || result.status === "resolved_external") {
        choose(result.food as Food);
        setExternalMessage(result.status === "resolved_external" ? "Authoritative external food added." : "Existing catalog food found.");
      } else if (result.status === "confirmation_required") {
        setExternalCandidates(result.candidates);
        setExternalMessage("Multiple or duplicate candidates need confirmation; nothing was added.");
      } else if (result.reason === "external_unavailable") setExternalMessage("Trusted external sources are currently unavailable; nothing was added.");
      else if (result.reason === "invalid_external_data") setExternalMessage("The external result was incomplete or invalid; nothing was added.");
      else setExternalMessage("No trustworthy structured-source match was found; nothing was added.");
    } catch { setExternalMessage("External source lookup is currently unavailable."); }
    finally { setExternalLoading(false); }
  }
  async function confirmExternal(candidate: (typeof externalCandidates)[number]) {
    if (confirmingSourceId) return;
    setConfirmingSourceId(candidate.sourceId); setExternalMessage("");
    try {
      const result = await api<any>("/foods/resolve-external/confirm", {
        method: "POST", body: JSON.stringify({ source: candidate.source, sourceId: candidate.sourceId })
      }, state);
      if (result.status === "confirmed" || result.status === "existing") {
        choose(result.food as Food);
        setExternalMessage(externalConfirmationSuccessText(lang, result.status));
      } else if (result.status === "confirmation_required") {
        setExternalMessage(lang === "hu" ? "Lehetséges duplikátum miatt semmi nem került hozzáadásra." : lang === "de" ? "Wegen eines möglichen Duplikats wurde nichts hinzugefügt." : "Nothing was added because a possible duplicate needs review.");
      } else setExternalMessage(lang === "hu" ? "A forrásadat nem volt elérhető vagy érvényes; semmi nem került hozzáadásra." : lang === "de" ? "Die Quelldaten waren nicht verfügbar oder ungültig; nichts wurde hinzugefügt." : "The source data was unavailable or invalid; nothing was added.");
    } catch { setExternalMessage(lang === "hu" ? "A hozzáadás nem sikerült; semmi nem került hozzáadásra." : lang === "de" ? "Das Hinzufügen ist fehlgeschlagen; nichts wurde hinzugefügt." : "The food could not be added; nothing was added."); }
    finally { setConfirmingSourceId(null); }
  }
  return (
    <div className="combobox-wrap">
      <label htmlFor={`${idPrefix}-search`}>{labels.label}</label>
      <input id={`${idPrefix}-search`} className="field" role="combobox" autoComplete="off" value={query} placeholder={labels.placeholder}
        aria-expanded={open} aria-controls={`${idPrefix}-results`} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${idPrefix}-option-${active}` : undefined}
        onChange={(event) => { setQuery(event.target.value); onSelect(null); setOpen(true); setExternalMessage(""); setExternalCandidates([]); }}
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
      {!selected && !loading && results.length === 0 && query.trim().length >= 2 && <button type="button" className="btn secondary" disabled={externalLoading} onClick={searchExternal}>{externalLoading ? "…" : "Search trusted external sources"}</button>}
      {externalMessage && <small className="search-hint" role="status">{externalMessage}</small>}
      {externalCandidates.length > 0 && <ul className="space-y-2">{externalCandidates.map((candidate) => <li className="rounded-xl border border-borderSoft p-3" key={`${candidate.source}:${candidate.sourceId}`}>
        <strong>{candidate.name}</strong>
        <div className="text-xs text-muted">USDA · {Math.round(candidate.kcalPer100g)} kcal · fat {candidate.fatPer100g} g · protein {candidate.proteinPer100g} g · carbs {candidate.carbsPer100g} g · fiber {candidate.fiberPer100g} g / 100 g · policy {Math.round(candidate.confidence * 100)}</div>
        <button type="button" className="btn secondary mt-2" disabled={confirmingSourceId !== null} aria-busy={confirmingSourceId === candidate.sourceId} onClick={() => confirmExternal(candidate)}>
          {confirmingSourceId === candidate.sourceId ? "…" : lang === "hu" ? "Hozzáadás az adatbázishoz" : lang === "de" ? "Zur Datenbank hinzufügen" : "Add to catalog"}
        </button>
      </li>)}</ul>}
      {!selected && <BarcodeLookup lang={lang} state={state} onFoodConfirmed={choose}/>}
    </div>
  );
}

function mealErrorText(error: unknown, labels: Record<string, string>) {
  if (!(error instanceof ApiError)) return labels.unknown;
  return labels[error.code] ?? (error.status === 401 ? labels.unauthorized : error.status && error.status >= 500 ? labels.server : labels.unknown);
}

const rootElement = document.getElementById("root");
if (rootElement) createRoot(rootElement).render(<App />);
