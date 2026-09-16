import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveDynamicFood, learnSearchAlias } from "./dynamic-food-resolution.js";
import { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";
import { DisabledSearchIntentProvider, type SearchIntent, type SearchIntentProvider } from "./search-intent.js";
import type { ExternalFoodCandidate } from "./external-food.js";
import type { CandidateLocalizationProvider } from "./candidate-localization.js";
import type { SemanticCandidateGateProvider } from "./semantic-candidate-gate.js";
import { computeAliasSemanticVerdict } from "./alias-semantic-verdict.js";

// Mirrors real production wiring (server.ts always configures a real
// candidateLocalizationProvider): resolveAuthoritativeFood's auto-resolve
// path localizes the candidate into the user's locale BEFORE persisting, so
// the persisted Food's names map already carries the target-language name a
// legitimately-learned dynamic_search alias needs semantic coverage against
// (see hasSemanticCoverage in food-search.ts). A test that skips this isn't
// exercising a realistic resolution.
function fakeLocalizationProvider(displayName: string): CandidateLocalizationProvider {
  return { id: "fixture", localize: vi.fn(async (items: { id: string }[]) => new Map(items.map((item) => [item.id, displayName]))) };
}

function pork(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "172152", originalName: "Pork hock, cooked", name: "Pork hock, cooked",
    // "hu" included so the (now-centralized, 2026-09-17) convergence gate
    // legitimately passes against the "csülök" queries these tests use —
    // exactly the localized-name shape a real, localized Food would carry
    // (see the P0 semantic identity safety checkpoint comment on
    // hasSemanticCoverage: "csülök" genuinely IS the base food here).
    names: { en: "Pork hock, cooked", hu: "Sertéscsülök" }, kcalPer100g: 280, fatPer100g: 22, proteinPer100g: 20, carbsPer100g: 0, fiberPer100g: 0, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "172152", sourceUrl: "https://fdc.nal.usda.gov/172152", retrievedAt: "2026-09-09T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/172152", normalizedName: "pork hock", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-09T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", language: "en", ...overrides
  };
}

function fakePrisma(options: { seedFoods?: any[] } = {}) {
  const foods: any[] = options.seedFoods ?? [];
  const aliases: Array<{ foodId: string; alias: string; normalizedAlias: string; locale: string; kind: string; confidence: number }> = [];
  const prisma: any = {
    food: {
      findUnique: async ({ where }: any) => foods.find((f) => f.source === where.source_sourceId.source && f.sourceId === where.source_sourceId.sourceId) ?? null,
      // Real enough to prove the "second call is a local hit" lifecycle:
      // matches searchFoods' own searchText-contains query against whatever
      // persistCandidate actually wrote (a real, non-mocked searchText), AND
      // resolves alias-only matches (learned Hungarian search terms) the same
      // way food-search.ts's own missingIds backfill does.
      findMany: async (args: any) => {
        if (args?.where?.id?.in) return foods.filter((food) => args.where.id.in.includes(food.id)).map((food) => ({ ...food, servings: [] }));
        const variants: string[] = (args?.where?.OR ?? []).map((clause: any) => clause.searchText?.contains).filter(Boolean);
        if (!variants.length) return [];
        return foods.filter((food) => variants.some((v) => String(food.searchText ?? "").toLowerCase().includes(String(v).toLowerCase())))
          .map((food) => ({ ...food, servings: [] }));
      },
      create: async ({ data }: any) => { const food = { id: `food-${foods.length}`, ...data }; foods.push(food); return food; },
      // Mirrors dynamic-food-resolution.ts's own findUserPrivateFood query
      // shape exactly (createdById + searchText contains), scoped per-user.
      findFirst: async ({ where }: any) => foods.find((f) => f.createdById === where.createdById && String(f.searchText ?? "").toLowerCase().includes(String(where.searchText?.contains ?? "").toLowerCase())) ?? null
    },
    foodAlias: {
      findFirst: async () => null,
      findMany: async ({ where }: any) => {
        const variants: string[] = (where?.OR ?? []).map((clause: any) => clause.normalizedAlias?.contains).filter(Boolean);
        return aliases.filter((a) => variants.some((v) => a.normalizedAlias.includes(v))).map((a) => ({ foodId: a.foodId, normalizedAlias: a.normalizedAlias }));
      },
      createMany: async () => ({ count: 1 }),
      upsert: async ({ where, update, create }: any) => {
        const key = where.foodId_normalizedAlias_locale;
        const existing = aliases.find((a) => a.foodId === key.foodId && a.normalizedAlias === key.normalizedAlias && a.locale === key.locale);
        if (existing) { Object.assign(existing, update); return existing; }
        const row = { foodId: create.foodId, alias: create.alias, normalizedAlias: create.normalizedAlias, locale: create.locale, kind: create.kind, confidence: create.confidence };
        aliases.push(row);
        return row;
      }
    },
    nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
    foodNutrient: { create: async () => ({}) },
    $transaction: async (fn: any) => fn(prisma)
  };
  return { prisma, foods, aliases };
}

function stubSearchIntent(intent: SearchIntent | null): SearchIntentProvider {
  return { id: "stub", generate: async () => intent };
}

// Owner-beta blocker #9 (2026-09-11): resolveAuthoritativeFood now FAILS
// CLOSED on the semantic candidate gate by default (DisabledSemanticCandidateGateProvider
// rejects every candidate). Every test in this file below that is NOT
// specifically about the gate itself (see semantic-candidate-gate.test.ts and
// dynamic-food-resolution.test.ts's own dedicated describe block further
// down) needs a permissive stand-in so its ORIGINAL intent (unrelated to
// this checkpoint) keeps being exercised unchanged.
function permissiveSemanticGate(): SemanticCandidateGateProvider {
  return { id: "permissive-fixture", checkRelevance: async (_original, candidates) => new Map(candidates.map((c) => [c.id, true])) };
}

