import type { ImportNutrient } from "./types.js";

export type NutrientDefinition = Omit<ImportNutrient, "amountPer100g">;
export type NutrientMapping = NutrientDefinition & { factor?: number };

export const NUTRIENTS: Record<string, NutrientDefinition> = {
  energy_kcal: { key: "energy_kcal", label: "Energy", unit: "kcal", group: "macro" },
  protein: { key: "protein", label: "Protein", unit: "g", group: "macro" },
  total_fat: { key: "total_fat", label: "Total fat", unit: "g", group: "macro" },
  carbohydrate: { key: "carbohydrate", label: "Carbohydrate", unit: "g", group: "macro" },
  fiber: { key: "fiber", label: "Fiber", unit: "g", group: "macro" },
  sugar: { key: "sugar", label: "Sugar", unit: "g", group: "macro" },
  saturated_fat: { key: "saturated_fat", label: "Saturated fat", unit: "g", group: "fat" },
  monounsaturated_fat: { key: "monounsaturated_fat", label: "Monounsaturated fat", unit: "g", group: "fat" },
  polyunsaturated_fat: { key: "polyunsaturated_fat", label: "Polyunsaturated fat", unit: "g", group: "fat" },
  sodium: { key: "sodium", label: "Sodium", unit: "mg", group: "mineral" }, potassium: { key: "potassium", label: "Potassium", unit: "mg", group: "mineral" },
  calcium: { key: "calcium", label: "Calcium", unit: "mg", group: "mineral" }, magnesium: { key: "magnesium", label: "Magnesium", unit: "mg", group: "mineral" },
  phosphorus: { key: "phosphorus", label: "Phosphorus", unit: "mg", group: "mineral" }, iron: { key: "iron", label: "Iron", unit: "mg", group: "mineral" },
  zinc: { key: "zinc", label: "Zinc", unit: "mg", group: "mineral" }, copper: { key: "copper", label: "Copper", unit: "mg", group: "mineral" },
  manganese: { key: "manganese", label: "Manganese", unit: "mg", group: "mineral" }, selenium: { key: "selenium", label: "Selenium", unit: "ug", group: "mineral" },
  vitamin_a: { key: "vitamin_a", label: "Vitamin A (RAE)", unit: "ug", group: "vitamin" },
  vitamin_b1: { key: "vitamin_b1", label: "Vitamin B1", unit: "mg", group: "vitamin" }, vitamin_b2: { key: "vitamin_b2", label: "Vitamin B2", unit: "mg", group: "vitamin" },
  vitamin_b3: { key: "vitamin_b3", label: "Vitamin B3", unit: "mg", group: "vitamin" }, vitamin_b5: { key: "vitamin_b5", label: "Vitamin B5", unit: "mg", group: "vitamin" },
  vitamin_b6: { key: "vitamin_b6", label: "Vitamin B6", unit: "mg", group: "vitamin" }, vitamin_b7: { key: "vitamin_b7", label: "Vitamin B7", unit: "ug", group: "vitamin" },
  vitamin_b9: { key: "vitamin_b9", label: "Vitamin B9", unit: "ug", group: "vitamin" }, vitamin_b12: { key: "vitamin_b12", label: "Vitamin B12", unit: "ug", group: "vitamin" },
  vitamin_c: { key: "vitamin_c", label: "Vitamin C", unit: "mg", group: "vitamin" }, vitamin_d: { key: "vitamin_d", label: "Vitamin D", unit: "ug", group: "vitamin" },
  vitamin_e: { key: "vitamin_e", label: "Vitamin E", unit: "mg", group: "vitamin" }, vitamin_k: { key: "vitamin_k", label: "Vitamin K", unit: "ug", group: "vitamin" }
};

const usd = (key: keyof typeof NUTRIENTS, factor = 1): NutrientMapping => ({ ...NUTRIENTS[key], factor });
export const USDA_NUTRIENT_MAP: Record<string, NutrientMapping> = {
  "1008": usd("energy_kcal"), "2047": usd("energy_kcal"), "2048": usd("energy_kcal"), "1003": usd("protein"), "1004": usd("total_fat"), "1005": usd("carbohydrate"), "1079": usd("fiber"), "2000": usd("sugar"),
  "1258": usd("saturated_fat"), "1292": usd("monounsaturated_fat"), "1293": usd("polyunsaturated_fat"), "1093": usd("sodium"), "1092": usd("potassium"),
  "1087": usd("calcium"), "1090": usd("magnesium"), "1091": usd("phosphorus"), "1089": usd("iron"), "1095": usd("zinc"), "1098": usd("copper"),
  "1101": usd("manganese"), "1103": usd("selenium"), "1106": usd("vitamin_a"), "1165": usd("vitamin_b1"), "1166": usd("vitamin_b2"), "1167": usd("vitamin_b3"),
  "1170": usd("vitamin_b5"), "1175": usd("vitamin_b6"), "1176": usd("vitamin_b7"), "1190": usd("vitamin_b9"), "1178": usd("vitamin_b12"), "1162": usd("vitamin_c"),
  "1114": usd("vitamin_d"), "1109": usd("vitamin_e"), "1185": usd("vitamin_k")
};

export const BLS_NUTRIENT_MAP: Record<string, NutrientMapping> = {
  ENERCC: usd("energy_kcal"), PROT625: usd("protein"), FAT: usd("total_fat"), CHO: usd("carbohydrate"), FIBT: usd("fiber"), SUGAR: usd("sugar"),
  FASAT: usd("saturated_fat"), FAMS: usd("monounsaturated_fat"), FAPU: usd("polyunsaturated_fat"), NA: usd("sodium"), K: usd("potassium"), CA: usd("calcium"),
  MG: usd("magnesium"), P: usd("phosphorus"), FE: usd("iron"), ZN: usd("zinc"), CU: usd("copper", 0.001), MN: usd("manganese", 0.001), SE: usd("selenium"),
  VITAA: usd("vitamin_a"), THIA: usd("vitamin_b1"), RIBF: usd("vitamin_b2"), NIA: usd("vitamin_b3"), PANTAC: usd("vitamin_b5"), VITB6: usd("vitamin_b6", 0.001),
  BIOT: usd("vitamin_b7"), FOL: usd("vitamin_b9"), VITB12: usd("vitamin_b12"), VITC: usd("vitamin_c"), VITD: usd("vitamin_d"), VITE: usd("vitamin_e"), VITK: usd("vitamin_k")
};

export function mapNutrient(mapping: Record<string, NutrientMapping>, sourceKey: string, amount: unknown): ImportNutrient | undefined {
  const definition = mapping[sourceKey];
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!definition || !Number.isFinite(value)) return undefined;
  const { factor = 1, ...rest } = definition;
  return { ...rest, amountPer100g: value * factor };
}
