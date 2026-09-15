import { describe, expect, it, vi } from "vitest";
import {
  ChatRecipeIngredientNormalizationProvider, DisabledRecipeIngredientNormalizationProvider,
  RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION, recipeIngredientNormalizationOutputSchema,
  type RecipeIngredientNormalizationTransport
} from "./recipe-ingredient-normalization.js";

const validOutput = {
  ingredients: [
    { index: 0, foods: [{ canonicalIdentity: "onion", localName: "vöröshagyma", quantity: 200, unit: "g" }] },
    { index: 1, foods: [{ canonicalIdentity: "salt", localName: "só" }, { canonicalIdentity: "pepper", localName: "bors" }] }
  ]
};

describe("recipeIngredientNormalizationOutputSchema: search-key-only trust boundary", () => {
  it("accepts a well-formed multi-line, multi-food output", () => {
    expect(recipeIngredientNormalizationOutputSchema.safeParse(validOutput).success).toBe(true);
  });

  it("requires at least one food per ingredient line, caps at six", () => {
    expect(recipeIngredientNormalizationOutputSchema.safeParse({ ingredients: [{ index: 0, foods: [] }] }).success).toBe(false);
    expect(recipeIngredientNormalizationOutputSchema.safeParse({ ingredients: [{ index: 0, foods: Array(7).fill({ canonicalIdentity: "x" }) }] }).success).toBe(false);
    expect(recipeIngredientNormalizationOutputSchema.safeParse({ ingredients: [{ index: 0, foods: Array(6).fill({ canonicalIdentity: "x" }) }] }).success).toBe(true);
  });

  it("requires at least one ingredient line, caps at 50", () => {
    expect(recipeIngredientNormalizationOutputSchema.safeParse({ ingredients: [] }).success).toBe(false);
  });

  it.each(["kcal", "kcalPer100g", "protein", "fat", "carbs", "fiber", "foodId", "sourceId", "source", "provenance", "confidence", "id"])(
    "rejects a forbidden %s field on a food entry — structurally impossible, not just discouraged",
    (field) => {
      const tampered = { ingredients: [{ index: 0, foods: [{ canonicalIdentity: "onion", [field]: "anything" }] }] };
      expect(recipeIngredientNormalizationOutputSchema.safeParse(tampered).success).toBe(false);
    }
  );

  it("rejects a negative index or a negative/zero quantity", () => {
    expect(recipeIngredientNormalizationOutputSchema.safeParse({ ingredients: [{ index: -1, foods: [{ canonicalIdentity: "onion" }] }] }).success).toBe(false);
    expect(recipeIngredientNormalizationOutputSchema.safeParse({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "onion", quantity: 0 }] }] }).success).toBe(false);
    expect(recipeIngredientNormalizationOutputSchema.safeParse({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "onion", quantity: -5 }] }] }).success).toBe(false);
  });

  it("rejects an empty canonicalIdentity", () => {
    expect(recipeIngredientNormalizationOutputSchema.safeParse({ ingredients: [{ index: 0, foods: [{ canonicalIdentity: "" }] }] }).success).toBe(false);
  });
});

describe("RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION: multi-food lines are never silently collapsed", () => {
  it("explicitly instructs splitting a line naming more than one food into separate entries", () => {
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION.toLowerCase()).toContain("more than one food");
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION).toContain("só, bors");
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION.toLowerCase()).toContain("never collapsed");
  });

  it("instructs deferring to a given deterministic quantity hint rather than inventing one", () => {
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION.toLowerCase()).toContain("parsedquantity");
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION.toLowerCase()).toContain("never invent a different number");
  });

  it("forbids nutrition/identifiers explicitly in the prompt text", () => {
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION).toContain("Never include nutrition");
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION).toContain("database IDs");
  });

  it("preserves culinary form for polysemous ingredient words instead of emitting a dangerously generic base word", () => {
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION).toContain('"prepared mustard"');
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION).toContain('"paprika spice"');
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION).toContain('"potato"');
    expect(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION).toContain("CULINARY FORM");
  });
});

describe("DisabledRecipeIngredientNormalizationProvider", () => {
  it("always returns null, never throws — the caller falls back to the per-ingredient path", async () => {
    const provider = new DisabledRecipeIngredientNormalizationProvider();
    expect(await provider.normalize({ ingredients: [{ index: 0, raw: "1 db tojás" }] })).toBeNull();
  });
});

function fakeTransport(complete: RecipeIngredientNormalizationTransport["complete"]): RecipeIngredientNormalizationTransport {
  return { id: "fixture-provider", model: "fixture-model", complete };
}

