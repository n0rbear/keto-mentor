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
type AliasEntry = { normalizedAlias: string; kind: string };

// How much of a query phrase must actually be attested somewhere in a food's
// OWN canonical/localized name(s) before an alias match is trusted at full
// weight. Deliberately a coverage fraction over normalized tokens, not
// literal-substring equality — real inflection ("Mandel"/"Mandeln") and
// legitimately-learned cross-language aliases must keep matching.
const SEMANTIC_COVERAGE_THRESHOLD = 0.5;

/** A food's own name variants — what it actually, verifiably is — independent of anything learned from a user's raw search phrase. */
export function foodNameRepresentations(food: { name?: unknown; originalName?: unknown; names?: unknown }): string[] {
  return [food.name, food.originalName, ...Object.values((food.names as Record<string, unknown>) ?? {})]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map(normalizeSearch);
}

/**
 * Whether a (normalized) query phrase is actually attested in a food's own
 * name representations, as a fraction of the query's meaningful tokens.
 * Used to gate "dynamic_search" aliases — see the comment on `exactAlias`
 * below for why those specifically need this and curated aliases don't.
 */
export function hasSemanticCoverage(normalizedQuery: string, representations: readonly string[]): boolean {
  const tokens = normalizedQuery.split(" ").filter((token) => token.length >= 2);
  if (!tokens.length) return false;
  const matched = tokens.filter((token) => representations.some((rep) => rep.includes(token)));
  return matched.length / tokens.length >= SEMANTIC_COVERAGE_THRESHOLD;
}

export function expandFoodQuery(rawQuery: string) {
  const normalized = normalizeSearch(rawQuery);
  return [...new Set([normalized, ...(QUERY_ALIASES[normalized] ?? [])].map(normalizeSearch).filter((value) => value.length >= 2))];
}

function scoreFood(food: any, variants: readonly string[], aliasesByFood: ReadonlyMap<string, readonly AliasEntry[]>, fuzzyIds: Set<string>): FoodSearchMatch {
  const searchable = normalizeSearch(food.searchText || food.name);
  const names = foodNameRepresentations(food);
  const aliasEntries = aliasesByFood.get(food.id) ?? [];
  const aliasStrings = aliasEntries.map((entry) => entry.normalizedAlias);
  let best: FoodSearchMatch = { stage: "partial", score: 0, query: variants[0] ?? "" };
  for (const variant of variants) {
    const exact = names.includes(variant);
    const matchingAlias = aliasEntries.find((entry) => entry.normalizedAlias === variant);
    // "dynamic_search" aliases remember ONE prior request's raw phrase,
    // attached to whatever food that single request's resolution landed on —
    // never human-reviewed, never guaranteed to actually describe that food
    // (the resolution itself could have been wrong, e.g. a mistranslated
    // search-intent term coincidentally exact-matching an unrelated USDA
    // entry). Every other alias kind (synonym/localized_name/external/
    // curated_seed) describes the food's OWN validated identity in some
    // form/locale, so it is trusted at face value. A dynamic_search alias
    // earns that same trust only when the learned phrase also has real
    // overlap with the food's own canonical/localized names — otherwise it
    // is a weak signal at best, never grounds for skipping confirmation.
    // Real production case (2026-09-10): "gefüllte Kohlrouladen" and
    // "Champignoncremesuppe" had each been learned, from one earlier bad
    // resolution, as a dynamic_search alias for "bok choy" / "beech
    // mushroom" respectively — zero relationship to either query, yet both
    // scored a full alias match and auto-resolved with no confirmation.
    const exactAlias = !!matchingAlias && (matchingAlias.kind !== "dynamic_search" || hasSemanticCoverage(variant, names));
    const weakDynamicAlias = !!matchingAlias && matchingAlias.kind === "dynamic_search" && !hasSemanticCoverage(variant, names);
    const aliasPrefix = aliasStrings.some((alias) => alias.startsWith(`${variant} `));
    const aliasContains = aliasStrings.some((alias) => alias.includes(variant));
    const tokenCoverage = variant.split(" ").filter((token) => searchable.includes(token)).length / variant.split(" ").length;
    const score = exact ? 100 : exactAlias ? 95 : weakDynamicAlias ? 35 : searchable.startsWith(variant) ? 80 : aliasPrefix ? 75 : searchable.includes(variant) ? 70 : aliasContains ? 65 : Math.round(tokenCoverage * 50);
    if (score > best.score) best = { stage: exact ? "exact" : exactAlias ? "alias" : weakDynamicAlias ? "fuzzy" : "partial", score, query: variant };
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
      select: { foodId: true, normalizedAlias: true, kind: true },
      take: 60
    }),
    prisma.food.findMany({
      where: { createdById: null, OR: variants.map((query) => ({ searchText: { contains: query, mode: "insensitive" as const } })) },
      include: { servings: { orderBy: [{ isEstimated: "asc" }, { confidence: "desc" }] } },
      take: 90
    })
  ]);
  const aliasesByFood = new Map<string, AliasEntry[]>();
  for (const alias of aliases) {
    const values = aliasesByFood.get(alias.foodId) ?? [];
    values.push({ normalizedAlias: normalizeSearch(alias.normalizedAlias), kind: alias.kind });
    aliasesByFood.set(alias.foodId, values);
  }
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
    .map((food) => ({ ...food, match: scoreFood(food, variants, aliasesByFood, fuzzyIds) }))
    .filter((food) => food.match.score > 0)
    .sort((a, b) => b.match.score - a.match.score || a.name.localeCompare(b.name))
    .slice(0, take);
}
