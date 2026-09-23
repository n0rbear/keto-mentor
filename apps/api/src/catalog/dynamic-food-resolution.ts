import type { PrismaClient } from "@prisma/client";
import type { Locale } from "@keto-mentor/shared";
import { resolveAuthoritativeFood, type ExternalFoodCandidate, type ResolutionOutcome, type StructuredFoodLookupAdapter } from "./external-food.js";
import type { SearchIntentProvider } from "./search-intent.js";
import { DisabledCandidateLocalizationProvider, type CandidateLocalizationProvider } from "./candidate-localization.js";
import type { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";
import { normalizeSearch } from "./normalize.js";
import { hasIdentityCoverage } from "./food-search.js";
import { foodLocaleFor, type FoodLocale } from "./food-locale.js";
import { DisabledSemanticCandidateGateProvider, type SemanticCandidateGateProvider } from "./semantic-candidate-gate.js";
import type { AliasSemanticVerdict } from "./alias-semantic-verdict.js";
import { computeAliasSemanticVerdict } from "./alias-semantic-verdict.js";
import { timeStage } from "../request-performance.js";
import { attemptWebEvidenceFallback, persistWebEvidenceFood, summarizeWebEvidenceOutcome, type WebEvidenceFallbackDeps, type WebEvidenceFallbackDiagnostics, type WebEvidenceOutcomeCategory } from "./web-evidence-fallback.js";
import type { AiEstimationOutcome, AiNutritionEstimate, AiNutritionEstimationProvider } from "./ai-nutrition-estimation.js";
import type { AiEstimateRateLimiter } from "./ai-estimate-rate-limit.js";
import type { SemanticRecovery, SemanticRecoveryProvider } from "./semantic-recovery.js";

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
  if (!hasIdentityCoverage(normalizedAlias, food)) return;
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

// resolutionDiagnostics (2026-09-17, production web-evidence effectiveness
// RCA): the funnel stage BEFORE web-evidence is even considered — what
// search term was actually used, and exactly why resolveAuthoritativeFood
// didn't resolve. Closes a real investigative blind spot found live: a
// production "unresolved" with no webEvidenceDiagnostics at all is
// ambiguous between "web-evidence tried and failed" and "web-evidence was
// never attempted because the authoritative reason wasn't not_found/
// external_unavailable" (e.g. invalid_external_data, or the outer
// rate-limiter/no-adapters guard) — this field always answers which.
// Same non-production-only surfacing rule as webEvidenceDiagnostics (see
// meal-input/interpret.ts's debugWebEvidenceDiagnostics) — purely
// observability, never read by any resolution logic, no secrets/user text
// beyond the search term itself.
export type DynamicResolutionDiagnostics = {
  searchTerm: string;
  via: "search_intent" | "raw_query" | "normalized_identity";
  authoritativeReason?: "not_found" | "invalid_external_data" | "external_unavailable" | "rate_limited" | "no_adapters" | "convergence_rejected";
  rawCandidateCount?: number;
  structurallyValidCount?: number;
  webEvidenceAttempted: boolean;
  candidateFound?: boolean;
  convergenceRejected?: boolean;
  rejectionReason?: "identity_mismatch";
  fallbackIdentity?: string;
  fallbackContinued?: boolean;
  finalOutcome?: "resolved" | "ai_estimate_pending" | "unresolved";
};

export type DynamicResolutionOutcome =
  | { status: "resolved"; food: any; via: "search_intent" | "raw_query" | "normalized_identity"; resolutionDiagnostics?: DynamicResolutionDiagnostics }
  | { status: "confirmation_required"; candidates: ExternalFoodCandidate[]; reason: "ambiguous" | "possible_duplicate" | "weak_match"; resolutionDiagnostics?: DynamicResolutionDiagnostics }
  // webEvidenceDiagnostics (2026-09-16, P0 effectiveness investigation):
  // present only when a web-evidence attempt actually ran — the full funnel
  // trace (search query, candidate domains/tiers, per-candidate fetch/
  // extraction/grounding/identity outcome). Purely observability, never
  // read by any resolution logic; the API layer (meal-input/interpret.ts)
  // only ever surfaces it to a caller outside production.
  //
  // "convergence_rejected" (2026-09-17, convergence-gate fallback-
  // continuation fix): resolveAuthoritativeFood returned a CONFIDENT
  // "resolved" candidate, but it failed this function's own re-verification
  // against the user's literal original identity (see the convergence-gate
  // comment below) — a category resolveAuthoritativeFood itself has no
  // concept of, distinct from all its own "unresolved" reasons. Evidentially
  // equivalent to "not_found" for the identity actually being resolved: the
  // rejected candidate is discarded outright (never leaked into the result,
  // never aliased) and the SAME fallback chain (private-food reuse ->
  // web-evidence -> AI-estimate) is attempted next, exactly as it would be
  // for a genuine miss.
  | { status: "unresolved"; reason: "not_found" | "invalid_external_data" | "external_unavailable" | "rate_limited" | "no_adapters" | "convergence_rejected"; webEvidenceDiagnostics?: WebEvidenceFallbackDiagnostics; resolutionDiagnostics?: DynamicResolutionDiagnostics; decisionTrace?: DecisionTrace }
  // FINAL FALLBACK (2026-09-16): local + authoritative-adapter + web-evidence
  // resolution all genuinely failed, AND the AI estimation provider produced
  // a structurally-plausible estimate. This is NEVER auto-persisted as a
  // Food — see the "ai_estimate_pending" doc on the caller side
  // (meal-input/interpret.ts) for exactly how a user must explicitly accept
  // (or reject in favor of their own values) before anything is written.
  | { status: "ai_estimate_pending"; estimate: AiNutritionEstimate; requestedIdentity: string; canonicalIdentity: string; webEvidenceDiagnostics?: WebEvidenceFallbackDiagnostics; resolutionDiagnostics?: DynamicResolutionDiagnostics; decisionTrace?: DecisionTrace };

// Decision-transparency audit (2026-09-19): a small, CLOSED, always-safe
// summary of the LAST fallback tiers this specific attempt actually ran —
// deliberately separate from webEvidenceDiagnostics/resolutionDiagnostics
// (which stay staging/developer-only, see isProductionDeployment() in
// interpret.ts): this carries only closed outcome CATEGORIES, never a
// domain, URL, search term, or provider message, so it is safe to surface
// to every user in every environment. `undefined` on either field means
// that tier was never even attempted (see each field's own outcome union
// for why) — the caller must never render a missing field as "it failed".
export type DecisionTrace = {
  webEvidenceOutcome?: WebEvidenceOutcomeCategory;
  // "internal_rate_limited" is DISTINCT from AiEstimationOutcome's own
  // "provider_rate_limited": the former means OUR OWN 3-per-15-minute budget
  // refused the call before the provider was ever contacted; the latter
  // means the call reached the provider and the PROVIDER refused it.
  aiEstimationOutcome?: "internal_rate_limited" | AiEstimationOutcome;
};

export type ResolveFromSearchTermDeps = {
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
  // SEMANTIC RECOVERY (2026-09-23): a second-chance search-term generator,
  // tried only when the first search-intent-driven attempt already failed to
  // find or safely converge on authoritative evidence — see
  // attemptSemanticRecovery below and semantic-recovery.ts's own doc.
  // Optional; a caller that doesn't wire it degrades to the pre-existing
  // (pre-recovery) behavior, byte-for-byte unchanged.
  semanticRecoveryProvider?: SemanticRecoveryProvider;
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
// DATABASE MISS -> AUTHORITATIVE EXTERNAL EVIDENCE FALLBACK (2026-09-16,
// widened 2026-09-17 — production effectiveness RCA, twice). Attempted for
// every genuine exhaustion reason: "not_found"/"external_unavailable"
// (unchanged since 2026-09-16); "invalid_external_data" (added 2026-09-17
// morning — re-reviewed what that reason actually means in
// resolveAuthoritativeFood/external-food.ts: it is set ONLY when adapters
// returned raw candidates but EVERY one failed validateExternalCandidate's
// purely STRUCTURAL check, which runs strictly BEFORE the semantic-
// candidate-gate is ever consulted — a genuine identity/security rejection
// instead falls through to "not_found", which was already eligible; a USDA
// branded-food stub missing a fiber field has no bearing on whether
// heinz.com's own product page is trustworthy); and "convergence_rejected"
// (added 2026-09-17 afternoon — a confident "resolved" candidate that this
// function's OWN convergence gate, below, rejected against the user's
// literal phrase is evidentially equivalent to "not_found" for that
// identity: the candidate is discarded, never leaked into the result, and
// the original identity deserves the same chance at an independent source).
// Every downstream safety gate on the web-evidence path itself (SSRF-safe
// fetch, source-tier/domain classification, mechanical grounding, the SAME
// semantic-candidate-gate) is completely unchanged by any of these
// widenings — they only ever decide whether the ATTEMPT is made, never what
// counts as a pass. Phase 24's regression requirement (external fallback
// must never run for an already-resolved food) holds by construction: this
// is only ever called when resolveAuthoritativeFood did NOT produce a
// convergence-verified "resolved" outcome.
export async function attemptFallbackChain(
  prisma: DynamicPrisma,
  searchTerm: string,
  originalIdentity: string,
  via: "search_intent" | "raw_query" | "normalized_identity",
  deps: ResolveFromSearchTermDeps,
  aliasLocale: string | undefined,
  semanticContext: { rawIngredient?: string; recipeTitle?: string; recipeContext?: string; preparation?: string; sourceQuantity?: number; sourceUnit?: string } | undefined,
  reason: "not_found" | "invalid_external_data" | "external_unavailable" | "convergence_rejected",
  candidateCounts: { rawCandidateCount?: number; structurallyValidCount?: number }
): Promise<DynamicResolutionOutcome> {
  const baseDiagnostics = (webEvidenceAttempted: boolean, finalOutcome: DynamicResolutionDiagnostics["finalOutcome"]): DynamicResolutionDiagnostics => ({
    searchTerm, via, webEvidenceAttempted, authoritativeReason: reason,
    rawCandidateCount: candidateCounts.rawCandidateCount, structurallyValidCount: candidateCounts.structurallyValidCount,
    ...(reason === "convergence_rejected" ? {
      candidateFound: true, convergenceRejected: true, rejectionReason: "identity_mismatch" as const,
      fallbackIdentity: originalIdentity, fallbackContinued: true, finalOutcome
    } : {})
  });
  let webEvidenceDiagnostics: WebEvidenceFallbackDiagnostics | undefined;
  let webEvidenceAttempted = false;
  // Part O / cost efficiency (2026-09-16 live-staging finding): checked
  // FIRST, before web-evidence discovery is ever attempted — a repeat query
  // for a food this exact user already has a private Food for (from an
  // earlier accepted estimate or manual entry) must reuse it immediately,
  // not re-run a real Tavily search + page fetch every time only to discard
  // the result once the AI-estimation tier's own reuse check finally ran.
  // Only ever this user's own createdById scope (see findUserPrivateFood's
  // own doc for why that is safe).
  if (deps.aiEstimation) {
    const existingPrivate = await findUserPrivateFood(prisma, deps.userId, normalizeSearch(originalIdentity));
    if (existingPrivate) {
      logDynamicResolutionOutcome("resolved", via);
      return { status: "resolved", food: existingPrivate, via, resolutionDiagnostics: baseDiagnostics(false, "resolved") };
    }
  }
  let webEvidenceOutcome: WebEvidenceOutcomeCategory | undefined;
  if (deps.webEvidenceFallback) {
    webEvidenceAttempted = true;
    const fallback = await timeStage("web_evidence_fallback", () => attemptWebEvidenceFallback(searchTerm, originalIdentity, {
      ...deps.webEvidenceFallback!,
      semanticGateProvider: deps.semanticCandidateGateProvider ?? new DisabledSemanticCandidateGateProvider(),
      userId: deps.userId,
      locale: deps.foodLocale ?? deps.locale,
      onDiagnostics: (d) => { webEvidenceDiagnostics = d; }
    }));
    webEvidenceOutcome = webEvidenceDiagnostics ? summarizeWebEvidenceOutcome(webEvidenceDiagnostics, !!fallback) : undefined;
    if (fallback) {
      const food = await persistWebEvidenceFood(prisma as any, fallback.evidence);
      // Reuses the EXACT same write-path safety net PR #54 built for every
      // other dynamic resolution: a fresh semantic-gate verdict decides the
      // learned alias's confidence (0.95 validated / 0.7 unknown), and the
      // existing DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD (food-search.ts)
      // governs whether a repeat query ever short-circuits back to this
      // Food without re-verifying. No new alias-trust code was written for
      // this checkpoint.
      const semanticVerdict = await computeAliasSemanticVerdict(deps.semanticCandidateGateProvider, originalIdentity, food, aliasLocale, semanticContext);
      await learnSearchAlias(prisma, food, originalIdentity, aliasLocale, semanticVerdict);
      logDynamicResolutionOutcome("resolved", via);
      return { status: "resolved", food, via, resolutionDiagnostics: baseDiagnostics(true, "resolved") };
    }
  }
  // FINAL FALLBACK: AI-ESTIMATED NUTRITION (2026-09-16). Web evidence (if
  // configured) ALSO genuinely found nothing — independently gated on its
  // OWN dep, not nested inside webEvidenceFallback's presence, so a
  // deployment can enable AI estimation even when web-evidence discovery
  // itself is unavailable (e.g. no WEB_SEARCH_PROVIDER). The existing-
  // private-Food reuse check already ran at the very top of this function —
  // reaching here means this user genuinely has no private Food for this
  // identity yet, so a fresh estimate is the only remaining option.
  let aiEstimationOutcome: DecisionTrace["aiEstimationOutcome"];
  if (deps.aiEstimation) {
    if (deps.aiEstimation.rateLimiter.consume(deps.userId)) {
      // Defensive: ChatAiNutritionEstimationProvider already fails closed
      // (catches internally, returns null) — this extra guard is only for a
      // misbehaving THIRD-PARTY provider implementation that violates that
      // contract; Part T explicitly requires this path can never crash the
      // request no matter what a provider does.
      let estimate = null;
      try {
        const provider = deps.aiEstimation!.provider;
        const input = { requestedIdentity: originalIdentity, canonicalIdentity: searchTerm, locale: deps.foodLocale ?? deps.locale };
        if (provider.estimateDetailed) {
          const detailed = await timeStage("ai_nutrition_estimation", () => provider.estimateDetailed!(input));
          estimate = detailed.estimate;
          aiEstimationOutcome = detailed.outcome;
        } else {
          estimate = await timeStage("ai_nutrition_estimation", () => provider.estimate(input));
          aiEstimationOutcome = estimate ? "success" : "provider_error";
        }
      } catch { estimate = null; aiEstimationOutcome = "provider_error"; }
      if (estimate) {
        logDynamicResolutionOutcome("ai_estimate_pending", via);
        return {
          status: "ai_estimate_pending", estimate, requestedIdentity: originalIdentity, canonicalIdentity: searchTerm, webEvidenceDiagnostics,
          resolutionDiagnostics: baseDiagnostics(webEvidenceAttempted, "ai_estimate_pending"),
          decisionTrace: { webEvidenceOutcome, aiEstimationOutcome: "success" }
        };
      }
    } else {
      // Observability (2026-09-19): distinguishes "the estimator call itself
      // failed/returned nothing plausible" from "its own 3-per-15-minute
      // budget was already exhausted and the call was never attempted at
      // all" — previously both silently fell through to the same generic
      // unresolved log below, a real diagnostic blind spot when investigating
      // live reports. Category-only: no user text, food name, user id, or
      // payload.
      console.log("ai_nutrition_estimation outcome=rate_limited");
      aiEstimationOutcome = "internal_rate_limited";
    }
  }
  logDynamicResolutionOutcome("unresolved", via, reason);
  // Omit decisionTrace entirely (not an object with undefined fields) when
  // neither tier was even configured for this caller — keeps a caller that
  // wires neither webEvidenceFallback nor aiEstimation byte-for-byte
  // unchanged, exactly like webEvidenceDiagnostics/resolutionDiagnostics
  // already behave for that same caller shape.
  const decisionTrace = webEvidenceOutcome !== undefined || aiEstimationOutcome !== undefined ? { webEvidenceOutcome, aiEstimationOutcome } : undefined;
  return {
    status: "unresolved", reason, webEvidenceDiagnostics,
    resolutionDiagnostics: baseDiagnostics(webEvidenceAttempted, "unresolved"),
    ...(decisionTrace ? { decisionTrace } : {})
  };
}

// Non-recursing core: run resolveAuthoritativeFood for exactly ONE search
// term and interpret its outcome (convergence gate, alias learning) — never
// itself falls through to attemptFallbackChain (web-evidence/AI-estimate).
// Factored out of resolveFromSearchTerm so the semantic-recovery retry loop
// below can safely try SEVERAL additional terms without either recursing
// into the expensive fallback chain per term or duplicating the convergence-
// gate/alias-learning logic a second time.
export type TermAttempt =
  | { status: "resolved"; food: any }
  | { status: "confirmation_required"; candidates: ExternalFoodCandidate[]; reason: "ambiguous" | "possible_duplicate" | "weak_match" }
  | { status: "unresolved"; reason: "not_found" | "invalid_external_data" | "external_unavailable" | "convergence_rejected"; rawCandidateCount?: number; structurallyValidCount?: number };

async function tryResolveTerm(
  prisma: DynamicPrisma,
  searchTerm: string,
  originalIdentity: string,
  deps: ResolveFromSearchTermDeps,
  aliasLocale: string | undefined,
  semanticContext?: { rawIngredient?: string; recipeTitle?: string; recipeContext?: string; preparation?: string; sourceQuantity?: number; sourceUnit?: string }
): Promise<TermAttempt> {
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
      // Convergence gate (defense-in-depth, owner-beta blocker #3,
      // 2026-09-10; CENTRALIZED here 2026-09-17 — was previously duplicated,
      // inconsistently, in each of interpretOne/interpretDeterministically):
      // a "resolved" outcome here means an UPSTREAM function
      // (resolveAuthoritativeFood) decided this Food was trustworthy — but
      // that decision was made against the AI-translated search TERM, never
      // against what the user (or recipe ingredient) actually said. Search
      // intent is a query generator, not identity evidence: a
      // mistranslation ("tojásleves" -> "tofu soup", or a generic-category
      // translation like "Vegemite" -> "yeast extract") can satisfy every
      // upstream check and still be the wrong food. Re-verify against the
      // ORIGINAL identity before granting full trust — this is also why
      // resolveAuthoritativeFood's "resolved_local" branch (which never
      // invokes the semantic-candidate-gate at all, see its own doc) is safe
      // to trust here: this check is the one place every dynamic outcome
      // (local or external) converges through before becoming "resolved".
      if (!hasIdentityCoverage(normalizeSearch(originalIdentity), outcome.food)) {
        return { status: "unresolved", reason: "convergence_rejected" };
      }
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
      return { status: "resolved", food: outcome.food };
    }
    case "confirmation_required":
      return { status: "confirmation_required", candidates: outcome.candidates, reason: outcome.reason };
    case "unresolved":
      return { status: "unresolved", reason: outcome.reason, rawCandidateCount: outcome.rawCandidateCount, structurallyValidCount: outcome.structurallyValidCount };
  }
}

