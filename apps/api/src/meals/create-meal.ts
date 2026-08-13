import type { PrismaClient } from "@prisma/client";
import type { CreateMealInput } from "@keto-mentor/shared";
import { serializeMeal } from "../nutrition.js";
import { assertExactlyOneMealItemSource } from "./meal-item-source.js";

export async function createMeal(prisma: PrismaClient, userId: string, input: CreateMealInput) {
  const catalogFoodIds = input.items.filter((item) => "foodId" in item).map((item) => item.foodId);
  const catalogFoods = await prisma.food.findMany({ where: { id: { in: catalogFoodIds } } });
  const byId = new Map(catalogFoods.map((food) => [food.id, food]));
  const meal = await prisma.meal.create({
    data: {
      userId,
      title: input.title,
      eatenAt: input.eatenAt ? new Date(input.eatenAt) : new Date(),
      items: {
        create: input.items.map((item) => {
          if ("foodId" in item) {
            assertExactlyOneMealItemSource({ hasFood: true, hasRecipe: false });
            const food = byId.get(item.foodId);
            if (!food) throw Object.assign(new Error("food_not_found"), { status: 404, publicCode: "food_not_found" });
            const quantityGrams = item.unit === "serving" ? item.quantity * (food.servingGrams ?? 100) : item.quantity;
            return { quantityGrams, food: { connect: { id: item.foodId } } };
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
