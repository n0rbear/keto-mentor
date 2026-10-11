import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { normalizeSearch } from "../catalog/normalize.js";
import { REFERENCE_DATA } from "./reference-data.js";
import { referenceVariantIdsFor } from "./lookup.js";

// Phase-1 samples carrying DE; the phase-4 minimums count the dishes on top of them.
const PHASE1 = new Set(["de_bratkartoffeln", "at_schweinsbraten", "xx_eierspeis", "xx_leberkaessemmel"]);
const MINIMUMS = { traditional: 60, everyday: 60, street_food: 25 } as const;

// One dish per DE identity: side variants share the dish's base id. An AT or
// HU dish that is eaten the same way in Germany counts once it carries DE.
const builtDishes = (category: string) => {
  const titles = new Map<string, string>();
  for (const variant of REFERENCE_DATA.variants) {
    if (!variant.countries.includes("DE") || variant.category !== category) continue;
    if (variant.id === variant.dishId && !PHASE1.has(variant.dishId)) titles.set(variant.dishId, variant.titles.de);
  }
  return titles;
};

describe("DE phase 4 inventory", () => {
  it("built dishes alone meet the non-chain minimums", () => {
    for (const [category, minimum] of Object.entries(MINIMUMS)) expect(builtDishes(category).size, category).toBeGreaterThanOrEqual(minimum);
  });

  it("keeps a dish without a catalog record for its main ingredient out of the built set", () => {
    const planned = Object.values(REFERENCE_DATA.inventory.DE ?? {}).flat().map(normalizeSearch);
    expect(planned).toContain(normalizeSearch("Frankfurter Kranz"));
    for (const category of Object.keys(MINIMUMS)) {
      for (const title of builtDishes(category).values()) expect(planned.includes(normalizeSearch(title)), title).toBe(false);
    }
  });

  it("imports every BLS record the DE dishes link that an earlier migration did not ship", () => {
    const migrations = fileURLToPath(new URL("../../prisma/migrations/", import.meta.url));
    const dirs = readdirSync(migrations).filter((dir) => !dir.endsWith(".toml")).sort();
    const de = dirs.indexOf("20261011120000_bls_regional_de");
    expect(de).toBeGreaterThan(dirs.indexOf("20261005120000_bls_regional_at"));
    const sql = readFileSync(`${migrations}${dirs[de]}/migration.sql`, "utf8");
    expect(sql).not.toMatch(/\b(UPDATE|DELETE|DROP|TRUNCATE)\b/);
    const earlier = dirs.slice(0, de).map((dir) => readFileSync(`${migrations}${dir}/migration.sql`, "utf8")).join("\n");
    const imports = JSON.parse(readFileSync(fileURLToPath(new URL("../../../../data/reference-dishes/bls-imports-de.json", import.meta.url)), "utf8")) as { sourceId: string }[];
    for (const { sourceId } of imports) {
      expect(sql, sourceId).toContain(`VALUES ('bls-${sourceId}'`);
      expect(earlier, sourceId).not.toContain(`VALUES ('bls-${sourceId}'`);
      expect(Object.values(REFERENCE_DATA.foodKeys).some((key) => key.catalog?.source === "bls" && key.catalog.sourceId === sourceId), sourceId).toBe(true);
    }
  });

  it("links every DE dish ingredient to a catalog record and gives every DE variant two dated sources", () => {
    for (const variant of REFERENCE_DATA.variants.filter((v) => v.countries.includes("DE"))) {
      expect(variant.sources.length, variant.id).toBeGreaterThanOrEqual(2);
      for (const source of variant.sources) expect(source.retrieved, variant.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const { foodKey } of variant.ingredients) expect(REFERENCE_DATA.foodKeys[foodKey]?.catalog, `${variant.id}: ${foodKey}`).toBeTruthy();
    }
  });

  it("gives a German phrase to the German dish and keeps ambiguous words a choice", () => {
    // A German saying "Schweinshaxe" means the Bavarian roast knuckle, no longer the HU/AT translation aliases.
    expect(referenceVariantIdsFor("Schweinshaxe").every((id) => id.startsWith("de_schweinshaxe"))).toBe(true);
    // Hungarian and Austrian words keep their dish.
    expect(referenceVariantIdsFor("sült csülök").every((id) => id.startsWith("hu_sult_csulok"))).toBe(true);
    expect(referenceVariantIdsFor("Krautfleckerl")).toEqual(["at_krautfleckerl"]);
    // In Berlin a "Pfannkuchen" is a Berliner, elsewhere a pancake: offer both.
    expect(referenceVariantIdsFor("Pfannkuchen")).toEqual(expect.arrayContaining(["at_krapfen", "de_eierpfannkuchen"]));
    // Kartoffelsalat: northern (mayonnaise) or southern (broth, vinegar) - not picked silently.
    expect(referenceVariantIdsFor("Kartoffelsalat")).toEqual(expect.arrayContaining(["de_kartoffelsalat_nord", "de_kartoffelsalat_sued"]));
    // Currywurst with or without skin; Döner with veal (AT/DE) or chicken (HU/DE).
    expect(referenceVariantIdsFor("Currywurst")).toEqual(expect.arrayContaining(["de_currywurst", "de_currywurst_darm"]));
    expect(referenceVariantIdsFor("Döner")).toEqual(expect.arrayContaining(["at_kebap", "hu_doner"]));
    expect(referenceVariantIdsFor("Fischbrötchen")).toEqual(expect.arrayContaining(["de_fischbroetchen_matjes", "de_fischbroetchen_bismarck", "de_backfischbroetchen"]));
    // Regional words for the same thing.
    for (const word of ["Schrippe", "Weckle", "Rundstück"]) expect(referenceVariantIdsFor(word), word).toEqual(["de_broetchen"]);
    for (const word of ["Frikadelle", "Bulette", "Fleischpflanzerl"]) expect(referenceVariantIdsFor(word)[0], word).toBe("at_faschierte_laibchen");
  });

  it("adds DE to reused AT/HU dishes without touching their recipes", () => {
    const reused = ["at_kaesespaetzle", "at_apfelstrudel", "at_krapfen", "at_kebap", "hu_spaghetti_bolognese", "hu_hasabburgonya"];
    for (const id of reused) {
      const variant = REFERENCE_DATA.variants.find((v) => v.id === id)!;
      expect(variant.countries, id).toContain("DE");
      expect(variant.countries.length, id).toBeGreaterThan(1);
    }
  });
});
