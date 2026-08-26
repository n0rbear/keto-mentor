import type { Food, Meal, MealItem, Recipe } from "@prisma/client";
import { addMacros, emptyMacros, scaleMacros } from "./nutrition-core.js";

type MealWithItems = Meal & { items: Array<MealItem & { food: Food | null; recipe?: Recipe | null }> };
type TotalsItem = Pick<MealItem, "quantityGrams" | "snapshotKcal" | "snapshotFat" | "snapshotProtein" | "snapshotCarbs" | "snapshotFiber"> & {
  food: Pick<Food, "kcalPer100g" | "fatPer100g" | "proteinPer100g" | "carbsPer100g" | "fiberPer100g"> | null;
};
type MealSummaryInput = Pick<Meal, "id" | "title" | "eatenAt"> & { items: TotalsItem[] };

export function itemTotals(item: TotalsItem) {
  if (item.snapshotKcal != null && item.snapshotFat != null && item.snapshotProtein != null && item.snapshotCarbs != null && item.snapshotFiber != null) {
    return scaleMacros({ kcal: item.snapshotKcal, fat: item.snapshotFat, protein: item.snapshotProtein, carbs: item.snapshotCarbs, fiber: item.snapshotFiber }, 1);
  }
  if (!item.food) return emptyMacros();
  return scaleMacros({ kcal: item.food.kcalPer100g, fat: item.food.fatPer100g, protein: item.food.proteinPer100g, carbs: item.food.carbsPer100g, fiber: item.food.fiberPer100g }, item.quantityGrams / 100);
}

export function mealTotals(meal: { items: TotalsItem[] }) {
  return meal.items.map(itemTotals).reduce(addMacros, emptyMacros());
}

// Slim summary used by the dashboard list (`/meals/today`). The web UI only
// renders each meal's title and aggregate `totals`; it never reads per-item
// data, so we intentionally drop the (potentially large) `items` array here to
// keep the dashboard payload small. Totals are still computed server-side from
// the full item/food relations before serialization.
export function serializeMealSummary(meal: MealSummaryInput) {
  return {
    id: meal.id,
    title: meal.title,
    eatenAt: meal.eatenAt,
    totals: mealTotals(meal)
  };
}

export function serializeMeal(meal: MealWithItems) {
  return {
    id: meal.id,
    title: meal.title,
    eatenAt: meal.eatenAt,
    totals: mealTotals(meal),
    items: meal.items.map((item) => ({ id: item.id, quantityGrams: item.quantityGrams, displayName: item.displayName ?? item.food?.name ?? item.recipe?.title, food: item.food, recipeId: item.recipeId, snapshotNutrients: item.snapshotNutrients, totals: itemTotals(item) }))
  };
}
