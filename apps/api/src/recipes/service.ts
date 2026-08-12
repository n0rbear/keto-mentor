import type { Prisma, PrismaClient } from "@prisma/client";
import type { RecipeInput, RecipeMealInput } from "@keto-mentor/shared";
import { calculateRecipeNutrition, scaleRecipeSnapshot, type RecipeWithIngredients } from "./nutrition.js";
import { serializeMeal } from "../nutrition.js";

const recipeInclude = {
  user: { select: { id: true, username: true } },
  ingredients: {
    orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }],
    include: { food: { include: { nutrients: { include: { nutrient: true } } } } }
  }
} satisfies Prisma.RecipeInclude;

type FullRecipe = Prisma.RecipeGetPayload<{ include: typeof recipeInclude }>;

const notFound = () => Object.assign(new Error("recipe_not_found"), { status: 404, publicCode: "recipe_not_found" });

export function serializeRecipe(recipe: FullRecipe) {
  return { ...recipe, nutrition: calculateRecipeNutrition(recipe as RecipeWithIngredients) };
}

async function ensureFoodsExist(prisma: PrismaClient, input: RecipeInput) {
  const ids = [...new Set(input.ingredients.map((ingredient) => ingredient.foodId))];
  const count = await prisma.food.count({ where: { id: { in: ids } } });
  if (count !== ids.length) throw Object.assign(new Error("food_not_found"), { status: 404, publicCode: "food_not_found" });
}

const ingredientCreates = (input: RecipeInput) => input.ingredients.map((ingredient, index) => ({ ...ingredient, sortOrder: ingredient.sortOrder ?? index }));

export async function createRecipe(prisma: PrismaClient, userId: string, input: RecipeInput) {
  await ensureFoodsExist(prisma, input);
  const recipe = await prisma.recipe.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      servings: input.servings,
      finishedWeightGrams: input.finishedWeightGrams,
      visibility: input.visibility,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl,
      ingredients: { create: ingredientCreates(input) }
    },
    include: recipeInclude
  });
  return serializeRecipe(recipe);
}

export async function listOwnRecipes(prisma: PrismaClient, userId: string, query: { q?: string; limit: number; cursor?: string }) {
  return listRecipes(prisma, { userId, deletedAt: null, ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}) }, query);
}

export async function listPublicRecipes(prisma: PrismaClient, query: { q?: string; limit: number; cursor?: string }) {
  return listRecipes(prisma, { visibility: "public", deletedAt: null, ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}) }, query);
}

async function listRecipes(prisma: PrismaClient, where: Prisma.RecipeWhereInput, query: { limit: number; cursor?: string }) {
  const rows = await prisma.recipe.findMany({
    where,
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: recipeInclude
  });
  const hasMore = rows.length > query.limit;
  const page = rows.slice(0, query.limit);
  return { recipes: page.map(serializeRecipe), nextCursor: hasMore ? page.at(-1)?.id ?? null : null };
}

export async function getVisibleRecipe(prisma: PrismaClient, userId: string, recipeId: string) {
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, deletedAt: null, OR: [{ userId }, { visibility: "public" }] },
    include: recipeInclude
  });
  if (!recipe) throw notFound();
  return recipe;
}

async function getOwnedRecipe(prisma: PrismaClient, userId: string, recipeId: string) {
  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, userId, deletedAt: null }, include: recipeInclude });
  if (!recipe) throw notFound();
  return recipe;
}

export async function updateRecipe(prisma: PrismaClient, userId: string, recipeId: string, input: RecipeInput) {
  await getOwnedRecipe(prisma, userId, recipeId);
  await ensureFoodsExist(prisma, input);
  const recipe = await prisma.$transaction(async (tx) => {
    await tx.recipeIngredient.deleteMany({ where: { recipeId } });
    return tx.recipe.update({
      where: { id: recipeId },
      data: {
        title: input.title,
        description: input.description,
        servings: input.servings,
        finishedWeightGrams: input.finishedWeightGrams,
        visibility: input.visibility,
        sourceType: input.sourceType,
        sourceUrl: input.sourceUrl,
        ingredients: { create: ingredientCreates(input) }
      },
      include: recipeInclude
    });
  });
  return serializeRecipe(recipe);
}

export async function deleteRecipe(prisma: PrismaClient, userId: string, recipeId: string) {
  await getOwnedRecipe(prisma, userId, recipeId);
  await prisma.recipe.update({ where: { id: recipeId }, data: { deletedAt: new Date() } });
}

export async function forkRecipe(prisma: PrismaClient, userId: string, recipeId: string) {
  const source = await prisma.recipe.findFirst({ where: { id: recipeId, visibility: "public", deletedAt: null }, include: recipeInclude });
  if (!source) throw notFound();
  const copy = await prisma.recipe.create({
    data: {
      userId,
      title: source.title,
      description: source.description,
      servings: source.servings,
      finishedWeightGrams: source.finishedWeightGrams,
      visibility: "private",
      sourceType: source.sourceType,
      sourceUrl: source.sourceUrl,
      provenance: { forkedFromRecipeId: source.id, originalAuthor: source.user.username, sourceProvenance: source.provenance ?? null },
      forkedFromRecipeId: source.id,
      ingredients: { create: source.ingredients.map(({ foodId, quantityGrams, originalText, preparation, sortOrder }) => ({ foodId, quantityGrams, originalText, preparation, sortOrder })) }
    },
    include: recipeInclude
  });
  return serializeRecipe(copy);
}

export async function addRecipeToMeal(prisma: PrismaClient, userId: string, recipeId: string, input: RecipeMealInput) {
  const recipe = await getVisibleRecipe(prisma, userId, recipeId);
  const nutrition = calculateRecipeNutrition(recipe as RecipeWithIngredients);
  const baseWeight = recipe.finishedWeightGrams ?? nutrition.ingredientWeightGrams;
  const factor = input.unit === "serving"
    ? recipe.servings ? input.quantity / recipe.servings : (() => { throw Object.assign(new Error("recipe_servings_required"), { status: 400, publicCode: "recipe_servings_required" }); })()
    : input.quantity / baseWeight;
  const snapshot = scaleRecipeSnapshot(nutrition.total.macros, nutrition.total.nutrients, factor);
  const quantityGrams = input.unit === "serving" ? baseWeight * factor : input.quantity;
  const meal = await prisma.meal.create({
    data: {
      userId,
      title: input.title ?? recipe.title,
      items: { create: {
        recipeId: recipe.id,
        quantityGrams,
        displayName: recipe.title,
        snapshotKcal: snapshot.macros.kcal,
        snapshotFat: snapshot.macros.fat,
        snapshotProtein: snapshot.macros.protein,
        snapshotCarbs: snapshot.macros.carbs,
        snapshotFiber: snapshot.macros.fiber,
        snapshotNutrients: snapshot.nutrients
      } }
    },
    include: { items: { include: { food: true, recipe: true } } }
  });
  return serializeMeal(meal);
}
