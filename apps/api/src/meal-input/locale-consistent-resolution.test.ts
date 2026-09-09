import { describe, expect, it, vi } from "vitest";
import { interpretMealInput, type DynamicResolutionDeps } from "./interpret.js";
import { normalizeSearch } from "../catalog/normalize.js";
import { DynamicFoodResolutionRateLimiter } from "../catalog/dynamic-food-rate-limit.js";
import { type SearchIntent, type SearchIntentProvider } from "../catalog/search-intent.js";
import type { CandidateLocalizationProvider } from "../catalog/candidate-localization.js";
import type { ExternalFoodCandidate, StructuredFoodLookupAdapter } from "../catalog/external-food.js";

/**
 * Proves the mission-critical invariant: the USER'S CONFIGURED APP LANGUAGE
 * (deps.locale — sourced server-side from the authenticated user's own
 * persisted profile, never a client header) controls candidate/food display
 * text, completely independent of what language the food PHRASE was typed
 * in. A Hungarian-UI user typing "Schweinshaxe" or "pork hock" must see the
 * exact same Hungarian presentation as one typing "csülök" — and the reverse
 * for a German-UI user. Identity (source/sourceId/nutrition) never changes.
 */

function makeFullPrisma() {
  const foods: any[] = [];
  const aliases: any[] = [];
  const prisma: any = {
    food: {
      findUnique: async ({ where }: any) => foods.find((f) => f.source === where.source_sourceId?.source && f.sourceId === where.source_sourceId?.sourceId) ?? null,
      findMany: async (args: any) => {
        const orClauses = args?.where?.OR ?? [];
        const nameVariants: any[] = orClauses.filter((c: any) => c.name?.equals || c.originalName?.equals);
        if (nameVariants.length) return [];
        const searchTextVariants: string[] = orClauses.map((c: any) => c.searchText?.contains).filter(Boolean);
        if (!searchTextVariants.length) return [];
        return foods.filter((f) => f.createdById === null && searchTextVariants.some((v) => (f.searchText ?? "").toLowerCase().includes(v.toLowerCase())))
          .map((f) => ({ ...f, servings: f.servings ?? [] }));
      },
      create: async ({ data }: any) => { const food = { id: `dynamic-food-${foods.length}`, createdById: null, ...data }; foods.push(food); return food; },
      update: async ({ where, data }: any) => { const food = foods.find((f) => f.id === where.id); Object.assign(food, data); return food; }
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
  return { prisma, foods };
}

function porkHockCandidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "172152", originalName: "Pork hock", name: "Pork hock",
    names: { en: "Pork hock" }, kcalPer100g: 280, fatPer100g: 22, proteinPer100g: 20, carbsPer100g: 0, fiberPer100g: 0, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "172152", sourceUrl: "https://fdc.nal.usda.gov/172152", retrievedAt: "2026-09-09T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/172152", normalizedName: "pork hock", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-09T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", ...overrides
  } as ExternalFoodCandidate;
}

function stubIntent(intent: SearchIntent | null): SearchIntentProvider {
  return { id: "stub", generate: async () => intent };
}

/** A deterministic fake standing in for the real LLM — translates by looking
 * up the authoritative name in a fixed table, exactly what the real prompt
 * asks the model to do, but without any network call. */
function fakeLocalizationProvider(table: Record<string, Partial<Record<"hu" | "de", string>>>): CandidateLocalizationProvider {
  return {
    id: "fixture",
    async localize(items, targetLocale) {
      const map = new Map<string, string>();
      for (const item of items) {
        const translated = table[item.authoritativeName]?.[targetLocale as "hu" | "de"];
        if (translated) map.set(item.id, translated);
      }
      return map;
    }
  };
}

const porkHockTranslations = { "Pork hock": { hu: "Sertéscsülök", de: "Schweinshaxe" } };

function makeDynamic(prisma: any, overrides: Partial<{
  searchIntentProvider: SearchIntentProvider; adapters: StructuredFoodLookupAdapter[]; userId: string;
  locale: "hu" | "de" | "en"; localizationProvider: CandidateLocalizationProvider;
}> = {}): DynamicResolutionDeps {
  return {
    prisma,
    searchIntentProvider: overrides.searchIntentProvider ?? stubIntent({ canonicalConcept: "pork hock", searchTerms: ["pork hock"], sourceLanguage: "unknown" }),
    adapters: overrides.adapters ?? [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [porkHockCandidate()] }],
    rateLimiter: new DynamicFoodResolutionRateLimiter(),
    userId: overrides.userId ?? "user-1",
    locale: overrides.locale ?? "hu",
    localizationProvider: overrides.localizationProvider ?? fakeLocalizationProvider(porkHockTranslations)
  };
}

