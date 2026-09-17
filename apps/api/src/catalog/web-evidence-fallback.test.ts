import { describe, expect, it, vi } from "vitest";
import { attemptWebEvidenceFallback, persistWebEvidenceFood, WebEvidenceFallbackRateLimiter, WEB_EVIDENCE_FALLBACK_RATE_LIMIT, WEB_EVIDENCE_MAX_CANDIDATE_URLS, type WebEvidenceFallbackDeps } from "./web-evidence-fallback.js";
import type { WebKnowledgeSearchProvider, WebSearchResult } from "../web-knowledge/web-knowledge-search-provider.js";
import type { NutritionEvidenceExtractionProvider } from "./nutrition-evidence-extraction.js";
import type { SemanticCandidateGateProvider } from "./semantic-candidate-gate.js";
import { SafeFetchError } from "../recipes/safe-url-fetcher.js";

const OFFICIAL_HTML = `<html><body>Cauliflower, raw. Serving size 100 g. Calories 25 kcal. Protein 1.9 g. Fat 0.3 g. Carbohydrate 5 g. Dietary fiber 2 g.</body></html>`;

function searchProvider(results: WebSearchResult[], opts: { id?: string; throws?: boolean } = {}): WebKnowledgeSearchProvider {
  return { id: opts.id ?? "tavily", search: async () => { if (opts.throws) throw new Error("search down"); return results; } };
}

function extractionProvider(extracted: any, opts: { id?: string } = {}): NutritionEvidenceExtractionProvider {
  return { id: opts.id ?? "groq", extract: async () => extracted };
}

function identityGate(verdict: boolean | "best_match" | "acceptable_alternative" | undefined, opts: { id?: string } = {}): SemanticCandidateGateProvider {
  return { id: opts.id ?? "real", checkRelevance: async () => (verdict === undefined ? new Map() : new Map([["evidence", verdict]])) };
}

function baseDeps(overrides: Partial<WebEvidenceFallbackDeps> = {}): WebEvidenceFallbackDeps {
  return {
    searchProvider: searchProvider([{ url: "https://example.gov/cauliflower", title: "Cauliflower nutrition", snippet: "...", domain: "example.gov" }]),
    extractionProvider: extractionProvider({
      sourceFoodName: "Cauliflower, raw",
      basis: { amountGrams: 100, quote: "Serving size 100 g" },
      kcal: { value: 25, quote: "Calories 25 kcal" }, protein: { value: 1.9, quote: "Protein 1.9 g" },
      fat: { value: 0.3, quote: "Fat 0.3 g" }, carbs: { value: 5, quote: "Carbohydrate 5 g" }, fiber: { value: 2, quote: "Dietary fiber 2 g" },
      extractionMethod: "llm_grounded"
    }),
    semanticGateProvider: identityGate(true),
    rateLimiter: new WebEvidenceFallbackRateLimiter(),
    userId: "user-1",
    fetchHtml: async () => ({ html: OFFICIAL_HTML, finalUrl: "https://example.gov/cauliflower" }),
    ...overrides
  };
}

