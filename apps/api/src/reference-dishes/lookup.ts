import type { PrismaClient } from "@prisma/client";
import { normalizeSearch } from "../catalog/normalize.js";
import { REFERENCE_DATA } from "./hu-pilot.data.js";
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

/** The seeded public recipes for those variants, in the same order. */
export async function findReferenceRecipes<T extends { provenance: unknown }>(
  prisma: Pick<PrismaClient, "recipe">,
  variantIds: string[],
  include: object
): Promise<T[]> {
  if (!variantIds.length) return [];
  const rows = await (prisma.recipe.findMany as any)({
    where: { user: { username: REFERENCE_USERNAME }, deletedAt: null, visibility: "public" },
    include
  }) as T[];
  const byVariant = new Map(rows.map((row) => [(row.provenance as any)?.referenceVariantId as string | undefined, row]));
  return variantIds.map((id) => byVariant.get(id)).filter((row): row is T => Boolean(row));
}
