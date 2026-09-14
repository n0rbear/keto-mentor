import { describe, expect, it, vi } from "vitest";
import { extractManufacturerPer100g, MissingAuthoritativeFoodResolver } from "./missing-authoritative-food.js";
import { validateExternalCandidate } from "./external-food.js";
import { isTrustedLocalMatch, searchFoods } from "./food-search.js";

const hotProfile: any = {
  key: "hot", sourceName: "Univer Erős Pista", domains: ["univer.ro"], query: "q",
  identityTerms: [["eros", "pista"]], aliases: ["csípős daráltpaprika-krém"],
  source: "manufacturer", sourceType: "official_manufacturer", sourceOwner: "Univer", category: "Paprika paste"
};

const html = (extra = "") => `<html><body><h1>Ardei iute tocat Erős Pista</h1><p>Valori nutriționale 100g</p>
  <p>Conținut energetic kJ/kcal 170 kJ / 41 kcal</p><p>Grăsimi din care 2g</p>
  <p>Glucide din care 1,2g</p><p>Fibre 4,4g</p><p>Proteine 2,2g</p>${extra}</body></html>`;

describe("missing authoritative food evidence", () => {
  it("extracts only explicitly published per-100g manufacturer macros with provenance", () => {
    const candidate = extractManufacturerPer100g(html(), hotProfile, "https://univer.ro/produse/eros-pista", "2026-09-14T00:00:00.000Z");
    expect(candidate).toMatchObject({ source: "manufacturer", kcalPer100g: 41, fatPer100g: 2, carbsPer100g: 1.2, fiberPer100g: 4.4, proteinPer100g: 2.2, provenance: { sourceType: "official_manufacturer", originalBasis: "100 g", extractionMethod: "deterministic_labeled_html" } });
    expect(validateExternalCandidate(candidate)).not.toBeNull();
  });

  it("extracts a slash-separated kJ/kcal manufacturer table by label rather than treating kJ as kcal", () => {
    const page = `<h1>Pastă de ardei dulce Piros Arany</h1><p>Valori nutriționale 100g</p>
      <p>Conținut energetic kJ/kcal</p><p>212/51</p><p>Grăsimi din care</p><p>1,4g</p>
      <p>Glucide din care</p><p>5g</p><p>Fibre</p><p>4,3g</p><p>Proteine</p><p>2g</p>`;
    const candidate = extractManufacturerPer100g(page, { ...hotProfile, sourceName: "Piros Arany", identityTerms: [["piros", "arany"], ["pasta", "ardei", "dulce"]] }, "https://univer.ro/piros");
    expect(candidate).toMatchObject({ kcalPer100g: 51, fatPer100g: 1.4, carbsPer100g: 5, fiberPer100g: 4.3, proteinPer100g: 2 });
  });

  it("supports the same deterministic label association on another manufacturer-style page", () => {
    const page = `<h1>Erős Pista</h1><table><caption>Nutrition per 100 g</caption><tr><th>Energy</th><td>170 kJ / 41 kcal</td></tr><tr><th>Fat</th><td>2 g</td></tr><tr><th>Carbohydrate</th><td>1.2 g</td></tr><tr><th>Fiber</th><td>4.4 g</td></tr><tr><th>Protein</th><td>2.2 g</td></tr></table>`;
    expect(extractManufacturerPer100g(page, hotProfile, "https://univer.ro/table")).toMatchObject({ kcalPer100g: 41, carbsPer100g: 1.2 });
  });

  it("accepts an official database food page when its separate official schema proves the 100 g basis", () => {
    const profile: any = { ...hotProfile, source: "open_database", sourceId: "105022", sourceType: "official_national_food_composition_database", sourceOwner: "Malaysian Ministry of Health MyFCD", sourceName: "Celery leaves (Daun seladeri)", identityTerms: [["celery", "daun", "seladeri"]], category: "Vegetables", basisEvidenceUrl: "https://myfcd.moh.gov.my/myfcd97/" };
    const page = `<h1>Celery (Daun seladeri); Apium graveolens</h1><p>Energy 11 Kcal</p><p>Protein 1 g</p><p>Fat 0.1 g</p><p>CHO 1.6 g</p><p>Fibre 0.7 g</p>`;
    const candidate = extractManufacturerPer100g(page, profile, "https://myfcd.moh.gov.my/celery", "2026-09-14T00:00:00.000Z", `<th>Value per 100g</th>`);
    expect(candidate).toMatchObject({ source: "open_database", sourceId: "105022", kcalPer100g: 11, proteinPer100g: 1, fatPer100g: 0.1, carbsPer100g: 1.6, fiberPer100g: 0.7, provenance: { sourceBasisUrl: "https://myfcd.moh.gov.my/myfcd97/" } });
    expect(validateExternalCandidate(candidate)).not.toBeNull();
  });

  it("does not accept the official database nutrient page without explicit basis evidence", () => {
    const profile: any = { ...hotProfile, source: "open_database", sourceId: "105022", sourceType: "official_national_food_composition_database", sourceOwner: "MyFCD", sourceName: "Celery leaves", identityTerms: [["celery", "daun", "seladeri"]] };
    const page = `<h1>Celery Daun seladeri</h1><p>Energy 11 Kcal</p><p>Protein 1 g</p><p>Fat 0.1 g</p><p>CHO 1.6 g</p><p>Fibre 0.7 g</p>`;
    expect(extractManufacturerPer100g(page, profile, "https://myfcd.moh.gov.my/celery")).toBeNull();
  });

  it("rejects missing nutrients rather than manufacturing a value", () => {
    expect(extractManufacturerPer100g(html().replace(/<p>Fibre 4,4g<\/p>/, ""), hotProfile, "https://univer.ro/x")).toBeNull();
  });

  it("rejects a serving-only basis without a mass conversion", () => {
    expect(extractManufacturerPer100g(html().replace("100g", "per serving"), hotProfile, "https://univer.ro/x")).toBeNull();
  });

  it("does not trust a recipe blog or an allowlisted snippet as nutrition evidence", async () => {
    const search = { id: "test", search: vi.fn(async () => [{ url: "https://random-recipe.example/paste", title: "blog", snippet: "41 kcal", domain: "random-recipe.example" }]) };
    const resolver = new MissingAuthoritativeFoodResolver(search as any);
    const outcome = await resolver.resolve({} as any, { canonicalIdentity: "paprika paste", originalIdentity: "csípős daráltpaprika-krém" });
    expect(outcome).toMatchObject({ status: "unresolved", reason: "invalid_source_evidence", externalCalls: 1 });
  });

  it("uses a short-lived negative cache and does not repeat a failed discovery", async () => {
    const search = { id: "test", search: vi.fn(async () => []) };
    const resolver = new MissingAuthoritativeFoodResolver(search as any);
    const context = { canonicalIdentity: "paprika paste", originalIdentity: "csípős daráltpaprika-krém" };
    expect(await resolver.resolve({} as any, context)).toMatchObject({ reason: "invalid_source_evidence", externalCalls: 1 });
    expect(await resolver.resolve({} as any, context)).toMatchObject({ reason: "negative_cache", externalCalls: 0 });
    expect(search.search).toHaveBeenCalledTimes(1);
  });

  it("does not invoke discovery profiles for ordinary garlic or carrot", async () => {
    const search = { id: "test", search: vi.fn() };
    const resolver = new MissingAuthoritativeFoodResolver(search as any);
    for (const identity of ["garlic", "carrot"]) {
      expect(await resolver.resolve({} as any, { canonicalIdentity: identity, originalIdentity: identity })).toMatchObject({ status: "unresolved", reason: "authoritative_source_not_found", externalCalls: 0 });
    }
    expect(search.search).not.toHaveBeenCalled();
  });

  it("persists once and the second encounter is a trusted local alias hit with zero discovery", async () => {
    const foods: any[] = [];
    const aliases: any[] = [];
    const prisma: any = {
      food: {
        findUnique: async ({ where }: any) => foods.find((food) => food.source === where.source_sourceId.source && food.sourceId === where.source_sourceId.sourceId) ?? null,
        findMany: async ({ where }: any) => {
          if (where?.id?.in) return foods.filter((food) => where.id.in.includes(food.id));
          const terms = (where?.OR ?? []).map((part: any) => part.searchText?.contains).filter(Boolean);
          return foods.filter((food) => terms.some((term: string) => food.searchText.includes(term)));
        },
        create: async ({ data }: any) => { const food = { id: `f-${foods.length}`, ...data, servings: [] }; foods.push(food); return food; }
      },
      foodAlias: {
        findFirst: async () => null,
        findMany: async ({ where }: any) => {
          const terms = (where?.OR ?? []).map((part: any) => part.normalizedAlias?.contains).filter(Boolean);
          return aliases.filter((alias) => terms.some((term: string) => alias.normalizedAlias.includes(term)));
        },
        createMany: async ({ data }: any) => { aliases.push(...data); return { count: data.length }; },
        upsert: async ({ where, create }: any) => {
          const key = where.foodId_normalizedAlias_locale;
          const row = aliases.find((alias) => alias.foodId === key.foodId && alias.normalizedAlias === key.normalizedAlias && alias.locale === key.locale);
          if (row) return row;
          aliases.push(create); return create;
        }
      },
      nutrient: { upsert: vi.fn() }, foodNutrient: { create: vi.fn() },
      $transaction: async (operation: any) => operation(prisma)
    };
    const search = { id: "test", search: vi.fn(async () => [{ url: "https://univer.ro/produse/eros-pista", title: "Erős Pista", snippet: "", domain: "univer.ro" }]) };
    const fetchDependencies: any = {
      resolve: async () => [{ address: "93.184.216.34", family: 4 }],
      request: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(html()) })
    };
    const resolver = new MissingAuthoritativeFoodResolver(search as any, undefined, fetchDependencies);
    const first = await resolver.resolve(prisma, { canonicalIdentity: "paprika paste", originalIdentity: "paprika paste", rawIngredient: "csípős daráltpaprika-krém", locale: "hu" });
    expect(first.status).toBe("resolved");
    expect(foods).toHaveLength(1);
    const local = await searchFoods(prisma, "csípős daráltpaprika-krém", 5);
    expect(local[0]?.match && isTrustedLocalMatch(local[0].match)).toBe(true);
    expect(search.search).toHaveBeenCalledTimes(1); // caller stops at local hit
  });

  it("recovers a concurrent source/sourceId unique-key race as the one existing Food", async () => {
    const raced = { id: "winner", source: "manufacturer", sourceId: "same", provenance: { sourceName: "Univer" }, servings: [] };
    let lookups = 0;
    const prisma: any = {
      food: { findUnique: async () => (++lookups === 1 ? null : raced), findMany: async () => [], create: async () => { throw Object.assign(new Error("race"), { code: "P2002" }); } },
      foodAlias: { findFirst: async () => null, findMany: async () => [], createMany: async () => ({ count: 0 }), upsert: async () => ({}) },
      nutrient: { upsert: vi.fn() }, foodNutrient: { create: vi.fn() }, $transaction: async (operation: any) => operation(prisma)
    };
    const search = { id: "test", search: async () => [{ url: "https://univer.ro/produse/eros-pista", title: "Erős Pista", snippet: "", domain: "univer.ro" }] };
    const resolver = new MissingAuthoritativeFoodResolver(search as any, undefined, { resolve: async () => [{ address: "93.184.216.34", family: 4 }], request: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(html()) }) } as any);
    const result = await resolver.resolve(prisma, { canonicalIdentity: "paprika paste", originalIdentity: "csípős daráltpaprika-krém" });
    expect(result).toMatchObject({ status: "resolved", food: { id: "winner" } });
  });
});
