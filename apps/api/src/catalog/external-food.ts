import type { FoodSource, PrismaClient } from "@prisma/client";
import { z } from "zod";
import type { Locale } from "@keto-mentor/shared";
import { buildSearchText, normalizeSearch } from "./normalize.js";
import { isTrustedLocalMatch, searchFoods } from "./food-search.js";
import type { ImportFood, ImportNutrient } from "../importers/types.js";
import { localizeCandidateNames, type CandidateLocalizationProvider } from "./candidate-localization.js";

/** Optional locale-aware presentation — never affects identity/dedup/trust. */
export type LocalizationOptions = { locale: Locale; provider: CandidateLocalizationProvider };

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

export interface ConfirmableFoodLookupAdapter extends StructuredFoodLookupAdapter {
  lookupById(sourceId: string): Promise<unknown>;
}

export const externalFoodConfirmationSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("usda_fdc"), sourceId: z.string().regex(/^\d{1,12}$/) }).strict(),
  // sourceId for open_food_facts is the product's barcode itself (OFF's own
  // product identifier), so it uses the same bounded GTIN length set as the
  // barcode lookup endpoint rather than USDA's numeric-ID shape.
  z.object({ source: z.literal("open_food_facts"), sourceId: z.string().regex(/^(\d{8}|\d{12}|\d{13}|\d{14})$/) }).strict()
]);

export type ResolutionOutcome =
  | { status: "resolved_local"; food: any }
  | { status: "resolved_external"; food: any; provenance: ExternalFoodCandidate["provenance"] }
  | { status: "confirmation_required"; candidates: ExternalFoodCandidate[]; reason: "ambiguous" | "possible_duplicate" | "weak_match" }
  | { status: "unresolved"; candidates: []; reason: "not_found" | "invalid_external_data" | "external_unavailable" };

const REQUIRED_MACROS = ["kcalPer100g", "fatPer100g", "proteinPer100g", "carbsPer100g"] as const;
// Every trusted external source must resolve to exactly this hostname in its
// own sourceUrl — a candidate claiming source: "open_food_facts" but linking
// to some other host (or vice versa) is rejected outright.
const TRUSTED_SOURCE_HOSTS: Partial<Record<string, string>> = { usda_fdc: "fdc.nal.usda.gov", open_food_facts: "world.openfoodfacts.org" };

function finiteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// A minimum semantic relevance floor between the search query actually sent
// to an external source and what it returned. A full-text search engine
// (USDA's included) routinely returns SOMETHING for a vague or imprecisely
// translated query, ranked by its own internal relevance — a ranking this
// system never sees or preserves (normalizeUsdaFood assigns every non-exact
// match the same flat confidence, see structured-source-adapters.ts). Without
// a floor here, any returned result becomes an equally "confident" candidate
// regardless of how unrelated it actually is. Found live in production
// 2026-09-10: "borsófőzelék" (pea stew) dynamic resolution surfaced candidates
// like pizza and unrelated stewed dishes that share no real content with the
// query. Deliberately simple and language-agnostic — exact-or-prefix token
// overlap, not a hardcoded list of forbidden categories or foods — so this
// generalizes to any future irrelevant-result case rather than papering over
// the ones already observed.
function tokenOverlaps(a: string, b: string): boolean {
  return a === b || (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a)));
}

export function isRelevantExternalCandidate(query: string, candidateNormalizedName: string): boolean {
  const queryTokens = normalizeSearch(query).split(" ").filter((token) => token.length >= 3);
  if (!queryTokens.length) return true; // nothing specific enough in the query to check against
  const candidateTokens = candidateNormalizedName.split(" ").filter(Boolean);
  return queryTokens.every((queryToken) => candidateTokens.some((candidateToken) => tokenOverlaps(queryToken, candidateToken)));
}

