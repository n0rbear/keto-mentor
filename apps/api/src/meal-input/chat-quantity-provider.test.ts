import { describe, expect, it, vi } from "vitest";
import {
  ChatQuantityEstimationProvider, QUANTITY_INSTRUCTION, VOLUME_QUANTITY_INSTRUCTION,
  quantityOutputSchema, volumeQuantityOutputSchema, type ChatCompletionsTransport
} from "./chat-quantity-provider.js";
import { quantityEstimationClass, quantityEstimationMethodClass } from "./quantity-estimation.js";
import type { ParsedNaturalFoodQuery } from "../catalog/natural-food-query.js";

const food = { id: "catalog-spinach", source: "usda", sourceId: "168462", name: "Spinach" };

const validVolumeOutput = {
  method: "volume_model" as const,
  gramsPerUnit: 80,
  rangeGramsPerUnit: { min: 50, max: 120 },
  confidence: 0.6,
  volumeModel: {
    referenceVolumeMl: { min: 200, max: 350 },
    fillFraction: { min: 0.5, max: 0.9 },
    foodVolumeMl: { min: 100, max: 300 },
    bulkDensityGPerMl: { min: 0.3, max: 0.6 },
    grams: { min: 50, max: 120 }
  }
};

describe("quantityEstimationClass / quantityEstimationMethodClass", () => {
  it.each(["plate", "bowl", "cup", "ladle", "tbsp", "tsp", "splash", "handful"] as const)("classifies %s as volume", (unit) => {
    expect(quantityEstimationClass(unit)).toBe("volume");
  });
  it.each(["piece", "slice", "portion", "half", "quarter", "bite", "cm"] as const)("classifies %s as geometry", (unit) => {
    expect(quantityEstimationClass(unit)).toBe("geometry");
  });
  it("tags handful distinctly as packing, other volume units as container", () => {
    expect(quantityEstimationMethodClass("handful")).toBe("packing");
    expect(quantityEstimationMethodClass("plate")).toBe("container");
    expect(quantityEstimationMethodClass("piece")).toBe("direct");
  });
});

