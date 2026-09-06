import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { editMealSchema } from "@keto-mentor/shared";
import { editMeal, deleteMeal, getMeal } from "./edit-meal.js";
import { getMealsForDay } from "./diary-query.js";
import { resolveDiaryDateRange } from "./diary-date.js";

const food = { id: "egg", name: "Fried egg", kcalPer100g: 200, fatPer100g: 15, proteinPer100g: 14, carbsPer100g: 1, fiberPer100g: 0 };

function fakeFoodItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "item-1", mealId: "meal-1", foodId: food.id, recipeId: null, quantityGrams: 100,
    displayName: null, snapshotKcal: null, snapshotFat: null, snapshotProtein: null, snapshotCarbs: null, snapshotFiber: null,
    snapshotNutrients: null, inputQuantity: 100, inputUnit: "g", conversionSnapshot: { unit: "g", gramsPerUnit: 1, method: "exact_mass", estimated: false },
    food, recipe: null,
    ...overrides
  };
}

function fakeRecipeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "item-2", mealId: "meal-1", foodId: null, recipeId: "recipe-1", quantityGrams: 200,
    displayName: "Chili", snapshotKcal: 400, snapshotFat: 20, snapshotProtein: 30, snapshotCarbs: 10, snapshotFiber: 4,
    snapshotNutrients: { sodium: { key: "sodium", label: "Sodium", unit: "mg", group: "minerals", amount: 100 } },
    inputQuantity: null, inputUnit: null, conversionSnapshot: null,
    food: null, recipe: { id: "recipe-1", title: "Chili" },
    ...overrides
  };
}

function createFakeDb(meals: any[]) {
  const db = new Map(meals.map((m) => [m.id, { ...m, items: m.items.map((i: any) => ({ ...i })) }]));
  const findMeal = (id: string, userId: string) => {
    const meal = db.get(id);
    return meal && meal.userId === userId ? meal : null;
  };
  const findMealByItemId = (itemId: string) => [...db.values()].find((m) => m.items.some((i: any) => i.id === itemId));

  const client = {
    meal: {
      findFirst: async ({ where }: any) => {
        const meal = findMeal(where.id, where.userId);
        return meal ? { ...meal, items: meal.items.map((i: any) => ({ ...i })) } : null;
      },
      findMany: async ({ where }: any) => {
        return [...db.values()]
          .filter((m) => m.userId === where.userId && m.eatenAt >= where.eatenAt.gte && m.eatenAt < where.eatenAt.lt)
          .map((m) => ({ ...m, items: m.items.map((i: any) => ({ ...i })) }));
      },
      updateMany: async ({ where, data }: any) => {
        const meal = findMeal(where.id, where.userId);
        if (!meal) return { count: 0 };
        Object.assign(meal, data);
        return { count: 1 };
      },
      deleteMany: async ({ where }: any) => {
        const meal = findMeal(where.id, where.userId);
        if (!meal) return { count: 0 };
        db.delete(where.id);
        return { count: 1 };
      }
    },
    mealItem: {
      updateMany: async ({ where, data }: any) => {
        const meal = findMealByItemId(where.id);
        if (!meal || (where.mealId && meal.id !== where.mealId)) return { count: 0 };
        const item = meal.items.find((i: any) => i.id === where.id);
        if (!item) return { count: 0 };
        Object.assign(item, data);
        return { count: 1 };
      },
      deleteMany: async ({ where }: any) => {
        const meal = findMealByItemId(where.id);
        if (!meal || (where.mealId && meal.id !== where.mealId)) return { count: 0 };
        const index = meal.items.findIndex((i: any) => i.id === where.id);
        if (index === -1) return { count: 0 };
        meal.items.splice(index, 1);
        return { count: 1 };
      }
    },
    $transaction: async (fn: any) => fn(client)
  } as unknown as PrismaClient;
  return { client, db };
}

const NOW = new Date("2026-09-06T12:00:00Z");

