process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/ketomentor?schema=ketomentor";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.JWT_REFRESH_SECRET = "b".repeat(32);

import { describe, expect, it, vi } from "vitest";
import { confirmAuthoritativeFood, externalFoodConfirmationSchema, resolveAuthoritativeFood, resolveBarcodeFood, validateExternalCandidate, type ExternalFoodCandidate } from "./external-food.js";
import { EXTERNAL_FOOD_CONFIRM_RATE_LIMIT, EXTERNAL_FOOD_RATE_LIMIT, externalFoodRateLimitKey } from "./external-food-rate-limit.js";
import { normalizeOffProduct, normalizeUsdaNutrients, OpenFoodFactsProductAdapter, UsdaFoodDataCentralLookupAdapter } from "./structured-source-adapters.js";

function candidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  return {
    source: "usda_fdc", sourceId: "123", originalName: "Raw spinach", name: "Raw spinach",
    names: { en: "Raw spinach" }, kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9,
    carbsPer100g: 3.6, fiberPer100g: 2.2, nutrients: [],
    provenance: { source: "USDA FoodData Central", sourceId: "123", sourceUrl: "https://fdc.nal.usda.gov/123", retrievedAt: "2026-08-26T00:00:00.000Z", valuesPer: "100 g" },
    sourceUrl: "https://fdc.nal.usda.gov/123", normalizedName: "raw spinach", nutrientBasis: "per_100_g",
    retrievedAt: "2026-08-26T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name", language: "en", ...overrides
  };
}

function fakePrisma(options: { local?: any; sourceDuplicate?: any; nameDuplicate?: any; aliasDuplicate?: any; raceDuplicate?: any } = {}) {
  let created: any = null;
  let uniqueCalls = 0;
  const updateCalls: any[] = [];
  const prisma: any = {
    foodAlias: {
      findMany: async () => [],
      findFirst: async () => options.aliasDuplicate ? { foodId: options.aliasDuplicate.id } : null,
      createMany: async () => ({ count: 1 })
    },
    food: {
      findUnique: async () => { uniqueCalls += 1; return options.sourceDuplicate ?? (uniqueCalls > 2 ? options.raceDuplicate : null) ?? null; },
      findMany: async (args: any) => {
        if (args.where?.OR?.some((part: any) => part.name?.equals || part.originalName?.equals)) return options.nameDuplicate ? [options.nameDuplicate] : [];
        if (args.where?.OR?.some((part: any) => part.searchText?.contains)) return options.local ? [options.local] : [];
        return [];
      },
      create: async ({ data }: any) => (created = { id: "new-food", ...data }),
      // Only ever used by backfillLocaleName (an existing Food gaining a
      // display name for a locale it was missing) — never mutates identity.
      update: async ({ where, data }: any) => {
        updateCalls.push({ where, data });
        const base = [options.sourceDuplicate, options.nameDuplicate, options.raceDuplicate].find((food) => food?.id === where.id) ?? { id: where.id };
        return { ...base, ...data };
      }
    },
    nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
    foodNutrient: { create: async () => ({}) },
    $transaction: async (fn: any) => fn(prisma)
  };
  return { prisma, getCreated: () => created, getUpdateCalls: () => updateCalls };
}

describe("authoritative food resolution", () => {
  it("uses a dedicated authenticated-user external lookup quota", () => {
    expect(EXTERNAL_FOOD_RATE_LIMIT).toEqual({ windowMs: 900_000, limit: 10 });
    expect(externalFoodRateLimitKey({ user: { id: "user-1" } })).toBe("user-1");
    expect(() => externalFoodRateLimitKey({})).toThrow("Authenticated user required");
  });
  it("uses a separate confirmation quota", () => expect(EXTERNAL_FOOD_CONFIRM_RATE_LIMIT).toEqual({ windowMs: 900_000, limit: 10 }));
  it("lets a local match win without calling an external adapter", async () => {
    const local = { id: "local", name: "Spinach", originalName: "Spinach", names: {}, searchText: "spinach", servings: [] };
    const { prisma } = fakePrisma({ local });
    const lookup = vi.fn();
    const result = await resolveAuthoritativeFood(prisma, "spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup }]);
    expect(result.status).toBe("resolved_local");
    expect(lookup).not.toHaveBeenCalled();
  });

  it("returns an existing source mapping instead of overwriting it", async () => {
    const existing = { id: "existing", source: "usda_fdc", sourceId: "123", servings: [] };
    const { prisma, getCreated } = fakePrisma({ sourceDuplicate: existing });
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }]);
    expect(result).toMatchObject({ status: "resolved_local", food: { id: "existing" } });
    expect(getCreated()).toBeNull();
  });

  it("persists one unambiguous high-confidence candidate with provenance", async () => {
    const { prisma, getCreated } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }]);
    expect(result.status).toBe("resolved_external");
    expect(getCreated()).toMatchObject({ source: "usda_fdc", sourceId: "123", provenance: expect.objectContaining({ source: "USDA FoodData Central" }) });
  });

  it("requires confirmation for ambiguous candidates", async () => {
    const { prisma } = fakePrisma();
    // Both candidates are genuinely relevant to the query (share every
    // significant query token) — this test is about the confidence-gap
    // dedup logic, not about candidate relevance filtering (see the
    // "minimum semantic relevance" describe block below for that).
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate({ confidence: 0.96 }), candidate({ sourceId: "124", name: "Spinach, raw, baby", normalizedName: "spinach raw baby", confidence: 0.91 })] }]);
    expect(result).toMatchObject({ status: "confirmation_required", reason: "ambiguous" });
  });

  it("requires review for a near but non-exact result regardless of policy score", async () => {
    const { prisma, getCreated } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate({ confidence: 0.99, matchPolicy: "review_required" })] }]);
    expect(result).toMatchObject({ status: "confirmation_required", reason: "weak_match" });
    expect(getCreated()).toBeNull();
  });

  it("distinguishes successful empty lookup from total provider outage", async () => {
    const { prisma } = fakePrisma();
    await expect(resolveAuthoritativeFood(prisma, "unknown", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }])).resolves.toMatchObject({ reason: "not_found" });
    await expect(resolveAuthoritativeFood(prisma, "unknown", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => { throw new Error("secret upstream detail"); } }])).resolves.toMatchObject({ reason: "external_unavailable" });
  });

  it("continues after one provider fails and uses a later successful result", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [
      { source: "usda_fdc", sourceName: "broken", lookup: async () => { throw new Error("timeout"); } },
      { source: "usda_fdc", sourceName: "working", lookup: async () => [candidate()] }
    ]);
    expect(result.status).toBe("resolved_external");
  });

  it("requires confirmation for a conservative canonical-name duplicate", async () => {
    const duplicate = { id: "similar", name: "Raw spinach", originalName: "Spinach raw", source: "bls", sourceId: "B1", servings: [] };
    const { prisma } = fakePrisma({ nameDuplicate: duplicate });
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }]);
    expect(result).toMatchObject({ status: "confirmation_required", reason: "possible_duplicate" });
  });

  it("rejects malformed and nutritionally incomplete external data", async () => {
    expect(validateExternalCandidate({ name: "invented" })).toBeNull();
    expect(validateExternalCandidate(candidate({ proteinPer100g: Number.NaN }))).toBeNull();
    const { prisma } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "unknown", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [{ name: "No macros" }] }]);
    expect(result).toMatchObject({ status: "unresolved", reason: "invalid_external_data" });
  });
});

