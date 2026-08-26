import { createHmac, timingSafeEqual } from "node:crypto";
import argon2 from "argon2";
import { env } from "./config.js";

/**
 * Refresh-secret storage.
 *
 * A refresh secret is `randomBytes(32)` hex (256 bits of entropy). Hashing it
 * with a slow password hash (Argon2id) is unnecessary: the secret already has
 * password-strength entropy, so a fast cryptographic MAC is the correct
 * primitive and avoids a ~70-140 ms CPU cost on every login/refresh.
 *
 * We store HMAC-SHA256(secret, key) where `key` is derived deterministically
 * from the existing `JWT_REFRESH_SECRET` (no new env var required). The raw
 * secret is never persisted. Verification uses a constant-time comparison.
 *
 * A legacy fallback verifies old Argon2-stored hashes (those start with
 * "$argon2") so currently-issued sessions keep working until they are rotated
 * or the scheduled production cleanup removes them. New secrets always use HMAC.
 */

// Derive a stable, domain-separated HMAC key from the already-present refresh
// signing secret. We deliberately do NOT reuse JWT_REFRESH_SECRET directly as the
// MAC key: instead we derive a refresh-hash-specific subkey via HMAC-KDF so that
// the key used here is cryptographically distinct from the JWT signing context
// (explicit domain separation, prefix "km.refresh-hash.v1"). The raw secret is
// not persisted; using utf8 bytes keeps the derived key length well above the
// HMAC-SHA256 block size.
const REFRESH_HASH_DOMAIN = "km.refresh-hash.v1";
const HMAC_KEY = createHmac("sha256", env.JWT_REFRESH_SECRET).update(REFRESH_HASH_DOMAIN, "utf8").digest();

function hmacHex(secret: string): string {
  return createHmac("sha256", HMAC_KEY).update(secret).digest("hex");
}

export function hashRefreshSecret(secret: string): string {
  return hmacHex(secret);
}

function isLegacyArgon2Hash(hash: string): boolean {
  return typeof hash === "string" && hash.startsWith("$argon2");
}

/**
 * Verify a presented refresh secret against a stored hash.
 *
 * - HMAC hashes are 64 hex chars; compared in constant time.
 * - Legacy Argon2 hashes (still present on older sessions) fall back to
 *   Argon2 verification so the transition is non-breaking.
 */
export async function verifyRefreshSecret(hash: string, secret: string): Promise<boolean> {
  if (!hash || !secret) return false;
  if (isLegacyArgon2Hash(hash)) {
    try {
      return await argon2.verify(hash, secret);
    } catch {
      return false;
    }
  }
  if (!/^[0-9a-f]{64}$/.test(hash)) return false;
  const expected = Buffer.from(hmacHex(secret), "hex");
  const stored = Buffer.from(hash, "hex");
  return timingSafeEqual(expected, stored);
}