describe("editMealSchema validation", () => {
  it("rejects zero and negative grams", () => {
    expect(() => editMealSchema.parse({ items: [{ mealItemId: "x", quantityGrams: 0 }] })).toThrow();
    expect(() => editMealSchema.parse({ items: [{ mealItemId: "x", quantityGrams: -5 }] })).toThrow();
  });

  it("rejects NaN and Infinity", () => {
    expect(() => editMealSchema.parse({ items: [{ mealItemId: "x", quantityGrams: NaN }] })).toThrow();
    expect(() => editMealSchema.parse({ items: [{ mealItemId: "x", quantityGrams: Infinity }] })).toThrow();
  });

  it("rejects absurd quantities above the existing 50,000g ceiling", () => {
    expect(() => editMealSchema.parse({ items: [{ mealItemId: "x", quantityGrams: 50_001 }] })).toThrow();
  });

  it("rejects client-submitted nutrition fields as unknown keys", () => {
    expect(() => editMealSchema.parse({ items: [{ mealItemId: "x", quantityGrams: 100, kcal: 500 }] })).toThrow();
    expect(() => editMealSchema.parse({ title: "Lunch", snapshotKcal: 500 })).toThrow();
  });

  it("rejects an empty patch with no changes", () => {
    expect(() => editMealSchema.parse({})).toThrow();
  });

  it("rejects the same item id in both items and removeItemIds", () => {
    expect(() => editMealSchema.parse({ items: [{ mealItemId: "x", quantityGrams: 100 }], removeItemIds: ["x"] })).toThrow();
  });

  it("accepts a valid title-only patch", () => {
    expect(() => editMealSchema.parse({ title: "Dinner" })).not.toThrow();
  });
});

describe("editMeal", () => {
  it("lets the owner update the meal title", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    const meal = await editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ title: "Late lunch" }), NOW);
    expect(meal.title).toBe("Late lunch");
  });

  it("lets the owner correct a catalog-food item's grams and recomputes totals live", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem({ quantityGrams: 100 })] }]);
    const meal = await editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ items: [{ mealItemId: "item-1", quantityGrams: 200 }] }), NOW);
    expect(meal.items[0].quantityGrams).toBe(200);
    // 200g @ 200 kcal/100g = 400 kcal, correctly derived live from Food, not from a stale snapshot.
    expect(meal.totals.kcal).toBe(400);
  });

  it("proportionally rescales a recipe-backed item's snapshot instead of leaving it stale", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Dinner", eatenAt: NOW, createdAt: NOW, items: [fakeRecipeItem({ quantityGrams: 200, snapshotKcal: 400 })] }]);
    const meal = await editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ items: [{ mealItemId: "item-2", quantityGrams: 100 }] }), NOW);
    // Halving the grams (200 -> 100) must halve the frozen snapshot kcal (400 -> 200), not leave it at 400.
    expect(meal.items[0].quantityGrams).toBe(100);
    expect(meal.totals.kcal).toBe(200);
  });

  it("rejects edits from a user who does not own the meal", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    await expect(editMeal(fake.client, "user-b", "meal-1", editMealSchema.parse({ title: "Hijacked" }), NOW)).rejects.toThrow("meal_not_found");
  });

  it("rejects a mealItemId that belongs to a different meal (no cross-meal item injection)", async () => {
    const fake = createFakeDb([
      { id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem({ id: "item-1", mealId: "meal-1" })] },
      { id: "meal-2", userId: "user-a", title: "Dinner", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem({ id: "item-x", mealId: "meal-2" })] }
    ]);
    await expect(editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ items: [{ mealItemId: "item-x", quantityGrams: 50 }] }), NOW)).rejects.toThrow("meal_item_not_found");
  });

  it("rejects removing every item from a meal", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    await expect(editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ removeItemIds: ["item-1"] }), NOW)).rejects.toThrow("meal_items_empty");
  });

  it("removes one item while keeping the others", async () => {
    const fake = createFakeDb([{
      id: "meal-1", userId: "user-a", title: "Combo", eatenAt: NOW, createdAt: NOW,
      items: [fakeFoodItem({ id: "item-1" }), fakeRecipeItem({ id: "item-2" })]
    }]);
    const meal = await editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ removeItemIds: ["item-1"] }), NOW);
    expect(meal.items).toHaveLength(1);
    expect(meal.items[0].id).toBe("item-2");
  });

  it("keeps the edit atomic: an invalid item id in the batch leaves nothing changed", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem({ id: "item-1", quantityGrams: 100 })] }]);
    await expect(editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({
      title: "Should not stick",
      items: [{ mealItemId: "item-1", quantityGrams: 150 }, { mealItemId: "does-not-exist", quantityGrams: 50 }]
    }), NOW)).rejects.toThrow("meal_item_not_found");
    const persisted = fake.db.get("meal-1")!;
    expect(persisted.title).toBe("Lunch");
    expect(persisted.items[0].quantityGrams).toBe(100);
  });

  it("never mutates the underlying Food record when correcting grams", async () => {
    const item = fakeFoodItem({ quantityGrams: 100 });
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [item] }]);
    const before = { ...food };
    await editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ items: [{ mealItemId: "item-1", quantityGrams: 300 }] }), NOW);
    expect(food).toEqual(before);
  });

  it("never mutates the underlying Recipe record when correcting grams", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Dinner", eatenAt: NOW, createdAt: NOW, items: [fakeRecipeItem()] }]);
    const meal = await editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ items: [{ mealItemId: "item-2", quantityGrams: 50 }] }), NOW);
    expect(meal.items[0].food).toBeNull(); // recipe item, no food
    // The recipe reference itself (title/id) is untouched — only the item's own frozen snapshot scaled.
    const persisted = fake.db.get("meal-1")!;
    expect(persisted.items[0].recipe).toEqual({ id: "recipe-1", title: "Chili" });
  });

  it("marks a corrected catalog-food item's conversion provenance as user_corrected, scoped to this item only", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem({ id: "item-1" }), fakeFoodItem({ id: "item-3" })] }]);
    await editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ items: [{ mealItemId: "item-1", quantityGrams: 120 }] }), NOW);
    const persisted = fake.db.get("meal-1")!;
    const corrected = persisted.items.find((i: any) => i.id === "item-1");
    const untouched = persisted.items.find((i: any) => i.id === "item-3");
    expect(corrected.conversionSnapshot.method).toBe("user_corrected");
    expect(corrected.conversionSnapshot.userCorrected).toBe(true);
    expect(untouched.quantityGrams).toBe(100);
    expect(untouched.conversionSnapshot.method).toBe("exact_mass");
  });

  it("updates eatenAt to a valid past timestamp", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    const meal = await editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ eatenAt: "2026-09-05T08:00:00.000Z" }), NOW);
    expect(new Date(meal.eatenAt).toISOString()).toBe("2026-09-05T08:00:00.000Z");
  });

  it("rejects moving eatenAt into the future", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    await expect(editMeal(fake.client, "user-a", "meal-1", editMealSchema.parse({ eatenAt: "2026-09-07T08:00:00.000Z" }), NOW)).rejects.toThrow("future_eaten_at");
  });
});

