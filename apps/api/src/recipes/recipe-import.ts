import type { PrismaClient } from "@prisma/client";
import { interpretMealInput } from "../meal-input/interpret.js";
import { fetchPublicHtml, SafeFetchError, type SafeFetcherDependencies } from "./safe-url-fetcher.js";

const LIMITS = { title: 120, ingredients: 50, ingredient: 300, instructions: 100, instruction: 1_000, total: 20_000 } as const;
export const INGREDIENT_RESOLUTION_CONCURRENCY = 4;
const MAX_JSON_LD_DEPTH = 12;
const MAX_JSON_LD_NODES = 500;

export class RecipeImportError extends Error {
  constructor(public readonly publicCode: string, public readonly status = 400) { super(publicCode); }
}

function decodeEntities(value: string) {
  return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, code) => {
    const point = Number(code);
    return Number.isInteger(point) && point >= 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : "�";
  });
}

export function sanitizeRemoteText(value: unknown, max: number) {
  const text = decodeEntities(String(value ?? "").replace(/<[^>]*>/g, " ")).replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, max);
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
  if (!recipe) throw new RecipeImportError(scripts.length && malformed ? "malformed_json_ld" : "recipe_not_found", 422);
  const title = sanitizeRemoteText(recipe.name ?? recipe.headline, LIMITS.title);
  const rawIngredients = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient.filter((item: unknown): item is string => typeof item === "string") : [];
  if (!title) throw new RecipeImportError("recipe_not_found", 422);
  if (!rawIngredients.length) throw new RecipeImportError("recipe_ingredients_missing", 422);
  if (rawIngredients.length > LIMITS.ingredients) throw new RecipeImportError("too_many_ingredients", 422);
  const ingredients: string[] = rawIngredients.map((item: unknown) => sanitizeRemoteText(item, LIMITS.ingredient)).filter(Boolean);
  if (!ingredients.length) throw new RecipeImportError("recipe_ingredients_missing", 422);
  const instructions = normalizeInstructions(recipe.recipeInstructions);
  if (title.length + ingredients.join("").length + instructions.join("").length > LIMITS.total) throw new RecipeImportError("recipe_content_too_large", 422);
  const image = typeof recipe.image === "string" ? recipe.image : Array.isArray(recipe.image) ? recipe.image[0] : recipe.image?.url;
  return { title, sourceUrl, servings: parseServings(recipe.recipeYield), instructions, ingredients, imageUrl: typeof image === "string" ? image.slice(0, 2_000) : undefined, extractionMethod: "schema_org_json_ld" as const };
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

export async function previewRecipeImport(prisma: Pick<PrismaClient, "food" | "foodAlias"> & Partial<Pick<PrismaClient, "$queryRaw">>, url: string, fetchDependencies: SafeFetcherDependencies = {}) {
  try {
    const page = await fetchPublicHtml(url, fetchDependencies);
    const extracted = extractRecipeJsonLd(page.html, page.finalUrl);
    const ingredients = await mapWithConcurrency(extracted.ingredients, INGREDIENT_RESOLUTION_CONCURRENCY, async (originalText) => {
      const resolution = await interpretMealInput(prisma, originalText);
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
        canConfirm: resolution.canConfirm
      };
    });
    return { ...extracted, ingredients };
  } catch (error) {
    if (error instanceof RecipeImportError) throw error;
    if (error instanceof SafeFetchError) throw new RecipeImportError(error.publicCode, error.publicCode === "fetch_timeout" ? 504 : 400);
    throw new RecipeImportError("import_failed", 502);
  }
}
