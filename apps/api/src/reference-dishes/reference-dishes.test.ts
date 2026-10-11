import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeSearch } from "../catalog/normalize.js";
import { phraseMentionsDish } from "../meal-input/local-recipe-lookup.js";
import { genericUnitWeight } from "../meal-input/generic-unit-weights.js";
import { REFERENCE_DATA, REFERENCE_DATA_VERSION } from "./reference-data.js";
import { referenceVariantIdsFor } from "./lookup.js";
import { REFERENCE_USERNAME, seedReferenceDishes } from "./seed.js";

vi.mock("../catalog/food-search.js", async (importOriginal) => ({ ...(await importOriginal<object>()), searchFoods: vi.fn(async () => []) }));
const { unifiedSearch, meaningTermsCache } = await import("../meal-input/unified-search.js");

const COUNTRIES = ["HU", "AT", "DE"];
const LANGUAGES = ["hu", "de", "de-AT", "en"];
const variantIds = REFERENCE_DATA.variants.map(({ id }) => id);
// Dishes whose recipe is in, but some ingredient has no reviewed catalog record
// yet (see data/reference-dishes/hu-missing-foods.md). The seed must skip
// exactly these; a new gap has to be added here on purpose.
// Currently none: a food the catalog lacks is imported (bls-imports.json) or
// left out of the batch and listed on MISSING_FOODS.
const GAPPED_VARIANTS: Record<string, string[]> = {};
const isSource = (source: { url: string; retrieved: string }) => source.url.startsWith("https://") && /^\d{4}-\d{2}-\d{2}$/.test(source.retrieved);

describe("reference data format (phase 1)", () => {
  it("tags every variant with countries, category and languages", () => {
    for (const variant of REFERENCE_DATA.variants) {
      expect(variant.countries.length).toBeGreaterThan(0);
      for (const country of variant.countries) expect(COUNTRIES).toContain(country);
      expect(["traditional", "everyday", "street_food", "chain"]).toContain(variant.category);
      for (const language of variant.languages) expect(LANGUAGES).toContain(language);
    }
  });

  it("has a format sample for every country and every recipe category", () => {
    const countries = new Set(REFERENCE_DATA.variants.flatMap((variant) => variant.countries));
    expect([...countries].sort()).toEqual(["AT", "DE", "HU"]);
    const categories = new Set(REFERENCE_DATA.variants.map((variant) => variant.category));
    for (const category of ["traditional", "everyday", "street_food"]) expect(categories).toContain(category);
    expect(REFERENCE_DATA.chainProducts.length).toBeGreaterThan(0);
    expect(REFERENCE_DATA.servings.length).toBeGreaterThan(0);
    expect(REFERENCE_DATA.foodAliases.length).toBeGreaterThan(0);
  });

  it("has no number without a dated source", () => {
    for (const variant of REFERENCE_DATA.variants) {
      expect(variant.sources.length, variant.id).toBeGreaterThanOrEqual(2);
      expect(variant.sources.every(isSource), variant.id).toBe(true);
    }
    for (const serving of REFERENCE_DATA.servings) {
      expect(serving.sources.length).toBeGreaterThan(0);
      expect(serving.sources.every(isSource)).toBe(true);
      expect(serving.confidence).toBeGreaterThan(0);
      expect(typeof serving.isEstimated).toBe("boolean");
      expect(serving.countries.length).toBeGreaterThan(0);
    }
    for (const product of REFERENCE_DATA.chainProducts) {
      expect(isSource({ url: product.provenance.sourceUrl, retrieved: product.provenance.retrievedAt })).toBe(true);
    }
  });

  it("points every ingredient, serving and alias at a reviewed catalog record", () => {
    const keys = [
      ...REFERENCE_DATA.variants.filter(({ id }) => !(id in GAPPED_VARIANTS)).flatMap((variant) => variant.ingredients.map(({ foodKey }) => foodKey)),
      ...REFERENCE_DATA.servings.map(({ foodKey }) => foodKey),
      ...REFERENCE_DATA.foodAliases.map(({ foodKey }) => foodKey)
    ];
    for (const key of keys) {
      const catalog = REFERENCE_DATA.foodKeys[key]?.catalog;
      expect(catalog, key).toBeTruthy();
      expect(["bls", "usda_fdc", "open_database", "open_food_facts"]).toContain(catalog!.source);
      expect(catalog!.sourceId).not.toBe("");
    }
  });

  it("stores chain carbohydrate as total (EU available + fiber)", () => {
    for (const product of REFERENCE_DATA.chainProducts) {
      expect(product.provenance.carbohydrateBasis).toBe("total_from_available_plus_fiber");
      expect(product.carbsPer100g).toBeGreaterThanOrEqual(product.fiberPer100g);
      expect(product.serving.grams).toBeGreaterThan(0);
    }
  });

  it("does not emit duplicate variant ids, and every dish alias resolves", () => {
    expect(new Set(variantIds).size).toBe(variantIds.length);
    for (const [alias, idsForAlias] of Object.entries(REFERENCE_DATA.aliases)) {
      expect(alias).toBe(normalizeSearch(alias));
      expect(idsForAlias.length).toBeGreaterThan(0);
      expect(new Set(idsForAlias).size).toBe(idsForAlias.length);
      expect(idsForAlias.every((id) => variantIds.includes(id))).toBe(true);
      expect(referenceVariantIdsFor(alias)).toEqual(idsForAlias);
    }
    for (const alias of REFERENCE_DATA.foodAliases) {
      expect(LANGUAGES).toContain(alias.locale);
      expect(alias.normalizedAlias).toBe(normalizeSearch(alias.alias));
    }
  });
});

