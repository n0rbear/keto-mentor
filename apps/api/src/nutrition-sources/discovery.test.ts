import { describe, expect, it } from "vitest";
import { DisabledWebSearchProvider, rankSourceCandidates, validateNutritionProvenance } from "./discovery.js";

describe("nutrition source discovery", () => {
  it("prioritizes authoritative sources and rejects insecure URLs", () => expect(rankSourceCandidates([
    { url: "https://maker.example/food", domain: "maker.example", title: "Maker", sourceKind: "manufacturer" },
    { url: "http://snippet.example", domain: "snippet.example", title: "Snippet", sourceKind: "other" },
    { url: "https://blsdb.de/food", domain: "blsdb.de", title: "BLS", sourceKind: "bls" }
  ]).map((candidate) => candidate.sourceKind)).toEqual(["bls", "manufacturer"]));
  it("requires traceable per-100g provenance", () => expect(validateNutritionProvenance({ sourceUrl: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/1", sourceDomain: "fdc.nal.usda.gov", sourceTitle: "FoodData Central", retrievedAt: "2026-08-13T00:00:00Z", originalFoodName: "Egg", nutritionBasis: "per_100g", extractionMethod: "official_api", confidence: 1 })).toMatchObject({ nutritionBasis: "per_100g" }));
  it("ships disabled instead of silently scraping a search engine", async () => expect(await new DisabledWebSearchProvider().search("egg")).toEqual([]));
});
