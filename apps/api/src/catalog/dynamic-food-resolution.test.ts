import { describe, expect, it, vi } from "vitest";
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
    names: { en: "Pork hock, cooked" }, kcalPer100g: 280, fatPer100g: 22, proteinPer100g: 20, carbsPer100g: 0, fiberPer100g: 0, nutrients: [],
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
      create: async ({ data }: any) => { const food = { id: `food-${foods.length}`, ...data }; foods.push(food); return food; }
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
    expect(result).toEqual({ status: "unresolved", reason: "not_found" });
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
    expect(result).toEqual({ status: "unresolved", reason: "external_unavailable" });
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
