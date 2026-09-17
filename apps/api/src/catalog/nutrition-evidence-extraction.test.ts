import { describe, expect, it } from "vitest";
import { ChatNutritionEvidenceExtractionProvider, DisabledNutritionEvidenceExtractionProvider, extractJsonLdNutrition, extractVisibleTextNutrition, selectNutritionEvidenceText, type NutritionEvidenceExtractionTransport } from "./nutrition-evidence-extraction.js";

// Fixture A: an official-style page with clean schema.org JSON-LD NutritionInformation.
const JSON_LD_PAGE = `<html><head>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Recipe","name":"Cauliflower, raw","nutrition":{"@type":"NutritionInformation","name":"Cauliflower, raw","servingSize":"100 g","calories":"25 calories","proteinContent":"1.9 g","fatContent":"0.3 g","carbohydrateContent":"5 g","fiberContent":"2 g"}}
</script>
</head><body>Cauliflower page</body></html>`;

// Fixture C: JSON-LD present but with NO gram-denominated serving size ("per piece") -> must defer, never invent a mass.
const JSON_LD_NO_GRAM_BASIS = `<html><head>
<script type="application/ld+json">
{"@type":"NutritionInformation","name":"Apple, medium","servingSize":"1 medium apple","calories":"95 calories","proteinContent":"0.5 g","fatContent":"0.3 g","carbohydrateContent":"25 g","fiberContent":"4 g"}
</script>
</head></html>`;

// Fixture I: JSON-LD present with every macro but fiber missing -> must defer (never assume 0).
const JSON_LD_MISSING_FIBER = `<html><head>
<script type="application/ld+json">
{"@type":"NutritionInformation","name":"Mystery food","servingSize":"100 g","calories":"100 calories","proteinContent":"5 g","fatContent":"2 g","carbohydrateContent":"10 g"}
</script>
</head></html>`;

// Fixture J: real-world manufacturer-page shape (e.g. heinz.com/products/...):
// array-wrapped JSON-LD, gram unit glued directly to the number with no space
// ("(17g)", not "17 g"), genuinely-stated zero-valued macros (a condiment
// with 0g fat/protein/fiber per serving — must NOT be treated as "missing"),
// and the food's own name stated on the enclosing Product, not inside the
// nested NutritionInformation object (the common real-world shape).
const JSON_LD_ARRAY_WITH_ZERO_MACROS = `<html><head>
<script type="application/ld+json">
[{"@context":"https://schema.org","@type":"Product","name":"Tomato Ketchup","nutrition":{"@type":"NutritionInformation","servingSize":"1 Tbsp (17g)","calories":"20","carbohydrateContent":"5 g","fatContent":"0 g","proteinContent":"0 g","fiberContent":"0 g"}},{"@type":"BreadcrumbList"}]
</script>
</head></html>`;

