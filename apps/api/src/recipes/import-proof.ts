import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 15 * 60 * 1000;
export const IMPORT_PROOF_DOMAIN = "km.recipe-import-proof.v1";
export type ImportProofMethod = "schema_org_json_ld" | "ai_structured";
const VALID_METHODS: readonly ImportProofMethod[] = ["schema_org_json_ld", "ai_structured"];
// The payload shape (v: 1) is unchanged from the original schema.org-only
// proof — only the set of values `method` may hold was widened to include
// "ai_structured". A proof minted by the pre-AI-fallback code is always
// method: "schema_org_json_ld", which still verifies correctly here, and a
// proof minted by this code with method: "ai_structured" fails closed
// (rejected, not silently accepted) against any older verifier that still
// hardcodes the single literal — safe on both sides of a deploy boundary
// without needing a payload version bump.
type ImportProofPayload = { v: 1; userId: string; sourceUrl: string; method: ImportProofMethod; exp: number };

function sign(payload: string, secret: string) {
  const derivedImportProofKey = createHmac("sha256", secret).update(IMPORT_PROOF_DOMAIN).digest();
  return createHmac("sha256", derivedImportProofKey).update(payload).digest("base64url");
}

function defaultSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_ACCESS_SECRET is required");
  return secret;
}

export function createRecipeImportProof(userId: string, sourceUrl: string, method: ImportProofMethod, secret = defaultSecret(), now = Date.now()) {
  if (!isValidUserId(userId) || !isSafeSourceUrl(sourceUrl) || !VALID_METHODS.includes(method) || !Number.isInteger(now)) throw invalidProof();
  const payload: ImportProofPayload = { v: 1, userId, sourceUrl, method, exp: now + TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

// expectedMethod is required (not inferred from the proof itself) so a proof
// minted for one extraction method can never authorize saving under another
// — the browser cannot obtain a proof for ai_structured and then claim
// sourceType=schema_org (or vice versa).
export function verifyRecipeImportProof(proof: string, userId: string, sourceUrl: string, expectedMethod: ImportProofMethod, secret = defaultSecret(), now = Date.now()) {
  if (!isValidUserId(userId) || !isSafeSourceUrl(sourceUrl) || !VALID_METHODS.includes(expectedMethod) || !Number.isInteger(now)) throw invalidProof();
  const [encoded, signature, extra] = proof.split(".");
  if (!encoded || !signature || extra) throw invalidProof();
  const expected = Buffer.from(sign(encoded, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw invalidProof();
  let payload: unknown;
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); } catch { throw invalidProof(); }
  if (!isImportProofPayload(payload) || payload.userId !== userId || payload.sourceUrl !== sourceUrl || payload.method !== expectedMethod || payload.exp <= now) throw invalidProof();
  return { sourceUrl: payload.sourceUrl, extractionMethod: payload.method } as const;
}

function isValidUserId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isSafeSourceUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

function isImportProofPayload(value: unknown): value is ImportProofPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return Object.keys(payload).every((key) => ["v", "userId", "sourceUrl", "method", "exp"].includes(key))
    && payload.v === 1
    && isValidUserId(payload.userId)
    && isSafeSourceUrl(payload.sourceUrl)
    && VALID_METHODS.includes(payload.method as ImportProofMethod)
    && typeof payload.exp === "number"
    && Number.isFinite(payload.exp)
    && Number.isInteger(payload.exp)
    && payload.exp > 0;
}

function invalidProof() {
  return Object.assign(new Error("invalid_import_proof"), { status: 400, publicCode: "invalid_import_proof" });
}
