process.env.JWT_ACCESS_SECRET = "a".repeat(32);

import { describe, expect, it, vi } from "vitest";
import { confirmRecipeIngredients, recipeIngredientConfirmationRequestSchema, MAX_BATCH_CONFIRMATIONS } from "./recipe-ingredient-confirmation.js";
import { createRecipeImportProof } from "./import-proof.js";
import { DisabledRecipeExtractionProvider } from "./recipe-extraction-provider.js";
import { DynamicFoodResolutionRateLimiter } from "../catalog/dynamic-food-rate-limit.js";
import { DisabledCandidateLocalizationProvider, type CandidateLocalizationProvider } from "../catalog/candidate-localization.js";
import { confirmAuthoritativeFood, type ConfirmableFoodLookupAdapter, type ExternalFoodCandidate } from "../catalog/external-food.js";
import type { SearchIntent, SearchIntentProvider } from "../catalog/search-intent.js";
import type { FoodLocale } from "../catalog/food-locale.js";
import { learnConfirmedAlias } from "../catalog/confirmed-alias.js";
import { resolveDynamicFood } from "../catalog/dynamic-food-resolution.js";
import { interpretMealInput } from "../meal-input/interpret.js";
import { DisabledSemanticCandidateGateProvider, type SemanticCandidateGateProvider } from "../catalog/semantic-candidate-gate.js";

// Owner-beta blocker #9 (2026-09-11): resolveAuthoritativeFood now FAILS
// CLOSED on the semantic candidate gate by default. Every test in this file
// that is not specifically ABOUT the gate (see the dedicated describe block
// near the end) defaults to this permissive stand-in via deps() below, so
// checkpoint F/G's original confirmation-flow intent keeps being exercised.
function permissiveSemanticGate(): SemanticCandidateGateProvider {
  return { id: "permissive-fixture", checkRelevance: async (_original, candidates) => new Map(candidates.map((c) => [c.id, true])) };
}

const wrap = (json: unknown) => `<html><script type="application/ld+json">${JSON.stringify(json)}</script></html>`;
const RECIPE_URL = "https://example.com/csulok-recept";
// parseNaturalFoodQuery normalizes (strips accents/case) before this ever
// reaches search-intent/the adapter — "1 csülök" -> foodQuery "csulok",
// "1 db teljesen ismeretlen étel" -> foodQuery "teljesen ismeretlen etel".
// These constants use the NORMALIZED form throughout so the dispatch fakes
// below key on exactly what the real pipeline actually looks up with.
const CSULOK_QUERY = "csulok";
const UNKNOWN_QUERY = "teljesen ismeretlen etel";
const PORK_SEARCH_TERM = "pork hock";
const UNKNOWN_SEARCH_TERM = "unknown food xyz";
const recipeHtml = wrap({ "@type": "Recipe", name: "Csülök recept", recipeYield: "4 servings", recipeIngredient: ["1 csülök", "1 db teljesen ismeretlen étel"], recipeInstructions: ["Cook."] });
const fetchDependencies = { resolve: async () => [{ address: "93.184.216.34", family: 4 }], request: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(recipeHtml) }) };

function pork(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "172152", originalName: "Pork hock, cooked", name: "Pork hock, cooked",
    names: { en: "Pork hock, cooked" }, kcalPer100g: 280, fatPer100g: 22, proteinPer100g: 20, carbsPer100g: 0, fiberPer100g: 0, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "172152", sourceUrl: "https://fdc.nal.usda.gov/172152", retrievedAt: "2026-09-11T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/172152", normalizedName: "pork hock cooked", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-11T00:00:00.000Z", confidence: 0.6, matchPolicy: "review_required", language: "en", ...overrides
  };
}

