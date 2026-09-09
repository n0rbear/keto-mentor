import type { PrismaClient } from "@prisma/client";
import { resolveAuthoritativeFood, type ExternalFoodCandidate, type ResolutionOutcome, type StructuredFoodLookupAdapter } from "./external-food.js";
import type { SearchIntentProvider } from "./search-intent.js";
import type { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";
import { normalizeSearch } from "./normalize.js";

type DynamicPrisma = Parameters<typeof resolveAuthoritativeFood>[0];

/**
 * Conservative alias learning (Part 11): the ONLY thing ever remembered is
 * the raw phrase the user actually typed, attached to whichever Food the
 * existing authoritative confidence/dedup pipeline already independently
 * decided was correct — never a food a user merely claims is a match. Tagged
 * "dynamic_search" (distinct from curated/external/authoritative aliases)
 * with locale + confidence + source kept in provenance, so a later audit can
 * always tell a system-curated name from a user-search-derived one. This is
 * what makes "same query next time -> zero external calls" genuinely true,
 * not just true for a byte-identical search term.
 */
async function learnSearchAlias(prisma: DynamicPrisma, foodId: string, rawQuery: string, locale: string | undefined) {
  const normalizedAlias = normalizeSearch(rawQuery);
  if (!normalizedAlias || normalizedAlias.length < 2) return;
  try {
    await prisma.foodAlias.upsert({
      where: { foodId_normalizedAlias_locale: { foodId, normalizedAlias, locale: locale ?? "und" } },
      update: {},
      create: {
        foodId, alias: rawQuery.trim(), normalizedAlias, locale: locale ?? "und",
        kind: "dynamic_search", confidence: 0.7, provenance: { method: "dynamic_search", learnedAt: new Date().toISOString() }
      }
    });
  } catch {
    // Alias learning is a best-effort convenience, never load-bearing for
    // correctness — a failure here must never affect the resolution result.
  }
}

export type DynamicResolutionOutcome =
  | { status: "resolved"; food: any; via: "search_intent" | "raw_query" }
  | { status: "confirmation_required"; candidates: ExternalFoodCandidate[]; reason: "ambiguous" | "possible_duplicate" | "weak_match" }
  | { status: "unresolved"; reason: "not_found" | "invalid_external_data" | "external_unavailable" | "rate_limited" | "no_adapters" };

/**
 * The local-miss fallback: one search-intent call (best-effort — a disabled/
 * unavailable/failing LLM degrades to the raw normalized food phrase, never
 * blocks the lookup) feeding exactly one authoritative external search, then
 * resolveAuthoritativeFood's existing PR #15 confidence/dedup/persistence
 * logic decides the outcome unchanged. Never called on a local hit.
 */
export async function resolveDynamicFood(
  prisma: DynamicPrisma,
  input: { foodQuery: string; preparation?: string },
  deps: {
    searchIntentProvider: SearchIntentProvider;
    adapters: readonly StructuredFoodLookupAdapter[];
    rateLimiter: DynamicFoodResolutionRateLimiter;
    userId: string;
  }
): Promise<DynamicResolutionOutcome> {
  if (!deps.adapters.length) return { status: "unresolved", reason: "no_adapters" };
  if (!deps.rateLimiter.consume(deps.userId)) return { status: "unresolved", reason: "rate_limited" };

  const intent = await deps.searchIntentProvider.generate({ foodQuery: input.foodQuery, preparation: input.preparation });
  const searchTerm = intent?.searchTerms[0]?.trim() || input.foodQuery;
  const via: "search_intent" | "raw_query" = intent?.searchTerms[0]?.trim() ? "search_intent" : "raw_query";

  const outcome: ResolutionOutcome = await resolveAuthoritativeFood(prisma, searchTerm, deps.adapters);
  switch (outcome.status) {
    case "resolved_local":
    case "resolved_external":
      await learnSearchAlias(prisma, outcome.food.id, input.foodQuery, intent?.sourceLanguage);
      return { status: "resolved", food: outcome.food, via };
    case "confirmation_required":
      return { status: "confirmation_required", candidates: outcome.candidates, reason: outcome.reason };
    case "unresolved":
      return { status: "unresolved", reason: outcome.reason };
  }
}
