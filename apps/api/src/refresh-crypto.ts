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

// Derive a stable HMAC key from the already-present refresh signing secret.
// Using utf8 bytes keeps the key length well above the HMAC-SHA256 block size.
const HMAC_KEY = Buffer.from(env.JWT_REFRESH_SECRET, "utf8");

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
  const expected = hmacHex(secret);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}