// Bounded so an LLM that returns its full allowance across both term lists,
// plus one brand/product-derived term, can never blow up into unlimited
// candidate exploration — see semantic-recovery.ts's own schema caps (3 + 3).
const MAX_RECOVERY_TERMS = 5;

function dedupedRecoveryTerms(recovery: SemanticRecovery, alreadyTried: ReadonlySet<string>): string[] {
  const brandTerm = [recovery.brand, recovery.productName, recovery.variant].filter(Boolean).join(" ").trim();
  const candidates = [...recovery.localSearchTerms, ...recovery.referenceSearchTerms, ...(brandTerm ? [brandTerm] : [])];
  const seen = new Set(alreadyTried);
  const result: string[] = [];
  for (const raw of candidates) {
    const term = raw.trim();
    if (!term) continue;
    const key = normalizeSearch(term);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(term);
    if (result.length >= MAX_RECOVERY_TERMS) break;
  }
  return result;
}

/**
 * The recovery tier itself (Part A, 2026-09-23): invoked only when the
 * ordinary search-intent-driven attempt already failed to find, or could not
 * safely trust, authoritative evidence. Retries the SAME resolveAuthoritativeFood
 * path (never a parallel resolver) with LLM-recovered terms — BLS-oriented
 * local concepts and/or better USDA-oriented reference concepts — stopping
 * at the first strong resolution and merging any additional confirmation-
 * required candidates found along the way. An LLM-generated term is never
 * itself evidence: every attempt still goes through the exact same
 * structural validation, relevance filter, semantic-candidate-gate, and
 * convergence-gate as the original term.
 */
