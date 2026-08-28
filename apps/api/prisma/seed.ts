import { PrismaClient, type Prisma } from "@prisma/client";
import { buildSearchText } from "../src/catalog/normalize.js";
import { upsertSeedServings, type SeedServing } from "./seed-servings.js";

const prisma = new PrismaClient();

type SeedFood = {
  id: string;
  name: string;
  names: Record<string, string>;
  synonyms: Record<string, string[]>;
  servingUnit?: string;
  servingGrams?: number;
  servingEstimated?: boolean;
  servingConfidence?: number;
  servingProvenance?: Prisma.InputJsonValue;
  servings?: SeedServing[];
  kcalPer100g: number;
  fatPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  provenance: Prisma.InputJsonValue;
};

const source = {
  sourceName: "USDA FoodData Central SR Legacy",
  licenseNote: "Public-domain USDA average nutrient values. Values are per 100 g edible portion and may vary by brand, preparation and country.",
  dataset: "FoodData Central SR Legacy CSV 2018-04",
  referenceDate: "2019-04-01",
  retrievedAt: "2026-08-28",
  sourceUrls: ["https://fdc.nal.usda.gov/download-datasets.html"]
};

const foods: SeedFood[] = [
  {
    id: "catalog-egg",
    name: "Egg",
    names: { hu: "Tojás", de: "Ei", en: "Egg" },
    synonyms: { hu: ["tojás", "tojas"], de: ["ei", "eier"], en: ["egg", "eggs"] },
    servingUnit: "egg",
    servingGrams: 50,
    servingProvenance: { method: "authoritative", source: "USDA FoodData Central SR Legacy", fdcId: "171287", portionId: "88374", measure: "1 large egg", grams: 50, referenceDate: "2019-04-01", retrievedAt: "2026-08-28" },
    servings: [
      { key: "egg", unit: "egg", labels: { en: "egg", hu: "tojás", de: "Ei" }, grams: 50, provenance: { method: "authoritative", source: "USDA FoodData Central SR Legacy", fdcId: "171287", portionId: "88374", measure: "1 large egg", grams: 50, referenceDate: "2019-04-01", retrievedAt: "2026-08-28" } }
    ],
    kcalPer100g: 143,
    fatPer100g: 9.5,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Egg, whole, raw, fresh", fdcId: "171287" }
  },
  {
    id: "catalog-fried-egg",
    name: "Fried egg",
    names: { hu: "Tükörtojás", de: "Spiegelei", en: "Fried egg" },
    synonyms: { hu: ["tükörtojás", "tukortojas", "sült tojás", "sult tojas"], de: ["spiegelei"], en: ["fried egg"] },
    servingUnit: "egg",
    servingGrams: 46,
    servingProvenance: { method: "authoritative", source: "USDA FoodData Central SR Legacy", fdcId: "173423", portionId: "92497", measure: "1 large fried egg", grams: 46, referenceDate: "2019-04-01", retrievedAt: "2026-08-28" },
    servings: [
      { key: "egg", unit: "egg", labels: { en: "egg", hu: "tojás", de: "Ei" }, grams: 46, provenance: { method: "authoritative", source: "USDA FoodData Central SR Legacy", fdcId: "173423", portionId: "92497", measure: "1 large fried egg", grams: 46, referenceDate: "2019-04-01", retrievedAt: "2026-08-28" } }
    ],
    kcalPer100g: 196,
    fatPer100g: 14.8,
    proteinPer100g: 13.6,
    carbsPer100g: 0.8,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Egg, whole, cooked, fried", fdcId: "173423" }
  },
  {
    id: "catalog-scrambled-egg",
    name: "Scrambled egg",
    names: { hu: "Rántotta", de: "Rührei", en: "Scrambled egg" },
    synonyms: { hu: ["rántotta", "rantotta", "tojásrántotta", "tojasrantotta"], de: ["ruhrei"], en: ["scrambled egg", "eggs scrambled"] },
    // Deliberately no per-egg FoodServing. Generic scrambled egg composition
    // varies with added ingredients and preparation; keep quantity at
    // conversion_missing until a preparation-specific confirmation flow exists.
    kcalPer100g: 149,
    fatPer100g: 10.98,
    proteinPer100g: 10.4,
    carbsPer100g: 1.68,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Egg, whole, cooked, scrambled", fdcId: "172187" }
  },
  {
    id: "catalog-avocado",
    name: "Avocado",
    names: { hu: "Avokádó", de: "Avocado", en: "Avocado" },
    synonyms: { hu: ["avokádó", "avokado"], de: ["avocado"], en: ["avocado"] },
    servingUnit: "half",
    servingGrams: 100.5,
    servingProvenance: { method: "authoritative_derived", source: "USDA FoodData Central SR Legacy", fdcId: "171705", portionId: "89226", measure: "1/2 avocado, NS as to Florida or California", grams: 100.5, derivedFrom: "201 g whole edible avocado / 2", referenceDate: "2019-04-01", retrievedAt: "2026-08-28" },
    servings: [
      { key: "half", unit: "half", labels: { en: "half", hu: "fél", de: "halbe" }, grams: 100.5, provenance: { method: "authoritative_derived", source: "USDA FoodData Central SR Legacy", fdcId: "171705", portionId: "89226", measure: "1/2 avocado, NS as to Florida or California", grams: 100.5, derivedFrom: "201 g whole edible avocado / 2", referenceDate: "2019-04-01", retrievedAt: "2026-08-28" } },
      { key: "piece", unit: "piece", labels: { en: "whole avocado", hu: "egész avokádó", de: "ganze Avocado" }, grams: 201, provenance: { method: "authoritative", source: "USDA FoodData Central SR Legacy", fdcId: "171705", portionId: "89226", measure: "1 avocado, NS as to Florida or California", grams: 201, referenceDate: "2019-04-01", retrievedAt: "2026-08-28" } }
    ],
    kcalPer100g: 160,
    fatPer100g: 14.66,
    proteinPer100g: 2,
    carbsPer100g: 8.53,
    fiberPer100g: 6.7,
    provenance: { ...source, fdcDescription: "Avocados, raw, all commercial varieties", fdcId: "171705" }
  },
  {
    id: "catalog-chicken-breast-roasted",
    name: "Roasted chicken breast",
    names: { hu: "Sült csirkemell", de: "Gebratene Hähnchenbrust", en: "Roasted chicken breast" },
    synonyms: { hu: ["csirkemell", "sült csirkemell", "sult csirkemell"], de: ["hähnchenbrust", "hahnchenbrust", "gebratene hähnchenbrust"], en: ["chicken breast", "roasted chicken breast"] },
    servingUnit: "portion",
    servingGrams: 120,
    servingEstimated: true,
    servingConfidence: 0.8,
    servingProvenance: { method: "curated_estimate", note: "'portion' is an imprecise household measure; ≈120 g is a common reference, not a precise USDA itemized weight." },
    kcalPer100g: 167,
    fatPer100g: 6.6,
    proteinPer100g: 25,
    carbsPer100g: 0,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Chicken, roasting, meat only, cooked, roasted" }
  },
  {
    id: "catalog-butter",
    name: "Butter",
    names: { hu: "Vaj", de: "Butter", en: "Butter" },
    synonyms: { hu: ["vaj"], de: ["butter"], en: ["butter"] },
    servingUnit: "tbsp",
    servingGrams: 14.2,
    servingProvenance: { method: "authoritative", source: "USDA FoodData Central SR Legacy", fdcId: "173430", portionId: "92512", measure: "1 tbsp butter, without salt", grams: 14.2, referenceDate: "2019-04-01", retrievedAt: "2026-08-28" },
    servings: [
      { key: "tbsp", unit: "tbsp", labels: { en: "tablespoon", hu: "evőkanál", de: "Esslöffel" }, grams: 14.2, provenance: { method: "authoritative", source: "USDA FoodData Central SR Legacy", fdcId: "173430", portionId: "92512", measure: "1 tbsp butter, without salt", grams: 14.2, referenceDate: "2019-04-01", retrievedAt: "2026-08-28" } },
      { key: "tsp", unit: "tsp", labels: { en: "teaspoon", hu: "teáskanál", de: "Teelöffel" }, grams: 4.733333333333333, provenance: { method: "authoritative_derived", source: "USDA FoodData Central SR Legacy", fdcId: "173430", portionId: "92512", measure: "1 tsp butter, without salt", grams: 4.733333333333333, derivedFrom: "14.2 g tablespoon / 3", referenceDate: "2019-04-01", retrievedAt: "2026-08-28" } }
    ],
    kcalPer100g: 717,
    fatPer100g: 81.1,
    proteinPer100g: 0.85,
    carbsPer100g: 0.06,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Butter, without salt", fdcId: "173430" }
  },
  {
    id: "catalog-cheddar",
    name: "Cheddar cheese",
    names: { hu: "Cheddar sajt", de: "Cheddar", en: "Cheddar cheese" },
    synonyms: { hu: ["cheddar", "sajt"], de: ["cheddar", "käse", "kase"], en: ["cheddar", "cheese"] },
    servingUnit: "slice",
    servingGrams: 28,
    servingProvenance: { method: "authoritative", source: "USDA FoodData Central SR Legacy", fdcId: "173414", portionId: "92472", measure: "1 slice (1 oz) cheddar", grams: 28, referenceDate: "2019-04-01", retrievedAt: "2026-08-28" },
    servings: [
      { key: "slice", unit: "slice", labels: { en: "slice", hu: "szelet", de: "Scheibe" }, grams: 28, provenance: { method: "authoritative", source: "USDA FoodData Central SR Legacy", fdcId: "173414", portionId: "92472", measure: "1 slice (1 oz) cheddar", grams: 28, referenceDate: "2019-04-01", retrievedAt: "2026-08-28" } }
    ],
    kcalPer100g: 403,
    fatPer100g: 33.1,
    proteinPer100g: 22.9,
    carbsPer100g: 3.37,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Cheese, cheddar (Includes foods for USDA's Food Distribution Program)", fdcId: "173414" }
  },
  {
    id: "catalog-gouda",
    name: "Gouda cheese",
    names: { hu: "Gouda sajt", de: "Gouda", en: "Gouda cheese" },
    synonyms: { hu: ["gouda", "sajt"], de: ["gouda", "käse", "kase"], en: ["gouda", "cheese"] },
    servingUnit: "slice",
    servingGrams: 28.35,
    servingEstimated: true,
    servingConfidence: 0.7,
    servingProvenance: { method: "reference_estimate", source: "USDA FoodData Central SR Legacy", fdcId: "171241", portionId: "88235", measure: "1 oz Gouda reference used as an estimated slice", grams: 28.35, note: "The generic USDA Gouda record has no slice portion; this must require confirmation.", referenceDate: "2019-04-01", retrievedAt: "2026-08-28" },
    servings: [
      { key: "slice", unit: "slice", labels: { en: "slice", hu: "szelet", de: "Scheibe" }, grams: 28.35, isEstimated: true, confidence: 0.7, provenance: { method: "reference_estimate", source: "USDA FoodData Central SR Legacy", fdcId: "171241", portionId: "88235", measure: "1 oz Gouda reference used as an estimated slice", grams: 28.35, note: "The generic USDA Gouda record has no slice portion; this must require confirmation.", referenceDate: "2019-04-01", retrievedAt: "2026-08-28" } }
    ],
    kcalPer100g: 356,
    fatPer100g: 27,
    proteinPer100g: 25,
    carbsPer100g: 2.2,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Cheese, gouda", fdcId: "171241" }
  },
  {
    id: "catalog-spinach",
    name: "Spinach",
    names: { hu: "Spenót", de: "Spinat", en: "Spinach" },
    synonyms: { hu: ["spenót", "spenot"], de: ["spinat"], en: ["spinach"] },
    servingUnit: "cup",
    servingGrams: 30,
    servingProvenance: { method: "curated_reference", note: "One cup raw spinach ≈ 30 g (USDA standard cup)." },
    kcalPer100g: 23,
    fatPer100g: 0.39,
    proteinPer100g: 2.86,
    carbsPer100g: 3.63,
    fiberPer100g: 2.2,
    provenance: { ...source, fdcDescription: "Spinach, raw" }
  },
  {
    id: "catalog-cucumber",
    name: "Cucumber",
    names: { hu: "Kígyóuborka", de: "Gurke", en: "Cucumber" },
    synonyms: { hu: ["kígyóuborka", "kigyouborka", "uborka"], de: ["gurke", "salatgurke"], en: ["cucumber"] },
    servingUnit: "piece",
    servingGrams: 300,
    servingEstimated: true,
    servingConfidence: 0.7,
    servingProvenance: { method: "curated_estimate", note: "Whole cucumber approximate mass; USDA does not itemize a single piece." },
    kcalPer100g: 15,
    fatPer100g: 0.1,
    proteinPer100g: 0.7,
    carbsPer100g: 3.6,
    fiberPer100g: 0.5,
    provenance: { ...source, fdcDescription: "Cucumber, with peel, raw" }
  }
];

async function main() {
  await prisma.nutrient.createMany({
    data: [
      { key: "sodium", label: "Sodium", unit: "mg", group: "electrolyte" },
      { key: "potassium", label: "Potassium", unit: "mg", group: "electrolyte" },
      { key: "calcium", label: "Calcium", unit: "mg", group: "mineral" },
      { key: "magnesium", label: "Magnesium", unit: "mg", group: "mineral" },
      { key: "phosphorus", label: "Phosphorus", unit: "mg", group: "mineral" },
      { key: "iron", label: "Iron", unit: "mg", group: "trace_element" },
      { key: "zinc", label: "Zinc", unit: "mg", group: "trace_element" },
      { key: "copper", label: "Copper", unit: "mg", group: "trace_element" },
      { key: "manganese", label: "Manganese", unit: "mg", group: "trace_element" },
      { key: "selenium", label: "Selenium", unit: "ug", group: "trace_element" },
      { key: "vitamin_a", label: "Vitamin A", unit: "ug", group: "vitamin" },
      { key: "vitamin_b1", label: "Vitamin B1 (thiamin)", unit: "mg", group: "vitamin" },
      { key: "vitamin_b2", label: "Vitamin B2 (riboflavin)", unit: "mg", group: "vitamin" },
      { key: "vitamin_b3", label: "Vitamin B3 (niacin)", unit: "mg", group: "vitamin" },
      { key: "vitamin_b5", label: "Vitamin B5 (pantothenic acid)", unit: "mg", group: "vitamin" },
      { key: "vitamin_b6", label: "Vitamin B6", unit: "mg", group: "vitamin" },
      { key: "vitamin_b7", label: "Vitamin B7 (biotin)", unit: "ug", group: "vitamin" },
      { key: "vitamin_b9", label: "Vitamin B9 (folate)", unit: "ug", group: "vitamin" },
      { key: "vitamin_b12", label: "Vitamin B12", unit: "ug", group: "vitamin" },
      { key: "vitamin_c", label: "Vitamin C", unit: "mg", group: "vitamin" },
      { key: "vitamin_d", label: "Vitamin D", unit: "ug", group: "vitamin" },
      { key: "vitamin_e", label: "Vitamin E", unit: "mg", group: "vitamin" },
      { key: "vitamin_k", label: "Vitamin K", unit: "ug", group: "vitamin" }
    ],
    skipDuplicates: true
  });

  for (const food of foods) {
    const sourceId = String((food.provenance as Record<string, unknown>).fdcId ?? food.id);
    const { id, servingEstimated, servingConfidence, servingProvenance, servings, ...foodData } = food;
    const metadata = {
      ...foodData,
      source: "open_database" as const,
      sourceId,
      originalName: food.name,
      category: "starter_catalog",
      searchText: buildSearchText(food),
      createdById: null
    };
    await prisma.food.upsert({
      where: { id: food.id },
      update: metadata,
      create: { id, ...metadata }
    });

    for (const [kind, localized] of [["localized_name", food.names], ["synonym", food.synonyms]] as const) {
      for (const [locale, values] of Object.entries(localized)) {
        const aliases = Array.isArray(values) ? values : [values];
        for (const alias of aliases) {
          const normalizedAlias = buildSearchText({ name: alias });
          await prisma.foodAlias.upsert({
            where: { foodId_normalizedAlias_locale: { foodId: id, normalizedAlias, locale } },
            update: { alias, kind, confidence: 1 },
            create: { foodId: id, alias, normalizedAlias, locale, kind, confidence: 1, provenance: { method: "curated_seed" } }
          });
        }
      }
    }

    const servingList: SeedServing[] = servings ?? (food.servingUnit && food.servingGrams != null ? [{
      key: food.servingUnit,
      unit: food.servingUnit,
      labels: { en: food.servingUnit },
      grams: food.servingGrams,
      isEstimated: food.servingEstimated,
      confidence: food.servingConfidence,
      provenance: food.servingProvenance ?? { method: "curated_seed", source: food.provenance }
    }] : []);

    await upsertSeedServings(prisma.foodServing, id, servingList);
  }
}

main().finally(() => prisma.$disconnect());
