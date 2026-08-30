export const USDA_DATASET_RELEASE = "2018-04";
export const USDA_FDC_PUBLICATION_DATE = "2019-04-01";
export const USDA_RETRIEVED_AT = "2026-08-28";
export const USDA_DOWNLOAD_URL = "https://fdc.nal.usda.gov/download-datasets/";
export const USDA_SOURCE_NAME = "USDA FoodData Central SR Legacy";

export const USDA_SR_LEGACY_SOURCE = {
  sourceName: USDA_SOURCE_NAME,
  licenseNote: "Public-domain USDA average nutrient values. Values are per 100 g edible portion and may vary by brand, preparation and country.",
  dataset: "SR Legacy 2018-04",
  datasetRelease: USDA_DATASET_RELEASE,
  fdcPublicationDate: USDA_FDC_PUBLICATION_DATE,
  retrievedAt: USDA_RETRIEVED_AT,
  sourceUrls: [USDA_DOWNLOAD_URL]
};

export const USDA_FOOD_IDENTITIES = {
  roastedChicken: {
    fdcId: "172395",
    fdcDescription: "Chicken, roasting, meat only, cooked, roasted"
  },
  rawSpinach: {
    fdcId: "168462",
    fdcDescription: "Spinach, raw"
  },
  rawCucumberWithPeel: {
    fdcId: "168409",
    fdcDescription: "Cucumber, with peel, raw"
  }
} as const;

const servingSource = {
  source: USDA_SOURCE_NAME,
  dataset: USDA_SR_LEGACY_SOURCE.dataset,
  datasetRelease: USDA_DATASET_RELEASE,
  fdcPublicationDate: USDA_FDC_PUBLICATION_DATE,
  retrievedAt: USDA_RETRIEVED_AT,
  sourceUrl: USDA_DOWNLOAD_URL
} as const;

export const USDA_SERVING_PROVENANCE = {
  egg: {
    ...servingSource,
    method: "authoritative",
    fdcId: "171287",
    portionId: "88374",
    measure: "1 large egg",
    grams: 50
  },
  friedEgg: {
    ...servingSource,
    method: "authoritative",
    fdcId: "173423",
    portionId: "92497",
    measure: "1 large fried egg",
    grams: 46
  },
  avocadoWhole: {
    ...servingSource,
    method: "authoritative",
    fdcId: "171705",
    portionId: "89226",
    measure: "1 avocado, NS as to Florida or California",
    grams: 201
  },
  avocadoHalf: {
    ...servingSource,
    method: "authoritative_derived",
    fdcId: "171705",
    sourcePortionId: "89226",
    sourceMeasure: "1 avocado, NS as to Florida or California",
    sourceGrams: 201,
    derivation: "sourceGrams / 2",
    grams: 100.5
  },
  butterTablespoon: {
    ...servingSource,
    method: "authoritative",
    fdcId: "173430",
    portionId: "92512",
    measure: "1 tbsp butter, without salt",
    grams: 14.2
  },
  butterTeaspoon: {
    ...servingSource,
    method: "authoritative_derived",
    fdcId: "173430",
    sourcePortionId: "92512",
    sourceMeasure: "1 tbsp butter, without salt",
    sourceGrams: 14.2,
    derivation: "sourceGrams / 3",
    grams: 14.2 / 3
  },
  cheddarSlice: {
    ...servingSource,
    method: "authoritative",
    fdcId: "173414",
    portionId: "92472",
    measure: "1 slice (1 oz) cheddar",
    grams: 28
  },
  goudaSliceEstimate: {
    ...servingSource,
    method: "reference_estimate",
    fdcId: "171241",
    portionId: "88235",
    measure: "1 oz Gouda reference used as an estimated slice",
    grams: 28.35,
    note: "The generic USDA Gouda record has no slice portion; this must require confirmation."
  }
} as const;
