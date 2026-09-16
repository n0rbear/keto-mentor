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
import type { AliasSemanticVerdict } from "./alias-semantic-verdict.js";
import { computeAliasSemanticVerdict } from "./alias-semantic-verdict.js";
import { timeStage } from "../request-performance.js";
import { attemptWebEvidenceFallback, persistWebEvidenceFood, type WebEvidenceFallbackDeps } from "./web-evidence-fallback.js";
import type { AiNutritionEstimate, AiNutritionEstimationProvider } from "./ai-nutrition-estimation.js";
import type { AiEstimateRateLimiter } from "./ai-estimate-rate-limit.js";

type DynamicPrisma = Parameters<typeof resolveAuthoritativeFood>[0];

/**
 * FINAL FALLBACK reuse (Part O, 2026-09-16): before spending a fresh AI
 * estimation call, check whether THIS user already has their own previously
 * accepted estimate/manually-entered Food for this identity. Deliberately
 * NOT the same code path as searchFoods (catalog/food-search.ts) — that
 * function only ever queries createdById: null (global/authoritative Foods)
 * by design, so a private Food is structurally invisible to it, which is
 * exactly the property that keeps one user's estimate from ever leaking
 * into another user's resolution (Part W). This is a second, narrower,
 * explicitly userId-scoped lookup that exists ONLY to avoid re-charging the
 * same user for an identical repeat query — it can never be reached without
 * an authenticated userId, and its WHERE clause hardcodes createdById:
 * userId, so it is structurally incapable of returning another user's row.
 */
