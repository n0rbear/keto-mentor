process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/ketomentor?schema=ketomentor";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.JWT_REFRESH_SECRET = "b".repeat(32);

import { createHmac, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { describe, expect, it, vi } from "vitest";

// Import after env is set: refresh-crypto imports config, which parses
// process.env at module load time.
const { hashRefreshSecret, verifyRefreshSecret } = await import("./refresh-crypto.js");

describe("refresh-crypto", () => {
  it("produces a 64-char hex HMAC for a random refresh secret", () => {
    const secret = randomBytes(32).toString("hex");
    const hash = hashRefreshSecret(secret);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifies the correct secret", async () => {
    const secret = randomBytes(32).toString("hex");
    const hash = hashRefreshSecret(secret);
    expect(await verifyRefreshSecret(hash, secret)).toBe(true);
  });

  it("rejects a tampered/wrong secret", async () => {
    const secret = randomBytes(32).toString("hex");
    const hash = hashRefreshSecret(secret);
    const flipped = secret.slice(0, -1) + (secret.slice(-1) === "a" ? "b" : "a");
    expect(await verifyRefreshSecret(hash, flipped)).toBe(false);
  });

  it("rejects empty inputs without throwing", async () => {
    expect(await verifyRefreshSecret("", "")).toBe(false);
    expect(await verifyRefreshSecret("deadbeef", "")).toBe(false);
    expect(await verifyRefreshSecret("", "secret")).toBe(false);
  });

  it("is deterministic for a given secret + key", () => {
    const secret = randomBytes(32).toString("hex");
    expect(hashRefreshSecret(secret)).toBe(hashRefreshSecret(secret));
  });

  it("uses the domain-separated derived key", () => {
    const secret = "known-refresh-secret";
    const derivedKey = createHmac("sha256", process.env.JWT_REFRESH_SECRET!)
      .update("km.refresh-hash.v1")
      .digest();
    const expected = createHmac("sha256", derivedKey).update(secret).digest("hex");
    expect(hashRefreshSecret(secret)).toBe(expected);
  });

  it("rejects malformed non-Argon2 hashes safely", async () => {
    await expect(verifyRefreshSecret("not-hex", "secret")).resolves.toBe(false);
    await expect(verifyRefreshSecret("a".repeat(63), "secret")).resolves.toBe(false);
    await expect(verifyRefreshSecret("g".repeat(64), "secret")).resolves.toBe(false);
  });

  it("does not call Argon2 for a new HMAC hash", async () => {
    const verify = vi.spyOn(argon2, "verify");
    const secret = randomBytes(32).toString("hex");
    expect(await verifyRefreshSecret(hashRefreshSecret(secret), secret)).toBe(true);
    expect(verify).not.toHaveBeenCalled();
    verify.mockRestore();
  });

  it("falls back to Argon2 verification for legacy $argon2 hashes (safe transition)", async () => {
    const secret = randomBytes(32).toString("hex");
    const legacyHash = await argon2.hash(secret, { type: argon2.argon2id });
    expect(legacyHash.startsWith("$argon2")).toBe(true);
    expect(await verifyRefreshSecret(legacyHash, secret)).toBe(true);
    expect(await verifyRefreshSecret(legacyHash, secret + "x")).toBe(false);
  });
});