describe("attemptWebEvidenceFallback — end-to-end orchestration", () => {
  it("a full success: discovers, fetches, extracts, grounds, identity-gates, and returns validated evidence", async () => {
    const result = await attemptWebEvidenceFallback("cauliflower", "karfiol", baseDeps());
    expect(result).not.toBeNull();
    expect(result!.evidence).toMatchObject({ sourceFoodName: "Cauliflower, raw", kcalPer100g: 25, fiberPer100g: 2, sourceTier: "tier_a_official" });
    expect(result!.diagnostics.identityVerdict).toBe("approved");
  });

  it("uses the fetched page h1 as identity evidence for a deterministic visible per-100g table", async () => {
    const extraction = vi.fn(async () => null);
    let gatedName = "";
    const result = await attemptWebEvidenceFallback("clif bar chocolate chip", "CLIF BAR Chocolate Chip", baseDeps({
      searchProvider: searchProvider([{ url: "https://clifbar.com/products/chocolate-chip", title: "Products | CLIF", snippet: "", domain: "clifbar.com" }]),
      extractionProvider: { id: "fixture", extract: extraction },
      semanticGateProvider: { id: "real", checkRelevance: async (_input, candidates) => { gatedName = candidates[0].authoritativeName; return new Map([["evidence", true]]); } },
      fetchHtml: async () => ({
        html: "<html><title>CLIF BAR Chocolate Chip | CLIF BAR</title><h1>Chocolate Chip</h1><body>Nutrition Information Per 100g Energy 1596kJ / 379kcal Fat 9g Carbohydrate 56g Fibre 8g Protein 15g</body></html>",
        finalUrl: "https://clifbar.com/products/chocolate-chip"
      })
    }));
    expect(gatedName).toBe("CLIF BAR Chocolate Chip | CLIF BAR");
    expect(result?.evidence).toMatchObject({ sourceFoodName: "CLIF BAR Chocolate Chip | CLIF BAR", extractionMethod: "html_table", kcalPer100g: 379 });
    expect(extraction).not.toHaveBeenCalled();
  });

  // P0 effectiveness review (2026-09-16): a real bug found via live staging
  // investigation — the search query previously used the RAW, untranslated
  // originalIdentity (e.g. Hungarian "kárász") instead of the already-
  // translated canonical search term, starving results of English-language
  // official nutrition content.
  it("searches using the canonical (translated) term, not the raw original-language identity", async () => {
    const search = vi.fn(async () => []);
    await attemptWebEvidenceFallback("crucian carp", "kárász", baseDeps({ searchProvider: { id: "tavily", search } }));
    const [queryArg] = search.mock.calls[0];
    expect(queryArg.query).toContain("crucian carp");
  });

  it("still includes the original identity alongside the canonical term for extra recall when they differ", async () => {
    const search = vi.fn(async () => []);
    await attemptWebEvidenceFallback("crucian carp", "kárász", baseDeps({ searchProvider: { id: "tavily", search } }));
    const [queryArg] = search.mock.calls[0];
    expect(queryArg.query).toContain("kárász");
  });

  it("no search/extraction provider configured (disabled) -> null, zero search calls", async () => {
    const search = vi.fn(async () => []);
    const result = await attemptWebEvidenceFallback("x", "x", baseDeps({ searchProvider: { id: "disabled", search } }));
    expect(result).toBeNull();
    expect(search).not.toHaveBeenCalled();
  });

  it("rate-limited user -> null, zero search calls", async () => {
    const search = vi.fn(async () => []);
    const limiter = new WebEvidenceFallbackRateLimiter();
    vi.spyOn(limiter, "consume").mockReturnValue(false);
    const result = await attemptWebEvidenceFallback("x", "x", baseDeps({ searchProvider: { id: "tavily", search }, rateLimiter: limiter }));
    expect(result).toBeNull();
    expect(search).not.toHaveBeenCalled();
  });

  it("search provider throws -> null, no crash", async () => {
    const result = await attemptWebEvidenceFallback("x", "x", baseDeps({ searchProvider: searchProvider([], { throws: true }) }));
    expect(result).toBeNull();
  });

  it("zero search results -> null", async () => {
    const result = await attemptWebEvidenceFallback("x", "x", baseDeps({ searchProvider: searchProvider([]) }));
    expect(result).toBeNull();
  });

  it("EVERY result is discovery_only (a blog/forum/recipe site, no official domain) -> null, never fetched at all", async () => {
    const fetchHtml = vi.fn();
    const result = await attemptWebEvidenceFallback("x", "karfiol", baseDeps({
      searchProvider: searchProvider([{ url: "https://some-food-blog.com/cauliflower", title: "My cauliflower recipe", snippet: "...", domain: "some-food-blog.com" }]),
      fetchHtml
    }));
    expect(result).toBeNull();
    expect(fetchHtml).not.toHaveBeenCalled();
  });

  it("fixture J — SSRF-blocked URL (safe fetcher rejects it): fetch throws SafeFetchError -> null, tries the next candidate, never crashes", async () => {
    let calls = 0;
    const fetchHtml = vi.fn(async (url: string) => {
      calls += 1;
      if (url.includes("blocked")) throw new SafeFetchError("blocked_url");
      return { html: OFFICIAL_HTML, finalUrl: url };
    });
    const result = await attemptWebEvidenceFallback("x", "karfiol", baseDeps({
      searchProvider: searchProvider([
        { url: "https://example.gov/blocked-internal", title: "Cauliflower", snippet: "", domain: "example.gov" },
        { url: "https://fdc.nal.usda.gov/cauliflower", title: "Cauliflower", snippet: "", domain: "fdc.nal.usda.gov" }
      ]),
      fetchHtml
    }));
    expect(result).not.toBeNull();
    expect(calls).toBe(2); // first blocked, second succeeded
  });

  it("extraction provider returns nothing (no evidence found on the page) -> null", async () => {
    const result = await attemptWebEvidenceFallback("x", "x", baseDeps({ extractionProvider: extractionProvider(null) }));
    expect(result).toBeNull();
  });

  it("fixture F — wrong food identity: extraction succeeds and is grounded, but the semantic gate rejects it -> null, Food is never created", async () => {
    const result = await attemptWebEvidenceFallback("mustard", "mustár", baseDeps({ semanticGateProvider: identityGate(false) }));
    expect(result).toBeNull();
  });

  it("identity gate disabled (no real gate configured) -> fails closed, null, never auto-approves", async () => {
    const result = await attemptWebEvidenceFallback("x", "x", baseDeps({ semanticGateProvider: identityGate(true, { id: "disabled" }) }));
    expect(result).toBeNull();
  });

  it("fixture E — ambiguous/incomplete evidence (ungrounded quote) -> null, never guesses", async () => {
    const result = await attemptWebEvidenceFallback("x", "x", baseDeps({
      extractionProvider: extractionProvider({
        sourceFoodName: "Cauliflower, raw", basis: { amountGrams: 100, quote: "text that is not on the page" },
        kcal: { value: 25, quote: "not on the page either" }, protein: { value: 1.9, quote: "x" }, fat: { value: 0.3, quote: "x" }, carbs: { value: 5, quote: "x" }, fiber: { value: 2, quote: "x" },
        extractionMethod: "llm_grounded"
      })
    }));
    expect(result).toBeNull();
  });

  it("bounds the number of candidate URLs fetched to WEB_EVIDENCE_MAX_CANDIDATE_URLS even when more are returned", async () => {
    const results: WebSearchResult[] = Array.from({ length: 5 }, (_, i) => ({ url: `https://fdc.nal.usda.gov/x${i}`, title: "x", snippet: "", domain: "fdc.nal.usda.gov" }));
    let fetchCount = 0;
    const fetchHtml = async () => { fetchCount += 1; throw new SafeFetchError("fetch_failed"); };
    await attemptWebEvidenceFallback("x", "x", baseDeps({ searchProvider: searchProvider(results), fetchHtml }));
    expect(fetchCount).toBeLessThanOrEqual(WEB_EVIDENCE_MAX_CANDIDATE_URLS);
  });

  it("cost bound sanity: the rate limit is tighter than plain dynamic resolution (documents the intended budget)", () => {
    expect(WEB_EVIDENCE_FALLBACK_RATE_LIMIT.limit).toBeLessThanOrEqual(3);
  });
});

