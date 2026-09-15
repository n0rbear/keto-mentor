process.env.JWT_ACCESS_SECRET = "a".repeat(32);

import { describe, expect, it, vi } from "vitest";
import { prepareRecipeDiscoveryItem, persistPreparedRecipe, computeRecipeMealItemData, resolvedFoodIdsOf, type RecipeDiscoveryMealItemDeps } from "./recipe-discovery-meal-item.js";
import { DynamicFoodResolutionRateLimiter } from "../catalog/dynamic-food-rate-limit.js";
import { createRecipeImportProof } from "../recipes/import-proof.js";
import { DisabledRecipeExtractionProvider, type RecipeExtractionProvider } from "../recipes/recipe-extraction-provider.js";
import type { RecipeDiscoveryMealItemInput } from "@keto-mentor/shared";

const cabbageFood = { id: "cabbage", name: "Cabbage", originalName: "Cabbage", names: {}, searchText: "cabbage", source: "bls", sourceId: "1", servings: [], kcalPer100g: 25, fatPer100g: 0.1, proteinPer100g: 1.3, carbsPer100g: 5.8, fiberPer100g: 2.5 };

function fakePrisma(options: { existingRecipe?: any; foods?: any[] } = {}) {
  const created: any[] = [];
  const foods = options.foods ?? [cabbageFood];
  const client: any = {
    foodAlias: { findMany: async () => [] },
    food: { findMany: async ({ where }: any) => foods.filter((f) => where.OR?.some((c: any) => f.searchText.includes(c.searchText?.contains ?? " "))) },
    recipe: {
      findFirst: async () => options.existingRecipe ?? null,
      create: async ({ data }: any) => {
        const ingredients = (data.ingredients.create as any[]).map((i: any, idx: number) => ({ ...i, id: `ri-${idx}`, recipeId: "new-recipe", food: foods.find((f) => f.id === i.foodId) }));
        const recipe = { id: "new-recipe", userId: data.userId, title: data.title, servings: data.servings ?? null, finishedWeightGrams: null, sourceType: data.sourceType, sourceUrl: data.sourceUrl, provenance: data.provenance, ingredients };
        created.push(recipe);
        return recipe;
      }
    }
  };
  return { client, created };
}

function html(ingredients: string[], servings?: string) {
  return `<html><script type="application/ld+json">${JSON.stringify({ "@type": "Recipe", name: "Cabbage soup", ...(servings ? { recipeYield: servings } : {}), recipeIngredient: ingredients, recipeInstructions: ["Simmer."] })}</script></html>`;
}

function deps(overrides: Partial<RecipeDiscoveryMealItemDeps> = {}): RecipeDiscoveryMealItemDeps {
  return {
    recipeAiProvider: new DisabledRecipeExtractionProvider() as RecipeExtractionProvider,
    dynamic: null,
    fetchDependencies: { resolve: async () => [{ address: "93.184.216.34", family: 4 }], request: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(html(["1000 g cabbage"], "2 servings")) }) },
    ...overrides
  };
}

const SOURCE_URL = "https://example.com/cabbage-soup";

function validItem(overrides: Partial<RecipeDiscoveryMealItemInput> = {}): RecipeDiscoveryMealItemInput {
  return {
    sourceUrl: SOURCE_URL,
    importProof: createRecipeImportProof("user-1", SOURCE_URL, "schema_org_json_ld"),
    extractionMethod: "schema_org_json_ld",
    quantity: 100,
    unit: "g",
    ...overrides
  };
}

// Full round trip: prepare -> compute portion -> persist, mirroring exactly
// what createMeal itself does (in that order, so a later validation failure
// never leaves an already-persisted Recipe behind).
async function prepareComputeAndPersist(prisma: any, userId: string, item: RecipeDiscoveryMealItemInput, d: RecipeDiscoveryMealItemDeps) {
  const prepared = await prepareRecipeDiscoveryItem(prisma, userId, item, d);
  const mealItemData = computeRecipeMealItemData(prepared, "pending", item);
  const recipeId = await persistPreparedRecipe(prisma, prepared);
  mealItemData.recipeId = recipeId;
  return { prepared, mealItemData };
}

