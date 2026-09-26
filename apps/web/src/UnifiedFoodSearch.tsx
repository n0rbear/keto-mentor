import { useEffect, useRef, useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { api, type ApiState } from "./api";
import type { Lang } from "./i18n";
import type { Food } from "./main";
import { pickDisplayName } from "./food-display-name";
import type { LocalRecipeOption } from "./FoodUnderstandingPreview";

// One search field (owner goal 2026-09-26, roadmap G2): barcode, ingredient,
// own recipe and Keto Mentor reference dish. Typing only asks GET /search
// (no AI). If the name finds nothing, one meaning-based retry is made
// (E4). Enter keeps the full natural-language interpretation.

type RecipeItem = { type: "recipe"; recipeId: string; title: string; source: "own" | "reference"; servings: number | null; servingGrams: number | null };
// amount: the sentence's quantity in this food's units ("négy tojás" -> 4
// egg servings), so picking the food keeps what the user already said.
export type FoodAmount = { quantity: number; servingId?: string; grams: number };
type FoodItem = { type: "food"; food: Food & { match?: { stage: string; score: number } }; via: "name" | "meaning"; amount?: FoodAmount };
type SearchResult = { kind: "barcode"; barcode: string } | { kind: "results"; query: string; items: Array<RecipeItem | FoodItem>; meaning: { tried: boolean; terms: string[] } };

const texts = {
  hu: { own: "Saját recept", reference: "Ételadatbázis", food: "Alapanyag", meaning: "jelentés szerint", serving: "1 adag ≈ {g} g", none: "Nincs találat a név alapján. Nyomj Entert, és értelmezem a teljes mondatot." },
  de: { own: "Eigenes Rezept", reference: "Gerichtedatenbank", food: "Zutat", meaning: "nach Bedeutung", serving: "1 Portion ≈ {g} g", none: "Kein Treffer nach Namen. Mit Enter wird der ganze Satz ausgewertet." },
  en: { own: "Your recipe", reference: "Dish database", food: "Ingredient", meaning: "by meaning", serving: "1 serving ≈ {g} g", none: "No match by name. Press Enter to interpret the whole sentence." }
} as const;

const BARCODE = /^\d{8,14}$/;
const MEANING_DELAY_MS = 900;
/** Only a finished-looking word is worth a meaning search: at least 3 letters, not a bare number or unit. */
export const wantsMeaningSearch = (query: string) => {
  const words = query.trim().split(/\s+/).filter((word) => /\p{L}{3,}/u.test(word));
  return words.length > 0 && /\p{L}{3,}/u.test(query.trim().split(/\s+/).pop() ?? "");
};
export const isBarcodeInput = (value: string) => BARCODE.test(value.replace(/\s+/g, ""));

export function UnifiedFoodSearch({ lang, state, value, disabled, onPickFood, onPickRecipe }: {
  lang: Lang; state: ApiState; value: string; disabled?: boolean;
  onPickFood: (food: Food, amount?: FoodAmount) => void; onPickRecipe: (option: LocalRecipeOption) => void;
}) {
  const t = texts[lang];
  const [items, setItems] = useState<Array<RecipeItem | FoodItem>>([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState("");
  const latest = useRef("");

  useEffect(() => {
    const query = value.trim();
    latest.current = query;
    if (query.length < 2 || isBarcodeInput(query) || disabled) { setItems([]); setOpen(false); return; }
    let meaningTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      try {
        const first = await api<SearchResult>(`/search?q=${encodeURIComponent(query)}`, {}, state);
        if (latest.current !== query || first.kind !== "results") return;
        setItems(first.items.slice(0, 10)); setSearched(query); setOpen(true);
        const trusted = first.items.some((item) => item.type === "recipe" || (item.type === "food" && (item.food.match?.stage === "exact" || item.food.match?.stage === "alias")));
        // The meaning search costs an AI call, so it waits until typing has
        // stopped and the last word looks finished (live 2026-09-26: "1 tá",
        // "1 tány", "1 tányé"... each spent one).
        if (trusted || !wantsMeaningSearch(query)) return;
        meaningTimer = setTimeout(async () => {
          try {
            const second = await api<SearchResult>(`/search?q=${encodeURIComponent(query)}&meaning=1`, {}, state);
            if (latest.current !== query || second.kind !== "results") return;
            setItems(second.items.slice(0, 10)); setSearched(query); setOpen(true);
          } catch { /* keep the name results */ }
        }, MEANING_DELAY_MS);
      } catch {
        if (latest.current === query) { setItems([]); setOpen(false); }
      }
    }, 300);
    return () => { clearTimeout(timer); if (meaningTimer) clearTimeout(meaningTimer); };
  }, [value, disabled, state]);

  const close = () => { setOpen(false); };
  return <div className="unified-search">
    {open && searched === value.trim() && <ul className="unified-search-results" role="listbox" aria-label={value}>
      {items.length === 0 && <li className="unified-search-empty">{t.none}</li>}
      {items.map((item) => item.type === "recipe"
        ? <li key={`r-${item.recipeId}`} role="option" aria-selected="false">
          <button type="button" onClick={() => { close(); onPickRecipe({ recipeId: item.recipeId, title: item.title, source: item.source, servings: item.servings, servingGrams: item.servingGrams }); }}>
            <BookOpen aria-hidden="true" size={15}/> <span>{item.title}</span>
            <small>{item.source === "own" ? t.own : t.reference}{item.servingGrams ? ` · ${t.serving.replace("{g}", String(Math.round(item.servingGrams)))}` : ""}</small>
          </button>
        </li>
        : <li key={`f-${item.food.id}`} role="option" aria-selected="false">
          <button type="button" onClick={() => { close(); onPickFood(item.food, item.amount); }}>
            <span>{pickDisplayName(item.food, lang) || item.food.name}</span>
            <small>{t.food}{item.amount ? ` · ${Math.round(item.amount.grams)} g` : ""}{item.via === "meaning" ? <> · <Sparkles aria-hidden="true" size={12}/> {t.meaning}</> : null}</small>
          </button>
        </li>)}
    </ul>}
  </div>;
}
