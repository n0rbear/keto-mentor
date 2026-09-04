import type { PrismaClient } from "@prisma/client";
import { buildSearchText } from "../catalog/normalize.js";
import { aliasesForImportedFood } from "./import-foods.js";
import { aliasesForCoverageEntry, importedIdentity, projectedFoodId } from "./everyday-alias-overlay.js";
import { EVERYDAY_COVERAGE_V2, type EverydayCoverageEntry } from "./everyday-coverage-manifest.js";
import type { ImportFood } from "./types.js";

export type ProjectedCatalogFood = {
  id: string;
  name: string;
  originalName: string | null;
  names: unknown;
  synonyms?: unknown;
  searchText: string;
  source: string;
  sourceId: string | null;
  createdById: string | null;
  servings: unknown[];
  [key: string]: unknown;
};

export type ProjectedCatalogAlias = {
  foodId: string;
  alias: string;
  normalizedAlias: string;
  locale: string;
  kind: string;
  confidence?: number;
  provenance?: unknown;
  [key: string]: unknown;
};

export type ProjectedCatalog = { foods: ProjectedCatalogFood[]; aliases: ProjectedCatalogAlias[] };

const aliasKey = (alias: Pick<ProjectedCatalogAlias, "foodId" | "normalizedAlias" | "locale">) =>
  `${alias.foodId}:${alias.normalizedAlias}:${alias.locale}`;

export function buildProjectedCatalog(
  current: ProjectedCatalog,
  resolvedFoods: readonly ImportFood[],
  entries: readonly EverydayCoverageEntry[] = EVERYDAY_COVERAGE_V2
): ProjectedCatalog {
  const foods = current.foods.map((food) => ({ ...food, servings: [...(food.servings ?? [])] }));
  const aliases = current.aliases.map((alias) => ({ ...alias }));
  const foodByIdentity = new Map(foods.map((food) => [`${food.source}:${food.sourceId}`, food]));
  const foodById = new Map(foods.map((food) => [food.id, food]));
  const aliasByKey = new Map(aliases.map((alias) => [aliasKey(alias), alias]));
  const entryByIdentity = new Map(entries.map((entry) => [importedIdentity(entry), entry]));

  const upsertAlias = (foodId: string, alias: ReturnType<typeof aliasesForImportedFood>[number], provenance: unknown) => {
    const value: ProjectedCatalogAlias = { foodId, ...alias, confidence: 1, provenance };
    const key = aliasKey(value);
    const existing = aliasByKey.get(key);
    if (existing) Object.assign(existing, value);
    else { aliases.push(value); aliasByKey.set(key, value); }
  };

  for (const imported of resolvedFoods) {
    const identity = `${imported.source}:${imported.sourceId}`;
    const entry = entryByIdentity.get(identity);
    if (!entry) continue;
    const existing = foodByIdentity.get(identity);
    const id = existing?.id ?? projectedFoodId(imported.source, imported.sourceId);
    const projected: ProjectedCatalogFood = {
      ...(existing ?? {}),
      ...imported,
      id,
      originalName: imported.originalName,
      names: imported.names ?? null,
      searchText: buildSearchText(imported),
      source: imported.source,
      sourceId: imported.sourceId,
      createdById: null,
      servings: existing?.servings ?? []
    };
    if (existing) Object.assign(existing, projected);
    else { foods.push(projected); foodByIdentity.set(identity, projected); foodById.set(id, projected); }
    for (const alias of aliasesForImportedFood(imported)) {
      upsertAlias(id, alias, { method: "curated_import", source: imported.source, sourceId: imported.sourceId });
    }
  }

  for (const entry of entries) {
    if (entry.aliasTarget.kind !== "food_id") continue;
    const target = foodById.get(entry.aliasTarget.foodId);
    if (!target || target.createdById !== null) throw new Error(`required alias target Food is missing: ${entry.key} -> ${entry.aliasTarget.foodId}`);
    for (const alias of aliasesForCoverageEntry(entry)) {
      upsertAlias(target.id, alias, { method: "everyday_coverage_alias_overlay", concept: entry.key });
    }
  }
  return { foods, aliases };
}

function includesInsensitive(value: unknown, query: string) {
  return String(value ?? "").toLocaleLowerCase("en").includes(query.toLocaleLowerCase("en"));
}

/** A minimal read-only Prisma surface which deliberately executes the unchanged searchFoods implementation. */
export function projectedCatalogPrisma(catalog: ProjectedCatalog) {
  return {
    foodAlias: {
      findMany: async (args: any) => {
        const variants = (args.where?.OR ?? []).map((item: any) => item.normalizedAlias?.contains).filter(Boolean);
        return catalog.aliases.filter((alias) => variants.some((query: string) => alias.normalizedAlias.includes(query))).slice(0, args.take ?? catalog.aliases.length)
          .map((alias) => ({ foodId: alias.foodId, normalizedAlias: alias.normalizedAlias }));
      }
    },
    food: {
      findMany: async (args: any) => {
        const ids = args.where?.id?.in as string[] | undefined;
        const queries = (args.where?.OR ?? []).map((item: any) => item.searchText?.contains).filter(Boolean);
        const selected = ids
          ? catalog.foods.filter((food) => ids.includes(food.id) && food.createdById === null)
          : catalog.foods.filter((food) => food.createdById === null && queries.some((query: string) => includesInsensitive(food.searchText, query)));
        return selected.slice(0, args.take ?? selected.length).map((food) => ({ ...food, servings: [...(food.servings ?? [])] }));
      }
    }
  } as unknown as Pick<PrismaClient, "food" | "foodAlias">;
}
