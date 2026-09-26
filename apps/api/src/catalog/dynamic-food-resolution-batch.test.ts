import { describe, expect, it, vi } from "vitest";
import { resolveManyAuthoritativeFoods, type BatchAuthoritativeDeps, type PendingAuthoritativeResolution } from "./dynamic-food-resolution-batch.js";
import { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";
import type { RecipeSemanticGateProvider } from "./semantic-candidate-gate-batch.js";
import type { CandidateLocalizationProvider } from "./candidate-localization.js";
import type { ExternalFoodCandidate } from "./external-food.js";
import type { SemanticCandidateGateProvider } from "./semantic-candidate-gate.js";
import type { SemanticRecovery, SemanticRecoveryProvider } from "./semantic-recovery.js";

function fakePrisma() {
  const persisted: any[] = [];
  const prisma: any = {
    food: {
      findUnique: async () => null,
      findMany: async () => [], // no local duplicates by default
      create: async ({ data }: any) => { const food = { id: `persisted-${persisted.length}`, ...data }; persisted.push(food); return food; }
    },
    foodAlias: { findFirst: async () => null, findMany: async () => [], createMany: async () => ({ count: 1 }), upsert: vi.fn(async ({ create }: any) => create) },
    nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
    foodNutrient: { create: async () => ({}) },
    $transaction: async (fn: any) => fn(prisma)
  };
  return { prisma, persisted };
}

function candidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "1", originalName: "Garlic, raw", name: "Garlic, raw",
    names: { en: "Garlic, raw" }, kcalPer100g: 149, fatPer100g: 0.5, proteinPer100g: 6.4, carbsPer100g: 33, fiberPer100g: 2.1, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "1", sourceUrl: "https://fdc.nal.usda.gov/1", retrievedAt: "2026-09-15T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/1", normalizedName: "garlic raw", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-15T00:00:00.000Z", confidence: 0.6, matchPolicy: "review_required", language: "en",
    autoAcceptEligible: true, ...overrides
  };
}

function approvingGate(approve: (ingredientIdentity: string, candidateName: string) => boolean = () => true): RecipeSemanticGateProvider {
  return {
    id: "fixture",
    checkRelevanceBatch: async (input) => {
      const map = new Map();
      for (const ing of input.ingredients) for (const c of ing.candidates) {
        if (approve(ing.identity, c.authoritativeName)) map.set(`${ing.index}:${c.index}`, { relationship: "same_identity", formCompatibility: "compatible", contextualFit: "best_match" });
      }
      return map;
    }
  };
}

function identityLocalization(): CandidateLocalizationProvider {
  return { id: "fixture", localize: async (items) => new Map(items.map((i) => [i.id, i.authoritativeName])) };
}

function baseDeps(overrides: Partial<BatchAuthoritativeDeps> = {}): BatchAuthoritativeDeps {
  return {
    adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }],
    rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1",
    semanticGateProvider: approvingGate(), ...overrides
  };
}

function pendingFor(id: string, identity: string): PendingAuthoritativeResolution {
  return { id, canonicalIdentity: identity, originalIdentity: identity, rawIngredient: identity };
}