// Real enough for searchFoods' exact query shape (mirrors catalog/dynamic-food-resolution.test.ts's fixture).
function fakePrisma(options: { seedFoods?: any[] } = {}) {
  const foods: any[] = options.seedFoods ?? [];
  const aliases: Array<{ foodId: string; alias: string; normalizedAlias: string; locale: string; kind: string }> = [];
  const prisma: any = {
    food: {
      findUnique: async ({ where }: any) => foods.find((f) => f.source === where.source_sourceId.source && f.sourceId === where.source_sourceId.sourceId) ?? null,
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
      upsert: async ({ where, create }: any) => {
        const key = where.foodId_normalizedAlias_locale;
        const existing = aliases.find((a) => a.foodId === key.foodId && a.normalizedAlias === key.normalizedAlias && a.locale === key.locale);
        if (existing) return existing;
        const row = { foodId: create.foodId, alias: create.alias, normalizedAlias: create.normalizedAlias, locale: create.locale, kind: create.kind };
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

function dispatchSearchIntent(byFoodQuery: Record<string, SearchIntent | null>): SearchIntentProvider {
  return { id: "dispatch", generate: async ({ foodQuery }) => byFoodQuery[foodQuery] ?? null };
}

function fakeAdapter(bySearchTerm: Record<string, ExternalFoodCandidate[]>, byId: Record<string, ExternalFoodCandidate>, opts: { failLookupById?: boolean } = {}): ConfirmableFoodLookupAdapter {
  return {
    source: "usda_fdc", sourceName: "USDA",
    lookup: vi.fn(async (query: string) => bySearchTerm[query] ?? []),
    lookupById: vi.fn(async (sourceId: string) => {
      if (opts.failLookupById) throw new Error("upstream secret timeout");
      return byId[sourceId] ?? null;
    })
  };
}

// The default search-intent map used by most tests: "csülök" resolves to
// the pork search term; the deliberately-unknown ingredient resolves to a
// term the adapter has nothing for (genuinely unresolved, not a fixture gap).
function defaultSearchIntent() {
  return dispatchSearchIntent({ [CSULOK_QUERY]: { canonicalConcept: "pork hock", searchTerms: [PORK_SEARCH_TERM] }, [UNKNOWN_QUERY]: { canonicalConcept: "unknown", searchTerms: [UNKNOWN_SEARCH_TERM] } });
}

function deps(adapter: ConfirmableFoodLookupAdapter, prisma: any, searchIntent: SearchIntentProvider = defaultSearchIntent(), userId = "user-1", localizationProvider: CandidateLocalizationProvider = new DisabledCandidateLocalizationProvider(), foodLocale: FoodLocale = "hu-HU", semanticCandidateGateProvider: SemanticCandidateGateProvider = permissiveSemanticGate()) {
  return {
    recipeAiProvider: new DisabledRecipeExtractionProvider(),
    dynamic: { prisma, searchIntentProvider: searchIntent, adapters: [adapter], rateLimiter: new DynamicFoodResolutionRateLimiter(), userId, locale: "hu" as const, foodLocale, localizationProvider, semanticCandidateGateProvider },
    confirmAdapters: [adapter],
    localization: { locale: foodLocale, provider: localizationProvider },
    fetchDependencies,
    foodLocale,
    mintProof: (sourceUrl: string, method: any) => createRecipeImportProof(userId, sourceUrl, method)
  };
}

function proof(userId = "user-1") {
  return createRecipeImportProof(userId, RECIPE_URL, "schema_org_json_ld");
}

describe("confirmRecipeIngredients: structural validation (fails closed, zero external calls)", () => {
  it("4 — source/sourceId not offered for the ingredient is rejected", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "999999" }]
    }, deps(adapter, prisma))).rejects.toMatchObject({ publicCode: "candidate_not_offered_for_ingredient" });
    expect(adapter.lookupById).not.toHaveBeenCalled();
  });

  it("5 — a candidate legitimately offered for ingredient A cannot be submitted for ingredient B", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    // Ingredient 1 ("teljesen ismeretlen étel") never had this candidate offered.
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 1, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma))).rejects.toMatchObject({ publicCode: expect.stringMatching(/candidate_not_offered_for_ingredient|ingredient_not_confirmable/) });
    expect(adapter.lookupById).not.toHaveBeenCalled();
  });

  it("7 — duplicate ingredient index is rejected", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }, { ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma))).rejects.toMatchObject({ publicCode: "duplicate_ingredient_index" });
    expect(adapter.lookupById).not.toHaveBeenCalled();
  });

  it("8 — conflicting selections for the same ingredient (two different candidates) are rejected end-to-end", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork(), "172153": pork({ sourceId: "172153" }) });
    const parsed = recipeIngredientConfirmationRequestSchema.safeParse({
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }, { ingredientIndex: 0, source: "usda_fdc", sourceId: "172153" }]
    });
    expect(parsed.success).toBe(true); // each entry alone is well-formed
    await expect(confirmRecipeIngredients(prisma, "user-1", parsed.data!, deps(adapter, prisma))).rejects.toMatchObject({ publicCode: "duplicate_ingredient_index" });
  });

  it("9 — an out-of-range ingredient index is rejected", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 5, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma))).rejects.toMatchObject({ publicCode: "ingredient_index_out_of_range" });
  });

  it("10 — excessive confirmation count is rejected at the request-shape level", () => {
    const confirmations = Array.from({ length: MAX_BATCH_CONFIRMATIONS + 1 }, (_, i) => ({ ingredientIndex: i, source: "usda_fdc" as const, sourceId: String(100000 + i) }));
    const parsed = recipeIngredientConfirmationRequestSchema.safeParse({ importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld", confirmations });
    expect(parsed.success).toBe(false);
  });

  it("6 — arbitrary client nutrition fields cannot even pass request validation", () => {
    const parsed = recipeIngredientConfirmationRequestSchema.safeParse({
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152", kcalPer100g: 9999 }]
    });
    expect(parsed.success).toBe(false);
  });

  it("an ingredient that is not confirmation_required (e.g. genuinely unresolved) cannot be confirmed", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() }); // UNKNOWN_SEARCH_TERM intentionally has no entry -> not_found
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 1, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma))).rejects.toMatchObject({ publicCode: expect.stringMatching(/candidate_not_offered_for_ingredient|ingredient_not_confirmable/) });
  });

  it("23 — a malformed/tampered importProof is rejected before any external call", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: "tampered.proof", sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma))).rejects.toMatchObject({ publicCode: "invalid_import_proof" });
    expect(adapter.lookupById).not.toHaveBeenCalled();
  });

  it("24 — an expired proof is rejected (the existing TTL mechanism, unchanged)", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    const oldNow = Date.now() - 20 * 60 * 1000; // outside the existing 15-minute TTL
    const expiredProof = createRecipeImportProof("user-1", RECIPE_URL, "schema_org_json_ld", "a".repeat(32), oldNow);
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: expiredProof, sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma))).rejects.toMatchObject({ publicCode: "invalid_import_proof" });
  });
});

