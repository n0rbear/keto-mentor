import type { Food, FoodNutrient, Nutrient, Recipe, RecipeIngredient } from "@prisma/client";
import { addMacros, emptyMacros, scaleMacros, type MacroTotals } from "../nutrition-core.js";

export type RecipeIngredientWithFood = RecipeIngredient & {
  food: Food & { nutrients: Array<FoodNutrient & { nutrient: Nutrient }> };
};
export type RecipeWithIngredients = Recipe & { ingredients: RecipeIngredientWithFood[] };
export type NutrientTotal = { key: string; label: string; unit: string; group: string; amount: number };

function scaleNutrients(nutrients: Record<string, NutrientTotal>, factor: number) {
  return Object.fromEntries(Object.entries(nutrients).map(([key, nutrient]) => [key, { ...nutrient, amount: nutrient.amount * factor }]));
}

export function calculateRecipeNutrition(recipe: RecipeWithIngredients) {
  let totals = emptyMacros();
  const nutrients: Record<string, NutrientTotal> = {};
  let ingredientWeightGrams = 0;

  for (const ingredient of recipe.ingredients) {
    const factor = ingredient.quantityGrams / 100;
    ingredientWeightGrams += ingredient.quantityGrams;
    totals = addMacros(totals, scaleMacros({
      kcal: ingredient.food.kcalPer100g,
      fat: ingredient.food.fatPer100g,
      protein: ingredient.food.proteinPer100g,
      carbs: ingredient.food.carbsPer100g,
      fiber: ingredient.food.fiberPer100g
    }, factor));
    for (const value of ingredient.food.nutrients) {
      const existing = nutrients[value.nutrient.key] ?? { ...value.nutrient, amount: 0 };
      existing.amount += value.amountPer100g * factor;
      nutrients[value.nutrient.key] = existing;
    }
  }

  const scale = (factor: number) => ({ macros: scaleMacros(totals, factor), nutrients: scaleNutrients(nutrients, factor) });
  return {
    total: { macros: totals, nutrients },
    perServing: recipe.servings ? scale(1 / recipe.servings) : null,
    per100g: recipe.finishedWeightGrams ? scale(100 / recipe.finishedWeightGrams) : null,
    ingredientWeightGrams
  };
}

export function scaleRecipeSnapshot(macros: MacroTotals, nutrients: Record<string, NutrientTotal>, factor: number) {
  return { macros: scaleMacros(macros, factor), nutrients: scaleNutrients(nutrients, factor) };
}
