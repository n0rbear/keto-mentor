import { Prisma, type PrismaClient } from "@prisma/client";
import { normalizeSearch } from "./normalize.js";

// Preparation-aware expansion. The base food "tojás"/"egg" must NOT be silently
// bound to the fried-egg Food. Prepared forms expand to the SAME base food so
// the interpreter can keep nutrition correct per chosen Food, and so a generic
// egg search does not auto-resolve to fried egg.
const QUERY_ALIASES: Record<string, readonly string[]> = {
  "rantotta": ["tojas", "tojás", "ruhrei", "scrambled egg"],
  "tojasrantotta": ["ruhrei", "scrambled egg"],
  "tojásrántotta": ["ruhrei", "scrambled egg"],
  "tukortojas": ["spiegelei", "fried egg"],
  "tükörtojás": ["spiegelei", "fried egg"],
  "sult tojas": ["spiegelei", "fried egg"],
  "sült tojás": ["spiegelei", "fried egg"],
  "scrambled egg": ["tojas", "tojás"],
  "fried egg": ["tojas", "tojás"],
  "boiled egg": ["tojas", "tojás"],
  "főtt tojás": ["tojas", "tojás"],
  "tojas főtt": ["tojas", "tojás"],
  "rántotta": ["tojas", "tojás", "ruhrei", "scrambled"],
  "tojás": ["tojas"],
  "egg": ["tojas", "tojás"],
  "grillcsirke": ["grilled chicken", "brathahnchen", "hahnchen"],
  "fel grillcsirke": ["grilled chicken", "brathahnchen", "hahnchen"],
  "csirkecomb": ["chicken leg", "hahnchenkeule"],
  "kigyouborka": ["gurke", "salatgurke", "cucumber"],
  "uborka": ["gurke", "cucumber"],
  "kígyóuborka": ["cucumber"],
  "sajt": [],
  "gepsonka": ["kochschinken", "ham"],
  "daralt serteshus": ["schweinehackfleisch", "ground pork"],
  "tejszines csirkemell": ["chicken breast", "hahnchenbrust"],
  "gouda": [],
  "szelet gouda": [],
  "csirkemell": ["chicken breast", "hahnchenbrust"],
  "bacon": ["ham"],
  "100 g bacon": ["bacon"],
  "12 cm kígyóuborka": ["cucumber"],
};

export type FoodSearchMatch = { stage: "exact" | "alias" | "partial" | "fuzzy"; score: number; query: string };

export function expandFoodQuery(rawQuery: string) {
  const normalized = normalizeSearch(rawQuery);
  return [...new Set([normalized, ...(QUERY_ALIASES[normalized] ?? [])].map(normalizeSearch).filter((value) => value.length >= 2))];
}

function scoreFood(food: any, variants: readonly string[], aliasFoods: Set<string>, fuzzyIds: Set<string>): FoodSearchMatch {
  const searchable = normalizeSearch(food.searchText || food.name);
  const names = [food.name, food.originalName, ...Object.values(food.names ?? {})].map((value) => normalizeSearch(String(value)));
  let best: FoodSearchMatch = { stage: "partial", score: 0, query: variants[0] ?? "" };
  for (const variant of variants) {
    const exact = names.includes(variant);
    const alias = aliasFoods.has(food.id);
    const tokenCoverage = variant.split(" ").filter((token) => searchable.includes(token)).length / variant.split(" ").length;
    const score = exact ? 100 : alias ? 95 : searchable.startsWith(variant) ? 80 : searchable.includes(variant) ? 70 : Math.round(tokenCoverage * 50);
    if (score > best.score) best = { stage: exact ? "exact" : alias ? "alias" : "partial", score, query: variant };
  }
  return best.score === 0 && fuzzyIds.has(food.id) ? { stage: "fuzzy", score: 35, query: variants[0] ?? "" } : best;
}

type CatalogPrisma = Pick<PrismaClient, "food" | "foodAlias"> & Partial<Pick<PrismaClient, "$queryRaw">>;

export async function searchFoods(prisma: CatalogPrisma, rawQuery: string, limit = 20) {
  const variants = expandFoodQuery(rawQuery);
  if (!variants.length) return [];
  const take = Math.min(Math.max(limit, 1), 30);
  const [aliases, candidates] = await Promise.all([
    prisma.foodAlias.findMany({
      where: { OR: variants.map((normalizedAlias) => ({ normalizedAlias: { contains: normalizedAlias } })) },
      select: { foodId: true, normalizedAlias: true },
      take: 60
    }),
    prisma.food.findMany({
      where: { createdById: null, OR: variants.map((query) => ({ searchText: { contains: query, mode: "insensitive" as const } })) },
      include: { servings: { orderBy: [{ isEstimated: "asc" }, { confidence: "desc" }] } },
      take: 90
    })
  ]);
  const aliasFoods = new Set(aliases.map((alias) => alias.foodId));
  const fuzzyIds = new Set<string>();
  if (candidates.length < take && prisma.$queryRaw) {
    const fuzzy = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "ketomentor"."Food"
      WHERE "createdById" IS NULL AND "searchText" % ${variants[0]}
      ORDER BY similarity("searchText", ${variants[0]}) DESC
      LIMIT 60
    `);
    fuzzy.forEach(({ id }) => fuzzyIds.add(id));
  }
  const relatedIds = [...aliases.map((alias) => alias.foodId), ...fuzzyIds];
  const missingIds = [...new Set(relatedIds.filter((id) => !candidates.some((food) => food.id === id)))];
  if (missingIds.length) {
    candidates.push(...await prisma.food.findMany({ where: { id: { in: missingIds }, createdById: null }, include: { servings: true } }) as any);
  }
  return candidates
    .map((food) => ({ ...food, match: scoreFood(food, variants, aliasFoods, fuzzyIds) }))
    .filter((food) => food.match.score > 0)
    .sort((a, b) => b.match.score - a.match.score || a.name.localeCompare(b.name))
    .slice(0, take);
}
