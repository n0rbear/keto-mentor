import type { PrismaClient } from "@prisma/client";
import { buildSearchText } from "../catalog/normalize.js";
import type { FoodSourceAdapter, ImportFood } from "./types.js";

export async function upsertImportedFood(prisma: PrismaClient, food: ImportFood) {
  const searchText = buildSearchText(food);
  const { nutrients, ...foodData } = food;
  return prisma.$transaction(async (tx) => {
    const saved = await tx.food.upsert({
      where: { source_sourceId: { source: food.source, sourceId: food.sourceId } },
      create: { ...foodData, searchText, createdById: null },
      update: { ...foodData, searchText, createdById: null }
    });
    for (const nutrient of nutrients) {
      const definition = await tx.nutrient.upsert({ where: { key: nutrient.key }, create: nutrient, update: { label: nutrient.label, unit: nutrient.unit, group: nutrient.group } });
      await tx.foodNutrient.upsert({
        where: { foodId_nutrientId: { foodId: saved.id, nutrientId: definition.id } },
        create: { foodId: saved.id, nutrientId: definition.id, amountPer100g: nutrient.amountPer100g },
        update: { amountPer100g: nutrient.amountPer100g }
      });
    }
    return saved;
  });
}

export async function importFoods(prisma: PrismaClient, adapter: FoodSourceAdapter, filePath: string) {
  let count = 0;
  for await (const food of adapter.read(filePath)) {
    await upsertImportedFood(prisma, food);
    count += 1;
  }
  return { count, source: adapter.sourceName };
}