describe("resolveManyAuthoritativeFoods", () => {
  it("no pending items -> empty map, zero calls", async () => {
    const { prisma } = fakePrisma();
    const gate = approvingGate();
    const spy = vi.spyOn(gate, "checkRelevanceBatch");
    const result = await resolveManyAuthoritativeFoods(prisma, [], baseDeps({ semanticGateProvider: gate }));
    expect(result.size).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it("no adapters configured -> every pending item unresolved(no_adapters), zero gate calls", async () => {
    const { prisma } = fakePrisma();
    const gate = approvingGate();
    const spy = vi.spyOn(gate, "checkRelevanceBatch");
    const result = await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "onion")], baseDeps({ adapters: [], semanticGateProvider: gate }));
    expect(result.get("a")).toEqual({ status: "unresolved", reason: "no_adapters" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("rate-limited items are marked unresolved(reason=rate_limited) and never reach search or the gate", async () => {
    const { prisma } = fakePrisma();
    const limiter = new DynamicFoodResolutionRateLimiter(Date.now, { windowMs: 60_000, limit: 1 });
    const lookup = vi.fn(async () => [candidate()]);
    const result = await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "garlic"), pendingFor("b", "garlic")], baseDeps({ rateLimiter: limiter, adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }] }));
    const outcomes = [result.get("a"), result.get("b")];
    expect(outcomes.some((o) => o?.status === "resolved")).toBe(true); // the one allowed through resolved normally
    expect(outcomes.some((o) => o?.status === "unresolved" && (o as any).reason === "rate_limited")).toBe(true);
    expect(lookup).toHaveBeenCalledTimes(1); // the rate-limited item never reached search
  });

  it("a single same_identity+compatible survivor auto-resolves and persists", async () => {
    const { prisma, persisted } = fakePrisma();
    const result = await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "garlic")], baseDeps());
    expect(result.get("a")).toMatchObject({ status: "resolved" });
    expect(persisted).toHaveLength(1);
  });

  // Central acceptance-safety audit (2026-09-23): second confirmed P1 — this
  // file independently reimplements resolveAuthoritativeFood's "sole gate-
  // approved survivor auto-resolves" rule, and had NOT been updated with the
  // same `autoAcceptEligible` guard as the single-ingredient path. D/E prove
  // the fix; F (the test immediately above) is the pre-existing positive
  // control proving legitimate reference-source auto-resolution still works.
  it("D) an OFF name-search candidate (autoAcceptEligible: false) does not auto-persist even as the sole gate-approved survivor", async () => {
    const { prisma, persisted } = fakePrisma();
    const offHit = candidate({ source: "open_food_facts" as any, sourceId: "814553001090", sourceUrl: "https://world.openfoodfacts.org/product/814553001090", name: "Tomatoes", originalName: "Tomatoes", normalizedName: "tomatoes", confidence: 0.6, matchPolicy: "review_required", autoAcceptEligible: false });
    const result = await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "tomato")],
      baseDeps({ adapters: [{ source: "open_food_facts", sourceName: "OFF", lookup: async () => [offHit] }] }));
    expect(result.get("a")).toMatchObject({ status: "confirmation_required", reason: "weak_match" });
    expect((result.get("a") as any).candidates?.[0]?.source).toBe("open_food_facts");
    expect(persisted).toHaveLength(0);
  });

  it("E) the same blocked OFF candidate never learns a FoodAlias either — no Food write means no alias-poisoning route", async () => {
    const { prisma } = fakePrisma();
    const offHit = candidate({ source: "open_food_facts" as any, sourceId: "814553001090", sourceUrl: "https://world.openfoodfacts.org/product/814553001090", name: "Tomatoes", originalName: "Tomatoes", normalizedName: "tomatoes", confidence: 0.6, matchPolicy: "review_required", autoAcceptEligible: false });
    await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "tomato")],
      baseDeps({ adapters: [{ source: "open_food_facts", sourceName: "OFF", lookup: async () => [offHit] }] }));
    // learnSearchAlias lives inside the same `toPersist` branch this fix
    // gates — proving it was never called is the direct proof that a
    // rejected-for-auto-accept candidate cannot bootstrap a global alias
    // (trusted or otherwise) without the user ever confirming anything.
    expect(prisma.foodAlias.upsert).not.toHaveBeenCalled();
  });

  it("zero survivors after the gate -> unresolved(not_found), never persisted", async () => {
    const { prisma, persisted } = fakePrisma();
    const result = await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "garlic")], baseDeps({ semanticGateProvider: approvingGate(() => false) }));
    expect(result.get("a")).toEqual({ status: "unresolved", reason: "not_found" });
    expect(persisted).toHaveLength(0);
  });

  it("2+ survivors is genuine ambiguity -> confirmation_required, never auto-picked", async () => {
    const { prisma, persisted } = fakePrisma();
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => [candidate({ sourceId: "1" }), candidate({ sourceId: "2", name: "Garlic, raw (organic)", originalName: "Garlic, raw (organic)", normalizedName: "garlic raw organic" })] }];
    const result = await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "garlic")], baseDeps({ adapters }));
    expect(result.get("a")).toMatchObject({ status: "confirmation_required", reason: "ambiguous" });
    expect((result.get("a") as any).candidates).toHaveLength(2);
    expect(persisted).toHaveLength(0);
  });

  it("a candidate matching an EXISTING Food by source+sourceId resolves locally without re-persisting", async () => {
    const { prisma } = fakePrisma();
    const existing = { id: "existing-garlic", source: "usda_fdc", sourceId: "1", name: "Garlic, raw", originalName: "Garlic, raw", servings: [] };
    prisma.food.findUnique = async ({ where }: any) => where.source_sourceId.sourceId === "1" ? existing : null;
    const result = await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "garlic")], baseDeps());
    expect(result.get("a")).toEqual({ status: "resolved", food: existing });
  });

  it("an OFF name-search (non-eligible) candidate matching an EXISTING Food by source+sourceId still requires confirmation and learns no alias", async () => {
    const { prisma } = fakePrisma();
    const offHit = candidate({ source: "open_food_facts" as any, sourceId: "814553001090", sourceUrl: "https://world.openfoodfacts.org/product/814553001090", name: "Tomatoes", originalName: "Tomatoes", normalizedName: "tomatoes", confidence: 0.6, matchPolicy: "review_required", autoAcceptEligible: false });
    const existing = { id: "existing-off", source: "open_food_facts", sourceId: "814553001090", name: "Tomatoes", originalName: "Tomatoes", servings: [] };
    prisma.food.findUnique = async ({ where }: any) => where.source_sourceId.sourceId === "814553001090" ? existing : null;
    const result = await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "tomato")],
      baseDeps({ adapters: [{ source: "open_food_facts", sourceName: "OFF", lookup: async () => [offHit] }] }));
    expect(result.get("a")).toMatchObject({ status: "confirmation_required", reason: "weak_match" });
    expect((result.get("a") as any).candidates?.[0]?.sourceId).toBe("814553001090");
    expect(prisma.foodAlias.upsert).not.toHaveBeenCalled();
  });

  it("a candidate matching an existing Food by NAME (different source) is possible_duplicate, not auto-resolved", async () => {
    const { prisma } = fakePrisma();
    const existingByName = { id: "existing-by-name", source: "user_input", sourceId: "other", name: "Garlic, raw", originalName: "Garlic, raw", servings: [] };
    prisma.food.findMany = async ({ where }: any) => (where?.OR ?? []).some((c: any) => c.name?.equals) ? [existingByName] : [];
    const result = await resolveManyAuthoritativeFoods(prisma, [pendingFor("a", "garlic")], baseDeps());
    expect(result.get("a")).toMatchObject({ status: "confirmation_required", reason: "possible_duplicate" });
  });

  it("MULTIPLE ingredients: the gate is called ONCE (not once per ingredient) for a whole batch within the bound", async () => {
    const { prisma } = fakePrisma();
    const gate = approvingGate();
    const spy = vi.spyOn(gate, "checkRelevanceBatch");
    const pending = Array.from({ length: 8 }, (_, i) => pendingFor(`item-${i}`, `food${i}`));
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async (q: string) => [candidate({ sourceId: String(100 + Number(q.replace("food", ""))), originalName: q, name: q, normalizedName: q })] }];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({ adapters, semanticGateProvider: gate }));
    expect(spy).toHaveBeenCalledTimes(1); // the whole 8-ingredient batch in ONE gate call
    expect(pending.every((p) => result.get(p.id)?.status === "resolved")).toBe(true);
  });

  it("MULTIPLE ingredients needing localization: ONE localization call covers many ingredients (chunked, not one-per-ingredient)", async () => {
    const { prisma } = fakePrisma();
    const localizationProvider = identityLocalization();
    const localizeSpy = vi.spyOn(localizationProvider, "localize");
    const pending = Array.from({ length: 8 }, (_, i) => pendingFor(`item-${i}`, `food${i}`));
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async (q: string) => [candidate({ sourceId: String(200 + Number(q.replace("food", ""))), originalName: q, name: q, normalizedName: q })] }];
    await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({ adapters, locale: "hu", localizationProvider }));
    // 8 candidates, chunk size 10 -> exactly one localize() call, not 8.
    expect(localizeSpy).toHaveBeenCalledTimes(1);
  });

  it("CALL-COUNT REGRESSION GUARD: 15 ingredients with 2 candidates each (30 pairs) never regresses into per-ingredient fan-out — gate calls stay in the low single digits, localization calls stay far below 15", async () => {
    const { prisma } = fakePrisma();
    const gate = approvingGate((_identity, name) => name.endsWith("-a")); // exactly one survivor per ingredient
    const gateSpy = vi.spyOn(gate, "checkRelevanceBatch");
    const localizationProvider = identityLocalization();
    const localizeSpy = vi.spyOn(localizationProvider, "localize");
    const pending = Array.from({ length: 15 }, (_, i) => pendingFor(`item-${i}`, `food${i}`));
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async (q: string) => { const n = Number(q.replace("food", "")); return [candidate({ sourceId: String(1000 + n), originalName: `${q}-a`, name: `${q}-a`, normalizedName: `${q}-a` }), candidate({ sourceId: String(2000 + n), originalName: `${q}-b`, name: `${q}-b`, normalizedName: `${q}-b` })]; } }];
    // A generous limiter here — rate limiting itself is a separate, already
    // covered concern (see the dedicated rate-limit test above); this test
    // isolates the batching behavior.
    const generousLimiter = new DynamicFoodResolutionRateLimiter(Date.now, { windowMs: 60_000, limit: 50 });
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({ adapters, semanticGateProvider: gate, localizationProvider, rateLimiter: generousLimiter }));
    expect(gateSpy.mock.calls.length).toBeLessThan(5); // NOT 15 or 30 — the whole point of batching
    expect(localizeSpy.mock.calls.length).toBeLessThan(5); // NOT 15
    expect(pending.every((p) => result.get(p.id)?.status === "resolved")).toBe(true);
  });

  it("every pending item gets an outcome entry — never silently dropped", async () => {
    const { prisma } = fakePrisma();
    const pending = [pendingFor("a", "garlic"), pendingFor("b", "unknown-thing")];
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async (q: string) => (q === "garlic" ? [candidate()] : []) }];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({ adapters }));
    expect(result.has("a")).toBe(true);
    expect(result.has("b")).toBe(true);
    expect(result.get("b")).toEqual({ status: "unresolved", reason: "not_found" });
  });
});

