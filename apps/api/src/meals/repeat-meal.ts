import type { PrismaClient } from "@prisma/client";
import { serializeMeal } from "../nutrition.js";
import { assertExactlyOneMealItemSource } from "./meal-item-source.js";

function mealNotFoundError() {
  return Object.assign(new Error("meal_not_found"), { status: 404, publicCode: "meal_not_found" });
}
function corruptSourceMealError() {
  return Object.assign(new Error("meal_repeat_invalid_source"), { status: 400, publicCode: "meal_repeat_invalid_source" });
}

type SourceMealItem = {
  foodId: string | null; recipeId: string | null; quantityGrams: number; displayName: string | null;
  snapshotKcal: number | null; snapshotFat: number | null; snapshotProtein: number | null;
  snapshotCarbs: number | null; snapshotFiber: number | null; snapshotNutrients: unknown;
  inputQuantity: number | null; inputUnit: string | null; conversionSnapshot: unknown;
};

// A repeat never changes what was eaten or how much, only when — so unlike an
// edit's quantity correction, nothing here needs recalculating: cloning every
// meal-local field verbatim (minus id/mealId) is correct for both a
// catalog-Food item (nutrition is derived live from the same reused foodId
// on every read) and a recipe-backed item (its snapshot is already the
// trusted, immutable-at-creation record of what the user logged — repeating
// it should reproduce that same past representation, not recompute today's
// possibly-since-edited recipe).
function assertCloneable(item: SourceMealItem) {
  assertExactlyOneMealItemSource({ hasFood: !!item.foodId, hasRecipe: !!item.recipeId });
  if (!Number.isFinite(item.quantityGrams) || item.quantityGrams <= 0) throw corruptSourceMealError();
  if (item.recipeId && (item.snapshotKcal == null || item.snapshotFat == null || item.snapshotProtein == null || item.snapshotCarbs == null || item.snapshotFiber == null)) {
    throw corruptSourceMealError();
  }
}

function cloneItemData(item: SourceMealItem) {
  return {
    foodId: item.foodId,
    recipeId: item.recipeId,
    quantityGrams: item.quantityGrams,
    displayName: item.displayName,
    snapshotKcal: item.snapshotKcal,
    snapshotFat: item.snapshotFat,
    snapshotProtein: item.snapshotProtein,
    snapshotCarbs: item.snapshotCarbs,
    snapshotFiber: item.snapshotFiber,
    inputQuantity: item.inputQuantity,
    inputUnit: item.inputUnit,
    // Json columns: omit rather than pass null, matching this codebase's existing
    // convention (create-meal.ts/edit-meal.ts never explicitly null a Json field).
    ...(item.snapshotNutrients != null ? { snapshotNutrients: item.snapshotNutrients } : {}),
    ...(item.conversionSnapshot != null ? { conversionSnapshot: item.conversionSnapshot } : {})
  };
}

/**
 * Logs a new Meal that reproduces an existing one exactly as it was recorded:
 * same title, same items, same trusted Food/Recipe references, same
 * meal-local quantity and conversion provenance — timestamped at now. The
 * source meal is never mutated. Every field a client could otherwise forge
 * (identity, quantity, nutrition) is read from the trusted source row only;
 * the request body carries none of it.
 */
export async function repeatMeal(prisma: PrismaClient, userId: string, sourceMealId: string, now: Date = new Date()) {
  const source = await prisma.meal.findFirst({ where: { id: sourceMealId, userId }, include: { items: true } });
  if (!source) throw mealNotFoundError();
  if (source.items.length === 0) throw corruptSourceMealError();
  for (const item of source.items) assertCloneable(item);

  // A single nested create is one atomic write in Prisma (same pattern createMeal
  // already relies on) — no explicit transaction needed for a create-only clone.
  const created = await prisma.meal.create({
    data: {
      userId,
      title: source.title,
      eatenAt: now,
      items: { create: source.items.map(cloneItemData) }
    },
    include: { items: { include: { food: true, recipe: true } } }
  });
  return serializeMeal(created);
}
