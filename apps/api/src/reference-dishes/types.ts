// Shape of the generated reference-dish data (data/reference-dishes/build.py).
export type ReferenceFlatPlate = { coverage: number; height_cm: number };

export type ReferenceVariant = {
  id: string;
  dishId: string;
  titles: { hu: string; de: string; en: string };
  // One variant is exactly one standard serving of this many grams.
  servingGrams: number;
  densityGPerMl: number;
  servedIn: "deep_plate" | "flat_plate";
  parts: Array<{ part: string; grams: number; densityGPerMl: number; flatPlate?: ReferenceFlatPlate }>;
  ingredients: Array<{ foodKey: string; grams: number; role: "core" | "seasoning" | "garnish" }>;
  sources: string[];
};

export type ReferenceDishData = {
  foodKeys: Record<string, { catalog: { source: string; sourceId: string } | null; hu: string }>;
  variants: ReferenceVariant[];
  // normalizeSearch(phrase) -> variant ids; more than one id means the
  // phrase leaves a side dish open and the user must choose.
  aliases: Record<string, string[]>;
};