// Owner-beta blocker #3 (2026-09-10): resolveAuthoritativeFood's
// "resolved_local" short-circuit used to trust ANY nonzero local search
// score — real physical-iPhone production traces showed a search-intent
// translation ("stuffed cabbage", "tofu soup") coincidentally echoing an
// unrelated existing catalog Food ("Cabbage, red, raw", "Tofu") at
// stage="partial"/score=25, and that weak echo was promoted straight to
// "resolved_local" with zero threshold, then treated as full-confidence
// identity by interpret.ts. This now uses the exact same strong-match bar
// (isTrustedLocalMatch, shared with interpretOne) as every other local-search
// consumer, so the two can never drift apart again.
describe("strong-local-resolution gate on resolveAuthoritativeFood (owner-beta blocker #3, 2026-09-10)", () => {
  it("a weak local partial match is never promoted to resolved_local (the real 'stuffed cabbage' -> 'Cabbage, red, raw' case, stage=partial score=25)", async () => {
    const cabbage = { id: "cabbage-red-raw", name: "Cabbage, red, raw", originalName: "Cabbage, red, raw", names: {}, searchText: "cabbage red raw", servings: [] };
    const { prisma } = fakePrisma({ local: cabbage });
    const lookup = vi.fn(async () => []);
    const result = await resolveAuthoritativeFood(prisma, "stuffed cabbage", [{ source: "usda_fdc", sourceName: "USDA", lookup }]);
    expect(result.status).not.toBe("resolved_local");
    // Falls through to the external adapter exactly as a genuine local miss would — never silently discarded either.
    expect(lookup).toHaveBeenCalled();
  });

  it("a weak local partial match is never promoted to resolved_local (the real 'tofu soup' -> 'Tofu' case, stage=partial score=25)", async () => {
    const tofu = { id: "tofu", name: "Tofu", originalName: "Tofu", names: {}, searchText: "tofu", servings: [] };
    const { prisma } = fakePrisma({ local: tofu });
    const lookup = vi.fn(async () => []);
    const result = await resolveAuthoritativeFood(prisma, "tofu soup", [{ source: "usda_fdc", sourceName: "USDA", lookup }]);
    expect(result.status).not.toBe("resolved_local");
    expect(lookup).toHaveBeenCalled();
  });

  it("a genuinely strong local match (exact name) still short-circuits without calling the external adapter", async () => {
    const stuffedCabbage = { id: "stuffed-cabbage-dish", name: "Stuffed cabbage", originalName: "Stuffed cabbage", names: {}, searchText: "stuffed cabbage", servings: [] };
    const { prisma } = fakePrisma({ local: stuffedCabbage });
    const lookup = vi.fn();
    const result = await resolveAuthoritativeFood(prisma, "stuffed cabbage", [{ source: "usda_fdc", sourceName: "USDA", lookup }]);
    expect(result).toMatchObject({ status: "resolved_local", food: { id: "stuffed-cabbage-dish" } });
    expect(lookup).not.toHaveBeenCalled();
  });
});

describe("minimum semantic relevance floor (regression: 2026-09-10, borsófőzelék dynamic resolution surfaced pizza and unrelated stewed-dish candidates)", () => {
  it("drops a result that shares no meaningful word with the query even though it structurally validates", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "pea stew", [{
      source: "usda_fdc", sourceName: "USDA",
      lookup: async () => [
        candidate({ sourceId: "1", name: "Chicken, stewing, meat and skin, cooked, stewed", normalizedName: "chicken stewing meat and skin cooked stewed", matchPolicy: "review_required" }),
        candidate({ sourceId: "2", name: "Acorn stew (Apache)", normalizedName: "acorn stew apache", matchPolicy: "review_required" })
      ]
    }]);
    // Neither result contains "pea" at all — sharing only the generic word
    // "stew"/"stewing" is not enough to count as relevant.
    expect(result).toMatchObject({ status: "unresolved", reason: "not_found" });
  });

  it("still surfaces a genuinely relevant result sharing every significant query word (non-regression for the working beef-broth flow)", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "beef broth", [{
      source: "usda_fdc", sourceName: "USDA",
      lookup: async () => [candidate({ sourceId: "3", name: "Soup, beef broth, cubed, dry", normalizedName: "soup beef broth cubed dry", matchPolicy: "review_required" })]
    }]);
    expect(result).toMatchObject({ status: "confirmation_required", reason: "weak_match" });
  });

  it("does not filter when the query has no specific-enough word to check (degrades to the existing confidence-based logic)", async () => {
    const { prisma } = fakePrisma();
    const result = await resolveAuthoritativeFood(prisma, "of a", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }]);
    expect(result.status).not.toBe("unresolved");
  });
});

