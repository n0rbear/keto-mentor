import type { PrismaClient } from "@prisma/client";
import { aliasesForImportedFood, type ImportedFoodAlias } from "./import-foods.js";
import { EVERYDAY_COVERAGE_V2, type EverydayCoverageEntry } from "./everyday-coverage-manifest.js";
import type { ImportFood } from "./types.js";

export type CatalogIdentitySnapshot = { id: string; source: string; sourceId: string | null };
export type CatalogAliasSnapshot = { foodId: string; normalizedAlias: string; locale: string };
export type EverydayAliasPlanItem = ImportedFoodAlias & {
  concept: string;
  targetFoodId: string;
  targetKind: "source_identity" | "food_id";
};
export type EverydayAliasPlan = {
  aliasesToCreate: number;
  aliasesToUpdate: number;
  targetFoodIds: string[];
  items: EverydayAliasPlanItem[];
};

export const importedSource = (entry: EverydayCoverageEntry) => entry.source === "bls" ? "bls" : "usda_fdc";
export const importedIdentity = (entry: EverydayCoverageEntry) => `${importedSource(entry)}:${entry.sourceId}`;
export const projectedFoodId = (source: string, sourceId: string) => `projected:${source}:${sourceId}`;

export function aliasesForCoverageEntry(entry: EverydayCoverageEntry) {
  const names = Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, aliases[0]]));
  const synonyms = Object.fromEntries(Object.entries(entry.aliases).map(([locale, aliases]) => [locale, [...aliases]]));
  return aliasesForImportedFood({ names, synonyms } as ImportFood);
}

function targetFoodId(entry: EverydayCoverageEntry, foods: readonly CatalogIdentitySnapshot[]) {
  if (entry.aliasTarget.kind === "food_id") {
    const requiredFoodId = entry.aliasTarget.foodId;
    const target = foods.find((food) => food.id === requiredFoodId);
    if (!target) throw new Error(`required alias target Food is missing: ${entry.key} -> ${requiredFoodId}`);
    return target.id;
  }
  const source = importedSource(entry);
  return foods.find((food) => food.source === source && food.sourceId === entry.sourceId)?.id ?? projectedFoodId(source, entry.sourceId);
}

export function planEverydayAliasUpserts(
  resolvedFoods: readonly ImportFood[],
  snapshotFoods: readonly CatalogIdentitySnapshot[],
  snapshotAliases: readonly CatalogAliasSnapshot[],
  entries: readonly EverydayCoverageEntry[] = EVERYDAY_COVERAGE_V2
): EverydayAliasPlan {
  const entryByIdentity = new Map(entries.map((entry) => [importedIdentity(entry), entry]));
  const planned = new Map<string, EverydayAliasPlanItem>();
  const add = (item: EverydayAliasPlanItem) => {
    const key = `${item.targetFoodId}:${item.normalizedAlias}:${item.locale}`;
    const current = planned.get(key);
    if (!current || item.kind === "localized_name") planned.set(key, item);
  };

  for (const food of resolvedFoods) {
    const entry = entryByIdentity.get(`${food.source}:${food.sourceId}`);
    if (!entry) continue;
    const foodId = snapshotFoods.find((candidate) => candidate.source === food.source && candidate.sourceId === food.sourceId)?.id
      ?? projectedFoodId(food.source, food.sourceId);
    for (const alias of aliasesForImportedFood(food)) {
      add({ ...alias, concept: entry.key, targetFoodId: foodId, targetKind: "source_identity" });
    }
  }

  for (const entry of entries.filter((item) => item.aliasTarget.kind === "food_id")) {
    const foodId = targetFoodId(entry, snapshotFoods);
    for (const alias of aliasesForCoverageEntry(entry)) {
      add({ ...alias, concept: entry.key, targetFoodId: foodId, targetKind: "food_id" });
    }
  }

  const existing = new Set(snapshotAliases.map((alias) => `${alias.foodId}:${alias.normalizedAlias}:${alias.locale}`));
  const items = [...planned.values()];
  return {
    aliasesToCreate: items.filter((item) => !existing.has(`${item.targetFoodId}:${item.normalizedAlias}:${item.locale}`)).length,
    aliasesToUpdate: items.filter((item) => existing.has(`${item.targetFoodId}:${item.normalizedAlias}:${item.locale}`)).length,
    targetFoodIds: [...new Set(entries.filter((entry) => entry.aliasTarget.kind === "food_id").map((entry) => targetFoodId(entry, snapshotFoods)))].sort(),
    items
  };
}

export async function assertEverydayAliasTargetsExist(
  prisma: PrismaClient,
  entries: readonly EverydayCoverageEntry[] = EVERYDAY_COVERAGE_V2
) {
  const targeted = entries.filter((entry) => entry.aliasTarget.kind === "food_id");
  const requiredIds = [...new Set(targeted.map((entry) => entry.aliasTarget.kind === "food_id" ? entry.aliasTarget.foodId : ""))];
  const existing = await prisma.food.findMany({ where: { id: { in: requiredIds }, createdById: null }, select: { id: true } });
  const existingIds = new Set(existing.map((food) => food.id));
  const missing = requiredIds.filter((id) => !existingIds.has(id));
  if (missing.length) throw new Error(`required alias target Foods are missing: ${missing.join(", ")}`);
  return requiredIds.sort();
}

export async function applyEverydayExternalAliasTargets(
  prisma: PrismaClient,
  entries: readonly EverydayCoverageEntry[] = EVERYDAY_COVERAGE_V2
) {
  const targeted = entries.filter((entry) => entry.aliasTarget.kind === "food_id");
  const requiredIds = await assertEverydayAliasTargetsExist(prisma, entries);

  let upserts = 0;
  for (const entry of targeted) {
    const foodId = entry.aliasTarget.kind === "food_id" ? entry.aliasTarget.foodId : "";
    for (const alias of aliasesForCoverageEntry(entry)) {
      await prisma.foodAlias.upsert({
        where: { foodId_normalizedAlias_locale: { foodId, normalizedAlias: alias.normalizedAlias, locale: alias.locale } },
        create: { foodId, ...alias, confidence: 1, provenance: { method: "everyday_coverage_alias_overlay", concept: entry.key } },
        update: { alias: alias.alias, kind: alias.kind, confidence: 1, provenance: { method: "everyday_coverage_alias_overlay", concept: entry.key } }
      });
      upserts++;
    }
  }
  return { targetFoodIds: requiredIds, upserts };
}
