import { describe, expect, it } from "vitest";
import { ChatNutritionEvidenceExtractionProvider, DisabledNutritionEvidenceExtractionProvider, extractJsonLdNutrition, type NutritionEvidenceExtractionTransport } from "./nutrition-evidence-extraction.js";

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
// ("(17g)", not "17 g"), and genuinely-stated zero-valued macros (a condiment
// with 0g fat/protein/fiber per serving) — must NOT be treated as "missing".
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
      extractionMethod: "json_ld",
      basis: { amountGrams: 17 }, kcal: { value: 20 },
      protein: { value: 0 }, fat: { value: 0 }, carbs: { value: 5 }, fiber: { value: 0 }
    });
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
});
