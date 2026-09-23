import { type PrismaClient } from "@prisma/client";
import { normalizeSearch } from "./normalize.js";
import { foodCandidateQuery, fuzzyCandidateQuery } from "./food-search-candidates.js";

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
  "100 g bacon": ["bacon"],
  "12 cm kígyóuborka": ["cucumber"],
};

export type FoodSearchMatch = { stage: "exact" | "alias" | "partial" | "fuzzy"; score: number; query: string; aliasKind?: string };
type AliasEntry = { normalizedAlias: string; kind: string; confidence: number };

// P0 semantic identity safety checkpoint (2026-09-16): a `dynamic_search`
// alias only reaches full ("exact") trust once a REAL semantic-gate check
// has actually validated it against the original identity it was learned
// for — see learnSearchAlias's own write-time logic. Every alias written
// BEFORE this checkpoint (including any already-poisoned one, e.g. "mustár"
// -> "Mustard greens, raw") carries the old default confidence (0.7), below
// this threshold, so it is automatically demoted to the weak/fuzzy tier on
// its very next read — no migration, no manual deletion, no destructive
// cleanup of existing staging/production data required.
export const DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD = 0.9;

/**
 * How much of a query phrase must actually be attested somewhere in a food's
 * OWN canonical/localized name(s) before it counts as full identity evidence.
 * Deliberately a coverage FRACTION over normalized tokens, not literal-
 * substring equality — real inflection ("Mandel"/"Mandeln", a token matching
 * as a prefix/suffix of a longer localized form) and legitimately-learned
 * cross-language aliases must keep matching.
 *
 * This is the TRUST bar, not a relevance bar — "is this genuinely the same
 * identity" is a stricter question than "is this worth showing as a
 * candidate", and the two must not share a threshold. Owner-beta blocker #3
 * (2026-09-10): with the threshold at 0.5, a two-token phrase needed only ONE
 * matching token — "stuffed cabbage" was 50% covered by a food named merely
 * "cabbage", "tofu soup" was 50% covered by "Tofu", "egg soup" would be 50%
 * covered by "egg". None of those are the same food as what the phrase
 * describes; the shared word is coincidental, not identity. Requiring FULL
 * coverage closes that gap generally (no word list, no per-language rule)
 * while an exact canonical name, an exact localized name, or a genuinely
 * matching alias — where the query legitimately IS (or inflects from) the
 * food's own name — still covers every token and keeps passing.
 */
const SEMANTIC_TRUST_THRESHOLD = 1;

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
  return matched.length / tokens.length >= SEMANTIC_TRUST_THRESHOLD;
}

// P0 semantic identity safety checkpoint (2026-09-16) — real, reproduced bug:
// "mustár" (mustard, the condiment) was learned as a `dynamic_search` alias
// for "Mustard greens, raw" (localized "nyers mustárlevél" — a leafy
// vegetable, a genuinely different food) purely because hasSemanticCoverage's
// substring check treats "mustár" as "covered" merely for being a lexical
// PREFIX of the longer, unrelated compound word "mustárlevél". A stricter
// whole-word-only variant was tried first and rejected: it also rejects
// "csülök" against its own legitimate localized translation "Sertéscsülök"
// (pork hock — "csülök" genuinely IS the base food; "sertés" is just the
// species modifier). Both pairs are lexically identical in shape (a shorter
// word as a prefix of a longer compound) — no purely lexical/substring rule
// can tell them apart; the difference is in what the attached part MEANS,
// which needs real semantic judgment. hasSemanticCoverage is therefore kept
// exactly as-is (still the necessary cheap pre-filter for every OTHER alias
// kind and call site) — the actual fix is DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD
// below plus learnSearchAlias's write-time semantic-gate check: a
// dynamic_search alias only reaches full trust once a REAL AI semantic-gate
// verdict (reusing the existing same_identity/processed_derivative/
// different_prepared_food classification, not a new classifier) has actually
// validated it against the original identity — never lexical overlap alone.

