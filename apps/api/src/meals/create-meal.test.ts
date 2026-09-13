process.env.JWT_ACCESS_SECRET = "a".repeat(32);

import { describe, expect, it, vi } from "vitest";
import type { Food, PrismaClient } from "@prisma/client";
import { createMealSchema } from "@keto-mentor/shared";
import { createMeal } from "./create-meal.js";
import { createRecipeImportProof } from "../recipes/import-proof.js";
import { DisabledRecipeExtractionProvider, type RecipeExtractionProvider } from "../recipes/recipe-extraction-provider.js";
import type { RecipeDiscoveryMealItemDeps } from "./recipe-discovery-meal-item.js";

const food = { id: "egg", name: "Fried egg", servingGrams: 50, servings: [{ id: "egg-serving", key: "piece", unit: "piece", grams: 50, isEstimated: false, confidence: 1, provenance: { source: "test" } }], kcalPer100g: 200, fatPer100g: 15, proteinPer100g: 14, carbsPer100g: 1, fiberPer100g: 0 } as Food & { servings: any[] };

function fakePrisma(hasFood = true) {
  let capturedGrams = 0;
  let capturedSnapshot: unknown;
  const client = {
    food: { findMany: async () => hasFood ? [food] : [] },
    meal: { create: async ({ data }: any) => {
      capturedGrams = data.items.create[0].quantityGrams;
      capturedSnapshot = data.items.create[0].conversionSnapshot;
      return { id: "meal", userId: data.userId, title: data.title, eatenAt: data.eatenAt, createdAt: new Date(), items: [{ id: "item", mealId: "meal", foodId: food.id, quantityGrams: capturedGrams, food }] };
    } }
  } as unknown as PrismaClient;
  return { client, grams: () => capturedGrams, snapshot: () => capturedSnapshot };
}

describe("meal creation", () => {
  it("creates a meal in grams and calculates macros", async () => {
    const fake = fakePrisma();
    const meal = await createMeal(fake.client, "user", createMealSchema.parse({ title: "Lunch", items: [{ foodId: "egg", quantity: 125, unit: "g" }] }));
    expect(fake.grams()).toBe(125);
    expect(meal.totals).toMatchObject({ kcal: 250, protein: 17.5, fat: 18.75, netCarbs: 1.25 });
  });

  it("converts serving units to grams", async () => {
    const fake = fakePrisma();
    await createMeal(fake.client, "user", createMealSchema.parse({ title: "Breakfast", items: [{ foodId: "egg", quantity: 2, unit: "serving", servingId: "egg-serving" }] }));
    expect(fake.grams()).toBe(100);
  });

  it("stores the original input and conversion snapshot", async () => {
    const fake = fakePrisma();
    await createMeal(fake.client, "user", createMealSchema.parse({ title: "Breakfast", items: [{ foodId: "egg", quantity: 2, unit: "serving", servingId: "egg-serving" }] }));
    expect(fake.grams()).toBe(100);
  });

  it("rejects an invalid food id", async () => {
    const fake = fakePrisma(false);
    await expect(createMeal(fake.client, "user", createMealSchema.parse({ title: "Lunch", items: [{ foodId: "missing", quantity: 100, unit: "g" }] }))).rejects.toMatchObject({ publicCode: "food_not_found", status: 404 });
  });

  it("accepts confirmed AI grams and preserves meal-only provenance without changing servings", async () => {
    const fake = fakePrisma();
    const before = JSON.stringify(food.servings);
    await createMeal(fake.client, "user", createMealSchema.parse({ title: "Snack", items: [{ foodId: "egg", quantity: 42, unit: "g", quantityConfirmation: { method: "user_corrected", accepted: true, grams: 42 } }] }));
    expect(fake.grams()).toBe(42);
    expect(fake.snapshot()).toMatchObject({ quantityConfirmation: { method: "user_corrected", accepted: true, grams: 42 } });
    expect(JSON.stringify(food.servings)).toBe(before);
  });

  it("rejects an unconfirmed or mismatched estimate", () => {
    expect(createMealSchema.safeParse({ title: "Snack", items: [{ foodId: "egg", quantity: 30, unit: "g", quantityConfirmation: { method: "ai_estimated", accepted: false, grams: 30 } }] }).success).toBe(false);
    expect(createMealSchema.safeParse({ title: "Snack", items: [{ foodId: "egg", quantity: 42, unit: "g", quantityConfirmation: { method: "ai_estimated", accepted: true, grams: 30 } }] }).success).toBe(false);
  });

  it.each([0, -1, 5001])("rejects invalid quantity %s", (quantity) => {
    expect(() => createMealSchema.parse({ title: "Lunch", items: [{ foodId: "egg", quantity, unit: "g" }] })).toThrow();
  });
});

