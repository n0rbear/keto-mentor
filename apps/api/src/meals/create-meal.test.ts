import { describe, expect, it } from "vitest";
import type { Food, PrismaClient } from "@prisma/client";
import { createMealSchema } from "@keto-mentor/shared";
import { createMeal } from "./create-meal.js";

const food = { id: "egg", name: "Fried egg", servingGrams: 50, kcalPer100g: 200, fatPer100g: 15, proteinPer100g: 14, carbsPer100g: 1, fiberPer100g: 0 } as Food;

function fakePrisma(hasFood = true) {
  let capturedGrams = 0;
  const client = {
    food: { findMany: async () => hasFood ? [food] : [] },
    meal: { create: async ({ data }: any) => {
      capturedGrams = data.items.create[0].quantityGrams;
      return { id: "meal", userId: data.userId, title: data.title, eatenAt: data.eatenAt, createdAt: new Date(), items: [{ id: "item", mealId: "meal", foodId: food.id, quantityGrams: capturedGrams, food }] };
    } }
  } as unknown as PrismaClient;
  return { client, grams: () => capturedGrams };
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
    await createMeal(fake.client, "user", createMealSchema.parse({ title: "Breakfast", items: [{ foodId: "egg", quantity: 2, unit: "serving" }] }));
    expect(fake.grams()).toBe(100);
  });

  it("rejects an invalid food id", async () => {
    const fake = fakePrisma(false);
    await expect(createMeal(fake.client, "user", createMealSchema.parse({ title: "Lunch", items: [{ foodId: "missing", quantity: 100, unit: "g" }] }))).rejects.toMatchObject({ publicCode: "food_not_found", status: 404 });
  });

  it.each([0, -1, 5001])("rejects invalid quantity %s", (quantity) => {
    expect(() => createMealSchema.parse({ title: "Lunch", items: [{ foodId: "egg", quantity, unit: "g" }] })).toThrow();
  });
});