describe("authoritative food confirmation", () => {
  const adapter = (lookupById: (sourceId: string) => Promise<unknown>) => ({ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => [], lookupById });

  it("re-fetches and persists authoritative data using only source identity", async () => {
    const { prisma, getCreated } = fakePrisma();
    const lookupById = vi.fn(async () => candidate({ matchPolicy: "review_required" }));
    const result = await confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(lookupById)]);
    expect(lookupById).toHaveBeenCalledWith("123");
    expect(result.status).toBe("confirmed");
    expect(getCreated()).toMatchObject({ source: "usda_fdc", sourceId: "123", kcalPer100g: 23 });
  });

  it("returns an existing source record without overwriting it", async () => {
    const existing = { id: "existing", source: "usda_fdc", sourceId: "123", servings: [] };
    const { prisma, getCreated } = fakePrisma({ sourceDuplicate: existing });
    const lookupById = vi.fn();
    await expect(confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(lookupById)])).resolves.toMatchObject({ status: "existing", food: { id: "existing" } });
    expect(lookupById).not.toHaveBeenCalled(); expect(getCreated()).toBeNull();
  });

  it("does not overwrite a semantic duplicate", async () => {
    const duplicate = { id: "bls", name: "Raw spinach", originalName: "Raw spinach", source: "bls", sourceId: "B1", servings: [] };
    const { prisma, getCreated } = fakePrisma({ nameDuplicate: duplicate });
    await expect(confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(async () => candidate())])).resolves.toMatchObject({ status: "confirmation_required", reason: "possible_duplicate" });
    expect(getCreated()).toBeNull();
  });

  it("handles missing config, upstream failure, malformed data, and missing fiber safely", async () => {
    const { prisma, getCreated } = fakePrisma();
    await expect(confirmAuthoritativeFood(prisma, "usda_fdc", "123", [])).resolves.toMatchObject({ reason: "external_unavailable" });
    await expect(confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(async () => { throw new Error("secret"); })])).resolves.toMatchObject({ reason: "external_unavailable" });
    await expect(confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(async () => ({ arbitrary: "client nutrition" }))])).resolves.toMatchObject({ reason: "invalid_external_data" });
    await expect(confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(async () => candidate({ fiberPer100g: undefined as any }))])).resolves.toMatchObject({ reason: "invalid_external_data" });
    expect(getCreated()).toBeNull();
  });

  it("resolves a concurrent unique-key race to the existing record", async () => {
    const raced = { id: "raced", source: "usda_fdc", sourceId: "123", servings: [] };
    const { prisma } = fakePrisma({ raceDuplicate: raced });
    prisma.food.create = async () => { throw { code: "P2002" }; };
    await expect(confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(async () => candidate())])).resolves.toMatchObject({ status: "existing", food: { id: "raced" } });
  });
});

describe("locale-aware presentation: authoritative identity is never rewritten, only annotated", () => {
  const adapter = (lookupById: (sourceId: string) => Promise<unknown>) => ({ source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => [], lookupById });
  // Echoes back the id it was actually given, matching the real provider's
  // "id must round-trip" contract — the caller (candidate list localization
  // uses index-based ids "0","1",...; existing-Food backfill uses the real DB
  // id) decides what id to send, this fixture must not assume which.
  const fakeLocalizationProvider = (displayName: string) => ({ id: "fixture", localize: vi.fn(async (items: { id: string }[]) => new Map(items.map((item) => [item.id, displayName]))) });

  it("resolveAuthoritativeFood: localizes the confirmation_required candidate list in one batched call, never touching identity/nutrition", async () => {
    const { prisma } = fakePrisma();
    const provider = fakeLocalizationProvider("Pácolt sertéscsülök");
    // Query matches the (relevant) default candidate's identity — this test
    // is about localization mechanics, not candidate relevance filtering.
    const result = await resolveAuthoritativeFood(prisma, "spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate({ confidence: 0.99, matchPolicy: "review_required" })] }], { locale: "hu", provider });
    expect(provider.localize).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: "confirmation_required" });
    if (result.status === "confirmation_required") {
      expect(result.candidates[0].names).toMatchObject({ en: "Raw spinach", hu: "Pácolt sertéscsülök" });
      expect(result.candidates[0].source).toBe("usda_fdc");
      expect(result.candidates[0].sourceId).toBe("123");
      expect(result.candidates[0].kcalPer100g).toBe(23);
    }
  });

  it("resolveAuthoritativeFood: persists the auto-resolved Food with the locale's display name already filled in", async () => {
    const { prisma, getCreated } = fakePrisma();
    const provider = fakeLocalizationProvider("Nyers spenót");
    const result = await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }], { locale: "hu", provider });
    expect(result.status).toBe("resolved_external");
    expect(getCreated()?.names).toMatchObject({ en: "Raw spinach", hu: "Nyers spenót" });
  });

  it("resolveAuthoritativeFood: skips the localization call entirely for English", async () => {
    const { prisma } = fakePrisma();
    const provider = fakeLocalizationProvider("unused");
    await resolveAuthoritativeFood(prisma, "raw spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate()] }], { locale: "en", provider });
    expect(provider.localize).not.toHaveBeenCalled();
  });

  it("resolveAuthoritativeFood: never localizes on a local hit — zero AI calls on the hot path", async () => {
    const local = { id: "local", name: "Spinach", originalName: "Spinach", names: {}, searchText: "spinach", servings: [] };
    const { prisma } = fakePrisma({ local });
    const provider = fakeLocalizationProvider("unused");
    const result = await resolveAuthoritativeFood(prisma, "spinach", [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [] }], { locale: "hu", provider });
    expect(result.status).toBe("resolved_local");
    expect(provider.localize).not.toHaveBeenCalled();
  });

  it("confirmAuthoritativeFood: persists the confirmed Food with the confirming user's locale name", async () => {
    const { prisma, getCreated } = fakePrisma();
    const provider = fakeLocalizationProvider("Pácolt sertéscsülök");
    const result = await confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(async () => candidate())], { locale: "hu", provider });
    expect(result.status).toBe("confirmed");
    expect(getCreated()?.names).toMatchObject({ en: "Raw spinach", hu: "Pácolt sertéscsülök" });
    // The refetched, server-validated nutrition is what got persisted — never
    // anything localization-adjacent overriding it.
    expect(getCreated()?.kcalPer100g).toBe(23);
  });

  it("confirmAuthoritativeFood: backfills a missing locale name on an already-existing Food (bounded, one call) rather than leaving it English-only forever", async () => {
    const existing = { id: "existing", source: "usda_fdc", sourceId: "123", name: "Raw spinach", originalName: "Raw spinach", names: { en: "Raw spinach" }, servings: [] };
    const { prisma, getUpdateCalls } = fakePrisma({ sourceDuplicate: existing });
    const provider = fakeLocalizationProvider("Nyers spenót");
    const result = await confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(vi.fn())], { locale: "hu", provider });
    expect(result.status).toBe("existing");
    expect(provider.localize).toHaveBeenCalledTimes(1);
    expect(getUpdateCalls()).toHaveLength(1);
    if (result.status === "existing") expect(result.food.names).toMatchObject({ en: "Raw spinach", hu: "Nyers spenót" });
    // Regression (found live in production on 2026-09-09): local full-text
    // search only ever queries searchText, never names directly. A backfill
    // that updated names but not searchText left a Food permanently
    // unfindable by local search in the newly-backfilled locale — every
    // future query in that language would silently re-run external
    // resolution (or fail) instead of hitting the already-persisted Food.
    expect(getUpdateCalls()[0].data.searchText).toContain("nyers spenot");
  });

  it("confirmAuthoritativeFood: never re-localizes an existing Food that already has the locale's name — zero calls", async () => {
    const existing = { id: "existing", source: "usda_fdc", sourceId: "123", name: "Raw spinach", names: { en: "Raw spinach", hu: "Nyers spenót" }, servings: [] };
    const { prisma, getUpdateCalls } = fakePrisma({ sourceDuplicate: existing });
    const provider = fakeLocalizationProvider("unused");
    await confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(vi.fn())], { locale: "hu", provider });
    expect(provider.localize).not.toHaveBeenCalled();
    expect(getUpdateCalls()).toHaveLength(0);
  });

  it("a localization failure never blocks confirmation — the authoritative name is a safe fallback", async () => {
    const { prisma, getCreated } = fakePrisma();
    const failingProvider = { id: "fixture", localize: vi.fn(async () => { throw new Error("timeout"); }) };
    // localize() on the real provider never throws (see candidate-localization.test.ts),
    // but external-food.ts must not assume that of every possible provider.
    const safeProvider = { id: "fixture", localize: vi.fn(async () => new Map()) };
    for (const provider of [failingProvider, safeProvider]) {
      const result = await confirmAuthoritativeFood(prisma, "usda_fdc", "123", [adapter(async () => candidate())], { locale: "hu", provider }).catch((error) => ({ status: "threw", error }));
      expect(result.status).not.toBe("threw");
    }
    expect(getCreated()?.names).toMatchObject({ en: "Raw spinach" });
  });
});