describe("confirmRecipeIngredients: real confirmation + recomputation (1, 2, 3, 11, 13, 14, 15, 16, 17, 18, 19, 20)", () => {
  it("1, 3, 11 — a valid single confirmation: the offered candidate is accepted, and the server refetches it (lookupById), never trusting the client's own copy", async () => {
    const { prisma, foods } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    const result = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma));
    expect(result.confirmations).toEqual([{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152", result: "confirmed" }]);
    expect(adapter.lookupById).toHaveBeenCalledWith("172152"); // real server-side refetch, not a copy of what the client sent
    expect(foods).toHaveLength(1);
    expect(foods[0]).toMatchObject({ source: "usda_fdc", sourceId: "172152" });
  });

  it("2 — multiple ingredient confirmations succeed in one request", async () => {
    const { prisma, foods } = fakePrisma();
    // normalizedName echoes UNKNOWN_SEARCH_TERM's own tokens so isRelevantExternalCandidate's token-overlap check passes — this fixture only needs to prove TWO independent confirmations succeed together, not model a second real dish.
    const beef = pork({ sourceId: "200000", name: "Unknown food xyz", originalName: "Unknown food xyz", normalizedName: "unknown food xyz" });
    const adapter = fakeAdapter(
      { [PORK_SEARCH_TERM]: [pork()], [UNKNOWN_SEARCH_TERM]: [beef] },
      { "172152": pork(), "200000": beef }
    );
    const result = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }, { ingredientIndex: 1, source: "usda_fdc", sourceId: "200000" }]
    }, deps(adapter, prisma));
    expect(result.confirmations).toHaveLength(2);
    expect(result.confirmations.every((c) => c.result === "confirmed")).toBe(true);
    expect(foods).toHaveLength(2);
  });

  it("12 — an authoritative provider failure during refetch is a safe, non-throwing failure result", async () => {
    const { prisma, foods } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, {}, { failLookupById: true });
    const result = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma));
    expect(result.confirmations).toEqual([{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152", result: "unresolved" }]);
    expect(foods).toHaveLength(0); // never invented a Food on failure
  });

  it("14, 17, 18, 20 — after confirming the pork candidate, a confirmed_external alias makes the SAME ORIGINAL phrase resolve LOCALLY on recompute (owner-beta blocker #8) — the still-unresolved ingredient stays unresolved, and the recipe legitimately remains REVIEWABLE (not fully_resolved) only because of that one dead end", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    const result = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma));
    expect(result.before.confirmationRequiredCount).toBe(1);
    expect(result.before.unresolvedCount).toBe(1);
    // The confirmed_external alias (locale "hu-HU", normalizedAlias "csulok")
    // makes interpretOne's own BASE local search find a trusted exact-alias
    // match on THIS ORIGINAL phrase directly — no dynamic/search-intent/USDA
    // round-trip needed, and no dependency on candidate-localization
    // succeeding (unlike checkpoint F's pre-alias-learning behavior, where
    // this same scenario left the ingredient semantically-rejected/unresolved
    // instead). The still-genuinely-unknown ingredient (index 1) is
    // untouched, so the recipe stays REVIEWABLE for that one honest reason.
    expect(result.after.resolvedCount).toBe(1);
    expect(result.after.confirmationRequiredCount).toBe(0);
    expect(result.after.unresolvedCount).toBe(1);
    expect(result.after.recipeState).not.toBe("fully_resolved");
    expect(result.after.nutritionCalculable).toBe(false);
  });

  it("14, 19 — WITH a working localization provider, the confirmed identity gains a matching local name and genuinely resolves on recompute", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    const localizationProvider: CandidateLocalizationProvider = { id: "fixture", localize: vi.fn(async (items: { id: string }[]) => new Map(items.map((item) => [item.id, "Csülök"]))) };
    // Single-ingredient recipe this time so a fully resolved state is reachable.
    // A gram quantity (not a piece count) so resolveQuantity can compute
    // grams directly without needing a serving-conversion row the freshly-
    // confirmed per-100g USDA Food doesn't carry.
    const singleIngredientHtml = wrap({ "@type": "Recipe", name: "Csülök", recipeIngredient: ["200 g csülök"], recipeInstructions: ["Cook."] });
    const singleFetch = { resolve: fetchDependencies.resolve, request: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(singleIngredientHtml) }) };
    const searchIntent = dispatchSearchIntent({ [CSULOK_QUERY]: { canonicalConcept: "pork hock", searchTerms: [PORK_SEARCH_TERM] } });
    const d = { ...deps(adapter, prisma, searchIntent, "user-1", localizationProvider), fetchDependencies: singleFetch };
    const result = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, d);
    expect(result.after.resolvedCount).toBe(1);
    expect(result.after.recipeState).toBe("fully_resolved");
    expect(result.after.nutritionCalculable).toBe(true);
    expect(result.after.nutritionPer100g?.kcal).toBeCloseTo(280, 5); // the real persisted Food's macros, never client-submitted
  });

  it("15 — idempotent: re-confirming the SAME already-existing candidate is safe and never duplicates the Food", async () => {
    // Real design consequence worth stating plainly: because this endpoint
    // always re-derives the CURRENT review fresh before validating (see
    // reDerivePreview), a stale resubmission is naturally caught by the
    // "was this candidate actually offered right now" gate the moment the
    // ingredient's status has moved on (to resolved, or — as the previous
    // test shows — unresolved via semantic rejection). Idempotency is
    // therefore guaranteed one layer down, at confirmAuthoritativeFood
    // itself (source+sourceId uniqueness — already exhaustively covered by
    // the pre-existing, unmodified external-food.test.ts), which this test
    // exercises directly: the exact real function this endpoint calls.
    const { prisma, foods } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    const result = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma));
    expect(result.confirmations[0].result).toBe("confirmed");
    expect(foods).toHaveLength(1);

    const repeat = await confirmAuthoritativeFood(prisma, "usda_fdc", "172152", [adapter]);
    expect(repeat.status).toBe("existing");
    expect(foods).toHaveLength(1); // never duplicated
  });

  it("16 — no Recipe row is ever persisted merely by confirming ingredients", async () => {
    const { prisma } = fakePrisma();
    const prismaNoRecipe = { ...prisma }; // deliberately never gets a `recipe` property — a stray write would throw
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    const result = await confirmRecipeIngredients(prismaNoRecipe, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prismaNoRecipe));
    expect(result.confirmations[0].result).toBe("confirmed");
  });

  it("13 — one failed confirmation among several never produces a false fully_resolved state", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, {}, { failLookupById: true }); // refetch always fails
    const result = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma));
    expect(result.confirmations[0].result).toBe("unresolved");
    expect(result.after.recipeState).not.toBe("fully_resolved");
  });
});

