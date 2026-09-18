import type { WebKnowledgeSearchProvider, WebSearchResult } from "../web-knowledge/web-knowledge-search-provider.js";
import type { NutritionEvidenceExtractionProvider } from "./nutrition-evidence-extraction.js";
import { extractJsonLdNutrition, extractVisibleTextNutrition } from "./nutrition-evidence-extraction.js";
import type { SemanticCandidateGateProvider, SemanticCandidateGateStatus } from "./semantic-candidate-gate.js";
import { classifySourceTier, isAuthoritativeTier, validateAndNormalizeEvidence, type EvidenceSourceTier, type NutritionEvidence } from "./nutrition-evidence.js";
import { fetchPublicHtml, type SafeFetcherDependencies } from "../recipes/safe-url-fetcher.js";
import { htmlToSafeText } from "../recipes/recipe-import.js";
import type { PrismaClient } from "@prisma/client";
import { buildSearchText, normalizeSearch } from "./normalize.js";
import { timeStage } from "../request-performance.js";

/**
 * DATABASE MISS -> AUTHORITATIVE EXTERNAL EVIDENCE FALLBACK (2026-09-16).
 *
 * The last-resort stage: when the entire existing pipeline (local catalog,
 * USDA/OFF adapters, semantic gate — see external-food.ts's
 * resolveAuthoritativeFood) has genuinely found nothing, this discovers a
 * real webpage that plausibly has the answer, fetches it SSRF-safely, tries
 * to extract nutrition that is verifiably grounded in that page's own text,
 * validates the food identity against the SAME existing semantic-candidate
 * gate used everywhere else, and only then persists a new Food.
 *
 * Deliberately NOT bolted onto resolveAuthoritativeFood's own
 * StructuredFoodLookupAdapter/validateExternalCandidate path: that path's
 * TRUSTED_SOURCE_HOSTS allowlist is a fixed one-domain-per-source model
 * (USDA -> fdc.nal.usda.gov, OFF -> world.openfoodfacts.org), which is
 * exactly right for a single official adapter but does not fit a general
 * web-evidence source whose domain varies per query — extending it would
 * have meant weakening a currently-strict, narrow security check. This is a
 * parallel, independently-validated pipeline instead, invoked as one new
 * terminal branch in dynamic-food-resolution.ts's resolveFromSearchTerm,
 * only after the existing pipeline is exhausted (see that file).
 */

// Strictly more expensive than plain dynamic resolution (a real search
// credit + up to 3 page fetches + up to 3 LLM extraction calls per attempt)
// so it earns its own, tighter, independent budget — mirrors
// WebKnowledgeSearchRateLimiter's own justification (web-knowledge-rate-limit.ts).
export const WEB_EVIDENCE_FALLBACK_RATE_LIMIT = Object.freeze({ windowMs: 15 * 60 * 1000, limit: 3 });

export class WebEvidenceFallbackRateLimiter {
  private readonly buckets = new Map<string, { startsAt: number; count: number }>();
  constructor(private readonly now: () => number = Date.now) {}
  consume(userId: string) {
    if (!userId) throw new Error("Authenticated user required before web-evidence fallback rate limiting");
    const current = this.now();
    const existing = this.buckets.get(userId);
    const bucket = !existing || current - existing.startsAt >= WEB_EVIDENCE_FALLBACK_RATE_LIMIT.windowMs ? { startsAt: current, count: 0 } : existing;
    if (bucket.count >= WEB_EVIDENCE_FALLBACK_RATE_LIMIT.limit) return false;
    bucket.count += 1;
    this.buckets.set(userId, bucket);
    return true;
  }
}

// Cost bound (Phase 20): at most this many candidate pages are ever fetched
// per attempt, sequentially, stopping at the first one that passes every
// gate — never fetched/extracted in parallel (bounded concurrency = 1 keeps
// this predictable and cheap on the cold path).
export const WEB_EVIDENCE_MAX_CANDIDATE_URLS = 3;

const TIER_RANK: Record<EvidenceSourceTier, number> = { tier_a_official: 0, tier_b_manufacturer: 1, tier_c_institutional: 2, discovery_only: 3 };

