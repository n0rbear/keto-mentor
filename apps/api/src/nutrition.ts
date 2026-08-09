import type { Food, Meal, MealItem } from "@prisma/client";

type MealWithItems = Meal & { items: Array<MealItem & { food: Food }> };

export function itemTotals(item: MealItem & { food: Food }) {
  const factor = item.quantityGrams / 100;
  const carbs = item.food.carbsPer100g * factor;
  const fiber = item.food.fiberPer100g * factor;
  return {
    kcal: item.food.kcalPer100g * factor,
    fat: item.food.fatPer100g * factor,
    protein: item.food.proteinPer100g * factor,
    carbs,
    fiber,
    netCarbs: Math.max(0, carbs - fiber)
  };
}

export function mealTotals(meal: MealWithItems) {
  return meal.items.map(itemTotals).reduce(
    (sum, item) => ({
      kcal: sum.kcal + item.kcal,
      fat: sum.fat + item.fat,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fiber: sum.fiber + item.fiber,
      netCarbs: sum.netCarbs + item.netCarbs
    }),
    { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 }
  );
}

export function serializeMeal(meal: MealWithItems) {
  return {
    id: meal.id,
    title: meal.title,
    eatenAt: meal.eatenAt,
    totals: mealTotals(meal),
    items: meal.items.map((item) => ({ id: item.id, quantityGrams: item.quantityGrams, food: item.food, totals: itemTotals(item) }))
  };
}
