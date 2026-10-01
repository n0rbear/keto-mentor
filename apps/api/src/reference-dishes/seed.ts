import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import type { Prisma, PrismaClient } from "@prisma/client";
import { REFERENCE_DATA, REFERENCE_DATA_VERSION } from "./reference-data.js";
import type { ReferenceVariant } from "./types.js";
import { buildSearchText } from "../catalog/normalize.js";
import { upsertSeedServings } from "../../prisma/seed-servings.js";

// Reference dishes (roadmap B, owner-approved 2026-09-26) live as ordinary
// public recipes of one system account, so nutrition, meal logging and
// "make my own copy" (fork) work unchanged. The colon keeps the username
// outside what registration accepts, so no real user can own it.
export const REFERENCE_USERNAME = "system:keto-mentor";

type SeedReport = {
  seeded: number;
  unchanged: number;
  skipped: Array<{ variant: string; missingFoodKeys: string[] }>;
  servings: { seeded: number; unchanged: number; kept: string[]; missing: string[] };
  aliases: { created: number; missing: string[] };
  chainProducts: { seeded: number; unchanged: number };
};

export async function seedReferenceDishes(prisma: PrismaClient): Promise<SeedReport> {
  const report: SeedReport = {
    seeded: 0, unchanged: 0, skipped: [],
    servings: { seeded: 0, unchanged: 0, kept: [], missing: [] },
    aliases: { created: 0, missing: [] },
    chainProducts: { seeded: 0, unchanged: 0 }
  };
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

  await seedServings(prisma, foodIdByKey, report);
  await seedFoodAliases(prisma, foodIdByKey, report);
  await seedChainProducts(prisma, report);
  return report;
}

const isCurrent = (provenance: unknown) => (provenance as any)?.referenceVersion === REFERENCE_DATA_VERSION;

// Unit weights on reviewed catalog records. A serving someone else owns
// (a curated seed, an import) under the same key is never overwritten.
async function seedServings(prisma: PrismaClient, foodIdByKey: Map<string, string>, report: SeedReport) {
  for (const serving of REFERENCE_DATA.servings) {
    const label = `${serving.foodKey}/${serving.key}`;
    const foodId = foodIdByKey.get(serving.foodKey);
    if (!foodId) { report.servings.missing.push(label); continue; }
    const existing = await prisma.foodServing.findUnique({ where: { foodId_key: { foodId, key: serving.key } } });
    if (existing && (existing.provenance as any)?.kind !== "reference_serving") { report.servings.kept.push(label); continue; }
    if (existing && isCurrent(existing.provenance)) { report.servings.unchanged += 1; continue; }
    await upsertSeedServings(prisma.foodServing, foodId, [{
      key: serving.key, unit: serving.unit, labels: serving.labels, grams: serving.grams,
      isEstimated: serving.isEstimated, confidence: serving.confidence,
      provenance: { kind: "reference_serving", referenceVersion: REFERENCE_DATA_VERSION, countries: serving.countries, sources: serving.sources }
    }]);
    report.servings.seeded += 1;
  }
}

// Regional vocabulary: insert-only, so an existing alias (any origin) stays.
async function seedFoodAliases(prisma: PrismaClient, foodIdByKey: Map<string, string>, report: SeedReport) {
  const data = [];
  for (const alias of REFERENCE_DATA.foodAliases) {
    const foodId = foodIdByKey.get(alias.foodKey);
    if (!foodId) { if (!report.aliases.missing.includes(alias.foodKey)) report.aliases.missing.push(alias.foodKey); continue; }
    data.push({
      foodId, alias: alias.alias, normalizedAlias: alias.normalizedAlias, locale: alias.locale, kind: "regional_synonym", confidence: 1,
      provenance: { kind: "reference_food_alias", source: "docs/REGIONAL_DATABASE_BRIEF.md" }
    });
  }
  if (data.length) report.aliases.created = (await prisma.foodAlias.createMany({ data, skipDuplicates: true })).count;
}

// Chain products are Food rows of their own (source chain_official), one per
// chain, product and country, with the piece as a FoodServing.
async function seedChainProducts(prisma: PrismaClient, report: SeedReport) {
  for (const product of REFERENCE_DATA.chainProducts) {
    const where = { source_sourceId: { source: "chain_official" as const, sourceId: product.sourceId } };
    const existing = await prisma.food.findUnique({ where, select: { id: true, provenance: true } });
    if (existing && isCurrent(existing.provenance)) { report.chainProducts.unchanged += 1; continue; }
    const values = {
      name: product.name, names: product.names, synonyms: product.synonyms, brand: product.chain, category: product.category,
      originalName: product.names.de ?? product.name,
      searchText: buildSearchText({ name: product.name, names: product.names, synonyms: product.synonyms, brand: product.chain }),
      servingUnit: product.serving.unit, servingGrams: product.serving.grams,
      kcalPer100g: product.kcalPer100g, fatPer100g: product.fatPer100g, proteinPer100g: product.proteinPer100g,
      carbsPer100g: product.carbsPer100g, fiberPer100g: product.fiberPer100g,
      provenance: { ...product.provenance, kind: "reference_chain_product", referenceVersion: REFERENCE_DATA_VERSION } as Prisma.InputJsonValue
    };
    const food = await prisma.food.upsert({ where, update: values, create: { ...values, source: "chain_official", sourceId: product.sourceId }, select: { id: true } });
    await upsertSeedServings(prisma.foodServing, food.id, [{
      key: product.serving.key, unit: product.serving.unit, labels: product.serving.labels, grams: product.serving.grams,
      isEstimated: product.serving.isEstimated, confidence: product.serving.confidence,
      provenance: { kind: "reference_chain_product", method: "portion_kcal_over_kcal_per_100g", sourceUrl: product.provenance.sourceUrl, retrievedAt: product.provenance.retrievedAt }
    }]);
    report.chainProducts.seeded += 1;
  }
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
      ...(variant.cookingFatLossGrams ? { cookingFatLossGrams: variant.cookingFatLossGrams } : {}),
      densityGPerMl: variant.densityGPerMl,
      servedIn: variant.servedIn,
      parts: variant.parts,
      countries: variant.countries,
      languages: variant.languages,
      category: variant.category,
      tags: variant.tags ?? [],
      sources: variant.sources
    } as Prisma.InputJsonValue
  };
}