export type WebEvidenceFallbackDeps = {
  searchProvider: WebKnowledgeSearchProvider;
  extractionProvider: NutritionEvidenceExtractionProvider;
  semanticGateProvider: SemanticCandidateGateProvider;
  rateLimiter: WebEvidenceFallbackRateLimiter;
  userId: string;
  locale?: string;
  // Test seams only — production always uses the real safe fetcher.
  fetchHtml?: (url: string, deps?: SafeFetcherDependencies) => Promise<{ html: string; finalUrl: string }>;
  // P0 effectiveness-investigation instrumentation (2026-09-16): an optional
  // observer invoked with the FULL funnel diagnostics on every call,
  // success or failure — never gates behavior, never changes what is
  // returned/persisted, purely an observability hook. The public API only
  // ever surfaces this to the caller in non-production environments (see
  // meal-input/interpret.ts) — never "noisy permanent production logging",
  // an explicit opt-in for verification.
  onDiagnostics?: (diagnostics: WebEvidenceFallbackDiagnostics) => void;
};

// Per-candidate funnel record — lets a caller see EXACTLY where each
// individual tier-authoritative URL was lost (fetch/extraction/grounding/
// identity), not just the last-tried candidate's outcome.
export type WebEvidenceCandidateDiagnostic = {
  url: string;
  domain: string;
  tier: EvidenceSourceTier;
  fetch: "ok" | "failed";
  fetchError?: string;
  extractionMethod?: "json_ld" | "html_table" | "llm_grounded";
  extractionVerdict?: "grounded" | "ungrounded" | "no_evidence";
  identityVerdict?: "approved" | "rejected" | "gate_disabled";
  semanticGateAttempted?: boolean;
  semanticGateStatus?: SemanticCandidateGateStatus;
  semanticGateVerdict?: "approved" | "negative" | "unavailable";
  semanticGateReasonCode?: string;
  providerFailureClass?: "schema" | "abort" | "rate_limit" | "request" | "upstream" | "invalid_response" | "transport";
  requestedIdentity?: string;
  sourceFoodName?: string;
};

export type WebEvidenceFallbackDiagnostics = {
  queriesAttempted: string[];
  searchResultCount: number;
  // Domains the search returned but that never even reached the fetch stage
  // because classifySourceTier marked them discovery_only.
  discardedDiscoveryOnlyDomains: string[];
  candidateDomains: string[];
  candidates: WebEvidenceCandidateDiagnostic[];
  fetchFailures: Array<{ url: string; reason: string }>;
  selectedSourceUrl?: string;
  sourceTier?: EvidenceSourceTier;
  identityVerdict?: "approved" | "rejected" | "gate_disabled";
  extractionVerdict?: "grounded" | "ungrounded" | "no_evidence";
  cacheHit: false; // this function is only ever called on a genuine miss — see dynamic-food-resolution.ts
  rejectionReason?: string;
};

// Category-only observability (Phase 21) — no query text, no page text, no
// API keys, no user id; mirrors dynamic-food-resolution.ts's own
// logDynamicResolutionOutcome exactly.
function logWebEvidenceFallbackOutcome(diagnostics: WebEvidenceFallbackDiagnostics, resolved: boolean) {
  console.log(`web_evidence_fallback resolved=${resolved} candidates=${diagnostics.candidateDomains.length} fetchFailures=${diagnostics.fetchFailures.length}${diagnostics.sourceTier ? ` tier=${diagnostics.sourceTier}` : ""}${diagnostics.identityVerdict ? ` identity=${diagnostics.identityVerdict}` : ""}${diagnostics.extractionVerdict ? ` extraction=${diagnostics.extractionVerdict}` : ""}${diagnostics.rejectionReason ? ` reason=${diagnostics.rejectionReason}` : ""}`);
}

function sourceFoodNameFromHtml(html: string, fallback: string): string {
  const documentTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1];
  if (documentTitle) {
    const text = htmlToSafeText(documentTitle).trim();
    if (text && text.length <= 200) return text;
  }
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/iu)?.[1];
  if (!heading) return fallback;
  const text = htmlToSafeText(heading).trim();
  return text && text.length <= 200 ? text : fallback;
}

