import { normalizeSearch } from "./normalize.js";

/**
 * A prepared drink is never its dry form (owner report 2026-09-27: "presszó
 * kávé egy csepp tejszínnel" was offered the Jacobs "Mokka" OFF product —
 * ground/instant coffee at 385 kcal and 68 g carbs per 100 g — next to the
 * real espresso at ~2–9 kcal). The same trap exists for every drink that is
 * sold as a powder, granule, bean or leaf: coffee, espresso, cappuccino,
 * tea. This guard is deterministic and only ever REMOVES candidates.
 *
 * Drink intent: the identity names a drink and does not name its dry form
 * ("instant kávé", "őrölt kávé", "Kaffeepulver") or a food made with it
 * ("kávés torta", "coffee cake", "tiramisu").
 * Dry candidate: its name says powder/instant/ground/beans without also
 * saying it is the drink ("Kaffee (Getränk) aus Instantpulver" is a drink),
 * or it carries more carbohydrate than any unsweetened-to-sweet coffee or
 * tea drink does (> 25 g/100 g). Energy alone is not used: a keto
 * bulletproof coffee legitimately has ~250 kcal/100 g, but almost no carbs.
 */
const DRINK_WORDS = new Set([
  "kave", "kavet", "kaveval", "kavek", "presszo", "presszot", "eszpresszo", "eszpresszot", "espresso", "espressot", "espressos",
  "kaffee", "coffee", "cappuccino", "capuccino", "kapucsino", "latte", "macchiato", "americano", "lungo", "ristretto", "mokka", "mocca",
  "tea", "teat", "teaval", "tee", "teas"
]);
const DRY_WORDS = ["pulver", "powder", "por", "kaveport", "instant", "orolt", "ground", "bohne", "bohnen", "bean", "beans", "szemes", "granulat", "granules", "kapszula", "capsule", "kapsel", "pad", "pads", "blatter", "leaves", "level", "filteres", "teefilter"];
const FOOD_WITH_DRINK_WORDS = ["torta", "tortat", "sutemeny", "suti", "cake", "kuchen", "fagylalt", "eis", "icecream", "tiramisu", "mousse", "pudding", "keksz", "cookie", "cookies", "bonbon", "csoki", "chocolate", "schokolade", "likor", "liqueur", "krem", "creme"];
const DRINK_MARKERS = ["getrank", "beverage", "beverages", "brewed", "prepared", "zubereitet", "ital", "aufguss", "infusion"];
const DRY_CARBS_PER_100G = 25;

const tokens = (text: string) => normalizeSearch(text).split(" ").filter(Boolean);
// "Instantkaffeepulver", "kávépor": dry words also hide inside compounds.
const hasDryWord = (words: readonly string[]) => words.some((word) => DRY_WORDS.some((dry) => word === dry || (dry.length >= 5 && word.includes(dry)) || (word.endsWith(dry) && dry.length >= 3 && word.length > dry.length + 3)));

export function wantsPreparedDrink(identities: ReadonlyArray<string | undefined>): boolean {
  const words = identities.flatMap((identity) => identity ? tokens(identity) : []);
  if (!words.some((word) => DRINK_WORDS.has(word))) return false;
  return !hasDryWord(words) && !words.some((word) => FOOD_WITH_DRINK_WORDS.includes(word));
}

export function isDryFormOfDrink(candidate: { name?: string | null; originalName?: string | null; carbsPer100g?: number | null }): boolean {
  const words = tokens(`${candidate.name ?? ""} ${candidate.originalName ?? ""}`);
  if (hasDryWord(words) && !words.some((word) => DRINK_MARKERS.includes(word))) return true;
  return Number(candidate.carbsPer100g ?? 0) > DRY_CARBS_PER_100G;
}

/** Drops dry forms from a candidate list when the user means the drink. */
export function withoutDryFormsForDrink<T extends { name?: string | null; originalName?: string | null; carbsPer100g?: number | null }>(identities: ReadonlyArray<string | undefined>, candidates: readonly T[]): T[] {
  return wantsPreparedDrink(identities) ? candidates.filter((candidate) => !isDryFormOfDrink(candidate)) : [...candidates];
}