describe("regional words in a sentence, with suffixes", () => {
  const found = (sentence: string) => Object.entries(REFERENCE_DATA.aliases)
    .filter(([alias]) => phraseMentionsDish(sentence, alias))
    .flatMap(([, ids]) => ids);

  it.each([
    ["hu", "Reggelire rántottát ettem három tojásból", "xx_eierspeis"],
    ["de-AT", "Eierspeis aus 3 Eiern", "xx_eierspeis"],
    ["de-AT", "Mittags zwei Leberkässemmeln", "xx_leberkaessemmel"],
    ["de-AT", "ein Teller Schweinsbraten", "at_schweinsbraten"],
    ["de", "Bratkartoffeln mit Speck zum Abendessen", "de_bratkartoffeln"],
    ["de", "zwei Rühreier", "xx_eierspeis"],
    ["en", "I had scrambled eggs", "xx_eierspeis"],
    // Phase 3 (Austria)
    ["de-AT", "Mittags ein Wiener Schnitzel mit Erdäpfelsalat", "at_wiener_schnitzel_kalb__erdaepfelsalat"],
    ["de-AT", "zwei Käsekrainer mit Senf", "at_kaesekrainer"],
    ["de-AT", "a Eitrige mit an Buckl", "at_kaesekrainer"],
    ["de-AT", "zuerst eine Frittatensuppe", "at_frittatensuppe"],
    ["de-AT", "drei Marillenknödel", "at_marillenknoedel"],
    ["de-AT", "ein Paar Frankfurter mit Senf und Kren", "at_frankfurter_senf_semmel"],
    ["de-AT", "Vogerlsalat mit Erdäpfeln und Kernöl", "at_erdaepfel_vogerlsalat"],
    ["de-AT", "zwei Kornspitz zum Frühstück", "at_kornspitz"],
    ["de", "Käsespätzle zum Abendessen", "at_kaesespaetzle"],
    ["de", "zwei Berliner", "at_krapfen"],
    ["hu", "Bécsben császármorzsát ettem", "at_kaiserschmarrn"],
    ["hu", "ettem egy szelet sacher-tortát", "at_sachertorte"],
    ["en", "I had apple strudel with cream", "at_apfelstrudel"],
    ["en", "a bag of roasted chestnuts", "at_maroni"]
  ])("%s: %s", (_language, sentence, variant) => {
    expect(found(sentence)).toContain(variant);
  });

  it("gives an Austrian Semmel its piece weight but leaves Semmelbrösel alone", () => {
    expect(genericUnitWeight("piece", { name: "Kaisersemmel" })?.key).toBe("bread_roll_at");
    expect(genericUnitWeight("piece", { name: "Semmelbrösel" })).toBeNull();
    expect(genericUnitWeight("piece", { name: "Semmelknödel" })).toBeNull();
  });
});

