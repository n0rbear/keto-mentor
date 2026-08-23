process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/ketomentor?schema=ketomentor";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.JWT_REFRESH_SECRET = "b".repeat(32);

import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { describe, expect, it } from "vitest";

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

  it("falls back to Argon2 verification for legacy $argon2 hashes (safe transition)", async () => {
    const secret = randomBytes(32).toString("hex");
    const legacyHash = await argon2.hash(secret, { type: argon2.argon2id });
    expect(legacyHash.startsWith("$argon2")).toBe(true);
    expect(await verifyRefreshSecret(legacyHash, secret)).toBe(true);
    expect(await verifyRefreshSecret(legacyHash, secret + "x")).toBe(false);
  });
});