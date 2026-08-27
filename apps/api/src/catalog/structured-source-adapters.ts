import type { FoodSource } from "@prisma/client";
import { normalizeSearch } from "./normalize.js";
import type { ConfirmableFoodLookupAdapter, ExternalFoodCandidate, StructuredFoodLookupAdapter } from "./external-food.js";
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
    const id = String(item?.nutrientId ?? item?.number ?? item?.nutrient?.id ?? item?.nutrient?.number ?? "").trim();
    const mapping = USDA_NUTRIENT_MAP[id];
    if (!mapping || seen.has(mapping.key)) return [];
    const suppliedUnit = canonicalUnit(item?.unitName ?? item?.unit ?? item?.nutrient?.unitName);
    if (!suppliedUnit || suppliedUnit !== canonicalUnit(mapping.unit)) return [];
    const mapped = mapNutrient(USDA_NUTRIENT_MAP, id, item?.value ?? item?.amount);
    if (!mapped || mapped.amountPer100g < 0) return [];
    seen.add(mapped.key);
    return [mapped];
  });
}

async function readBoundedJson(response: Response) {
  if (!response.ok) throw new Error("USDA lookup failed");
  const contentLength = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_USDA_RESPONSE_BYTES) throw new Error("USDA response too large");
  if (typeof response.text !== "function") return response.json();
  const body = await response.text();
  if (Buffer.byteLength(body, "utf8") > MAX_USDA_RESPONSE_BYTES) throw new Error("USDA response too large");
  try { return JSON.parse(body); } catch { throw new Error("USDA response invalid"); }
}

function normalizeUsdaFood(food: any, query?: string): ExternalFoodCandidate | null {
  const name = String(food?.description ?? "").trim();
  if (!name || !Number.isSafeInteger(food?.fdcId) || !["Foundation", "SR Legacy"].includes(food?.dataType)) return null;
  const nutrients = normalizeUsdaNutrients(food.foodNutrients);
  const amount = (key: keyof typeof USDA_MACRO_KEYS) => nutrients.find((item) => item.key === key)?.amountPer100g;
  const retrievedAt = new Date().toISOString();
  const exact = query != null && normalizeSearch(name) === normalizeSearch(query);
  const sourceUrl = `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}/details`;
  return {
    source: "usda_fdc", sourceId: String(food.fdcId), originalName: name, name, names: { en: name },
    category: typeof food.foodCategory === "string" ? food.foodCategory : food.foodCategory?.description,
    kcalPer100g: amount("energy_kcal")!, proteinPer100g: amount("protein")!, fatPer100g: amount("total_fat")!,
    carbsPer100g: amount("carbohydrate")!, fiberPer100g: amount("fiber")!, nutrients,
    provenance: { source: "USDA FoodData Central", sourceId: String(food.fdcId), sourceUrl, retrievedAt, valuesPer: "100 g", dataType: food.dataType },
    sourceUrl, normalizedName: normalizeSearch(name), nutrientBasis: "per_100_g", retrievedAt,
    confidence: exact ? 0.97 : 0.86, matchPolicy: exact ? "exact_normalized_name" : "review_required", language: "en"
  };
}

export class UsdaFoodDataCentralLookupAdapter implements ConfirmableFoodLookupAdapter {
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
    const payload = await readBoundedJson(response);
    return (Array.isArray(payload?.foods) ? payload.foods.slice(0, 5) : []).map((food: any) => normalizeUsdaFood(food, query)).filter((food: ExternalFoodCandidate | null): food is ExternalFoodCandidate => Boolean(food));
  }

  async lookupById(sourceId: string): Promise<ExternalFoodCandidate | null> {
    const response = await this.fetcher(`https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(sourceId)}?api_key=${encodeURIComponent(this.apiKey)}`, {
      headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000)
    });
    return normalizeUsdaFood(await readBoundedJson(response));
  }
}

// Adapter boundary for packaged/barcoded products. Implementation is deferred
// deliberately so ordinary text searches do not hit Open Food Facts.
export interface OpenFoodFactsLookupAdapter extends StructuredFoodLookupAdapter {
  readonly source: Extract<FoodSource, "open_food_facts">;
  lookupBarcode(barcode: string): Promise<unknown[]>;
}
