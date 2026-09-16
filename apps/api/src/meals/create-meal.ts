import type { Prisma, PrismaClient } from "@prisma/client";
import type { CreateMealInput } from "@keto-mentor/shared";
import { serializeMeal } from "../nutrition.js";
import { assertExactlyOneMealItemSource } from "./meal-item-source.js";
import { convertFoodQuantity } from "./food-quantity.js";
import { prepareRecipeDiscoveryItem, persistPreparedRecipe, computeRecipeMealItemData, resolvedFoodIdsOf, type RecipeDiscoveryMealItemDeps, type PreparedRecipeDiscoveryItem } from "./recipe-discovery-meal-item.js";
import { verifyAiEstimateProof } from "../catalog/ai-estimate-proof.js";
import { findUserPrivateFood } from "../catalog/dynamic-food-resolution.js";
import { normalizeSearch, buildSearchText } from "../catalog/normalize.js";

function siblingOverlapError(canonicalName: string) {
  return Object.assign(new Error("recipe_sibling_overlap"), { status: 409, publicCode: "recipe_sibling_overlap", canonicalName });
}

export async function createMeal(prisma: PrismaClient, userId: string, input: CreateMealInput, recipeDeps?: RecipeDiscoveryMealItemDeps) {
  const catalogItems = input.items.filter((item): item is Extract<CreateMealInput["items"][number], { foodId: string }> => "foodId" in item);
  const catalogFoodIds = catalogItems.map((item) => item.foodId);
  const catalogFoods = await prisma.food.findMany({ where: { id: { in: catalogFoodIds } }, include: { servings: true } });
  const byId = new Map(catalogFoods.map((food) => [food.id, food]));

  // FINAL FALLBACK: AI-ESTIMATED NUTRITION (2026-09-16). Every proof is
  // verified BEFORE any DB write (same "validate everything, then persist"
  // discipline the recipe-discovery items below already follow) — a client
  // cannot accept an estimate's identity while substituting different
  // numbers, and cannot accept an estimate that was never actually generated
  // for this user (verifyAiEstimateProof throws invalid_ai_estimate_proof).
  // Part O: if this exact user already has ANY private Food (ai_estimated OR
  // user_input — either kind of prior acceptance/entry counts) for this
  // identity, it is reused rather than creating a duplicate; new private
  // Foods are always createdById: userId, which is what keeps them entirely
  // invisible to every OTHER user's resolution (searchFoods only ever
  // queries createdById: null — see catalog/food-search.ts).
  const aiEstimateFoodIdByIndex = new Map<number, string>();
  for (const [index, item] of input.items.entries()) {
    if (!("aiEstimateProof" in item)) continue;
    verifyAiEstimateProof(item.aiEstimateProof, userId, {
      requestedIdentity: item.requestedIdentity, canonicalFoodName: item.canonicalFoodName,
      kcalPer100g: item.kcalPer100g, proteinPer100g: item.proteinPer100g, fatPer100g: item.fatPer100g,
      carbsPer100g: item.carbsPer100g, fiberPer100g: item.fiberPer100g
    });
    const existing = await findUserPrivateFood(prisma, userId, normalizeSearch(item.requestedIdentity));
    if (existing) {
      aiEstimateFoodIdByIndex.set(index, existing.id);
      continue;
    }
    const created = await prisma.food.create({
      data: {
        name: item.canonicalFoodName, originalName: item.requestedIdentity, source: "ai_estimated", createdById: userId,
        kcalPer100g: item.kcalPer100g, fatPer100g: item.fatPer100g, proteinPer100g: item.proteinPer100g,
        carbsPer100g: item.carbsPer100g, fiberPer100g: item.fiberPer100g,
        searchText: buildSearchText({ name: item.canonicalFoodName, originalName: item.requestedIdentity }),
        provenance: { method: "ai_estimated", requestedIdentity: item.requestedIdentity, canonicalFoodName: item.canonicalFoodName, userAccepted: true, acceptedAt: new Date().toISOString() }
      }
    });
    aiEstimateFoodIdByIndex.set(index, created.id);
  }

  // Recipe-discovery items involve real network/AI work (re-deriving the
  // trusted ingredient list server-side) and must never trust the client for
  // identity/nutrition, so every item is fully PREPARED (verified + derived
  // + validated, but NOT yet persisted — see recipe-discovery-meal-item.ts)
  // before any DB write happens, exactly like catalog items are pre-fetched
  // into `byId` above rather than looked up inside the create() callback.
  //
  // Owner-beta (2026-09-15) — final PR review: resolving once per DISTINCT
  // sourceUrl (not once per item) removes a self-inflicted race — two items
  // in the SAME request referencing the identical URL previously ran their
  // own "does the user already own this Recipe" lookup concurrently and,
  // since neither had committed when the other's lookup ran, could each
  // create a duplicate Recipe row for the same URL. The two items still
  // become two independent MealItems (e.g. two different portions of the
  // same recipe), just sharing one prepared/persisted Recipe.
  const recipeDiscoveryItems = input.items.filter((item): item is Extract<CreateMealInput["items"][number], { sourceUrl: string }> => "sourceUrl" in item);
  if (recipeDiscoveryItems.length && !recipeDeps) throw Object.assign(new Error("recipe_discovery_unavailable"), { status: 503, publicCode: "recipe_discovery_unavailable" });
  const uniqueSourceUrls = [...new Set(recipeDiscoveryItems.map((item) => item.sourceUrl))];
  const preparedByUrl = new Map<string, PreparedRecipeDiscoveryItem>(await Promise.all(uniqueSourceUrls.map(async (url) => {
    const item = recipeDiscoveryItems.find((i) => i.sourceUrl === url)!;
    return [url, await prepareRecipeDiscoveryItem(prisma, userId, item, recipeDeps!)] as const;
  })));

  // Owner-beta (2026-09-14) — Blocker 4 enforcement (double counting): the
  // client is responsible for NOT submitting a sibling item the meal-input
  // preview already flagged as excludedBySiblingRecipe, but the server is
  // the actual authority boundary — never trust that the client did this
  // correctly. Re-derive the SAME identity-based overlap check here, against
  // the FRESHLY-resolved (never client-supplied) recipe ingredient Food IDs:
  // any catalog sibling item whose foodId is one of them is rejected
  // outright (409) rather than silently dropped — "do not silently delete
  // user-entered items" applies at the persistence boundary too; the client
  // must resubmit without that item, an explicit, visible correction. This
  // runs entirely against PREPARED (not yet persisted) recipe data, so a
  // rejection here writes nothing to the database at all — no orphan Recipe.
  const distinctPrepared = [...preparedByUrl.values()];
  const allResolvedFoodIds = new Set(distinctPrepared.flatMap((p) => Array.from(resolvedFoodIdsOf(p))));
  if (allResolvedFoodIds.size) {
    for (const item of catalogItems) {
      if (allResolvedFoodIds.has(item.foodId)) {
        const food = byId.get(item.foodId);
        throw siblingOverlapError(food?.name ?? item.foodId);
      }
    }
  }

  // Owner-beta (2026-09-15) — final PR review found this: the check above
  // only ever compared a recipe against ordinary catalog siblings — two
  // DISTINCT recipe-discovery items in the same request (e.g. two separate,
  // individually-legitimate confirmations submitted together) were never
  // cross-checked against EACH OTHER at all, so two recipes that each
  // genuinely include the same ingredient (e.g. both call for potato) would
  // silently double-count it. Compare every distinct-recipe pair now, using
  // the exact same identity-based signal, still before anything is persisted.
  for (let i = 0; i < distinctPrepared.length; i++) {
    for (let j = i + 1; j < distinctPrepared.length; j++) {
      const a = distinctPrepared[i], b = distinctPrepared[j];
      if (a.kind === "existing" && b.kind === "existing" && a.recipeId === b.recipeId) continue;
      const aIds = resolvedFoodIdsOf(a);
      for (const foodId of resolvedFoodIdsOf(b)) {
        if (aIds.has(foodId)) throw siblingOverlapError(foodId);
      }
    }
  }

  // Portion math (servings/grams) can ALSO fail (recipe_servings_required,
  // recipe_nutrition_not_calculable) — computed here, against the prepared-
  // but-not-yet-persisted data, so that failure ALSO writes nothing. The
  // recipeId placeholder is filled in for real once persistence (next step)
  // has actually happened; it plays no part in the nutrition math itself.
  const recipeMealItemDataByOriginalIndex = new Map<number, ReturnType<typeof computeRecipeMealItemData>>();
  input.items.forEach((item, index) => {
    if (!("sourceUrl" in item)) return;
    const prepared = preparedByUrl.get(item.sourceUrl)!;
    recipeMealItemDataByOriginalIndex.set(index, computeRecipeMealItemData(prepared, "pending", item));
  });

  // Every check above has passed — only NOW does any recipe-discovery item
  // actually get written (or, for a reused Recipe, its id confirmed).
  const recipeIdByUrl = new Map<string, string>(await Promise.all(
    [...preparedByUrl.entries()].map(async ([url, prepared]) => [url, await persistPreparedRecipe(prisma, prepared)] as const)
  ));
  for (const [index, item] of input.items.entries()) {
    if (!("sourceUrl" in item)) continue;
    const data = recipeMealItemDataByOriginalIndex.get(index)!;
    data.recipeId = recipeIdByUrl.get(item.sourceUrl)!;
  }

  const meal = await prisma.meal.create({
    data: {
      userId,
      title: input.title,
      eatenAt: input.eatenAt ? new Date(input.eatenAt) : new Date(),
      items: {
        create: input.items.map((item, index): Prisma.MealItemCreateWithoutMealInput => {
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
            const { recipeId, ...rest } = recipeMealItemDataByOriginalIndex.get(index)!;
            return { ...rest, recipe: { connect: { id: recipeId } } };
          }
          if ("aiEstimateProof" in item) {
            assertExactlyOneMealItemSource({ hasFood: true, hasRecipe: false });
            const foodId = aiEstimateFoodIdByIndex.get(index)!;
            return { quantityGrams: item.quantityGrams, food: { connect: { id: foodId } } };
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
