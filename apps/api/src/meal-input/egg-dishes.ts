import type { FoodUnderstanding } from "@keto-mentor/shared";
import { normalizeSearch } from "../catalog/normalize.js";

// Owner feedback (2026-10-20): "ha egyszer már a tojást tudja, hogy hány
// darab, akkor a rántottát nem kell külön fölírnia, mivel a kettő ugyanaz."
// Eggs and an egg dish made of them are ONE item: the eggs, prepared that
// way. "6 tojás rántotta" already resolved like that; the other word orders
// ("3 tojásos rántotta", "rántotta 3 tojásból", "Rührei aus 3 Eiern",
// "omelette with 3 eggs") are brought to that form here, in the input's own
// language, before interpretation. Only phrases that state an egg count are
// touched; "rántotta" alone keeps its reference dish.

const L = "\\p{L}";
const END = `(?![${L}])`;
const START = `(?<![${L}])`;
const HU_NUM = "\\d+|egy|két|kettő|három|négy|öt|hat|hét|nyolc|kilenc|tíz";
const DE_NUM = "\\d+|ein|einem|einer|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn";
const EN_NUM = "\\d+|one|two|three|four|five|six|seven|eight|nine|ten";
const HU_DISH = "rántott[aá]|omlett|tükörtojás";
const DE_DISH = "Rührei(?:er)?|Omelett(?:e)?|Spiegelei(?:er)?";
const EN_DISH = "scrambled eggs?|omelett?e|omelet|fried eggs?";

const rx = (source: string) => new RegExp(source, "giu");
const huDish = (word: string) => (/^rántott/i.test(word) ? "rántotta" : word.toLowerCase());

const RULES: Array<[RegExp, (...groups: string[]) => string]> = [
  // 6 tojás rántottának / rántottaként
  [rx(`${START}(${HU_NUM})\\s+tojás\\s+(?:rántottának|rántottaként|rántottára)${END}`), (_m, n) => `${n} tojás rántotta`],
  // rántotta 3 tojásból / omlett 2 tojásból készült
  [rx(`${START}(${HU_DISH})\\s+(${HU_NUM})\\s+tojásból(?:\\s+(?:készült|sütve|sütött))?${END}`), (_m, dish, n) => `${n} tojás ${huDish(dish)}`],
  // 3 tojásos rántotta / 3 tojásból (készült) rántotta / 3 tojásból omlett
  [rx(`${START}(${HU_NUM})\\s+tojás(?:os|ból(?:\\s+(?:készült|sütött))?)\\s+(${HU_DISH})${END}`), (_m, n, dish) => `${n} tojás ${huDish(dish)}`],
  // Rührei aus 3 Eiern / Omelett mit 3 Eiern
  [rx(`${START}(${DE_DISH})\\s+(?:aus|mit|von)\\s+(${DE_NUM})\\s+Eiern?${END}`), (_m, dish, n) => `${n} Eier ${dish}`],
  // 3-Eier-Omelett / 3 Eier-Rührei
  [rx(`${START}(${DE_NUM})[- ]Eier-(${DE_DISH})${END}`), (_m, n, dish) => `${n} Eier ${dish}`],
  // omelette with 3 eggs / scrambled eggs from 2 eggs
  [rx(`${START}(${EN_DISH})\\s+(?:with|from|of|made (?:with|from))\\s+(${EN_NUM})\\s+eggs?${END}`), (_m, dish, n) => `${n} eggs ${dish.toLowerCase().replace(/ eggs?$/, "")}`],
  // 3-egg omelette / 2 egg scrambled eggs
  [rx(`${START}(${EN_NUM})[- ]egg\\s+(${EN_DISH})${END}`), (_m, n, dish) => `${n} eggs ${dish.toLowerCase().replace(/ eggs?$/, "")}`]
];

export function normalizeEggDishPhrases(text: string): string {
  return RULES.reduce((current, [pattern, replace]) => current.replace(pattern, replace as any), text);
}

// Egg-dish words that act as a preparation of the eggs when an egg word is
// in the same phrase (natural-food-query.ts), normalized (no accents).
export const EGG_WORDS = new Set(["tojas", "ei", "eier", "egg", "eggs"]);
export const EGG_DISH_PREPARATION: Record<string, string> = {
  rantotta: "scrambled", rantottanak: "scrambled", rantottakent: "scrambled", tojasrantotta: "scrambled",
  omlett: "scrambled", omelett: "scrambled", omelette: "scrambled", omelet: "scrambled",
  ruhrei: "scrambled", ruhreier: "scrambled", scrambled: "scrambled",
  tukortojas: "fried", spiegelei: "fried", spiegeleier: "fried", fried: "fried"
};

const DISH_NAMES: Record<string, string> = {
  ...EGG_DISH_PREPARATION, "scrambled egg": "scrambled", "scrambled eggs": "scrambled", "fried egg": "fried", "fried eggs": "fried", "tojasos omlett": "scrambled"
};
const isEgg = (name: string) => normalizeSearch(name).split(" ").some((token) => EGG_WORDS.has(token));

/**
 * The AI sometimes still returns the egg dish next to the eggs ("rántotta" +
 * "tojás, 3 db"). Merged into the egg item with that preparation; a dishName
 * that was only the egg dish is dropped. Anything else is left as it is.
 */
export function mergeEggDishItems(understanding: FoodUnderstanding): FoodUnderstanding {
  const egg = understanding.items.find((item) => isEgg(item.canonicalName) && item.quantity != null && !DISH_NAMES[normalizeSearch(item.canonicalName)]);
  if (!egg) return understanding;
  const prepOf = (name?: string) => (name ? DISH_NAMES[normalizeSearch(name)] : undefined);
  const dishItems = understanding.items.filter((item) => item !== egg && prepOf(item.canonicalName));
  const dishPrep = prepOf(understanding.dishName) ?? prepOf(dishItems[0]?.canonicalName);
  if (!dishPrep) return understanding;
  const items = understanding.items.filter((item) => !dishItems.includes(item)).map((item) => (item === egg ? { ...item, preparation: item.preparation ?? dishPrep } : item));
  const dishOnlyEggs = !!prepOf(understanding.dishName);
  return {
    ...understanding,
    items,
    ...(dishOnlyEggs ? { dishName: undefined, kind: items.length > 1 ? "multiple_foods" as const : "single_food" as const } : {})
  };
}