/**
 * The one shared definition of "is this local Food match strong enough to
 * become a trusted identity" — an exact name match, or an alias earning the
 * same 95-score tier (which itself already required semantic coverage, see
 * `hasSemanticCoverage` above, for anything short of a curated/localized/
 * external alias). Anything else (partial/prefix/contains/fuzzy) is a
 * candidate at best, never an automatic identity. Used by both interpretOne's
 * own scoring (meal-input/interpret.ts) and resolveAuthoritativeFood's local
 * short-circuit (catalog/external-food.ts) so the two cannot drift apart
 * again — owner-beta blocker #3 (2026-09-10) was exactly that drift:
 * resolveAuthoritativeFood trusted ANY nonzero local score with no threshold
 * at all, a completely different (and unguarded) bar from interpretOne's own.
 */
export function isTrustedLocalMatch(match: { stage: string; score: number }): boolean {
  return (match.stage === "exact" || match.stage === "alias") && match.score >= 95;
}

// Generic, language-spanning preparation-state vocabulary — deliberately the
// same word list already used elsewhere (recipe-ingredient-batch-resolution's
// explicitPreparedState check) so the two never drift apart. Not exhaustive
// by design: this is a cheap textual signal, not a semantic judgment — real
// nuance (a candidate that is a processed DERIVATIVE rather than merely
// cooked, or a preparation word this list doesn't know) is exactly what the
// semantic gate exists to reason about once the fast path is skipped below.
const PREPARED_STATE_WORDS = /\b(cooked|boiled|roasted|fried|grilled|steamed|baked|smoked|f[őo]tt|s[üu]lt|p[áa]rolt|f[üu]st[öo]lt|gekocht|gebraten|ged[üu]nstet|ger[äa]uchert)\b/i;
const RAW_STATE_WORDS = /\braw\b/i;

export type FormEvidence = { rawIngredient?: string };

/**
 * Owner-beta checkpoint (2026-09-15): whether a LOCALLY CACHED trusted
 * candidate's own preparation state conflicts with what the source ingredient
 * evidence indicates — closes the "stale local cache permanently overrides
 * better semantic form evidence" bug. Live, reproduced case: this catalog's
 * only locally-cached "tomato" Food happened to be "Tomatoes, red, ripe,
 * cooked" (persisted by an earlier, unrelated session) — with no mismatch
 * check, every future "1 db paradicsom" (an ordinary FRESH tomato, no cooked
 * wording at all) silently kept reusing it forever, purely because it was the
 * only thing already cached, never because it was actually correct.
 *
 * Deliberately conservative and free (no AI call): a mismatch is reported
 * ONLY when there is actual source evidence to compare against (some
 * preparation/rawIngredient text) AND it textually disagrees with the
 * candidate's own name. No evidence on either side is never treated as a
 * conflict — the common case (onion, garlic, carrot, salt, an already-"raw"-
 * or neutral local candidate...) is completely unaffected and keeps
 * resolving at zero extra cost. The rule is symmetric: a source with no
 * stated preparation should not silently accept an explicitly cooked/
 * processed local candidate, and a source that explicitly states a prepared
 * state should not silently accept an explicitly raw one either
 * ("2 főtt paradicsom" must not become raw).
 */
