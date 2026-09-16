process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
import { describe, expect, it } from "vitest";
import { AI_ESTIMATE_PROOF_DOMAIN, createAiEstimateProof, verifyAiEstimateProof, type AiEstimateProofInput } from "./ai-estimate-proof.js";

describe("ai estimate proof", () => {
  const secret = "s".repeat(32);
  const estimate: AiEstimateProofInput = {
    requestedIdentity: "kárász", canonicalFoodName: "Crucian carp, raw",
    kcalPer100g: 97, proteinPer100g: 17.8, fatPer100g: 2.7, carbsPer100g: 0, fiberPer100g: 0
  };

  it("binds the proof to the user and the exact estimate values", () => {
    const proof = createAiEstimateProof("u1", estimate, secret, 1_000);
    expect(verifyAiEstimateProof(proof, "u1", estimate, secret, 1_001)).toEqual({ requestedIdentity: estimate.requestedIdentity, canonicalFoodName: estimate.canonicalFoodName });
  });

  it("rejects acceptance by a different user than the one the estimate was generated for", () => {
    const proof = createAiEstimateProof("u1", estimate, secret, 1_000);
    expect(() => verifyAiEstimateProof(proof, "u2", estimate, secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
  });

  it("rejects a client substituting different numeric values while reusing a valid proof (the core tamper-proofing this exists for)", () => {
    const proof = createAiEstimateProof("u1", estimate, secret, 1_000);
    const tampered = { ...estimate, kcalPer100g: 999 };
    expect(() => verifyAiEstimateProof(proof, "u1", tampered, secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
  });

  it.each(["proteinPer100g", "fatPer100g", "carbsPer100g", "fiberPer100g"] as const)("rejects a substituted %s specifically", (field) => {
    const proof = createAiEstimateProof("u1", estimate, secret, 1_000);
    const tampered = { ...estimate, [field]: estimate[field] + 50 };
    expect(() => verifyAiEstimateProof(proof, "u1", tampered, secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
  });

  it("rejects a substituted identity or canonical name", () => {
    const proof = createAiEstimateProof("u1", estimate, secret, 1_000);
    expect(() => verifyAiEstimateProof(proof, "u1", { ...estimate, requestedIdentity: "something else" }, secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
    expect(() => verifyAiEstimateProof(proof, "u1", { ...estimate, canonicalFoodName: "Different food" }, secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
  });

  it("rejects tampering and expiry", () => {
    const proof = createAiEstimateProof("u1", estimate, secret, 1_000);
    expect(() => verifyAiEstimateProof(`${proof}x`, "u1", estimate, secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
    expect(() => verifyAiEstimateProof(proof, "u1", estimate, secret, 1_000 + 15 * 60 * 1_000 + 1)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
  });

  it("domain-separates the proof MAC (distinct from the recipe-import-proof domain and the raw JWT secret)", () => {
    expect(AI_ESTIMATE_PROOF_DOMAIN).toBe("km.ai-estimate-proof.v1");
    expect(AI_ESTIMATE_PROOF_DOMAIN).not.toBe("km.recipe-import-proof.v1");
  });

  it("rejects negative or non-finite values at mint time", () => {
    expect(() => createAiEstimateProof("u1", { ...estimate, kcalPer100g: -1 }, secret, 1_000)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
    expect(() => createAiEstimateProof("u1", { ...estimate, kcalPer100g: NaN }, secret, 1_000)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
    expect(() => createAiEstimateProof("u1", { ...estimate, kcalPer100g: Infinity }, secret, 1_000)).toThrowError(expect.objectContaining({ publicCode: "invalid_ai_estimate_proof" }));
  });
});