async function attemptSemanticRecovery(
  prisma: DynamicPrisma,
  searchTerm: string,
  originalIdentity: string,
  deps: ResolveFromSearchTermDeps,
  aliasLocale: string | undefined,
  semanticContext: { rawIngredient?: string; recipeTitle?: string; recipeContext?: string; preparation?: string; sourceQuantity?: number; sourceUnit?: string } | undefined,
  priorCandidates: readonly ExternalFoodCandidate[]
): Promise<{ resolved: any } | { candidates: ExternalFoodCandidate[] } | { none: true }> {
  if (!deps.semanticRecoveryProvider) return { none: true };
  const recovery = await deps.semanticRecoveryProvider.recover({ foodQuery: originalIdentity, priorSearchTerm: searchTerm, foodLocale: deps.foodLocale });
  if (!recovery) return { none: true };
  const terms = dedupedRecoveryTerms(recovery, new Set([normalizeSearch(searchTerm), normalizeSearch(originalIdentity)]));
  if (!terms.length) return { none: true };

  const mergedCandidates: ExternalFoodCandidate[] = [...priorCandidates];
  for (const term of terms) {
    const attempt = await tryResolveTerm(prisma, term, originalIdentity, deps, aliasLocale, semanticContext);
    console.log(`semantic_recovery_term outcome=${attempt.status}`);
    if (attempt.status === "resolved") {
      // Stopping early here is only safe when nothing else is already known
      // to be ambiguous: resolveAuthoritativeFood persists a confident
      // single-candidate resolution as a side effect, so once real prior
      // ambiguity exists (priorCandidates non-empty), silently returning
      // whichever recovered term happened to resolve first would DISCARD
      // already-known competing candidates the user must still choose
      // between (the exact "Öl -> Sonnenblumenöl only, silently dropping
      // Rapsöl/Olivenöl" failure mode this feature exists to prevent) —
      // safer to leave this one recovered resolution out of the merge and
      // keep showing the user everything already known instead.
      if (!priorCandidates.length) return { resolved: attempt.food };
      continue;
    }
    if (attempt.status === "confirmation_required") {
      for (const candidate of attempt.candidates) {
        if (!mergedCandidates.some((existing) => existing.source === candidate.source && existing.sourceId === candidate.sourceId)) mergedCandidates.push(candidate);
      }
    }
  }
  return mergedCandidates.length ? { candidates: mergedCandidates } : { none: true };
}

