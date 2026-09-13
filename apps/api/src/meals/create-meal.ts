import type { Prisma, PrismaClient } from "@prisma/client";
import type { CreateMealInput } from "@keto-mentor/shared";
import { serializeMeal } from "../nutrition.js";
import { assertExactlyOneMealItemSource } from "./meal-item-source.js";
import { convertFoodQuantity } from "./food-quantity.js";
import { resolveRecipeDiscoveryMealItem, type RecipeDiscoveryMealItemDeps } from "./recipe-discovery-meal-item.js";

function siblingOverlapError(canonicalName: string) {
  return Object.assign(new Error("recipe_sibling_overlap"), { status: 409, publicCode: "recipe_sibling_overlap", canonicalName });
}

export async function createMeal(prisma: PrismaClient, userId: string, input: CreateMealInput, recipeDeps?: RecipeDiscoveryMealItemDeps) {
  const catalogItems = input.items.filter((item): item is Extract<CreateMealInput["items"][number], { foodId: string }> => "foodId" in item);
  const catalogFoodIds = catalogItems.map((item) => item.foodId);
  const catalogFoods = await prisma.food.findMany({ where: { id: { in: catalogFoodIds } }, include: { servings: true } });
  const byId = new Map(catalogFoods.map((food) => [food.id, food]));

  // Recipe-discovery items involve real network/AI work (re-deriving the
  // trusted ingredient list server-side — see resolveRecipeDiscoveryMealItem)
  // and must never trust the client for identity/nutrition, so they are
  // resolved BEFORE the single synchronous meal.create write below — the
  // same reason catalog items are pre-fetched into `byId` above rather than
  // looked up inside the create() callback.
  const recipeDiscoveryItems = input.items.filter((item): item is Extract<CreateMealInput["items"][number], { sourceUrl: string }> => "sourceUrl" in item);
  if (recipeDiscoveryItems.length && !recipeDeps) throw Object.assign(new Error("recipe_discovery_unavailable"), { status: 503, publicCode: "recipe_discovery_unavailable" });
  const resolvedRecipeItems = await Promise.all(recipeDiscoveryItems.map((item) => resolveRecipeDiscoveryMealItem(prisma, userId, item, recipeDeps!)));

  // Owner-beta (2026-09-14) — Blocker 4 enforcement (double counting): the
  // client is responsible for NOT submitting a sibling item the meal-input
  // preview already flagged as excludedBySiblingRecipe, but the server is
  // the actual authority boundary — never trust that the client did this
  // correctly. Re-derive the SAME identity-based overlap check here, against
  // the FRESHLY-resolved (never client-supplied) recipe ingredient Food IDs:
  // any catalog sibling item whose foodId is one of them is rejected
  // outright (409) rather than silently dropped — "do not silently delete
  // user-entered items" applies at the persistence boundary too; the client
  // must resubmit without that item, an explicit, visible correction.
  const allResolvedFoodIds = new Set(resolvedRecipeItems.flatMap((r) => Array.from(r.resolvedFoodIds)));
  if (allResolvedFoodIds.size) {
    for (const item of catalogItems) {
      if (allResolvedFoodIds.has(item.foodId)) {
        const food = byId.get(item.foodId);
        throw siblingOverlapError(food?.name ?? item.foodId);
      }
    }
  }

  let recipeItemIndex = 0;
  const meal = await prisma.meal.create({
    data: {
      userId,
      title: input.title,
      eatenAt: input.eatenAt ? new Date(input.eatenAt) : new Date(),
      items: {
        create: input.items.map((item): Prisma.MealItemCreateWithoutMealInput => {
          if ("foodId" in item) {
            assertExactlyOneMealItemSource({ hasFood: true, hasRecipe: false });
            const food = byId.get(item.foodId);
            if (!food) throw Object.assign(new Error("food_not_found"), { status: 404, publicCode: "food_not_found" });
            const converted = convertFoodQuantity(item, food.servings);
            return {
              quantityGrams: converted.grams,
              inputQuantity: item.quantity,
              inputUnit: item.unit,
              conversionSnapshot: item.quantityConfirmation ? { ...converted.snapshot, quantityConfirmation: item.quantityConfirmation } : converted.snapshot,
              food: { connect: { id: item.foodId } }
            };
          }
          if ("sourceUrl" in item) {
            assertExactlyOneMealItemSource({ hasFood: false, hasRecipe: true });
            const resolved = resolvedRecipeItems[recipeItemIndex++];
            const { recipeId, ...rest } = resolved.mealItemData;
            return { ...rest, recipe: { connect: { id: recipeId } } };
          }
          assertExactlyOneMealItemSource({ hasFood: true, hasRecipe: false });
          return {
            quantityGrams: item.quantityGrams,
            food: { create: { name: item.foodName, source: item.source, provenance: { createdVia: "manual_fallback", userId }, kcalPer100g: item.kcalPer100g, fatPer100g: item.fatPer100g, proteinPer100g: item.proteinPer100g, carbsPer100g: item.carbsPer100g, fiberPer100g: item.fiberPer100g, createdById: userId } }
          };
        })
      }
    },
    include: { items: { include: { food: true, recipe: true } } }
  });
  return serializeMeal(meal);
}
