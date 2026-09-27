import { describe, expect, it } from "vitest";
import { REFERENCE_DATA } from "./hu-pilot.data.js";

describe("reference-dish phase 1 format", () => {
  it("emits country and category metadata for every generated variant", () => {
    expect(REFERENCE_DATA.variants.length).toBeGreaterThanOrEqual(10);
    for (const variant of REFERENCE_DATA.variants) {
      expect(["HU", "AT", "DE"]).toContain(variant.country);
      expect(["traditional", "everyday", "street_food", "chain"]).toContain(variant.category);
      expect(variant.sources.every((source) => source.startsWith("https://"))).toBe(true);
    }
  });

  it("does not emit duplicate variant ids or aliases", () => {
    const ids = REFERENCE_DATA.variants.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [alias, idsForAlias] of Object.entries(REFERENCE_DATA.aliases)) {
      expect(alias).not.toBe("");
      expect(new Set(idsForAlias).size).toBe(idsForAlias.length);
      expect(idsForAlias.every((id) => ids.includes(id))).toBe(true);
    }
  });
});
