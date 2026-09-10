import { describe, expect, it, vi } from "vitest";
import { interpretMealInput, type DynamicResolutionDeps } from "./interpret.js";
import { normalizeSearch } from "../catalog/normalize.js";
import { DynamicFoodResolutionRateLimiter } from "../catalog/dynamic-food-rate-limit.js";
import { DisabledSearchIntentProvider, type SearchIntent, type SearchIntentProvider } from "../catalog/search-intent.js";
import type { ExternalFoodCandidate, StructuredFoodLookupAdapter } from "../catalog/external-food.js";
import { AiProviderError } from "../ai/chat-completions-provider.js";
import type { QuantityEstimate } from "./quantity-estimation.js";
import type { CandidateLocalizationProvider } from "../catalog/candidate-localization.js";

// Mirrors real production wiring (server.ts always configures a real
// candidateLocalizationProvider): resolveAuthoritativeFood's auto-resolve
// path localizes the candidate into the user's locale BEFORE persisting, so
// a legitimately-learned dynamic_search alias has real coverage evidence to
// pass against (see hasSemanticCoverage in food-search.ts). Defaulted here
// so every test in this file reflects that, not a disabled-localization edge case.
function fakeLocalizationProvider(displayName: string): CandidateLocalizationProvider {
  return { id: "fixture", localize: vi.fn(async (items: { id: string }[]) => new Map(items.map((item) => [item.id, displayName]))) };
}

// A small local catalog with a genuine miss (no "csülök"/pork-hock entry at
// all — mirrors the real production gap this whole feature exists for) plus
// one trusted-serving food (egg) to prove local-first behavior is untouched.
const seedFoods = [
  { id: "catalog-egg", name: "Egg", originalName: "Egg", names: { hu: "Tojás", en: "Egg" }, synonyms: { hu: ["tojás", "tojas"], en: ["egg"] },
    servings: [{ id: "egg", key: "egg", unit: "egg", labels: {}, grams: 50, isEstimated: false, confidence: 1, provenance: {} }], kcalPer100g: 143 }
];

