import type { FoodSource } from "@prisma/client";
import { normalizeSearch } from "./normalize.js";
import type { ExternalFoodCandidate, StructuredFoodLookupAdapter } from "./external-food.js";
import { mapNutrient, USDA_NUTRIENT_MAP } from "../importers/nutrient-mapping.js";

type FetchLike = typeof fetch;

const nutrient = (food: any, names: string[]) => {
  const row = food.foodNutrients?.find((item: any) => names.includes(String(item.nutrientName ?? item.name).toLowerCase()));
  const value = Number(row?.value ?? row?.amount);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
};

export class UsdaFoodDataCentralLookupAdapter implements StructuredFoodLookupAdapter {
  readonly source = "usda_fdc" as const;
  readonly sourceName = "USDA FoodData Central";
  constructor(private readonly apiKey: string, private readonly fetcher: FetchLike = fetch) {}

  async lookup(query: string): Promise<ExternalFoodCandidate[]> {
    const response = await this.fetcher(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(this.apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, pageSize: 5, dataType: ["Foundation", "SR Legacy"] }),
      signal: AbortSignal.timeout(8_000)
    });
    if (!response.ok) throw new Error("USDA lookup failed");
    const payload = await response.json() as any;
    const retrievedAt = new Date().toISOString();
    return (Array.isArray(payload.foods) ? payload.foods : []).map((food: any) => {
      const name = String(food.description ?? "").trim();
      const kcal = nutrient(food, ["energy"]);
      const protein = nutrient(food, ["protein"]);
      const fat = nutrient(food, ["total lipid (fat)"]);
      const carbs = nutrient(food, ["carbohydrate, by difference"]);
      const fiber = nutrient(food, ["fiber, total dietary"]) ?? 0;
      const nutrients = (Array.isArray(food.foodNutrients) ? food.foodNutrients : [])
        .map((item: any) => mapNutrient(USDA_NUTRIENT_MAP, String(item.nutrientId ?? item.number ?? ""), item.value ?? item.amount))
        .filter(Boolean)
        .filter((item: any, index: number, all: any[]) => all.findIndex((other) => other.key === item.key) === index);
      const exact = normalizeSearch(name) === normalizeSearch(query);
      return {
        source: this.source, sourceId: String(food.fdcId ?? ""), originalName: name, name,
        names: { en: name }, category: food.foodCategory, kcalPer100g: kcal,
        proteinPer100g: protein, fatPer100g: fat, carbsPer100g: carbs, fiberPer100g: fiber,
        provenance: { source: this.sourceName, sourceId: String(food.fdcId ?? ""), sourceUrl: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/details`, retrievedAt, valuesPer: "100 g", dataType: food.dataType },
        nutrients, sourceUrl: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/details`,
        normalizedName: normalizeSearch(name), nutrientBasis: "per_100_g", retrievedAt,
        confidence: exact ? 0.97 : 0.86, language: "en"
      };
    });
  }
}

// Adapter boundary for packaged/barcoded products. Implementation is deferred
// deliberately so ordinary text searches do not hit Open Food Facts.
export interface OpenFoodFactsLookupAdapter extends StructuredFoodLookupAdapter {
  readonly source: Extract<FoodSource, "open_food_facts">;
  lookupBarcode(barcode: string): Promise<unknown[]>;
}