describe("getMeal", () => {
  it("returns the owner's meal with per-item detail", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    const meal = await getMeal(fake.client, "user-a", "meal-1");
    expect(meal.items).toHaveLength(1);
    expect(meal.items[0].quantityGrams).toBe(100);
  });

  it("rejects a request for another user's meal", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    await expect(getMeal(fake.client, "user-b", "meal-1")).rejects.toThrow("meal_not_found");
  });
});

describe("deleteMeal", () => {
  it("lets the owner delete their own meal", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    await deleteMeal(fake.client, "user-a", "meal-1");
    expect(fake.db.has("meal-1")).toBe(false);
  });

  it("rejects deletion from a user who does not own the meal", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem()] }]);
    await expect(deleteMeal(fake.client, "user-b", "meal-1")).rejects.toThrow("meal_not_found");
    expect(fake.db.has("meal-1")).toBe(true);
  });

  it("removes the meal's items along with it", async () => {
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem(), fakeRecipeItem()] }]);
    await deleteMeal(fake.client, "user-a", "meal-1");
    expect(fake.db.has("meal-1")).toBe(false);
  });

  it("daily totals correctly exclude a deleted meal, and the day becomes empty when it was the last one", async () => {
    const range = resolveDiaryDateRange({ date: "2026-09-06" }, NOW);
    const fake = createFakeDb([{ id: "meal-1", userId: "user-a", title: "Lunch", eatenAt: NOW, createdAt: NOW, items: [fakeFoodItem({ quantityGrams: 100 })] }]);

    const before = await getMealsForDay(fake.client, "user-a", range, "summary");
    expect(before.totals.kcal).toBe(200);

    await deleteMeal(fake.client, "user-a", "meal-1");

    const after = await getMealsForDay(fake.client, "user-a", range, "summary");
    expect(after).toEqual({ date: "2026-09-06", meals: [], totals: { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, netCarbs: 0 } });
  });
});