// extraFoods: additional pre-existing catalog entries for a single test — each
// supplies its own searchText/names directly rather than going through the
// synonym-based construction seedFoods uses, and (deliberately) gets no
// curated alias, mirroring an ordinary bulk-imported generic ingredient.
function makeFullPrisma(extraFoods: any[] = []) {
  const foods: any[] = [
    ...seedFoods.map((f) => ({
      ...f, createdById: null,
      searchText: normalizeSearch([f.name, ...Object.values(f.synonyms).flat()].join(" "))
    })),
    ...extraFoods.map((f) => ({ createdById: null, names: {}, ...f }))
  ];
  const aliases: Array<{ foodId: string; alias: string; normalizedAlias: string; locale: string; kind: string }> =
    seedFoods.flatMap((f) => Object.entries(f.synonyms).flatMap(([locale, words]) => words.map((w) => ({ foodId: f.id, alias: w, normalizedAlias: normalizeSearch(w), locale, kind: "curated_seed" }))));

  const prisma: any = {
    food: {
      findUnique: async ({ where }: any) => foods.find((f) => f.source === where.source_sourceId?.source && f.sourceId === where.source_sourceId?.sourceId) ?? null,
      findMany: async (args: any) => {
        if (args?.where?.id?.in) return foods.filter((f) => args.where.id.in.includes(f.id)).map((f) => ({ ...f, servings: f.servings ?? [] }));
        const orClauses = args?.where?.OR ?? [];
        const searchTextVariants: string[] = orClauses.map((c: any) => c.searchText?.contains).filter(Boolean);
        const nameVariants: any[] = orClauses.filter((c: any) => c.name?.equals || c.originalName?.equals);
        if (nameVariants.length) {
          // findDuplicate's conservative name-based check — no seed food ever
          // collides with a real USDA name in these fixtures, so empty is correct.
          return [];
        }
        if (!searchTextVariants.length) return [];
        return foods.filter((f) => f.createdById === null && searchTextVariants.some((v) => f.searchText.toLowerCase().includes(v.toLowerCase())))
          .map((f) => ({ ...f, servings: f.servings ?? [] }));
      },
      create: async ({ data }: any) => { const food = { id: `dynamic-food-${foods.length}`, createdById: null, ...data }; foods.push(food); return food; }
    },
    foodAlias: {
      findFirst: async ({ where }: any) => aliases.find((a) => a.normalizedAlias === where.normalizedAlias) ? { foodId: aliases.find((a) => a.normalizedAlias === where.normalizedAlias)!.foodId } : null,
      findMany: async ({ where }: any) => {
        const variants: string[] = (where?.OR ?? []).map((c: any) => c.normalizedAlias?.contains).filter(Boolean);
        return aliases.filter((a) => variants.some((v) => a.normalizedAlias.includes(v))).map((a) => ({ foodId: a.foodId, normalizedAlias: a.normalizedAlias }));
      },
      createMany: async ({ data }: any) => { aliases.push(...data); return { count: data.length }; },
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

// normalizedName is deliberately == normalizeSearch(name), the exact
// invariant the real adapter's normalizeUsdaFood() enforces
// (normalizedName: normalizeSearch(name)) — a fixture that set these
// independently would let "exact_normalized_name" tests pass for the wrong
// reason. "Pork hock" (not the messier real "Pork, pickled pork hocks")
// keeps this an exact-match fixture on purpose; the separate weak_match/
// ambiguous tests already cover the messier real-world case.
function candidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "172152", originalName: "Pork hock", name: "Pork hock",
    names: { en: "Pork hock" }, kcalPer100g: 280, fatPer100g: 22, proteinPer100g: 20, carbsPer100g: 0, fiberPer100g: 0, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "172152", sourceUrl: "https://fdc.nal.usda.gov/172152", retrievedAt: "2026-09-09T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/172152", normalizedName: "pork hock", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-09T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", language: "en", ...overrides
  };
}

function salmonCandidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "175167", originalName: "Salmon", name: "Salmon",
    names: { en: "Salmon" }, kcalPer100g: 142, fatPer100g: 6.3, proteinPer100g: 19.8, carbsPer100g: 0, fiberPer100g: 0, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "175167", sourceUrl: "https://fdc.nal.usda.gov/175167", retrievedAt: "2026-09-09T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/175167", normalizedName: "salmon", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-09T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", language: "en", ...overrides
  };
}

function stubIntent(intent: SearchIntent | null): SearchIntentProvider {
  return { id: "stub", generate: async () => intent };
}

// Owner real-iPhone report (2026-09-09): "2 tányér marhahúsleves" ("beef
// soup") stopped at "A tápérték még nincs megbízható ételadathoz kapcsolva"
// (no trustworthy nutrition data) with no plate-quantity estimation
// occurring. A composite-dish-sounding phrase is a genuine local miss, so
// this is a generic USDA-style ingredient (mirroring "Beef broth or
// bouillon") the dynamic resolver could plausibly find via search-intent —
// used here to prove the ARCHITECTURE (local miss -> dynamic resolve ->
// plate/volume quantity estimation), never a hardcoded "marhahúsleves" fix.
// normalizedName deliberately == normalizeSearch(name) == the search-intent
// stub's first searchTerm below — the same exact-match-fixture discipline
// the "csülök"/"Pork hock" fixture above documents, so this exercises the
// real "exact_normalized_name" auto-resolve path rather than confirmation_required.
function beefBrothCandidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "174589", originalName: "Beef broth", name: "Beef broth",
    names: { en: "Beef broth" }, kcalPer100g: 8, fatPer100g: 0.3, proteinPer100g: 1.4, carbsPer100g: 0.2, fiberPer100g: 0, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "174589", sourceUrl: "https://fdc.nal.usda.gov/174589", retrievedAt: "2026-09-09T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/174589", normalizedName: "beef broth", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-09T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", language: "en", ...overrides
  };
}