describe("resolveDynamicFood: bounded local-miss fallback", () => {
  it("no adapters configured -> unresolved(no_adapters), never calls search-intent or rate limiter", async () => {
    const { prisma } = fakePrisma();
    const generate = vi.fn();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: { id: "s", generate },
      adapters: [],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(result).toEqual({ status: "unresolved", reason: "no_adapters" });
    expect(generate).not.toHaveBeenCalled();
  });

  it("rate-limited user -> unresolved(rate_limited), never calls search-intent or the adapter", async () => {
    const { prisma } = fakePrisma();
    const limiter = new DynamicFoodResolutionRateLimiter();
    vi.spyOn(limiter, "consume").mockReturnValue(false);
    const generate = vi.fn();
    const lookup = vi.fn();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: { id: "s", generate },
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }],
      rateLimiter: limiter,
      userId: "user-1"
    });
    expect(result).toEqual({ status: "unresolved", reason: "rate_limited" });
    expect(generate).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("uses the search-intent's first English term as the single search query when available", async () => {
    const { prisma } = fakePrisma();
    const lookup = vi.fn(async () => [pork()]);
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock", "pork knuckle"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate()
    });
    expect(lookup).toHaveBeenCalledOnce();
    expect(lookup).toHaveBeenCalledWith("pork hock");
    expect(result).toMatchObject({ status: "resolved", via: "search_intent" });
  });

  it("degrades to the raw food phrase when search-intent is disabled/unavailable — still attempts the lookup", async () => {
    const { prisma } = fakePrisma();
    const lookup = vi.fn(async (q: string) => (q === "csülök" ? [pork({ normalizedName: "csülök" })] : []));
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: new DisabledSearchIntentProvider(),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate()
    });
    expect(lookup).toHaveBeenCalledWith("csülök");
    expect(result).toMatchObject({ status: "resolved", via: "raw_query" });
  });

  it("makes exactly one external search call — never a search-intent -> USDA -> search-intent -> USDA chain", async () => {
    const { prisma } = fakePrisma();
    const lookup = vi.fn(async () => [pork()]);
    await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate()
    });
    expect(lookup).toHaveBeenCalledOnce();
  });

  it("surfaces ambiguous candidates for confirmation rather than silently choosing", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [pork({ confidence: 0.96 }), pork({ sourceId: "172153", name: "Pork, cured, hock", normalizedName: "pork hock cured", confidence: 0.9 })] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate()
    });
    expect(result).toMatchObject({ status: "confirmation_required", reason: "ambiguous" });
    expect((result as any).candidates).toHaveLength(2);
  });

  it("no candidate found -> unresolved(not_found), never invents a Food", async () => {
    const { prisma, foods } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "teljesen ismeretlen étel" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "unknown", searchTerms: ["unknown food xyz"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(result).toEqual({
      status: "unresolved", reason: "not_found", webEvidenceDiagnostics: undefined,
      resolutionDiagnostics: { searchTerm: "unknown food xyz", via: "search_intent", authoritativeReason: "not_found", rawCandidateCount: 0, structurallyValidCount: 0, webEvidenceAttempted: false }
    });
    expect(foods).toHaveLength(0);
  });

  it("external provider outage -> unresolved(external_unavailable), no crash, no invented Food", async () => {
    const { prisma, foods } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => { throw new Error("upstream secret timeout detail"); } }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(result).toEqual({
      status: "unresolved", reason: "external_unavailable", webEvidenceDiagnostics: undefined,
      resolutionDiagnostics: { searchTerm: "pork hock", via: "search_intent", authoritativeReason: "external_unavailable", rawCandidateCount: 0, structurallyValidCount: 0, webEvidenceAttempted: false }
    });
    expect(foods).toHaveLength(0);
  });
});

describe("resolveDynamicFood: persist once, reuse forever", () => {
  it("first miss resolves+persists via one external call; a second miss with the same intent hits locally with zero external calls", async () => {
    const { prisma, foods } = fakePrisma();
    let externalCalls = 0;
    // Name matches the search-intent term exactly (post-normalization) so the
    // second lookup's own internal re-search inside resolveAuthoritativeFood
    // finds this Food at the exact tier — a genuinely trusted identity, not
    // merely a coincidental partial/prefix echo, which the strong-local-
    // resolution gate (owner-beta blocker #3) no longer trusts on its own.
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => { externalCalls += 1; return [pork({ name: "Pork hock", originalName: "Pork hock" })]; } }];
    const deps = {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters, rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate()
    };

    const first = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, deps);
    expect(first.status).toBe("resolved");
    expect(externalCalls).toBe(1);
    expect(foods).toHaveLength(1);
    expect(foods[0]).toMatchObject({ source: "usda_fdc", sourceId: "172152" });

    // A DIFFERENT user, same concept: resolveAuthoritativeFood's own local
    // search (inside resolveDynamicFood) finds the now-persisted Food before
    // ever reaching the adapter again.
    const second = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, { ...deps, userId: "user-2" });
    expect(second).toMatchObject({ status: "resolved", food: { id: "food-0" } });
    expect(externalCalls).toBe(1); // unchanged
    expect(foods).toHaveLength(1); // no duplicate
  });

  it("learns the raw user phrase as a conservative alias so the SAME Hungarian text hits locally even without search-intent running again", async () => {
    const { prisma, foods, aliases } = fakePrisma();
    let externalCalls = 0;
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => { externalCalls += 1; return [pork()]; } }];

    await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"], sourceLanguage: "hu" }),
      adapters, rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1",
      locale: "hu", localizationProvider: fakeLocalizationProvider("Csülök"),
      semanticCandidateGateProvider: permissiveSemanticGate()
    });
    expect(aliases).toContainEqual(expect.objectContaining({ normalizedAlias: "csulok", locale: "hu", kind: "dynamic_search" }));

    // Search-intent disabled this time (simulating an LLM outage) — the raw
    // Hungarian phrase alone must still resolve locally via the learned alias.
    const outageResult = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: new DisabledSearchIntentProvider(),
      adapters, rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-3"
    });
    expect(outageResult).toMatchObject({ status: "resolved", food: { id: "food-0" } });
    expect(externalCalls).toBe(1); // still just the original resolution
    expect(foods).toHaveLength(1);
  });

  // Regression: owner-beta blocker #2 (2026-09-10). Even when the upstream
  // resolution itself auto-persists (search-intent mistranslated the raw
  // phrase into a term that happened to exact-match an unrelated USDA
  // entry), the raw phrase must never be memorized as a trusted alias for
  // that wrong food — that memorization is what turned a one-time mistake
  // into a permanent, full-confidence local mismatch for every future
  // identical query. This is exactly how "gefüllte Kohlrouladen" and
  // "Champignoncremesuppe" got silently, permanently aliased to "bok choy"
  // and "beech mushroom" in production.
  it("does not learn an alias for a resolution the raw phrase has no real relationship to", async () => {
    const { prisma, foods, aliases } = fakePrisma();
    const bokChoy: ExternalFoodCandidate = {
      source: "usda_fdc", sourceId: "999", originalName: "Cabbage, bok choy, raw", name: "Cabbage, bok choy, raw",
      names: { en: "Cabbage, bok choy, raw" }, kcalPer100g: 13, fatPer100g: 0.2, proteinPer100g: 1.5, carbsPer100g: 2.2, fiberPer100g: 1,
      nutrients: [], provenance: { source: "USDA FoodData Central", sourceId: "999", sourceUrl: "https://fdc.nal.usda.gov/999", retrievedAt: "2026-09-09T00:00:00.000Z", valuesPer: "100 g" },
      sourceUrl: "https://fdc.nal.usda.gov/999", normalizedName: "cabbage bok choy raw", nutrientBasis: "per_100_g",
      retrievedAt: "2026-09-09T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", language: "en"
    };
    // A mistranslated search-intent term that happens to exact-match this
    // candidate's own name — resolveAuthoritativeFood's existing auto-resolve
    // logic (unchanged by this fix) legitimately persists it, since from its
    // own point of view the search term WAS an exact, high-confidence match.
    // A permissive gate here is deliberate: this test's own purpose is the
    // SEPARATE alias-learning gate (hasSemanticCoverage) — it needs the
    // upstream mis-resolution to still succeed so that gate is what's
    // actually being exercised, unaffected by owner-beta blocker #9's new
    // upstream candidate gate (which gets its own dedicated tests).
    await resolveDynamicFood(prisma, { foodQuery: "gefüllte Kohlrouladen" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "bok choy", searchTerms: ["cabbage, bok choy, raw"], sourceLanguage: "de" }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [bokChoy] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1",
      locale: "de", localizationProvider: fakeLocalizationProvider("Pak Choi"),
      semanticCandidateGateProvider: permissiveSemanticGate()
    });
    expect(foods).toHaveLength(1); // the (mis-)resolution itself is unchanged by this fix
    expect(aliases).toEqual([]); // but the raw phrase must never be memorized for it
  });
});