describe("unified food-resolution engine: the batch path now shares the single-item path's convergence gate (2026-09-23)", () => {
  it("SAME regression as the single-item path's szalonna case: a bare recipe-ingredient identity that only partially overlaps a candidate's dynamically-localized name is convergence-rejected, never resolved", async () => {
    const { prisma, persisted } = fakePrisma();
    // Mirrors the real live-reproduced Food: a USDA record whose Hungarian
    // localized name merely CONTAINS the bare ingredient word "szalonna"
    // among mostly other, unaccounted tokens — must not be trusted as a
    // confident match for that bare word, in a recipe any more than in
    // direct entry.
    // canonicalIdentity ("bacon") differs from originalIdentity ("szalonna")
    // — mirrors how a whole-recipe-context normalization pass would generate
    // an English-ish search term for a Hungarian ingredient, exactly what
    // the convergence gate exists to independently re-check afterward.
    const pending: PendingAuthoritativeResolution[] = [{ id: "ingredient-1", canonicalIdentity: "bacon", originalIdentity: "szalonna", rawIngredient: "szalonna" }];
    const adapters = [{
      source: "usda_fdc" as const, sourceName: "USDA",
      lookup: async () => [candidate({
        sourceId: "900001", originalName: "Pork, cured, bacon, unprepared", name: "Pork, cured, bacon, unprepared",
        names: { hu: "pácolt szalonna, előkészítetlen" }, normalizedName: "pork cured bacon unprepared", matchPolicy: "exact_normalized_name"
      })]
    }];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({ adapters }));
    expect(result.get("ingredient-1")).toEqual({ status: "unresolved", reason: "convergence_rejected" });
    expect(persisted).toHaveLength(0);
  });

  it("still resolves a recipe ingredient whose identity genuinely matches the candidate's own curated/original name (no false regression)", async () => {
    const { prisma } = fakePrisma();
    const pending = [pendingFor("ingredient-1", "garlic")];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps());
    expect(result.get("ingredient-1")).toMatchObject({ status: "resolved" });
  });

  it("still resolves via the FULL localized phrase — persist once, reuse forever is preserved for recipe ingredients too", async () => {
    const { prisma } = fakePrisma();
    const pending: PendingAuthoritativeResolution[] = [{ id: "ingredient-1", canonicalIdentity: "bacon", originalIdentity: "pácolt szalonna, előkészítetlen", rawIngredient: "pácolt szalonna, előkészítetlen" }];
    const adapters = [{
      source: "usda_fdc" as const, sourceName: "USDA",
      lookup: async () => [candidate({
        sourceId: "900001", originalName: "Pork, cured, bacon, unprepared", name: "Pork, cured, bacon, unprepared",
        names: { hu: "pácolt szalonna, előkészítetlen" }, normalizedName: "pork cured bacon unprepared", matchPolicy: "exact_normalized_name"
      })]
    }];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({ adapters }));
    expect(result.get("ingredient-1")).toMatchObject({ status: "resolved" });
  });
});

