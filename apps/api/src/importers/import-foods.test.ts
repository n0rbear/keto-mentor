import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { upsertImportedFood } from "./import-foods.js";
import type { ImportFood } from "./types.js";

describe("catalog importer", () => {
  it("is idempotent by source and sourceId", async () => {
    const foods = new Map<string, any>();
    const nutrients = new Map<string, any>();
    const links = new Map<string, any>();
    const tx = {
      food: { upsert: async ({ where, create, update }: any) => { const key = `${where.source_sourceId.source}:${where.source_sourceId.sourceId}`; const saved = { id: "food-1", ...(foods.has(key) ? update : create) }; foods.set(key, saved); return saved; } },
      nutrient: { upsert: async ({ where, create }: any) => { const saved = nutrients.get(where.key) ?? { id: `nutrient-${where.key}`, ...create }; nutrients.set(where.key, saved); return saved; } },
      foodNutrient: { upsert: async ({ where, create, update }: any) => { const key = `${where.foodId_nutrientId.foodId}:${where.foodId_nutrientId.nutrientId}`; links.set(key, links.has(key) ? { ...links.get(key), ...update } : create); } }
    };
    const prisma = { $transaction: async (callback: any) => callback(tx) } as unknown as PrismaClient;
    const food: ImportFood = { source: "open_database", sourceId: "usda-1", originalName: "Spinach, raw", name: "Spinach", names: { hu: "Spenót", de: "Spinat", en: "Spinach" }, synonyms: { hu: ["spenot"] }, kcalPer100g: 23, proteinPer100g: 2.86, fatPer100g: .39, carbsPer100g: 3.63, fiberPer100g: 2.2, provenance: { source: "USDA" }, nutrients: [{ key: "iron", label: "Iron", unit: "mg", group: "mineral", amountPer100g: 2.71 }] };
    await upsertImportedFood(prisma, food);
    await upsertImportedFood(prisma, { ...food, name: "Raw spinach" });
    expect(foods.size).toBe(1);
    expect([...foods.values()][0].name).toBe("Raw spinach");
    expect(links.size).toBe(1);
  });
});
