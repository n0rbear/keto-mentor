import type { FoodSource } from "@prisma/client";
import { normalizeSearch } from "./normalize.js";
import type { ConfirmableFoodLookupAdapter, ExternalFoodCandidate, StructuredFoodLookupAdapter } from "./external-food.js";
import { mapNutrient, OFF_NUTRIENT_MAP, USDA_NUTRIENT_MAP } from "../importers/nutrient-mapping.js";
import { CARB_BASIS_TOTAL_FROM_AVAILABLE, totalCarbsFromAvailable, withTotalCarbohydrate } from "./carb-basis.js";
import type { ImportNutrient } from "../importers/types.js";
import { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";

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
    confidence: exact ? 0.97 : 0.86, matchPolicy: exact ? "exact_normalized_name" : "review_required", language: "en",
    // Foundation/SR Legacy is USDA's own curated reference tier (enforced by
    // the dataType check above) — authoritative regardless of whether this
    // particular record's name happens to textually equal the query.
    autoAcceptEligible: true
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
      body: JSON.stringify({ query, pageSize: 20, dataType: ["Foundation", "SR Legacy"] }),
      signal: AbortSignal.timeout(8_000)
    });
    const payload = await readBoundedJson(response);
    return (Array.isArray(payload?.foods) ? payload.foods.slice(0, 20) : []).map((food: any) => normalizeUsdaFood(food, query)).filter((food: ExternalFoodCandidate | null): food is ExternalFoodCandidate => Boolean(food));
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
  // Optional (mirrors the existing estimateDetailed/checkRelevanceDetailed
  // pattern elsewhere in this codebase): present on the real adapter, absent
  // on lighter test doubles that only need barcode lookups.
  searchByName?(query: string, opts?: { locale?: string; limit?: number }): Promise<unknown[]>;
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
  // Fiber is voluntary on EU labels (Reg. 1169/2011, Annex XIII), so drinks,
  // yogurts etc. routinely omit it (owner report 2026-09-26: Red Bull,
  // Almighurt came back "no nutrition data"). The label's carbohydrate is
  // already the available (net) figure, so an undeclared fiber counts as 0:
  // net carbs then equal the label exactly and are never under-stated.
  const fiberDeclared = toFiniteNumber(nutriments?.fiber_100g);
  const fiber = fiberDeclared ?? 0;
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
  // OFF copies the label; EU labels (the app's users) state available
  // carbohydrate, fiber excluded. Stored as total so net = carbs - fiber.
  // For a US label this over-states net carbs by the fiber amount, which is
  // the safe direction for a keto tracker.
  const totalCarbs = totalCarbsFromAvailable(carbs!, fiber!);
  return {
    source: "open_food_facts", sourceId: barcode, originalName: name, name, names: { en: name },
    brand, barcode, category: sanitizeShortText(product.categories, 200) || undefined,
    kcalPer100g: kcal!, proteinPer100g: protein!, fatPer100g: fat!, carbsPer100g: totalCarbs, fiberPer100g: fiber!,
    nutrients: withTotalCarbohydrate(normalizeOffNutrients(nutriments), totalCarbs),
    provenance: { source: "Open Food Facts", sourceId: barcode, sourceUrl, retrievedAt, valuesPer: "100 g", barcode, carbohydrateBasis: CARB_BASIS_TOTAL_FROM_AVAILABLE, ...(fiberDeclared == null ? { fiberBasis: "not_declared_assumed_zero" } : {}) },
    sourceUrl, normalizedName: normalizeSearch(name), nutrientBasis: "per_100_g", retrievedAt,
    // An exact-barcode match identifies one specific, unambiguous product —
    // reference-grade by construction. searchByName() below reuses this
    // builder for its own, much weaker text-matched hits and explicitly
    // overrides this back to false there; never assume the reverse.
    confidence: 1, matchPolicy: "exact_normalized_name", autoAcceptEligible: true
  } as ExternalFoodCandidate;
}

const OFF_PRODUCT_FIELDS = "product_name,product_name_en,generic_name,brands,categories,nutriments,code";

// Routing audit (2026-09-19): search.openfoodfacts.org's "search-a-licious"
// service is OFF's current recommended text-search API (the legacy
// /cgi/search.pl endpoint is explicitly documented as unsuited for new
// integrations, and OFF's v2/v3 product API has no free-text search at
// all). Verified live against the real endpoint: `GET /search?q=...&langs=
// ..&page_size=..&fields=..` returns `{ count, hits: [...] }`, where each
// hit is already a FLAT object (code/product_name/brands[]/nutriments/
// categories/lang) — a different shape from the nested `{status,
// product:{...}}` the by-barcode endpoint returns, so it's reshaped into
// that same nested shape before reuse of the existing normalizeOffProduct
// (keeps exactly one nutrition-sanity/name-sanitization code path for both
// entry points, never a second parallel one that could silently drift).
export const OFF_TEXT_SEARCH_CONFIDENCE = 0.6;
const OFF_SEARCH_DEFAULT_LIMIT = 5;
const OFF_SEARCH_MAX_LIMIT = 10;
const OFF_SEARCH_FIELDS = "code,product_name,product_name_en,generic_name,brands,categories,nutriments,lang";