export function localFormMismatch(candidateName: string, evidence: FormEvidence, match?: { stage: string; aliasKind?: string }): boolean {
  // Scoped narrowly to how the candidate actually EARNED local trust: only
  // an unreviewed, single-resolution "dynamic_search" alias (learned by
  // learnSearchAlias from a single past AI resolution, right or wrong — see
  // dynamic-food-resolution.ts) is second-guessed here. An EXACT name match,
  // or any alias kind that represents a genuinely validated identity
  // (confirmed_external — an explicit human confirmation via
  // /foods/resolve-external/confirm — curated_seed, synonym,
  // localized_name, external), is never demoted by this heuristic: a
  // regex-based textual guess must not outrank a human/system-validated
  // mapping. Callers that don't pass `match` (no provenance available)
  // default to the OLD, unscoped behavior for backward compatibility.
  if (match && !(match.stage === "alias" && match.aliasKind === "dynamic_search")) return false;
  // Deliberately the literal source line ONLY, never a caller's own
  // free-text "preparation" field — a value meant for an AI prompt's
  // consumption can legitimately contain a NEGATED preparation word (e.g.
  // "no pre-cooked state stated" literally contains "cooked" as a
  // substring), which this cheap regex cannot safely disambiguate from a
  // genuine affirmative statement. The raw ingredient text is the one
  // signal actually safe for literal keyword matching.
  const sourceText = (evidence.rawIngredient ?? "").trim();
  if (!sourceText) return false;
  const sourceStatesCooked = PREPARED_STATE_WORDS.test(sourceText);
  const candidateCooked = PREPARED_STATE_WORDS.test(candidateName);
  const candidateRaw = RAW_STATE_WORDS.test(candidateName) && !candidateCooked;
  if (!sourceStatesCooked && candidateCooked) return true;
  if (sourceStatesCooked && candidateRaw) return true;
  return false;
}

export function expandFoodQuery(rawQuery: string) {
  const normalized = normalizeSearch(rawQuery);
  return [...new Set([normalized, ...(QUERY_ALIASES[normalized] ?? [])].map(normalizeSearch).filter((value) => value.length >= 2))];
}

function wholePhrase(text: string, query: string) {
  return (` ${text} `).includes(` ${query} `);
}

// Compound head matches are discovery evidence only, never exact identity.
// Short fragments (ham/pea/nut) are particularly ambiguous and excluded.
function compoundHead(text: string, query: string) {
  return query.length >= 5 && !query.includes(" ") && text.split(" ").some(token =>
    token.length >= 5 && (token.endsWith(query) || query.endsWith(token)));
}

const SEARCH_FORMS = [
  /\b(dried|dehydrated|getrocknet|szaritott)\b/,
  /\b(cooked|boiled|gekocht|fott)\b/,
  /\b(roasted|fried|baked|gebraten|gebacken|sult)\b/,
  /\b(smoked|gerauchert|fustolt)\b/,
  /\b(canned|konserve|konzerv)\b/,
];
// German prepared-food heads are productive suffixes (e.g. Apfelkuchen,
// Blätterteig), unlike a query fragment. Recognize the preparation category,
// never special-case a searched ingredient. "pie" added 2026-09-23: an
// ingredient-alias precedence fix (see weakDynamicAlias in scoreFood) exposed
// that "apple"/"apple pie" had only ever been kept apart by that same bug —
// this category was simply missing, the same generic gap the mustár/
// mustárlevél fix already covers for every OTHER compound keyword here.
const COMPOUND_FOOD = /\b(with|mit|filled|stuffed|flavored|flavoured|dessert|cake|pie|sauce|soup|bread|pastry|[a-z]*(kuchen|torte|geback|teig|schnitten|sosse|suppe|brot|brotchen))\b/;

function isQueryHeadedHyphenCompound(food: any, query: string) {
  if (!query || query.includes(" ")) return false;
  const rawNames = [food.name, food.originalName, ...Object.values((food.names as Record<string, unknown>) ?? {})]
    .filter((value): value is string => typeof value === "string");
  return rawNames.some(name => name.split(/[-–—]/).slice(0, -1)
    .some(segment => normalizeSearch(segment).split(" ").at(-1) === query));
}

function isModifierPrefixedCompound(food: any, query: string) {
  if (!query || query.includes(" ")) return false;
  return foodNameRepresentations(food).some((name) => name.split(" ").some((token) => token !== query && token.endsWith(query)));
}