describe("unifiedSearch finds the regional samples", () => {
  const prisma = {
    recipe: {
      findMany: async ({ where }: any) => where.user?.username === REFERENCE_USERNAME
        ? variantIds.map((id) => ({ id: `ref-${id}`, title: id, servings: 1, finishedWeightGrams: 200, provenance: { referenceVariantId: id } }))
        : []
    }
  } as any;
  beforeEach(() => meaningTermsCache.clear());

  it.each([
    ["rántottát ettem", "xx_eierspeis"],
    ["Eierspeis", "xx_eierspeis"],
    ["2 Leberkässemmeln", "xx_leberkaessemmel"],
    ["Bratkartoffeln", "de_bratkartoffeln"],
    ["roast pork", "at_schweinsbraten"],
    ["Tafelspitz", "at_tafelspitz"],
    ["Käsekrainer", "at_kaesekrainer"],
    ["császármorzsa", "at_kaiserschmarrn"],
    ["Zwiebelrostbraten", "at_zwiebelrostbraten"],
    ["roast goose", "at_martinigansl"]
  ])("%s", async (query, variant) => {
    const result = await unifiedSearch(prisma, query, false, { userId: "u1", foodLocale: "hu" as any });
    if (result.kind !== "results") throw new Error("expected results");
    expect(result.items.filter((item: any) => item.type === "recipe").map((item: any) => item.title)).toContain(variant);
  });
});

// In-memory stand-in for the tables the seed touches.
function memoryPrisma() {
  let seq = 0;
  const id = () => `id-${++seq}`;
  const users: any[] = [];
  const recipes: any[] = [];
  const foodServings: any[] = [];
  const foodAliases: any[] = [];
  const foods: any[] = Object.values(REFERENCE_DATA.foodKeys)
    .filter((entry) => entry.catalog)
    .map((entry) => ({ id: `food-${entry.catalog!.source}-${entry.catalog!.sourceId}`, source: entry.catalog!.source, sourceId: entry.catalog!.sourceId, createdById: null }));
  const prisma: any = {
    user: {
      findUnique: async ({ where }: any) => users.find((user) => user.username === where.username) ?? null,
      create: async ({ data }: any) => { const user = { id: id(), ...data }; users.push(user); return user; }
    },
    food: {
      findFirst: async ({ where }: any) => foods.find((food) => food.source === where.source && food.sourceId === where.sourceId && food.createdById === null) ?? null,
      findUnique: async ({ where }: any) => foods.find((food) => food.source === where.source_sourceId.source && food.sourceId === where.source_sourceId.sourceId) ?? null,
      upsert: async ({ where, update, create }: any) => {
        const existing = foods.find((food) => food.source === where.source_sourceId.source && food.sourceId === where.source_sourceId.sourceId);
        if (existing) { Object.assign(existing, update); return existing; }
        const food = { id: id(), createdById: null, ...create };
        foods.push(food);
        return food;
      }
    },
    recipe: {
      findMany: async ({ where }: any) => recipes.filter((recipe) => recipe.userId === where.userId),
      create: async ({ data }: any) => { const { ingredients, ...rest } = data; const recipe = { id: id(), ...rest, deletedAt: null, ingredients: ingredients.create }; recipes.push(recipe); return recipe; },
      update: async ({ where, data }: any) => { const recipe = recipes.find((row) => row.id === where.id); const { ingredients, ...rest } = data; Object.assign(recipe, rest, { ingredients: ingredients.create }); return recipe; }
    },
    recipeIngredient: { deleteMany: async () => ({ count: 0 }) },
    foodServing: {
      findUnique: async ({ where }: any) => foodServings.find((row) => row.foodId === where.foodId_key.foodId && row.key === where.foodId_key.key) ?? null,
      upsert: async ({ where, update, create }: any) => {
        const existing = foodServings.find((row) => row.foodId === where.foodId_key.foodId && row.key === where.foodId_key.key);
        if (existing) Object.assign(existing, update); else foodServings.push({ id: id(), ...create });
      }
    },
    foodAlias: {
      createMany: async ({ data }: any) => {
        let count = 0;
        for (const row of data) {
          if (foodAliases.some((alias) => alias.foodId === row.foodId && alias.normalizedAlias === row.normalizedAlias && alias.locale === row.locale)) continue;
          foodAliases.push(row);
          count += 1;
        }
        return { count };
      }
    },
    $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations)
  };
  return { prisma, users, recipes, foods, foodServings, foodAliases };
}

