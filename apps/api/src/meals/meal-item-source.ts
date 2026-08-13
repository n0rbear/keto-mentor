export type MealItemSourcePresence = { hasFood: boolean; hasRecipe: boolean };

export function assertExactlyOneMealItemSource(source: MealItemSourcePresence) {
  if (source.hasFood === source.hasRecipe) {
    throw Object.assign(new Error("meal_item_source_invalid"), {
      status: 400,
      publicCode: "meal_item_source_invalid"
    });
  }
}