function rankingPenalty(food: any, query: string) {
  const names = foodNameRepresentations(food);
  const form = SEARCH_FORMS.some(pattern => !pattern.test(query) && names.some(name => pattern.test(name)))
    || (SEARCH_FORMS.some(pattern => pattern.test(query)) && names.some(name => /\b(raw|fresh|roh|frisch|nyers|friss)\b/.test(name)));
  // BLS D (pastry/cakes) and X/Y (menu components) are publisher-defined
  // preparations, not a source preference:
  // https://blsdb.de/bls ("Das Schlüsselsystem"). An explicitly named dish
  // keeps its identity; an ingredient query must not silently prefer a recipe.
  const menuComponent = food.source === "bls" && /^[DXY][A-Z0-9]{6}$/.test(food.sourceId ?? "") && !names.includes(query);
  const compound = !COMPOUND_FOOD.test(query) && (menuComponent || names.some(name => COMPOUND_FOOD.test(name)) || isQueryHeadedHyphenCompound(food, query));
  const specializedCompound = isModifierPrefixedCompound(food, query);
  return (form ? 30 : 0) + (compound ? 40 : 0) + (specializedCompound ? 20 : 0);
}

function nutritionCompleteness(food: any) {
  return [food.kcalPer100g, food.proteinPer100g, food.fatPer100g, food.carbsPer100g]
    .filter(value => value != null && Number.isFinite(Number(value))).length;
}

