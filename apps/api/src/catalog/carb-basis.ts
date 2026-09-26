import type { ImportNutrient } from "../importers/types.js";

/**
 * One carbohydrate convention for the whole app (owner-approved 2026-09-26):
 * Food.carbsPer100g is TOTAL carbohydrate (fiber included), and net carbs are
 * always carbs - fiber. USDA already reports total carbohydrate by
 * difference. BLS ("CHO", EuroFIR: available carbohydrate) and EU Open Food
 * Facts labels report AVAILABLE carbohydrate, fiber already excluded, so
 * subtracting fiber again under-counted net carbs (a BLS carrot showed 3.6 g
 * instead of 6.5 g). Checked on the production catalog: BLS energy matches
 * 4P + 9F + 4CHO + 2FIBT with a 0.1 % median error, i.e. CHO excludes fiber.
 *
 * Converting at the source keeps every consumer (search, recipes, meals,
 * snapshots) on the single carbs - fiber rule.
 */
export const CARB_BASIS_TOTAL_FROM_AVAILABLE = "total_from_available_plus_fiber";

export function totalCarbsFromAvailable(available: number, fiber: number): number {
  return Math.round((available + fiber) * 1000) / 1000;
}

/** Same conversion for the per-nutrient list, so it agrees with carbsPer100g. */
export function withTotalCarbohydrate(nutrients: ImportNutrient[], totalCarbs: number): ImportNutrient[] {
  return nutrients.map((nutrient) => nutrient.key === "carbohydrate" ? { ...nutrient, amountPer100g: totalCarbs } : nutrient);
}
