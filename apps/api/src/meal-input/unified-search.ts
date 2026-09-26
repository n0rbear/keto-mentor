import type { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "../catalog/normalize.js";
import { isTrustedLocalMatch, searchFoods } from "../catalog/food-search.js";
import type { SearchIntentProvider } from "../catalog/search-intent.js";
import type { FoodLocale } from "../catalog/food-locale.js";
import type { UsageLimiter } from "../catalog/usage-budget.js";
import { REFERENCE_DATA } from "../reference-dishes/hu-pilot.data.js";
import { findReferenceRecipes } from "../reference-dishes/lookup.js";
import { parseNaturalFoodQuery } from "../catalog/natural-food-query.js";
import { dishCoreKey, phraseMentionsDish } from "./local-recipe-lookup.js";
import { resolveQuantityLocally } from "./interpret.js";

/**
 * One search field for everything (owner goal 2026-09-26, roadmap G1 + E4):
 * a barcode, an ingredient, one of the user's recipes or a Keto Mentor
 * reference dish. Typing never calls an AI; the meaning-based retry (E4)
 * runs only when the client asks for it after a lexical miss.
 */
export type UnifiedRecipeItem = { type: "recipe"; recipeId: string; title: string; source: "own" | "reference"; servings: number | null; servingGrams: number | null };
// amount: what the sentence said, already in this food's units ("négy
// tojás" -> 4 x the egg serving; "3 szelet sonka" -> 45 g), so picking the
// food needs no further input.
export type UnifiedFoodAmount = { quantity: number; servingId?: string; grams: number };
export type UnifiedFoodItem = { type: "food"; food: any; via: "name" | "meaning"; amount?: UnifiedFoodAmount };
export type UnifiedSearchResult =
  | { kind: "barcode"; barcode: string }
  | { kind: "results"; query: string; items: Array<UnifiedRecipeItem | UnifiedFoodItem>; meaning: { tried: boolean; terms: string[] }; quantity?: { quantity: number; unit: string } };

export type UnifiedSearchDeps = {
  userId: string;
  foodLocale: FoodLocale;
  searchIntentProvider?: SearchIntentProvider;
  meaningLimiter?: UsageLimiter;
};

const BARCODE = /^\d{8,14}$/;
const MAX_RECIPES = 6;
const MAX_FOODS = 8;

type RecipeRow = { id: string; title: string; servings: number | null; finishedWeightGrams: number | null; provenance: unknown };
const servingGramsOf = (row: RecipeRow) => row.servings && row.finishedWeightGrams ? row.finishedWeightGrams / row.servings : null;

export async function unifiedSearch(prisma: PrismaClient, rawQuery: string, meaning: boolean, deps: UnifiedSearchDeps): Promise<UnifiedSearchResult> {
  const query = rawQuery.trim().slice(0, 120);
  const compact = query.replace(/\s+/g, "");
  if (BARCODE.test(compact)) return { kind: "barcode", barcode: compact };
  const normalized = normalizeSearch(query);
  if (normalized.length < 2) return { kind: "results", query, items: [], meaning: { tried: false, terms: [] } };

  // A dictated sentence ("Tojásrántotta négy tojásból") is searched by its
  // food words too, and its amount travels back so picking "Tojás" fills in
  // 4 pieces instead of asking for grams (owner report 2026-09-26).
  const parsed = parseNaturalFoodQuery(query);
  const foodTerm = parsed.foodQuery && parsed.foodQuery !== normalized ? parsed.foodQuery : null;
  const [recipes, sentenceFoods, termFoods] = await Promise.all([
    findRecipes(prisma, query, normalized, deps.userId),
    searchFoods(prisma, query, MAX_FOODS) as Promise<any[]>,
    foodTerm ? searchFoods(prisma, foodTerm, MAX_FOODS) as Promise<any[]> : Promise.resolve([] as any[])
  ]);
  const foods = [...termFoods, ...sentenceFoods.filter((food) => !termFoods.some((other) => other.id === food.id))].slice(0, MAX_FOODS);
  const quantity = parsed.quantity != null && parsed.unit && parsed.unit !== "unknown" ? { quantity: parsed.quantity, unit: parsed.unit } : undefined;
  const items: Array<UnifiedRecipeItem | UnifiedFoodItem> = [...recipes, ...foods.map((food) => ({ type: "food" as const, food, via: "name" as const }))];

  // E4: only on request, only after the name found nothing trustworthy.
  const terms: string[] = [];
  let tried = false;
  if (meaning && deps.searchIntentProvider && deps.searchIntentProvider.id !== "disabled" && !foods.some((food) => food.match && isTrustedLocalMatch(food.match))) {
    if (!deps.meaningLimiter || deps.meaningLimiter.consume(deps.userId)) {
      tried = true;
      const intent = await deps.searchIntentProvider.generate({ foodQuery: foodTerm ?? query, foodLocale: deps.foodLocale }).catch(() => null);
      const seen = new Set(foods.map((food) => food.id));
      for (const term of (intent?.searchTerms ?? []).slice(0, 3)) {
        terms.push(term);
        for (const food of (await searchFoods(prisma, term, MAX_FOODS)) as any[]) {
          if (seen.has(food.id)) continue;
          seen.add(food.id);
          items.push({ type: "food", food, via: "meaning" });
        }
      }
    }
  }
  if (quantity) {
    for (const item of items) {
      if (item.type !== "food") continue;
      const local = resolveQuantityLocally(parsed, item.food);
      if (local?.status !== "resolved" || local.grams == null) continue;
      item.amount = local.servingId ? { quantity: parsed.quantity!, servingId: local.servingId, grams: local.grams } : { quantity: local.grams, grams: local.grams };
    }
  }
  return { kind: "results", query, items, meaning: { tried, terms }, ...(quantity ? { quantity } : {}) };
}

async function findRecipes(prisma: PrismaClient, query: string, normalized: string, userId: string): Promise<UnifiedRecipeItem[]> {
  const core = dishCoreKey(query) || normalized;
  const own = (await prisma.recipe.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, title: true, servings: true, finishedWeightGrams: true, provenance: true },
    orderBy: { updatedAt: "desc" },
    take: 300
  })) as RecipeRow[];
  const ownHits = own
    .filter((row) => { const title = normalizeSearch(row.title); return title.includes(normalized) || dishCoreKey(row.title).includes(core) || phraseMentionsDish(query, row.title); })
    .slice(0, MAX_RECIPES)
    .map((row) => ({ type: "recipe" as const, recipeId: row.id, title: row.title, source: "own" as const, servings: row.servings, servingGrams: servingGramsOf(row) }));

  // Reference dishes by any alias or title containing the typed words.
  const variantIds: string[] = [];
  for (const [alias, ids] of Object.entries(REFERENCE_DATA.aliases)) {
    if (!alias.includes(normalized) && !alias.includes(core) && !phraseMentionsDish(query, alias)) continue;
    for (const id of ids) if (!variantIds.includes(id)) variantIds.push(id);
  }
  const referenceRows = await findReferenceRecipes<RecipeRow>(prisma, variantIds, {});
  const referenceHits = referenceRows.slice(0, MAX_RECIPES - Math.min(ownHits.length, MAX_RECIPES - 2))
    .map((row) => ({ type: "recipe" as const, recipeId: row.id, title: row.title, source: "reference" as const, servings: row.servings, servingGrams: servingGramsOf(row) }));
  return [...ownHits, ...referenceHits];
}