describe("reference seed", () => {
  it("stores the rendered fat of roasted dishes for the nutrition calculator", async () => {
    const roasted = REFERENCE_DATA.variants.find((variant) => variant.id === "hu_sult_kolbasz")!;
    expect(roasted.cookingFatLossGrams).toBeGreaterThan(0);
    expect(REFERENCE_DATA.variants.find((variant) => variant.id === "hu_gulyasleves")!.cookingFatLossGrams).toBeUndefined();
    const db = memoryPrisma();
    await seedReferenceDishes(db.prisma);
    const recipe = db.recipes.find((row) => row.provenance.referenceVariantId === roasted.id);
    expect(recipe.provenance.cookingFatLossGrams).toBe(roasted.cookingFatLossGrams);
  });

  it("is idempotent: a second run writes nothing", async () => {
    const db = memoryPrisma();
    const first = await seedReferenceDishes(db.prisma);
    const gapped = Object.keys(GAPPED_VARIANTS).length;
    expect(first.seeded).toBe(REFERENCE_DATA.variants.length - gapped);
    expect(Object.fromEntries(first.skipped.map((s) => [s.variant, [...s.missingFoodKeys].sort()]))).toEqual(GAPPED_VARIANTS);
    expect(first.servings).toMatchObject({ seeded: REFERENCE_DATA.servings.length, kept: [], missing: [] });
    expect(first.aliases.created).toBe(REFERENCE_DATA.foodAliases.length);
    expect(first.chainProducts.seeded).toBe(REFERENCE_DATA.chainProducts.length);
    const snapshot = JSON.stringify([db.users, db.recipes, db.foods, db.foodServings, db.foodAliases]);

    const second = await seedReferenceDishes(db.prisma);
    expect(second).toMatchObject({
      seeded: 0, unchanged: REFERENCE_DATA.variants.length - gapped,
      servings: { seeded: 0, unchanged: REFERENCE_DATA.servings.length },
      aliases: { created: 0 },
      chainProducts: { seeded: 0, unchanged: REFERENCE_DATA.chainProducts.length }
    });
    expect(JSON.stringify([db.users, db.recipes, db.foods, db.foodServings, db.foodAliases])).toBe(snapshot);
  });

  it("stores chain products as chain_official foods with their piece", async () => {
    const db = memoryPrisma();
    await seedReferenceDishes(db.prisma);
    for (const product of REFERENCE_DATA.chainProducts) {
      const food = db.foods.find((row) => row.source === "chain_official" && row.sourceId === product.sourceId);
      expect(food).toMatchObject({ carbsPer100g: product.carbsPer100g, brand: product.chain, createdById: null });
      expect(food.provenance).toMatchObject({ referenceVersion: REFERENCE_DATA_VERSION, carbohydrateBasis: "total_from_available_plus_fiber" });
      expect(db.foodServings.find((row) => row.foodId === food.id)).toMatchObject({ unit: product.serving.unit, grams: product.serving.grams });
    }
  });

  it("never overwrites a serving another importer owns", async () => {
    const db = memoryPrisma();
    const serving = REFERENCE_DATA.servings[0];
    const catalog = REFERENCE_DATA.foodKeys[serving.foodKey].catalog!;
    const foodId = `food-${catalog.source}-${catalog.sourceId}`;
    db.foodServings.push({ id: "curated", foodId, key: serving.key, unit: serving.unit, grams: 1, provenance: { method: "curated_import" } });
    const report = await seedReferenceDishes(db.prisma);
    expect(report.servings.kept).toEqual([`${serving.foodKey}/${serving.key}`]);
    expect(db.foodServings.find((row) => row.id === "curated").grams).toBe(1);
  });
});
