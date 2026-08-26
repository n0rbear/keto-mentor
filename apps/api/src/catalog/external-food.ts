import type { FoodSource, PrismaClient } from "@prisma/client";
import { buildSearchText, normalizeSearch } from "./normalize.js";
import { searchFoods } from "./food-search.js";
import type { ImportFood, ImportNutrient } from "../importers/types.js";

export type ExternalFoodCandidate = ImportFood & {
  sourceUrl?: string;
  normalizedName: string;
  nutrientBasis: "per_100_g";
  retrievedAt: string;
  confidence: number;
  matchPolicy: "exact_normalized_name" | "review_required";
  language?: string;
};

export interface StructuredFoodLookupAdapter {
  readonly source: FoodSource;
  readonly sourceName: string;
  lookup(query: string): Promise<unknown[]>;
}

export type ResolutionOutcome =
  | { status: "resolved_local"; food: any }
  | { status: "resolved_external"; food: any; provenance: ExternalFoodCandidate["provenance"] }
  | { status: "confirmation_required"; candidates: ExternalFoodCandidate[]; reason: "ambiguous" | "possible_duplicate" | "weak_match" }
  | { status: "unresolved"; candidates: []; reason: "not_found" | "invalid_external_data" | "external_unavailable" };

const REQUIRED_MACROS = ["kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g"] as const;

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function validateExternalCandidate(value: unknown): ExternalFoodCandidate | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ExternalFoodCandidate>;
  if (candidate.source !== "usda_fdc" || !/^\d+$/.test(candidate.sourceId ?? "") || !candidate.name || !candidate.originalName) return null;
  if (!candidate.sourceUrl || !candidate.retrievedAt || candidate.nutrientBasis !== "per_100_g") return null;
  try {
    if (new URL(candidate.sourceUrl).hostname !== "fdc.nal.usda.gov") return null;
  } catch { return null; }
  if (!finiteNonNegative(candidate.confidence) || candidate.confidence > 1) return null;
  if (candidate.matchPolicy !== "exact_normalized_name" && candidate.matchPolicy !== "review_required") return null;
  if (REQUIRED_MACROS.some((key) => !finiteNonNegative(candidate[key]))) return null;
  if (!finiteNonNegative(candidate.fiberPer100g)) return null;
  const normalizedName = normalizeSearch(candidate.normalizedName || candidate.name);
  if (!normalizedName) return null;
  const nutrients = Array.isArray(candidate.nutrients)
    ? candidate.nutrients.filter((item): item is ImportNutrient => Boolean(item && typeof item.key === "string" && typeof item.label === "string" && typeof item.unit === "string" && typeof item.group === "string" && finiteNonNegative(item.amountPer100g)))
    : [];
  return { ...candidate, normalizedName, nutrients } as ExternalFoodCandidate;
}

type ResolutionPrisma = Pick<PrismaClient, "food" | "foodAlias" | "nutrient" | "foodNutrient" | "$transaction"> & Partial<Pick<PrismaClient, "$queryRaw">>;

async function findDuplicate(prisma: ResolutionPrisma, candidate: ExternalFoodCandidate) {
  const sourceMatch = await prisma.food.findUnique({
    where: { source_sourceId: { source: candidate.source, sourceId: candidate.sourceId } },
    include: { servings: true }
  });
  if (sourceMatch) return sourceMatch;

  const aliasMatch = await prisma.foodAlias.findFirst({
    where: { normalizedAlias: candidate.normalizedName },
    select: { foodId: true }
  });
  const possible = await prisma.food.findMany({
    where: {
      createdById: null,
      OR: [
        { name: { equals: candidate.name, mode: "insensitive" } },
        { originalName: { equals: candidate.originalName, mode: "insensitive" } },
        ...(aliasMatch ? [{ id: aliasMatch.foodId }] : [])
      ]
    },
    include: { servings: true },
    take: 5
  });
  return possible.find((food) => normalizeSearch(food.name) === candidate.normalizedName || normalizeSearch(food.originalName ?? "") === candidate.normalizedName || food.id === aliasMatch?.foodId) ?? null;
}

