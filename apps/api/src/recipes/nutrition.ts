import type { Food, FoodNutrient, Nutrient, Recipe, RecipeIngredient } from "@prisma/client";
import { addMacros, emptyMacros, scaleMacros, scaleMacroTotals, type MacroTotals } from "../nutrition-core.js";

// `nutrients` is optional: the lean recipe-list query (see service.ts's
// recipeSummaryInclude) intentionally omits the Food->FoodNutrient->Nutrient
// join for every row — a card only needs macro totals, not the full
// micronutrient tree — so this must degrade to an empty nutrient dict rather
// than throw when it's absent.
export type RecipeIngredientWithFood = RecipeIngredient & {
  food: (Pick<Food, "kcalPer100g" | "fatPer100g" | "proteinPer100g" | "carbsPer100g" | "fiberPer100g"> & { nutrients?: Array<FoodNutrient & { nutrient: Nutrient }> }) | null;
};
export type RecipeWithIngredients = Recipe & { ingredients: RecipeIngredientWithFood[] };
export type NutrientTotal = { key: string; label: string; unit: string; group: string; amount: number };

function scaleNutrients(nutrients: Record<string, NutrientTotal>, factor: number) {
  return Object.fromEntries(Object.entries(nutrients).map(([key, nutrient]) => [key, { ...nutrient, amount: nutrient.amount * factor }]));
}

const FAT_NUTRIENT_KEYS = ["total_fat", "saturated_fat", "monounsaturated_fat", "polyunsaturated_fat"];

/** Grams of rendered fat a recipe declares as not eaten (provenance.cookingFatLossGrams). */
export function cookingFatLossGrams(provenance: unknown): number {
  const value = (provenance as { cookingFatLossGrams?: unknown } | null | undefined)?.cookingFatLossGrams;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculateRecipeNutrition(recipe: RecipeWithIngredients) {
  let totals = emptyMacros();
  const nutrients: Record<string, NutrientTotal> = {};
  let ingredientWeightGrams = 0;

  for (const ingredient of recipe.ingredients) {
    if (ingredient.includedInBaseNutrition === false) continue;
    // Owner-beta checkpoint (2026-09-15) — final recipe nutrition review: a
    // real, reproduced live bug. An unquantified seasoning ("só, bors" with
    // no fixed gram amount) is correctly excluded from nutrition by
    // computeTrustedNutrition (recipe-ingredient-review.ts) at PREVIEW time —
    // via excludeFromNutrition, independent of includedInBaseNutrition, since
    // it IS a real core recipe ingredient, just one with no quantity to sum —
    // but that distinction was never persisted onto RecipeIngredient, and
    // THIS function (the one actually used at MealItem-creation/recipe-view
    // time) only ever checked includedInBaseNutrition. A recipe preview
    // correctly showing nutritionCalculable=true could therefore still throw
    // here and fail to ever persist. role: "seasoning" IS the already-
    // persisted signal for exactly this state (toIngredientReview sets it
    // only for excludeFromNutrition + quantitySource === "unquantified_seasoning"
    // — see recipe-ingredient-review.ts) — reused here rather than adding a
    // new column. Scoped tightly to quantityGrams == null specifically: a
    // manually-tagged "seasoning" ingredient that DOES carry a real quantity
    // (recipeIngredientSchema.quantityGrams is a required positive number for
    // every manually-created recipe — this null-quantity state is reachable
    // ONLY via recipe-discovery import) still counts normally below.
    if (ingredient.quantityGrams == null && ingredient.role === "seasoning") continue;
    if (!ingredient.food || ingredient.quantityGrams == null) throw new Error("recipe_nutrition_not_calculable");
    const factor = ingredient.quantityGrams / 100;
    ingredientWeightGrams += ingredient.quantityGrams;
    totals = addMacros(totals, scaleMacros({
      kcal: ingredient.food.kcalPer100g,
      fat: ingredient.food.fatPer100g,
      protein: ingredient.food.proteinPer100g,
      carbs: ingredient.food.carbsPer100g,
      fiber: ingredient.food.fiberPer100g
    }, factor));
    for (const value of ingredient.food.nutrients ?? []) {
      const existing = nutrients[value.nutrient.key] ?? { ...value.nutrient, amount: 0 };
      existing.amount += value.amountPer100g * factor;
      nutrients[value.nutrient.key] = existing;
    }
  }

  // Fat that renders out of roasted/fried meat and is not eaten (reference
  // dishes: data/reference-dishes, common.FAT_RETENTION). It leaves the fat,
  // its energy and the fat-class nutrients in proportion.
  const fatLoss = Math.min(cookingFatLossGrams(recipe.provenance), totals.fat);
  if (fatLoss > 0) {
    const keep = (totals.fat - fatLoss) / totals.fat;
    totals = { ...totals, fat: totals.fat - fatLoss, kcal: Math.max(0, totals.kcal - 9 * fatLoss) };
    for (const key of FAT_NUTRIENT_KEYS) if (nutrients[key]) nutrients[key] = { ...nutrients[key], amount: nutrients[key].amount * keep };
    if (nutrients.energy_kcal) nutrients.energy_kcal = { ...nutrients.energy_kcal, amount: Math.max(0, nutrients.energy_kcal.amount - 9 * fatLoss) };
  }

  // scaleMacroTotals (never scaleMacros) here: `totals` is already an
  // accumulated MacroTotals whose own netCarbs was correctly clamped once
  // per ingredient — see nutrition-core.ts's scaleMacroTotals comment.
  const scale = (factor: number) => ({ macros: scaleMacroTotals(totals, factor), nutrients: scaleNutrients(nutrients, factor) });
  return {
    total: { macros: totals, nutrients },
    perServing: recipe.servings ? scale(1 / recipe.servings) : null,
    per100g: recipe.finishedWeightGrams ? scale(100 / recipe.finishedWeightGrams) : null,
    ingredientWeightGrams
  };
}

export function scaleRecipeSnapshot(macros: MacroTotals, nutrients: Record<string, NutrientTotal>, factor: number) {
  // scaleMacroTotals, not scaleMacros: `macros` is already a whole-recipe
  // MacroTotals (its netCarbs already correctly clamped once per
  // ingredient) — see nutrition-core.ts's scaleMacroTotals comment.
  return { macros: scaleMacroTotals(macros, factor), nutrients: scaleNutrients(nutrients, factor) };
}