/**
 * Attempts the full discovery -> fetch -> extract -> validate -> identity-gate
 * chain for one food query. Returns null on ANY failure at ANY stage — a
 * safe "nothing found" is always preferred over a guess (Phase 19's explicit
 * requirement). Never throws for an ordinary failure mode (network error,
 * malformed evidence, identity mismatch); only truly unexpected errors
 * propagate, and even those are caught per-candidate so one bad URL never
 * aborts evaluation of the next.
 */
export async function attemptWebEvidenceFallback(query: string, originalIdentity: string, deps: WebEvidenceFallbackDeps): Promise<{ evidence: NutritionEvidence; diagnostics: WebEvidenceFallbackDiagnostics } | null> {
  const diagnostics: WebEvidenceFallbackDiagnostics = { queriesAttempted: [], searchResultCount: 0, discardedDiscoveryOnlyDomains: [], candidateDomains: [], candidates: [], fetchFailures: [], cacheHit: false };
  const finish = (resolved: boolean, evidence?: NutritionEvidence) => {
    logWebEvidenceFallbackOutcome(diagnostics, resolved);
    deps.onDiagnostics?.(diagnostics);
    return evidence ? { evidence, diagnostics } : null;
  };
  if (deps.searchProvider.id === "disabled" || deps.extractionProvider.id === "disabled") {
    diagnostics.rejectionReason = "no_provider_configured";
    return finish(false);
  }
  if (!deps.rateLimiter.consume(deps.userId)) {
    diagnostics.rejectionReason = "rate_limited";
    return finish(false);
  }

  // P0 effectiveness review (2026-09-16): a real, concrete bug found via live
  // staging investigation (0/9 success rate) — this previously searched on
  // `originalIdentity` (the RAW, possibly non-English user phrase, e.g.
  // Hungarian "kárász") instead of `query` (the already-translated canonical
  // search term this same function receives, e.g. "crucian carp" — the exact
  // term resolveDynamicFood's own search-intent step already produced for
  // the USDA/OFF adapters). Searching literal Hungarian/German words against
  // a search index that's overwhelmingly English-language official nutrition
  // content starves the pipeline of any realistic chance of a tier-A/B hit.
  // `query` is used as the primary search text now; `originalIdentity` is
  // still appended when it differs, for extra recall on branded/regional
  // terms a translation might have genericized away (e.g. a specific brand
  // name), never in place of the canonical term.
  const searchQuery = normalizeSearch(query) === normalizeSearch(originalIdentity)
    ? `${query} nutrition facts per 100g`
    : `${query} (${originalIdentity}) nutrition facts per 100g`;
  diagnostics.queriesAttempted.push(searchQuery);
  let results: WebSearchResult[];
  try {
    // maxResults widened from 5 to 8 (2026-09-16): more raw candidates for
    // the tier filter to consider before any fetch — tier classification
    // alone already keeps this safe (discovery_only results are dropped
    // regardless of how many are returned), so this only affects recall.
    results = await timeStage("web_evidence_search", () => deps.searchProvider.search({ query: searchQuery, maxResults: 8 }));
  } catch {
    diagnostics.rejectionReason = "search_failed";
    return finish(false);
  }
  diagnostics.searchResultCount = results.length;

  // Search results are discovery only — every one is independently
  // tier-classified before any fetch is even attempted; a discovery_only
  // domain (blog, forum, recipe site, SEO page) is dropped here, never
  // reaches the fetch/extract/identity pipeline at all.
  const classified = results.map((result) => ({ result, tier: classifySourceTier(result.domain, originalIdentity) }));
  diagnostics.discardedDiscoveryOnlyDomains = classified.filter(({ tier }) => !isAuthoritativeTier(tier)).map(({ result }) => result.domain);
  const tiered = classified
    .filter(({ tier }) => isAuthoritativeTier(tier))
    .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier])
    .slice(0, WEB_EVIDENCE_MAX_CANDIDATE_URLS);
  diagnostics.candidateDomains = tiered.map(({ result }) => result.domain);
  if (!tiered.length) {
    diagnostics.rejectionReason = "no_authoritative_candidates";
    return finish(false);
  }

  const fetchHtml = deps.fetchHtml ?? fetchPublicHtml;

  for (const { result, tier } of tiered) {
    const candidateDiag: WebEvidenceCandidateDiagnostic = { url: result.url, domain: result.domain, tier, fetch: "ok" };
    diagnostics.candidates.push(candidateDiag);
    let html: string;
    let finalUrl: string;
    try {
      const fetched = await timeStage("web_evidence_fetch", () => fetchHtml(result.url));
      html = fetched.html;
      finalUrl = fetched.finalUrl;
    } catch (error) {
      candidateDiag.fetch = "failed";
      candidateDiag.fetchError = error instanceof Error ? error.message : "fetch_failed";
      diagnostics.fetchFailures.push({ url: result.url, reason: candidateDiag.fetchError });
      continue;
    }

    // Deterministic extraction first (no AI call, exact when available);
    // only falls back to the LLM-grounded extractor when nothing
    // machine-readable was found on the page.
    const safeText = htmlToSafeText(html);
    const groundedIdentity = sourceFoodNameFromHtml(html, result.title);
    const extracted = extractJsonLdNutrition(html, groundedIdentity)
      ?? extractVisibleTextNutrition(safeText, groundedIdentity)
      ?? await timeStage("web_evidence_extraction_ai", () => deps.extractionProvider.extract({ requestedIdentity: originalIdentity, canonicalIdentity: query, sourceDomain: result.domain, sourceTitle: result.title, pageText: safeText }));
    if (!extracted) {
      candidateDiag.extractionVerdict = "no_evidence";
      diagnostics.extractionVerdict = "no_evidence";
      continue;
    }
    candidateDiag.extractionMethod = extracted.extractionMethod;
    // JSON-LD quotes are raw snippets of the original html; LLM quotes are
    // taken from the stripped visible text — ground each against the text
    // it was actually drawn from.
    const groundingSource = extracted.extractionMethod === "json_ld" ? html : safeText;
    const evidence = validateAndNormalizeEvidence(extracted, groundingSource, {
      sourceUrl: finalUrl, sourceDomain: result.domain, sourceTitle: result.title, sourceTier: tier,
      retrievedAt: new Date().toISOString(), requestedIdentity: originalIdentity, canonicalIdentity: query
    });
    if (!evidence) {
      candidateDiag.extractionVerdict = "ungrounded";
      diagnostics.extractionVerdict = "ungrounded";
      continue;
    }
    candidateDiag.extractionVerdict = "grounded";
    diagnostics.extractionVerdict = "grounded";

    // Identity gate: the SAME existing semantic-candidate-gate every other
    // resolution path uses (external-food.ts, dynamic-food-resolution.ts) —
    // no new taxonomy, no separate trust logic. A disabled gate fails
    // closed by construction (empty Map -> every candidate unvalidated).
    if (deps.semanticGateProvider.id === "disabled") {
      candidateDiag.identityVerdict = "gate_disabled";
      diagnostics.identityVerdict = "gate_disabled";
      continue;
    }
    candidateDiag.semanticGateAttempted = true;
    candidateDiag.requestedIdentity = originalIdentity.slice(0, 160);
    candidateDiag.sourceFoodName = evidence.sourceFoodName.slice(0, 160);
    const gateInput = { identity: originalIdentity, canonicalIdentity: query, locale: deps.locale };
    const gateCandidates = [{ id: "evidence", authoritativeName: evidence.sourceFoodName }];
    const detailed = deps.semanticGateProvider.checkRelevanceDetailed
      ? await timeStage("web_evidence_identity_gate", () => deps.semanticGateProvider.checkRelevanceDetailed!(gateInput, gateCandidates))
      : null;
    const verdicts = detailed?.verdicts ?? await timeStage("web_evidence_identity_gate", () => deps.semanticGateProvider.checkRelevance(gateInput, gateCandidates));
    const verdict = verdicts.get("evidence");
    if (detailed) {
      candidateDiag.semanticGateStatus = detailed.diagnostic.status;
      candidateDiag.semanticGateReasonCode = detailed.diagnostic.reasonCode;
      candidateDiag.providerFailureClass = detailed.diagnostic.providerFailureClass;
    }
    if (verdict !== true && verdict !== "best_match" && verdict !== "acceptable_alternative") {
      candidateDiag.identityVerdict = "rejected";
      candidateDiag.semanticGateVerdict = detailed?.diagnostic.status === "completed" && detailed.diagnostic.decisions.has("evidence") ? "negative" : "unavailable";
      diagnostics.identityVerdict = "rejected";
      continue;
    }
    candidateDiag.identityVerdict = "approved";
    candidateDiag.semanticGateVerdict = "approved";
    diagnostics.identityVerdict = "approved";
    diagnostics.selectedSourceUrl = finalUrl;
    diagnostics.sourceTier = tier;
    return finish(true, evidence);
  }

  diagnostics.rejectionReason ??= "no_evidence_passed_all_gates";
  return finish(false);
}

