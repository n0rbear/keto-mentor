import type { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "../catalog/normalize.js";
import { calculateRecipeNutrition, type RecipeWithIngredients } from "../recipes/nutrition.js";
import type { MacroTotals } from "../nutrition-core.js";
import { findReferenceRecipes, referenceVariantIdsFor } from "../reference-dishes/lookup.js";

// "own": the user's saved/imported recipe; "reference": a curated Keto
// Mentor reference dish (reference-dishes/), offered only when the user has
// no own recipe for the dish.
export type LocalRecipeSource = "own" | "reference";
export type LocalRecipeCandidate = { recipeId: string; title: string; source: LocalRecipeSource; servings: number | null; servingGrams: number | null };

export type LocalRecipeLookupResult =
  | { status: "found"; recipeId: string; title: string; source: LocalRecipeSource; servings: number | null; servingGrams: number | null; ingredientCount: number; nutritionPer100g: MacroTotals | null; nutritionPer100gBasis: "finished_weight" | null; nutritionCalculable: boolean }
  | { status: "ambiguous"; candidates: LocalRecipeCandidate[] }
  | { status: "not_found" };

// Words that decorate a recipe title without changing the dish (owner
// report 2026-09-26: the saved "A legfinomabb paprikás krumpli" was never
// found for "paprikás krumpli", so every repeat went back to the web).
const TITLE_FILLER_WORDS = new Set([
  "a", "az", "egy", "the", "der", "die", "das",
  "legfinomabb", "legjobb", "klasszikus", "hagyomanyos", "egyszeru", "egyszeruen", "recept", "receptje", "recipe", "rezept",
  "hazi", "hazias", "szaftos", "nagyi", "nagyis", "nagymama", "igazi", "tokeletes", "finom", "gyors", "mennyei", "isteni",
  "eredeti", "csaladi", "kedvenc", "best", "classic", "easy", "homemade", "klassischer", "klassische", "einfacher", "einfache"
]);

/** A title's dish words only: "A legfinomabb paprikás krumpli" -> "paprikas krumpli". */
export function dishCoreKey(title: string): string {
  return normalizeSearch(title).split(" ").filter((word) => word && !TITLE_FILLER_WORDS.has(word)).join(" ");
}

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
  // Exact title first; only when nothing matches exactly do the dish words
  // decide, so "Paprikás krumpli" never competes with a decorated duplicate.
  const exact = rows.filter((row) => normalizeSearch(row.title) === dishNormalized);
  const dishCore = dishCoreKey(dishName);
  const matches = exact.length ? exact : dishCore ? rows.filter((row) => dishCoreKey(row.title) === dishCore) : [];
  if (matches.length === 0) return { status: "not_found" };
  if (matches.length > 1) return { status: "ambiguous", candidates: matches.map((row) => candidateOf(row, "own")) };
  return foundOf(matches[0], "own");
}

type LookupRow = Awaited<ReturnType<PrismaClient["recipe"]["findMany"]>>[number] & { ingredients: unknown[] };

function candidateOf(row: LookupRow, source: LocalRecipeSource): LocalRecipeCandidate {
  return { recipeId: row.id, title: row.title, source, servings: row.servings ?? null, servingGrams: row.servings && row.finishedWeightGrams ? row.finishedWeightGrams / row.servings : null };
}

function foundOf(recipe: LookupRow, source: LocalRecipeSource): LocalRecipeLookupResult {
  const nutrition = calculateRecipeNutrition(recipe as unknown as RecipeWithIngredients);
  return {
    status: "found",
    ...candidateOf(recipe, source),
    ingredientCount: recipe.ingredients.length,
    nutritionPer100g: nutrition.per100g?.macros ?? null,
    nutritionPer100gBasis: nutrition.per100g != null ? "finished_weight" : null,
    nutritionCalculable: nutrition.per100g != null
  };
}

/**
 * Step B2 (roadmap B): a curated reference dish, only reached when the user
 * has no own recipe. A phrase that leaves the side dish open returns every
 * variant as a choice; the web is never searched for a known dish.
 */
export async function findReferenceDish(prisma: Pick<PrismaClient, "recipe">, dishName: string): Promise<LocalRecipeLookupResult> {
  if (typeof (prisma as Partial<Pick<PrismaClient, "recipe">>).recipe?.findMany !== "function") return { status: "not_found" };
  const ids = referenceVariantIdsFor(dishName);
  const rows = await findReferenceRecipes<LookupRow>(prisma, ids, recipeLookupInclude);
  if (rows.length === 0) return { status: "not_found" };
  if (rows.length > 1) return { status: "ambiguous", candidates: rows.map((row) => candidateOf(row, "reference")) };
  return foundOf(rows[0], "reference");
}