describe("extractJsonLdNutrition — deterministic extraction, no AI call", () => {
  it("fixture A: extracts a complete, gram-based schema.org NutritionInformation block", () => {
    const result = extractJsonLdNutrition(JSON_LD_PAGE);
    expect(result).toMatchObject({
      sourceFoodName: "Cauliflower, raw", extractionMethod: "json_ld",
      basis: { amountGrams: 100 }, kcal: { value: 25 }, protein: { value: 1.9 }, fat: { value: 0.3 }, carbs: { value: 5 }, fiber: { value: 2 }
    });
  });

  it("fixture C: no gram-denominated basis -> returns null (defers to LLM stage, never invents a conversion mass)", () => {
    expect(extractJsonLdNutrition(JSON_LD_NO_GRAM_BASIS)).toBeNull();
  });

  it("fixture I: fiber not stated -> returns null (never assumes fiber=0)", () => {
    expect(extractJsonLdNutrition(JSON_LD_MISSING_FIBER)).toBeNull();
  });

  it("no JSON-LD at all on the page -> returns null cleanly, no crash", () => {
    expect(extractJsonLdNutrition("<html><body>Just a plain page, no structured data.</body></html>")).toBeNull();
  });

  it("malformed/non-JSON script content -> returns null cleanly, no crash", () => {
    expect(extractJsonLdNutrition(`<script type="application/ld+json">{not valid json,,,</script>`)).toBeNull();
  });

  it("a stated 0g serving size (basis) is still rejected — unlike a macro content, a zero-gram basis is never physically valid", () => {
    const zeroBasis = `<script type="application/ld+json">{"@type":"NutritionInformation","servingSize":"0 g","calories":"20","carbohydrateContent":"5 g","fatContent":"0 g","proteinContent":"0 g","fiberContent":"0 g"}</script>`;
    expect(extractJsonLdNutrition(zeroBasis)).toBeNull();
  });

  it("fixture J: a real, unspaced gram unit ('17g') and genuinely-stated zero macros are extracted, not rejected as missing", () => {
    const result = extractJsonLdNutrition(JSON_LD_ARRAY_WITH_ZERO_MACROS);
    expect(result).toMatchObject({
      sourceFoodName: "Tomato Ketchup", extractionMethod: "json_ld",
      basis: { amountGrams: 17 }, kcal: { value: 20 },
      protein: { value: 0 }, fat: { value: 0 }, carbs: { value: 5 }, fiber: { value: 0 }
    });
  });

  it("falls back to the enclosing Product/Recipe's own name when NutritionInformation itself has none — the identity gate needs a real name to compare, not an empty string", () => {
    const nested = `<script type="application/ld+json">{"@type":"Recipe","name":"Grandma's Goulash","nutrition":{"@type":"NutritionInformation","servingSize":"300 g","calories":"450","proteinContent":"25 g","fatContent":"20 g","carbohydrateContent":"30 g","fiberContent":"5 g"}}</script>`;
    expect(extractJsonLdNutrition(nested)?.sourceFoodName).toBe("Grandma's Goulash");
  });

  it("prefers NutritionInformation's own name over an ancestor's when both are present", () => {
    const both = `<script type="application/ld+json">{"@type":"Product","name":"Product Wrapper Name","nutrition":{"@type":"NutritionInformation","name":"Specific Nutrition Label Name","servingSize":"100 g","calories":"100","proteinContent":"5 g","fatContent":"2 g","carbohydrateContent":"10 g","fiberContent":"1 g"}}</script>`;
    expect(extractJsonLdNutrition(both)?.sourceFoodName).toBe("Specific Nutrition Label Name");
  });
});

describe("DisabledNutritionEvidenceExtractionProvider", () => {
  it("always returns null, never calls anything", async () => {
    const provider = new DisabledNutritionEvidenceExtractionProvider();
    expect(await provider.extract({ requestedIdentity: "x", canonicalIdentity: "x", sourceDomain: "x", sourceTitle: "x", pageText: "x" })).toBeNull();
  });
});

function fakeTransport(response: unknown, opts: { throws?: boolean } = {}): NutritionEvidenceExtractionTransport {
  return {
    id: "fixture", model: "fixture-model",
    complete: async (_instruction, _input, validate) => {
      if (opts.throws) throw new Error("transport failure");
      return validate(response);
    }
  };
}