// P0 effectiveness-investigation instrumentation (2026-09-16): onDiagnostics
// fires on EVERY call, success or failure, with a rich per-candidate funnel
// trace — this is what made the live root-cause investigation possible.
describe("attemptWebEvidenceFallback — diagnostics instrumentation", () => {
  it("on success: reports the search query, result count, candidate tiers, and the approved candidate's full funnel", async () => {
    const diagnosticsCalls: any[] = [];
    await attemptWebEvidenceFallback("cauliflower", "karfiol", baseDeps({ onDiagnostics: (d) => diagnosticsCalls.push(d) } as any));
    expect(diagnosticsCalls).toHaveLength(1);
    const d = diagnosticsCalls[0];
    expect(d.queriesAttempted[0]).toContain("cauliflower");
    expect(d.searchResultCount).toBe(1);
    expect(d.candidates).toHaveLength(1);
    expect(d.candidates[0]).toMatchObject({ domain: "example.gov", tier: "tier_a_official", fetch: "ok", extractionMethod: "llm_grounded", extractionVerdict: "grounded", identityVerdict: "approved" });
  });

  it("on discovery_only rejection: reports which domains were discarded and why, before any fetch", async () => {
    const diagnosticsCalls: any[] = [];
    const fetchHtml = vi.fn();
    await attemptWebEvidenceFallback("x", "karfiol", baseDeps({
      searchProvider: searchProvider([{ url: "https://some-food-blog.com/x", title: "x", snippet: "", domain: "some-food-blog.com" }]),
      fetchHtml, onDiagnostics: (d) => diagnosticsCalls.push(d)
    } as any));
    expect(fetchHtml).not.toHaveBeenCalled();
    const d = diagnosticsCalls[0];
    expect(d.discardedDiscoveryOnlyDomains).toEqual(["some-food-blog.com"]);
    expect(d.candidates).toHaveLength(0);
    expect(d.rejectionReason).toBe("no_authoritative_candidates");
  });

  it("on fetch failure: reports the per-candidate fetch error distinctly from other rejection stages", async () => {
    const diagnosticsCalls: any[] = [];
    await attemptWebEvidenceFallback("x", "karfiol", baseDeps({
      fetchHtml: async () => { throw new SafeFetchError("blocked_url"); },
      onDiagnostics: (d) => diagnosticsCalls.push(d)
    } as any));
    const d = diagnosticsCalls[0];
    expect(d.candidates[0]).toMatchObject({ fetch: "failed", fetchError: "blocked_url" });
  });

  it("on ungrounded extraction: reports the specific candidate's extraction verdict", async () => {
    const diagnosticsCalls: any[] = [];
    await attemptWebEvidenceFallback("x", "x", baseDeps({
      extractionProvider: extractionProvider({
        sourceFoodName: "Cauliflower, raw", basis: { amountGrams: 100, quote: "not on page" },
        kcal: { value: 25, quote: "not on page" }, protein: { value: 1.9, quote: "x" }, fat: { value: 0.3, quote: "x" }, carbs: { value: 5, quote: "x" }, fiber: { value: 2, quote: "x" },
        extractionMethod: "llm_grounded"
      }),
      onDiagnostics: (d) => diagnosticsCalls.push(d)
    } as any));
    const d = diagnosticsCalls[0];
    expect(d.candidates[0].extractionVerdict).toBe("ungrounded");
  });

  it("on identity rejection: reports the specific candidate's identity verdict, distinct from extraction", async () => {
    const diagnosticsCalls: any[] = [];
    await attemptWebEvidenceFallback("mustard", "mustár", baseDeps({ semanticGateProvider: identityGate(false), onDiagnostics: (d) => diagnosticsCalls.push(d) } as any));
    const d = diagnosticsCalls[0];
    expect(d.candidates[0]).toMatchObject({ extractionVerdict: "grounded", identityVerdict: "rejected" });
  });
});

