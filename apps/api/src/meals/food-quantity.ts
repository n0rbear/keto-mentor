export type FoodServingValue = {
  id: string;
  key: string;
  unit: string;
  grams: number;
  isEstimated: boolean;
  confidence: number;
  provenance: any;
};

type QuantityInput = { quantity: number; unit: "g" | "kg" | "serving"; servingId?: string; gramsOverride?: number };

export function convertFoodQuantity(input: QuantityInput, servings: readonly FoodServingValue[]) {
  if (input.unit === "g") return { grams: input.quantity, snapshot: { unit: "g", gramsPerUnit: 1, method: "exact_mass", estimated: false } };
  if (input.unit === "kg") return { grams: input.quantity * 1000, snapshot: { unit: "kg", gramsPerUnit: 1000, method: "exact_mass", estimated: false } };
  const serving = servings.find((candidate) => candidate.id === input.servingId);
  if (!serving) throw Object.assign(new Error("serving_not_found"), { status: 400, publicCode: "serving_not_found" });
  if (input.gramsOverride != null && !serving.isEstimated) {
    throw Object.assign(new Error("exact_serving_cannot_be_overridden"), { status: 400, publicCode: "exact_serving_cannot_be_overridden" });
  }
  const gramsPerUnit = input.gramsOverride ?? serving.grams;
  const userCorrected = input.gramsOverride != null && input.gramsOverride !== serving.grams;
  return {
    grams: input.quantity * gramsPerUnit,
    snapshot: {
      unit: serving.unit,
      servingKey: serving.key,
      servingId: serving.id,
      gramsPerUnit,
      estimated: serving.isEstimated,
      confidence: userCorrected ? null : serving.confidence,
      method: userCorrected ? "user_corrected" : "food_serving",
      proposedGramsPerUnit: serving.grams,
      userCorrected,
      provenance: serving.provenance
    }
  };
}
