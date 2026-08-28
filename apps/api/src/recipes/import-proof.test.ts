process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { createRecipeImportProof, IMPORT_PROOF_DOMAIN, verifyRecipeImportProof } from "./import-proof.js";

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
  it("domain-separates the proof MAC from the JWT secret", () => {
    const proof = createRecipeImportProof("u1", url, secret, 1_000);
    const [payload, mac] = proof.split(".");
    const directMac = createHmac("sha256", secret).update(payload).digest("base64url");
    const derivedKey = createHmac("sha256", secret).update(IMPORT_PROOF_DOMAIN).digest();
    const derivedMac = createHmac("sha256", derivedKey).update(payload).digest("base64url");
    const otherKey = createHmac("sha256", secret).update(`${IMPORT_PROOF_DOMAIN}.other`).digest();
    const otherMac = createHmac("sha256", otherKey).update(payload).digest("base64url");
    expect(IMPORT_PROOF_DOMAIN).toBe("km.recipe-import-proof.v1");
    expect(mac).toBe(derivedMac);
    expect(mac).not.toBe(directMac);
    expect(mac).not.toBe(otherMac);
  });
  it("rejects signed payloads with unsafe shapes or values", () => {
    const proofFor = (payload: unknown) => {
      const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
      const key = createHmac("sha256", secret).update(IMPORT_PROOF_DOMAIN).digest();
      return `${encoded}.${createHmac("sha256", key).update(encoded).digest("base64url")}`;
    };
    const base = { v: 1, userId: "u1", sourceUrl: url, method: "schema_org_json_ld", exp: 999_999 };
    for (const payload of [
      null, [], { ...base, userId: "" }, { ...base, exp: "999999" }, { ...base, exp: 1.5 },
      { ...base, sourceUrl: "javascript:alert(1)" }, { ...base, sourceUrl: "https://user:pass@example.com" },
      { ...base, extra: true }, { ...base, method: "other" }, { ...base, v: "1" }
    ]) expect(() => verifyRecipeImportProof(proofFor(payload), "u1", url, secret, 1_001)).toThrowError(expect.objectContaining({ publicCode: "invalid_import_proof" }));
    expect(() => verifyRecipeImportProof(proofFor(base), "u1", url, secret, Number.NaN)).toThrowError(expect.objectContaining({ publicCode: "invalid_import_proof" }));
  });
  it("allows stateless replay by the same user and URL during the TTL", () => {
    const proof = createRecipeImportProof("u1", url, secret, 1_000);
    expect(verifyRecipeImportProof(proof, "u1", url, secret, 2_000)).toBeTruthy();
    expect(verifyRecipeImportProof(proof, "u1", url, secret, 3_000)).toBeTruthy();
  });
});
