import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { normalizeSearch } from "../catalog/normalize.js";
import { REFERENCE_DATA } from "./reference-data.js";

const PILOT = new Set(["hu_gulyasleves", "hu_halaszle", "hu_toltott_kaposzta", "hu_paprikas_csirke_nokedlivel", "hu_sertesporkolt",
  "hu_lecso_virslivel", "hu_rakott_krumpli", "hu_marhahusleves", "hu_rantott_hus", "hu_szekelykaposzta"]);
const MINIMUMS = { traditional: 60, everyday: 60, street_food: 25 } as const;

// One dish per HU phase-2 identity: side variants share the dish's base id.
const builtDishes = (category: string) => {
  const names = new Map<string, string>();
  for (const variant of REFERENCE_DATA.variants) {
    if (!variant.countries.includes("HU") || variant.category !== category) continue;
    if (variant.id === variant.dishId && !PILOT.has(variant.dishId)) names.set(variant.dishId, variant.titles.hu);
  }
  return names;
};

describe("HU phase 2 inventory", () => {
  it("built plus still-planned dishes meet the non-chain minimums", () => {
    for (const [category, minimum] of Object.entries(MINIMUMS)) {
      const planned = REFERENCE_DATA.inventory.HU[category] ?? [];
      expect(builtDishes(category).size + planned.length, category).toBeGreaterThanOrEqual(minimum);
    }
  });

  it("drops a dish from the inventory once it is built", () => {
    const planned = new Set(Object.values(REFERENCE_DATA.inventory.HU).flat().map(normalizeSearch));
    for (const category of Object.keys(MINIMUMS)) {
      for (const name of builtDishes(category).values()) expect(planned.has(normalizeSearch(name)), name).toBe(false);
    }
  });

  it("imports every BLS record the dishes link that an earlier migration did not ship", () => {
    const migrations = fileURLToPath(new URL("../../prisma/migrations/", import.meta.url));
    const sql = readdirSync(migrations).filter((dir) => !dir.endsWith(".toml")).map((dir) => readFileSync(`${migrations}${dir}/migration.sql`, "utf8")).join("\n");
    const imports = JSON.parse(readFileSync(fileURLToPath(new URL("../../../../data/reference-dishes/bls-imports.json", import.meta.url)), "utf8")) as { sourceId: string }[];
    for (const { sourceId } of imports) expect(sql, sourceId).toContain(`VALUES ('bls-${sourceId}'`);
  });
});
