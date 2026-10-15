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
};
export type DinnerSuggestion = Omit<DinnerCandidate, "haystack" | "lowCarbFriendly" | "dishId" | "titles"> & { title: string; after: Macros };
export type DinnerResult = {
  remaining: Macros;
  status: "ok" | "carb_budget_used" | "kcal_budget_used" | "nothing_fits";
  suggestions: DinnerSuggestion[];
};

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
}): DinnerResult {
  const { remaining, lang } = input;
  const rounded = { kcal: Math.round(remaining.kcal), protein: round(remaining.protein), netCarbs: round(remaining.netCarbs), fat: round(remaining.fat) };
  if (remaining.netCarbs <= 0) return { remaining: rounded, status: "carb_budget_used", suggestions: [] };
  if (remaining.kcal <= 0) return { remaining: rounded, status: "kcal_budget_used", suggestions: [] };
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
  scored.sort((a, b) => b.score - a.score || a.candidate.titles[lang].localeCompare(b.candidate.titles[lang]));
  // One variant per dish: "rántott hús" with three side dishes is one idea.
  const seenDish = new Set<string>();
  const suggestions: DinnerSuggestion[] = [];
  for (const { candidate } of scored) {
    if (seenDish.has(candidate.dishId)) continue;
    seenDish.add(candidate.dishId);
    const m = candidate.perServing;
    suggestions.push({
      recipeId: candidate.recipeId, source: candidate.source, title: candidate.titles[lang], servingGrams: candidate.servingGrams,
      perServing: { kcal: Math.round(m.kcal), protein: round(m.protein), netCarbs: round(m.netCarbs), fat: round(m.fat) },
      after: (({ kcal, protein, netCarbs, fat }) => ({ kcal: Math.round(kcal), protein: round(protein), netCarbs: round(netCarbs), fat: round(fat) }))(sub(remaining, m))
    });
    if (suggestions.length >= (input.limit ?? 5)) break;
  }
  return { remaining: rounded, status: suggestions.length ? "ok" : "nothing_fits", suggestions };
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
  return {
    recipeId: recipe.id,
    source,
    titles,
    dishId: source === "reference" ? provenance?.referenceDishId ?? recipe.id : recipe.id,
    servingGrams: source === "reference" ? provenance?.servingGrams ?? null : recipe.finishedWeightGrams && recipe.servings ? Math.round(recipe.finishedWeightGrams / recipe.servings) : null,
    perServing: { kcal: perServing.kcal, protein: perServing.protein, netCarbs: perServing.netCarbs, fat: perServing.fat },
    haystack: normalizeSearch([...Object.values(titles), ...names].join(" ")),
    lowCarbFriendly: tags.includes("low-carb-friendly")
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
