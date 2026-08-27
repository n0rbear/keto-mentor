process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
import { describe, expect, it } from "vitest";
import { createRecipeImportProof, verifyRecipeImportProof } from "./import-proof.js";

describe("recipe import proof", () => {
  const secret = "s".repeat(32);
  const url = "https://example.com/recipe";
  it("binds proof to user and final source URL", () => {
    const proof = createRecipeImportProof("u1", url, secret, 1_000);
    expect(verifyRecipeImportProof(proof, "u1", url, secret, 1_001)).toEqual({ sourceUrl: url, extractionMethod: "schema_org_json_ld" });
    expect(() => verifyRecipeImportProof(proof, "u2", url, secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_import_proof" }));
    expect(() => verifyRecipeImportProof(proof, "u1", "https://evil.test", secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_import_proof" }));
  });
  it("rejects tampering and expiry", () => {
    const proof = createRecipeImportProof("u1", url, secret, 1_000);
    expect(() => verifyRecipeImportProof(`${proof}x`, "u1", url, secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_import_proof" }));
    expect(() => verifyRecipeImportProof(proof, "u1", url, secret, 1_000 + 15 * 60 * 1_000 + 1)).toThrowError(expect.objectContaining({ publicCode: "invalid_import_proof" }));
  });
  it("contains no imported nutrition", () => {
    const [payload] = createRecipeImportProof("u1", url, secret, 1_000).split(".");
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).not.toHaveProperty("nutrition");
  });
});