// P0 semantic identity safety checkpoint (2026-09-16): learnSearchAlias's
// semanticVerdict parameter is what makes food-search.ts's
// DYNAMIC_SEARCH_ALIAS_TRUST_THRESHOLD meaningful — see that file's own
// tests for the read-side (a low-confidence alias never auto-resolves).
// These are the write-side tests: what confidence gets written for each
// verdict, reusing the exact "mustár"/"csülök" pair from the live bug.
describe("learnSearchAlias: semanticVerdict decides the written confidence", () => {
  const mustardGreens = { id: "mustard-greens", name: "Mustard greens, raw", originalName: "Mustard greens, raw", names: { en: "Mustard greens, raw", hu: "nyers mustárlevél" } };
  const porkHock = { id: "pork-hock", name: "Pork hock, cooked", originalName: "Pork hock, cooked", names: { en: "Pork hock, cooked", hu: "Csülök" } };

  it('"validated" (a real gate confirmed same_identity) writes full trust (0.95)', async () => {
    const { prisma, aliases } = fakePrisma();
    await learnSearchAlias(prisma, porkHock, "csülök", "hu", "validated");
    expect(aliases).toContainEqual(expect.objectContaining({ normalizedAlias: "csulok", kind: "dynamic_search", confidence: 0.95 }));
  });

  it('"rejected" (a real gate explicitly said this is NOT the same identity) never writes an alias at all — the mustár/mustárlevél case', async () => {
    const { prisma, aliases } = fakePrisma();
    await learnSearchAlias(prisma, mustardGreens, "mustár", "hu", "rejected");
    expect(aliases).toEqual([]);
  });

  it('"unknown" (no real gate configured, or a transient provider failure) preserves the original pre-checkpoint behavior (0.7 — a candidate, never full trust)', async () => {
    const { prisma, aliases } = fakePrisma();
    await learnSearchAlias(prisma, mustardGreens, "mustár", "hu", "unknown");
    expect(aliases).toContainEqual(expect.objectContaining({ normalizedAlias: "mustar", kind: "dynamic_search", confidence: 0.7 }));
  });

  it("defaults to \"unknown\" (0.7) when no verdict is passed at all — every pre-existing caller keeps compiling and behaving unchanged", async () => {
    const { prisma, aliases } = fakePrisma();
    await learnSearchAlias(prisma, porkHock, "csülök", "hu");
    expect(aliases).toContainEqual(expect.objectContaining({ confidence: 0.7 }));
  });

  it("hasSemanticCoverage is still checked FIRST — a validated verdict cannot rescue a phrase with zero lexical relationship to the food", async () => {
    const { prisma, aliases } = fakePrisma();
    await learnSearchAlias(prisma, mustardGreens, "gefüllte Kohlrouladen", "de", "validated");
    expect(aliases).toEqual([]);
  });

  it("re-learning the identical alias with a NEW validated verdict upgrades an existing low-confidence row's own confidence (self-healing, no migration)", async () => {
    const { prisma, aliases } = fakePrisma();
    await learnSearchAlias(prisma, porkHock, "csülök", "hu", "unknown");
    expect(aliases).toContainEqual(expect.objectContaining({ confidence: 0.7 }));
    await learnSearchAlias(prisma, porkHock, "csülök", "hu", "validated");
    expect(aliases).toHaveLength(1);
    expect(aliases[0]).toMatchObject({ confidence: 0.95 });
  });
});

