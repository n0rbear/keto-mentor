import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type SeedFood = {
  id: string;
  name: string;
  names: Record<string, string>;
  synonyms: Record<string, string[]>;
  servingUnit: string;
  servingGrams: number;
  kcalPer100g: number;
  fatPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  provenance: Prisma.InputJsonValue;
};

const source = {
  sourceName: "USDA FoodData Central / USDA Standard Reference via public nutrition mirrors",
  licenseNote: "Public-domain USDA-derived average nutrient values. Values are per 100 g edible portion and may vary by brand, preparation and country.",
  retrievedAt: "2026-08-09",
  sourceUrls: [
    "https://fdc.nal.usda.gov/",
    "https://whatyoueat.io/foods/171705-avocados",
    "https://proteinper100g.com/foods/egg-whole-fried/",
    "https://tools.myfooddata.com/nutrition-comparison/172395/100g/1/1"
  ]
};

const foods: SeedFood[] = [
  {
    id: "catalog-fried-egg",
    name: "Fried egg",
    names: { hu: "Tükörtojás", de: "Spiegelei", en: "Fried egg" },
    synonyms: { hu: ["tükörtojás", "sült tojás", "tojás"], de: ["spiegelei", "ei"], en: ["fried egg", "egg"] },
    servingUnit: "egg",
    servingGrams: 46,
    kcalPer100g: 196,
    fatPer100g: 14.8,
    proteinPer100g: 13.6,
    carbsPer100g: 0.8,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Egg, whole, cooked, fried", fdcId: "173423" }
  },
  {
    id: "catalog-avocado",
    name: "Avocado",
    names: { hu: "Avokádó", de: "Avocado", en: "Avocado" },
    synonyms: { hu: ["avokádó"], de: ["avocado"], en: ["avocado"] },
    servingUnit: "half",
    servingGrams: 68,
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
    synonyms: { hu: ["csirkemell", "sült csirkemell"], de: ["hähnchenbrust", "gebratene hähnchenbrust"], en: ["chicken breast", "roasted chicken breast"] },
    servingUnit: "portion",
    servingGrams: 120,
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
    servingGrams: 14,
    kcalPer100g: 717,
    fatPer100g: 81.1,
    proteinPer100g: 0.85,
    carbsPer100g: 0.06,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Butter, without salt" }
  },
  {
    id: "catalog-cheddar",
    name: "Cheddar cheese",
    names: { hu: "Cheddar sajt", de: "Cheddar", en: "Cheddar cheese" },
    synonyms: { hu: ["cheddar", "sajt"], de: ["cheddar", "käse"], en: ["cheddar", "cheese"] },
    servingUnit: "slice",
    servingGrams: 28,
    kcalPer100g: 403,
    fatPer100g: 33.1,
    proteinPer100g: 22.9,
    carbsPer100g: 3.37,
    fiberPer100g: 0,
    provenance: { ...source, fdcDescription: "Cheese, cheddar" }
  },
  {
    id: "catalog-spinach",
    name: "Spinach",
    names: { hu: "Spenót", de: "Spinat", en: "Spinach" },
    synonyms: { hu: ["spenót"], de: ["spinat"], en: ["spinach"] },
    servingUnit: "cup",
    servingGrams: 30,
    kcalPer100g: 23,
    fatPer100g: 0.39,
    proteinPer100g: 2.86,
    carbsPer100g: 3.63,
    fiberPer100g: 2.2,
    provenance: { ...source, fdcDescription: "Spinach, raw" }
  }
];

async function main() {
  await prisma.nutrient.createMany({
    data: [
      { key: "sodium", label: "Sodium", unit: "mg", group: "electrolyte" },
      { key: "potassium", label: "Potassium", unit: "mg", group: "electrolyte" },
      { key: "magnesium", label: "Magnesium", unit: "mg", group: "mineral" }
    ],
    skipDuplicates: true
  });

  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: food.id },
      update: { ...food, source: "open_database", createdById: null },
      create: { ...food, source: "open_database", createdById: null }
    });
  }
}

main().finally(() => prisma.$disconnect());