// Owner-beta checkpoint (2026-09-15) — final recipe nutrition review: a real,
// reproduced live bug. prepareRecipeDiscoveryItem previously NEVER received
// recipeIngredientNormalizationProvider/recipeQuantityEstimationProvider —
// meal creation's own re-derivation (required at persistence time; it never
// trusts an earlier client-side preview) silently fell back to the OLDER,
// weaker per-ingredient-line resolution path, even when
// /recipes/import-url/preview and the natural-language recipe-discovery path
// both already use the full whole-recipe-context batch pipeline. Live
// consequence: a recipe preview correctly showing every ingredient resolved
// could still fail meal creation with "recipe_not_fully_resolved", because
// persistence-time re-derivation used a materially different, weaker
// pipeline than what produced that preview.
describe("prepareRecipeDiscoveryItem uses the SAME full resolution pipeline preview endpoints use (owner-beta checkpoint, 2026-09-15)", () => {
  it("passes recipeIngredientNormalizationProvider and recipeQuantityEstimationProvider through to ingredient resolution when supplied (batch normalization requires dynamic resolution deps too — same precondition previewRecipeImport already enforces)", async () => {
    const fake = fakePrisma();
    const normalizeSpy = vi.fn(async (input: any) => ({ ingredients: input.ingredients.map((i: any) => ({ index: i.index, foods: [{ canonicalIdentity: "cabbage" }] })) }));
    const estimateSpy = vi.fn(async () => ({ estimates: [] }));
    const d = deps({
      dynamic: {
        prisma: fake.client, searchIntentProvider: { id: "unused", generate: async () => null },
        adapters: [], rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1"
      },
      recipeIngredientNormalizationProvider: { id: "spy", normalize: normalizeSpy },
      recipeQuantityEstimationProvider: { id: "spy", estimate: estimateSpy }
    });
    await prepareRecipeDiscoveryItem(fake.client, "user-1", validItem({ quantity: 500, unit: "g" }), d);
    expect(normalizeSpy).toHaveBeenCalled();
  });

  it("still works (graceful fallback to the per-ingredient path) when these providers are omitted — never throws merely because they're absent", async () => {
    const fake = fakePrisma();
    const d = deps(); // no recipeIngredientNormalizationProvider/recipeQuantityEstimationProvider at all
    const prepared = await prepareRecipeDiscoveryItem(fake.client, "user-1", validItem({ quantity: 500, unit: "g" }), d);
    expect(prepared.kind).toBe("pending");
  });
});