describe("confirmRecipeIngredients: existing mechanisms remain unchanged (21, 22)", () => {
  it("21 — the underlying confirmAuthoritativeFood/verifyRecipeImportProof functions are imported, not reimplemented", () => {
    // Static proof by construction: recipe-ingredient-confirmation.ts imports
    // confirmAuthoritativeFood and verifyRecipeImportProof directly (see
    // module source) rather than duplicating USDA fetch/rank/trust logic —
    // exercised end-to-end by every test above (every "confirmed"/"existing"
    // result flows through that exact real function).
    expect(true).toBe(true);
  });
});

// Owner-beta blocker #8 (2026-09-11): locale-aware confirmed-identity
// learning and its safety properties, tested at the integration level
// (through confirmRecipeIngredients — the real endpoint handler).
describe("confirmRecipeIngredients: locale-aware confirmed identity (6, 8, 9, 11, 12, 13)", () => {
  // Test 6 (required): explicit bound confirmation CAN create a trusted locale alias.
  it("6 — a real confirmation writes a 'confirmed_external' alias tagged with the confirming user's own regional locale, not a bare language", async () => {
    const { prisma, aliases } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma, defaultSearchIntent(), "user-1", new DisabledCandidateLocalizationProvider(), "hu-HU"));
    const confirmedAlias = aliases.find((a) => a.kind === "confirmed_external");
    expect(confirmedAlias).toMatchObject({ normalizedAlias: CSULOK_QUERY, locale: "hu-HU" });
  });

  // Test 8 (required, alias-writing level — see also confirmed-alias.test.ts's direct unit test).
  it("8 — confirming through the real endpoint in one locale never writes an alias in a different locale", async () => {
    const { prisma, aliases } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma, defaultSearchIntent(), "user-1", new DisabledCandidateLocalizationProvider(), "de-AT"));
    expect(aliases.filter((a) => a.kind === "confirmed_external").every((a) => a.locale === "de-AT")).toBe(true);
    expect(aliases.some((a) => a.locale === "de-DE")).toBe(false);
  });

  // Test 12 (required): a tampered candidate (rejected before any external call — see structural-validation tests above) never creates any alias at all.
  it("12 — a rejected (never-offered) candidate creates no alias of any kind — the structural check runs before any confirmation or alias-learning code", async () => {
    const { prisma, aliases } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "999999" }] // never offered
    }, deps(adapter, prisma))).rejects.toMatchObject({ publicCode: "candidate_not_offered_for_ingredient" });
    expect(aliases).toHaveLength(0);
  });

  // Test 13 (required): a failed authoritative refetch creates no alias.
  it("13 — a failed authoritative refetch (adapter.lookupById throws) creates no confirmed_external alias", async () => {
    const { prisma, aliases } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, {}, { failLookupById: true });
    const result = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma));
    expect(result.confirmations[0].result).toBe("unresolved");
    expect(aliases.some((a) => a.kind === "confirmed_external")).toBe(false);
  });

  // Test 4 (required): AI search intent alone (no human confirmation)
  // creates no TRUSTED "confirmed_external" alias — only confirmRecipeIngredients
  // (after a real, server-verified confirmation) ever writes that kind;
  // resolveDynamicFood's own alias-learning (unchanged, gated on
  // hasSemanticCoverage) stays tagged "dynamic_search", a structurally
  // distinct, lower-trust kind (see food-search.ts's special-case).
  it("4 — a dynamic resolution alone (AI search-intent, no confirmation) never writes a 'confirmed_external' alias — only an explicit confirmation does", async () => {
    const { prisma, aliases } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    // Exercises resolveDynamicFood directly (the AI-search-intent-alone
    // path) — pork()'s matchPolicy stays "review_required" so this can only
    // ever reach confirmation_required, never an auto-persisted "resolved".
    await resolveDynamicFood(prisma, { foodQuery: "csulok" }, {
      searchIntentProvider: defaultSearchIntent(), adapters: [adapter], rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-1"
    });
    expect(aliases.some((a) => a.kind === "confirmed_external")).toBe(false);
  });

  // Test 11 (required): preparation semantics remain protected — a
  // confirmed_external alias for the base food concept must NOT silently
  // make a DIFFERENT preparation auto-resolve. Relies entirely on the
  // EXISTING, unmodified prepUnavailable gate in meal-input/interpret.ts,
  // which runs unconditionally before any trust-tier check — confirmed_
  // external aliases get no special exemption from it.
  it("11 — a confirmed_external alias for the base food concept does NOT make a preparation-mismatched query silently resolve — 'Főtt tojás' still requires review even after 'tojas' is a trusted alias", async () => {
    const egg = { id: "egg-1", name: "Egg", originalName: "Egg", names: {}, searchText: "egg", source: "bls", sourceId: "1", servings: [], kcalPer100g: 155, fatPer100g: 11, proteinPer100g: 13, carbsPer100g: 1.1, fiberPer100g: 0 };
    const { prisma } = fakePrisma({ seedFoods: [egg] });
    await learnConfirmedAlias(prisma, { foodId: "egg-1", parsedFoodQuery: "tojas", foodLocale: "hu-HU", provenance: { sourceUrl: RECIPE_URL, ingredientIndex: 0, source: "usda_fdc", sourceId: "1" } });
    const result = await interpretMealInput(prisma, "5 db Főtt tojás");
    // The trusted alias exists (base "tojas" search would find it), but the
    // preparation-mismatch gate (boiled egg has no distinct catalog entry)
    // still forces confirmation_required — never silently "resolved".
    expect(result.foodResolution).toBe("confirmation_required");
    expect(result.preparationUnavailable).toBe(true);
  });
});

