// Shape of the generated reference data (data/reference-dishes/build.py).
export type ReferenceFlatPlate = { coverage: number; height_cm: number };
export type ReferenceCountry = "HU" | "AT" | "DE";
// BCP 47 tags: "de-AT" is Austrian German (Paradeiser, Semmel, Häferl).
export type ReferenceLanguage = "hu" | "de" | "de-AT" | "en";
export type ReferenceSource = { url: string; retrieved: string };

export type ReferenceVariant = {
  id: string;
  dishId: string;
  titles: { hu: string; de: string; en: string; "de-AT"?: string };
  // One variant is exactly one standard serving of this many grams.
  servingGrams: number;
  densityGPerMl: number;
  servedIn: "deep_plate" | "flat_plate" | "handheld";
  parts: Array<{ part: string; grams: number; densityGPerMl: number; flatPlate?: ReferenceFlatPlate }>;
  ingredients: Array<{ foodKey: string; grams: number; role: "core" | "seasoning" | "garnish" }>;
  sources: ReferenceSource[];
  countries: ReferenceCountry[];
  category: "traditional" | "everyday" | "street_food" | "chain";
  languages: ReferenceLanguage[];
  tags?: string[];
};

// A unit weight tied to one reviewed catalog record (FoodServing).
export type ReferenceServing = {
  foodKey: string;
  key: string;
  unit: string;
  labels: Partial<Record<ReferenceLanguage, string>>;
  grams: number;
  isEstimated: boolean;
  confidence: number;
  countries: ReferenceCountry[];
  sources: ReferenceSource[];
};

// Regional vocabulary on one reviewed catalog record (FoodAlias).
export type ReferenceFoodAlias = { foodKey: string; alias: string; normalizedAlias: string; locale: ReferenceLanguage };

// A chain product from the chain's official per-country table (Food, source chain_official).
export type ReferenceChainProduct = {
  sourceId: string;
  chain: string;
  countries: ReferenceCountry[];
  category: string;
  name: string;
  names: Partial<Record<ReferenceLanguage, string>>;
  synonyms: Partial<Record<ReferenceLanguage, string[]>>;
  kcalPer100g: number;
  fatPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fiberPer100g: number;
  serving: { key: string; unit: string; labels: Partial<Record<ReferenceLanguage, string>>; grams: number; isEstimated: boolean; confidence: number };
  provenance: { source: string; sourceUrl: string; retrievedAt: string; valuesPer: string; carbohydrateBasis: string; fiberBasis?: string; countries: ReferenceCountry[] };
};

export type ReferenceDishData = {
  foodKeys: Record<string, { catalog: { source: string; sourceId: string } | null; hu: string }>;
  variants: ReferenceVariant[];
  // normalizeSearch(phrase) -> variant ids; more than one id means the
  // phrase leaves a side dish open and the user must choose.
  aliases: Record<string, string[]>;
  servings: ReferenceServing[];
  foodAliases: ReferenceFoodAlias[];
  chainProducts: ReferenceChainProduct[];
};