describe("USDA structured lookup adapter", () => {
  it("normalizes authoritative per-100-g macros and traceable provenance", async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ foods: [{ fdcId: 123, description: "Raw spinach", dataType: "Foundation", foodCategory: "Vegetables", foodNutrients: [
      { nutrientId: 1008, nutrientName: "Energy", unitName: "kcal", value: 23 }, { nutrientId: 1003, nutrientName: "Protein", unitName: "g", value: 2.9 },
      { nutrientId: 1004, nutrientName: "Total lipid (fat)", unitName: "g", value: 0.4 }, { nutrientId: 1005, nutrientName: "Carbohydrate, by difference", unitName: "g", value: 3.6 },
      { nutrientId: 1079, nutrientName: "Fiber, total dietary", unitName: "g", value: 2.2 }, { nutrientId: 1087, nutrientName: "Calcium", unitName: "mg", value: 99 }
    ] }] }) })) as any;
    const [food] = await new UsdaFoodDataCentralLookupAdapter("test-key", fetcher).lookup("Raw spinach");
    expect(food).toMatchObject({ source: "usda_fdc", sourceId: "123", normalizedName: "raw spinach", nutrientBasis: "per_100_g", kcalPer100g: 23, confidence: 0.97 });
    expect(food.provenance).toMatchObject({ source: "USDA FoodData Central", valuesPer: "100 g" });
    expect(food.nutrients).toEqual(expect.arrayContaining([expect.objectContaining({ key: "calcium", amountPer100g: 99 })]));
  });

  it.each([
    ["whole milk", "milk"], ["skim milk", "whole milk"], ["scrambled egg", "egg"],
    ["chicken breast", "chicken"], ["spinach raw", "spinach cooked"]
  ])("does not merge preparation/state variants: %s vs %s", async (externalName, existingName) => {
    const duplicate = { id: "different", name: existingName, originalName: existingName, source: "bls", sourceId: "B1", servings: [] };
    const { prisma } = fakePrisma({ nameDuplicate: duplicate });
    const result = await resolveAuthoritativeFood(prisma, externalName, [{ source: "usda_fdc", sourceName: "USDA", lookup: async () => [candidate({ name: externalName, originalName: externalName, normalizedName: externalName })] }]);
    expect(result.status).toBe("resolved_external");
  });

  it("uses nutrient IDs and canonical units, ignoring kJ energy regardless of ordering", () => {
    const kcal = { nutrientId: 1008, unitName: "kcal", value: 23 };
    const kj = { nutrientId: 1008, unitName: "kJ", value: 96 };
    for (const rows of [[kj, kcal], [kcal, kj]]) {
      expect(normalizeUsdaNutrients(rows).find((item) => item.key === "energy_kcal")?.amountPer100g).toBe(23);
    }
  });

  it("maps all primary macros by nutrient ID and rejects malformed units", () => {
    const nutrients = normalizeUsdaNutrients([
      { nutrientId: 1003, unitName: "g", value: 2.9 }, { nutrientId: 1004, unitName: "g", value: 0.4 },
      { nutrientId: 1005, unitName: "g", value: 3.6 }, { nutrientId: 1079, unitName: "g", value: 0 },
      { nutrientId: 1008, unitName: "joule", value: 23 }
    ]);
    expect(Object.fromEntries(nutrients.map((item) => [item.key, item.amountPer100g]))).toMatchObject({ protein: 2.9, total_fat: 0.4, carbohydrate: 3.6, fiber: 0 });
    expect(nutrients.some((item) => item.key === "energy_kcal")).toBe(false);
  });

  it("does not turn missing or malformed fiber into zero", async () => {
    const base = [
      { nutrientId: 1008, unitName: "kcal", value: 23 }, { nutrientId: 1003, unitName: "g", value: 2.9 },
      { nutrientId: 1004, unitName: "g", value: 0.4 }, { nutrientId: 1005, unitName: "g", value: 3.6 }
    ];
    for (const extra of [[], [{ nutrientId: 1079, unitName: "mg", value: 2.2 }]]) {
      const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ foods: [{ fdcId: 123, description: "Raw spinach", dataType: "Foundation", foodNutrients: [...base, ...extra] }] }) })) as any;
      const [food] = await new UsdaFoodDataCentralLookupAdapter("test-key", fetcher).lookup("Raw spinach");
      expect(validateExternalCandidate(food)).toBeNull();
    }
  });

  it("rejects branded, malformed, empty and oversized response entries safely", async () => {
    const foods = Array.from({ length: 10 }, (_, index) => ({ fdcId: index + 1, description: "Product", dataType: index === 0 ? "Branded" : "Unknown", foodNutrients: [] }));
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ foods }) })) as any;
    await expect(new UsdaFoodDataCentralLookupAdapter("test-key", fetcher).lookup("Product")).resolves.toEqual([]);
  });

  it("rejects non-OK, malformed JSON and oversized payloads", async () => {
    await expect(new UsdaFoodDataCentralLookupAdapter("test-key", vi.fn(async () => ({ ok: false })) as any).lookup("x")).rejects.toThrow("USDA lookup failed");
    await expect(new UsdaFoodDataCentralLookupAdapter("test-key", vi.fn(async () => ({ ok: true, headers: { get: () => null }, text: async () => "{" })) as any).lookup("x")).rejects.toThrow("USDA response invalid");
    await expect(new UsdaFoodDataCentralLookupAdapter("test-key", vi.fn(async () => ({ ok: true, headers: { get: () => "1000001" }, text: async () => "{}" })) as any).lookup("x")).rejects.toThrow("USDA response too large");
  });

  it("enforces the response limit using UTF-8 bytes for multibyte text", async () => {
    const multibyteBody = `{"note":"${"é".repeat(500_000)}"}`;
    expect(multibyteBody.length).toBeLessThanOrEqual(1_000_000);
    expect(Buffer.byteLength(multibyteBody, "utf8")).toBeGreaterThan(1_000_000);
    const fetcher = vi.fn(async () => ({ ok: true, headers: { get: () => null }, text: async () => multibyteBody })) as any;
    await expect(new UsdaFoodDataCentralLookupAdapter("test-key", fetcher).lookup("x")).rejects.toThrow("USDA response too large");
  });

  it("fetches a USDA detail by FDC ID and normalizes nested nutrient metadata", async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ fdcId: 123, description: "Spinach, raw", dataType: "Foundation", foodNutrients: [
      { nutrient: { id: 1008, unitName: "kcal" }, amount: 23 }, { nutrient: { id: 1003, unitName: "g" }, amount: 2.9 },
      { nutrient: { id: 1004, unitName: "g" }, amount: 0.4 }, { nutrient: { id: 1005, unitName: "g" }, amount: 3.6 },
      { nutrient: { id: 1079, unitName: "g" }, amount: 0 }
    ] }) })) as any;
    const food = await new UsdaFoodDataCentralLookupAdapter("secret", fetcher).lookupById("123");
    expect(fetcher.mock.calls[0][0]).toContain("/food/123?");
    expect(food).toMatchObject({ sourceId: "123", fiberPer100g: 0, matchPolicy: "review_required" });
    expect(validateExternalCandidate(food)).not.toBeNull();
  });
});