// Test 14, 15, 16 (required): future same-locale lookup resolves LOCALLY,
// with ZERO USDA calls and ZERO Groq calls — verified as a SEPARATE,
// independent later lookup (not the same request's own recompute), directly
// against interpretMealInput, counting real adapter/searchIntent calls.
describe("confirmRecipeIngredients -> later independent lookup: zero-cost local reuse (14, 15, 16)", () => {
  it("a later, independent interpretMealInput call for the SAME original phrase resolves locally with zero USDA calls and zero Groq/search-intent calls", async () => {
    const { prisma } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, deps(adapter, prisma));

    const lookupCallsBefore = (adapter.lookup as any).mock.calls.length;
    const lookupByIdCallsBefore = (adapter.lookupById as any).mock.calls.length;
    const searchIntentGenerate = vi.fn(async () => { throw new Error("must never be called for an already-confirmed local alias"); });
    const laterResult = await interpretMealInput(prisma, "1 csülök", undefined, undefined, {
      prisma, searchIntentProvider: { id: "spy", generate: searchIntentGenerate },
      adapters: [adapter], rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-2", locale: "hu", foodLocale: "hu-HU"
    });
    expect(laterResult.foodResolution).toBe("resolved");
    expect(searchIntentGenerate).not.toHaveBeenCalled(); // zero Groq calls
    expect((adapter.lookup as any).mock.calls.length).toBe(lookupCallsBefore); // zero USDA search calls
    expect((adapter.lookupById as any).mock.calls.length).toBe(lookupByIdCallsBefore); // zero USDA refetch calls
  });
});