describe("computeAliasSemanticVerdict", () => {
  const food = { id: "food-1", name: "Mustard greens, raw", originalName: "Mustard greens, raw" };

  it("returns \"unknown\" with zero calls when no real gate is configured", async () => {
    const checkRelevance = vi.fn();
    const result = await computeAliasSemanticVerdict({ id: "disabled", checkRelevance } as any, "mustár", food, "hu");
    expect(result).toBe("unknown");
    expect(checkRelevance).not.toHaveBeenCalled();
  });

  it("returns \"validated\" when the real gate approves the candidate", async () => {
    const provider: SemanticCandidateGateProvider = { id: "real", checkRelevance: async (_o, candidates) => new Map(candidates.map((c) => [c.id, true])) };
    const result = await computeAliasSemanticVerdict(provider, "csülök", { id: "pork-hock", name: "Pork hock, cooked" }, "hu");
    expect(result).toBe("validated");
  });

  it('returns "rejected" when a real gate explicitly does not approve the candidate (fail-closed — absence IS a rejection, not "unknown")', async () => {
    const provider: SemanticCandidateGateProvider = { id: "real", checkRelevance: async () => new Map() };
    const result = await computeAliasSemanticVerdict(provider, "mustár", food, "hu");
    expect(result).toBe("rejected");
  });

  it('returns "unknown" (never blocks) on a transient provider failure', async () => {
    const provider: SemanticCandidateGateProvider = { id: "real", checkRelevance: async () => { throw new Error("timeout"); } };
    const result = await computeAliasSemanticVerdict(provider, "mustár", food, "hu");
    expect(result).toBe("unknown");
  });
});

// DATABASE MISS -> AUTHORITATIVE EXTERNAL EVIDENCE FALLBACK (2026-09-16):
// resolveFromSearchTerm's new terminal branch. attemptWebEvidenceFallback and
// persistWebEvidenceFood are mocked here — their own internals (search ->
// fetch -> extract -> ground -> identity-gate -> persist) are covered in
// web-evidence-fallback.test.ts; this file only proves the INTEGRATION: when
// the hook fires, when it doesn't, and that a success reuses the exact same
// write-path alias-safety machinery as every other resolved outcome.
vi.mock("./web-evidence-fallback.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./web-evidence-fallback.js")>();
  return { ...actual, attemptWebEvidenceFallback: vi.fn(), persistWebEvidenceFood: vi.fn() };
});

describe("resolveDynamicFood: web-evidence fallback hook-in", () => {
  beforeEach(() => vi.clearAllMocks());

  const evidenceFood = { id: "food-web-1", name: "Cauliflower, raw", originalName: "Cauliflower, raw", names: { en: "Cauliflower, raw", hu: "Karfiol, nyers" } };
  const evidence = {
    sourceUrl: "https://example.gov/cauliflower", sourceDomain: "example.gov", sourceTitle: "Cauliflower",
    sourceTier: "tier_a_official" as const, retrievedAt: "2026-09-16T00:00:00.000Z", requestedIdentity: "karfiol", canonicalIdentity: "cauliflower",
    sourceFoodName: "Cauliflower, raw", basisAmountGrams: 100, kcalPer100g: 25, proteinPer100g: 2, fatPer100g: 0.3, carbsPer100g: 5, fiberPer100g: 2,
    extractionMethod: "llm_grounded" as const, evidenceExcerpt: "25 kcal", energyConsistent: true, confidence: 0.9
  };
  const webEvidenceDeps = { searchProvider: { id: "tavily" } as any, extractionProvider: { id: "groq" } as any, rateLimiter: { consume: () => true } as any };

  it("a genuine local+external miss (not_found) triggers the fallback; success returns resolved and learns an alias via the normal verdict machinery", async () => {
    const { attemptWebEvidenceFallback, persistWebEvidenceFood } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue({ evidence, diagnostics: {} as any });
    vi.mocked(persistWebEvidenceFood).mockResolvedValue(evidenceFood);
    const { prisma, aliases } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "karfiol" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "cauliflower", searchTerms: ["cauliflower"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      webEvidenceFallback: webEvidenceDeps
    });
    expect(result).toMatchObject({ status: "resolved", food: evidenceFood });
    expect(persistWebEvidenceFood).toHaveBeenCalledWith(prisma, evidence);
    // Same write-path safety as every other resolved outcome: a learned alias exists.
    expect(aliases).toHaveLength(1);
    expect(aliases[0]).toMatchObject({ foodId: "food-web-1", kind: "dynamic_search" });
  });

  it("the fallback ALSO failing (returns null) still produces the ordinary unresolved(not_found) outcome — never a crash, never a silent guess", async () => {
    const { attemptWebEvidenceFallback, persistWebEvidenceFood } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const { prisma, foods } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "kecsege" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "sterlet", searchTerms: ["sterlet"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      webEvidenceFallback: webEvidenceDeps
    });
    expect(result).toEqual({
      status: "unresolved", reason: "not_found", webEvidenceDiagnostics: undefined,
      resolutionDiagnostics: { searchTerm: "sterlet", via: "search_intent", authoritativeReason: "not_found", rawCandidateCount: 0, structurallyValidCount: 0, webEvidenceAttempted: true }
    });
    expect(foods).toHaveLength(0);
    expect(persistWebEvidenceFood).not.toHaveBeenCalled();
  });

  // Production effectiveness RCA (2026-09-17): re-reviewed independently
  // what "invalid_external_data" actually means in resolveAuthoritativeFood
  // (external-food.ts) — it is set ONLY when adapters returned raw
  // candidates but EVERY one failed the purely STRUCTURAL
  // validateExternalCandidate check (missing macros, wrong host), which runs
  // strictly BEFORE the semantic-candidate-gate is ever consulted. A genuine
  // identity/security rejection instead produces "not_found" (already
  // eligible below), never "invalid_external_data" — so a structurally
  // incomplete USDA/OFF stub for an unrelated candidate has no bearing on
  // whether an independent, fully-gated (tier/domain/SSRF/grounding/
  // identity) web source should even get a chance. Reproduced live: a
  // USDA branded-food entry missing required macros for "Heinz Baked Beans"
  // silently prevented web-evidence from ever running at all. Widened so
  // this reason is now ALSO eligible — every other safety gate on the web-
  // evidence path itself is completely unchanged (see the adversarial test
  // right below, proving a genuine identity rejection still fails closed).
  it('reason "invalid_external_data" (a candidate DID exist but failed structural validation) now ALSO triggers the fallback — a data-quality problem in one source says nothing about another', async () => {
    const { attemptWebEvidenceFallback, persistWebEvidenceFood } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue({ evidence, diagnostics: {} as any });
    vi.mocked(persistWebEvidenceFood).mockResolvedValue(evidenceFood);
    const { prisma, aliases } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "karfiol" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "cauliflower", searchTerms: ["cauliflower"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [{ not: "a valid candidate shape" }] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      webEvidenceFallback: webEvidenceDeps
    });
    expect(attemptWebEvidenceFallback).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ status: "resolved", food: evidenceFood });
    expect(aliases).toHaveLength(1);
  });

  it('reason "invalid_external_data" -> web-evidence ALSO finding nothing still produces the ordinary unresolved outcome with the correct diagnostics, never a crash', async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const { prisma } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [{ not: "a valid candidate shape" }] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      webEvidenceFallback: webEvidenceDeps
    });
    expect(result).toEqual({
      status: "unresolved", reason: "invalid_external_data", webEvidenceDiagnostics: undefined,
      resolutionDiagnostics: { searchTerm: "pork hock", via: "search_intent", authoritativeReason: "invalid_external_data", rawCandidateCount: 1, structurallyValidCount: 0, webEvidenceAttempted: true }
    });
  });

  // Phase 17 adversarial requirement: widening WHEN web-evidence is
  // attempted must never let it override an EARLIER genuine security/
  // identity rejection. A candidate the semantic gate correctly rejects
  // (wrong product) produces "not_found", not "invalid_external_data" — it
  // was ALREADY eligible for web-evidence before this change, and the web-
  // evidence attempt is still independently subject to its own identity
  // gate (see web-evidence-fallback.test.ts), so nothing here weakens that.
  it("adversarial: a semantic-gate identity rejection (wrong product, not incomplete data) still cannot be bypassed by widening invalid_external_data eligibility", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const { prisma } = fakePrisma();
    // A structurally VALID but wrong-identity candidate — the semantic gate
    // rejects it, which must still land on "not_found", never
    // "invalid_external_data" (proving the two reasons stay genuinely
    // distinct after this change).
    const rejectingGate = { id: "fixture", checkRelevance: async () => new Map([["0", false]]) };
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [pork()] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: rejectingGate as any,
      webEvidenceFallback: webEvidenceDeps
    });
    expect((result as any).reason).toBe("not_found");
    expect((result as any).resolutionDiagnostics.authoritativeReason).toBe("not_found");
  });

  it("Phase 24 regression: the fallback is never even attempted when the ordinary pipeline already resolves the food", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockClear();
    const { prisma } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [pork()] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      webEvidenceFallback: webEvidenceDeps
    });
    expect(result).toMatchObject({ status: "resolved" });
    expect(attemptWebEvidenceFallback).not.toHaveBeenCalled();
  });

  it("no webEvidenceFallback dep wired at all (e.g. WEB_SEARCH_PROVIDER unset) -> byte-for-byte the pre-existing unresolved behavior, zero new calls", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockClear();
    const { prisma, foods } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "teljesen ismeretlen étel" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "unknown", searchTerms: ["unknown food xyz"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1"
    });
    expect(result).toEqual({
      status: "unresolved", reason: "not_found", webEvidenceDiagnostics: undefined,
      resolutionDiagnostics: { searchTerm: "unknown food xyz", via: "search_intent", authoritativeReason: "not_found", rawCandidateCount: 0, structurallyValidCount: 0, webEvidenceAttempted: false }
    });
    expect(foods).toHaveLength(0);
    expect(attemptWebEvidenceFallback).not.toHaveBeenCalled();
  });
});

