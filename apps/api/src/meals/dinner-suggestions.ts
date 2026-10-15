import type { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "../catalog/normalize.js";
import { calculateRecipeNutrition } from "../recipes/nutrition.js";
import { REFERENCE_USERNAME } from "../reference-dishes/seed.js";

// Vacsoraajánló (owner decisions 2026-10-15): suggests a dinner from the
// user's own recipes and the reviewed reference dishes, only at one usual
// serving, that keeps the day under the net-carb target and the calorie
// target, fills the missing protein where it can, leaves out avoided foods
// and allergens, and never repeats a dish already eaten that day. No AI and
// no invented nutrition: every number is the recipe's own calculation.

export type Lang = "hu" | "de" | "en";
export type Macros = { kcal: number; protein: number; netCarbs: number; fat: number };
export type DinnerCandidate = {
  recipeId: string;
  source: "own" | "reference";
  titles: { hu: string; de: string; en: string };
  dishId: string;
  servingGrams: number | null;
  perServing: Macros;
  // Normalized title and ingredient names, for avoided foods and allergens.
  haystack: string;
  lowCarbFriendly: boolean;
  // For variety: cooking style (soup, stew, roast, fried…) and main protein.
  style: string;
  protein: string;
};
export type DinnerSuggestion = Omit<DinnerCandidate, "haystack" | "lowCarbFriendly" | "dishId" | "titles" | "style" | "protein"> & { title: string; after: Macros };
// "Ha maradt az ebédből…" (owner idea 2026-10-15): an earlier meal of the
// day that would fit again, offered as an extra at the same portion.
export type EatenMeal = { id: string; title: string; mealType: string | null; mealTypeLabel: string | null; totals: Macros };
export type LeftoverSuggestion = { mealId: string; title: string; mealType: string | null; mealTypeLabel: string | null; perServing: Macros; after: Macros };
export type DinnerResult = {
  remaining: Macros;
  status: "ok" | "carb_budget_used" | "kcal_budget_used" | "nothing_fits";
  suggestions: DinnerSuggestion[];
  leftovers: LeftoverSuggestion[];
};
const LEFTOVER_TYPES = new Set(["breakfast", "morning_snack", "lunch", "afternoon_snack", "custom"]);

// Reference dishes that are not a dinner main: sweets, bakery, side dishes.
const NOT_A_DINNER = new Set(["sweet", "dessert", "cake", "pastry", "cookies", "bakery", "bread", "side"]);

// A profile entry like "laktóz" names no ingredient, so the common allergen
// groups are widened to the ingredient words they stand for (HU/DE/EN).
const ALLERGEN_GROUPS: Array<[string[], string[]]> = [
  [["laktoz", "tejtermek", "tej", "laktose", "milchprodukte", "milch", "lactose", "dairy", "milk"],
    ["tej", "sajt", "tejfol", "tejszin", "vaj", "joghurt", "turo", "kefir", "mozzarella", "parmezan", "gouda", "trappista", "edami", "feta", "mascarpone", "milch", "kase", "sahne", "butter", "quark", "milk", "cheese", "cream", "yogurt"]],
  [["glutén", "gluten", "buza", "weizen", "wheat"],
    ["liszt", "kenyer", "zsemle", "teszta", "morzsa", "buza", "kifli", "bucsa", "galuska", "nokedli", "mehl", "brot", "semmel", "nudel", "weizen", "spatzle", "knodel", "flour", "bread", "pasta", "wheat", "spaghetti", "penne", "makaroni"]],
  [["diofelek", "dio", "mogyoro", "nusse", "nuts", "nut"],
    ["dio", "mogyoro", "mandula", "kesudio", "pekandio", "pisztacia", "nuss", "haselnuss", "walnuss", "mandel", "nut", "almond", "hazelnut", "walnut", "pistachio", "cashew"]],
  [["tojas", "ei", "eier", "egg", "eggs"], ["tojas", "ei", "eier", "egg"]],
  [["hal", "fisch", "fish"], ["hal", "ponty", "harcsa", "lazac", "tonhal", "fisch", "lachs", "forelle", "thunfisch", "fish", "salmon", "trout", "tuna", "carp"]],
  [["rakfelek", "tenger gyumolcsei", "garnele", "meeresfruchte", "shellfish", "seafood"], ["rak", "garnela", "kagylo", "garnele", "muschel", "shrimp", "prawn", "mussel"]]
];

function exclusionTerms(entries: string[]): string[] {
  const terms = new Set<string>();
  for (const entry of entries) {
    const term = normalizeSearch(entry);
    if (!term) continue;
    terms.add(term);
    for (const [names, words] of ALLERGEN_GROUPS) if (names.some((name) => normalizeSearch(name) === term)) for (const word of words) terms.add(normalizeSearch(word));
  }
  return [...terms].filter((term) => term.length >= 2);
}

// The start of a word, so compounds count too ("sajt" hits "sajtos"). For
// allergies an extra hit only leaves a dish out, which is the safe side.
const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const mentions = (haystack: string, term: string) => new RegExp(`(^|\\s)${escape(term)}`).test(haystack);

const round = (value: number) => Math.round(value * 10) / 10;
const sub = (a: Macros, b: Macros): Macros => ({ kcal: a.kcal - b.kcal, protein: a.protein - b.protein, netCarbs: a.netCarbs - b.netCarbs, fat: a.fat - b.fat });

/**
 * Pure ranking. `remaining` is goal minus eaten so far; a candidate must fit
 * under both the net carbs and the calories at one serving.
 */
export function rankDinnerSuggestions(input: {
  candidates: DinnerCandidate[];
  remaining: Macros;
  avoid: string[];
  eatenRecipeIds: Set<string>;
  eatenTitles: Set<string>;
  lang: Lang;
  limit?: number;
  random?: () => number;
  todayMeals?: EatenMeal[];
}): DinnerResult {
  const { remaining, lang } = input;
  const rounded = { kcal: Math.round(remaining.kcal), protein: round(remaining.protein), netCarbs: round(remaining.netCarbs), fat: round(remaining.fat) };
  if (remaining.netCarbs <= 0) return { remaining: rounded, status: "carb_budget_used", suggestions: [], leftovers: [] };
  if (remaining.kcal <= 0) return { remaining: rounded, status: "kcal_budget_used", suggestions: [], leftovers: [] };
  const terms = exclusionTerms(input.avoid);
  const scored: Array<{ candidate: DinnerCandidate; score: number }> = [];
  for (const candidate of input.candidates) {
    const m = candidate.perServing;
    if (m.netCarbs > remaining.netCarbs || m.kcal > remaining.kcal || m.kcal < 150) continue;
    if (input.eatenRecipeIds.has(candidate.recipeId)) continue;
    if (Object.values(candidate.titles).some((title) => input.eatenTitles.has(normalizeSearch(title)))) continue;
    if (terms.some((term) => mentions(candidate.haystack, term))) continue;
    const proteinFit = remaining.protein > 0 ? Math.min(m.protein, remaining.protein) / remaining.protein : 0.5;
    const kcalFit = m.kcal / remaining.kcal;
    const carbUse = m.netCarbs / remaining.netCarbs;
    const score = 2 * proteinFit + kcalFit - 0.6 * carbUse + (candidate.source === "own" ? 0.3 : 0) + (candidate.lowCarbFriendly ? 0.2 : 0);
    scored.push({ candidate, score });
  }
  // Variety (owner feedback 2026-10-15: "csak sült húsokat írt"): a little
  // randomness among the good fits, so "Újraszámolás" shows other ideas, and
  // at most one dish per cooking style and per main protein while others exist.
  const random = input.random ?? Math.random;
  const jittered = scored.map((entry) => ({ ...entry, key: entry.score + random() * 0.8 }))
    .sort((a, b) => b.key - a.key || a.candidate.titles[lang].localeCompare(b.candidate.titles[lang]));
  const limit = input.limit ?? 5;
  const picked: DinnerCandidate[] = [];
  const seenDish = new Set<string>();
  const usedStyle = new Set<string>();
  const usedProtein = new Set<string>();
  const rules: Array<(c: DinnerCandidate) => boolean> = [
    (c) => !usedStyle.has(c.style) && !usedProtein.has(c.protein),
    (c) => !usedStyle.has(c.style),
    () => true
  ];
  for (const rule of rules) {
    for (const { candidate } of jittered) {
      if (picked.length >= limit) break;
      if (seenDish.has(candidate.dishId) || !rule(candidate)) continue;
      seenDish.add(candidate.dishId); usedStyle.add(candidate.style); usedProtein.add(candidate.protein);
      picked.push(candidate);
    }
  }
  const suggestions: DinnerSuggestion[] = picked.map((candidate) => {
    const m = candidate.perServing;
    return {
      recipeId: candidate.recipeId, source: candidate.source, title: candidate.titles[lang], servingGrams: candidate.servingGrams,
      perServing: { kcal: Math.round(m.kcal), protein: round(m.protein), netCarbs: round(m.netCarbs), fat: round(m.fat) },
      after: (({ kcal, protein, netCarbs, fat }) => ({ kcal: Math.round(kcal), protein: round(protein), netCarbs: round(netCarbs), fat: round(fat) }))(sub(remaining, m))
    };
  });
  const leftovers: LeftoverSuggestion[] = (input.todayMeals ?? [])
    .filter((meal) => meal.mealType && LEFTOVER_TYPES.has(meal.mealType))
    .filter((meal) => meal.totals.netCarbs <= remaining.netCarbs && meal.totals.kcal <= remaining.kcal && meal.totals.kcal >= 150)
    .slice(0, 2)
    .map((meal) => ({
      mealId: meal.id, title: meal.title, mealType: meal.mealType, mealTypeLabel: meal.mealTypeLabel,
      perServing: { kcal: Math.round(meal.totals.kcal), protein: round(meal.totals.protein), netCarbs: round(meal.totals.netCarbs), fat: round(meal.totals.fat) },
      after: (({ kcal, protein, netCarbs, fat }) => ({ kcal: Math.round(kcal), protein: round(protein), netCarbs: round(netCarbs), fat: round(fat) }))(sub(remaining, meal.totals))
    }));
  return { remaining: rounded, status: suggestions.length || leftovers.length ? "ok" : "nothing_fits", suggestions, leftovers };
}

const STYLE_TAGS: Array<[string, string]> = [
  ["soup", "soup"], ["salad", "salad"], ["főzelék", "fozelek"], ["stew", "stew"], ["braised", "stew"], ["boiled", "stew"],
  ["eggs", "eggs"], ["fish", "fish"], ["grilled", "grilled"], ["fried", "fried"], ["roast", "roast"], ["baked", "baked"], ["pasta", "pasta"], ["pizza", "pizza"]
];
// Hungarian compounds ("zöldborsófőzelék", "babgulyás") carry the style inside a word.
const STYLE_WORDS: Array<[RegExp, string]> = [
  [/(leves|suppe|soup)/, "soup"], [/(salata|salat|salad)/, "salad"], [/fozelek/, "fozelek"],
  [/(porkolt|paprikas|gulyas|ragu|gulasch|stew)/, "stew"], [/(rantott|panir|schnitzel|fried)/, "fried"],
  [/(grill|roston)/, "grilled"], [/(sult|braten|roast)/, "roast"], [/(omlett|rantotta|tojas|egg)/, "eggs"]
];
const PROTEIN_WORDS: Array<[RegExp, string]> = [
  [/(^|\s)(hal|lazac|ponty|harcsa|pisztrang|tonhal|fisch|lachs|forelle|fish|salmon|tuna|trout)/, "fish"],
  [/(^|\s)(csirke|pulyka|kacsa|liba|szarnyas|huhn|hahnchen|pute|ente|gans|chicken|turkey|duck)/, "poultry"],
  [/(^|\s)(marha|borju|rind|kalb|beef|veal)/, "beef"],
  [/(^|\s)(sertes|karaj|tarja|szalonna|kolbasz|virsli|sonka|schwein|speck|wurst|schinken|pork|bacon|ham|sausage)/, "pork"],
  [/(^|\s)(barany|vad|oz|lamm|wild|lamb|venison)/, "lamb_game"],
  [/(^|\s)(tojas|ei|eier|egg)/, "eggs"],
  [/(^|\s)(sajt|kase|cheese|turo|quark)/, "cheese"]
];

/** Cooking style and main protein, from the dish tags or else from its words. */
// The style is read from the title only ("fejes saláta" as an ingredient
// does not make a salad); the protein from the title first, then ingredients.
export function classifyDish(title: string, haystack: string, tags: string[]): { style: string; protein: string } {
  const style = STYLE_TAGS.find(([tag]) => tags.includes(tag))?.[1] ?? STYLE_WORDS.find(([re]) => re.test(title))?.[1] ?? "other";
  const protein = PROTEIN_WORDS.find(([re]) => re.test(title))?.[1] ?? PROTEIN_WORDS.find(([re]) => re.test(haystack))?.[1] ?? "plant";
  return { style, protein };
}

const ingredientInclude = { ingredients: { include: { food: { select: { name: true, kcalPer100g: true, fatPer100g: true, proteinPer100g: true, carbsPer100g: true, fiberPer100g: true } } } } } as const;

function toCandidate(recipe: any, source: "own" | "reference"): DinnerCandidate | null {
  let perServing;
  try {
    const nutrition = calculateRecipeNutrition({ ...recipe, servings: recipe.servings || 1 });
    perServing = nutrition.perServing!.macros;
  } catch {
    return null; // not calculable: never suggested with a guessed number
  }
  const provenance = recipe.provenance as any;
  const tags: string[] = source === "reference" ? provenance?.tags ?? [] : [];
  if (tags.some((tag) => NOT_A_DINNER.has(tag))) return null;
  const titles = source === "reference" && provenance?.titles
    ? { hu: provenance.titles.hu, de: provenance.titles.de, en: provenance.titles.en }
    : { hu: recipe.title, de: recipe.title, en: recipe.title };
  const names = recipe.ingredients.flatMap((ingredient: any) => [ingredient.food?.name, ingredient.originalText]).filter(Boolean);
  const haystack = normalizeSearch([...Object.values(titles), ...names].join(" "));
  return {
    recipeId: recipe.id,
    source,
    titles,
    dishId: source === "reference" ? provenance?.referenceDishId ?? recipe.id : recipe.id,
    servingGrams: source === "reference" ? provenance?.servingGrams ?? null : recipe.finishedWeightGrams && recipe.servings ? Math.round(recipe.finishedWeightGrams / recipe.servings) : null,
    perServing: { kcal: perServing.kcal, protein: perServing.protein, netCarbs: perServing.netCarbs, fat: perServing.fat },
    haystack,
    lowCarbFriendly: tags.includes("low-carb-friendly"),
    ...classifyDish(normalizeSearch(Object.values(titles).join(" ")), haystack, tags)
  };
}

// The 541 reference dishes are static seeded data: their candidates are
// computed once per Prisma client and kept for a while.
const REFERENCE_TTL_MS = 30 * 60 * 1000;
const referenceCache = new WeakMap<object, { at: number; list: Promise<DinnerCandidate[]> }>();

function referenceCandidates(prisma: Pick<PrismaClient, "recipe">): Promise<DinnerCandidate[]> {
  const cached = referenceCache.get(prisma);
  if (cached && Date.now() - cached.at < REFERENCE_TTL_MS) return cached.list;
  const list = (prisma.recipe.findMany as any)({ where: { user: { username: REFERENCE_USERNAME }, deletedAt: null, visibility: "public" }, include: ingredientInclude })
    .then((rows: any[]) => rows.map((row) => toCandidate(row, "reference")).filter((c: DinnerCandidate | null): c is DinnerCandidate => !!c));
  list.catch(() => { if (referenceCache.get(prisma)?.list === list) referenceCache.delete(prisma); });
  referenceCache.set(prisma, { at: Date.now(), list });
  return list;
}

export async function loadDinnerCandidates(prisma: Pick<PrismaClient, "recipe">, userId: string): Promise<DinnerCandidate[]> {
  const [own, reference] = await Promise.all([
    (prisma.recipe.findMany as any)({ where: { userId, deletedAt: null }, include: ingredientInclude, take: 200, orderBy: { updatedAt: "desc" } })
      .then((rows: any[]) => rows.map((row) => toCandidate(row, "own")).filter((c: DinnerCandidate | null): c is DinnerCandidate => !!c)),
    referenceCandidates(prisma)
  ]);
  return [...own, ...reference];
}

/** Premium check while premium is still in beta: "beta_all" opens it to everyone. */
export function hasPremiumFeature(
  entitlements: Array<{ plan: string; features: string[]; active: boolean; expiresAt: Date | null }>,
  feature: string,
  access: "beta_all" | "premium_only",
  now = new Date()
) {
  if (access === "beta_all") return true;
  return entitlements.some((e) => e.active && (!e.expiresAt || e.expiresAt > now) && (e.plan === "premium" || e.features.includes(feature)));
}

export const DINNER_FEATURE = "dinner_recommender";
