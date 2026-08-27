import { describe, expect, it } from "vitest";
import { addRecipeToMeal, createRecipe, deleteRecipe, forkRecipe, getVisibleRecipe, listPublicRecipes, updateRecipe } from "./service.js";
import { itemTotals } from "../nutrition.js";
import { recipeInputSchema } from "@keto-mentor/shared";

const food = { id: "f1", name: "Food", kcalPer100g: 100, fatPer100g: 10, proteinPer100g: 20, carbsPer100g: 8, fiberPer100g: 3, nutrients: [{ foodId: "f1", nutrientId: "n1", amountPer100g: 40, nutrient: { id: "n1", key: "calcium", label: "Calcium", unit: "mg", group: "mineral" } }] };
function fullRecipe(overrides: Record<string, unknown> = {}) { return { id: "r1", userId: "owner", title: "Recipe", description: null, servings: 2, finishedWeightGrams: 200, visibility: "private", sourceType: "manual", sourceUrl: null, provenance: null, forkedFromRecipeId: null, deletedAt: null, createdAt: new Date(), updatedAt: new Date(), user: { id: "owner", username: "author" }, ingredients: [{ id: "i1", recipeId: "r1", foodId: "f1", quantityGrams: 200, originalText: null, preparation: null, sortOrder: 0, food }], ...overrides }; }
function matches(row: any, where: any): boolean {
  if (where.id && row.id !== where.id) return false; if (where.userId && row.userId !== where.userId) return false; if (where.visibility && row.visibility !== where.visibility) return false; if (where.deletedAt === null && row.deletedAt !== null) return false;
  if (where.OR && !where.OR.some((part: any) => matches(row, part))) return false;
  if (where.title?.contains && !row.title.toLowerCase().includes(where.title.contains.toLowerCase())) return false;
  return true;
}
function fakePrisma(seed = [fullRecipe()]) {
  const recipes: any[] = structuredClone(seed); const meals: any[] = [];
  const recipe = {
    findFirst: async ({ where }: any) => recipes.find((row) => matches(row, where)) ?? null,
    findMany: async ({ where, take }: any) => recipes.filter((row) => matches(row, where)).slice(0, take),
    update: async ({ where, data }: any) => { const row = recipes.find((value) => value.id === where.id); const nested = data.ingredients?.create; Object.assign(row, { ...data, ingredients: nested ? nested.map((value: any, index: number) => ({ ...value, id: `ui${index}`, recipeId: row.id, food })) : row.ingredients }); return row; },
    create: async ({ data }: any) => { const source = recipes.find((row) => row.id === data.forkedFromRecipeId); const row = fullRecipe({ ...data, id: `copy-${recipes.length}`, user: { id: data.userId, username: data.userId }, ingredients: data.ingredients?.create?.map((value: any, index: number) => ({ ...value, id: `ci${index}`, recipeId: `copy-${recipes.length}`, food: source?.ingredients.find((item: any) => item.foodId === value.foodId)?.food ?? food })) ?? [] }); recipes.push(row); return row; }
  };
  const prisma: any = { recipe, food: { count: async () => 1 }, recipeIngredient: { deleteMany: async () => ({ count: 1 }) }, meal: { create: async ({ data }: any) => { const item = { id: "mi1", mealId: "m1", foodId: null, recipeId: data.items.create.recipeId, quantityGrams: data.items.create.quantityGrams, displayName: data.items.create.displayName, snapshotKcal: data.items.create.snapshotKcal, snapshotFat: data.items.create.snapshotFat, snapshotProtein: data.items.create.snapshotProtein, snapshotCarbs: data.items.create.snapshotCarbs, snapshotFiber: data.items.create.snapshotFiber, snapshotNutrients: data.items.create.snapshotNutrients, food: null, recipe: recipes.find((row) => row.id === data.items.create.recipeId) }; const meal = { id: "m1", userId: data.userId, title: data.title, eatenAt: new Date(), createdAt: new Date(), items: [item] }; meals.push(meal); return meal; } } };
  prisma.$transaction = async (callback: any) => callback(prisma);
  return { prisma, recipes, meals };
}
const input: any = { title: "Changed", visibility: "private", sourceType: "manual", ingredients: [{ foodId: "f1", quantityGrams: 100 }] };

