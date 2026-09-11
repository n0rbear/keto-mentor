import type { PrismaClient } from "@prisma/client";
import { interpretMealInput, type DynamicResolutionDeps } from "../meal-input/interpret.js";
import { AiProviderError } from "../ai/chat-completions-provider.js";
import { fetchPublicHtml, SafeFetchError, type SafeFetcherDependencies } from "./safe-url-fetcher.js";
import { RECIPE_IMPORT_LIMITS as LIMITS } from "./recipe-import-limits.js";
import { DisabledRecipeExtractionProvider, type RecipeExtraction, type RecipeExtractionProvider } from "./recipe-extraction-provider.js";

export const INGREDIENT_RESOLUTION_CONCURRENCY = 4;
const MAX_JSON_LD_DEPTH = 12;
const MAX_JSON_LD_NODES = 500;
// Bounds the AI call's cost/latency independent of how large the already
// safely-fetched page is (that is separately capped at RECIPE_PAGE_MAX_BYTES,
// 1MB, in safe-url-fetcher.ts). ~6,000 characters (~1,500 tokens) is
// comfortably enough for a typical recipe page's title/ingredients/
// instructions text once markup is stripped.
export const AI_EXTRACTION_MAX_INPUT_CHARS = 6_000;
// Fetched-but-unstructured failures only: the page was retrieved safely, but
// no usable schema.org Recipe was found in it. Deliberately excludes
// resource/abuse limits (too_many_ingredients, recipe_content_too_large) and
// every SafeFetchError code — those remain hard failures the AI must never
// be used to route around.
const AI_FALLBACK_ELIGIBLE_CODES = new Set(["recipe_page_not_found", "malformed_json_ld", "recipe_ingredients_missing"]);

export class RecipeImportError extends Error {
  constructor(public readonly publicCode: string, public readonly status = 400) { super(publicCode); }
}

function decodeEntities(value: string) {
  return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, code) => {
    const point = Number(code);
    return Number.isInteger(point) && point >= 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : "�";
  });
}

const CONTROL_CHARS = /[\u0000-\u001f\u007f]+/g;

export function sanitizeRemoteText(value: unknown, max: number) {
  const text = decodeEntities(String(value ?? "").replace(/<[^>]*>/g, " ")).replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, max);
}

/**
 * Turns a safely-fetched HTML page into bounded, script/style-free plain text
 * for the AI extraction prompt. Deliberately not a full HTML/browser parser —
 * strips script/style/comment/noscript blocks, turns a few block-level
 * boundaries into newlines so headings and list items stay distinguishable
 * after tags are removed, then caps the result. The raw HTML (and this
 * derived text) is always untrusted data, never instructions — see
 * RECIPE_EXTRACTION_INSTRUCTION.
 */
export function htmlToSafeText(html: string, maxChars = AI_EXTRACTION_MAX_INPUT_CHARS): string {
  const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ");
  const withoutStyles = withoutScripts.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ");
  const withoutNoscript = withoutStyles.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/gi, " ");
  const withoutComments = withoutNoscript.replace(/<!--[\s\S]*?-->/g, " ");
  const withBreaks = withoutComments
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|br|tr|section|article)>/gi, "\n");
  const text = decodeEntities(withBreaks.replace(/<[^>]*>/g, " "))
    .replace(CONTROL_CHARS, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n").map((line) => line.trim()).filter(Boolean).join("\n");
  return text.slice(0, maxChars);
}

function isRecipe(value: any) {
  const type = value?.["@type"];
  return type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));
}