function normalizeOffSearchHit(hit: any): ExternalFoodCandidate | { name?: string; brand?: string } | null {
  if (!hit || typeof hit !== "object" || !hit.code) return null;
  const product = {
    product_name: hit.product_name, product_name_en: hit.product_name_en, generic_name: hit.generic_name,
    brands: Array.isArray(hit.brands) ? hit.brands.join(", ") : hit.brands,
    categories: Array.isArray(hit.categories) ? hit.categories.join(", ") : hit.categories, nutriments: hit.nutriments
  };
  return normalizeOffProduct({ status: 1, product }, String(hit.code));
}

/**
 * Real Open Food Facts adapter. Two genuinely different trust situations:
 *
 * - BARCODE lookup (lookupBarcode/lookupById, this class's own `lookup()`
 *   is a no-op here): an exact, unambiguous single-record match — strong,
 *   product-specific evidence where explicitly applicable (a scanned or
 *   confirmed barcode). `autoAcceptEligible: true`, same as USDA.
 * - NAME search (searchByName(), wired into automatic resolution via the
 *   separate `OpenFoodFactsNameAdapter` below): a bounded, rate-limited
 *   DISCOVERY/review mechanism only — a crowd-sourced product whose
 *   specific identity was matched on name/brand text, never verified any
 *   other way. Every candidate it returns carries `autoAcceptEligible:
 *   false` (set explicitly in searchByName() below), which the central
 *   acceptance-safety invariant (external-food.ts, dynamic-food-
 *   resolution-batch.ts) treats as authoritative: a semantic gate may
 *   still approve it as plausible, but semantic plausibility never
 *   upgrades this authorization — being the sole surviving candidate does
 *   not either. It can only ever reach resolved/persisted status through
 *   the ordinary confirmation_required -> explicit user confirmation path
 *   (confirmAuthoritativeFood), same as any other reviewable candidate.
 *   The shared `offNameSearchBudget` rate limit below still applies
 *   regardless of how it is ultimately accepted.
 *
 * lookupById exists so the existing confirmAuthoritativeFood flow (which
 * re-fetches by ID at confirmation time) works unchanged for barcode-
 * sourced products too, since sourceId is the barcode itself.
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

  // Bounded, sanity-checked name/brand search. Returns only fully-usable
  // candidates (real macros within OFF_MAX's sanity bounds) — a hit whose
  // nutrition is missing/implausible is dropped here rather than surfaced
  // as a `{name, brand}`-only partial (that shape exists for a single
  // confirmed barcode's "found but incomplete" notice, not for a noisy
  // multi-result search list where a partial entry can't be told apart
  // from a good one). Never auto-confirms anything — the caller still owns
  // the "review required" decision this list is offered into.
  async searchByName(query: string, opts: { locale?: string; limit?: number } = {}): Promise<ExternalFoodCandidate[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const limit = Math.min(Math.max(Math.trunc(opts.limit ?? OFF_SEARCH_DEFAULT_LIMIT), 1), OFF_SEARCH_MAX_LIMIT);
    const params = new URLSearchParams({ q: trimmed, page_size: String(limit), fields: OFF_SEARCH_FIELDS });
    if (opts.locale) params.set("langs", opts.locale);
    const response = await this.fetcher(`https://search.openfoodfacts.org/search?${params.toString()}`, {
      headers: { Accept: "application/json", "User-Agent": OFF_USER_AGENT },
      signal: AbortSignal.timeout(OFF_FETCH_TIMEOUT_MS)
    });
    const payload = await readBoundedOffJson(response);
    const hits = Array.isArray(payload?.hits) ? payload.hits.slice(0, OFF_SEARCH_MAX_LIMIT) : [];
    const candidates = hits.map((hit: unknown) => normalizeOffSearchHit(hit));
    // normalizeOffProduct's confidence 1 / exact_normalized_name is correct for
    // an exact BARCODE hit, but a free-text hit is a crowd-sourced packaged
    // product whose name merely matched words. Live finding (2026-09-19): at
    // confidence 1 these sorted above USDA (0.86-0.97) in both resolvers, and
    // generic "tomato"/"wheat flour" resolved to a packaged OFF product.
    // Ranked below every USDA/BLS candidate and never an exact-name match.
    //
    // Central acceptance-safety audit (2026-09-23): also never auto-accept-
    // eligible, regardless of matchPolicy/confidence or how confidently a
    // later semantic gate approves the name/identity as plausible — a
    // text/brand match is never a verified single-record lookup. This is
    // the one override that actually matters for that invariant; every
    // other field here is display/ranking metadata.
    return candidates
      .filter((candidate: ReturnType<typeof normalizeOffSearchHit>): candidate is ExternalFoodCandidate => !!candidate && "kcalPer100g" in candidate)
      .map((candidate: ExternalFoodCandidate) => ({ ...candidate, confidence: OFF_TEXT_SEARCH_CONFIDENCE, matchPolicy: "review_required" as const, autoAcceptEligible: false }));
  }
}

/** Shared process budget: at most ten text searches per minute across users.
 * Products still pass the resolver's structural and semantic identity gates.
 */
const offNameSearchBudget = new DynamicFoodResolutionRateLimiter(Date.now, { windowMs: 60_000, limit: 10 });
export class OpenFoodFactsNameAdapter extends OpenFoodFactsProductAdapter {
  async lookup(query = ""): Promise<ExternalFoodCandidate[]> {
    if (!query.trim()) return [];
    if (!offNameSearchBudget.consume("off-name-search")) throw new Error("Open Food Facts name search budget exhausted");
    return this.searchByName(query, { limit: 10 });
  }
}
