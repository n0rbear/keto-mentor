import { useState } from "react";
import type { Lang } from "./i18n";

// "Melyik étkezés?" (owner decision 2026-10-15): every logged meal says which
// meal it is. The time of day suggests one, the user can always change it,
// and "Saját…" takes the user's own name (remembered in this browser).

export const MEAL_TYPES = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "snack", "custom"] as const;
export type MealType = (typeof MEAL_TYPES)[number];
export type MealChoice = { type: MealType; label: string };

export const MEAL_TYPE_LABELS: Record<Lang, Record<MealType, string>> = {
  hu: { breakfast: "Reggeli", morning_snack: "Tízórai", lunch: "Ebéd", afternoon_snack: "Uzsonna", dinner: "Vacsora", snack: "Nasi", custom: "Saját…" },
  de: { breakfast: "Frühstück", morning_snack: "Zwischenmahlzeit (vormittags)", lunch: "Mittagessen", afternoon_snack: "Nachmittagssnack", dinner: "Abendessen", snack: "Snack", custom: "Eigene…" },
  en: { breakfast: "Breakfast", morning_snack: "Morning snack", lunch: "Lunch", afternoon_snack: "Afternoon snack", dinner: "Dinner", snack: "Snack", custom: "Custom…" }
};

const copy = {
  hu: { legend: "Melyik étkezés?", custom: "Saját étkezésnév", placeholder: "pl. Edzés utáni" },
  de: { legend: "Welche Mahlzeit?", custom: "Eigener Mahlzeitname", placeholder: "z. B. Nach dem Training" },
  en: { legend: "Which meal?", custom: "Your own meal name", placeholder: "e.g. Post-workout" }
} as const;

/** The usual meal at this local time: 4–10 breakfast, 10–11:30 morning snack, 11:30–14:30 lunch, 14:30–17:30 afternoon snack, 17:30–22 dinner, otherwise snack. */
export function suggestMealType(at: Date = new Date()): MealType {
  const minutes = at.getHours() * 60 + at.getMinutes();
  if (minutes >= 4 * 60 && minutes < 10 * 60) return "breakfast";
  if (minutes >= 10 * 60 && minutes < 11 * 60 + 30) return "morning_snack";
  if (minutes >= 11 * 60 + 30 && minutes < 14 * 60 + 30) return "lunch";
  if (minutes >= 14 * 60 + 30 && minutes < 17 * 60 + 30) return "afternoon_snack";
  if (minutes >= 17 * 60 + 30 && minutes < 22 * 60) return "dinner";
  return "snack";
}

export const suggestedChoice = (at?: Date): MealChoice => ({ type: suggestMealType(at), label: "" });

/** Request fields for the API; null while a custom type has no name yet. */
export function mealTypeFields(choice: MealChoice): { mealType: MealType; mealTypeLabel?: string } | null {
  if (choice.type !== "custom") return { mealType: choice.type };
  const label = choice.label.trim().slice(0, 40);
  return label ? { mealType: "custom", mealTypeLabel: label } : null;
}

/** How a saved meal's type reads in the diary (empty for meals logged before types existed). */
export function mealTypeText(meal: { mealType?: string | null; mealTypeLabel?: string | null }, lang: Lang): string {
  if (!meal.mealType) return "";
  if (meal.mealType === "custom") return meal.mealTypeLabel ?? "";
  return MEAL_TYPE_LABELS[lang][meal.mealType as MealType] ?? "";
}

const RECENT_KEY = "km_custom_meal_types";
function recentCustom(): string[] {
  try { const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(value) ? value.filter((v) => typeof v === "string").slice(0, 8) : []; } catch { return []; }
}
export function rememberCustomMealType(label: string) {
  const clean = label.trim().slice(0, 40);
  if (!clean) return;
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([clean, ...recentCustom().filter((v) => v.toLowerCase() !== clean.toLowerCase())].slice(0, 8))); } catch { /* storage unavailable */ }
}

export function MealTypePicker({ lang, value, onChange, idPrefix = "meal-type" }: { lang: Lang; value: MealChoice; onChange: (next: MealChoice) => void; idPrefix?: string }) {
  const t = copy[lang];
  const labels = MEAL_TYPE_LABELS[lang];
  const [recent] = useState(recentCustom);
  return (
    <fieldset className="meal-type-picker">
      <legend>{t.legend}</legend>
      <div className="meal-type-options" role="radiogroup" aria-label={t.legend}>
        {MEAL_TYPES.map((type) => (
          <button key={type} type="button" role="radio" aria-checked={value.type === type} className={`chip ${value.type === type ? "active" : ""}`} onClick={() => onChange({ type, label: type === "custom" ? value.label : "" })}>{labels[type]}</button>
        ))}
      </div>
      {value.type === "custom" && (
        <label htmlFor={`${idPrefix}-custom`} className="meal-type-custom">{t.custom}
          <input id={`${idPrefix}-custom`} className="field" maxLength={40} required placeholder={t.placeholder} list={`${idPrefix}-recent`} value={value.label} onChange={(event) => onChange({ type: "custom", label: event.target.value })}/>
          <datalist id={`${idPrefix}-recent`}>{recent.map((label) => <option key={label} value={label}/>)}</datalist>
        </label>
      )}
    </fieldset>
  );
}
