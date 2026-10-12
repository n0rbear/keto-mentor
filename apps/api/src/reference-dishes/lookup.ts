import type { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "../catalog/normalize.js";
import { REFERENCE_DATA } from "./reference-data.js";
import { REFERENCE_USERNAME } from "./seed.js";

/**
 * Reference variant ids for a dish phrase, in data order. More than one id
 * means the phrase leaves the side dish open ("rántott hús") and the user
 * must pick; exactly one is a confident match ("pörkölt nokedlivel").
 */
export function referenceVariantIdsFor(dishName: string): string[] {
  const key = normalizeSearch(dishName);
  return key ? REFERENCE_DATA.aliases[key] ?? [] : [];
}

const referenceWhere = { user: { username: REFERENCE_USERNAME }, deletedAt: null, visibility: "public" } as const;

// Performance (owner log 2026-10-12, "egy tányér brassói" took 12.8 s while
// the timed pipeline took 1.6 s): this lookup used to load EVERY seeded
// reference recipe (541, with ~4 200 ingredients and each food's full
// nutrient list when called from meal input) just to pick one or two by
// variant id. The variant -> recipe id map is seeded, static data, so it is
// read once (ids + provenance only) and kept per Prisma client for a while;
// only the matching recipes are then loaded with the caller's include.
const VARIANT_MAP_TTL_MS = 10 * 60 * 1000;
const variantMaps = new WeakMap<object, { at: number; map: Promise<Map<string, string>> }>();

function loadVariantMap(prisma: Pick<PrismaClient, "recipe">, refresh: boolean): Promise<Map<string, string>> {
  const cached = variantMaps.get(prisma);
  if (cached && !refresh && Date.now() - cached.at < VARIANT_MAP_TTL_MS) return cached.map;
  const map = ((prisma.recipe.findMany as any)({ where: referenceWhere, select: { id: true, provenance: true } }) as Promise<Array<{ id: string; provenance: unknown }>>)
    .then((rows) => {
      const byVariant = new Map<string, string>();
      for (const row of rows) {
        const variantId = (row.provenance as any)?.referenceVariantId as string | undefined;
        if (variantId) byVariant.set(variantId, row.id);
      }
      return byVariant;
    });
  // A failed read is never cached.
  map.catch(() => { if (variantMaps.get(prisma)?.map === map) variantMaps.delete(prisma); });
  variantMaps.set(prisma, { at: Date.now(), map });
  return map;
}

/** Test/maintenance hook: forget the cached variant map (e.g. after a reseed). */
export function clearReferenceVariantCache(prisma: object) {
  variantMaps.delete(prisma);
}

/** The seeded public recipes for those variants, in the same order. */
export async function findReferenceRecipes<T extends { provenance: unknown }>(
  prisma: Pick<PrismaClient, "recipe">,
  variantIds: string[],
  include: object
): Promise<T[]> {
  if (!variantIds.length) return [];
  for (const refresh of [false, true]) {
    const map = await loadVariantMap(prisma, refresh);
    const recipeIds = [...new Set(variantIds.map((id) => map.get(id)).filter((id): id is string => Boolean(id)))];
    if (!recipeIds.length) return [];
    const rows = await (prisma.recipe.findMany as any)({ where: { ...referenceWhere, id: { in: recipeIds } }, include }) as T[];
    const byVariant = new Map(rows.map((row) => [(row.provenance as any)?.referenceVariantId as string | undefined, row]));
    const found = variantIds.map((id) => byVariant.get(id)).filter((row): row is T => Boolean(row));
    // A mapped recipe that is gone (deleted, or reseeded under a new id)
    // means the cached map is stale: read it again once.
    const returned = new Set(rows.map((row) => (row as { id?: string }).id));
    if (refresh || recipeIds.every((id) => returned.has(id))) return found;
  }
  return [];
}