function makeDynamic(prisma: any, overrides: Partial<{ searchIntentProvider: SearchIntentProvider; adapters: StructuredFoodLookupAdapter[]; userId: string; locale: "hu" | "de" | "en"; localizationProvider: CandidateLocalizationProvider }> = {}): DynamicResolutionDeps {
  return {
    prisma,
    searchIntentProvider: overrides.searchIntentProvider ?? stubIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"], sourceLanguage: "hu" }),
    adapters: overrides.adapters ?? [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }],
    rateLimiter: new DynamicFoodResolutionRateLimiter(),
    userId: overrides.userId ?? "user-1",
    locale: overrides.locale ?? "hu",
    localizationProvider: overrides.localizationProvider ?? fakeLocalizationProvider("Csülök")
  };
}

describe("dynamic trusted food resolution: end-to-end via interpretMealInput", () => {
  it("local hit (tojás) never invokes search-intent or the external adapter", async () => {
    const { prisma } = makeFullPrisma();
    const generate = vi.fn();
    const lookup = vi.fn();
    const result = await interpretMealInput(prisma, "5 tojás", undefined, undefined, makeDynamic(prisma, { searchIntentProvider: { id: "s", generate }, adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }] }));
    expect(result.selectedFood?.id).toBe("catalog-egg");
    expect(generate).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("'150 g csülök': genuine local miss resolves via dynamic external lookup, then normal quantity math applies (exact mass, no AI)", async () => {
    const { prisma } = makeFullPrisma();
    const result = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, makeDynamic(prisma));
    expect(result.foodResolution).toBe("resolved");
    expect(result.selectedFood).toMatchObject({ source: "usda_fdc", sourceId: "172152" });
    expect(result.quantity).toMatchObject({ status: "resolved", grams: 150, method: "measured", requiresConfirmation: false });
    expect(result.canConfirm).toBe(true);
    // Nutrition is whatever the persisted trusted Food carries — never anything the LLM supplied.
    expect((result.selectedFood as any).kcalPer100g).toBe(280);
  });

  it("a genuinely different food category (salmon) uses the exact same general fallback — not a special case", async () => {
    const { prisma } = makeFullPrisma();
    const dynamic = makeDynamic(prisma, {
      searchIntentProvider: stubIntent({ canonicalConcept: "salmon", searchTerms: ["salmon"], sourceLanguage: "hu" }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [salmonCandidate()] }],
      // The convergence gate compares the ORIGINAL phrase ("lazac") against
      // the resolved food's own name representations — needs real evidence,
      // not the file's blanket "Csülök" default (unrelated to salmon).
      localizationProvider: fakeLocalizationProvider("Lazac")
    });
    const result = await interpretMealInput(prisma, "100 g lazac", undefined, undefined, dynamic);
    expect(result.selectedFood).toMatchObject({ source: "usda_fdc", sourceId: "175167" });
    expect(result.quantity).toMatchObject({ grams: 100, method: "measured" });
  });

  it("ambiguous external candidates are surfaced for confirmation, never silently auto-chosen, and AI-understanding never overwrites this outcome", async () => {
    const { prisma } = makeFullPrisma();
    const dynamic = makeDynamic(prisma, {
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate({ confidence: 0.96 }), candidate({ sourceId: "172153", name: "Pork hock, cured", normalizedName: "pork hock cured", confidence: 0.9 })] }]
    });
    const result = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, dynamic);
    expect(result.foodResolution).toBe("confirmation_required");
    expect(result.externalCandidates).toHaveLength(2);
    expect(result.externalCandidatesReason).toBe("ambiguous");
    expect(result.selectedFood).toBeNull();
    // Never forged/invented nutrition on the unresolved-pending-choice result.
    expect(result.quantity).toBeNull();
  });

  it("no adapters configured -> stays honestly unresolved, offers the existing manual fallback, never invents a Food", async () => {
    const { prisma, foods } = makeFullPrisma();
    const result = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, { ...makeDynamic(prisma), adapters: [] });
    expect(result.foodResolution).toBe("unresolved");
    expect(result.selectedFood).toBeNull();
    expect(foods).toHaveLength(1); // only the seeded egg — nothing invented
  });

  it("external provider outage during meal input -> unresolved, no unhandled exception, no invented Food", async () => {
    const { prisma, foods } = makeFullPrisma();
    const dynamic = makeDynamic(prisma, { adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => { throw new Error("upstream secret detail"); } }] });
    const result = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, dynamic);
    expect(result.foodResolution).toBe("unresolved");
    expect(foods).toHaveLength(1);
  });

  it("LLM search-intent unavailable -> deterministic fallback to the raw phrase still attempts the authoritative search", async () => {
    const { prisma } = makeFullPrisma();
    // The deterministic parser already normalizes/strips accents before
    // foodQuery reaches dynamic resolution, so the raw-query fallback sees
    // "csulok", not the original accented "csülök" — this is the same
    // normalized form the parser has used everywhere else all along.
    const normalizedQuery = normalizeSearch("csülök");
    const lookup = vi.fn(async (q: string) => (q === normalizedQuery ? [candidate({ name: "Csülök", originalName: "Csülök", normalizedName: normalizedQuery })] : []));
    const dynamic = makeDynamic(prisma, { searchIntentProvider: new DisabledSearchIntentProvider(), adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }] });
    const result = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, dynamic);
    expect(lookup).toHaveBeenCalledWith(normalizedQuery);
    expect(result.foodResolution).toBe("resolved");
  });

  it("rate-limited user -> unresolved, no external call, no crash", async () => {
    const { prisma } = makeFullPrisma();
    const dynamic = makeDynamic(prisma);
    vi.spyOn(dynamic!.rateLimiter, "consume").mockReturnValue(false);
    const lookup = vi.fn();
    const result = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, { ...dynamic!, adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup }] });
    expect(result.foodResolution).toBe("unresolved");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("multi-food: '150 g csülök, 2 db tojás' resolves the dynamic item and the trusted-serving item independently", async () => {
    const { prisma } = makeFullPrisma();
    const result = await interpretMealInput(prisma, "150 g csülök, 2 db tojás", undefined, undefined, makeDynamic(prisma));
    expect(result.foodResolution).toBe("multi");
    expect(result.items).toHaveLength(2);
    const [pork, egg] = result.items!;
    expect(pork.selectedFood).toMatchObject({ source: "usda_fdc", sourceId: "172152" });
    expect(pork.quantity?.grams).toBe(150);
    expect(egg.selectedFood?.id).toBe("catalog-egg");
    expect(egg.quantity).toMatchObject({ grams: 100, method: "authoritative" });
  });

  it("persist once, reuse forever: first interpretMealInput call resolves+persists via one external call; a second, independent call for the same concept is a pure local hit with zero external calls", async () => {
    const { prisma, foods } = makeFullPrisma();
    let externalCalls = 0;
    const adapters = [{ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => { externalCalls += 1; return [candidate()]; } }];

    const first = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, makeDynamic(prisma, { adapters }));
    expect(first.foodResolution).toBe("resolved");
    expect(externalCalls).toBe(1);
    expect(foods).toHaveLength(2); // seeded egg + newly persisted pork hock

    // A second, independent request (different simulated user) for the exact
    // same phrase must not touch search-intent or the adapter at all: the
    // local search inside interpretOne finds the persisted Food directly.
    const generate = vi.fn();
    const second = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, {
      prisma, searchIntentProvider: { id: "s", generate }, adapters, rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-2"
    });
    expect(second.foodResolution).toBe("resolved");
    expect(second.selectedFood).toMatchObject({ source: "usda_fdc", sourceId: "172152" });
    expect(externalCalls).toBe(1); // unchanged
    expect(generate).not.toHaveBeenCalled(); // never even reached the search-intent step
    expect(foods).toHaveLength(2); // no duplicate Food created
  });

  it("'2 tányér marhahúsleves': a composite-dish-sounding local miss that dynamically resolves gets its plate quantity volume-estimated — not discarded because food resolution took the dynamic path", async () => {
    const { prisma } = makeFullPrisma();
    const dynamic = makeDynamic(prisma, {
      searchIntentProvider: stubIntent({ canonicalConcept: "beef broth", searchTerms: ["beef broth", "beef bouillon"], sourceLanguage: "hu" }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [beefBrothCandidate()] }],
      // Real evidence for the convergence gate (see the salmon test above) —
      // the persisted food's hu name must actually relate to "marhahúsleves".
      localizationProvider: fakeLocalizationProvider("Marhahúsleves")
    });
    const estimate = vi.fn(async ({ parsed }: any) => {
      expect(parsed.unit).toBe("plate"); // container/volume class, not discarded
      const gramsPerUnit = 300;
      return { gramsPerUnit, rangeGramsPerUnit: { min: 220, max: 400 }, confidence: 0.6, method: "ai_estimated" as const, estimationClass: "volume" as const, provenance: { provider: "mock-openrouter", modelOrRule: "fixture", estimatedAt: "2026-09-09T00:00:00.000Z" } } satisfies QuantityEstimate;
    });
    const result = await interpretMealInput(prisma, "2 tányér marhahúsleves", { id: "mock-openrouter", estimate }, undefined, dynamic);
    expect(result.foodResolution).toBe("resolved");
    expect(result.selectedFood).toMatchObject({ source: "usda_fdc", sourceId: "174589" });
    // Trusted nutrition comes from the refetched, persisted authoritative
    // Food — never from the quantity estimator, which only ever supplies grams.
    expect((result.selectedFood as any).kcalPer100g).toBe(8);
    expect(estimate).toHaveBeenCalledTimes(1);
    expect(result.quantity?.status).toBe("resolved");
    expect(result.quantity?.grams).toBeCloseTo(600, 6); // 2 plates x 300 g/plate
    expect(result.quantity?.estimated).toBe(true);
    expect(result.quantity?.method).toBe("ai_estimated");
    expect(result.quantity?.requiresConfirmation).toBe(true);
  });

  it("'2 tányér marhahúsleves' when NEITHER the food nor the quantity can be resolved (no adapters, e.g. a provider outage) fails safely — never invents a Food or fabricates a plate size", async () => {
    const { prisma, foods } = makeFullPrisma();
    const estimate = vi.fn();
    const result = await interpretMealInput(prisma, "2 tányér marhahúsleves", { id: "spy", estimate }, undefined, { ...makeDynamic(prisma), adapters: [] });
    expect(result.foodResolution).toBe("unresolved");
    expect(result.selectedFood).toBeNull();
    expect(result.quantity).toBeNull(); // quantity is never attempted without a resolved food identity
    expect(estimate).not.toHaveBeenCalled();
    expect(foods).toHaveLength(1); // only the seeded egg — nothing invented
  });

  it("a dynamically-resolved food whose AI quantity estimate then fails (provider unavailable) still keeps the trusted food identity, and fails the QUANTITY safely rather than fabricating grams or nutrition", async () => {
    const { prisma } = makeFullPrisma();
    const dynamic = makeDynamic(prisma, {
      searchIntentProvider: stubIntent({ canonicalConcept: "beef broth", searchTerms: ["beef broth"], sourceLanguage: "hu" }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [beefBrothCandidate()] }],
      localizationProvider: fakeLocalizationProvider("Marhahúsleves")
    });
    const estimate = vi.fn(async () => { throw new AiProviderError("http_error", 429); });
    const result = await interpretMealInput(prisma, "2 tányér marhahúsleves", { id: "mock-openrouter", estimate }, undefined, dynamic);
    expect(result.foodResolution).toBe("resolved");
    expect(result.selectedFood).toMatchObject({ source: "usda_fdc", sourceId: "174589" }); // identity unaffected
    expect(result.quantity?.status).toBe("unresolved");
    expect(result.quantity?.reason).toBe("conversion_missing");
    expect(result.quantity?.aiOutcome).toBe("invalid_output");
    expect(result.canConfirm).toBe(false);
    expect(estimate).toHaveBeenCalledTimes(1);
  });
});