function scoreFood(food: any, variants: readonly string[], aliasesByFood: ReadonlyMap<string, readonly AliasEntry[]>, fuzzyIds: Set<string>, rankingQuery: string): FoodSearchMatch {
  const searchable = normalizeSearch(food.searchText || food.name);
  const names = foodNameRepresentations(food);
  const aliasEntries = aliasesByFood.get(food.id) ?? [];
  const aliasStrings = aliasEntries.map((entry) => entry.normalizedAlias);
  let best: FoodSearchMatch = { stage: "partial", score: 0, query: variants[0] ?? "" };
  // The user's own wording is the only route to exact/trusted identity.
  // Reviewed expansions remain useful for discovery, but are deliberately
  // capped below the trust threshold so they can never displace a stronger
  // match for what the user actually typed.
  for (const [variantIndex, variant] of variants.entries()) {
    const expansion = variantIndex > 0;
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
    // P0 semantic identity safety checkpoint (2026-09-16): a dynamic_search
    // alias now ALSO needs confidence >= DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD
    // to earn full ("exact") trust — hasSemanticCoverage alone (lexical
    // token overlap) cannot tell "csülök is genuinely a form of sertéscsülök"
    // from "mustár merely happens to be a lexical prefix of mustárlevél,  a
    // different food"; only a REAL semantic-gate verdict, recorded as this
    // alias's confidence at write time (see learnSearchAlias), can. An alias
    // below the threshold (every alias written before this checkpoint,
    // confidence 0.7) falls to the weak/fuzzy tier here instead — never
    // silently promoted to full trust merely for existing.
    const dynamicSearchTrusted = matchingAlias?.kind === "dynamic_search" && matchingAlias.confidence >= DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD && hasSemanticCoverage(variant, names);
    const exactAlias = !!matchingAlias && (matchingAlias.kind !== "dynamic_search" || dynamicSearchTrusted);
    const weakDynamicAlias = !!matchingAlias && matchingAlias.kind === "dynamic_search" && !dynamicSearchTrusted;
    // A weak alias trivially "starts with"/"contains" its OWN text (it IS the
    // variant) — that circular echo must not count as independent alias
    // evidence when computing how strong the food's OTHER evidence is,
    // otherwise the very alias being gated as untrusted would silently
    // launder itself back in at the aliasPrefix/aliasContains tier.
    const otherAliasStrings = weakDynamicAlias ? aliasStrings.filter((alias) => alias !== matchingAlias!.normalizedAlias) : aliasStrings;
    const aliasPrefix = otherAliasStrings.some((alias) => alias.startsWith(`${variant} `));
    const aliasContains = otherAliasStrings.some((alias) => wholePhrase(alias, variant));
    const tokenCoverage = variant.split(" ").filter((token) => wholePhrase(searchable, token)).length / variant.split(" ").length;
    const prefix = variant.length >= 5 && !variant.includes(" ") && searchable.split(" ").some(token => token.startsWith(variant));
    // A weak (untrusted) dynamic_search alias is a MINIMUM fallback signal,
    // never a precedence override: it must not outrank the food's own
    // genuine canonical/localized/lexical evidence, only fill in when that
    // evidence is weaker than the alias's own 35-point floor. Real
    // production case (2026-09-22, live staging RCA): "parsley"/"bacon" each
    // also carry an old (confidence 0.7) dynamic_search alias for their OWN,
    // correct Food — the alias used to short-circuit an otherwise 70-80
    // point canonical/searchText match down to 35 ("fuzzy"), because it was
    // checked before any natural-evidence tier in this ternary chain. The
    // poisoned-alias protection this alias tier exists for is unaffected:
    // an alias learned for an UNRELATED food (e.g. "mustár" -> Mustard
    // greens) still has zero natural evidence for the query, so it still
    // floors at exactly 35, never higher.
    const naturalScore = names.some(name => name.startsWith(`${variant} `)) ? 80
      : aliasPrefix ? 75
      : wholePhrase(searchable, variant) ? 70
      : aliasContains ? 65
      : compoundHead(searchable, variant) ? 60
      : prefix ? 40
      : Math.round(tokenCoverage * 50);
    const weakDynamicAliasWins = weakDynamicAlias && naturalScore < 35;
    const primaryScore = exact ? 100 : exactAlias ? 95 : Math.max(naturalScore, weakDynamicAlias ? 35 : 0);
    const score = expansion ? Math.min(primaryScore, 55) : primaryScore;
    if (score > best.score) best = {
      stage: expansion ? "partial" : exact ? "exact" : exactAlias ? "alias" : weakDynamicAliasWins ? "fuzzy" : "partial",
      score, query: variant,
      aliasKind: !expansion && (exactAlias || weakDynamicAliasWins) ? matchingAlias?.kind : undefined
    };
  }
  // Reviewed aliases retain their established trust contract. Ranking penalties
  // still apply separately, so a reviewed compound does not displace a basic food.
  if (best.score > 0 && best.stage !== "alias" && best.stage !== "exact") {
    best.score = Math.max(1, best.score - rankingPenalty(food, rankingQuery));
  }
  // Do not resurrect substring-only candidates through the trigram fallback.
  const substringOnly = searchable.includes(variants[0]) && !wholePhrase(searchable, variants[0]);
  const expansionOnly = variants.slice(1).some(variant => wholePhrase(searchable, variant));
  return best.score === 0 && fuzzyIds.has(food.id) && !substringOnly && !expansionOnly ? { stage: "fuzzy", score: 35, query: variants[0] ?? "" } : best;
}

type CatalogPrisma = Pick<PrismaClient, "food" | "foodAlias"> & Partial<Pick<PrismaClient, "$queryRaw">>;

export function rankFoodCandidates(candidates: any[], variants: readonly string[], aliasesByFood: ReadonlyMap<string, readonly AliasEntry[]>, fuzzyIds: Set<string>, rankingQuery: string) {
  return candidates
    .map((food) => ({ ...food, match: scoreFood(food, variants, aliasesByFood, fuzzyIds, rankingQuery) }))
    .filter((food) => food.match.score > 0)
    .sort((a, b) => {
      const rank = (food: typeof a) => food.match.score - (isTrustedLocalMatch(food.match) ? rankingPenalty(food, rankingQuery) : 0);
      // Stable equivalence classes, not pairwise name-overlap (which is not
      // transitive and can make sorting depend on input order).
      const identityKey = (food: typeof a) => isTrustedLocalMatch(food.match) ? food.match.query : normalizeSearch(food.originalName || food.name);
      const identityOrder = identityKey(a).localeCompare(identityKey(b));
      return rank(b) - rank(a) || rankingPenalty(a, rankingQuery) - rankingPenalty(b, rankingQuery) || nutritionCompleteness(b) - nutritionCompleteness(a) || identityOrder || Number(b.source === "bls") - Number(a.source === "bls") || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    });
}

