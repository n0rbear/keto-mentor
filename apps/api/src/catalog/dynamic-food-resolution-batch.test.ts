import { describe, expect, it, vi } from "vitest";
import { resolveManyAuthoritativeFoods, type BatchAuthoritativeDeps, type PendingAuthoritativeResolution } from "./dynamic-food-resolution-batch.js";
import { DynamicFoodResolutionRateLimiter } from "./dynamic-food-rate-limit.js";
import type { RecipeSemanticGateProvider } from "./semantic-candidate-gate-batch.js";
import type { CandidateLocalizationProvider } from "./candidate-localization.js";
import type { ExternalFoodCandidate } from "./external-food.js";

function fakePrisma() {
  const persisted: any[] = [];
  const prisma: any = {
    food: {
      findUnique: async () => null,
      findMany: async () => [], // no local duplicates by default
      create: async ({ data }: any) => { const food = { id: `persisted-${persisted.length}`, ...data }; persisted.push(food); return food; }
    },
    foodAlias: { findFirst: async () => null, findMany: async () => [], createMany: async () => ({ count: 1 }), upsert: async ({ create }: any) => create },
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
    retrievedAt: "2026-09-15T00:00:00.000Z", confidence: 0.6, matchPolicy: "review_required", language: "en", ...overrides
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