export type WebEvidencePersistencePrisma = Pick<PrismaClient, "food" | "foodAlias" | "$transaction">;

function stableEvidenceSourceId(sourceUrl: string): string {
  // A stable, deterministic id derived from the evidence URL itself (never
  // from content, which can legitimately change on re-fetch) — repeat
  // resolution of the SAME page always maps to the SAME Food row via the
  // existing @@unique([source, sourceId]) constraint, exactly like every
  // other source already relies on for idempotent persistence.
  let hash = 0;
  for (let i = 0; i < sourceUrl.length; i += 1) hash = (Math.imul(hash, 31) + sourceUrl.charCodeAt(i)) | 0;
  return `we_${(hash >>> 0).toString(36)}_${sourceUrl.length}`;
}

/**
 * Persists validated web evidence as a new Food, tagged distinctly
 * (source: "web_evidence") so it can never be mistaken for curated
 * BLS/USDA/OFF data (Phase 17) — full provenance retained for audit. Races
 * on the same sourceUrl resolve to the existing row, exactly like
 * persistCandidate's own P2002 handling in external-food.ts.
 */
export async function persistWebEvidenceFood(prisma: WebEvidencePersistencePrisma, evidence: NutritionEvidence) {
  const sourceId = stableEvidenceSourceId(evidence.sourceUrl);
  const existing = await (prisma.food as any).findUnique({ where: { source_sourceId: { source: "web_evidence", sourceId } }, include: { servings: true } });
  if (existing) return existing;

  const foodData = {
    name: evidence.sourceFoodName || evidence.requestedIdentity,
    originalName: evidence.sourceFoodName || evidence.requestedIdentity,
    source: "web_evidence" as const,
    sourceId,
    kcalPer100g: evidence.kcalPer100g,
    fatPer100g: evidence.fatPer100g,
    proteinPer100g: evidence.proteinPer100g,
    carbsPer100g: evidence.carbsPer100g,
    fiberPer100g: evidence.fiberPer100g,
    provenance: {
      method: "web_evidence",
      sourceUrl: evidence.sourceUrl,
      sourceDomain: evidence.sourceDomain,
      sourceTitle: evidence.sourceTitle,
      sourceTier: evidence.sourceTier,
      retrievedAt: evidence.retrievedAt,
      requestedIdentity: evidence.requestedIdentity,
      canonicalIdentity: evidence.canonicalIdentity,
      basisAmountGrams: evidence.basisAmountGrams,
      extractionMethod: evidence.extractionMethod,
      evidenceExcerpt: evidence.evidenceExcerpt,
      energyConsistent: evidence.energyConsistent,
      confidence: evidence.confidence
    }
  };
  try {
    return await prisma.$transaction(async (tx) => {
      const saved = await (tx.food as any).create({ data: { ...foodData, searchText: buildSearchText(foodData) } });
      const alias = normalizeSearch(evidence.requestedIdentity);
      if (alias) {
        await tx.foodAlias.createMany({
          data: [{ foodId: saved.id, alias: evidence.requestedIdentity.trim(), normalizedAlias: alias, locale: "und", kind: "external", confidence: evidence.confidence, provenance: { method: "web_evidence", sourceUrl: evidence.sourceUrl } }],
          skipDuplicates: true
        });
      }
      return saved;
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      const raced = await (prisma.food as any).findUnique({ where: { source_sourceId: { source: "web_evidence", sourceId } }, include: { servings: true } });
      if (raced) return raced;
    }
    throw error;
  }
}
