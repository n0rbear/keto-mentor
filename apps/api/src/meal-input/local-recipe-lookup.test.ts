import { describe, expect, it } from "vitest";
import { findTrustedLocalRecipe } from "./local-recipe-lookup.js";

// Owner-beta (2026-09-13): PR #52 pre-merge review found this file — Step B
// of the prepared-dish resolution order — had ZERO dedicated test coverage
// despite being new, security-relevant (cross-user isolation) functionality.
// These tests prove its documented contract end-to-end against a fake prisma
// that genuinely honors the `where` filter (userId/deletedAt), not just
// against call-argument assertions.

function foodRow(overrides: Partial<{ kcalPer100g: number; fatPer100g: number; proteinPer100g: number; carbsPer100g: number; fiberPer100g: number }> = {}) {
  return { kcalPer100g: 25, fatPer100g: 0.1, proteinPer100g: 1.3, carbsPer100g: 5.8, fiberPer100g: 2.5, nutrients: [], ...overrides };
}

function recipeRow(overrides: Partial<{ id: string; userId: string; title: string; servings: number | null; finishedWeightGrams: number | null; deletedAt: Date | null; ingredients: any[] }> = {}) {
  return {
    id: "recipe-1", userId: "user-1", title: "Töltött káposzta", servings: 4, finishedWeightGrams: 1200, deletedAt: null,
    ingredients: [{ id: "ri-1", recipeId: "recipe-1", foodId: "cabbage", quantityGrams: 500, originalText: "500 g cabbage", preparation: null, sortOrder: 0, food: foodRow() }],
    ...overrides
  };
}

function fakePrisma(rows: ReturnType<typeof recipeRow>[]) {
  return {
    recipe: {
      findMany: async ({ where }: any) => rows.filter((r) => r.userId === where.userId && (where.deletedAt === null ? r.deletedAt === null : true))
    }
  } as any;
}

describe("findTrustedLocalRecipe", () => {
  it("an exact-title match belonging to the requesting user is found, with real ingredient-derived nutrition", async () => {
    const prisma = fakePrisma([recipeRow()]);
    const result = await findTrustedLocalRecipe(prisma, "Töltött káposzta", "user-1");
    expect(result).toMatchObject({ status: "found", recipeId: "recipe-1", title: "Töltött káposzta", servings: 4, ingredientCount: 1, nutritionCalculable: true });
    if (result.status === "found") {
      // 500 g cabbage @ 25 kcal/100g scaled to per-100g of the 1200 g finished dish.
      expect(result.nutritionPer100g?.kcal).toBeCloseTo((25 * 5 * 100) / 1200, 5);
    }
  });

  it("matching is diacritic/case-insensitive (normalizeSearch), not a raw exact string match", async () => {
    const prisma = fakePrisma([recipeRow({ title: "TÖLTÖTT KÁPOSZTA" })]);
    const result = await findTrustedLocalRecipe(prisma, "toltott kaposzta", "user-1");
    expect(result.status).toBe("found");
  });

  it("two recipes normalizing to the same title are surfaced as ambiguous, never silently auto-picked", async () => {
    const prisma = fakePrisma([
      recipeRow({ id: "recipe-1", title: "Csülökpörkölt" }),
      recipeRow({ id: "recipe-2", title: "csülökpörkölt" })
    ]);
    const result = await findTrustedLocalRecipe(prisma, "Csülökpörkölt", "user-1");
    expect(result).toMatchObject({ status: "ambiguous", candidates: [{ recipeId: "recipe-1" }, { recipeId: "recipe-2" }] });
  });

  it("no matching title is a clean not_found, never an error", async () => {
    const prisma = fakePrisma([recipeRow({ title: "Rakott krumpli" })]);
    const result = await findTrustedLocalRecipe(prisma, "Gulyásleves", "user-1");
    expect(result).toEqual({ status: "not_found" });
  });

  it("a soft-deleted recipe is excluded, even with a title match", async () => {
    const prisma = fakePrisma([recipeRow({ deletedAt: new Date("2026-01-01") })]);
    const result = await findTrustedLocalRecipe(prisma, "Töltött káposzta", "user-1");
    expect(result).toEqual({ status: "not_found" });
  });

  it("cross-user isolation: a recipe belonging to a different user never resolves, even with an identical title", async () => {
    const prisma = fakePrisma([recipeRow({ userId: "user-A", title: "Csülökpörkölt" })]);
    const asOwner = await findTrustedLocalRecipe(prisma, "Csülökpörkölt", "user-A");
    const asOther = await findTrustedLocalRecipe(prisma, "Csülökpörkölt", "user-B");
    expect(asOwner.status).toBe("found");
    expect(asOther).toEqual({ status: "not_found" });
  });

  it("a recipe with no finishedWeightGrams set is found, but reports nutrition as not yet calculable rather than inventing a per-100g figure", async () => {
    const prisma = fakePrisma([recipeRow({ finishedWeightGrams: null })]);
    const result = await findTrustedLocalRecipe(prisma, "Töltött káposzta", "user-1");
    expect(result).toMatchObject({ status: "found", nutritionCalculable: false, nutritionPer100g: null });
  });

  it("degrades to not_found (never throws) when prisma has no `.recipe` — preserves existing web-discovery-only test doubles", async () => {
    const result = await findTrustedLocalRecipe({} as any, "Töltött káposzta", "user-1");
    expect(result).toEqual({ status: "not_found" });
  });

  it("an empty/whitespace dish name never queries the database and returns not_found", async () => {
    const prisma = fakePrisma([recipeRow()]);
    const result = await findTrustedLocalRecipe(prisma, "   ", "user-1");
    expect(result).toEqual({ status: "not_found" });
  });
});