export async function searchFoods(prisma: CatalogPrisma, rawQuery: string, limit = 20, formEvidence?: FormEvidence) {
  const variants = expandFoodQuery(rawQuery);
  if (!variants.length) return [];
  const take = Math.min(Math.max(limit, 1), 30);
  const rankingQuery = normalizeSearch(formEvidence?.rawIngredient ?? rawQuery);
  const aliasesByFood = new Map<string, AliasEntry[]>();
  const fuzzyIds = new Set<string>();

  if (prisma.$queryRaw) {
    const candidates = await prisma.$queryRaw<any[]>(foodCandidateQuery(variants, rankingQuery, { forms: SEARCH_FORMS, compound: COMPOUND_FOOD }));
    for (const candidate of candidates) aliasesByFood.set(candidate.id, candidate._aliases ?? []);
    let ranked = rankFoodCandidates(candidates, variants, aliasesByFood, fuzzyIds, rankingQuery);
    // Two-character inputs retain exact/token discovery. Trigram similarity for
    // such short fragments is too weak; it must not resurrect substring noise.
    if (variants[0].length >= 3 && !ranked.some(food => food.match.score >= 40)) {
      const fuzzy = await prisma.$queryRaw<any[]>(fuzzyCandidateQuery(variants[0], candidates.map(food => food.id)));
      for (const food of fuzzy) fuzzyIds.add(food.id);
      candidates.push(...fuzzy);
      ranked = rankFoodCandidates(candidates, variants, aliasesByFood, fuzzyIds, rankingQuery);
    }
    const winners = ranked.slice(0, take);
    if (!winners.length) return [];
    const full = await prisma.food.findMany({
      where: { id: { in: winners.map(food => food.id) }, createdById: null },
      include: { servings: { orderBy: [{ isEstimated: "asc" }, { confidence: "desc" }] } },
      orderBy: { id: "asc" }
    });
    const byId = new Map(full.map(food => [food.id, food]));
    return winners.filter(food => byId.has(food.id)).map(food => ({ ...byId.get(food.id)!, match: food.match }));
  }

  // Compatibility for the existing non-SQL projected catalog and unit-test
  // adapters. Real Prisma clients (including transactions) always use the SQL
  // branch above. This path performs no pagination either.
  const [aliases, candidates] = await Promise.all([
    prisma.foodAlias.findMany({
      where: { OR: variants.map(normalizedAlias => ({ normalizedAlias: { contains: normalizedAlias } })) },
      select: { foodId: true, normalizedAlias: true, kind: true, confidence: true },
      orderBy: { id: "asc" }, take: 96
    }),
    prisma.food.findMany({
      where: { createdById: null, OR: variants.map(query => ({ searchText: { contains: query, mode: "insensitive" as const } })) },
      orderBy: { id: "asc" }, take: 96
    })
  ]);
  for (const alias of aliases) {
    const entries = aliasesByFood.get(alias.foodId) ?? [];
    entries.push({ normalizedAlias: normalizeSearch(alias.normalizedAlias), kind: alias.kind, confidence: alias.confidence });
    aliasesByFood.set(alias.foodId, entries);
  }
  const missingIds = [...new Set(aliases.map(alias => alias.foodId))].filter(id => !candidates.some(food => food.id === id));
  if (missingIds.length) candidates.push(...await prisma.food.findMany({ where: { id: { in: missingIds }, createdById: null }, orderBy: { id: "asc" }, take: 96 }));
  return rankFoodCandidates(candidates, variants, aliasesByFood, fuzzyIds, rankingQuery).slice(0, take);
}