// Owner-beta blocker #3 (2026-09-10): two real physical-iPhone failures.
// "1 tányér töltött káposzta" (stuffed cabbage) silently resolved to
// "Cabbage, red, raw"; "1 tányér tojásleves" (egg soup) silently resolved to
// "Tofu". Both went through resolveDynamicFood/resolveAuthoritativeFood with
// zero AI food-understanding involvement (ai: undefined in the real trace) —
// search-intent translated the phrase, and whatever that translation happened
// to weakly echo in the catalog was trusted outright. These reproduce the
// exact mechanism end-to-end via interpretMealInput, the same entry point the
// real app calls.
describe("end-to-end semantic safety: the two real owner-beta failures never reproduce (2026-09-10)", () => {
  it("'töltött káposzta': a mistranslated-but-plausible search intent ('stuffed cabbage') that weakly echoes an unrelated existing local Food never resolves", async () => {
    const cabbage = { id: "cabbage-red-raw", name: "Cabbage, red, raw", originalName: "Cabbage, red, raw", searchText: "cabbage red raw" };
    const { prisma } = makeFullPrisma([cabbage]);
    const dynamic = makeDynamic(prisma, {
      searchIntentProvider: stubIntent({ canonicalConcept: "stuffed cabbage", searchTerms: ["stuffed cabbage"], sourceLanguage: "hu" }),
      adapters: [] // isolates the primary local-resolution gate: no external path to fall back on
    });
    const result = await interpretMealInput(prisma, "1 tányér töltött káposzta", undefined, undefined, dynamic);
    expect(result.foodResolution).not.toBe("resolved");
    expect(result.selectedFood?.id).not.toBe("cabbage-red-raw");
  });

  it("'tojásleves': even when the mistranslated search intent ('tofu soup') exact-matches a FRESH external candidate (satisfying resolveAuthoritativeFood's own criteria), the convergence gate still blocks it because 'tojásleves' shares nothing with 'Tofu soup'", async () => {
    const { prisma } = makeFullPrisma();
    const tofuSoupCandidate: ExternalFoodCandidate = {
      source: "usda_fdc", sourceId: "111222", originalName: "Tofu soup", name: "Tofu soup",
      names: { en: "Tofu soup" }, kcalPer100g: 40, fatPer100g: 2, proteinPer100g: 4, carbsPer100g: 2, fiberPer100g: 0.5,
      nutrients: [], provenance: { source: "USDA FoodData Central", sourceId: "111222", sourceUrl: "https://fdc.nal.usda.gov/111222", retrievedAt: "2026-09-10T00:00:00.000Z", valuesPer: "100 g" },
      sourceUrl: "https://fdc.nal.usda.gov/111222", normalizedName: "tofu soup", nutrientBasis: "per_100_g",
      retrievedAt: "2026-09-10T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", language: "en"
    };
    const dynamic = makeDynamic(prisma, {
      searchIntentProvider: stubIntent({ canonicalConcept: "tofu soup", searchTerms: ["tofu soup"], sourceLanguage: "hu" }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [tofuSoupCandidate] }]
    });
    const result = await interpretMealInput(prisma, "1 tányér tojásleves", undefined, undefined, dynamic);
    expect(result.foodResolution).not.toBe("resolved");
    expect(result.selectedFood?.sourceId).not.toBe("111222");
  });

  // Proves the trust boundary independently of any specific provider/model
  // quality: no matter how absurd the AI search intent is, an unrelated local
  // Food it happens to weakly echo must never become trusted identity.
  it("adversarial search intent: an absurd translation ('banana smoothie' for 'tojásleves') cannot corrupt trust even though the catalog happens to contain a weakly-matching Food ('Banana')", async () => {
    const banana = { id: "banana", name: "Banana", originalName: "Banana", searchText: "banana" };
    const { prisma } = makeFullPrisma([banana]);
    const dynamic = makeDynamic(prisma, {
      searchIntentProvider: stubIntent({ canonicalConcept: "banana smoothie", searchTerms: ["banana smoothie"], sourceLanguage: "hu" }),
      adapters: []
    });
    const result = await interpretMealInput(prisma, "1 tányér tojásleves", undefined, undefined, dynamic);
    expect(result.foodResolution).not.toBe("resolved");
    expect(result.selectedFood?.id).not.toBe("banana");
  });
});
