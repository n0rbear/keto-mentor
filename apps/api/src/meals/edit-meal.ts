import type { PrismaClient } from "@prisma/client";
import type { EditMealInput } from "@keto-mentor/shared";
import { serializeMeal } from "../nutrition.js";
import { scaleRecipeSnapshot, type NutrientTotal } from "../recipes/nutrition.js";

function mealNotFoundError() {
  return Object.assign(new Error("meal_not_found"), { status: 404, publicCode: "meal_not_found" });
}
function mealItemNotFoundError() {
  return Object.assign(new Error("meal_item_not_found"), { status: 400, publicCode: "meal_item_not_found" });
}
function mealItemsEmptyError() {
  return Object.assign(new Error("meal_items_empty"), { status: 400, publicCode: "meal_items_empty" });
}
function futureEatenAtError() {
  return Object.assign(new Error("future_eaten_at"), { status: 400, publicCode: "future_eaten_at" });
}

type SnapshotItem = {
  quantityGrams: number;
  snapshotKcal: number | null; snapshotFat: number | null; snapshotProtein: number | null;
  snapshotCarbs: number | null; snapshotFiber: number | null; snapshotNutrients: unknown;
  conversionSnapshot: unknown;
};

// A recipe-backed item stores its nutrition as an absolute, immutable-at-creation
// snapshot rather than deriving it live from quantityGrams (see nutrition.ts's
// itemTotals). Correcting quantityGrams alone would silently leave that snapshot
// stale, so it must be rescaled proportionally using the same trusted scaling
// math the recipe-add flow already uses — never re-touching Recipe/RecipeIngredient.
function isRecipeSnapshotItem(item: SnapshotItem) {
  return item.snapshotKcal != null && item.snapshotFat != null && item.snapshotProtein != null
    && item.snapshotCarbs != null && item.snapshotFiber != null;
}

function quantityCorrectionData(item: SnapshotItem, newGrams: number): Record<string, unknown> {
  if (isRecipeSnapshotItem(item)) {
    const factor = newGrams / item.quantityGrams;
    const carbs = item.snapshotCarbs!;
    const fiber = item.snapshotFiber!;
    const scaled = scaleRecipeSnapshot(
      { kcal: item.snapshotKcal!, fat: item.snapshotFat!, protein: item.snapshotProtein!, carbs, fiber, netCarbs: Math.max(0, carbs - fiber) },
      (item.snapshotNutrients as Record<string, NutrientTotal> | null) ?? {},
      factor
    );
    return {
      quantityGrams: newGrams,
      snapshotKcal: scaled.macros.kcal, snapshotFat: scaled.macros.fat, snapshotProtein: scaled.macros.protein,
      snapshotCarbs: scaled.macros.carbs, snapshotFiber: scaled.macros.fiber, snapshotNutrients: scaled.nutrients
    };
  }
  // A catalog-Food or manual-fallback-Food item has no absolute snapshot; nutrition
  // is derived live from Food.*Per100g × quantityGrams on every read, so correcting
  // quantityGrams alone is sufficient. Only the conversion provenance needs updating.
  const existingSnapshot = (item.conversionSnapshot as Record<string, unknown> | null) ?? {};
  return {
    quantityGrams: newGrams,
    conversionSnapshot: { ...existingSnapshot, method: "user_corrected", userCorrected: true, confidence: null }
  };
}

/**
 * Corrects an existing meal's title/eatenAt and/or the grams of its existing
 * items, or removes existing items — never re-specifying food/recipe identity
 * or accepting client-submitted nutrition. Ownership is enforced by scoping
 * every read and write to `userId`; ownership and existence of every referenced
 * MealItem id are validated up front, then applied in one transaction so a
 * partially-invalid request never leaves the diary in a half-edited state.
 */
export async function editMeal(prisma: PrismaClient, userId: string, mealId: string, input: EditMealInput, now: Date = new Date()) {
  const meal = await prisma.meal.findFirst({ where: { id: mealId, userId }, include: { items: true } });
  if (!meal) throw mealNotFoundError();

  if (input.eatenAt !== undefined && new Date(input.eatenAt).getTime() > now.getTime()) throw futureEatenAtError();

  const itemsById = new Map(meal.items.map((item) => [item.id, item]));
  for (const correction of input.items ?? []) {
    if (!itemsById.has(correction.mealItemId)) throw mealItemNotFoundError();
  }
  const removeIds = input.removeItemIds ?? [];
  for (const removeId of removeIds) {
    if (!itemsById.has(removeId)) throw mealItemNotFoundError();
  }
  const removeSet = new Set(removeIds);
  if (meal.items.every((item) => removeSet.has(item.id))) throw mealItemsEmptyError();

  await prisma.$transaction(async (tx) => {
    if (input.title !== undefined || input.eatenAt !== undefined) {
      const updated = await tx.meal.updateMany({
        where: { id: mealId, userId },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.eatenAt !== undefined ? { eatenAt: new Date(input.eatenAt) } : {})
        }
      });
      if (updated.count !== 1) throw mealNotFoundError();
    }

    for (const removeId of removeIds) {
      const removed = await tx.mealItem.deleteMany({ where: { id: removeId, mealId } });
      if (removed.count !== 1) throw mealItemNotFoundError();
    }

    for (const correction of input.items ?? []) {
      const item = itemsById.get(correction.mealItemId)!;
      const data = quantityCorrectionData(item, correction.quantityGrams);
      const updated = await tx.mealItem.updateMany({ where: { id: correction.mealItemId, mealId }, data });
      if (updated.count !== 1) throw mealItemNotFoundError();
    }
  });

  const finalMeal = await prisma.meal.findFirst({ where: { id: mealId, userId }, include: { items: { include: { food: true, recipe: true } } } });
  if (!finalMeal) throw mealNotFoundError();
  return serializeMeal(finalMeal);
}

export async function deleteMeal(prisma: PrismaClient, userId: string, mealId: string) {
  const deleted = await prisma.meal.deleteMany({ where: { id: mealId, userId } });
  if (deleted.count !== 1) throw mealNotFoundError();
}

// Single-meal detail fetch backing the web edit UI, which needs per-item grams
// and display names the dashboard's slim summary view intentionally omits.
export async function getMeal(prisma: PrismaClient, userId: string, mealId: string) {
  const meal = await prisma.meal.findFirst({ where: { id: mealId, userId }, include: { items: { include: { food: true, recipe: true } } } });
  if (!meal) throw mealNotFoundError();
  return serializeMeal(meal);
}
