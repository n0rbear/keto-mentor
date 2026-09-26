import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import type { Prisma, PrismaClient } from "@prisma/client";
import { REFERENCE_DATA, REFERENCE_DATA_VERSION } from "./hu-pilot.data.js";
import type { ReferenceVariant } from "./types.js";

// Reference dishes (roadmap B, owner-approved 2026-09-26) live as ordinary
// public recipes of one system account, so nutrition, meal logging and
// "make my own copy" (fork) work unchanged. The colon keeps the username
// outside what registration accepts, so no real user can own it.
export const REFERENCE_USERNAME = "system:keto-mentor";

type SeedReport = { seeded: number; unchanged: number; skipped: Array<{ variant: string; missingFoodKeys: string[] }> };

export async function seedReferenceDishes(prisma: PrismaClient): Promise<SeedReport> {
  const report: SeedReport = { seeded: 0, unchanged: 0, skipped: [] };
  let owner = await prisma.user.findUnique({ where: { username: REFERENCE_USERNAME } });
  if (!owner) {
    // A real hash of a secret nobody knows: the account can never log in.
    owner = await prisma.user.create({ data: { username: REFERENCE_USERNAME, passwordHash: await argon2.hash(randomBytes(32).toString("hex")), locale: "hu" } });
  }

  const foodIdByKey = new Map<string, string>();
  for (const [key, entry] of Object.entries(REFERENCE_DATA.foodKeys)) {
    if (!entry.catalog) continue;
    const food = await prisma.food.findFirst({ where: { source: entry.catalog.source as any, sourceId: entry.catalog.sourceId, createdById: null }, select: { id: true } });
    if (food) foodIdByKey.set(key, food.id);
  }

  const existing = await prisma.recipe.findMany({ where: { userId: owner.id }, select: { id: true, provenance: true, deletedAt: true } });
  const byVariant = new Map(existing.map((recipe) => [(recipe.provenance as any)?.referenceVariantId as string | undefined, recipe]));

  for (const variant of REFERENCE_DATA.variants) {
    // A dish is only offered when EVERY ingredient has a reviewed catalog
    // record; a partial recipe would silently under-count nutrition.
    const missing = variant.ingredients.filter((ingredient) => !foodIdByKey.has(ingredient.foodKey)).map((ingredient) => ingredient.foodKey);
    if (missing.length) { report.skipped.push({ variant: variant.id, missingFoodKeys: missing }); continue; }

    const current = byVariant.get(variant.id);
    if (current && !current.deletedAt && (current.provenance as any)?.referenceVersion === REFERENCE_DATA_VERSION) { report.unchanged += 1; continue; }

    const data = recipeData(variant);
    const ingredients = variant.ingredients.map((ingredient, index) => ({
      foodId: foodIdByKey.get(ingredient.foodKey)!, quantityGrams: ingredient.grams, role: ingredient.role, sortOrder: index,
      originalText: REFERENCE_DATA.foodKeys[ingredient.foodKey]?.hu ?? ingredient.foodKey
    }));
    if (current) {
      // Updated in place (never deleted): logged meals reference the recipe.
      await prisma.$transaction([
        prisma.recipeIngredient.deleteMany({ where: { recipeId: current.id } }),
        prisma.recipe.update({ where: { id: current.id }, data: { ...data, deletedAt: null, ingredients: { create: ingredients } } })
      ]);
    } else {
      await prisma.recipe.create({ data: { ...data, userId: owner.id, ingredients: { create: ingredients } } });
    }
    report.seeded += 1;
  }
  return report;
}

function recipeData(variant: ReferenceVariant) {
  return {
    title: variant.titles.hu,
    description: `${variant.titles.de} / ${variant.titles.en}`,
    servings: 1,
    finishedWeightGrams: variant.servingGrams,
    visibility: "public" as const,
    sourceType: "manual" as const,
    provenance: {
      kind: "reference_dish",
      referenceVariantId: variant.id,
      referenceDishId: variant.dishId,
      referenceVersion: REFERENCE_DATA_VERSION,
      titles: variant.titles,
      servingGrams: variant.servingGrams,
      densityGPerMl: variant.densityGPerMl,
      servedIn: variant.servedIn,
      parts: variant.parts,
      sources: variant.sources
    } as Prisma.InputJsonValue
  };
}