describe("input-language independence: the UI locale, never the phrase's language, controls presentation", () => {
  it.each([
    ["150 g csülök", "Hungarian phrase"],
    ["150 g Schweinshaxe", "German phrase"],
    ["150 g pork hock", "English phrase"]
  ])("Hungarian-UI user typing a genuinely ambiguous match in ANY language (%s / %s) sees the SAME Hungarian candidate name", async (input) => {
    const { prisma } = makeFullPrisma();
    // Two near-equal-confidence candidates forces confirmation_required so
    // the candidate LIST (not just a single resolved Food) is inspectable.
    const dynamic = makeDynamic(prisma, {
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [porkHockCandidate({ confidence: 0.96 }), porkHockCandidate({ sourceId: "172153", name: "Pork hock, cured", originalName: "Pork hock, cured", normalizedName: "pork hock cured", confidence: 0.9 })] }],
      locale: "hu"
    });
    const result = await interpretMealInput(prisma, input, undefined, undefined, dynamic);
    expect(result.foodResolution).toBe("confirmation_required");
    expect(result.externalCandidates?.[0].names).toMatchObject({ en: "Pork hock", hu: "Sertéscsülök" });
    // Identity is completely unaffected by the input phrase's language.
    expect(result.externalCandidates?.[0].source).toBe("usda_fdc");
    expect(result.externalCandidates?.[0].sourceId).toBe("172152");
  });

  it.each([
    ["150 g csülök", "Hungarian phrase"],
    ["150 g Schweinshaxe", "German phrase"],
    ["150 g pork hock", "English phrase"]
  ])("German-UI user typing the same food in ANY language (%s / %s) sees the SAME German candidate name", async (input) => {
    const { prisma } = makeFullPrisma();
    const dynamic = makeDynamic(prisma, {
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [porkHockCandidate({ confidence: 0.96 }), porkHockCandidate({ sourceId: "172153", name: "Pork hock, cured", originalName: "Pork hock, cured", normalizedName: "pork hock cured", confidence: 0.9 })] }],
      locale: "de"
    });
    const result = await interpretMealInput(prisma, input, undefined, undefined, dynamic);
    expect(result.foodResolution).toBe("confirmation_required");
    expect(result.externalCandidates?.[0].names).toMatchObject({ en: "Pork hock", de: "Schweinshaxe" });
  });

  it("English-UI user gets the authoritative English name directly — zero localization calls, in any input language", async () => {
    const { prisma } = makeFullPrisma();
    const localize = vi.fn();
    const dynamic = makeDynamic(prisma, {
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [porkHockCandidate({ confidence: 0.96 }), porkHockCandidate({ sourceId: "172153", name: "Pork hock, cured", originalName: "Pork hock, cured", normalizedName: "pork hock cured", confidence: 0.9 })] }],
      locale: "en",
      localizationProvider: { id: "spy", localize }
    });
    const result = await interpretMealInput(prisma, "150 g Schweinshaxe", undefined, undefined, dynamic);
    expect(result.foodResolution).toBe("confirmation_required");
    expect(result.externalCandidates?.[0].name).toBe("Pork hock");
    expect(localize).not.toHaveBeenCalled();
  });
});

describe("cross-language production-shaped scenario: a different food category also localizes correctly", () => {
  const bolognaTranslations = { "Bologna, pork": { hu: "Sertés bolognai felvágott" } };
  function bolognaCandidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
    return {
      source: "usda_fdc", sourceId: "168277", originalName: "Bologna, pork", name: "Bologna, pork",
      names: { en: "Bologna, pork" }, kcalPer100g: 283, fatPer100g: 24, proteinPer100g: 12, carbsPer100g: 3, fiberPer100g: 0, nutrients: [],
      provenance: { source: "USDA FoodData Central", sourceId: "168277", sourceUrl: "https://fdc.nal.usda.gov/168277", retrievedAt: "2026-09-09T00:00:00.000Z", valuesPer: "100 g" },
      sourceUrl: "https://fdc.nal.usda.gov/168277", normalizedName: "bologna pork", nutrientBasis: "per_100_g",
      retrievedAt: "2026-09-09T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", ...overrides
    } as ExternalFoodCandidate;
  }

  it("'100 g szalámi' resolves+persists with a Hungarian display name via the same general mechanism (not a special case)", async () => {
    const { prisma, foods } = makeFullPrisma();
    const dynamic = makeDynamic(prisma, {
      searchIntentProvider: stubIntent({ canonicalConcept: "bologna pork", searchTerms: ["bologna pork"], sourceLanguage: "hu" }),
      adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [bolognaCandidate()] }],
      locale: "hu",
      localizationProvider: fakeLocalizationProvider(bolognaTranslations)
    });
    const result = await interpretMealInput(prisma, "100 g szalámi", undefined, undefined, dynamic);
    expect(result.foodResolution).toBe("resolved");
    expect(result.selectedFood).toMatchObject({ source: "usda_fdc", sourceId: "168277" });
    expect((result.selectedFood as any).names).toMatchObject({ en: "Bologna, pork", hu: "Sertés bolognai felvágott" });
    expect(foods).toHaveLength(1);
  });
});

describe("persist-once-reuse-forever also covers the localized name: second hit needs zero further localization calls", () => {
  it("first miss localizes + persists; a second, independent request (even a different user's locale) reuses the persisted Food locally", async () => {
    const { prisma, foods } = makeFullPrisma();
    let localizeCalls = 0;
    const localizationProvider: CandidateLocalizationProvider = {
      id: "counting",
      async localize(items, targetLocale) {
        localizeCalls += 1;
        return fakeLocalizationProvider(porkHockTranslations).localize(items, targetLocale);
      }
    };
    const first = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, makeDynamic(prisma, { locale: "hu", localizationProvider }));
    expect(first.foodResolution).toBe("resolved");
    expect(localizeCalls).toBe(1);
    expect(foods).toHaveLength(1);

    const generate = vi.fn();
    const second = await interpretMealInput(prisma, "150 g csülök", undefined, undefined, {
      prisma, searchIntentProvider: { id: "s", generate }, adapters: [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [porkHockCandidate()] }],
      rateLimiter: new DynamicFoodResolutionRateLimiter(), userId: "user-2", locale: "hu", localizationProvider
    });
    expect(second.foodResolution).toBe("resolved");
    expect(generate).not.toHaveBeenCalled();
    expect(localizeCalls).toBe(1); // unchanged — the local hit never re-localizes
    expect((second.selectedFood as any).names).toMatchObject({ hu: "Sertéscsülök" });
  });
});
