import { describe, expect, it, vi } from "vitest";
import { extractRecipeJsonLd, previewRecipeImport, RecipeImportError, sanitizeRemoteText } from "./recipe-import.js";
import { normalizeSearch } from "../catalog/normalize.js";

const wrap = (json: unknown) => `<html><script type="application/ld+json">${typeof json === "string" ? json : JSON.stringify(json)}</script></html>`;
const base = { "@context": "https://schema.org", "@type": "Recipe", name: "Spinach eggs", recipeYield: "2 servings", recipeIngredient: ["2 eggs", "200 g spinach"], recipeInstructions: [{ "@type": "HowToStep", text: "<b>Mix</b> well." }] };

describe("schema.org Recipe extraction", () => {
  it("extracts a direct Recipe and ignores website nutrition", () => {
    const result = extractRecipeJsonLd(wrap({ ...base, nutrition: { calories: "9999 kcal" } }), "https://example.com/r");
    expect(result).toMatchObject({ title: "Spinach eggs", servings: 2, ingredients: ["2 eggs", "200 g spinach"], instructions: ["Mix well."], extractionMethod: "schema_org_json_ld" });
    expect(result).not.toHaveProperty("nutrition");
  });
  it("finds Recipe in an array", () => expect(extractRecipeJsonLd(wrap([{ "@type": "WebPage" }, base]), "https://e.test").title).toBe("Spinach eggs"));
  it("finds Recipe in @graph", () => expect(extractRecipeJsonLd(wrap({ "@graph": [{ "@type": "WebPage" }, base] }), "https://e.test").title).toBe("Spinach eggs"));
  it("normalizes string, HowToStep and nested HowToSection instructions", () => {
    const recipe = { ...base, recipeInstructions: ["Prepare", { "@type": "HowToStep", text: "Cook" }, { "@type": "HowToSection", itemListElement: [{ "@type": "HowToStep", text: "Serve" }] }] };
    expect(extractRecipeJsonLd(wrap(recipe), "https://e.test").instructions).toEqual(["Prepare", "Cook", "Serve"]);
  });
  it("rejects malformed JSON-LD, missing Recipe, missing ingredients and excess ingredients", () => {
    expect(() => extractRecipeJsonLd(wrap("{"), "https://e.test")).toThrowError(expect.objectContaining({ publicCode: "malformed_json_ld" }));
    expect(() => extractRecipeJsonLd(wrap({ "@type": "WebPage" }), "https://e.test")).toThrowError(expect.objectContaining({ publicCode: "recipe_not_found" }));
    expect(() => extractRecipeJsonLd(wrap({ ...base, recipeIngredient: [] }), "https://e.test")).toThrowError(expect.objectContaining({ publicCode: "recipe_ingredients_missing" }));
    expect(() => extractRecipeJsonLd(wrap({ ...base, recipeIngredient: Array(51).fill("1 g egg") }), "https://e.test")).toThrowError(expect.objectContaining({ publicCode: "too_many_ingredients" }));
  });
  it("strips remote HTML and control characters", () => expect(sanitizeRemoteText("<img src=x> Egg\u0000 &amp; oil", 100)).toBe("Egg & oil"));
});

function prisma() {
  const food = { id: "spinach", name: "Spinach", originalName: "Spinach", names: { en: "Spinach" }, searchText: "spinach", source: "bls", sourceId: "1", servings: [], kcalPer100g: 23, fatPer100g: 0.4, proteinPer100g: 2.9, carbsPer100g: 3.6, fiberPer100g: 2.2 };
  return { foodAlias: { findMany: vi.fn(async () => []) }, food: { findMany: vi.fn(async ({ where }: any) => where.OR.some((item: any) => normalizeSearch(food.searchText).includes(item.searchText.contains)) ? [food] : []) } } as any;
}

describe("recipe import preview integration", () => {
  const page = wrap({ ...base, recipeIngredient: ["200 g spinach", "1 mysteryfruit"] });
  const fetchDependencies = { resolve: async () => [{ address: "93.184.216.34", family: 4 }], request: async () => ({ status: 200, headers: { "content-type": "text/html" }, body: Buffer.from(page) }) };
  it("uses local resolution, parses quantity, leaves unknown food unresolved, and never calls an external adapter", async () => {
    const result = await previewRecipeImport(prisma(), "https://example.com/r", fetchDependencies);
    expect(result.ingredients[0]).toMatchObject({ parsedQuantity: 200, parsedUnit: "g", parsedFoodQuery: "spinach", resolution: "resolved", canConfirm: true, quantity: { grams: 200 } });
    expect(result.ingredients[1]).toMatchObject({ parsedFoodQuery: "mysteryfruit", resolution: "unresolved", canConfirm: false });
  });
  it("does not expose upstream details in public errors", async () => {
    await expect(previewRecipeImport(prisma(), "https://example.com", { resolve: async () => { throw new Error("secret internal DNS"); } })).rejects.toEqual(expect.objectContaining({ publicCode: "dns_failure", status: 400 }));
  });
});