/**
 * THE SHARED FOOD-CONCEPT RESOLUTION ENGINE (2026-09-23): answers "what food
 * concept does this ONE identity mean" against local/BLS/USDA/OFF evidence,
 * with LLM semantic recovery as a bounded second chance when the first
 * attempt fails or cannot safely converge. This is the ONE place that
 * policy lives — used by BOTH the single-item path (resolveFromSearchTerm,
 * right below) and the recipe/batch path
 * (dynamic-food-resolution-batch.ts's own bounded recovery step, see its
 * own doc) — never duplicated, never independently reimplemented.
 *
 * Deliberately does NOT include web-evidence/AI-estimate: those remain each
 * caller's own final-fallback decision (the single-item path's
 * attemptFallbackChain below; the recipe path's separate, already-existing
 * per-ingredient AI-estimate/accept flow) — this engine only ever answers
 * whether AUTHORITATIVE evidence resolves the concept, recovery included.
 */
export async function resolveFoodConcept(
  prisma: DynamicPrisma,
  searchTerm: string,
  originalIdentity: string,
  deps: ResolveFromSearchTermDeps,
  aliasLocale: string | undefined,
  semanticContext?: { rawIngredient?: string; recipeTitle?: string; recipeContext?: string; preparation?: string; sourceQuantity?: number; sourceUnit?: string }
): Promise<TermAttempt> {
  const first = await tryResolveTerm(prisma, searchTerm, originalIdentity, deps, aliasLocale, semanticContext);
  if (first.status === "resolved") return first;

  // 2026-09-23 semantic-recovery widening: safe because it can only ever ADD
  // more real, independently-gated candidates to a state that already
  // required explicit user confirmation (the "ambiguous" branch) — it never
  // removes candidates, never auto-picks one. For an outright miss
  // (including a fresh "convergence_rejected"), recovery is tried before
  // giving up, since a recovered term may still find real authoritative
  // evidence the first attempt alone did not.
  const ambiguous = first.status === "confirmation_required" && first.reason === "ambiguous";
  const recoverableMiss = first.status === "unresolved"
    && (first.reason === "not_found" || first.reason === "external_unavailable" || first.reason === "invalid_external_data" || first.reason === "convergence_rejected");
  if (ambiguous || recoverableMiss) {
    const recovery = await attemptSemanticRecovery(prisma, searchTerm, originalIdentity, deps, aliasLocale, semanticContext, ambiguous ? (first as Extract<TermAttempt, { status: "confirmation_required" }>).candidates : []);
    if ("resolved" in recovery) return { status: "resolved", food: recovery.resolved };
    if ("candidates" in recovery) return { status: "confirmation_required", candidates: recovery.candidates, reason: "ambiguous" };
  }
  return first;
}