function findRecipe(value: any, depth = 0, state = { nodes: 0 }): any | null {
  if (depth > MAX_JSON_LD_DEPTH || ++state.nodes > MAX_JSON_LD_NODES) return null;
  if (Array.isArray(value)) {
    for (const item of value) { const found = findRecipe(item, depth + 1, state); if (found) return found; }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  if (isRecipe(value)) return value;
  if (Array.isArray(value["@graph"])) return findRecipe(value["@graph"], depth + 1, state);
  return null;
}

function normalizeInstructions(value: unknown): string[] {
  if (typeof value === "string") return value.split(/\r?\n/).map((item) => sanitizeRemoteText(item, LIMITS.instruction)).filter(Boolean);
  if (!Array.isArray(value)) return [];
  const output: string[] = [];
  let nodes = 0;
  const visit = (item: any, depth = 0) => {
    if (depth > MAX_JSON_LD_DEPTH || ++nodes > MAX_JSON_LD_NODES || output.length >= LIMITS.instructions) return;
    if (typeof item === "string") { const text = sanitizeRemoteText(item, LIMITS.instruction); if (text) output.push(text); return; }
    if (!item || typeof item !== "object") return;
    if (Array.isArray(item.itemListElement)) item.itemListElement.forEach((child: unknown) => visit(child, depth + 1));
    else { const text = sanitizeRemoteText(item.text ?? item.name, LIMITS.instruction); if (text) output.push(text); }
  };
  value.forEach((item) => visit(item));
  return output.slice(0, LIMITS.instructions);
}

function parseServings(value: unknown) {
  const match = String(Array.isArray(value) ? value[0] : value ?? "").match(/\d+(?:[.,]\d+)?/);
  const servings = match ? Number(match[0].replace(",", ".")) : undefined;
  return servings && servings > 0 && servings <= 1000 ? servings : undefined;
}

export function extractRecipeJsonLd(html: string, sourceUrl: string) {
  const scripts = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json(?:;[^"']*)?["'][^>]*>([\s\S]*?)<\/script\s*>/gi)];
  let malformed = false;
  let recipe: any | null = null;
  for (const script of scripts) {
    try { recipe = findRecipe(JSON.parse(script[1].trim())); } catch { malformed = true; }
    if (recipe) break;
  }
  if (!recipe) throw new RecipeImportError(scripts.length && malformed ? "malformed_json_ld" : "recipe_page_not_found", 422);
  const title = sanitizeRemoteText(recipe.name ?? recipe.headline, LIMITS.title);
  const rawIngredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient.filter((item: unknown): item is string => typeof item === "string") : [];
  if (!title) throw new RecipeImportError("recipe_page_not_found", 422);
  if (!rawIngredients.length) throw new RecipeImportError("recipe_ingredients_missing", 422);
  if (rawIngredients.length > LIMITS.ingredients) throw new RecipeImportError("too_many_ingredients", 422);
  const ingredients: string[] = rawIngredients.map((item: unknown) => sanitizeRemoteText(item, LIMITS.ingredient)).filter(Boolean);
  if (!ingredients.length) throw new RecipeImportError("recipe_ingredients_missing", 422);
  const instructions = normalizeInstructions(recipe.recipeInstructions);
  if (title.length + ingredients.join("").length + instructions.join("").length > LIMITS.total) throw new RecipeImportError("recipe_content_too_large", 422);
  const image = typeof recipe.image === "string" ? recipe.image : Array.isArray(recipe.image) ? recipe.image[0] : recipe.image?.url;
  return { title, sourceUrl, servings: parseServings(recipe.recipeYield), description: undefined as string | undefined, instructions, ingredients, imageUrl: typeof image === "string" ? image.slice(0, 2_000) : undefined, extractionMethod: "schema_org_json_ld" as const };
}

function mapRecipeAiError(error: unknown): RecipeImportError {
  if (error instanceof AiProviderError) {
    if (error.code === "timeout") return new RecipeImportError("recipe_ai_timeout", 504);
    if (error.code === "http_error") return new RecipeImportError("recipe_ai_unavailable", 502);
    return new RecipeImportError("recipe_ai_invalid_output", 422);
  }
  return new RecipeImportError("recipe_ai_unavailable", 502);
}

/**
 * AI fallback: runs only after extractRecipeJsonLd has already thrown an
 * AI_FALLBACK_ELIGIBLE_CODES error on a page that was itself safely fetched.
 * The model receives bounded, script/style-free page text (never raw HTML,
 * never more than AI_EXTRACTION_MAX_INPUT_CHARS) and may return recipe
 * STRUCTURE only — recipeExtractionOutputSchema makes nutrition/IDs/
 * provenance fields structurally impossible to smuggle through. Exactly one
 * extraction call per preview.
 */
async function extractRecipeWithAi(aiProvider: RecipeExtractionProvider, html: string, sourceUrl: string) {
  const pageText = htmlToSafeText(html);
  if (!pageText) throw new RecipeImportError("recipe_ai_invalid_output", 422);
  let result: RecipeExtraction;
  try {
    result = await aiProvider.extract(pageText);
  } catch (error) {
    throw mapRecipeAiError(error);
  }
  const title = sanitizeRemoteText(result.title, LIMITS.title);
  const description = result.description ? sanitizeRemoteText(result.description, 2_000) : undefined;
  const ingredients = result.ingredients.map((item) => sanitizeRemoteText(item, LIMITS.ingredient)).filter(Boolean);
  const instructions = result.instructions.map((item) => sanitizeRemoteText(item, LIMITS.instruction)).filter(Boolean);
  if (!title) throw new RecipeImportError("recipe_ai_invalid_output", 422);
  if (!ingredients.length) throw new RecipeImportError("recipe_ai_invalid_output", 422);
  if (ingredients.length > LIMITS.ingredients) throw new RecipeImportError("recipe_ai_invalid_output", 422);
  if (title.length + ingredients.join("").length + instructions.join("").length > LIMITS.total) throw new RecipeImportError("recipe_ai_invalid_output", 422);
  return { title, sourceUrl, servings: result.servings, description, instructions, ingredients, imageUrl: undefined as string | undefined, extractionMethod: "ai_structured" as const };
}

export async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, worker: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function run() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

export async function previewRecipeImport(
  prisma: Pick<PrismaClient, "food" | "foodAlias"> & Partial<Pick<PrismaClient, "$queryRaw">>,
  url: string,
  fetchDependencies: SafeFetcherDependencies = {},
  aiProvider: RecipeExtractionProvider = new DisabledRecipeExtractionProvider(),
  dynamic: DynamicResolutionDeps = null
) {
  try {
    const page = await fetchPublicHtml(url, fetchDependencies);
    let extracted;
    try {
      extracted = extractRecipeJsonLd(page.html, page.finalUrl);
    } catch (structuredError) {
      if (!(structuredError instanceof RecipeImportError) || !AI_FALLBACK_ELIGIBLE_CODES.has(structuredError.publicCode)) throw structuredError;
      extracted = await extractRecipeWithAi(aiProvider, page.html, page.finalUrl);
    }
    const ingredients = await mapWithConcurrency(extracted.ingredients, INGREDIENT_RESOLUTION_CONCURRENCY, async (originalText) => {
      const resolution = await interpretMealInput(prisma, originalText, undefined, undefined, dynamic);
      return {
        originalText,
        parsedQuantity: resolution.parsed.quantity,
        parsedUnit: resolution.parsed.unit,
        parsedFoodQuery: resolution.parsed.foodQuery,
        preparation: resolution.preparation,
        resolution: resolution.foodResolution,
        selectedFood: resolution.selectedFood,
        candidates: resolution.candidates,
        quantity: resolution.quantity,
        canConfirm: resolution.canConfirm,
        // Additive (owner-beta blocker #6, 2026-09-11) — the same
        // externalCandidates/externalCandidatesReason interpretMealInput
        // already produces for a dynamic confirmation_required outcome,
        // carried through so a caller can build a RecipeIngredientReview
        // (recipe-ingredient-review.ts) without a second USDA confirmation
        // protocol. Existing fields above are all unchanged.
        externalCandidates: resolution.externalCandidates,
        externalCandidatesReason: resolution.externalCandidatesReason
      };
    });
    return { ...extracted, ingredients };
  } catch (error) {
    if (error instanceof RecipeImportError) throw error;
    if (error instanceof SafeFetchError) throw new RecipeImportError(error.publicCode, error.publicCode === "fetch_timeout" ? 504 : 400);
    throw new RecipeImportError("import_failed", 502);
  }
}
