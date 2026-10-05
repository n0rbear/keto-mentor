import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { normalizeSearch } from "../catalog/normalize.js";
import { REFERENCE_DATA } from "./reference-data.js";
import { referenceVariantIdsFor } from "./lookup.js";

// Phase-1 Austrian samples; the phase-3 minimums count the dishes on top of them.
const PHASE1 = new Set(["at_schweinsbraten", "xx_eierspeis", "xx_leberkaessemmel"]);
const MINIMUMS = { traditional: 60, everyday: 60, street_food: 25 } as const;

// One dish per AT identity: side variants share the dish's base id. A HU dish
// that is eaten the same way in Austria counts once it carries AT.
const builtDishes = (category: string) => {
  const titles = new Map<string, string>();
  for (const variant of REFERENCE_DATA.variants) {
    if (!variant.countries.includes("AT") || variant.category !== category) continue;
    if (variant.id === variant.dishId && !PHASE1.has(variant.dishId)) titles.set(variant.dishId, variant.titles["de-AT"] ?? variant.titles.de);
  }
  return titles;
};

describe("AT phase 3 inventory", () => {
  it("built dishes alone meet the non-chain minimums", () => {
    for (const [category, minimum] of Object.entries(MINIMUMS)) expect(builtDishes(category).size, category).toBeGreaterThanOrEqual(minimum);
  });

  it("keeps a dish without a catalog record for its main ingredient out of the built set", () => {
    const planned = Object.values(REFERENCE_DATA.inventory.AT ?? {}).flat().map(normalizeSearch);
    expect(planned).toContain(normalizeSearch("Burenwurst"));
    for (const category of Object.keys(MINIMUMS)) {
      for (const title of builtDishes(category).values()) expect(planned.includes(normalizeSearch(title)), title).toBe(false);
    }
  });

  it("imports every BLS record the AT dishes link that an earlier migration did not ship", () => {
    const migrations = fileURLToPath(new URL("../../prisma/migrations/", import.meta.url));
    const dirs = readdirSync(migrations).filter((dir) => !dir.endsWith(".toml")).sort();
    const at = dirs.indexOf("20261005120000_bls_regional_at");
    expect(at).toBeGreaterThan(dirs.indexOf("20260927120000_bls_regional_hu"));
    const sql = readFileSync(`${migrations}${dirs[at]}/migration.sql`, "utf8");
    expect(sql).not.toMatch(/\b(UPDATE|DELETE|DROP|TRUNCATE)\b/);
    const imports = JSON.parse(readFileSync(fileURLToPath(new URL("../../../../data/reference-dishes/bls-imports-at.json", import.meta.url)), "utf8")) as { sourceId: string }[];
    for (const { sourceId } of imports) {
      expect(sql, sourceId).toContain(`VALUES ('bls-${sourceId}'`);
      expect(Object.values(REFERENCE_DATA.foodKeys).some((key) => key.catalog?.source === "bls" && key.catalog.sourceId === sourceId), sourceId).toBe(true);
    }
  });

  it("gives a phrase two dishes claim to the dish of that language's country", () => {
    // de-AT "Krautfleckerl" was a translation alias of the Hungarian káposztás tészta.
    expect(referenceVariantIdsFor("Krautfleckerl")).toEqual(["at_krautfleckerl"]);
    // A Hungarian saying "bécsi szelet" still means rántott hús.
    expect(referenceVariantIdsFor("bécsi szelet").every((id) => id.startsWith("hu_rantott_hus"))).toBe(true);
    // Equal claims stay a choice: "Berliner" (de) is both the HU fánk and the AT Krapfen.
    expect(referenceVariantIdsFor("Berliner")).toEqual(expect.arrayContaining(["hu_fank", "at_krapfen"]));
  });
});