// FINAL FALLBACK: AI-ESTIMATED NUTRITION (2026-09-16) — resolveFromSearchTerm's
// final tier, tried only after web evidence ALSO genuinely fails.
describe("resolveDynamicFood: AI-estimation final-fallback hook-in", () => {
  const goodEstimate = {
    canonicalFoodName: "Crucian carp, raw", basisGrams: 100 as const,
    kcalPer100g: 97, proteinPer100g: 17.8, fatPer100g: 2.7, carbsPer100g: 0, fiberPer100g: 0,
    confidence: "low" as const, assumptions: "Assumed a typical raw whole-fish composition.", identityConfidence: "medium" as const
  };
  function aiDeps(overrides: Partial<{ provider: any; rateLimiter: any }> = {}) {
    return {
      provider: overrides.provider ?? { id: "groq", estimate: async () => goodEstimate },
      rateLimiter: overrides.rateLimiter ?? { consume: () => true }
    };
  }

  it("web evidence ALSO fails (null) -> AI estimation is attempted and returns ai_estimate_pending, never auto-persisted", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const { prisma, foods } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "kárász" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "crucian carp", searchTerms: ["crucian carp"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      webEvidenceFallback: { searchProvider: { id: "tavily" } as any, extractionProvider: { id: "groq" } as any, rateLimiter: { consume: () => true } as any },
      aiEstimation: aiDeps()
    });
    expect(result).toMatchObject({ status: "ai_estimate_pending", estimate: goodEstimate, requestedIdentity: "kárász" });
    // Load-bearing: nothing was ever written to the Food table.
    expect(foods).toHaveLength(0);
  });

  it("no webEvidenceFallback dep at all, but AI estimation IS wired -> still reaches AI estimation (the chain degrades per-tier independently)", async () => {
    const { prisma, foods } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "kárász" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "crucian carp", searchTerms: ["crucian carp"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      aiEstimation: aiDeps()
    });
    expect(result).toMatchObject({ status: "ai_estimate_pending" });
    expect(foods).toHaveLength(0);
  });

  it("AI estimation ALSO returns null -> falls through to the ordinary unresolved outcome, never a crash", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "kárász" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "crucian carp", searchTerms: ["crucian carp"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      aiEstimation: aiDeps({ provider: { id: "groq", estimate: async () => null } })
    });
    expect(result).toEqual({
      status: "unresolved", reason: "not_found", webEvidenceDiagnostics: undefined,
      resolutionDiagnostics: { searchTerm: "crucian carp", via: "search_intent", authoritativeReason: "not_found", rawCandidateCount: 0, structurallyValidCount: 0, webEvidenceAttempted: false }
    });
  });

  it("Part O: a previously-accepted private Food for the SAME user is reused instead of spending a fresh AI call", async () => {
    const { prisma, foods } = fakePrisma({ seedFoods: [{ id: "private-1", name: "Crucian carp, raw", createdById: "user-1", source: "ai_estimated", searchText: "crucian carp raw karasz", kcalPer100g: 97, proteinPer100g: 17.8, fatPer100g: 2.7, carbsPer100g: 0, fiberPer100g: 0 }] });
    const estimate = vi.fn(async () => goodEstimate);
    const result = await resolveDynamicFood(prisma, { foodQuery: "kárász" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "crucian carp", searchTerms: ["crucian carp"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      aiEstimation: aiDeps({ provider: { id: "groq", estimate } })
    });
    expect(result).toMatchObject({ status: "resolved", food: expect.objectContaining({ id: "private-1" }) });
    expect(estimate).not.toHaveBeenCalled();
    expect(foods).toHaveLength(1); // no duplicate created
  });

  it("cost-efficiency (2026-09-16 live-staging finding): the reuse check runs BEFORE web-evidence discovery too — a repeat query never re-attempts a real search/fetch just to discard it", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockClear();
    const { prisma, foods } = fakePrisma({ seedFoods: [{ id: "private-1", name: "Crucian carp, raw", createdById: "user-1", source: "ai_estimated", searchText: "crucian carp raw karasz", kcalPer100g: 97, proteinPer100g: 17.8, fatPer100g: 2.7, carbsPer100g: 0, fiberPer100g: 0 }] });
    const estimate = vi.fn(async () => goodEstimate);
    const result = await resolveDynamicFood(prisma, { foodQuery: "kárász" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "crucian carp", searchTerms: ["crucian carp"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      webEvidenceFallback: { searchProvider: { id: "tavily" } as any, extractionProvider: { id: "groq" } as any, rateLimiter: { consume: () => true } as any },
      aiEstimation: aiDeps({ provider: { id: "groq", estimate } })
    });
    expect(result).toMatchObject({ status: "resolved", food: expect.objectContaining({ id: "private-1" }) });
    expect(attemptWebEvidenceFallback).not.toHaveBeenCalled();
    expect(estimate).not.toHaveBeenCalled();
    expect(foods).toHaveLength(1);
  });

  it("Part W (P0): a DIFFERENT user's private Food is never reused — only this exact user's own createdById scope is queried", async () => {
    const { prisma } = fakePrisma({ seedFoods: [{ id: "private-1", name: "Crucian carp, raw", createdById: "user-OTHER", source: "ai_estimated", searchText: "crucian carp raw karasz", kcalPer100g: 97, proteinPer100g: 17.8, fatPer100g: 2.7, carbsPer100g: 0, fiberPer100g: 0 }] });
    const estimate = vi.fn(async () => goodEstimate);
    const result = await resolveDynamicFood(prisma, { foodQuery: "kárász" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "crucian carp", searchTerms: ["crucian carp"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      aiEstimation: aiDeps({ provider: { id: "groq", estimate } })
    });
    // user-1 has no private food of their own -> falls through to a fresh AI estimate, never user-OTHER's row.
    expect(result).toMatchObject({ status: "ai_estimate_pending" });
    expect(estimate).toHaveBeenCalledOnce();
  });

  it("rate-limited AI-estimation user -> falls through to unresolved, never calls the provider", async () => {
    const { prisma } = fakePrisma();
    const estimate = vi.fn(async () => goodEstimate);
    const result = await resolveDynamicFood(prisma, { foodQuery: "kárász" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "crucian carp", searchTerms: ["crucian carp"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      aiEstimation: aiDeps({ provider: { id: "groq", estimate }, rateLimiter: { consume: () => false } })
    });
    expect(result).toEqual({
      status: "unresolved", reason: "not_found", webEvidenceDiagnostics: undefined,
      resolutionDiagnostics: { searchTerm: "crucian carp", via: "search_intent", authoritativeReason: "not_found", rawCandidateCount: 0, structurallyValidCount: 0, webEvidenceAttempted: false }
    });
    expect(estimate).not.toHaveBeenCalled();
  });

  it("Phase 24-equivalent regression: AI estimation is never attempted when the ordinary pipeline already resolves the food", async () => {
    const { prisma } = fakePrisma();
    const estimate = vi.fn(async () => goodEstimate);
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [pork()] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      aiEstimation: aiDeps({ provider: { id: "groq", estimate } })
    });
    expect(result).toMatchObject({ status: "resolved" });
    expect(estimate).not.toHaveBeenCalled();
  });

  it("malformed/null provider output never crashes and never fabricates a Food", async () => {
    const { prisma, foods } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "kárász" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "crucian carp", searchTerms: ["crucian carp"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      aiEstimation: aiDeps({ provider: { id: "groq", estimate: async () => { throw new Error("provider down"); } } })
    }).catch((e) => ({ threw: e }));
    // The provider itself is documented to fail-closed to null, never throw —
    // this proves the CALLER also survives if a misbehaving provider did throw.
    expect((result as any).threw).toBeUndefined();
    expect(foods).toHaveLength(0);
  });
});