describe("ChatNutritionEvidenceExtractionProvider — LLM-grounded extraction (fixtures B/G/H)", () => {
  const goodResponse = {
    sourceFoodName: "Senf mittelscharf", matchesRequestedFood: true,
    basis: { amountGrams: 100, quote: "per 100g" },
    kcal: { value: 111, quote: "111 kcal" }, protein: { value: 5.51, quote: "5.51 g protein" },
    fat: { value: 6.96, quote: "6.96 g fat" }, carbs: { value: 2.94, quote: "2.94 g carbohydrate" }, fiber: { value: 4.5, quote: "4.5 g fibre" }
  };

  it("fixture B (manufacturer page): a valid, fully-grounded response is returned", async () => {
    const provider = new ChatNutritionEvidenceExtractionProvider(fakeTransport(goodResponse));
    const result = await provider.extract({ requestedIdentity: "mustár", canonicalIdentity: "prepared mustard", sourceDomain: "example.com", sourceTitle: "Senf", pageText: "irrelevant, extraction happens in the transport mock" });
    expect(result).toMatchObject({ sourceFoodName: "Senf mittelscharf", extractionMethod: "llm_grounded", kcal: { value: 111 } });
  });

  it("fixture G (malformed nutrition — schema violation): transport validate() throws -> extract() returns null, never a partial result", async () => {
    const provider = new ChatNutritionEvidenceExtractionProvider(fakeTransport({ sourceFoodName: "X", kcal: "not-an-object" }));
    expect(await provider.extract({ requestedIdentity: "x", canonicalIdentity: "x", sourceDomain: "x", sourceTitle: "x", pageText: "some text" })).toBeNull();
  });

  it("fixture H (provider/transport failure): returns null, never throws", async () => {
    const provider = new ChatNutritionEvidenceExtractionProvider(fakeTransport(goodResponse, { throws: true }));
    await expect(provider.extract({ requestedIdentity: "x", canonicalIdentity: "x", sourceDomain: "x", sourceTitle: "x", pageText: "some text" })).resolves.toBeNull();
  });

  it("empty pageText -> returns null without ever calling the transport (nothing to ground against)", async () => {
    let called = false;
    const transport: NutritionEvidenceExtractionTransport = { id: "fixture", model: "m", complete: async (...args) => { called = true; return (args[2] as any)(goodResponse); } };
    const provider = new ChatNutritionEvidenceExtractionProvider(transport);
    const result = await provider.extract({ requestedIdentity: "x", canonicalIdentity: "x", sourceDomain: "x", sourceTitle: "x", pageText: "   " });
    expect(result).toBeNull();
    expect(called).toBe(false);
  });

  it("a fiber:null response (source never stated fiber) is passed through as null, not coerced to 0", async () => {
    const provider = new ChatNutritionEvidenceExtractionProvider(fakeTransport({ ...goodResponse, fiber: null }));
    const result = await provider.extract({ requestedIdentity: "x", canonicalIdentity: "x", sourceDomain: "x", sourceTitle: "x", pageText: "some text" });
    expect(result?.fiber).toBeNull();
  });

  it("selects a verbatim nutrition window when a long manufacturer page places the table after the old 6000-character cutoff", () => {
    const prefix = "marketing navigation ".repeat(500);
    const table = "Nutrition Information per 100 g Energy 379 kcal Fat 9 g Carbohydrate 56 g Fibre 8 g Protein 15 g";
    const selected = selectNutritionEvidenceText(`${prefix}${table}`);
    expect(selected.length).toBeLessThanOrEqual(6_000);
    expect(selected).toContain(table);
    expect(selected).not.toContain("379 kcal Fat 8 g");
  });

  it("keeps the deterministic bound even when a page contains many nutrition markers", () => {
    expect(selectNutritionEvidenceText("Nutrition protein fat carbohydrate fibre ".repeat(2_000)).length).toBeLessThanOrEqual(6_000);
  });

  it("ranks a late numeric nutrition table above earlier navigation/script labels", () => {
    const navigation = "Nutrition protein fat carbohydrate fibre menu without values ".repeat(180);
    const filler = "brand story ".repeat(500);
    const table = "Nutrition Information Per 100g Energy 1596kJ / 379kcal Fat 9g Carbohydrate 56g Fibre 8.0g Protein 15g";
    const selected = selectNutritionEvidenceText(`${navigation}${filler}${table}`);
    expect(selected).toContain(table);
  });
});

describe("deterministic visible nutrition table extraction", () => {
  it("extracts a complete explicit per-100g manufacturer table without AI", () => {
    const result = extractVisibleTextNutrition("Nutrition Information Per 100g Energy 1596kJ / 379kcal Fat 9g Saturates 2.7g Carbohydrate 56g Sugars 26g Fibre 8.0g Protein 15g", "CLIF BAR Chocolate Chip");
    expect(result).toMatchObject({
      sourceFoodName: "CLIF BAR Chocolate Chip", extractionMethod: "html_table", basis: { amountGrams: 100 },
      kcal: { value: 379 }, fat: { value: 9 }, carbs: { value: 56 }, fiber: { value: 8 }, protein: { value: 15 }
    });
  });

  it("rejects a serving table without an explicit gram-normalizable per-100g basis", () => {
    expect(extractVisibleTextNutrition("Serving size 1 cup Calories 90 Total Fat 1g Carbohydrate 15g Dietary Fiber 2g Protein 4g", "Soup")).toBeNull();
  });

  it("rejects an otherwise complete per-100g table when fiber is missing", () => {
    expect(extractVisibleTextNutrition("Per 100g Energy 379kcal Fat 9g Carbohydrate 56g Protein 15g", "Bar")).toBeNull();
  });
});
