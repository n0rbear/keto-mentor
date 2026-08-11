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
  readonly source: FoodSource;
  readonly version: string;
  readonly diagnostics?: string[];
  read(filePath: string): AsyncIterable<ImportRow>;
}

export type ImportRow = { food: ImportFood; row: number } | { error: string; row: number; sourceId?: string };

export type ImportOptions = {
  dryRun?: boolean;
  batchSize?: number;
  maxRecords?: number;
  onProgress?: (report: ImportReport) => void;
};

export type ImportReport = {
  source: string;
  version: string;
  dryRun: boolean;
  inputRecords: number;
  validRecords: number;
  skippedRecords: number;
  duplicateRecords: number;
  foodsToCreate: number;
  foodsToUpdate: number;
  nutrientsToCreate: number;
  foodNutrientsExpected: number;
  estimatedGrowthBytes: number;
  parsingErrors: Array<{ row: number; sourceId?: string; error: string }>;
  warnings: string[];
  processed: number;
};
