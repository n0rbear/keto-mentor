// Mikrotápanyagok (premium, owner-approved 2026-10-15): a day's vitamins and
// minerals, summed from the catalog nutrient values (BLS / USDA records) of
// each logged item, against the EU nutrient reference values for adults
// (Regulation (EU) No 1169/2011, Annex XIII). Sodium has no NRV; it is shown
// against the WHO upper guideline of 2 000 mg. Items without nutrient data
// are counted so the screen can say the total is incomplete.

export const MICRO_REFERENCE: Record<string, { ref: number; unit: string; group: "vitamin" | "mineral"; kind?: "max" }> = {
  sodium: { ref: 2000, unit: "mg", group: "mineral", kind: "max" },
  potassium: { ref: 2000, unit: "mg", group: "mineral" },
  magnesium: { ref: 375, unit: "mg", group: "mineral" },
  calcium: { ref: 800, unit: "mg", group: "mineral" },
  phosphorus: { ref: 700, unit: "mg", group: "mineral" },
  iron: { ref: 14, unit: "mg", group: "mineral" },
  zinc: { ref: 10, unit: "mg", group: "mineral" },
  copper: { ref: 1, unit: "mg", group: "mineral" },
  manganese: { ref: 2, unit: "mg", group: "mineral" },
  selenium: { ref: 55, unit: "ug", group: "mineral" },
  vitamin_a: { ref: 800, unit: "ug", group: "vitamin" },
  vitamin_d: { ref: 5, unit: "ug", group: "vitamin" },
  vitamin_e: { ref: 12, unit: "mg", group: "vitamin" },
  vitamin_k: { ref: 75, unit: "ug", group: "vitamin" },
  vitamin_c: { ref: 80, unit: "mg", group: "vitamin" },
  vitamin_b1: { ref: 1.1, unit: "mg", group: "vitamin" },
  vitamin_b2: { ref: 1.4, unit: "mg", group: "vitamin" },
  vitamin_b3: { ref: 16, unit: "mg", group: "vitamin" },
  vitamin_b5: { ref: 6, unit: "mg", group: "vitamin" },
  vitamin_b6: { ref: 1.4, unit: "mg", group: "vitamin" },
  vitamin_b7: { ref: 50, unit: "ug", group: "vitamin" },
  vitamin_b9: { ref: 200, unit: "ug", group: "vitamin" },
  vitamin_b12: { ref: 2.5, unit: "ug", group: "vitamin" }
};

type NutrientMap = Record<string, { key?: string; amount: number; unit?: string }>;
export type MicroItem = {
  quantityGrams: number | null;
  snapshotNutrients?: unknown;
  food?: { nutrients?: Array<{ amountPer100g: number; nutrient: { key: string } }> } | null;
};

export function dayMicros(items: MicroItem[]) {
  const sums: Record<string, number> = {};
  let withData = 0;
  for (const item of items) {
    const snapshot = item.snapshotNutrients as NutrientMap | null | undefined;
    let found = false;
    if (snapshot && typeof snapshot === "object" && Object.keys(snapshot).some((k) => k in MICRO_REFERENCE)) {
      for (const [key, value] of Object.entries(snapshot)) if (key in MICRO_REFERENCE && typeof value?.amount === "number") { sums[key] = (sums[key] ?? 0) + value.amount; found = true; }
    } else if (item.food?.nutrients?.length && item.quantityGrams) {
      for (const n of item.food.nutrients) if (n.nutrient.key in MICRO_REFERENCE) { sums[n.nutrient.key] = (sums[n.nutrient.key] ?? 0) + n.amountPer100g * item.quantityGrams / 100; found = true; }
    }
    if (found) withData += 1;
  }
  const nutrients = Object.entries(MICRO_REFERENCE).map(([key, ref]) => {
    const amount = sums[key] ?? 0;
    return { key, group: ref.group, unit: ref.unit, amount: Math.round(amount * (amount < 10 ? 100 : 10)) / (amount < 10 ? 100 : 10), reference: ref.ref, kind: ref.kind ?? "min", percent: Math.round((amount / ref.ref) * 100) };
  });
  return { items: items.length, itemsWithData: withData, nutrients };
}