describe("volumeQuantityOutputSchema: bounds and trust boundary", () => {
  it("accepts a well-formed volume model output", () => {
    expect(volumeQuantityOutputSchema.safeParse(validVolumeOutput).success).toBe(true);
  });

  it("rejects negative/zero volumes", () => {
    const bad = { ...validVolumeOutput, volumeModel: { ...validVolumeOutput.volumeModel, referenceVolumeMl: { min: -10, max: 100 } } };
    expect(volumeQuantityOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects zero/absurd bulk density", () => {
    for (const density of [{ min: 0, max: 0 }, { min: 0.3, max: 50 }]) {
      const bad = { ...validVolumeOutput, volumeModel: { ...validVolumeOutput.volumeModel, bulkDensityGPerMl: density } };
      expect(volumeQuantityOutputSchema.safeParse(bad).success).toBe(false);
    }
  });

  it.each(["referenceVolumeMl", "fillFraction", "foodVolumeMl", "bulkDensityGPerMl", "grams"] as const)("rejects min > max in %s", (field) => {
    const bad = { ...validVolumeOutput, volumeModel: { ...validVolumeOutput.volumeModel, [field]: { min: 10, max: 1 } } };
    expect(volumeQuantityOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects gramsPerUnit outside its own rangeGramsPerUnit", () => {
    const bad = { ...validVolumeOutput, gramsPerUnit: 999 };
    expect(volumeQuantityOutputSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an implausibly wide top-level range even when internally self-consistent", () => {
    const absurd = {
      ...validVolumeOutput, gramsPerUnit: 1, rangeGramsPerUnit: { min: 1, max: 50_000 },
      volumeModel: { ...validVolumeOutput.volumeModel, grams: { min: 1, max: 50_000 } }
    };
    expect(volumeQuantityOutputSchema.safeParse(absurd).success).toBe(false);
  });

  it("rejects a top-level answer inconsistent with the shown physical derivation (grams range)", () => {
    const bad = { ...validVolumeOutput, gramsPerUnit: 700, rangeGramsPerUnit: { min: 500, max: 900 }, volumeModel: { ...validVolumeOutput.volumeModel, grams: { min: 500, max: 900 } } };
    // Consistent with itself but wildly different from the reference/fill/density it derived from is still schema-valid
    // (the schema can't know "typical" values) — but an outright mismatch between the two grams ranges must fail.
    const inconsistent = { ...validVolumeOutput, rangeGramsPerUnit: { min: 500, max: 900 }, gramsPerUnit: 600 };
    expect(volumeQuantityOutputSchema.safeParse(inconsistent).success).toBe(false);
    expect(volumeQuantityOutputSchema.safeParse(bad).success).toBe(true);
  });

  it.each(["kcal", "protein", "fat", "carbs", "fiber", "foodId", "sourceId", "nutrients"])("rejects a forbidden %s field anywhere in the payload", (field) => {
    expect(volumeQuantityOutputSchema.safeParse({ ...validVolumeOutput, [field]: 10 }).success).toBe(false);
    expect(volumeQuantityOutputSchema.safeParse({ ...validVolumeOutput, volumeModel: { ...validVolumeOutput.volumeModel, [field]: 10 } }).success).toBe(false);
  });

  it("rejects NaN/Infinity anywhere", () => {
    expect(volumeQuantityOutputSchema.safeParse({ ...validVolumeOutput, gramsPerUnit: NaN }).success).toBe(false);
    expect(volumeQuantityOutputSchema.safeParse({ ...validVolumeOutput, gramsPerUnit: Infinity }).success).toBe(false);
    expect(volumeQuantityOutputSchema.safeParse({ ...validVolumeOutput, volumeModel: { ...validVolumeOutput.volumeModel, bulkDensityGPerMl: { min: 0.1, max: Infinity } } }).success).toBe(false);
  });

  it("rejects a wrong method discriminator", () => {
    expect(volumeQuantityOutputSchema.safeParse({ ...validVolumeOutput, method: "direct" }).success).toBe(false);
  });
});

function fakeTransport(complete: ChatCompletionsTransport["complete"]): ChatCompletionsTransport {
  return { id: "fixture-provider", model: "fixture-model", complete };
}

describe("ChatQuantityEstimationProvider: routes by unit class, one call per estimate", () => {
  it("sends the volume instruction/schema for a plate and tags the result as volume/container", async () => {
    const complete = vi.fn(async (instruction: string, _input: string, validate: (v: unknown) => unknown) => {
      expect(instruction).toBe(VOLUME_QUANTITY_INSTRUCTION);
      return validate(validVolumeOutput);
    });
    const provider = new ChatQuantityEstimationProvider(fakeTransport(complete));
    const parsed: ParsedNaturalFoodQuery = { foodQuery: "spenot", quantity: 1, unit: "plate" };
    const result = await provider.estimate({ parsed, food });
    expect(complete).toHaveBeenCalledOnce();
    expect(result?.estimationClass).toBe("volume");
    expect(result?.estimationMethodClass).toBe("container");
    expect(result?.volumeModel).toMatchObject(validVolumeOutput.volumeModel);
  });

  it("tags handful as packing even though it also uses the volume schema", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate(validVolumeOutput));
    const provider = new ChatQuantityEstimationProvider(fakeTransport(complete));
    const parsed: ParsedNaturalFoodQuery = { foodQuery: "peanuts", quantity: 1, unit: "handful" };
    const result = await provider.estimate({ parsed, food: { ...food, name: "Peanuts" } });
    expect(result?.estimationClass).toBe("volume");
    expect(result?.estimationMethodClass).toBe("packing");
  });

  it("sends the existing direct instruction/schema for a geometry-class unit (piece), no volumeModel produced", async () => {
    const complete = vi.fn(async (instruction: string, _input: string, validate: (v: unknown) => unknown) => {
      expect(instruction).toBe(QUANTITY_INSTRUCTION);
      return validate({ gramsPerUnit: 50, rangeGramsPerUnit: { min: 40, max: 60 }, confidence: 0.9 });
    });
    const provider = new ChatQuantityEstimationProvider(fakeTransport(complete));
    const parsed: ParsedNaturalFoodQuery = { foodQuery: "spenot", quantity: 1, unit: "piece" };
    const result = await provider.estimate({ parsed, food });
    expect(complete).toHaveBeenCalledOnce();
    expect(result?.estimationClass).toBe("geometry");
    expect(result?.volumeModel).toBeUndefined();
  });

  it("makes exactly one AI call per estimate — no sequential plate-size/density/grams calls", async () => {
    const complete = vi.fn(async (_i: string, _input: string, validate: (v: unknown) => unknown) => validate(validVolumeOutput));
    const provider = new ChatQuantityEstimationProvider(fakeTransport(complete));
    await provider.estimate({ parsed: { foodQuery: "spenot", quantity: 1, unit: "bowl" }, food });
    expect(complete).toHaveBeenCalledOnce();
  });

  it("sends distinct physical context for different preparations of the same unit/food (no hardcoded plate=X)", async () => {
    const seenInputs: string[] = [];
    const complete = vi.fn(async (_i: string, input: string, validate: (v: unknown) => unknown) => {
      seenInputs.push(input);
      return validate(validVolumeOutput);
    });
    const provider = new ChatQuantityEstimationProvider(fakeTransport(complete));
    const base: ParsedNaturalFoodQuery = { foodQuery: "spenot", quantity: 1, unit: "plate" };
    await provider.estimate({ parsed: { ...base, preparation: "raw" }, food });
    await provider.estimate({ parsed: { ...base, preparation: "boiled" }, food });
    expect(seenInputs).toHaveLength(2);
    expect(seenInputs[0]).not.toBe(seenInputs[1]);
    expect(seenInputs[0]).toContain("raw");
    expect(seenInputs[1]).toContain("boiled");
  });

  it("passes vessel-shape and fill-level modifiers through to the provider context when present", async () => {
    let capturedInput = "";
    const complete = vi.fn(async (_i: string, input: string, validate: (v: unknown) => unknown) => { capturedInput = input; return validate(validVolumeOutput); });
    const provider = new ChatQuantityEstimationProvider(fakeTransport(complete));
    await provider.estimate({ parsed: { foodQuery: "spenot", quantity: 1, unit: "plate", vesselShape: "deep", fill: "heaped" }, food });
    const parsedContext = JSON.parse(capturedInput);
    expect(parsedContext.vesselShape).toBe("deep");
    expect(parsedContext.fill).toBe("heaped");
  });

  it("caches per unit class — a plate estimate and a piece estimate for the same food never share a cache entry", async () => {
    const complete = vi.fn(async (_i: string, input: string, validate: (v: unknown) => unknown) => {
      return input.includes("\"unit\":\"plate\"") ? validate(validVolumeOutput) : validate({ gramsPerUnit: 50, rangeGramsPerUnit: { min: 40, max: 60 }, confidence: 0.9 });
    });
    const provider = new ChatQuantityEstimationProvider(fakeTransport(complete));
    const plateResult = await provider.estimate({ parsed: { foodQuery: "spenot", quantity: 1, unit: "plate" }, food });
    const pieceResult = await provider.estimate({ parsed: { foodQuery: "spenot", quantity: 1, unit: "piece" }, food });
    expect(complete).toHaveBeenCalledTimes(2);
    expect(plateResult?.estimationClass).toBe("volume");
    expect(pieceResult?.estimationClass).toBe("geometry");
  });
});
