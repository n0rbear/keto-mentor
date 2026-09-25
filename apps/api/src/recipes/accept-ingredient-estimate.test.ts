import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptIngredientEstimate } from "./accept-ingredient-estimate.js";
import { createAiEstimateProof } from "../catalog/ai-estimate-proof.js";

const estimate = { requestedIdentity: "Yeast extract", canonicalFoodName: "Yeast extract",
  kcalPer100g: 180, proteinPer100g: 24, fatPer100g: 1, carbsPer100g: 14, fiberPer100g: 3 };
afterEach(() => vi.unstubAllEnvs());
function fixture(existing: unknown = null, expired = false) {
  vi.stubEnv("JWT_ACCESS_SECRET", "s".repeat(32));
  const prisma = { food: { findFirst: vi.fn(async () => existing), create: vi.fn(async ({ data }) => ({ id: "private-1", ...data })) } };
  const body = { ...estimate, quantityGrams: 100,
    aiEstimateProof: createAiEstimateProof("u1", estimate, undefined, expired ? Date.now() - 16 * 60_000 : Date.now()) };
  return { prisma, body };
}
describe("ingredient estimate acceptance", () => {
  it("creates only a private food, never a meal or a global authoritative record", async () => {
    const { prisma, body } = fixture();
    const food = await acceptIngredientEstimate(prisma as any, "u1", body);
    expect(food).toMatchObject({ source: "ai_estimated", createdById: "u1", kcalPer100g: 180,
      provenance: { method: "ai_ingredient_estimate", userAccepted: true } });
    expect(prisma.food.create).toHaveBeenCalledTimes(1);
    expect(prisma.food.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ createdById: "u1" }) }));
  });
  it.each(["other-user", "tamper", "expired"])("rejects %s before any read or write", async (mode) => {
    const { prisma, body } = fixture(null, mode === "expired");
    await expect(acceptIngredientEstimate(prisma as any, mode === "other-user" ? "u2" : "u1",
      mode === "tamper" ? { ...body, kcalPer100g: 190 } : body)).rejects.toMatchObject({ publicCode: "invalid_ai_estimate_proof" });
    expect(prisma.food.findFirst).not.toHaveBeenCalled();
    expect(prisma.food.create).not.toHaveBeenCalled();
  });
  it("does not reuse a substring match for a different ingredient", async () => {
    const { prisma, body } = fixture({ name: "Yeast extract flavored crackers" });
    expect(await acceptIngredientEstimate(prisma as any, "u1", body)).toMatchObject({ id: "private-1" });
    expect(prisma.food.create).toHaveBeenCalledTimes(1);
  });
  it("reuses an exact private identity after verifying the proof", async () => {
    const { prisma, body } = fixture({ id: "existing", name: "Yeast extract" });
    expect(await acceptIngredientEstimate(prisma as any, "u1", body)).toMatchObject({ id: "existing" });
    expect(prisma.food.create).not.toHaveBeenCalled();
  });
  it("persists only signed confidence and assumptions, not client replacements", async () => {
    const { prisma, body } = fixture();
    body.aiEstimateProof = createAiEstimateProof("u1", { ...estimate, confidence: "low", assumptions: "Typical composition" });
    await expect(acceptIngredientEstimate(prisma as any, "u1", { ...body, confidence: "high", assumptions: "Verified laboratory data" })).rejects.toThrow();
    expect(prisma.food.create).not.toHaveBeenCalled();
    const result = await acceptIngredientEstimate(prisma as any, "u1", body);
    expect(result.provenance).toMatchObject({ confidence: "low", assumptions: "Typical composition" });
  });
});
