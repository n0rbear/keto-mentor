import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { repeatMealSchema } from "@keto-mentor/shared";
import { repeatMeal } from "./repeat-meal.js";
import { getMealsForDay } from "./diary-query.js";
import { resolveDiaryDateRange } from "./diary-date.js";

const egg = { id: "egg", name: "Fried egg", kcalPer100g: 200, fatPer100g: 15, proteinPer100g: 14, carbsPer100g: 1, fiberPer100g: 0 };
const chiliRecipe = { id: "recipe-1", title: "Chili" };

function fakeFoodItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "item-1", mealId: "meal-1", foodId: egg.id, recipeId: null, quantityGrams: 100,
    displayName: null, snapshotKcal: null, snapshotFat: null, snapshotProtein: null, snapshotCarbs: null, snapshotFiber: null,
    snapshotNutrients: null, inputQuantity: 1, inputUnit: "handful",
    conversionSnapshot: { method: "user_corrected", userCorrected: true, confidence: null, quantityConfirmation: { method: "user_corrected", accepted: true, grams: 100 } },
    ...overrides
  };
}

function fakeRecipeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "item-2", mealId: "meal-1", foodId: null, recipeId: chiliRecipe.id, quantityGrams: 200,
    displayName: "Chili", snapshotKcal: 400, snapshotFat: 20, snapshotProtein: 30, snapshotCarbs: 10, snapshotFiber: 4,
    snapshotNutrients: { sodium: { key: "sodium", label: "Sodium", unit: "mg", group: "minerals", amount: 100 } },
    inputQuantity: null, inputUnit: null, conversionSnapshot: null,
    ...overrides
  };
}

function createFakeDb(meals: any[]) {
  const db = new Map(meals.map((m) => [m.id, { ...m, items: m.items.map((i: any) => ({ ...i })) }]));
  let counter = 1;
  const client = {
    meal: {
      findFirst: async ({ where }: any) => {
        const meal = db.get(where.id);
        return meal && meal.userId === where.userId ? { ...meal, items: meal.items.map((i: any) => ({ ...i })) } : null;
      },
      findMany: async ({ where }: any) => [...db.values()]
        .filter((m) => m.userId === where.userId && m.eatenAt >= where.eatenAt.gte && m.eatenAt < where.eatenAt.lt)
        .map((m) => ({ ...m, items: m.items.map((i: any) => ({ ...i })) })),
      create: async ({ data }: any) => {
        const id = `meal-new-${counter++}`;
        const items = data.items.create.map((itemData: any) => ({
          id: `item-new-${counter++}`, mealId: id, ...itemData,
          food: itemData.foodId === egg.id ? egg : null,
          recipe: itemData.recipeId === chiliRecipe.id ? chiliRecipe : null
        }));
        const meal = { id, userId: data.userId, title: data.title, eatenAt: data.eatenAt, createdAt: new Date(), items };
        db.set(id, meal);
        return { ...meal, items: items.map((i: any) => ({ ...i })) };
      }
    },
    // Loud guards: repeatMeal must never touch these, no matter what.
    food: { create: () => { throw new Error("must not create a new Food record"); }, update: () => { throw new Error("must not mutate Food"); } },
    recipe: { update: () => { throw new Error("must not mutate Recipe"); } },
    $transaction: async (fn: any) => fn(client)
  } as unknown as PrismaClient;
  return { client, db };
}

const NOW = new Date("2026-09-06T14:00:00Z");

describe("repeatMealSchema validation", () => {
  it("accepts an empty body", () => {
    expect(() => repeatMealSchema.parse({})).not.toThrow();
  });

  it("rejects any client-supplied field, including nutrition and identity", () => {
    expect(() => repeatMealSchema.parse({ kcal: 500 })).toThrow();
    expect(() => repeatMealSchema.parse({ foodId: "egg" })).toThrow();
    expect(() => repeatMealSchema.parse({ recipeId: "recipe-1" })).toThrow();
    expect(() => repeatMealSchema.parse({ userId: "someone-else" })).toThrow();
    expect(() => repeatMealSchema.parse({ mealItemId: "item-1" })).toThrow();
    expect(() => repeatMealSchema.parse({ eatenAt: "2026-09-06T00:00:00.000Z" })).toThrow();
  });
});

