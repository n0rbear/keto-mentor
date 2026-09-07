import type { FoodSource } from "@prisma/client";
import { normalizeSearch } from "./normalize.js";
import type { ConfirmableFoodLookupAdapter, ExternalFoodCandidate, StructuredFoodLookupAdapter } from "./external-food.js";
import { mapNutrient, OFF_NUTRIENT_MAP, USDA_NUTRIENT_MAP } from "../importers/nutrient-mapping.js";
import type { ImportNutrient } from "../importers/types.js";

type FetchLike = typeof fetch;
const MAX_USDA_RESPONSE_BYTES = 1_000_000;
const MAX_OFF_RESPONSE_BYTES = 1_000_000;
const OFF_FETCH_TIMEOUT_MS = 8_000;
// OFF's read API asks integrators to identify their app; no API key is
// required for product reads, this is purely a courtesy per OFF's API policy.
const OFF_USER_AGENT = "KetoMentor-NorbApp/1.0 (+https://ketomentor.norbapp.com)";

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

// Adapter boundary for packaged/barcoded products.
export interface OpenFoodFactsLookupAdapter extends StructuredFoodLookupAdapter {
  readonly source: Extract<FoodSource, "open_food_facts">;
  lookupBarcode(barcode: string): Promise<unknown[]>;
}

const OFF_MAX = { kcal: 1000, fat: 200, protein: 200, carbs: 200, fiber: 100 } as const;

function toFiniteNumber(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function sanitizeShortText(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

async function readBoundedOffJson(response: Response) {
  if (!response.ok) throw new Error("Open Food Facts lookup failed");
  const contentLength = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_OFF_RESPONSE_BYTES) throw new Error("Open Food Facts response too large");
  const body = await response.text();
  if (Buffer.byteLength(body, "utf8") > MAX_OFF_RESPONSE_BYTES) throw new Error("Open Food Facts response too large");
  try { return JSON.parse(body); } catch { throw new Error("Open Food Facts response invalid"); }
}

// energy-kcal_100g is OFF's own kcal-converted figure and is preferred when
// present; energy_100g (no unit suffix) is documented as always kJ, so it is
// only used as a fallback and converted rather than mistaken for kcal.
function extractOffKcal(nutriments: any): number | undefined {
  const direct = toFiniteNumber(nutriments?.["energy-kcal_100g"]);
  if (direct != null) return direct;
  const kilojoules = toFiniteNumber(nutriments?.energy_100g);
  return kilojoules != null ? kilojoules / 4.184 : undefined;
}

function normalizeOffNutrients(nutriments: any) {
  if (!nutriments || typeof nutriments !== "object") return [];
  const seen = new Set<string>();
  const out: ImportNutrient[] = [];
  for (const sourceKey of Object.keys(OFF_NUTRIENT_MAP)) {
    const mapped = mapNutrient(OFF_NUTRIENT_MAP, sourceKey, nutriments[sourceKey]);
    if (mapped && mapped.amountPer100g >= 0 && !seen.has(mapped.key)) { seen.add(mapped.key); out.push(mapped); }
  }
  return out;
}

/**
 * Turns one Open Food Facts /api/v2/product/{barcode} response into either a
 * fully-valid ExternalFoodCandidate, or (when the product exists but usable
 * nutrition is missing/implausible) a plain { name, brand } object so the
 * caller can still show an honest "incomplete" notice — or null when OFF has
 * no such product at all. Every numeric field is independently bounds- and
 * type-checked; nothing from the response is trusted structurally.
 */
export function normalizeOffProduct(raw: any, barcode: string): ExternalFoodCandidate | { name?: string; brand?: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const product = raw.product;
  if (raw.status === 0 || !product || typeof product !== "object") return null;

  const name = sanitizeShortText(product.product_name || product.product_name_en || product.generic_name, 200);
  const brandRaw = sanitizeShortText(product.brands, 200).split(",")[0]?.trim();
  const brand = brandRaw || undefined;
  if (!name) return null; // no usable identity at all — treat as not found

  const nutriments = product.nutriments;
  const kcal = extractOffKcal(nutriments);
  const fat = toFiniteNumber(nutriments?.fat_100g);
  const protein = toFiniteNumber(nutriments?.proteins_100g);
  const carbs = toFiniteNumber(nutriments?.carbohydrates_100g);
  const fiber = toFiniteNumber(nutriments?.fiber_100g);
  const macros = { kcal, fat, protein, carbs, fiber };
  const macrosUsable = Object.values(macros).every((value) => value != null)
    && kcal! >= 0 && kcal! <= OFF_MAX.kcal
    && fat! >= 0 && fat! <= OFF_MAX.fat
    && protein! >= 0 && protein! <= OFF_MAX.protein
    && carbs! >= 0 && carbs! <= OFF_MAX.carbs
    && fiber! >= 0 && fiber! <= OFF_MAX.fiber;

  if (!macrosUsable) return { name, brand };

  const retrievedAt = new Date().toISOString();
  const sourceUrl = `https://world.openfoodfacts.org/product/${encodeURIComponent(barcode)}`;
  return {
    source: "open_food_facts", sourceId: barcode, originalName: name, name, names: { en: name },
    brand, barcode, category: sanitizeShortText(product.categories, 200) || undefined,
    kcalPer100g: kcal!, proteinPer100g: protein!, fatPer100g: fat!, carbsPer100g: carbs!, fiberPer100g: fiber!,
    nutrients: normalizeOffNutrients(nutriments),
    provenance: { source: "Open Food Facts", sourceId: barcode, sourceUrl, retrievedAt, valuesPer: "100 g", barcode },
    sourceUrl, normalizedName: normalizeSearch(name), nutrientBasis: "per_100_g", retrievedAt,
    confidence: 1, matchPolicy: "exact_normalized_name"
  } as ExternalFoodCandidate;
}

const OFF_PRODUCT_FIELDS = "product_name,product_name_en,generic_name,brands,categories,nutriments,code";

/**
 * Real Open Food Facts adapter: barcode-only. lookup() (the generic
 * text-search entry point required by StructuredFoodLookupAdapter) is
 * intentionally a no-op — ordinary food-name text search must never hit
 * Open Food Facts, only an explicit barcode lookup may. lookupById exists
 * so the existing confirmAuthoritativeFood flow (which re-fetches by ID
 * at confirmation time) works unchanged for barcode-sourced products too,
 * since sourceId is the barcode itself.
 */
export class OpenFoodFactsProductAdapter implements OpenFoodFactsLookupAdapter, ConfirmableFoodLookupAdapter {
  readonly source = "open_food_facts" as const;
  readonly sourceName = "Open Food Facts";
  constructor(private readonly fetcher: FetchLike = fetch) {}

  async lookup(): Promise<ExternalFoodCandidate[]> {
    return [];
  }

  async lookupBarcode(barcode: string): Promise<Array<ExternalFoodCandidate | { name?: string; brand?: string }>> {
    const response = await this.fetcher(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_PRODUCT_FIELDS}`, {
      headers: { Accept: "application/json", "User-Agent": OFF_USER_AGENT },
      signal: AbortSignal.timeout(OFF_FETCH_TIMEOUT_MS)
    });
    const payload = await readBoundedOffJson(response);
    const normalized = normalizeOffProduct(payload, barcode);
    return normalized ? [normalized] : [];
  }

  async lookupById(sourceId: string) {
    const [first] = await this.lookupBarcode(sourceId);
    return first ?? null;
  }
}