describe("external food confirmation schema", () => {
  it("accepts only an approved source and correctly-shaped ID, never client nutrition", () => {
    expect(externalFoodConfirmationSchema.parse({ source: "usda_fdc", sourceId: "123" })).toEqual({ source: "usda_fdc", sourceId: "123" });
    expect(externalFoodConfirmationSchema.parse({ source: "open_food_facts", sourceId: "4008400404127" })).toEqual({ source: "open_food_facts", sourceId: "4008400404127" });
    expect(() => externalFoodConfirmationSchema.parse({ source: "open_food_facts", sourceId: "123" })).toThrow(); // not a valid barcode length
    expect(() => externalFoodConfirmationSchema.parse({ source: "usda_fdc", sourceId: "abc" })).toThrow();
    expect(() => externalFoodConfirmationSchema.parse({ source: "usda_fdc", sourceId: "123", fiberPer100g: 0 })).toThrow();
    expect(() => externalFoodConfirmationSchema.parse({ source: "other", sourceId: "123" })).toThrow();
  });
  it("strips/rejects a forged nutrition payload riding along with a valid source+sourceId", () => {
    // .strict() on every branch of the discriminated union means any extra
    // client-supplied field (forged kcal, foodId, etc.) fails validation
    // outright rather than being silently accepted or merged in.
    expect(() => externalFoodConfirmationSchema.parse({ source: "open_food_facts", sourceId: "4008400404127", kcalPer100g: 1, fatPer100g: 1, proteinPer100g: 1, carbsPer100g: 1 })).toThrow();
  });
});