async function persistCandidate(prisma: ResolutionPrisma, candidate: ExternalFoodCandidate) {
  const { nutrients, confidence: _confidence, matchPolicy: _matchPolicy, language: _language, normalizedName: _normalizedName, nutrientBasis: _basis, retrievedAt: _retrievedAt, sourceUrl: _sourceUrl, ...foodData } = candidate;
  return prisma.$transaction(async (tx) => {
    const saved = await tx.food.create({ data: { ...foodData, searchText: buildSearchText(foodData), createdById: null } });
    const aliases = [...new Set([candidate.name, candidate.originalName, ...Object.values(candidate.names ?? {})].map(normalizeSearch).filter(Boolean))];
    if (aliases.length) await tx.foodAlias.createMany({ data: aliases.map((alias) => ({ foodId: saved.id, alias, normalizedAlias: alias, locale: candidate.language ?? "und", kind: "external", confidence: candidate.confidence, provenance: candidate.provenance })), skipDuplicates: true });
    for (const nutrient of nutrients) {
      const { amountPer100g, ...definition } = nutrient;
      const savedNutrient = await tx.nutrient.upsert({ where: { key: nutrient.key }, create: definition, update: definition });
      await tx.foodNutrient.create({ data: { foodId: saved.id, nutrientId: savedNutrient.id, amountPer100g } });
    }
    return saved;
  });
}

export async function resolveAuthoritativeFood(prisma: ResolutionPrisma, query: string, adapters: readonly StructuredFoodLookupAdapter[]): Promise<ResolutionOutcome> {
  const local = await searchFoods(prisma as any, query, 5);
  if (local.length) return { status: "resolved_local", food: local[0] };
  if (!adapters.length) return { status: "unresolved", candidates: [], reason: "external_unavailable" };

  let rawCandidates: unknown[] = [];
  let successfulProviders = 0;
  for (const adapter of adapters) {
    try {
      const result = await adapter.lookup(query);
      successfulProviders += 1;
      rawCandidates.push(...result.slice(0, 5));
    } catch {
      continue;
    }
  }
  if (!rawCandidates.length) return { status: "unresolved", candidates: [], reason: successfulProviders > 0 ? "not_found" : "external_unavailable" };
  const candidates = rawCandidates.map(validateExternalCandidate).filter((candidate): candidate is ExternalFoodCandidate => Boolean(candidate)).sort((a, b) => b.confidence - a.confidence);
  if (!candidates.length) return { status: "unresolved", candidates: [], reason: "invalid_external_data" };

  const duplicate = await findDuplicate(prisma, candidates[0]);
  if (duplicate) {
    if (duplicate.source === candidates[0].source && duplicate.sourceId === candidates[0].sourceId) return { status: "resolved_local", food: duplicate };
    return { status: "confirmation_required", candidates: candidates.slice(0, 5), reason: "possible_duplicate" };
  }
  const top = candidates[0];
  const second = candidates[1];
  if (top.matchPolicy !== "exact_normalized_name" || normalizeSearch(query) !== top.normalizedName) {
    return { status: "confirmation_required", candidates: candidates.slice(0, 5), reason: "weak_match" };
  }
  if (top.confidence < 0.95 || (second && top.confidence - second.confidence < 0.1)) {
    return { status: "confirmation_required", candidates: candidates.slice(0, 5), reason: "ambiguous" };
  }
  try {
    const food = await persistCandidate(prisma, top);
    return { status: "resolved_external", food, provenance: top.provenance };
  } catch (error: any) {
    // A concurrent resolver may have inserted the authoritative source ID after
    // our duplicate check. Resolve that race to the existing row; never update it.
    if (error?.code === "P2002") {
      const existing = await prisma.food.findUnique({ where: { source_sourceId: { source: top.source, sourceId: top.sourceId } }, include: { servings: true } });
      if (existing) return { status: "resolved_local", food: existing };
    }
    throw error;
  }
}
