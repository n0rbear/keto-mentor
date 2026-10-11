/**
 * Plate -> grams without photo or scale (owner decision 2026-09-26, roadmap D).
 *
 * Deep plate: grams = capacity (ml) x fill x density.
 * Flat plate: grams = usable area x coverage x food height x fill x density,
 *   usable area = circle of 0.8 x diameter (the rim carries no food).
 * Reference dishes carry their own density and, per part, flat-plate
 * coverage/height (data/reference-dishes/build.py). Any other dish uses the
 * general defaults below and says so (basis "default").
 */
export const DEEP_FILL = { half: 0.5, normal: 0.75, full: 0.9 } as const;
export const FLAT_FILL = { small: 0.7, normal: 1, heaped: 1.35 } as const;
export type DeepFill = keyof typeof DEEP_FILL;
export type FlatFill = keyof typeof FLAT_FILL;

const USABLE_DIAMETER_RATIO = 0.8;
const DEFAULT_DENSITY = 1;
const DEFAULT_FLAT = { coverage: 0.5, heightCm: 2 };
const GRAMS = { min: 5, max: 3000 };

export type PlateInput = { kind: "deep"; capacityMl: number } | { kind: "flat"; diameterMm: number };

/**
 * Average plates, used when the user saved no plate of their own (skipped the
 * plate question or never answered it). Owner decision 2026-10-11: "if they
 * don't want to provide them, use average plate sizes".
 *
 * flat 26 cm: the plate the reference dishes are already calibrated on
 *   (data/reference-dishes/README.md: "egy 26 cm-es lapos tányér normál adagja
 *   a szokásos adagot adja"); matches common dinner plates, e.g. Holst
 *   Porzellan "Teller flach 26 cm Basic" and "Teller flach 27 cm Harmony"
 *   (holst-porzellan.com, checked 2026-10-11).
 * deep 400 ml: a 23 cm soup plate as listed by manufacturers/retailers,
 *   checked 2026-10-11:
 *   - Holst Porzellan "Teller tief 23 cm Harmony": 0,40 l, D 23,0 cm; "Teller
 *     tief 23,5 cm Basic": 0,40 l (holst-porzellan.com product pages);
 *   - Bauscher (BHS tabletop) "dialog Teller tief Fahne 23 cm" 402-1925:
 *     0,4 l (esmeyer-shop.de product page);
 *   - Villeroy & Boch "Mariefleur Basic Suppenteller" 23 cm: 0,4 l
 *     (kaufland.de product listing).
 * Owner to confirm (open question in the plate-onboarding report).
 */
export const AVERAGE_PLATES = {
  flat: { kind: "flat", diameterMm: 260 },
  deep: { kind: "deep", capacityMl: 400 }
} as const satisfies Record<"flat" | "deep", PlateInput>;
export type DishPlateProfile = {
  densityGPerMl: number;
  // Present for reference dishes; one entry per part (main dish, side).
  parts?: Array<{ densityGPerMl: number; flatPlate?: { coverage: number; height_cm: number } }>;
};

export type PortionEstimate = { grams: number; densityGPerMl: number; basis: "reference" | "default" };

/** Reads the plate profile a seeded reference recipe carries in its provenance. */
export function dishProfileFromProvenance(provenance: unknown): DishPlateProfile | null {
  const p = provenance as { kind?: string; densityGPerMl?: unknown; parts?: unknown } | null;
  if (p?.kind !== "reference_dish" || typeof p.densityGPerMl !== "number" || !(p.densityGPerMl > 0)) return null;
  const parts = Array.isArray(p.parts) ? p.parts.filter((part: any) => typeof part?.densityGPerMl === "number" && part.densityGPerMl > 0) as DishPlateProfile["parts"] : undefined;
  return { densityGPerMl: p.densityGPerMl, parts };
}

export function estimatePlatePortion(plate: PlateInput, fill: DeepFill | FlatFill, dish: DishPlateProfile | null): PortionEstimate {
  const basis = dish ? "reference" : "default";
  const density = dish?.densityGPerMl ?? DEFAULT_DENSITY;
  let grams: number;
  if (plate.kind === "deep") {
    grams = plate.capacityMl * (DEEP_FILL[fill as DeepFill] ?? DEEP_FILL.normal) * density;
  } else {
    const factor = FLAT_FILL[fill as FlatFill] ?? FLAT_FILL.normal;
    const diameterCm = plate.diameterMm / 10;
    const area = Math.PI * (USABLE_DIAMETER_RATIO * diameterCm / 2) ** 2;
    const flatParts = dish?.parts?.filter((part) => part.flatPlate) ?? [];
    grams = flatParts.length
      ? flatParts.reduce((sum, part) => sum + area * part.flatPlate!.coverage * part.flatPlate!.height_cm * factor * part.densityGPerMl, 0)
      : area * DEFAULT_FLAT.coverage * DEFAULT_FLAT.heightCm * factor * density;
  }
  return { grams: Math.round(Math.min(GRAMS.max, Math.max(GRAMS.min, grams))), densityGPerMl: density, basis: dish && (plate.kind === "deep" || dish.parts?.some((part) => part.flatPlate)) ? basis : "default" };
}