describe("repeatMeal", () => {
  it("lets the owner repeat their own meal", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: new Date("2026-01-01T12:00:00Z"), createdAt: new Date("2026-01-01T12:00:00Z"), items: [fakeFoodItem()] }]);
    const meal = await repeatMeal(fake.client, "user-a", "meal-1", NOW);
    expect(meal.title).toBe("Lunch");
  });

  it("gives the repeated meal a new id, distinct from the source", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: new Date("2026-01-01T12:00:00Z"), createdAt: new Date("2026-01-01T12:00:00Z"), items: [fakeFoodItem()] }]);
    const meal = await repeatMeal(fake.client, "user-a", "meal-1", NOW);
    expect(meal.id).not.toBe("meal-1");
  });

  it("gives every repeated item a new id, distinct from the source items", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Combo", eatenAt: new Date("2026-01-01T12:00:00Z"), createdAt: new Date("2026-01-01T12:00:00Z"), items: [fakeFoodItem({ id: "item-1" }), fakeRecipeItem({ id: "item-2" })] }]);
    const meal = await repeatMeal(fake.client, "user-a", "meal-1", NOW);
    expect(meal.items.map((i) => i.id)).not.toContain("item-1");
    expect(meal.items.map((i) => i.id)).not.toContain("item-2");
    expect(new Set(meal.items.map((i) => i.id)).size).toBe(2);
  });

  it("never mutates the source meal", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: new Date("2026-01-01T12:00:00Z"), createdAt: new Date("2026-01-01T12:00:00Z"), items: [fakeFoodItem()] }]);
    await repeatMeal(fake.client, "user-a", "meal-1", NOW);
    const source = fake.db.get("meal-1")!;
    expect(source.title).toBe("Lunch");
    expect(source.eatenAt).toEqual(new Date("2026-01-01T12:00:00Z"));
    expect(source.items).toHaveLength(1);
    expect(source.items[0].id).toBe("item-1");
  });

  it("timestamps the repeated meal at now, not the source's original time", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: new Date("2026-01-01T12:00:00Z"), createdAt: new Date("2026-01-01T12:00:00Z"), items: [fakeFoodItem()] }]);
    const meal = await repeatMeal(fake.client, "user-a", "meal-1", NOW);
    expect(new Date(meal.eatenAt).toISOString()).toBe(NOW.toISOString());
  });

  it("preserves a catalog-Food item's foodId and grams without creating a duplicate Food", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem({ quantityGrams: 123 })] }]);
    const meal = await repeatMeal(fake.client, "user-a", "meal-1", NOW);
    expect(meal.items[0].food?.id).toBe(egg.id);
    expect(meal.items[0].quantityGrams).toBe(123);
    // 123g @ 200 kcal/100g, derived live from the same reused Food — proves no duplicate Food was needed.
    expect(meal.totals.kcal).toBeCloseTo(246, 5);
  });

  it("preserves a recipe-backed item's recipeId and copies its existing snapshot instead of recalculating", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Dinner", eatenAt: NOW, createdAt: NOW, items: [fakeRecipeItem()] }]);
    const meal = await repeatMeal(fake.client, "user-a", "meal-1", NOW);
    expect(meal.items[0].recipeId).toBe(chiliRecipe.id);
    expect(meal.totals.kcal).toBe(400); // the source snapshot's kcal, not recomputed from a live recipe lookup
    const persisted = fake.db.get(meal.id)!;
    expect(persisted.items[0].recipe).toEqual(chiliRecipe); // the same recipe reference, untouched
  });

  it("preserves conversionSnapshot, including nested quantityConfirmation, unchanged", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    await repeatMeal(fake.client, "user-a", "meal-1", NOW);
    const persisted = [...fake.db.values()].find((m) => m.id !== "meal-1")!;
    expect(persisted.items[0].conversionSnapshot).toEqual(fakeFoodItem().conversionSnapshot);
    expect(persisted.items[0].conversionSnapshot.quantityConfirmation).toEqual({ method: "user_corrected", accepted: true, grams: 100 });
  });

  it("rejects a request from a user who does not own the source meal, without revealing it exists", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    await expect(repeatMeal(fake.client, "user-b", "meal-1", NOW)).rejects.toThrow("meal_not_found");
  });

  it("returns a safe not-found for a nonexistent meal id", async () => {
    const fake = createFakeDb([]);
    await expect(repeatMeal(fake.client, "user-a", "does-not-exist", NOW)).rejects.toThrow("meal_not_found");
  });

  it("fails atomically on a corrupted source item (both foodId and recipeId set) without creating anything", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Corrupt", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem({ recipeId: chiliRecipe.id })] }]);
    const sizeBefore = fake.db.size;
    await expect(repeatMeal(fake.client, "user-a", "meal-1", NOW)).rejects.toThrow("meal_item_source_invalid");
    expect(fake.db.size).toBe(sizeBefore);
  });

  it("fails atomically when a source meal somehow has zero items", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Empty", eatenAt: NOW, createdAt: NOW, items: [] }]);
    await expect(repeatMeal(fake.client, "user-a", "meal-1", NOW)).rejects.toThrow("meal_repeat_invalid_source");
  });

  it("serializes the new meal with correct multi-item totals", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Combo", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem({ quantityGrams: 100 }), fakeRecipeItem()] }]);
    const meal = await repeatMeal(fake.client, "user-a", "meal-1", NOW);
    expect(meal.items).toHaveLength(2);
    expect(meal.totals.kcal).toBe(600); // 200 (egg, live) + 400 (chili, copied snapshot)
  });

  it("makes the repeated meal show up in today's diary totals", async () => {
    const range = resolveDiaryDateRange({ date: "2026-09-06" }, NOW);
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: new Date("2026-01-01T12:00:00Z"), createdAt: new Date("2026-01-01T12:00:00Z"), items: [fakeFoodItem({ quantityGrams: 100 })] }]);

    const before = await getMealsForDay(fake.client, "user-a", range, "summary");
    expect(before.meals).toHaveLength(0);

    await repeatMeal(fake.client, "user-a", "meal-1", NOW);

    const after = await getMealsForDay(fake.client, "user-a", range, "summary");
    expect(after.meals).toHaveLength(1);
    expect(after.totals.kcal).toBe(200);
  });
});