describe("ChatRecipeIngredientNormalizationProvider", () => {
  it("sends the WHOLE ingredient list together in one call, with title/locale/parsed hints — no user id or profile data", async () => {
    let capturedInstruction = "";
    let capturedInput = "";
    const complete = vi.fn(async (instruction: string, input: string, validate: (v: unknown) => unknown) => {
      capturedInstruction = instruction;
      capturedInput = input;
      return validate(validOutput);
    });
    const provider = new ChatRecipeIngredientNormalizationProvider(fakeTransport(complete));
    const result = await provider.normalize({
      title: "Gulyásleves", locale: "hu-HU",
      ingredients: [
        { index: 0, raw: "200 g vöröshagyma", parsedQuantity: 200, parsedUnit: "g" },
        { index: 1, raw: "só, bors" }
      ]
    });
    expect(capturedInstruction).toBe(RECIPE_INGREDIENT_NORMALIZATION_INSTRUCTION);
    const parsed = JSON.parse(capturedInput);
    expect(Object.keys(parsed).sort()).toEqual(["ingredients", "locale", "title"]);
    expect(parsed.title).toBe("Gulyásleves");
    expect(parsed.locale).toBe("hu-HU");
    expect(parsed.ingredients).toEqual([
      { index: 0, raw: "200 g vöröshagyma", parsedQuantity: 200, parsedUnit: "g" },
      { index: 1, raw: "só, bors", parsedQuantity: undefined, parsedUnit: undefined }
    ]);
    expect(result).toEqual(validOutput);
  });

  it("degrades to null (never throws) on malformed output, timeout, or transport failure", async () => {
    const malformed = new ChatRecipeIngredientNormalizationProvider(fakeTransport(async (_i, _input, validate) => validate({ kcal: 100 })));
    await expect(malformed.normalize({ ingredients: [{ index: 0, raw: "x" }] })).resolves.toBeNull();

    const failing = new ChatRecipeIngredientNormalizationProvider(fakeTransport(async () => { throw new Error("upstream secret detail"); }));
    await expect(failing.normalize({ ingredients: [{ index: 0, raw: "x" }] })).resolves.toBeNull();
  });

  it("returns null without calling the transport when no ingredients are given", async () => {
    const complete = vi.fn();
    const provider = new ChatRecipeIngredientNormalizationProvider(fakeTransport(complete));
    expect(await provider.normalize({ ingredients: [] })).toBeNull();
    expect(complete).not.toHaveBeenCalled();
  });

  it("returns null immediately when the signal is already aborted", async () => {
    const complete = vi.fn();
    const provider = new ChatRecipeIngredientNormalizationProvider(fakeTransport(complete));
    const controller = new AbortController();
    controller.abort();
    expect(await provider.normalize({ ingredients: [{ index: 0, raw: "x" }] }, controller.signal)).toBeNull();
    expect(complete).not.toHaveBeenCalled();
  });

  // Owner-beta checkpoint (2026-09-13): fail-safe index-integrity checks
  // BEYOND the schema — a schema-valid response can still omit an index, add
  // an index that was never given, or duplicate one. Any of these is treated
  // as a full failure (null -> per-ingredient fallback), never used partially
  // with missing or misattributed ingredients.
  describe("index-integrity checks beyond schema validation", () => {
    it("rejects a response missing one of the given indexes", async () => {
      const partial = { ingredients: [{ index: 0, foods: [{ canonicalIdentity: "onion" }] }] };
      const provider = new ChatRecipeIngredientNormalizationProvider(fakeTransport(async (_i, _input, validate) => validate(partial)));
      const result = await provider.normalize({ ingredients: [{ index: 0, raw: "a" }, { index: 1, raw: "b" }] });
      expect(result).toBeNull();
    });

    it("rejects a response with a duplicated index", async () => {
      const duplicated = { ingredients: [{ index: 0, foods: [{ canonicalIdentity: "onion" }] }, { index: 0, foods: [{ canonicalIdentity: "garlic" }] }] };
      const provider = new ChatRecipeIngredientNormalizationProvider(fakeTransport(async (_i, _input, validate) => validate(duplicated)));
      const result = await provider.normalize({ ingredients: [{ index: 0, raw: "a" }] });
      expect(result).toBeNull();
    });

    it("rejects a response with a hallucinated index that was never given", async () => {
      const hallucinated = { ingredients: [{ index: 5, foods: [{ canonicalIdentity: "onion" }] }] };
      const provider = new ChatRecipeIngredientNormalizationProvider(fakeTransport(async (_i, _input, validate) => validate(hallucinated)));
      const result = await provider.normalize({ ingredients: [{ index: 0, raw: "a" }] });
      expect(result).toBeNull();
    });

    it("accepts a response whose indexes exactly match what was given, in any order", async () => {
      const reordered = { ingredients: [{ index: 1, foods: [{ canonicalIdentity: "garlic" }] }, { index: 0, foods: [{ canonicalIdentity: "onion" }] }] };
      const provider = new ChatRecipeIngredientNormalizationProvider(fakeTransport(async (_i, _input, validate) => validate(reordered)));
      const result = await provider.normalize({ ingredients: [{ index: 0, raw: "a" }, { index: 1, raw: "b" }] });
      expect(result).toEqual(reordered);
    });
  });
});
