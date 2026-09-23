import {
  validateExternalCandidate, isRelevantExternalCandidate, collapseEquivalentCandidates, preferReferenceSourceSurvivors, findDuplicate, persistCandidate,
  decideSurvivorAcceptance, type ExternalFoodCandidate, type StructuredFoodLookupAdapter, type ResolutionPrisma
} from "./external-food.js";
import { learnSearchAlias } from "./dynamic-food-resolution.js";
import { localizeCandidateNames, type CandidateLocalizationProvider, type LocalizationLocale } from "./candidate-localization.js";
import { checkRelevanceBatchWithRetry, type RecipeSemanticGateProvider, type BatchGateIngredientInput } from "./semantic-candidate-gate-batch.js";
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

export type PendingAuthoritativeResolution = {
  id: string;
  canonicalIdentity: string;
  originalIdentity: string;
  rawIngredient?: string;
  preparation?: string;
  sourceQuantity?: number;
  sourceUnit?: string;
};

export type BatchAuthoritativeOutcome =
  | { status: "resolved"; food: any }
  | { status: "confirmation_required"; candidates: ExternalFoodCandidate[]; reason: "ambiguous" | "possible_duplicate" | "weak_match" }
  | { status: "unresolved"; reason: "not_found" | "invalid_external_data" | "external_unavailable" | "no_adapters" | "rate_limited" };

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
  if (!withCandidates.length) return outcomes;

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

    const duplicate = await findDuplicate(prisma, survivors[0]);
    if (duplicate) {
      if (duplicate.source === survivors[0].source && duplicate.sourceId === survivors[0].sourceId) {
        outcomes.set(p.id, { status: "resolved", food: duplicate });
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
  if (!decisions.length) return outcomes;

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
  return outcomes;
}