describe("unified food-resolution engine: bounded semantic recovery in the batch/recipe path (2026-09-23)", () => {
  function permissiveSingleGate(): SemanticCandidateGateProvider {
    return { id: "permissive-fixture", checkRelevance: async (_original, candidates) => new Map(candidates.map((c) => [c.id, true])) };
  }
  function stubRecovery(recovery: SemanticRecovery | null): SemanticRecoveryProvider {
    return { id: "stub-recovery", recover: async () => recovery };
  }

  it("resolves a recipe ingredient via bounded recovery when the deterministic batch pass alone found nothing (túró/Öl-equivalent, recipe context)", async () => {
    const { prisma } = fakePrisma();
    const calls: string[] = [];
    // Nothing in the deterministic pass matches "curdcheese" at all —
    // mirrors túró finding no BLS/USDA evidence via its own bare identity.
    const pending = [pendingFor("ingredient-1", "curdcheese")];
    const adapters = [{
      source: "usda_fdc" as const, sourceName: "USDA",
      lookup: async (q: string) => { calls.push(q); return q === "quark" ? [candidate({ sourceId: "900001", originalName: "quark curdcheese", name: "quark curdcheese", normalizedName: "quark curdcheese" })] : []; }
    }];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({
      adapters,
      semanticCandidateGateProvider: permissiveSingleGate(),
      semanticRecoveryProvider: stubRecovery({ canonicalConcept: "curd cheese", localSearchTerms: [], referenceSearchTerms: ["quark"] })
    }));
    // "curdcheese" is retried once more inside the shared engine before it
    // tries the recovered "quark" term — a small, known, accepted
    // inefficiency (one extra deterministic external lookup, not an LLM
    // call) from reusing resolveFoodConcept as-is rather than special-casing
    // "skip the first attempt" for batch callers. See STEP 5's own comment.
    expect(calls).toEqual(["curdcheese", "curdcheese", "quark"]);
    expect(result.get("ingredient-1")).toMatchObject({ status: "resolved" });
  });

  it("caps recovery attempts at the hard budget even when many recipe ingredients are unresolved", async () => {
    const { prisma } = fakePrisma();
    const recoverCalls: string[] = [];
    const recovery: SemanticRecoveryProvider = { id: "stub", recover: async (input) => { recoverCalls.push(input.foodQuery); return null; } };
    const pending = Array.from({ length: 6 }, (_, i) => pendingFor(`item-${i}`, `unknownfood${i}`));
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => [] }];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({
      adapters, semanticCandidateGateProvider: permissiveSingleGate(), semanticRecoveryProvider: recovery
    }));
    // All 6 ingredients missed deterministically, but only the hard-capped
    // budget's worth ever triggers an LLM recovery call.
    expect(recoverCalls).toHaveLength(3);
    expect(pending.every((p) => result.get(p.id)?.status === "unresolved")).toBe(true);
  });

  it("a semantic recovery provider failure (returns null) is safe — the deterministic 'unresolved' outcome stands unchanged, never crashes the batch", async () => {
    const { prisma } = fakePrisma();
    const pending = [pendingFor("ingredient-1", "unknownfood"), pendingFor("ingredient-2", "garlic")];
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async (q: string) => (q === "garlic" ? [candidate()] : []) }];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({
      adapters, semanticCandidateGateProvider: permissiveSingleGate(), semanticRecoveryProvider: stubRecovery(null)
    }));
    expect(result.get("ingredient-1")).toEqual({ status: "unresolved", reason: "not_found" });
    expect(result.get("ingredient-2")).toMatchObject({ status: "resolved" });
  });

  it("never attempts recovery for an item that is already resolved or already confirmation_required for a reason recovery doesn't apply to (weak_match/possible_duplicate)", async () => {
    const { prisma } = fakePrisma();
    const recoverCalls: string[] = [];
    const recovery: SemanticRecoveryProvider = { id: "stub", recover: async (input) => { recoverCalls.push(input.foodQuery); return null; } };
    // A single OFF-shaped (not autoAcceptEligible) survivor -> weak_match,
    // not one of recovery's trigger reasons (not_found/invalid_external_data/
    // external_unavailable/convergence_rejected).
    const pending = [pendingFor("ingredient-1", "garlic")];
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => [candidate({ autoAcceptEligible: false, matchPolicy: "review_required" })] }];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({ adapters, semanticRecoveryProvider: recovery }));
    expect(result.get("ingredient-1")).toMatchObject({ status: "confirmation_required", reason: "weak_match" });
    expect(recoverCalls).toHaveLength(0);
  });

  it("without a configured semanticRecoveryProvider, behavior is byte-for-byte unchanged (backward compatible)", async () => {
    const { prisma } = fakePrisma();
    const pending = [pendingFor("ingredient-1", "unknownfood")];
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => [] }];
    const result = await resolveManyAuthoritativeFoods(prisma, pending, baseDeps({ adapters }));
    expect(result.get("ingredient-1")).toEqual({ status: "unresolved", reason: "not_found" });
  });
});

