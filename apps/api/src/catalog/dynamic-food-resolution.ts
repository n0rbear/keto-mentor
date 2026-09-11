import type { PrismaClient } from "@prisma/client";
import type { Locale } from "@keto-mentor/shared";
import { resolveAuthoritativeFood, type ExternalFoodCandidate, type ResolutionOutcome, type StructuredFoodLookupAdapter } from "./external-food.js";
import type { SearchIntentProvider } from "./search-intent.js";
import { DisabledCandidateLocalizationProvider, type CandidateLocalizationProvider } from "./candidate-localization.js";
import type { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";
import { normalizeSearch } from "./normalize.js";
import { foodNameRepresentations, hasSemanticCoverage } from "./food-search.js";
import { foodLocaleFor, type FoodLocale } from "./food-locale.js";
import { DisabledSemanticCandidateGateProvider, type SemanticCandidateGateProvider } from "./semantic-candidate-gate.js";

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
 *
 * Gated on semantic coverage against the food's own name(s) before it is
 * ever written: the resolution this alias is about to memorialize was
 * whatever resoleAuthoritativeFood decided, right or wrong, and once written
 * a "dynamic_search" alias otherwise scores as a full trusted match (see
 * food-search.ts) for every future identical phrase. A phrase with no real
 * relationship to the food it landed on — e.g. a mistranslated search-intent
 * term coincidentally exact-matching an unrelated USDA entry — must never be
 * memorized as if it were a legitimate shortcut to that food. Real
 * production case (2026-09-10): this is exactly how "gefüllte Kohlrouladen"
 * and "Champignoncremesuppe" got permanently, silently aliased to "bok choy"
 * and "beech mushroom".
 */
async function learnSearchAlias(prisma: DynamicPrisma, food: { id: string; name?: unknown; originalName?: unknown; names?: unknown }, rawQuery: string, locale: string | undefined) {
  const normalizedAlias = normalizeSearch(rawQuery);
  if (!normalizedAlias || normalizedAlias.length < 2) return;
  if (!hasSemanticCoverage(normalizedAlias, foodNameRepresentations(food))) return;
  const foodId = food.id;
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

/**
 * Owner-beta blocker #8 (2026-09-11): the REGIONAL locale to tag a
 * dynamic_search alias with. The caller's own known foodLocale (the
 * authenticated user's real region, derived from their trusted User.locale —
 * see catalog/food-locale.ts) is preferred whenever the caller supplied one,
 * since that is a genuinely trusted signal; the AI search-intent's own
 * self-reported sourceLanguage (a bare 2-letter guess, "hu"/"de"/"en"/
 * "unknown") is only a fallback for callers that haven't wired a foodLocale
 * yet — never the other way around, since the AI's language guess is weaker
 * evidence than the user's own persisted locale.
 */
function aliasLocaleFor(deps: { foodLocale?: FoodLocale }, sourceLanguage: string | undefined): string | undefined {
  return deps.foodLocale ?? sourceLanguage;
}

/**
 * Category-only production observability for dynamic external resolution —
 * mirrors interpret.ts's quantity_ai logging exactly: no food text, no query
 * text, no user id. Before this, an "unresolved" outcome gave no way to
 * tell "the LLM search-intent call failed (degraded to the raw phrase,
 * which then couldn't match an English-language catalog)" apart from "the
 * LLM worked fine but the authoritative source genuinely has no match" apart
 * from "rate limited" apart from "no adapters configured" — all silently
 * indistinguishable in production logs.
 */
function logDynamicResolutionOutcome(status: DynamicResolutionOutcome["status"], via?: "search_intent" | "raw_query", reason?: string) {
  console.log(`dynamic_food_resolution status=${status}${via ? ` via=${via}` : ""}${reason ? ` reason=${reason}` : ""}`);
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
    // The authenticated user's own persisted locale (never a client-supplied
    // value) — governs display-name localization only, never search/matching.
    // Optional + internally defaulted so a caller that hasn't wired
    // localization yet (e.g. an older test fixture) degrades to "no
    // localization" instead of crashing.
    locale?: Locale;
    // Owner-beta blocker #8 (2026-09-11): the user's REGIONAL food-vocabulary
    // locale (e.g. "de-AT"), when known — drives canonical search
    // normalization (sent to searchIntentProvider) and display localization
    // (sent to resolveAuthoritativeFood) with real regional precision.
    // Optional and independent of `locale` for backward compatibility: an
    // older caller that only wires `locale` still works exactly as before.
    foodLocale?: FoodLocale;
    localizationProvider?: CandidateLocalizationProvider;
    // Owner-beta blocker #9 (2026-09-11): validates a candidate against the
    // ORIGINAL identity the user actually typed, independent of whatever
    // (possibly over-specific/wrong) term canonical search normalization
    // produced — see semantic-candidate-gate.ts for the full root-cause
    // writeup. Optional in the TYPE only for structural backward
    // compatibility; defaults to DisabledSemanticCandidateGateProvider,
    // which FAILS CLOSED (rejects every candidate) rather than silently
    // skipping the check — a caller that doesn't wire a real gate gets safe
    // "unresolved" outcomes, never ungated candidates.
    semanticCandidateGateProvider?: SemanticCandidateGateProvider;
  }
): Promise<DynamicResolutionOutcome> {
  if (!deps.adapters.length) { logDynamicResolutionOutcome("unresolved", undefined, "no_adapters"); return { status: "unresolved", reason: "no_adapters" }; }
  if (!deps.rateLimiter.consume(deps.userId)) { logDynamicResolutionOutcome("unresolved", undefined, "rate_limited"); return { status: "unresolved", reason: "rate_limited" }; }

  const intent = await deps.searchIntentProvider.generate({ foodQuery: input.foodQuery, preparation: input.preparation, foodLocale: deps.foodLocale });
  const searchTerm = intent?.searchTerms[0]?.trim() || input.foodQuery;
  const via: "search_intent" | "raw_query" = intent?.searchTerms[0]?.trim() ? "search_intent" : "raw_query";

  const outcome: ResolutionOutcome = await resolveAuthoritativeFood(prisma, searchTerm, deps.adapters, {
    locale: deps.foodLocale ?? deps.locale ?? "hu",
    provider: deps.localizationProvider ?? new DisabledCandidateLocalizationProvider()
  }, {
    provider: deps.semanticCandidateGateProvider ?? new DisabledSemanticCandidateGateProvider(),
    originalIdentity: input.foodQuery,
    locale: deps.foodLocale ?? deps.locale
  });
  switch (outcome.status) {
    case "resolved_local":
    case "resolved_external":
      await learnSearchAlias(prisma, outcome.food, input.foodQuery, aliasLocaleFor(deps, intent?.sourceLanguage));
      logDynamicResolutionOutcome("resolved", via);
      return { status: "resolved", food: outcome.food, via };
    case "confirmation_required":
      logDynamicResolutionOutcome("confirmation_required", via, outcome.reason);
      return { status: "confirmation_required", candidates: outcome.candidates, reason: outcome.reason };
    case "unresolved":
      logDynamicResolutionOutcome("unresolved", via, outcome.reason);
      return { status: "unresolved", reason: outcome.reason };
  }
}