async function resolveFromSearchTerm(
  prisma: DynamicPrisma,
  searchTerm: string,
  originalIdentity: string,
  via: "search_intent" | "raw_query" | "normalized_identity",
  deps: ResolveFromSearchTermDeps,
  aliasLocale: string | undefined,
  semanticContext?: { rawIngredient?: string; recipeTitle?: string; recipeContext?: string; preparation?: string; sourceQuantity?: number; sourceUnit?: string }
): Promise<DynamicResolutionOutcome> {
  const attempt = await resolveFoodConcept(prisma, searchTerm, originalIdentity, deps, aliasLocale, semanticContext);

  if (attempt.status === "resolved") {
    logDynamicResolutionOutcome("resolved", via);
    return { status: "resolved", food: attempt.food, via };
  }

  if (attempt.status === "confirmation_required") {
    logDynamicResolutionOutcome("confirmation_required", via, attempt.reason);
    return { status: "confirmation_required", candidates: attempt.candidates, reason: attempt.reason, resolutionDiagnostics: { searchTerm, via, webEvidenceAttempted: false } };
  }

  // attempt.status === "unresolved" — the shared engine (including its own
  // bounded recovery attempt) genuinely found nothing. Only NOW does the
  // single-item path spend a web-evidence/AI-estimate attempt — the recipe/
  // batch path has no equivalent tail here by design (see its own doc).
  const first = attempt;
  if (first.reason === "not_found" || first.reason === "external_unavailable" || first.reason === "invalid_external_data" || first.reason === "convergence_rejected") {
    return attemptFallbackChain(prisma, searchTerm, originalIdentity, via, deps, aliasLocale, semanticContext, first.reason, { rawCandidateCount: first.rawCandidateCount, structurallyValidCount: first.structurallyValidCount });
  }
  logDynamicResolutionOutcome("unresolved", via, first.reason);
  return { status: "unresolved", reason: first.reason, resolutionDiagnostics: { searchTerm, via, webEvidenceAttempted: false, authoritativeReason: first.reason, rawCandidateCount: first.rawCandidateCount, structurallyValidCount: first.structurallyValidCount } };
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