// PRODUCTION EFFECTIVENESS RCA — convergence-gate fallback continuation
// (2026-09-17). Live staging investigation reproduced, for Vegemite,
// Marmite, and plain "brokkoli" (proving it is NOT brand-specific): a
// confident "resolved" outcome from resolveAuthoritativeFood that then
// failed the convergence re-check against the user's literal identity
// returned a bare, diagnostics-blind "unresolved" — web-evidence and
// AI-estimate were never attempted at all, because both only ever ran
// inside resolveFromSearchTerm's OWN "unresolved" handling, which this path
// never reached (the status was "resolved", just later rejected by the
// caller). The fix centralizes the convergence check into
// resolveFromSearchTerm itself so a rejection can fall through to the SAME
// fallback chain a genuine miss gets.
describe("resolveDynamicFood: convergence-gate rejection now continues to the fallback chain", () => {
  beforeEach(() => vi.clearAllMocks());

  const webEvidenceDeps = { searchProvider: { id: "tavily" } as any, extractionProvider: { id: "groq" } as any, rateLimiter: { consume: () => true } as any };
  // A confident LOCAL match resolveAuthoritativeFood would return for a
  // search-intent term that has genericized a specific brand away — e.g.
  // "Vegemite" -> "yeast extract spread", which matches this pre-existing
  // generic catalog entry. Deliberately shares NO lexical tokens with
  // "Vegemite" itself (the exact live-reproduced shape).
  const genericSpread = { id: "local-yeast-extract", name: "Yeast extract spread", originalName: "Yeast extract spread", names: { en: "Yeast extract spread" }, match: { stage: "exact", score: 100 } };

  function fakePrismaWithLocal(localFood: any) {
    const foods: any[] = [];
    const aliases: any[] = [];
    const prisma: any = {
      food: {
        findUnique: async () => null,
        findMany: async (args: any) => {
          if (args?.where?.id?.in) return foods.filter((f) => args.where.id.in.includes(f.id)).map((f) => ({ ...f, servings: [] }));
          // resolveAuthoritativeFood's own local search — always returns the
          // seeded local candidate as a TRUSTED match, simulating a genuinely
          // confident (not weak) local hit.
          return [{ ...localFood, servings: [] }];
        },
        create: async ({ data }: any) => { const f = { id: `food-${foods.length}`, ...data }; foods.push(f); return f; },
        findFirst: async () => null
      },
      foodAlias: {
        findFirst: async () => null,
        findMany: async () => [],
        createMany: async () => ({ count: 1 }),
        upsert: async ({ where, update, create }: any) => {
          const key = where.foodId_normalizedAlias_locale;
          const existing = aliases.find((a) => a.foodId === key.foodId && a.normalizedAlias === key.normalizedAlias && a.locale === key.locale);
          if (existing) { Object.assign(existing, update); return existing; }
          const row = { foodId: create.foodId, alias: create.alias, normalizedAlias: create.normalizedAlias, locale: create.locale, kind: create.kind, confidence: create.confidence };
          aliases.push(row);
          return row;
        }
      },
      nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
      foodNutrient: { create: async () => ({}) },
      $transaction: async (fn: any) => fn(prisma)
    };
    return { prisma, foods, aliases };
  }

  it("1: discards the rejected LOCAL candidate outright — it is never returned, in any outcome", async () => {
    const { prisma } = fakePrismaWithLocal(genericSpread);
    const result = await resolveDynamicFood(prisma, { foodQuery: "Vegemite" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "yeast extract spread", searchTerms: ["yeast extract spread"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate()
    });
    expect((result as any).food?.id).not.toBe("local-yeast-extract");
    expect((result as any).food?.name).not.toBe("Yeast extract spread");
  });

  it("2: continues to web-evidence after rejection, searching with the ORIGINAL identity (not the rejected candidate's name)", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const { prisma } = fakePrismaWithLocal(genericSpread);
    await resolveDynamicFood(prisma, { foodQuery: "Vegemite" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "yeast extract spread", searchTerms: ["yeast extract spread"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      webEvidenceFallback: webEvidenceDeps
    });
    expect(attemptWebEvidenceFallback).toHaveBeenCalledOnce();
    const [, originalIdentityArg] = vi.mocked(attemptWebEvidenceFallback).mock.calls[0];
    // The SEARCH TERM (first arg) may legitimately still be the generic
    // translation (that's what a real search needs) — what must NEVER
    // regress is the second arg, the identity the eventual evidence is
    // validated against, staying the user's own literal phrase.
    expect(originalIdentityArg).toBe("Vegemite");
  });

  it("3: a web-evidence SUCCESS after convergence rejection returns web_evidence — never the rejected local candidate", async () => {
    const { attemptWebEvidenceFallback, persistWebEvidenceFood } = await import("./web-evidence-fallback.js");
    const evidence = {
      sourceUrl: "https://vegemite.com.au/product", sourceDomain: "vegemite.com.au", sourceTitle: "Vegemite",
      sourceTier: "tier_b_manufacturer" as const, retrievedAt: "2026-09-17T00:00:00.000Z", requestedIdentity: "Vegemite", canonicalIdentity: "yeast extract spread",
      sourceFoodName: "Vegemite", basisAmountGrams: 100, kcalPer100g: 180, proteinPer100g: 22, fatPer100g: 0.9, carbsPer100g: 20, fiberPer100g: 3.4,
      extractionMethod: "json_ld" as const, evidenceExcerpt: "180 kcal", energyConsistent: true, confidence: 0.9
    };
    const evidenceFood = { id: "food-vegemite-1", name: "Vegemite", originalName: "Vegemite", names: { en: "Vegemite" }, source: "web_evidence" };
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue({ evidence, diagnostics: {} as any });
    vi.mocked(persistWebEvidenceFood).mockResolvedValue(evidenceFood);
    const { prisma } = fakePrismaWithLocal(genericSpread);
    const result = await resolveDynamicFood(prisma, { foodQuery: "Vegemite" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "yeast extract spread", searchTerms: ["yeast extract spread"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      webEvidenceFallback: webEvidenceDeps
    });
    expect(result).toMatchObject({ status: "resolved", food: evidenceFood });
    expect((result as any).food.name).toBe("Vegemite");
  });

  it("4: web-evidence FAILURE after convergence rejection continues to AI estimate", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const estimate = { canonicalFoodName: "Vegemite", basisGrams: 100 as const, kcalPer100g: 180, proteinPer100g: 22, fatPer100g: 0.9, carbsPer100g: 20, fiberPer100g: 3.4, confidence: "low" as const, assumptions: "Estimated typical values.", identityConfidence: "medium" as const };
    const { prisma } = fakePrismaWithLocal(genericSpread);
    const result = await resolveDynamicFood(prisma, { foodQuery: "Vegemite" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "yeast extract spread", searchTerms: ["yeast extract spread"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      webEvidenceFallback: webEvidenceDeps,
      aiEstimation: { provider: { id: "groq", estimate: async () => estimate }, rateLimiter: { consume: () => true } }
    });
    expect(result).toMatchObject({ status: "ai_estimate_pending", requestedIdentity: "Vegemite" });
  });

  it("5: AI-estimate ALSO failing ends safely unresolved, with resolutionDiagnostics.authoritativeReason = 'convergence_rejected' (never crashes, never leaks the rejected candidate)", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const { prisma } = fakePrismaWithLocal(genericSpread);
    const result = await resolveDynamicFood(prisma, { foodQuery: "Vegemite" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "yeast extract spread", searchTerms: ["yeast extract spread"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      webEvidenceFallback: webEvidenceDeps,
      aiEstimation: { provider: { id: "groq", estimate: async () => null }, rateLimiter: { consume: () => true } }
    });
    expect(result).toMatchObject({
      status: "unresolved",
      resolutionDiagnostics: { searchTerm: "yeast extract spread", authoritativeReason: "convergence_rejected", webEvidenceAttempted: true }
    });
  });

  it("6: web-evidence is attempted AT MOST ONCE per resolution, even after a convergence rejection (no duplicate search/fetch cost)", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const { prisma } = fakePrismaWithLocal(genericSpread);
    await resolveDynamicFood(prisma, { foodQuery: "Vegemite" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "yeast extract spread", searchTerms: ["yeast extract spread"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      webEvidenceFallback: webEvidenceDeps,
      aiEstimation: { provider: { id: "groq", estimate: async () => null }, rateLimiter: { consume: () => true } }
    });
    expect(attemptWebEvidenceFallback).toHaveBeenCalledTimes(1);
  });

  it("7: a REJECTED EXTERNAL candidate (not just local) is discarded the same way — proves both resolved_local and resolved_external converge through the same gate", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const { prisma } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "Vegemite" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "yeast extract spread", searchTerms: ["yeast extract spread"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [pork({ sourceId: "999", name: "Yeast extract spread", originalName: "Yeast extract spread", names: { en: "Yeast extract spread" }, normalizedName: "yeast extract spread" })] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: permissiveSemanticGate(),
      webEvidenceFallback: webEvidenceDeps
    });
    expect((result as any).food?.name).not.toBe("Yeast extract spread");
    expect(attemptWebEvidenceFallback).toHaveBeenCalledOnce();
  });

  // Phase 9 adversarial identity tests — the fallback continuation must
  // never become a way to smuggle a wrong identity through.
  describe("adversarial: rejected candidate never leaks into the result under any circumstance", () => {
    it("specific branded food vs generic category: the generic candidate's OWN macros never appear in a subsequent unresolved/ai_estimate_pending result", async () => {
      const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
      vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
      const { prisma } = fakePrismaWithLocal({ ...genericSpread, kcalPer100g: 200 });
      const result = await resolveDynamicFood(prisma, { foodQuery: "Vegemite" }, {
        searchIntentProvider: stubSearchIntent({ canonicalConcept: "yeast extract spread", searchTerms: ["yeast extract spread"] }),
        adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
        rateLimiter: new DynamicFoodResolutionRateLimiter(),
        userId: "user-1",
        semanticCandidateGateProvider: permissiveSemanticGate(),
        webEvidenceFallback: webEvidenceDeps
      });
      expect(result.status).toBe("unresolved");
      expect(JSON.stringify(result)).not.toContain("Yeast extract spread");
    });

    it("product variant A vs B: a local match for the WRONG variant is rejected, never silently accepted as the requested variant", async () => {
      const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
      vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
      const zeroSugarVariant = { id: "local-coke-zero", name: "Coca-Cola Zero Sugar", originalName: "Coca-Cola Zero Sugar", names: { en: "Coca-Cola Zero Sugar" }, match: { stage: "exact", score: 100 } };
      const { prisma } = fakePrismaWithLocal(zeroSugarVariant);
      const result = await resolveDynamicFood(prisma, { foodQuery: "Coca-Cola Original Taste" }, {
        searchIntentProvider: stubSearchIntent({ canonicalConcept: "cola", searchTerms: ["cola"] }),
        adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
        rateLimiter: new DynamicFoodResolutionRateLimiter(),
        userId: "user-1",
        semanticCandidateGateProvider: permissiveSemanticGate(),
        webEvidenceFallback: webEvidenceDeps
      });
      expect((result as any).food?.name).not.toBe("Coca-Cola Zero Sugar");
    });

    it("raw ingredient vs prepared derivative: a match for a differently-prepared form of an unrelated word is rejected, not silently substituted", async () => {
      const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
      vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
      const tomatoSauce = { id: "local-tomato-sauce", name: "Tomato sauce, canned", originalName: "Tomato sauce, canned", names: { en: "Tomato sauce, canned" }, match: { stage: "exact", score: 100 } };
      const { prisma } = fakePrismaWithLocal(tomatoSauce);
      const result = await resolveDynamicFood(prisma, { foodQuery: "paradicsom" }, {
        searchIntentProvider: stubSearchIntent({ canonicalConcept: "tomato sauce", searchTerms: ["tomato sauce"] }),
        adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }],
        rateLimiter: new DynamicFoodResolutionRateLimiter(),
        userId: "user-1",
        semanticCandidateGateProvider: permissiveSemanticGate(),
        webEvidenceFallback: webEvidenceDeps
      });
      expect((result as any).food?.name).not.toBe("Tomato sauce, canned");
    });
  });

  it("security: a candidate the semantic gate itself already rejects (not merely a convergence mismatch) still fails closed as 'not_found', unaffected by this change", async () => {
    const { attemptWebEvidenceFallback } = await import("./web-evidence-fallback.js");
    vi.mocked(attemptWebEvidenceFallback).mockResolvedValue(null);
    const rejectingGate = { id: "fixture", checkRelevance: async () => new Map([["0", false]]) };
    const { prisma } = fakePrisma();
    const result = await resolveDynamicFood(prisma, { foodQuery: "csülök" }, {
      searchIntentProvider: stubSearchIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"] }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [pork()] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(),
      userId: "user-1",
      semanticCandidateGateProvider: rejectingGate as any,
      webEvidenceFallback: webEvidenceDeps
    });
    // Reached via resolveAuthoritativeFood's OWN "not_found" (semantic-gate
    // rejection), never via this change's "convergence_rejected" — proving
    // the two stay genuinely distinct and this change didn't touch that path.
    expect((result as any).resolutionDiagnostics?.authoritativeReason).toBe("not_found");
  });
});
