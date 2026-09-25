import {
  validateExternalCandidate, isRelevantExternalCandidate, collapseEquivalentCandidates, preferReferenceSourceSurvivors, findDuplicate, persistCandidate,
  decideSurvivorAcceptance, type ExternalFoodCandidate, type StructuredFoodLookupAdapter, type ResolutionPrisma
} from "./external-food.js";
import { learnSearchAlias, resolveFoodConcept, type ResolveFromSearchTermDeps } from "./dynamic-food-resolution.js";
import { hasIdentityCoverage, hasSemanticCoverage } from "./food-search.js";
import { normalizeSearch } from "./normalize.js";
import { localizeCandidateNames, type CandidateLocalizationProvider, type LocalizationLocale } from "./candidate-localization.js";
import { checkRelevanceBatchWithRetry, type RecipeSemanticGateProvider, type BatchGateIngredientInput } from "./semantic-candidate-gate-batch.js";
import { DisabledSemanticCandidateGateProvider, type SemanticCandidateGateProvider } from "./semantic-candidate-gate.js";
import type { SemanticRecoveryProvider } from "./semantic-recovery.js";
import type { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";
import { mapWithConcurrency, DEFAULT_CONCURRENCY } from "../request-performance.js";
import type { FoodLocale } from "./food-locale.js";

/**
 * Owner-beta checkpoint (2026-09-15): cold-path performance. Batches
 * authoritative resolution for MANY ingredients from the SAME recipe into a
 * small, bounded number of AI round-trips instead of one search_intent-free
 * dynamic resolution PER INGREDIENT (each of which — see
 * dynamic-food-resolution.ts's resolveDynamicFoodFromIdentity — makes its
 * own separate semantic_candidate_gate call and its own separate
 * candidate_localization call today). This file is a SEPARATE, additive
 * orchestration layer: resolveDynamicFood/resolveDynamicFoodFromIdentity/
 * resolveAuthoritativeFood in dynamic-food-resolution.ts and external-food.ts
 * are completely UNCHANGED and still used, unmodified, by interpretOne's
 * plain (non-recipe) per-item path, which only ever resolves ONE food at a
 * time and has nothing to gain from batching. Only resolveRecipeIngredientsBatch
 * (which genuinely has many ingredients to resolve at once) uses this.
 *
 * Every trust decision below is the IDENTICAL rule already accepted in
 * resolveAuthoritativeFood — same relevance filter, same
 * collapseEquivalentCandidates, same findDuplicate check, same "exactly one
 * same_identity+compatible survivor auto-resolves, 2+ is ambiguous, 0 is
 * unresolved" logic — just fed a BATCHED gate result across many ingredients
 * instead of calling the gate once per ingredient. This duplicates roughly
 * that decision logic rather than deeply refactoring the single-ingredient
 * function (high blast radius, ~150 existing tests) — kept in sync
 * deliberately and proven equivalent by this file's own dedicated tests.
 */

// Independent external USDA lookups may run concurrently, but never
// unboundedly — same DEFAULT_CONCURRENCY window already used for AI/external
// fan-out elsewhere in this codebase (meal-input/interpret.ts), chosen to get
// the latency benefit of overlap without risking a provider rate-limit burst.
const SEARCH_CONCURRENCY = DEFAULT_CONCURRENCY;
// Confirmation_required candidates shown to the user — same cap
// resolveAuthoritativeFood already uses (candidates.slice(0, 5)).
const CONFIRMATION_CANDIDATE_LIMIT = 5;
// localizeCandidateNames' own schema caps a single call at 10 items
// (candidate-localization.ts) — chunk the whole recipe's accumulated
// candidates into groups of that size rather than widening that file's
// contract, which has its own dedicated, unmodified test coverage.
const LOCALIZATION_CHUNK_SIZE = 10;
// COST SAFETY (2026-09-23): semantic recovery is an LLM call PER unresolved
// concept it runs for — a 10-ingredient prepared-dish recipe where every
// ingredient happens to miss must never trigger 10 recovery calls. Hard cap,
// independent of recipe size: at most this many of the recipe's UNRESOLVED
// concepts get a recovery attempt per resolveManyAuthoritativeFoods call;
// the rest keep their deterministic outcome (not_found/ambiguous/etc.)
// unchanged, exactly as before this feature existed. A practical beta value:
// most real recipes have 0-2 genuinely unresolvable ingredients (BLS/USDA
// coverage is already broad), so this ceiling is rarely hit in practice
// while still bounding the pathological worst case explicitly.
const MAX_BATCH_RECOVERY_ITEMS = 3;

export type PendingAuthoritativeResolution = {
  id: string;
  canonicalIdentity: string;
  originalIdentity: string;
  // The ingredient as the recipe/user actually wrote it, in their language
  // (e.g. "tejföl"), when known. Used for the round-trip check below.
  sourceIdentity?: string;
  rawIngredient?: string;
  preparation?: string;
  sourceQuantity?: number;
  sourceUnit?: string;
};

export type BatchAuthoritativeOutcome =
  | { status: "resolved"; food: any }
  | { status: "confirmation_required"; candidates: ExternalFoodCandidate[]; reason: "ambiguous" | "possible_duplicate" | "weak_match" }
  // "convergence_rejected" (2026-09-23, unified food-resolution engine):
  // mirrors dynamic-food-resolution.ts's own convergence gate — a candidate
  // the batch semantic gate approved against the NORMALIZED canonicalIdentity
  // (e.g. a whole-recipe-context-normalized ingredient term) is independently
  // re-checked against the ingredient's TRUE originalIdentity before being
  // trusted. Evidentially equivalent to "not_found" for the identity actually
  // being resolved — see resolveManyAuthoritativeFoods's own doc.
  | { status: "unresolved"; reason: "not_found" | "invalid_external_data" | "external_unavailable" | "no_adapters" | "rate_limited" | "convergence_rejected" };

export type BatchAuthoritativeDeps = {
  adapters: readonly StructuredFoodLookupAdapter[];
  rateLimiter: DynamicFoodResolutionRateLimiter;
  userId: string;
  locale?: string;
  foodLocale?: FoodLocale;
  localizationProvider?: CandidateLocalizationProvider;
  semanticGateProvider: RecipeSemanticGateProvider;
  recipeTitle?: string;
  recipeContext?: string;
  // Bounded semantic recovery (2026-09-23, unified food-resolution engine):
  // both optional — a caller that doesn't wire them degrades to the
  // pre-existing (pre-recovery) behavior, byte-for-byte unchanged. When
  // present, reuses the SAME shared engine (resolveFoodConcept,
  // dynamic-food-resolution.ts) the single-item path uses — never a second,
  // independently-implemented recovery policy. semanticCandidateGateProvider
  // here is the single-item-shaped gate (not the batch gate above), needed
  // only for the few individual recovery retries below; a real deployment
  // wires the SAME instance already used by the single-item path.
  semanticCandidateGateProvider?: SemanticCandidateGateProvider;
  semanticRecoveryProvider?: SemanticRecoveryProvider;
};

async function localizeInChunks(provider: CandidateLocalizationProvider, candidates: readonly ExternalFoodCandidate[], locale: LocalizationLocale): Promise<ExternalFoodCandidate[]> {
  if (!candidates.length) return [];
  const out: ExternalFoodCandidate[] = [];
  for (let i = 0; i < candidates.length; i += LOCALIZATION_CHUNK_SIZE) {
    out.push(...await localizeCandidateNames(provider, candidates.slice(i, i + LOCALIZATION_CHUNK_SIZE) as ExternalFoodCandidate[], locale));
  }
  return out;
}

/**
 * Resolves many ingredients' authoritative identity at once. Search itself
 * (bounded-concurrency, no AI) still happens per ingredient — only semantic
 * review and localization are accumulated into a small number of recipe-wide
 * batch calls. Returns a Map keyed by the caller-supplied `id`; every pending
 * item gets an entry (never silently dropped).
 */
export async function resolveManyAuthoritativeFoods(
  prisma: ResolutionPrisma,
  pending: readonly PendingAuthoritativeResolution[],
  deps: BatchAuthoritativeDeps
): Promise<Map<string, BatchAuthoritativeOutcome>> {
  const outcomes = new Map<string, BatchAuthoritativeOutcome>();
  if (!pending.length) return outcomes;
  if (!deps.adapters.length) {
    for (const p of pending) outcomes.set(p.id, { status: "unresolved", reason: "no_adapters" });
    return outcomes;
  }

  // Same rate-limit contract as the single-ingredient path: one unit
  // consumed per ingredient resolution ATTEMPT, checked up front so an
  // exhausted budget never wastes a search/AI call.
  const allowed: PendingAuthoritativeResolution[] = [];
  for (const p of pending) {
    if (deps.rateLimiter.consume(deps.userId)) allowed.push(p);
    else outcomes.set(p.id, { status: "unresolved", reason: "rate_limited" });
  }
  if (!allowed.length) return outcomes;

  // STEP 1 — deterministic, no AI: bounded-concurrency external search +
  // structural validation + relevance filter, exactly resolveAuthoritativeFood's
  // own pre-gate logic, just run for many ingredients at once.
  type Searched = { pending: PendingAuthoritativeResolution; candidates: ExternalFoodCandidate[] };
  const searched = await mapWithConcurrency(allowed, SEARCH_CONCURRENCY, async (p): Promise<Searched> => {
    const raw: unknown[] = [];
    let successfulProviders = 0;
    let failedProviders = 0;
    for (const adapter of deps.adapters) {
      try {
        const result = await adapter.lookup(p.canonicalIdentity);
        successfulProviders += 1;
        raw.push(...result.slice(0, 20));
      } catch { failedProviders += 1; /* try the next adapter */ }
    }
    if (!raw.length) {
      outcomes.set(p.id, { status: "unresolved", reason: successfulProviders > 0 && failedProviders === 0 ? "not_found" : "external_unavailable" });
      return { pending: p, candidates: [] };
    }
    const structurallyValid = raw.map(validateExternalCandidate).filter((c): c is ExternalFoodCandidate => Boolean(c));
    if (!structurallyValid.length) {
      outcomes.set(p.id, { status: "unresolved", reason: "invalid_external_data" });
      return { pending: p, candidates: [] };
    }
    const relevant = structurallyValid
      .filter((c) => isRelevantExternalCandidate(p.canonicalIdentity, c.normalizedName))
      .sort((a, b) => b.confidence - a.confidence);
    if (!relevant.length) {
      outcomes.set(p.id, { status: "unresolved", reason: "not_found" });
      return { pending: p, candidates: [] };
    }
    // Same reviewed-candidate window the single-ingredient gate already uses.
    return { pending: p, candidates: relevant.slice(0, 20) };
  });
  const withCandidates = searched.filter((s) => s.candidates.length);
  if (withCandidates.length) {
    // STEP 2 — ONE (or a small bounded number of) batch semantic-gate call(s)
    // covering every surviving candidate for every ingredient at once.
    const gateIngredients: BatchGateIngredientInput[] = withCandidates.map((s, ingredientIndex) => ({
      index: ingredientIndex, identity: s.pending.canonicalIdentity, rawIngredient: s.pending.rawIngredient,
      preparation: s.pending.preparation, sourceQuantity: s.pending.sourceQuantity, sourceUnit: s.pending.sourceUnit,
      candidates: s.candidates.map((c, candidateIndex) => ({ index: candidateIndex, authoritativeName: c.originalName || c.name }))
    }));
    const gateResults = await checkRelevanceBatchWithRetry(deps.semanticGateProvider, {
      recipeTitle: deps.recipeTitle, recipeContext: deps.recipeContext, locale: deps.foodLocale ?? deps.locale, ingredients: gateIngredients
    });

    // STEP 3 — per-ingredient decision from the batched gate verdicts. Byte-
    // for-byte the same rule as resolveAuthoritativeFood's own post-gate logic:
    // exactly one same_identity+compatible survivor (preferring any marked
    // best_match) auto-resolves; 2+ survivors is genuine ambiguity; 0 is
    // unresolved. An absent verdict (omitted/hallucinated/malformed pair) is
    // NEVER treated as approval — fail-closed, identical to the single gate.
    type Decision = { pending: PendingAuthoritativeResolution; toPersist?: ExternalFoodCandidate; toShow?: ExternalFoodCandidate[]; reason?: "ambiguous" | "possible_duplicate" | "weak_match" };
    const decisions: Decision[] = [];
    for (let ingredientIndex = 0; ingredientIndex < withCandidates.length; ingredientIndex++) {
      const { pending: p, candidates } = withCandidates[ingredientIndex];
      const verdictOf = (candidateIndex: number) => gateResults.get(`${ingredientIndex}:${candidateIndex}`);
      const approved = candidates.filter((_, ci) => { const v = verdictOf(ci); return v?.relationship === "same_identity" && v.formCompatibility === "compatible"; });
      const best = candidates.filter((_, ci) => { const v = verdictOf(ci); return v?.relationship === "same_identity" && v.formCompatibility === "compatible" && v.contextualFit === "best_match"; });
      const referenceApproved = preferReferenceSourceSurvivors(approved);
      const referenceBest = best.filter((c) => referenceApproved.includes(c));
      let survivors = referenceBest.length ? referenceBest : referenceApproved;
      if (!survivors.length) { outcomes.set(p.id, { status: "unresolved", reason: "not_found" }); continue; }
      survivors = collapseEquivalentCandidates(survivors);

      // Convergence gate (2026-09-23, unified food-resolution engine): the
      // batch semantic gate above approved survivors[0] against
      // p.canonicalIdentity — a whole-recipe-context NORMALIZED term, not
      // necessarily what the recipe/user actually wrote. Independently
      // re-verify against p.originalIdentity before trusting it any further,
      // exactly like dynamic-food-resolution.ts's own convergence gate does
      // for the single-item path (same hasIdentityCoverage helper, same
      // "discard, never leaked, never aliased" treatment on rejection).
      if (!hasIdentityCoverage(normalizeSearch(p.originalIdentity), survivors[0])) {
        outcomes.set(p.id, { status: "unresolved", reason: "convergence_rejected" });
        continue;
      }

      const duplicate = await findDuplicate(prisma, survivors[0]);
      if (duplicate) {
        const sameSource = duplicate.source === survivors[0].source && duplicate.sourceId === survivors[0].sourceId;
        if (sameSource && survivors[0].autoAcceptEligible) {
          outcomes.set(p.id, { status: "resolved", food: duplicate });
        } else if (sameSource) {
          // Review-only evidence (OFF name search) never auto-resolves via an
          // earlier persisted copy — same rule as the non-duplicate branch below.
          decisions.push({ pending: p, toShow: survivors.slice(0, CONFIRMATION_CANDIDATE_LIMIT), reason: survivors.length === 1 ? "weak_match" : "ambiguous" });
        } else {
          decisions.push({ pending: p, toShow: survivors.slice(0, CONFIRMATION_CANDIDATE_LIMIT), reason: "possible_duplicate" });
        }
        continue;
      }
      // Unified food-resolution engine (2026-09-23): decideSurvivorAcceptance
      // is the exact SAME shared function resolveAuthoritativeFood's own
      // equivalent branch calls (external-food.ts) — not reimplemented, not
      // merely mirrored. Being the sole gate-approved survivor is semantic
      // PLAUSIBILITY, not authorization: an OpenFoodFacts name-search hit
      // (autoAcceptEligible: false) must still fall through to
      // confirmation_required even when nothing else competes with it — never
      // auto-persisted, and therefore never reaching the `learnSearchAlias`
      // call a few lines below either (both live inside the same `toPersist`
      // branch). A reference-source candidate (USDA; autoAcceptEligible: true)
      // continues to auto-resolve exactly as before, exact-name or not.
      const acceptance = decideSurvivorAcceptance(survivors);
      if ("persist" in acceptance) decisions.push({ pending: p, toPersist: acceptance.persist });
      else decisions.push({ pending: p, toShow: acceptance.review.slice(0, CONFIRMATION_CANDIDATE_LIMIT), reason: acceptance.reason });
    }

    if (decisions.length) {
      // STEP 4 — ONE accumulated, chunked localization pass across every
      // candidate that will actually be persisted or shown (never the full raw
      // candidate set — rejected candidates were already dropped in step 3,
      // exactly like resolveAuthoritativeFood's own existing order).
      const toLocalize: ExternalFoodCandidate[] = [];
      for (const d of decisions) { if (d.toPersist) toLocalize.push(d.toPersist); if (d.toShow) toLocalize.push(...d.toShow); }
      const targetLocale: LocalizationLocale = deps.foodLocale ?? (deps.locale as LocalizationLocale) ?? "hu";
      const localized = deps.localizationProvider && toLocalize.length
        ? await localizeInChunks(deps.localizationProvider, toLocalize, targetLocale)
        : toLocalize;

      let cursor = 0;
      for (const d of decisions) {
        if (d.toPersist) {
          const localizedCandidate = localized[cursor] ?? d.toPersist;
          cursor += 1;
          try {
            const food = await persistCandidate(prisma, localizedCandidate);
            outcomes.set(d.pending.id, { status: "resolved", food });
            await learnSearchAlias(prisma, food, d.pending.originalIdentity, deps.foodLocale ?? deps.locale);
          } catch (error: any) {
            if (error?.code === "P2002") {
              const raced = await findDuplicate(prisma, localizedCandidate);
              if (raced) { outcomes.set(d.pending.id, { status: "resolved", food: raced }); continue; }
            }
            throw error;
          }
        } else if (d.toShow) {
          const localizedShown = localized.slice(cursor, cursor + d.toShow.length);
          cursor += d.toShow.length;
          outcomes.set(d.pending.id, { status: "confirmation_required", candidates: localizedShown.length ? localizedShown : d.toShow, reason: d.reason! });
        }
      }
    }
  } // end: if (withCandidates.length) — STEPS 2-4

  // STEP 5 — bounded semantic recovery (2026-09-23, unified food-resolution
  // engine). Only reached for concepts the fully-deterministic steps above
  // could not resolve at all (a genuine miss or a rejected convergence
  // check) — an already-ambiguous or already-resolved outcome is never
  // reopened here. Reuses the EXACT SAME shared engine the single-item path
  // uses (resolveFoodConcept) — never a second recovery policy — so a
  // recipe ingredient gets the identical evidence/authority treatment a
  // directly-typed identical word would. Hard-capped at
  // MAX_BATCH_RECOVERY_ITEMS regardless of how many ingredients missed.
  if (deps.semanticRecoveryProvider) {
    const recoverable = pending.filter((p) => {
      const outcome = outcomes.get(p.id);
      return outcome?.status === "unresolved"
        && (outcome.reason === "not_found" || outcome.reason === "invalid_external_data" || outcome.reason === "external_unavailable" || outcome.reason === "convergence_rejected");
    }).slice(0, MAX_BATCH_RECOVERY_ITEMS);

    for (const p of recoverable) {
      const engineDeps: ResolveFromSearchTermDeps = {
        adapters: deps.adapters, rateLimiter: deps.rateLimiter, userId: deps.userId, locale: deps.locale as any, foodLocale: deps.foodLocale,
        localizationProvider: deps.localizationProvider,
        semanticCandidateGateProvider: deps.semanticCandidateGateProvider ?? new DisabledSemanticCandidateGateProvider(),
        semanticRecoveryProvider: deps.semanticRecoveryProvider
      };
      const semanticContext = { rawIngredient: p.rawIngredient, recipeTitle: deps.recipeTitle, recipeContext: deps.recipeContext, preparation: p.preparation, sourceQuantity: p.sourceQuantity, sourceUnit: p.sourceUnit };
      // Known, accepted inefficiency: resolveFoodConcept always retries
      // p.canonicalIdentity itself first (its own contract, matching the
      // single-item path exactly) before trying any recovered term — for an
      // item that reaches this step, that first retry is guaranteed to
      // repeat work STEP 1 already did. This is one extra DETERMINISTIC
      // external lookup (not an LLM call, no added cost budget), bounded to
      // at most MAX_BATCH_RECOVERY_ITEMS occurrences total — accepted in
      // exchange for reusing the shared engine completely unmodified rather
      // than adding a "skip the first attempt" special case for batch callers.
      const attempt = await resolveFoodConcept(prisma, p.canonicalIdentity, p.originalIdentity, engineDeps, deps.foodLocale ?? deps.locale, semanticContext);
      if (attempt.status === "resolved") outcomes.set(p.id, { status: "resolved", food: attempt.food });
      else if (attempt.status === "confirmation_required") outcomes.set(p.id, { status: "confirmation_required", candidates: attempt.candidates.slice(0, CONFIRMATION_CANDIDATE_LIMIT), reason: attempt.reason });
      // else: still unresolved after recovery — the deterministic-pass
      // outcome already set above stands unchanged.
    }
  }

  // STEP 6 — round-trip identity check (owner report, 2026-09-25: "tejföl"
  // was searched as "sour cream" and two CHEESES were offered). Everything
  // above judged candidates against the English canonical term only. Before
  // a candidate list reaches the user, its name in the user's language must
  // still name what they actually wrote; anything else is dropped. When no
  // candidate survives, the ingredient is treated as not found, so the
  // caller's normal fallback (web evidence / AI estimate) runs instead.
  const verifyLocale: LocalizationLocale = deps.foodLocale ?? (deps.locale as LocalizationLocale) ?? "hu";
  for (const p of pending) {
    const outcome = outcomes.get(p.id);
    if (outcome?.status !== "confirmation_required" || !p.sourceIdentity) continue;
    const kept = outcome.candidates.filter((candidate) => roundTripMatches(candidate, p.sourceIdentity!, p.canonicalIdentity, verifyLocale));
    if (kept.length === outcome.candidates.length) continue;
    console.log(`round_trip_identity dropped=${outcome.candidates.length - kept.length} kept=${kept.length}`);
    outcomes.set(p.id, kept.length ? { ...outcome, candidates: kept } : { status: "unresolved", reason: "not_found" });
  }

  return outcomes;
}

/**
 * True when a candidate shown for `sourceIdentity` (the user's own word)
 * still means that word once named in the user's language. Candidates are
 * localized in STEP 4; a candidate with no localized name can only pass on
 * the forward check (its authoritative name covers the canonical term), and
 * an English-locale user is checked against the source word directly.
 */
export function roundTripMatches(candidate: ExternalFoodCandidate, sourceIdentity: string, canonicalIdentity: string, locale: string): boolean {
  const source = normalizeSearch(sourceIdentity);
  if (!source) return true;
  const localizedName = (candidate.names as Record<string, string> | undefined)?.[locale];
  if (localizedName) return namesSameFood(source, normalizeSearch(localizedName));
  if (locale === "en") return namesSameFood(source, normalizeSearch(candidate.originalName || candidate.name));
  return hasSemanticCoverage(normalizeSearch(canonicalIdentity), [normalizeSearch(candidate.originalName || candidate.name)]);
}

// Either the localized name contains the user's word ("tejföl" in "Tejföl,
// 20 %"), or the user's compound word contains a substantial token of the
// localized name ("hagyma" in "vöröshagyma"). Tokens under 5 letters never
// count on the reverse side, so "tej" (milk) cannot stand in for "tejföl".
function namesSameFood(source: string, localized: string): boolean {
  if (hasSemanticCoverage(source, [localized])) return true;
  const sourceWords = source.split(" ").filter(Boolean);
  return localized.split(" ").some((token) => token.length >= 5 && sourceWords.some((word) => word.includes(token)));
}
