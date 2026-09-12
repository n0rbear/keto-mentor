import type { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "../catalog/normalize.js";
import { calculateRecipeNutrition, type RecipeWithIngredients } from "../recipes/nutrition.js";
import type { MacroTotals } from "../nutrition-core.js";

export type LocalRecipeCandidate = { recipeId: string; title: string };

export type LocalRecipeLookupResult =
  | { status: "found"; recipeId: string; title: string; servings: number | null; ingredientCount: number; nutritionPer100g: MacroTotals | null; nutritionCalculable: boolean }
  | { status: "ambiguous"; candidates: LocalRecipeCandidate[] }
  | { status: "not_found" };

const recipeLookupInclude = {
  ingredients: { include: { food: { include: { nutrients: { include: { nutrient: true } } } } } }
} as const;

/**
 * Owner-beta (2026-09-12): step B of the prepared-dish resolution order —
 * a trusted local Recipe, when one genuinely matches, must win over web
 * discovery outright (no unnecessary search/fetch/AI cost, and the user's
 * own already-reviewed recipe is more trustworthy than a freshly-discovered
 * one). Only the current user's OWN saved/imported recipes are considered —
 * never another user's public recipe — matching the real owner-beta scope
 * ("did I already save a recipe for this dish") and keeping the query
 * trivially bounded (one user's own recipe count, indexed by userId).
 * Broadening to community/public recipes is a reasonable future
 * enhancement, deliberately left out of this fix.
 *
 * Matching is exact-after-normalizeSearch (the same diacritics/case-
 * insensitive comparison used throughout the catalog) rather than a raw DB
 * `contains`, since Hungarian recipe titles vary in accenting/capitalization
 * in ways a plain SQL LIKE would miss or over-match. Two or more equally-
 * normalized titles are a genuine identity ambiguity (e.g. a duplicate/
 * forked recipe) and must be surfaced for the user to choose, never silently
 * resolved to whichever row happened to come back first.
 *
 * `prisma.recipe` is intentionally accessed defensively: production always
 * passes a real PrismaClient, but several existing recipe-discovery-fallback
 * tests deliberately construct a minimal prisma double WITHOUT a `recipe`
 * property (to prove no Recipe row is ever accidentally persisted) — this
 * lookup degrades to "not_found" for those doubles rather than throwing,
 * preserving their existing (web-discovery-focused) behavior unchanged.
 */
export async function findTrustedLocalRecipe(prisma: Pick<PrismaClient, "recipe">, dishName: string, userId: string): Promise<LocalRecipeLookupResult> {
  if (typeof (prisma as Partial<Pick<PrismaClient, "recipe">>).recipe?.findMany !== "function") return { status: "not_found" };
  const dishNormalized = normalizeSearch(dishName);
  if (!dishNormalized) return { status: "not_found" };

  const rows = await prisma.recipe.findMany({ where: { userId, deletedAt: null }, include: recipeLookupInclude });
  const matches = rows.filter((row) => normalizeSearch(row.title) === dishNormalized);
  if (matches.length === 0) return { status: "not_found" };
  if (matches.length > 1) return { status: "ambiguous", candidates: matches.map((row) => ({ recipeId: row.id, title: row.title })) };

  const recipe = matches[0];
  const nutrition = calculateRecipeNutrition(recipe as unknown as RecipeWithIngredients);
  return {
    status: "found",
    recipeId: recipe.id,
    title: recipe.title,
    servings: recipe.servings ?? null,
    ingredientCount: recipe.ingredients.length,
    nutritionPer100g: nutrition.per100g?.macros ?? null,
    nutritionCalculable: nutrition.per100g != null
  };
}