// Owner-beta (2026-09-14) — recipe-confirm checkpoint: a discovered web
// recipe becoming a real, persisted meal contribution alongside ordinary
// catalog items, in the SAME createMeal request/transaction.
describe("meal creation with a recipe-discovery item", () => {
  const potatoFood = { id: "potato", name: "Burgonya", originalName: "Burgonya", names: {}, searchText: "burgonya krumpli potato", source: "bls", sourceId: "1", servings: [], kcalPer100g: 77, fatPer100g: 0.1, proteinPer100g: 2, carbsPer100g: 17, fiberPer100g: 2.2 };
  const porkHockFood = { id: "pork-hock", name: "Sertéscsülök", originalName: "Sertéscsülök", names: {}, searchText: "sertescsulok pork hock", source: "bls", sourceId: "2", servings: [], kcalPer100g: 280, fatPer100g: 22, proteinPer100g: 20, carbsPer100g: 0, fiberPer100g: 0 };
  const SOURCE_URL = "https://example.com/csulokporkolt";

  function recipeHtml(ingredients: string[]) {
    return `<html><script type="application/ld+json">${JSON.stringify({ "@type": "Recipe", name: "Csülökpörkölt", recipeYield: "4 servings", recipeIngredient: ingredients, recipeInstructions: ["Cook."] })}</script></html>`;
  }

  function fakePrisma() {
    const meals: any[] = [];
    let recipeCreateCalls = 0;
    const client: any = {
      foodAlias: { findMany: async () => [] },
      food: {
        findMany: async ({ where }: any) => {
          if (where.id?.in) return [potatoFood, porkHockFood].filter((f) => where.id.in.includes(f.id)).map((f) => ({ ...f, servings: f.servings ?? [] }));
          return [potatoFood, porkHockFood].filter((f) => where.OR?.some((c: any) => f.searchText.includes(c.searchText?.contains ?? " ")));
        }
      },
      recipe: {
        findFirst: async () => null,
        create: async ({ data }: any) => {
          recipeCreateCalls += 1;
          const ingredients = (data.ingredients.create as any[]).map((i: any, idx: number) => ({ ...i, id: `ri-${idx}`, food: [potatoFood, porkHockFood].find((f) => f.id === i.foodId) }));
          return { id: `recipe-${recipeCreateCalls}`, userId: data.userId, title: data.title, servings: data.servings ?? null, finishedWeightGrams: null, sourceUrl: data.sourceUrl, ingredients };
        }
      },
      meal: {
        create: async ({ data }: any) => {
          const meal = { id: "meal-1", userId: data.userId, title: data.title, eatenAt: data.eatenAt ?? new Date(), createdAt: new Date(), items: data.items.create.map((item: any, idx: number) => ({ id: `item-${idx}`, mealId: "meal-1", foodId: item.food?.connect?.id ?? null, recipeId: item.recipe?.connect?.id ?? null, quantityGrams: item.quantityGrams, displayName: item.displayName ?? null, snapshotKcal: item.snapshotKcal ?? null, snapshotFat: item.snapshotFat ?? null, snapshotProtein: item.snapshotProtein ?? null, snapshotCarbs: item.snapshotCarbs ?? null, snapshotFiber: item.snapshotFiber ?? null, food: item.food?.connect ? [potatoFood, porkHockFood].find((f) => f.id === item.food.connect.id) : null, recipe: null })) };
          meals.push(meal);
          return meal;
        }
      }
    };
    return { client, meals, recipeCreateCalls: () => recipeCreateCalls };
  }

  function deps(overrides: Partial<RecipeDiscoveryMealItemDeps> = {}): RecipeDiscoveryMealItemDeps {
    return {
      recipeAiProvider: new DisabledRecipeExtractionProvider() as RecipeExtractionProvider,
      dynamic: null,
      fetchDependencies: { resolve: async () => [{ address: "93.184.216.34", family: 4 }], request: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(recipeHtml(["800 g sertéscsülök"])) }) },
      ...overrides
    };
  }

  // Serves DIFFERENT HTML depending on which sourceUrl was fetched — needed
  // for the two-distinct-recipes-in-one-request tests below.
  function depsForUrls(byUrl: Record<string, string[]>): RecipeDiscoveryMealItemDeps {
    return deps({
      fetchDependencies: {
        resolve: async () => [{ address: "93.184.216.34", family: 4 }],
        request: async (url: URL) => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(recipeHtml(byUrl[url.href] ?? ["800 g sertéscsülök"])) })
      }
    });
  }

  function recipeItem(overrides: Partial<{ sourceUrl: string; quantity: number; unit: "g" | "serving" }> = {}) {
    const sourceUrl = overrides.sourceUrl ?? SOURCE_URL;
    return {
      sourceUrl,
      importProof: createRecipeImportProof("user-1", sourceUrl, "schema_org_json_ld"),
      extractionMethod: "schema_org_json_ld" as const,
      quantity: 800,
      unit: "g" as const,
      ...overrides
    };
  }

  it("without recipeDeps configured, a recipe-discovery item is refused rather than silently ignored", async () => {
    const fake = fakePrisma();
    const input = createMealSchema.parse({ title: "Ebéd", items: [recipeItem()] });
    await expect(createMeal(fake.client, "user-1", input)).rejects.toMatchObject({ publicCode: "recipe_discovery_unavailable", status: 503 });
    expect(fake.meals).toHaveLength(0);
  });

  it("a recipe item alone persists a Meal with a recipeId-backed MealItem, no food row", async () => {
    const fake = fakePrisma();
    const input = createMealSchema.parse({ title: "Ebéd", items: [recipeItem()] });
    const meal = await createMeal(fake.client, "user-1", input, deps());
    expect(fake.meals).toHaveLength(1);
    expect(meal.items).toHaveLength(1);
    expect(meal.items[0].recipeId).toBe("recipe-1");
    expect(meal.items[0].food).toBeNull();
  });

  it("Case A (no overlap): the recipe (sertéscsülök only) plus an independent potato sibling both persist, both contribute nutrition", async () => {
    const fake = fakePrisma();
    const input = createMealSchema.parse({ title: "Ebéd", items: [recipeItem(), { foodId: "potato", quantity: 150, unit: "g" }] });
    const meal = await createMeal(fake.client, "user-1", input, deps());
    expect(meal.items).toHaveLength(2);
    const recipeMealItem = meal.items.find((i: any) => i.recipeId);
    const potatoMealItem = meal.items.find((i: any) => i.food);
    expect(recipeMealItem).toBeDefined();
    expect(potatoMealItem).toBeDefined();
    expect(potatoMealItem.quantityGrams).toBe(150);
  });

  it("Case B (confirmed overlap): a sibling item referencing a Food the SAME recipe already resolved is rejected outright, never silently persisted twice", async () => {
    const fake = fakePrisma();
    const overlapDeps: RecipeDiscoveryMealItemDeps = {
      ...deps(),
      // The recipe's own ingredients this time include potato too.
      fetchDependencies: { resolve: async () => [{ address: "93.184.216.34", family: 4 }], request: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(recipeHtml(["800 g sertéscsülök", "500 g burgonya"])) }) }
    };
    const input = createMealSchema.parse({ title: "Ebéd", items: [recipeItem(), { foodId: "potato", quantity: 150, unit: "g" }] });
    await expect(createMeal(fake.client, "user-1", input, overlapDeps)).rejects.toMatchObject({ publicCode: "recipe_sibling_overlap", status: 409 });
    expect(fake.meals).toHaveLength(0);
  });

  // Owner-beta (2026-09-15) — final PR review found this: the sibling-
  // overlap check only ever compared a recipe against ordinary catalog
  // items — two DISTINCT recipe-discovery items in the SAME request were
  // never cross-checked against each other at all.
  it("two DIFFERENT recipes in the same request that each genuinely include the same ingredient are rejected, never silently double-counted", async () => {
    const fake = fakePrisma();
    const OTHER_URL = "https://example.com/lecso";
    const twoRecipesOverlapDeps = depsForUrls({
      [SOURCE_URL]: ["800 g sertéscsülök", "500 g burgonya"],
      [OTHER_URL]: ["300 g burgonya"]
    });
    const input = createMealSchema.parse({ title: "Ebéd", items: [recipeItem(), recipeItem({ sourceUrl: OTHER_URL })] });
    await expect(createMeal(fake.client, "user-1", input, twoRecipesOverlapDeps)).rejects.toMatchObject({ publicCode: "recipe_sibling_overlap", status: 409 });
    expect(fake.meals).toHaveLength(0);
  });

  it("two DIFFERENT recipes with genuinely disjoint ingredients both persist as independent MealItems", async () => {
    const fake = fakePrisma();
    const OTHER_URL = "https://example.com/lecso";
    const disjointDeps = depsForUrls({
      [SOURCE_URL]: ["800 g sertéscsülök"],
      [OTHER_URL]: ["300 g burgonya"]
    });
    const input = createMealSchema.parse({ title: "Ebéd", items: [recipeItem(), recipeItem({ sourceUrl: OTHER_URL })] });
    const meal = await createMeal(fake.client, "user-1", input, disjointDeps);
    expect(meal.items).toHaveLength(2);
    expect(meal.items.every((i: any) => i.recipeId)).toBe(true);
    expect(new Set(meal.items.map((i: any) => i.recipeId)).size).toBe(2);
  });

  // Owner-beta (2026-09-15) — final PR review found this: two items in the
  // same request referencing the IDENTICAL sourceUrl each independently ran
  // resolveRecipeDiscoveryMealItem's own-recipe lookup concurrently — since
  // neither had committed when the other's lookup ran, both could miss each
  // other and each create its own duplicate Recipe row for the same URL.
  it("two items in the same request referencing the SAME sourceUrl resolve to the SAME Recipe — no duplicate Recipe row from the in-request race", async () => {
    const fake = fakePrisma();
    const input = createMealSchema.parse({ title: "Ebéd", items: [recipeItem({ quantity: 400, unit: "g" }), recipeItem({ quantity: 400, unit: "g" })] });
    const meal = await createMeal(fake.client, "user-1", input, deps());
    expect(fake.recipeCreateCalls()).toBe(1);
    expect(meal.items).toHaveLength(2);
    expect(meal.items[0].recipeId).toBe(meal.items[1].recipeId);
  });

  // Owner-beta (2026-09-15) — final PR review found this: createMealSchema's
  // items union is tried in declaration order, and (before this fix) a
  // non-strict catalog/manual schema silently STRIPPED unrecognized keys
  // instead of rejecting them. A payload carrying BOTH a real recipe-
  // discovery shape (sourceUrl/importProof/extractionMethod) AND fields
  // that happen to satisfy catalogMealItemSchema's own requirements
  // (foodId+quantity+unit) matched catalog FIRST, silently discarding the
  // recipe fields and being reinterpreted as an ordinary catalog item. Not a
  // nutrition-forgery vector (a catalog item's macros always come from the
  // real Food row regardless of which foodId is chosen), but a genuine
  // fail-open schema-discrimination gap — strict() on every union member
  // now makes this fail closed instead of guessing.
  it("a payload shaped to satisfy multiple union members at once is rejected outright, never silently reinterpreted as a different item type", () => {
    const mixed = {
      sourceUrl: SOURCE_URL,
      importProof: createRecipeImportProof("user-1", SOURCE_URL, "schema_org_json_ld"),
      extractionMethod: "schema_org_json_ld" as const,
      foodId: "potato",
      quantity: 100,
      unit: "g" as const
    };
    expect(createMealSchema.safeParse({ title: "Ebéd", items: [mixed] }).success).toBe(false);
  });
});
