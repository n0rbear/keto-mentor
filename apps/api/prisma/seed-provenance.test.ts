import { describe, expect, it } from "vitest";
import {
  USDA_DOWNLOAD_URL,
  USDA_FOOD_IDENTITIES,
  USDA_SERVING_PROVENANCE,
  USDA_SR_LEGACY_SOURCE
} from "./seed-provenance.js";

describe("USDA seed provenance", () => {
  it("uses the canonical download URL and distinct dataset dates", () => {
    expect(USDA_DOWNLOAD_URL).toBe("https://fdc.nal.usda.gov/download-datasets/");
    expect(USDA_SR_LEGACY_SOURCE).toMatchObject({
      dataset: "SR Legacy 2018-04",
      datasetRelease: "2018-04",
      fdcPublicationDate: "2019-04-01",
      retrievedAt: "2026-08-28"
    });
  });

  it("records the verified exact identities for unchanged starter foods", () => {
    expect(USDA_FOOD_IDENTITIES).toEqual({
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
    });
  });

  it("records avocado half as derived from the direct whole measure", () => {
    expect(USDA_SERVING_PROVENANCE.avocadoHalf).toMatchObject({
      method: "authoritative_derived",
      sourcePortionId: "89226",
      sourceMeasure: "1 avocado, NS as to Florida or California",
      sourceGrams: 201,
      derivation: "sourceGrams / 2",
      grams: 100.5
    });
    expect(USDA_SERVING_PROVENANCE.avocadoHalf).not.toHaveProperty("measure");
  });

  it("records butter teaspoon as derived from the direct tablespoon measure", () => {
    expect(USDA_SERVING_PROVENANCE.butterTeaspoon).toMatchObject({
      method: "authoritative_derived",
      sourcePortionId: "92512",
      sourceMeasure: "1 tbsp butter, without salt",
      sourceGrams: 14.2,
      derivation: "sourceGrams / 3",
      grams: 14.2 / 3
    });
    expect(USDA_SERVING_PROVENANCE.butterTeaspoon).not.toHaveProperty("measure");
  });
});
