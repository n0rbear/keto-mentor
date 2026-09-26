import { normalizeSearch } from "../catalog/normalize.js";

/**
 * Typical weight of one slice for common sliced foods, used only when the
 * matched food has no slice serving of its own (owner request 2026-09-26:
 * "3 szelet felvágott", "4 szelet sajt" must not need an AI call or the
 * user's grams). Values are ordinary retail pre-sliced weights in HU/DE/AT;
 * they are estimates, so the result stays editable before saving.
 *
 * Order matters: the first entry whose keyword appears in the food's names
 * wins, so the specific kinds (salami, bacon) come before the broad ones.
 */
type SliceWeight = { key: string; grams: number; keywords: readonly string[] };

export const GENERIC_SLICE_WEIGHTS: readonly SliceWeight[] = [
  { key: "salami", grams: 8, keywords: ["szalami", "salami", "chorizo", "pepperoni", "teli szalami", "csabai", "gyulai", "kolbasz"] },
  { key: "bacon", grams: 10, keywords: ["bacon", "szalonna", "speck", "frühstucksspeck", "fruhstucksspeck"] },
  { key: "prosciutto", grams: 10, keywords: ["prosciutto", "serrano", "parmaschinken", "pármai sonka", "parmai sonka", "rohschinken", "lachsschinken"] },
  { key: "ham", grams: 15, keywords: ["sonka", "ham", "schinken", "kochschinken", "pulykamell", "csirkemell sonka", "putenbrust", "turkey breast"] },
  { key: "sausage_slice", grams: 15, keywords: ["parizsi", "lyoner", "mortadella", "bologna", "fleischwurst", "extrawurst", "felvagott", "aufschnitt", "cold cut", "lunch meat", "luncheon"] },
  { key: "cheese", grams: 20, keywords: ["sajt", "cheese", "kase", "käse", "gouda", "edami", "edam", "trappista", "emmentaler", "emmental", "cheddar", "tilsiter", "leerdammer", "maasdam", "mozzarella", "butterkase"] },
  { key: "toast", grams: 25, keywords: ["toast", "toastbrot", "bundaskenyer"] },
  { key: "bread", grams: 35, keywords: ["kenyer", "bread", "brot", "rozskenyer", "vollkornbrot", "graham", "cipo"] }
];

// "Rántotta 3 tojásból" (live 2026-09-26): the count is eggs, and an egg
// dish without its own egg serving still weighs about one egg per egg.
export const GENERIC_PIECE_WEIGHTS: readonly SliceWeight[] = [
  { key: "egg", grams: 50, keywords: ["tojas", "rantotta", "omlett", "egg", "eggs", "scrambled", "omelet", "omelette", "ei", "eier", "ruhrei", "spiegelei"] }
];

const TABLES: Record<string, readonly SliceWeight[]> = { slice: GENERIC_SLICE_WEIGHTS, piece: GENERIC_PIECE_WEIGHTS };

export function genericUnitWeight(unit: string, food: { name: string; searchText?: string; names?: Record<string, string> }): SliceWeight | null {
  const table = TABLES[unit];
  if (!table) return null;
  const words = ` ${normalizeSearch([food.name, food.searchText ?? "", ...Object.values(food.names ?? {})].join(" "))} `;
  // Short keywords must be whole words ("ham" never matches "hamburger");
  // longer ones may carry a suffix ("sonkát", "szalámis").
  const mentions = (keyword: string) => { const key = normalizeSearch(keyword); return words.includes(key.length <= 4 ? ` ${key} ` : ` ${key}`); };
  return table.find((entry) => entry.keywords.some(mentions)) ?? null;
}