// Owner report (2026-09-25): "tejföl" was searched as "sour cream" and two
// cheeses were offered. Shown candidates must still name the user's own word
// once localized back into their language.
describe("round-trip identity check on shown candidates", () => {
  const huNames: Record<string, string> = {
    "Sour cream, cultured": "Tejföl, kultúrás",
    "Sour cream, reduced fat": "Tejföl, csökkentett zsírtartalmú",
    "Cheese, cream": "Krémsajt",
    "Cheese, cottage, creamed": "Túró, krémes (cottage cheese)",
    "Onions, raw": "Hagyma, nyers",
    "Onions, sweet, raw": "Hagyma, édes, nyers",
    "Milk, whole": "Tej, teljes"
  };
  const huLocalization: CandidateLocalizationProvider = { id: "fixture", localize: async (items) => new Map(items.map((i) => [i.id, huNames[i.authoritativeName] ?? i.authoritativeName])) };
  const named = (name: string, sourceId: string) => candidate({ sourceId, name, originalName: name, names: { en: name }, normalizedName: name.toLowerCase() });
  const run = (names: string[], sourceIdentity: string, canonical: string) => {
    const { prisma, persisted } = fakePrisma();
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => names.map((n, i) => named(n, String(i + 1))) }];
    const pending: PendingAuthoritativeResolution = { ...pendingFor("a", canonical), sourceIdentity };
    return { persisted, result: resolveManyAuthoritativeFoods(prisma, [pending], baseDeps({ adapters, locale: "hu", localizationProvider: huLocalization })) };
  };

  it("drops cheeses offered for 'tejföl' and keeps the real sour creams", async () => {
    const { result, persisted } = run(["Sour cream, cultured", "Sour cream, reduced fat", "Cheese, cream", "Cheese, cottage, creamed"], "tejföl", "sour cream");
    const outcome = (await result).get("a") as any;
    expect(outcome.status).toBe("confirmation_required");
    expect(outcome.candidates.map((c: any) => c.names.hu)).toEqual(["Tejföl, kultúrás", "Tejföl, csökkentett zsírtartalmú"]);
    expect(persisted).toHaveLength(0);
  });

  it("when only wrong foods were offered, the ingredient becomes not found instead of showing them", async () => {
    const { result } = run(["Cheese, cream", "Milk, whole"], "tejföl", "sour cream");
    expect((await result).get("a")).toEqual({ status: "unresolved", reason: "not_found" });
  });

  describe("roadmap E1: a name mismatch is decided by meaning, not spelling", () => {
    const frankNames: Record<string, string> = { "Frankfurter, beef": "frankfurti, marha", "Frankfurter, chicken": "frankfurti, csirke", "Bologna, beef": "bologna felvágott, marha" };
    const frankLocalization: CandidateLocalizationProvider = { id: "fixture", localize: async (items) => new Map(items.map((i) => [i.id, frankNames[i.authoritativeName] ?? huNames[i.authoritativeName] ?? i.authoritativeName])) };
    const sameFood: Record<string, string[]> = { virsli: ["frankfurti, marha", "frankfurti, csirke"], "tejföl": [] };
    const gateCalls: Array<{ identity: string; names: string[] }> = [];
    const gate = { id: "fixture-gate", checkRelevance: async (original: any, candidates: any[]) => {
      gateCalls.push({ identity: original.identity, names: candidates.map((c) => c.authoritativeName) });
      return new Map(candidates.map((c) => [c.id, (sameFood[original.identity] ?? []).includes(c.authoritativeName)]));
    } };
    const runWithGate = (names: string[], sourceIdentity: string, canonical: string) => {
      const { prisma } = fakePrisma();
      const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => names.map((n, i) => named(n, String(i + 1))) }];
      const pending: PendingAuthoritativeResolution = { ...pendingFor("a", canonical), sourceIdentity };
      return resolveManyAuthoritativeFoods(prisma, [pending], baseDeps({ adapters, locale: "hu", localizationProvider: frankLocalization, semanticCandidateGateProvider: gate as any }));
    };

    it("keeps the frankfurters shown for 'virsli' (the live case dropped all five)", async () => {
      const outcome = (await runWithGate(["Frankfurter, beef", "Frankfurter, chicken", "Bologna, beef"], "virsli", "frankfurter")).get("a") as any;
      expect(outcome.status).toBe("confirmation_required");
      expect(outcome.candidates.map((c: any) => c.names.hu)).toEqual(["frankfurti, marha", "frankfurti, csirke"]);
      expect(gateCalls.at(-1)).toEqual({ identity: "virsli", names: ["frankfurti, marha", "frankfurti, csirke"] });
    });

    it("still never shows a cheese for 'tejföl', and correctly named sour creams need no gate call", async () => {
      const outcome = (await runWithGate(["Sour cream, cultured", "Sour cream, reduced fat", "Cheese, cream"], "tejföl", "sour cream")).get("a") as any;
      expect(outcome.candidates.map((c: any) => c.names.hu)).toEqual(["Tejföl, kultúrás", "Tejföl, csökkentett zsírtartalmú"]);
      // Correctly named candidates never cost a gate call.
      expect(gateCalls.flatMap((call) => call.names)).not.toContain("Tejföl, kultúrás");
    });
  });

  it("a Hungarian compound word keeps its plain localized match ('vöröshagyma' -> 'Hagyma, nyers')", async () => {
    const { result } = run(["Onions, raw", "Onions, sweet, raw"], "vöröshagyma", "onion");
    const outcome = (await result).get("a") as any;
    expect(outcome.status).toBe("confirmation_required");
    expect(outcome.candidates).toHaveLength(2);
  });
});