describe("recipe visibility and ownership", () => {
  it("persists ordered instructions on create and update", async () => {
    const { prisma, recipes } = fakePrisma([]);
    await createRecipe(prisma, "owner", { ...input, instructions: ["First", "Second"] });
    expect(recipes[0].instructions).toEqual(["First", "Second"]);
    await updateRecipe(prisma, "owner", recipes[0].id, { ...input, instructions: ["Updated"] });
    expect(recipes[0].instructions).toEqual(["Updated"]);
  });
  it("creates a private multi-ingredient recipe by default", async () => { const { prisma } = fakePrisma([]); const created: any = await createRecipe(prisma, "owner", { ...input, ingredients: [{ foodId: "f1", quantityGrams: 50 }, { foodId: "f1", quantityGrams: 75 }] }); expect(created.userId).toBe("owner"); expect(created.visibility).toBe("private"); expect(created.ingredients).toHaveLength(2); });
  it("rejects a missing Food", async () => { const { prisma } = fakePrisma([]); prisma.food.count = async () => 0; await expect(createRecipe(prisma, "owner", input)).rejects.toMatchObject({ publicCode: "food_not_found" }); });
  it("rejects zero and negative ingredient quantities", () => { expect(recipeInputSchema.safeParse({ ...input, ingredients: [{ foodId: "f1", quantityGrams: 0 }] }).success).toBe(false); expect(recipeInputSchema.safeParse({ ...input, ingredients: [{ foodId: "f1", quantityGrams: -1 }] }).success).toBe(false); });
  it("strips browser-supplied macros and saves only Food IDs with server provenance", async () => {
    const parsed: any = recipeInputSchema.parse({ ...input, sourceType: "schema_org", sourceUrl: "https://example.com/r", kcal: 9999, ingredients: [{ foodId: "f1", quantityGrams: 100, kcalPer100g: 9999, originalText: "100 g Food" }] });
    expect(parsed).not.toHaveProperty("kcal"); expect(parsed.ingredients[0]).not.toHaveProperty("kcalPer100g");
    const { prisma, recipes } = fakePrisma([]); await createRecipe(prisma, "owner", parsed, { sourceUrl: "https://example.com/r", extractionMethod: "schema_org_json_ld" });
    expect(recipes[0]).toMatchObject({ sourceType: "schema_org", sourceUrl: "https://example.com/r", provenance: { extractionMethod: "schema_org_json_ld", trust: "server_verified" } });
    expect(recipes[0].ingredients[0]).toMatchObject({ foodId: "f1", quantityGrams: 100, originalText: "100 g Food" });
  });
  it("does not reveal a private recipe to another user", async () => { await expect(getVisibleRecipe(fakePrisma().prisma, "other", "r1")).rejects.toMatchObject({ publicCode: "recipe_not_found" }); });
  it("keeps the prepared unlisted state owner-only in the MVP", async () => { const { prisma } = fakePrisma([fullRecipe({ visibility: "unlisted" })]); await expect(getVisibleRecipe(prisma, "other", "r1")).rejects.toMatchObject({ publicCode: "recipe_not_found" }); expect((await getVisibleRecipe(prisma, "owner", "r1")).id).toBe("r1"); });
  it("allows another user to read a public recipe", async () => { const { prisma } = fakePrisma([fullRecipe({ visibility: "public" })]); expect((await getVisibleRecipe(prisma, "other", "r1")).id).toBe("r1"); });
  it("does not allow another user to edit a public recipe", async () => { const { prisma } = fakePrisma([fullRecipe({ visibility: "public" })]); await expect(updateRecipe(prisma, "other", "r1", input)).rejects.toMatchObject({ publicCode: "recipe_not_found" }); });
  it("does not allow another user to delete a public recipe", async () => { const { prisma } = fakePrisma([fullRecipe({ visibility: "public" })]); await expect(deleteRecipe(prisma, "other", "r1")).rejects.toMatchObject({ publicCode: "recipe_not_found" }); });
  it("allows a public recipe to be added to another user's meal", async () => { const { prisma, meals } = fakePrisma([fullRecipe({ visibility: "public" })]); await addRecipeToMeal(prisma, "other", "r1", { quantity: 1, unit: "serving" }); expect(meals[0].userId).toBe("other"); expect(meals[0].items[0].snapshotKcal).toBe(100); });
  it("forks to a new owner as a private detached recipe and preserves instructions", async () => { const { prisma, recipes } = fakePrisma([fullRecipe({ visibility: "public", instructions: ["Cook", "Serve"] })]); const copy: any = await forkRecipe(prisma, "other", "r1"); expect(copy.userId).toBe("other"); expect(copy.visibility).toBe("private"); expect(copy.forkedFromRecipeId).toBe("r1"); expect(copy.instructions).toEqual(["Cook", "Serve"]); recipes[1].title = "Fork edit"; expect(recipes[0].title).toBe("Recipe"); });
  it("private to public appears in community list", async () => { const { prisma } = fakePrisma(); await updateRecipe(prisma, "owner", "r1", { ...input, visibility: "public" }); expect((await listPublicRecipes(prisma, { limit: 20 })).recipes).toHaveLength(1); });
  it("public to private immediately leaves community list", async () => { const { prisma } = fakePrisma([fullRecipe({ visibility: "public" })]); await updateRecipe(prisma, "owner", "r1", input); expect((await listPublicRecipes(prisma, { limit: 20 })).recipes).toHaveLength(0); });
});

describe("recipe meal snapshots", () => {
  it("logs grams with a complete nutrition snapshot", async () => { const { prisma, meals } = fakePrisma([fullRecipe({ visibility: "public" })]); await addRecipeToMeal(prisma, "other", "r1", { quantity: 50, unit: "g" }); expect(meals[0].items[0]).toMatchObject({ quantityGrams: 50, snapshotKcal: 50, snapshotProtein: 10 }); expect(meals[0].items[0].snapshotNutrients.calcium.amount).toBe(20); });
  it("does not change after recipe or Food edits", async () => { const { prisma, recipes, meals } = fakePrisma([fullRecipe({ visibility: "public" })]); await addRecipeToMeal(prisma, "other", "r1", { quantity: 1, unit: "serving" }); const before = itemTotals(meals[0].items[0]); recipes[0].ingredients[0].quantityGrams = 1000; recipes[0].ingredients[0].food.kcalPer100g = 999; expect(itemTotals(meals[0].items[0])).toEqual(before); });
  it("soft delete preserves the historical meal snapshot", async () => { const { prisma, meals } = fakePrisma(); await addRecipeToMeal(prisma, "owner", "r1", { quantity: 1, unit: "serving" }); await deleteRecipe(prisma, "owner", "r1"); expect(meals).toHaveLength(1); expect(itemTotals(meals[0].items[0]).kcal).toBe(100); });
});