function fakePersistPrisma() {
  const foods: any[] = [];
  const aliases: any[] = [];
  const prisma: any = {
    food: {
      findUnique: async ({ where }: any) => foods.find((f) => f.source === where.source_sourceId.source && f.sourceId === where.source_sourceId.sourceId) ?? null,
      create: async ({ data }: any) => { const food = { id: `food-${foods.length}`, ...data }; foods.push(food); return food; }
    },
    foodAlias: { createMany: async ({ data }: any) => { aliases.push(...data); return { count: data.length }; } },
    $transaction: async (fn: any) => fn(prisma)
  };
  return { prisma, foods, aliases };
}

const sampleEvidence = {
  sourceUrl: "https://example.gov/cauliflower", sourceDomain: "example.gov", sourceTitle: "Cauliflower", sourceTier: "tier_a_official" as const,
  retrievedAt: "2026-09-16T00:00:00.000Z", requestedIdentity: "karfiol", canonicalIdentity: "cauliflower", sourceFoodName: "Cauliflower, raw",
  basisAmountGrams: 100, kcalPer100g: 25, proteinPer100g: 1.9, fatPer100g: 0.3, carbsPer100g: 5, fiberPer100g: 2,
  extractionMethod: "llm_grounded" as const, evidenceExcerpt: "25 kcal", energyConsistent: true, confidence: 0.9
};

describe("persistWebEvidenceFood — Phase 17 provenance / Phase 18 idempotent cache", () => {
  it("creates a Food tagged source: web_evidence with full provenance, never masquerading as bls/usda_fdc", async () => {
    const { prisma, foods } = fakePersistPrisma();
    const food = await persistWebEvidenceFood(prisma, sampleEvidence);
    expect(food.source).toBe("web_evidence");
    expect(food.provenance).toMatchObject({ sourceUrl: sampleEvidence.sourceUrl, sourceTier: "tier_a_official", extractionMethod: "llm_grounded" });
    expect(foods).toHaveLength(1);
  });

  it("resolving the SAME sourceUrl twice reuses the existing Food row — idempotent, no duplicate", async () => {
    const { prisma, foods } = fakePersistPrisma();
    const first = await persistWebEvidenceFood(prisma, sampleEvidence);
    const second = await persistWebEvidenceFood(prisma, sampleEvidence);
    expect(second.id).toBe(first.id);
    expect(foods).toHaveLength(1);
  });

  it("a DIFFERENT sourceUrl for the same food name creates a distinct Food row", async () => {
    const { prisma, foods } = fakePersistPrisma();
    await persistWebEvidenceFood(prisma, sampleEvidence);
    await persistWebEvidenceFood(prisma, { ...sampleEvidence, sourceUrl: "https://frida.fooddata.dk/cauliflower" });
    expect(foods).toHaveLength(2);
  });
});