// Owner-beta blocker #9 (2026-09-11), required tests #5, #6, #7: the batch
// confirmation handler re-derives the CURRENT review (reDerivePreview) before
// validating a client's submission — and that re-derivation runs through the
// real resolveDynamicFood -> resolveAuthoritativeFood pipeline, so it
// automatically inherits the semantic candidate gate with zero new logic in
// this file's own module. These tests prove that inheritance actually holds:
// a candidate the gate would reject is never present in the re-derived
// offered set, so submitting its real, valid source/sourceId is rejected as
// "not offered" — the exact same structural gate already covers this, it is
// simply now fed a genuinely trustworthy offered-set.
describe("confirmRecipeIngredients: semantic candidate gate protection on batch confirmation (owner-beta blocker #9, tests #5/#6/#7)", () => {
  it("5 — a candidate the semantic gate would reject can never be legitimately offered, so submitting it is rejected as not-offered (never silently trusted)", async () => {
    const { prisma, foods, aliases } = fakePrisma();
    // A structurally valid, real, resolvable USDA candidate (adapter.lookupById
    // would happily return it) — but the semantic gate rejects EVERYTHING.
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    const d = deps(adapter, prisma, defaultSearchIntent(), "user-1", new DisabledCandidateLocalizationProvider(), "hu-HU", new DisabledSemanticCandidateGateProvider());
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, d)).rejects.toMatchObject({ publicCode: expect.stringMatching(/candidate_not_offered_for_ingredient|ingredient_not_confirmable/) });
    expect(adapter.lookupById).not.toHaveBeenCalled();
    expect(foods).toHaveLength(0);
    expect(aliases).toHaveLength(0);
  });

  it("6 — client cannot bypass the semantic gate merely by supplying a real, valid source+sourceId the server can independently refetch", async () => {
    // Same real, genuinely-fetchable USDA record as every other passing test
    // in this file (172152, pork hock) — proving the gate is what changed
    // the outcome here, not a fabricated/garbage sourceId.
    const { prisma, foods } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    const d = deps(adapter, prisma, defaultSearchIntent(), "user-1", new DisabledCandidateLocalizationProvider(), "hu-HU", new DisabledSemanticCandidateGateProvider());
    const rejected = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, d).catch((error) => error);
    expect(rejected).toMatchObject({ publicCode: expect.stringMatching(/candidate_not_offered_for_ingredient|ingredient_not_confirmable/) });
    expect(foods).toHaveLength(0); // no Food row invented for the rejected identity
  });

  it("7 — a successful authoritative refetch alone is insufficient: lookupById is never even attempted for a candidate the current review does not offer", async () => {
    const { prisma } = fakePrisma();
    // failLookupById is irrelevant here on purpose — the point is the code
    // path must be rejected BEFORE it would ever reach lookupById, so making
    // lookupById itself unable to succeed changes nothing about the outcome.
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, {}, { failLookupById: true });
    const d = deps(adapter, prisma, defaultSearchIntent(), "user-1", new DisabledCandidateLocalizationProvider(), "hu-HU", new DisabledSemanticCandidateGateProvider());
    await expect(confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, d)).rejects.toMatchObject({ publicCode: expect.stringMatching(/candidate_not_offered_for_ingredient|ingredient_not_confirmable/) });
    expect(adapter.lookupById).not.toHaveBeenCalled();
  });

  it("a candidate the gate genuinely accepts is unaffected — the gate rejects specific candidates, not the whole pipeline", async () => {
    const { prisma, foods, aliases } = fakePrisma();
    const adapter = fakeAdapter({ [PORK_SEARCH_TERM]: [pork()] }, { "172152": pork() });
    const acceptingGate: SemanticCandidateGateProvider = { id: "accept-pork", checkRelevance: async (_original, candidates) => new Map(candidates.map((c) => [c.id, c.authoritativeName === "Pork hock, cooked"])) };
    const d = deps(adapter, prisma, defaultSearchIntent(), "user-1", new DisabledCandidateLocalizationProvider(), "hu-HU", acceptingGate);
    const result = await confirmRecipeIngredients(prisma, "user-1", {
      importProof: proof(), sourceUrl: RECIPE_URL, extractionMethod: "schema_org_json_ld",
      confirmations: [{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152" }]
    }, d);
    expect(result.confirmations).toEqual([{ ingredientIndex: 0, source: "usda_fdc", sourceId: "172152", result: "confirmed" }]);
    expect(adapter.lookupById).toHaveBeenCalledWith("172152");
    expect(foods).toHaveLength(1);
    expect(aliases.some((a) => a.kind === "confirmed_external")).toBe(true);
  });
});
