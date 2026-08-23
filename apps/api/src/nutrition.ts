import type { Food, Meal, MealItem, Recipe } from "@prisma/client";
import { addMacros, emptyMacros, scaleMacros } from "./nutrition-core.js";

type MealWithItems = Meal & { items: Array<MealItem & { food: Food | null; recipe?: Recipe | null }> };

export function itemTotals(item: MealItem & { food: Food | null }) {
  if (item.snapshotKcal != null && item.snapshotFat != null && item.snapshotProtein != null && item.snapshotCarbs != null && item.snapshotFiber != null) {
    return scaleMacros({ kcal: item.snapshotKcal, fat: item.snapshotFat, protein: item.snapshotProtein, carbs: item.snapshotCarbs, fiber: item.snapshotFiber }, 1);
  }
  if (!item.food) return emptyMacros();
  return scaleMacros({ kcal: item.food.kcalPer100g, fat: item.food.fatPer100g, protein: item.food.proteinPer100g, carbs: item.food.carbsPer100g, fiber: item.food.fiberPer100g }, item.quantityGrams / 100);
}

export function mealTotals(meal: MealWithItems) {
  return meal.items.map(itemTotals).reduce(addMacros, emptyMacros());
}

export function serializeMeal(meal: MealWithItems) {
  return {
    id: meal.id,
    title: meal.title,
    eatenAt: meal.eatenAt,
    totals: mealTotals(meal),
    items: meal.items.map((item) => ({
      id: item.id,
      quantityGrams: item.quantityGrams,
      displayName: item.displayName ?? item.food?.name ?? item.recipe?.title,
      // Emit only the fields the dashboard actually renders. Nutrition totals
      // are computed server-side; the full `food`/`recipe` records are not
      // needed by the UI and were bloating the payload.
      food: item.food ? { id: item.food.id, name: item.food.name, names: item.food.names } : null,
      recipeId: item.recipeId,
      snapshotNutrients: item.snapshotNutrients,
      totals: itemTotals(item)
    }))
  };
}
