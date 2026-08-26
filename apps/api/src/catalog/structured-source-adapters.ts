import type { FoodSource } from "@prisma/client";
import { normalizeSearch } from "./normalize.js";
import type { ExternalFoodCandidate, StructuredFoodLookupAdapter } from "./external-food.js";
import { mapNutrient, USDA_NUTRIENT_MAP } from "../importers/nutrient-mapping.js";

type FetchLike = typeof fetch;
const MAX_USDA_RESPONSE_BYTES = 1_000_000;

const USDA_MACRO_KEYS = {
  energy_kcal: ["1008", "2047", "2048"], protein: ["1003"], total_fat: ["1004"], carbohydrate: ["1005"], fiber: ["1079"]
} as const;

function canonicalUnit(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace("µ", "u");
}

export function normalizeUsdaNutrients(foodNutrients: unknown) {
  if (!Array.isArray(foodNutrients)) return [];
  const seen = new Set<string>();
  return foodNutrients.slice(0, 200).flatMap((item: any) => {
    const id = String(item?.nutrientId ?? item?.number ?? "").trim();
    const mapping = USDA_NUTRIENT_MAP[id];
    if (!mapping || seen.has(mapping.key)) return [];
    const suppliedUnit = canonicalUnit(item?.unitName ?? item?.unit);
    if (!suppliedUnit || suppliedUnit !== canonicalUnit(mapping.unit)) return [];
    const mapped = mapNutrient(USDA_NUTRIENT_MAP, id, item?.value ?? item?.amount);
    if (!mapped || mapped.amountPer100g < 0) return [];
    seen.add(mapped.key);
    return [mapped];
  });
}

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
    const contentLength = Number(response.headers?.get?.("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_USDA_RESPONSE_BYTES) throw new Error("USDA response too large");
    let payload: any;
    if (typeof response.text === "function") {
      const body = await response.text();
      if (body.length > MAX_USDA_RESPONSE_BYTES) throw new Error("USDA response too large");
      try { payload = JSON.parse(body); } catch { throw new Error("USDA response invalid"); }
    } else {
      // Small deterministic test doubles may expose json() only.
      payload = await response.json();
    }
    const retrievedAt = new Date().toISOString();
    return (Array.isArray(payload?.foods) ? payload.foods.slice(0, 5) : []).flatMap((food: any) => {
      const name = String(food.description ?? "").trim();
      if (!name || !Number.isSafeInteger(food.fdcId) || !["Foundation", "SR Legacy"].includes(food.dataType)) return [];
      const nutrients = normalizeUsdaNutrients(food.foodNutrients);
      const amount = (key: keyof typeof USDA_MACRO_KEYS) => nutrients.find((item) => item.key === key)?.amountPer100g;
      const kcal = amount("energy_kcal");
      const protein = amount("protein");
      const fat = amount("total_fat");
      const carbs = amount("carbohydrate");
      const fiber = amount("fiber");
      const exact = normalizeSearch(name) === normalizeSearch(query);
      return [{
        source: this.source, sourceId: String(food.fdcId ?? ""), originalName: name, name,
        names: { en: name }, category: food.foodCategory, kcalPer100g: kcal,
        proteinPer100g: protein, fatPer100g: fat, carbsPer100g: carbs, fiberPer100g: fiber,
        provenance: { source: this.sourceName, sourceId: String(food.fdcId ?? ""), sourceUrl: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/details`, retrievedAt, valuesPer: "100 g", dataType: food.dataType },
        nutrients, sourceUrl: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/details`,
        normalizedName: normalizeSearch(name), nutrientBasis: "per_100_g", retrievedAt,
        confidence: exact ? 0.97 : 0.86, matchPolicy: exact ? "exact_normalized_name" : "review_required", language: "en"
      }];
    });
  }
}

// Adapter boundary for packaged/barcoded products. Implementation is deferred
// deliberately so ordinary text searches do not hit Open Food Facts.
export interface OpenFoodFactsLookupAdapter extends StructuredFoodLookupAdapter {
  readonly source: Extract<FoodSource, "open_food_facts">;
  lookupBarcode(barcode: string): Promise<unknown[]>;
}