describe("prepareRecipeDiscoveryItem / persistPreparedRecipe / computeRecipeMealItemData", () => {
  it("a valid proof + a fresh, fully-resolvable recipe: prepare derives real ingredients WITHOUT persisting, persist then creates exactly one Recipe", async () => {
    const fake = fakePrisma();
    const prepared = await prepareRecipeDiscoveryItem(fake.client, "user-1", validItem({ quantity: 500, unit: "g" }), deps());
    expect(prepared.kind).toBe("pending");
    expect(fake.created).toHaveLength(0); // nothing written yet
    expect(resolvedFoodIdsOf(prepared)).toEqual(new Set(["cabbage"]));

    const mealItemData = computeRecipeMealItemData(prepared, "pending", validItem({ quantity: 500, unit: "g" }));
    expect(fake.created).toHaveLength(0); // portion math also writes nothing
    // 1000 g cabbage @ 25 kcal/100g = 250 kcal total; 500/1000 of that.
    expect(mealItemData.quantityGrams).toBe(500);
    expect(mealItemData.snapshotKcal).toBeCloseTo(125, 5);

    const recipeId = await persistPreparedRecipe(fake.client, prepared);
    expect(fake.created).toHaveLength(1);
    expect(fake.created[0].sourceUrl).toBe(SOURCE_URL);
    expect(fake.created[0].provenance).toMatchObject({ trust: "source_verified", extractionMethod: "schema_org_json_ld" });
    expect(recipeId).toBe("new-recipe");
  });

  it("unit=serving uses the recipe's own real servings metadata, never a fabricated portion", async () => {
    const fake = fakePrisma();
    const { mealItemData } = await prepareComputeAndPersist(fake.client, "user-1", validItem({ quantity: 1, unit: "serving" }), deps());
    // 2 servings total, 1 requested -> half of 250 kcal.
    expect(mealItemData.snapshotKcal).toBeCloseTo(125, 5);
    expect(mealItemData.quantityGrams).toBeCloseTo(500, 5);
  });

  it("unit=serving with no known servings is refused BEFORE anything is persisted — no orphan Recipe from a portion failure", async () => {
    const fake = fakePrisma();
    const noServingsDeps = deps({ fetchDependencies: { resolve: async () => [{ address: "93.184.216.34", family: 4 }], request: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(html(["1000 g cabbage"])) }) } });
    const prepared = await prepareRecipeDiscoveryItem(fake.client, "user-1", validItem({ quantity: 1, unit: "serving" }), noServingsDeps);
    expect(() => computeRecipeMealItemData(prepared, "pending", validItem({ quantity: 1, unit: "serving" })))
      .toThrow(expect.objectContaining({ publicCode: "recipe_servings_required", status: 400 }));
    // Owner-beta (2026-09-15) — final PR review: previously this DID persist
    // a Recipe row (documented as an accepted tradeoff) because portion
    // computation ran after persistence. Splitting prepare/compute/persist
    // fixes this for real: the failure is caught before persistPreparedRecipe
    // is ever called, so nothing is written at all.
    expect(fake.created).toHaveLength(0);
  });

  it("a tampered proof is rejected before any network/AI work happens", async () => {
    const fake = fakePrisma();
    const requestSpy = vi.fn();
    const tamperedDeps = deps({ fetchDependencies: { resolve: async () => [{ address: "93.184.216.34", family: 4 }], request: requestSpy } });
    const tampered = validItem();
    const item = { ...tampered, importProof: `${tampered.importProof}x` };
    await expect(prepareRecipeDiscoveryItem(fake.client, "user-1", item, tamperedDeps)).rejects.toMatchObject({ publicCode: "invalid_import_proof" });
    expect(requestSpy).not.toHaveBeenCalled();
    expect(fake.created).toHaveLength(0);
  });

  it("a proof minted for a DIFFERENT user is rejected — a user cannot replay/reuse another user's proof", async () => {
    const fake = fakePrisma();
    const proofForUserA = createRecipeImportProof("user-A", SOURCE_URL, "schema_org_json_ld");
    await expect(prepareRecipeDiscoveryItem(fake.client, "user-B", validItem({ importProof: proofForUserA }), deps())).rejects.toMatchObject({ publicCode: "invalid_import_proof" });
    expect(fake.created).toHaveLength(0);
  });

  it("a proof minted for a DIFFERENT sourceUrl is rejected — the client cannot redirect the server-verified import elsewhere", async () => {
    const fake = fakePrisma();
    const proofForOtherUrl = createRecipeImportProof("user-1", "https://example.com/other-recipe", "schema_org_json_ld");
    await expect(prepareRecipeDiscoveryItem(fake.client, "user-1", validItem({ importProof: proofForOtherUrl }), deps())).rejects.toMatchObject({ publicCode: "invalid_import_proof" });
    expect(fake.created).toHaveLength(0);
  });

  it("a proof minted for a DIFFERENT extraction method is rejected", async () => {
    const fake = fakePrisma();
    const proofForOtherMethod = createRecipeImportProof("user-1", SOURCE_URL, "ai_structured");
    await expect(prepareRecipeDiscoveryItem(fake.client, "user-1", validItem({ importProof: proofForOtherMethod }), deps())).rejects.toMatchObject({ publicCode: "invalid_import_proof" });
    expect(fake.created).toHaveLength(0);
  });

  it("an expired proof is rejected, even though it was validly signed", async () => {
    const fake = fakePrisma();
    const secret = "a".repeat(32);
    const past = Date.now() - 20 * 60 * 1000; // TTL is 15 minutes
    const expiredProof = createRecipeImportProof("user-1", SOURCE_URL, "schema_org_json_ld", secret, past);
    await expect(prepareRecipeDiscoveryItem(fake.client, "user-1", validItem({ importProof: expiredProof }), deps())).rejects.toMatchObject({ publicCode: "invalid_import_proof" });
    expect(fake.created).toHaveLength(0);
  });

  it("an already-owned Recipe for the SAME sourceUrl is reused outright — no re-fetch, no re-AI-call, no duplicate Recipe (Phase 8 idempotency + Phase 9 local reuse)", async () => {
    const existingRecipe = { id: "existing-recipe", userId: "user-1", title: "Cabbage soup", servings: 2, finishedWeightGrams: null, sourceUrl: SOURCE_URL, ingredients: [{ id: "ri-1", foodId: "cabbage", quantityGrams: 1000, food: cabbageFood }] };
    const fake = fakePrisma({ existingRecipe });
    const requestSpy = vi.fn();
    const { prepared, mealItemData } = await prepareComputeAndPersist(fake.client, "user-1", validItem({ quantity: 200, unit: "g" }), deps({ fetchDependencies: { resolve: async () => [{ address: "93.184.216.34", family: 4 }], request: requestSpy } }));
    expect(requestSpy).not.toHaveBeenCalled();
    expect(fake.created).toHaveLength(0);
    expect(prepared.kind).toBe("existing");
    expect(mealItemData.recipeId).toBe("existing-recipe");
  });

  it("a recipe with even one unresolved ingredient is refused entirely — never partially saved", async () => {
    const fake = fakePrisma({ foods: [] }); // nothing resolves locally, no dynamic configured
    await expect(prepareRecipeDiscoveryItem(fake.client, "user-1", validItem(), deps()))
      .rejects.toMatchObject({ publicCode: "recipe_not_fully_resolved" });
    expect(fake.created).toHaveLength(0);
  });

  it("the page's extraction method no longer matches what the proof was minted for: refused, never silently accepted under a different method", async () => {
    const fake = fakePrisma();
    // Proof minted for ai_structured, but the page re-fetches as schema_org_json_ld (mirrors the fixture's real JSON-LD content).
    const proof = createRecipeImportProof("user-1", SOURCE_URL, "ai_structured");
    await expect(prepareRecipeDiscoveryItem(fake.client, "user-1", validItem({ importProof: proof, extractionMethod: "ai_structured" }), deps()))
      .rejects.toMatchObject({ publicCode: "recipe_source_changed" });
    expect(fake.created).toHaveLength(0);
  });
});
