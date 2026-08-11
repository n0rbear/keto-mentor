import type { FoodSource, Prisma } from "@prisma/client";

export type ImportNutrient = { key: string; label: string; unit: string; group: string; amountPer100g: number };

export type ImportFood = {
  source: FoodSource;
  sourceId: string;
  originalName: string;
  name: string;
  names?: Record<string, string>;
  synonyms?: Record<string, string[]>;
  category?: string;
  brand?: string;
  servingUnit?: string;
  servingGrams?: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  provenance: Prisma.InputJsonValue;
  nutrients: ImportNutrient[];
};

export interface FoodSourceAdapter {
  readonly sourceName: string;
  read(filePath: string): AsyncIterable<ImportFood>;
}