export async function findUserPrivateFood(prisma: DynamicPrisma, userId: string, normalizedIdentity: string) {
  if (!normalizedIdentity) return null;
  return (prisma as any).food.findFirst({
    where: { createdById: userId, searchText: { contains: normalizedIdentity, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    include: { servings: true }
  });
}

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
 *
 * P0 semantic identity safety checkpoint (2026-09-16): hasSemanticCoverage
 * (lexical token overlap) is necessary but NOT sufficient — it cannot tell
 * "csülök is genuinely a form of sertéscsülök" from "mustár merely happens
 * to be a lexical prefix of mustárlevél, a different food" (see
 * food-search.ts's DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD for the full
 * writeup). `semanticVerdict` — computed by the caller via
 * computeAliasSemanticVerdict, reusing the existing semantic-candidate-gate
 * — decides the WRITTEN confidence: "validated" earns full trust (0.95, can
 * reach the "exact" tier); "rejected" (a real gate explicitly said this is
 * NOT the same identity) means the alias is never written at all, exactly
 * like the pre-existing "gefüllte Kohlrouladen" precedent; "unknown" (no
 * real gate configured, or a transient provider failure) preserves the
 * original, pre-checkpoint behavior (0.7 — never enough for full trust,
 * still a candidate for confirmation, self-heals to "validated" next time
 * a real gate is available and this exact phrase comes up again).
 */
export async function learnSearchAlias(prisma: DynamicPrisma, food: { id: string; name?: unknown; originalName?: unknown; names?: unknown }, rawQuery: string, locale: string | undefined, semanticVerdict: AliasSemanticVerdict = "unknown") {
  const normalizedAlias = normalizeSearch(rawQuery);
  if (!normalizedAlias || normalizedAlias.length < 2) return;
  if (!hasSemanticCoverage(normalizedAlias, foodNameRepresentations(food))) return;
  if (semanticVerdict === "rejected") return;
  const confidence = semanticVerdict === "validated" ? 0.95 : 0.7;
  const foodId = food.id;
  try {
    await prisma.foodAlias.upsert({
      where: { foodId_normalizedAlias_locale: { foodId, normalizedAlias, locale: locale ?? "und" } },
      update: semanticVerdict === "validated" ? { confidence } : {},
      create: {
        foodId, alias: rawQuery.trim(), normalizedAlias, locale: locale ?? "und",
        kind: "dynamic_search", confidence, provenance: { method: "dynamic_search", learnedAt: new Date().toISOString(), semanticVerdict }
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
function logDynamicResolutionOutcome(status: DynamicResolutionOutcome["status"], via?: "search_intent" | "raw_query" | "normalized_identity", reason?: string) {
  console.log(`dynamic_food_resolution status=${status}${via ? ` via=${via}` : ""}${reason ? ` reason=${reason}` : ""}`);
}

export type DynamicResolutionOutcome =
  | { status: "resolved"; food: any; via: "search_intent" | "raw_query" | "normalized_identity" }
  | { status: "confirmation_required"; candidates: ExternalFoodCandidate[]; reason: "ambiguous" | "possible_duplicate" | "weak_match" }
  | { status: "unresolved"; reason: "not_found" | "invalid_external_data" | "external_unavailable" | "rate_limited" | "no_adapters" }
  // FINAL FALLBACK (2026-09-16): local + authoritative-adapter + web-evidence
  // resolution all genuinely failed, AND the AI estimation provider produced
  // a structurally-plausible estimate. This is NEVER auto-persisted as a
  // Food — see the "ai_estimate_pending" doc on the caller side
  // (meal-input/interpret.ts) for exactly how a user must explicitly accept
  // (or reject in favor of their own values) before anything is written.
  | { status: "ai_estimate_pending"; estimate: AiNutritionEstimate; requestedIdentity: string; canonicalIdentity: string };

type ResolveFromSearchTermDeps = {
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
  // locale (e.g. "de-AT"), when known — drives display localization (sent to
  // resolveAuthoritativeFood) with real regional precision. Optional and
  // independent of `locale` for backward compatibility.
  foodLocale?: FoodLocale;
  localizationProvider?: CandidateLocalizationProvider;
  // Owner-beta blocker #9 (2026-09-11): validates a candidate against the
  // ORIGINAL identity, independent of whatever (possibly over-specific/wrong)
  // term the search term actually was — see semantic-candidate-gate.ts for
  // the full root-cause writeup. Optional in the TYPE only for structural
  // backward compatibility; defaults to DisabledSemanticCandidateGateProvider,
  // which FAILS CLOSED (rejects every candidate) rather than silently
  // skipping the check — a caller that doesn't wire a real gate gets safe
  // "unresolved" outcomes, never ungated candidates.
  semanticCandidateGateProvider?: SemanticCandidateGateProvider;
  // DATABASE MISS -> AUTHORITATIVE EXTERNAL EVIDENCE FALLBACK (2026-09-16):
  // the last-resort stage, tried only inside resolveFromSearchTerm's own
  // "unresolved" branch below, after resolveAuthoritativeFood (local +
  // USDA/OFF + semantic gate) has already found nothing. Optional — a
  // caller that doesn't wire it (e.g. an older test, or a deployment
  // without WEB_SEARCH_PROVIDER configured) degrades to the pre-existing
  // "unresolved" outcome, byte-for-byte unchanged.
  webEvidenceFallback?: Pick<WebEvidenceFallbackDeps, "searchProvider" | "extractionProvider" | "rateLimiter">;
  // FINAL FALLBACK: AI-ESTIMATED NUTRITION (2026-09-16) — tried only after
  // web-evidence ALSO genuinely fails. Optional; a caller that doesn't wire
  // it degrades to the pre-existing "unresolved" outcome.
  aiEstimation?: { provider: AiNutritionEstimationProvider; rateLimiter: AiEstimateRateLimiter };
};

/**
 * The shared core both resolveDynamicFood and resolveDynamicFoodFromIdentity
 * converge into once a search term is known: rate-limit, run
 * resolveAuthoritativeFood's existing confidence/dedup/persistence/semantic-
 * gate logic unchanged, then (on a genuine resolution) learn a conservative
 * search alias for next time. `originalIdentity` is what the semantic gate
 * and alias-coverage check validate the result against — the thing the user
 * (or, for a recipe ingredient, the recipe page) actually said the food was,
 * independent of whatever the search term itself turned out to be.
 */
// Owner-beta checkpoint (2026-09-13): `no_adapters`/`rate_limited` are
// checked by EACH caller (resolveDynamicFood, resolveDynamicFoodFromIdentity)
// BEFORE it does any of its own AI-call work, never inside this shared core —
// resolveDynamicFood's check must run before its search-intent call (so a
// rate-limited/adapter-less request never wastes that call), and checking
// here too would silently double-consume the rate limiter's budget per call.
async function resolveFromSearchTerm(
  prisma: DynamicPrisma,
  searchTerm: string,
  originalIdentity: string,
  via: "search_intent" | "raw_query" | "normalized_identity",
  deps: ResolveFromSearchTermDeps,
  aliasLocale: string | undefined,
  semanticContext?: { rawIngredient?: string; recipeTitle?: string; recipeContext?: string; preparation?: string; sourceQuantity?: number; sourceUnit?: string }
): Promise<DynamicResolutionOutcome> {
  const outcome: ResolutionOutcome = await resolveAuthoritativeFood(prisma, searchTerm, deps.adapters, {
    locale: deps.foodLocale ?? deps.locale ?? "hu",
    provider: deps.localizationProvider ?? new DisabledCandidateLocalizationProvider()
  }, {
    provider: deps.semanticCandidateGateProvider ?? new DisabledSemanticCandidateGateProvider(),
    originalIdentity,
    canonicalIdentity: searchTerm,
    rawIngredient: semanticContext?.rawIngredient,
    recipeTitle: semanticContext?.recipeTitle,
    recipeContext: semanticContext?.recipeContext,
    preparation: semanticContext?.preparation,
    sourceQuantity: semanticContext?.sourceQuantity,
    sourceUnit: semanticContext?.sourceUnit,
    locale: deps.foodLocale ?? deps.locale
  });
  switch (outcome.status) {
    case "resolved_local":
    case "resolved_external": {
      // P0 semantic identity safety checkpoint (2026-09-16): resolveAuthoritativeFood's
      // "resolved_local" branch (a genuinely trusted LOCAL match) never
      // invokes the semantic-candidate-gate at all — that gate only ever ran
      // for freshly-fetched EXTERNAL candidates. Without this check, a
      // dynamic_search alias would keep memorializing/reusing whatever the
      // local short-circuit found, right or wrong, forever. Only runs once,
      // right here, for a genuinely new (or previously-demoted) resolution —
      // never on an already-fully-trusted repeat query, which short-circuits
      // in interpretOne's own local search and never reaches this function.
      const semanticVerdict = await computeAliasSemanticVerdict(
        deps.semanticCandidateGateProvider, originalIdentity, outcome.food, aliasLocale, semanticContext
      );
      await learnSearchAlias(prisma, outcome.food, originalIdentity, aliasLocale, semanticVerdict);
      logDynamicResolutionOutcome("resolved", via);
      return { status: "resolved", food: outcome.food, via };
    }
    case "confirmation_required":
      logDynamicResolutionOutcome("confirmation_required", via, outcome.reason);
      return { status: "confirmation_required", candidates: outcome.candidates, reason: outcome.reason };
    case "unresolved": {
      // DATABASE MISS -> AUTHORITATIVE EXTERNAL EVIDENCE FALLBACK
      // (2026-09-16): only attempted for a GENUINE exhaustion ("not_found":
      // nothing local/USDA/OFF matched at all; "external_unavailable": no
      // adapters configured at all) — never for "invalid_external_data",
      // which means a candidate DID exist but failed structural validation
      // (a data-quality problem the web fallback cannot safely second-guess
      // by design). Phase 24's regression requirement (external fallback
      // must never run for an already-resolved food) holds by construction:
      // this branch is unreachable unless resolveAuthoritativeFood itself
      // already returned "unresolved" above.
      if (outcome.reason === "not_found" || outcome.reason === "external_unavailable") {
        // Part O / cost efficiency (2026-09-16 live-staging finding): checked
        // FIRST, before web-evidence discovery is ever attempted — a repeat
        // query for a food this exact user already has a private Food for
        // (from an earlier accepted estimate or manual entry) must reuse it
        // immediately, not re-run a real Tavily search + page fetch every
        // time only to discard the result once the AI-estimation tier's own
        // reuse check finally ran. Only ever this user's own createdById
        // scope (see findUserPrivateFood's own doc for why that is safe).
        if (deps.aiEstimation) {
          const existingPrivate = await findUserPrivateFood(prisma, deps.userId, normalizeSearch(originalIdentity));
          if (existingPrivate) {
            logDynamicResolutionOutcome("resolved", via);
            return { status: "resolved", food: existingPrivate, via };
          }
        }
        if (deps.webEvidenceFallback) {
          const fallback = await timeStage("web_evidence_fallback", () => attemptWebEvidenceFallback(searchTerm, originalIdentity, {
            ...deps.webEvidenceFallback!,
            semanticGateProvider: deps.semanticCandidateGateProvider ?? new DisabledSemanticCandidateGateProvider(),
            userId: deps.userId,
            locale: deps.foodLocale ?? deps.locale
          }));
          if (fallback) {
            const food = await persistWebEvidenceFood(prisma as any, fallback.evidence);
            // Reuses the EXACT same write-path safety net PR #54 built for
            // every other dynamic resolution: a fresh semantic-gate verdict
            // decides the learned alias's confidence (0.95 validated / 0.7
            // unknown), and the existing DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD
            // (food-search.ts) governs whether a repeat query ever short-
            // circuits back to this Food without re-verifying. No new
            // alias-trust code was written for this checkpoint.
            const semanticVerdict = await computeAliasSemanticVerdict(deps.semanticCandidateGateProvider, originalIdentity, food, aliasLocale, semanticContext);
            await learnSearchAlias(prisma, food, originalIdentity, aliasLocale, semanticVerdict);
            logDynamicResolutionOutcome("resolved", via);
            return { status: "resolved", food, via };
          }
        }
        // FINAL FALLBACK: AI-ESTIMATED NUTRITION (2026-09-16). Web evidence
        // (if configured) ALSO genuinely found nothing — independently gated
        // on its OWN dep, not nested inside webEvidenceFallback's presence,
        // so a deployment can enable AI estimation even when web-evidence
        // discovery itself is unavailable (e.g. no WEB_SEARCH_PROVIDER). The
        // existing-private-Food reuse check already ran at the very top of
        // this block (before web-evidence was even attempted) — reaching
        // here means this user genuinely has no private Food for this
        // identity yet, so a fresh estimate is the only remaining option.
        if (deps.aiEstimation) {
          if (deps.aiEstimation.rateLimiter.consume(deps.userId)) {
            // Defensive: ChatAiNutritionEstimationProvider already fails
            // closed (catches internally, returns null) — this extra guard
            // is only for a misbehaving THIRD-PARTY provider implementation
            // that violates that contract; Part T explicitly requires this
            // path can never crash the request no matter what a provider does.
            let estimate = null;
            try { estimate = await timeStage("ai_nutrition_estimation", () => deps.aiEstimation!.provider.estimate({ requestedIdentity: originalIdentity, canonicalIdentity: searchTerm, locale: deps.foodLocale ?? deps.locale })); }
            catch { estimate = null; }
            if (estimate) {
              logDynamicResolutionOutcome("ai_estimate_pending", via);
              return { status: "ai_estimate_pending", estimate, requestedIdentity: originalIdentity, canonicalIdentity: searchTerm };
            }
          }
        }
      }
      logDynamicResolutionOutcome("unresolved", via, outcome.reason);
      return { status: "unresolved", reason: outcome.reason };
    }
  }
}

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
  deps: ResolveFromSearchTermDeps & { searchIntentProvider: SearchIntentProvider }
): Promise<DynamicResolutionOutcome> {
  if (!deps.adapters.length) { logDynamicResolutionOutcome("unresolved", undefined, "no_adapters"); return { status: "unresolved", reason: "no_adapters" }; }
  if (!deps.rateLimiter.consume(deps.userId)) { logDynamicResolutionOutcome("unresolved", undefined, "rate_limited"); return { status: "unresolved", reason: "rate_limited" }; }

  const intent = await timeStage("search_intent_ai", () => deps.searchIntentProvider.generate({ foodQuery: input.foodQuery, preparation: input.preparation, foodLocale: deps.foodLocale }));
  const searchTerm = intent?.searchTerms[0]?.trim() || input.foodQuery;
  const via: "search_intent" | "raw_query" = intent?.searchTerms[0]?.trim() ? "search_intent" : "raw_query";
  return resolveFromSearchTerm(prisma, searchTerm, input.foodQuery, via, deps, aliasLocaleFor(deps, intent?.sourceLanguage));
}

/**
 * Owner-beta checkpoint (2026-09-13): the ingredient-resolution forensic
 * trace proved the isolated per-ingredient search_intent call is unreliable
 * on unfamiliar/regional terms in isolation (a reproduced live failure:
 * "marhalábszár" hallucinated as "apricot") — when a WHOLE-RECIPE-CONTEXT
 * batch normalization (recipe-ingredient-normalization.ts) has already
 * produced a clean canonical identity, re-running search_intent on it would
 * both waste a call AND reintroduce exactly the isolated-context risk this
 * variant exists to avoid. This is identical to resolveDynamicFood in every
 * other respect (same rate limiting, same resolveAuthoritativeFood trust
 * chain, same semantic gate, same alias learning) — it only skips the
 * search-intent step because a good search term is already in hand.
 */
export async function resolveDynamicFoodFromIdentity(
  prisma: DynamicPrisma,
  input: { canonicalIdentity: string; originalIdentity: string; rawIngredient?: string; recipeTitle?: string; recipeContext?: string; preparation?: string; sourceQuantity?: number; sourceUnit?: string; sourceLanguage?: string },
  deps: ResolveFromSearchTermDeps
): Promise<DynamicResolutionOutcome> {
  if (!deps.adapters.length) { logDynamicResolutionOutcome("unresolved", undefined, "no_adapters"); return { status: "unresolved", reason: "no_adapters" }; }
  if (!deps.rateLimiter.consume(deps.userId)) { logDynamicResolutionOutcome("unresolved", undefined, "rate_limited"); return { status: "unresolved", reason: "rate_limited" }; }
  return resolveFromSearchTerm(prisma, input.canonicalIdentity, input.originalIdentity, "normalized_identity", deps, aliasLocaleFor(deps, input.sourceLanguage), {
    rawIngredient: input.rawIngredient,
    recipeTitle: input.recipeTitle,
    recipeContext: input.recipeContext,
    preparation: input.preparation,
    sourceQuantity: input.sourceQuantity,
    sourceUnit: input.sourceUnit
  });
}