export function validateExternalCandidate(value: unknown): ExternalFoodCandidate | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ExternalFoodCandidate>;
  const expectedHost = TRUSTED_SOURCE_HOSTS[candidate.source ?? ""];
  if (!expectedHost || !/^\d+$/.test(candidate.sourceId ?? "") || !candidate.name || !candidate.originalName) return null;
  if (!candidate.sourceUrl || !candidate.retrievedAt || candidate.nutrientBasis !== "per_100_g") return null;
  try {
    if (new URL(candidate.sourceUrl).hostname !== expectedHost) return null;
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

/**
 * A Food that already exists (matched by source+sourceId, or by name/alias
 * during a fresh external search) may still be missing a display name for
 * the CURRENT confirming/matching user's locale — e.g. it was first
 * persisted by a Hungarian user and a German user now hits it. Backfilling
 * is a single bounded, best-effort call (never one per candidate, never on
 * the hot local-search path — only reached from the already-low-frequency
 * confirm/resolve-external actions) that permanently closes that gap for
 * every future user, and never blocks or fails the caller's own outcome.
 */
async function backfillLocaleName(prisma: ResolutionPrisma, food: any, localization?: LocalizationOptions) {
  if (!localization || localization.locale === "en") return food;
  const existingNames = (food.names ?? {}) as Record<string, string>;
  if (existingNames[localization.locale]) return food;
  try {
    const localized = await localization.provider.localize(
      [{ id: food.id, authoritativeName: food.originalName || food.name, category: food.category ?? undefined }],
      localization.locale
    );
    const displayName = localized.get(food.id);
    if (!displayName) return food;
    const names = { ...existingNames, [localization.locale]: displayName };
    // searchText must be rebuilt alongside names — local full-text search
    // only ever queries searchText, never names directly. Without this, a
    // backfilled locale name is visible in the UI but permanently
    // unreachable by local search in that language: every future query in
    // that locale would silently miss and either re-run external resolution
    // (wasting an AI/USDA call every time) or fail outright, breaking the
    // "persist once, reuse forever" guarantee for exactly the recovery path
    // that exists to make locale coverage eventually-complete.
    const searchText = buildSearchText({ name: food.name, originalName: food.originalName, names, synonyms: food.synonyms, brand: food.brand });
    return await prisma.food.update({ where: { id: food.id }, data: { names, searchText }, include: { servings: true } });
  } catch {
    return food;
  }
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

export type ConfirmationOutcome =
  | { status: "confirmed" | "existing"; food: any }
  | { status: "confirmation_required"; reason: "possible_duplicate"; candidate: ExternalFoodCandidate }
  | { status: "unresolved"; reason: "external_unavailable" | "invalid_external_data" };

export async function confirmAuthoritativeFood(
  prisma: ResolutionPrisma,
  source: FoodSource,
  sourceId: string,
  adapters: readonly ConfirmableFoodLookupAdapter[],
  localization?: LocalizationOptions
): Promise<ConfirmationOutcome> {
  const existing = await prisma.food.findUnique({
    where: { source_sourceId: { source, sourceId } },
    include: { servings: true }
  });
  if (existing) return { status: "existing", food: await backfillLocaleName(prisma, existing, localization) };

  const adapter = adapters.find((candidate) => candidate.source === source);
  if (!adapter) return { status: "unresolved", reason: "external_unavailable" };

  let raw: unknown;
  try { raw = await adapter.lookupById(sourceId); }
  catch { return { status: "unresolved", reason: "external_unavailable" }; }
  let candidate = validateExternalCandidate(raw);
  if (!candidate || candidate.source !== source || candidate.sourceId !== sourceId) {
    return { status: "unresolved", reason: "invalid_external_data" };
  }

  const duplicate = await findDuplicate(prisma, candidate);
  if (duplicate) {
    if (duplicate.source === source && duplicate.sourceId === sourceId) return { status: "existing", food: await backfillLocaleName(prisma, duplicate, localization) };
    return { status: "confirmation_required", reason: "possible_duplicate", candidate };
  }

  if (localization) [candidate] = await localizeCandidateNames(localization.provider, [candidate], localization.locale);

  try {
    return { status: "confirmed", food: await persistCandidate(prisma, candidate) };
  } catch (error: any) {
    if (error?.code === "P2002") {
      const raced = await prisma.food.findUnique({ where: { source_sourceId: { source, sourceId } }, include: { servings: true } });
      if (raced) return { status: "existing", food: await backfillLocaleName(prisma, raced, localization) };
    }
    throw error;
  }
}

export async function resolveAuthoritativeFood(prisma: ResolutionPrisma, query: string, adapters: readonly StructuredFoodLookupAdapter[], localization?: LocalizationOptions): Promise<ResolutionOutcome> {
  const local = await searchFoods(prisma as any, query, 5);
  // "resolved_local" must mean what its name says: a genuinely trusted local
  // identity, not merely "searchFoods returned something". Owner-beta
  // blocker #3 (2026-09-10): this line used to short-circuit on ANY nonzero
  // local score — a query translated from "töltött káposzta" to "stuffed
  // cabbage" partially/coincidentally echoed the unrelated existing food
  // "Cabbage, red, raw" (score 25, stage "partial") and was trusted outright,
  // with zero involvement from the score/stage gate every OTHER local-search
  // consumer (interpretOne) already enforces. Same shared bar as there now —
  // see isTrustedLocalMatch. A weak local echo is discarded here (falling
  // through to the external adapters below, exactly as a genuine local miss
  // would) rather than promoted; it never becomes an invented candidate.
  if (local.length && isTrustedLocalMatch(local[0].match)) return { status: "resolved_local", food: local[0] };
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
  const structurallyValid = rawCandidates.map(validateExternalCandidate).filter((candidate): candidate is ExternalFoodCandidate => Boolean(candidate));
  if (!structurallyValid.length) return { status: "unresolved", candidates: [], reason: "invalid_external_data" };
  // Structurally valid is not the same as relevant — see isRelevantExternalCandidate.
  let candidates = structurallyValid.filter((candidate) => isRelevantExternalCandidate(query, candidate.normalizedName)).sort((a, b) => b.confidence - a.confidence);
  if (!candidates.length) return { status: "unresolved", candidates: [], reason: "not_found" };

  const duplicate = await findDuplicate(prisma, candidates[0]);
  if (duplicate) {
    if (duplicate.source === candidates[0].source && duplicate.sourceId === candidates[0].sourceId) return { status: "resolved_local", food: await backfillLocaleName(prisma, duplicate, localization) };
    const localizedTop5 = localization ? await localizeCandidateNames(localization.provider, candidates.slice(0, 5), localization.locale) : candidates.slice(0, 5);
    return { status: "confirmation_required", candidates: localizedTop5, reason: "possible_duplicate" };
  }
  const top = candidates[0];
  const second = candidates[1];
  if (top.matchPolicy !== "exact_normalized_name" || normalizeSearch(query) !== top.normalizedName) {
    const localizedTop5 = localization ? await localizeCandidateNames(localization.provider, candidates.slice(0, 5), localization.locale) : candidates.slice(0, 5);
    return { status: "confirmation_required", candidates: localizedTop5, reason: "weak_match" };
  }
  if (top.confidence < 0.95 || (second && top.confidence - second.confidence < 0.1)) {
    const localizedTop5 = localization ? await localizeCandidateNames(localization.provider, candidates.slice(0, 5), localization.locale) : candidates.slice(0, 5);
    return { status: "confirmation_required", candidates: localizedTop5, reason: "ambiguous" };
  }
  const [localizedTop] = localization ? await localizeCandidateNames(localization.provider, [top], localization.locale) : [top];
  try {
    const food = await persistCandidate(prisma, localizedTop);
    return { status: "resolved_external", food, provenance: top.provenance };
  } catch (error: any) {
    // A concurrent resolver may have inserted the authoritative source ID after
    // our duplicate check. Resolve that race to the existing row; never update it.
    if (error?.code === "P2002") {
      const existing = await prisma.food.findUnique({ where: { source_sourceId: { source: top.source, sourceId: top.sourceId } }, include: { servings: true } });
      if (existing) return { status: "resolved_local", food: await backfillLocaleName(prisma, existing, localization) };
    }
    throw error;
  }
}

export type BarcodeResolution =
  | { status: "resolved_local"; food: any }
  | { status: "confirmation_required"; candidate: ExternalFoodCandidate; reason?: "possible_duplicate" }
  | { status: "incomplete"; product: { name: string; brand?: string; barcode: string } }
  | { status: "not_found" }
  | { status: "external_unavailable" };

/** Minimal shape needed for barcode lookup — matches OpenFoodFactsLookupAdapter
 * without importing it, since structured-source-adapters.ts already imports
 * from this module (importing it back here would be circular). */
export type BarcodeLookupAdapter = { lookupBarcode(barcode: string): Promise<unknown[]> };

/**
 * Barcode identity is exact, not fuzzy: a local match returns immediately
 * without ever calling the external adapter (local-first), and a validated
 * external candidate always goes to confirmation_required — a barcode
 * lookup alone must never auto-persist anything.
 */
export async function resolveBarcodeFood(prisma: ResolutionPrisma, barcode: string, adapter: BarcodeLookupAdapter | null): Promise<BarcodeResolution> {
  const local = await prisma.food.findFirst({
    where: { barcode, createdById: null },
    include: { servings: true }
  });
  if (local) return { status: "resolved_local", food: local };
  if (!adapter) return { status: "external_unavailable" };

  let raw: unknown[];
  try {
    raw = await adapter.lookupBarcode(barcode);
  } catch {
    return { status: "external_unavailable" };
  }
  if (!raw.length) return { status: "not_found" };

  const candidate = validateExternalCandidate(raw[0]);
  if (candidate) {
    const duplicate = await findDuplicate(prisma, candidate);
    if (duplicate) {
      // Same source+sourceId: this really is the same product already in the
      // catalog (e.g. a re-lookup), safe to hand back directly. A duplicate
      // found only by name/alias is a DIFFERENT existing Food that merely
      // shares a name — that must go to review, never be silently returned
      // as if it were the barcode's product.
      if (duplicate.source === candidate.source && duplicate.sourceId === candidate.sourceId) return { status: "resolved_local", food: duplicate };
      return { status: "confirmation_required", candidate, reason: "possible_duplicate" };
    }
    return { status: "confirmation_required", candidate };
  }

  // The product exists on the external source but failed strict nutrition
  // validation (e.g. missing fiber) — surface a safe, honest "incomplete"
  // notice with whatever name/brand text is available, rather than either
  // inventing missing macros or discarding the product silently.
  const partial = raw[0] as { name?: unknown; brand?: unknown };
  const name = typeof partial?.name === "string" ? partial.name.trim() : "";
  if (!name) return { status: "not_found" };
  const brand = typeof partial?.brand === "string" ? partial.brand.trim() : undefined;
  return { status: "incomplete", product: { name, brand: brand || undefined, barcode } };
}