function offCandidate(overrides: Partial<ExternalFoodCandidate> = {}): ExternalFoodCandidate {
  const barcode = (overrides.sourceId as string) ?? "4008400404127";
  return {
    source: "open_food_facts", sourceId: barcode, originalName: "Choco Spread", name: "Choco Spread",
    names: { en: "Choco Spread" }, brand: "ChocoCo", barcode, kcalPer100g: 539, fatPer100g: 30.9, proteinPer100g: 6.3,
    carbsPer100g: 57.5, fiberPer100g: 3.4, nutrients: [],
    provenance: { source: "Open Food Facts", sourceId: barcode, sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`, retrievedAt: "2026-09-07T00:00:00.000Z", valuesPer: "100 g", barcode },
    sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`, normalizedName: "choco spread", nutrientBasis: "per_100_g",
    retrievedAt: "2026-09-07T00:00:00.000Z", confidence: 1, matchPolicy: "exact_normalized_name", ...overrides
  };
}

function fakeBarcodePrisma(options: { local?: any; sourceDuplicate?: any; nameDuplicate?: any } = {}) {
  let created: any = null;
  const prisma: any = {
    food: {
      findFirst: async ({ where }: any) => (where?.barcode ? options.local ?? null : null),
      findUnique: async () => options.sourceDuplicate ?? null,
      findMany: async () => (options.nameDuplicate ? [options.nameDuplicate] : []),
      create: async ({ data }: any) => (created = { id: "new-food", ...data })
    },
    foodAlias: { findFirst: async () => null, findMany: async () => [], createMany: async () => ({ count: 1 }) },
    nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
    foodNutrient: { create: async () => ({}) },
    $transaction: async (fn: any) => fn(prisma)
  };
  return { prisma, getCreated: () => created };
}

describe("barcode resolution (local-first)", () => {
  it("returns a local match immediately without calling the external adapter", async () => {
    const local = { id: "local-1", barcode: "4008400404127", name: "Choco Spread", servings: [] };
    const { prisma } = fakeBarcodePrisma({ local });
    const lookupBarcode = vi.fn();
    const result = await resolveBarcodeFood(prisma, "4008400404127", { lookupBarcode });
    expect(result).toMatchObject({ status: "resolved_local", food: { id: "local-1" } });
    expect(lookupBarcode).not.toHaveBeenCalled();
  });

  it("returns not_found when Open Food Facts has no such product", async () => {
    const { prisma } = fakeBarcodePrisma();
    const result = await resolveBarcodeFood(prisma, "4008400404127", { lookupBarcode: async () => [] });
    expect(result).toEqual({ status: "not_found" });
  });

  it("returns external_unavailable when no adapter is configured", async () => {
    const { prisma } = fakeBarcodePrisma();
    await expect(resolveBarcodeFood(prisma, "4008400404127", null)).resolves.toEqual({ status: "external_unavailable" });
  });

  it("returns external_unavailable (not a crash) when the adapter throws", async () => {
    const { prisma } = fakeBarcodePrisma();
    const result = await resolveBarcodeFood(prisma, "4008400404127", { lookupBarcode: async () => { throw new Error("upstream secret detail"); } });
    expect(result).toEqual({ status: "external_unavailable" });
  });

  it("requires confirmation for a valid external candidate — never auto-persists from a barcode lookup", async () => {
    const { prisma, getCreated } = fakeBarcodePrisma();
    const result = await resolveBarcodeFood(prisma, "4008400404127", { lookupBarcode: async () => [offCandidate()] });
    expect(result).toMatchObject({ status: "confirmation_required", candidate: { source: "open_food_facts", sourceId: "4008400404127" } });
    expect(getCreated()).toBeNull();
  });

  it("resolves to the existing local record when the exact same source+barcode is already saved", async () => {
    const existing = { id: "existing", source: "open_food_facts", sourceId: "4008400404127", servings: [] };
    const { prisma, getCreated } = fakeBarcodePrisma({ sourceDuplicate: existing });
    const result = await resolveBarcodeFood(prisma, "4008400404127", { lookupBarcode: async () => [offCandidate()] });
    expect(result).toEqual({ status: "resolved_local", food: existing });
    expect(getCreated()).toBeNull();
  });

  it("requires confirmation (not a silent match) for a name-based duplicate against a different existing Food", async () => {
    const nameDuplicate = { id: "different-food", name: "Choco Spread", originalName: "Choco Spread", source: "bls", sourceId: "B1", servings: [] };
    const { prisma } = fakeBarcodePrisma({ nameDuplicate });
    const result = await resolveBarcodeFood(prisma, "4008400404127", { lookupBarcode: async () => [offCandidate()] });
    expect(result).toMatchObject({ status: "confirmation_required", reason: "possible_duplicate" });
  });

  it("marks an incomplete product (found, but nutrition missing/invalid) rather than inventing macros", async () => {
    const { prisma } = fakeBarcodePrisma();
    const result = await resolveBarcodeFood(prisma, "4008400404127", { lookupBarcode: async () => [{ name: "Mystery Product", brand: "Acme" }] });
    expect(result).toEqual({ status: "incomplete", product: { name: "Mystery Product", brand: "Acme", barcode: "4008400404127" } });
  });

  it("treats a product with no usable name at all as not_found", async () => {
    const { prisma } = fakeBarcodePrisma();
    const result = await resolveBarcodeFood(prisma, "4008400404127", { lookupBarcode: async () => [{}] });
    expect(result).toEqual({ status: "not_found" });
  });
});

describe("Open Food Facts structured lookup adapter", () => {
  function offResponse(product: any) {
    return { ok: true, headers: { get: () => null }, text: async () => JSON.stringify({ status: 1, product }) };
  }

  it("normalizes a complete product using energy-kcal_100g directly", () => {
    const raw = { status: 1, product: { product_name: "Choco Spread", brands: "ChocoCo, Other", nutriments: { "energy-kcal_100g": 539, proteins_100g: 6.3, fat_100g: 30.9, carbohydrates_100g: 57.5, fiber_100g: 3.4, sugars_100g: 56.3, sodium_100g: 0.107 } } };
    const candidate = normalizeOffProduct(raw, "4008400404127") as ExternalFoodCandidate;
    expect(candidate).toMatchObject({ source: "open_food_facts", sourceId: "4008400404127", name: "Choco Spread", brand: "ChocoCo", kcalPer100g: 539, fatPer100g: 30.9, proteinPer100g: 6.3, carbsPer100g: 57.5, fiberPer100g: 3.4 });
    expect(candidate.nutrients).toEqual(expect.arrayContaining([expect.objectContaining({ key: "sugar", amountPer100g: 56.3 })]));
    // sodium_100g is grams on the wire; the shared Nutrient definition is mg.
    expect(candidate.nutrients).toEqual(expect.arrayContaining([expect.objectContaining({ key: "sodium", amountPer100g: 107 })]));
    expect(validateExternalCandidate(candidate)).not.toBeNull();
  });

  it("falls back to energy_100g (kJ) and converts to kcal when energy-kcal_100g is absent", () => {
    const raw = { status: 1, product: { product_name: "Kilojoule Bar", nutriments: { energy_100g: 2255, proteins_100g: 6.3, fat_100g: 30.9, carbohydrates_100g: 57.5, fiber_100g: 3.4 } } };
    const candidate = normalizeOffProduct(raw, "4008400404127") as ExternalFoodCandidate;
    expect(candidate.kcalPer100g).toBeCloseTo(2255 / 4.184, 1);
  });

  it("marks a product incomplete (not a full candidate) when a required macro is missing", () => {
    const raw = { status: 1, product: { product_name: "No Fiber Data", brands: "Acme", nutriments: { "energy-kcal_100g": 200, proteins_100g: 5, fat_100g: 5, carbohydrates_100g: 20 } } };
    const result = normalizeOffProduct(raw, "4008400404127");
    expect(result).toEqual({ name: "No Fiber Data", brand: "Acme" });
  });

  it("rejects negative nutrition as incomplete rather than persisting it", () => {
    const raw = { status: 1, product: { product_name: "Bad Data", nutriments: { "energy-kcal_100g": -50, proteins_100g: 5, fat_100g: 5, carbohydrates_100g: 20, fiber_100g: 2 } } };
    expect(normalizeOffProduct(raw, "4008400404127")).toEqual({ name: "Bad Data", brand: undefined });
  });

  it("rejects implausibly large nutrition values", () => {
    const raw = { status: 1, product: { product_name: "Absurd", nutriments: { "energy-kcal_100g": 50000, proteins_100g: 5, fat_100g: 5, carbohydrates_100g: 20, fiber_100g: 2 } } };
    expect(normalizeOffProduct(raw, "4008400404127")).toMatchObject({ name: "Absurd" });
  });

  it("treats string-typed nutriment values as valid numbers but rejects genuinely non-numeric ones", () => {
    const stringy = { status: 1, product: { product_name: "Stringy", nutriments: { "energy-kcal_100g": "200", proteins_100g: "5", fat_100g: "5", carbohydrates_100g: "20", fiber_100g: "2" } } };
    expect(normalizeOffProduct(stringy, "4008400404127")).toMatchObject({ kcalPer100g: 200 });
    const garbage = { status: 1, product: { product_name: "Garbage", nutriments: { "energy-kcal_100g": "not-a-number", proteins_100g: 5, fat_100g: 5, carbohydrates_100g: 20, fiber_100g: 2 } } };
    expect(normalizeOffProduct(garbage, "4008400404127")).toEqual({ name: "Garbage", brand: undefined });
  });

  it("returns null for a genuine not-found response (status 0)", () => {
    expect(normalizeOffProduct({ status: 0, status_verbose: "product not found" }, "4008400404127")).toBeNull();
    expect(normalizeOffProduct({ status: 1 }, "4008400404127")).toBeNull(); // no product object at all
    expect(normalizeOffProduct(null, "4008400404127")).toBeNull();
  });

  it("only reads _100g nutriment keys, never _serving ones", () => {
    const raw = { status: 1, product: { product_name: "Per Serving Only", nutriments: { "energy-kcal_100g": 100, "energy-kcal_serving": 300, proteins_serving: 10, fat_100g: 5, carbohydrates_100g: 20, fiber_100g: 2, proteins_100g: 5 } } };
    const candidate = normalizeOffProduct(raw, "4008400404127") as ExternalFoodCandidate;
    expect(candidate.proteinPer100g).toBe(5); // not the _serving value
  });

  it("fetches by barcode with the documented v2 endpoint and identifies the app via User-Agent", async () => {
    const fetcher = vi.fn(async (url: string, init: any) => {
      expect(url).toContain("/api/v2/product/4008400404127.json");
      expect(init.headers["User-Agent"]).toContain("KetoMentor");
      return offResponse({ product_name: "Choco Spread", brands: "ChocoCo", nutriments: { "energy-kcal_100g": 539, proteins_100g: 6.3, fat_100g: 30.9, carbohydrates_100g: 57.5, fiber_100g: 3.4 } });
    }) as any;
    const [food] = await new OpenFoodFactsProductAdapter(fetcher).lookupBarcode("4008400404127");
    expect(food).toMatchObject({ source: "open_food_facts", sourceId: "4008400404127" });
  });

  it("never performs a generic text search against Open Food Facts", async () => {
    const fetcher = vi.fn();
    await expect(new OpenFoodFactsProductAdapter(fetcher as any).lookup()).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("lookupById re-fetches by barcode (sourceId is the barcode for this source)", async () => {
    const fetcher = vi.fn(async () => offResponse({ product_name: "Choco Spread", nutriments: { "energy-kcal_100g": 539, proteins_100g: 6.3, fat_100g: 30.9, carbohydrates_100g: 57.5, fiber_100g: 3.4 } })) as any;
    const food: any = await new OpenFoodFactsProductAdapter(fetcher).lookupById("4008400404127");
    expect(food.sourceId).toBe("4008400404127");
    expect(fetcher.mock.calls[0][0]).toContain("4008400404127");
  });

  it("rejects non-OK, malformed JSON and oversized payloads without leaking upstream detail", async () => {
    await expect(new OpenFoodFactsProductAdapter(vi.fn(async () => ({ ok: false })) as any).lookupBarcode("4008400404127")).rejects.toThrow("Open Food Facts lookup failed");
    await expect(new OpenFoodFactsProductAdapter(vi.fn(async () => ({ ok: true, headers: { get: () => null }, text: async () => "{" })) as any).lookupBarcode("4008400404127")).rejects.toThrow("Open Food Facts response invalid");
    await expect(new OpenFoodFactsProductAdapter(vi.fn(async () => ({ ok: true, headers: { get: () => "1000001" }, text: async () => "{}" })) as any).lookupBarcode("4008400404127")).rejects.toThrow("Open Food Facts response too large");
  });

  it("enforces the response size limit using UTF-8 byte length", async () => {
    const multibyteBody = `{"status":1,"product":{"note":"${"é".repeat(500_000)}"}}`;
    expect(Buffer.byteLength(multibyteBody, "utf8")).toBeGreaterThan(1_000_000);
    const fetcher = vi.fn(async () => ({ ok: true, headers: { get: () => null }, text: async () => multibyteBody })) as any;
    await expect(new OpenFoodFactsProductAdapter(fetcher).lookupBarcode("4008400404127")).rejects.toThrow("Open Food Facts response too large");
  });
});

describe("Open Food Facts confirmation (reuses confirmAuthoritativeFood unchanged)", () => {
  const offAdapter = (lookupById: (sourceId: string) => Promise<unknown>) => ({ source: "open_food_facts" as const, sourceName: "Open Food Facts", lookup: async () => [], lookupById });

  it("re-fetches from Open Food Facts and persists using only source identity, ignoring any client-sent nutrition", async () => {
    const { prisma, getCreated } = fakeBarcodePrisma();
    const lookupById = vi.fn(async () => offCandidate());
    const result = await confirmAuthoritativeFood(prisma, "open_food_facts", "4008400404127", [offAdapter(lookupById)]);
    expect(lookupById).toHaveBeenCalledWith("4008400404127");
    expect(result.status).toBe("confirmed");
    expect(getCreated()).toMatchObject({ source: "open_food_facts", sourceId: "4008400404127", kcalPer100g: 539 });
  });

  it("labels provenance as Open Food Facts, never USDA/BLS", async () => {
    const { prisma, getCreated } = fakeBarcodePrisma();
    await confirmAuthoritativeFood(prisma, "open_food_facts", "4008400404127", [offAdapter(async () => offCandidate())]);
    expect(getCreated().provenance).toMatchObject({ source: "Open Food Facts" });
  });

  it("rejects a barcode mismatch between the requested sourceId and the re-fetched product", async () => {
    const { prisma, getCreated } = fakeBarcodePrisma();
    // Client claims sourceId 4008400404127, but the (re-fetched, trusted) adapter
    // response is actually for a different barcode — confirmAuthoritativeFood
    // must reject this, not silently persist under the requested id.
    const result = await confirmAuthoritativeFood(prisma, "open_food_facts", "4008400404127", [offAdapter(async () => offCandidate({ sourceId: "5901234123457" }))]);
    expect(result).toMatchObject({ status: "unresolved", reason: "invalid_external_data" });
    expect(getCreated()).toBeNull();
  });

  it("does not duplicate on a second confirmation of the same barcode", async () => {
    const existing = { id: "already-saved", source: "open_food_facts", sourceId: "4008400404127", servings: [] };
    const { prisma, getCreated } = fakeBarcodePrisma({ sourceDuplicate: existing });
    const lookupById = vi.fn();
    const result = await confirmAuthoritativeFood(prisma, "open_food_facts", "4008400404127", [offAdapter(lookupById)]);
    expect(result).toMatchObject({ status: "existing", food: { id: "already-saved" } });
    expect(lookupById).not.toHaveBeenCalled(); // existing check short-circuits before any re-fetch
    expect(getCreated()).toBeNull();
  });

  it("resolves a concurrent duplicate confirmation race safely instead of erroring", async () => {
    const raced = { id: "raced-off", source: "open_food_facts", sourceId: "4008400404127", servings: [] };
    const { prisma } = fakeBarcodePrisma();
    let uniqueCalls = 0;
    prisma.food.findUnique = async () => { uniqueCalls += 1; return uniqueCalls > 1 ? raced : null; };
    prisma.food.create = async () => { throw { code: "P2002" }; };
    const result = await confirmAuthoritativeFood(prisma, "open_food_facts", "4008400404127", [offAdapter(async () => offCandidate())]);
    expect(result).toEqual({ status: "existing", food: raced });
  });

  it("existing USDA confirmation still works unaffected by the Open Food Facts addition", async () => {
    const { prisma, getCreated } = fakeBarcodePrisma();
    const usdaCandidate: ExternalFoodCandidate = {
      source: "usda_fdc", sourceId: "999", originalName: "Test Food", name: "Test Food", names: { en: "Test Food" },
      kcalPer100g: 100, fatPer100g: 1, proteinPer100g: 1, carbsPer100g: 1, fiberPer100g: 1, nutrients: [],
      provenance: { source: "USDA FoodData Central", sourceId: "999", sourceUrl: "https://fdc.nal.usda.gov/999", retrievedAt: "2026-09-07T00:00:00.000Z", valuesPer: "100 g" },
      sourceUrl: "https://fdc.nal.usda.gov/999", normalizedName: "test food", nutrientBasis: "per_100_g",
      retrievedAt: "2026-09-07T00:00:00.000Z", confidence: 0.97, matchPolicy: "exact_normalized_name"
    };
    const usdaAdapter = { source: "usda_fdc" as const, sourceName: "USDA", lookup: async () => [], lookupById: async () => usdaCandidate };
    const result = await confirmAuthoritativeFood(prisma, "usda_fdc", "999", [usdaAdapter, offAdapter(async () => offCandidate())]);
    expect(result.status).toBe("confirmed");
    expect(getCreated()).toMatchObject({ source: "usda_fdc", sourceId: "999" });
  });
});

describe("full barcode round-trip integration", () => {
  it("local miss -> OFF product -> preview -> confirm -> persisted Food -> next lookup is local and never calls OFF again", async () => {
    const foods: any[] = [];
    let offCalls = 0;
    const prisma: any = {
      food: {
        findFirst: async ({ where }: any) => (where?.barcode ? foods.find((food) => food.barcode === where.barcode) ?? null : null),
        findUnique: async ({ where }: any) => foods.find((food) => food.source === where.source_sourceId.source && food.sourceId === where.source_sourceId.sourceId) ?? null,
        findMany: async () => [],
        create: async ({ data }: any) => { const food = { id: `food-${foods.length}`, ...data }; foods.push(food); return food; }
      },
      foodAlias: { findFirst: async () => null, findMany: async () => [], createMany: async () => ({ count: 1 }) },
      nutrient: { upsert: async ({ create }: any) => ({ id: `nutrient-${create.key}`, ...create }) },
      foodNutrient: { create: async () => ({}) },
      $transaction: async (fn: any) => fn(prisma)
    };
    const adapter = { source: "open_food_facts" as const, sourceName: "Open Food Facts", lookup: async () => [], lookupBarcode: async () => { offCalls += 1; return [offCandidate()]; }, lookupById: async (id: string) => { offCalls += 1; return offCandidate({ sourceId: id }); } };

    // 1. Barcode lookup: local miss -> OFF called once, returns a reviewable candidate.
    const preview = await resolveBarcodeFood(prisma, "4008400404127", adapter);
    expect(preview.status).toBe("confirmation_required");
    expect(offCalls).toBe(1);

    // 2. User confirms -> server re-fetches (2nd OFF call) and persists.
    const confirmed = await confirmAuthoritativeFood(prisma, "open_food_facts", "4008400404127", [adapter]);
    expect(confirmed.status).toBe("confirmed");
    expect(offCalls).toBe(2);
    expect(foods).toHaveLength(1);

    // 3. Subsequent barcode lookup finds it locally — OFF call count does not increase.
    const second = await resolveBarcodeFood(prisma, "4008400404127", adapter);
    expect(second).toMatchObject({ status: "resolved_local", food: { id: "food-0" } });
    expect(offCalls).toBe(2);
  });
});
