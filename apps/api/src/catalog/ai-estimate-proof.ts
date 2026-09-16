import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Tamper-proofs an AI nutrition estimate between the moment it is generated
 * (POST /meal-input/interpret) and the moment a user explicitly accepts it
 * (POST /meals). Mirrors recipes/import-proof.ts's exact pattern: without
 * this, a client could submit arbitrary self-chosen numbers labeled
 * source: "ai_estimated" — no worse than the existing manual-fallback path
 * accepting arbitrary "user_input" numbers, but it would silently defeat
 * the provenance distinction Part P/Part J rely on ("ai_estimated" is
 * supposed to mean "this is genuinely what the model produced", not just
 * "the client typed this and picked a label"). The proof cryptographically
 * commits to the exact identity AND every numeric value, so acceptance can
 * only ever persist the SAME estimate the server actually generated.
 */
const TTL_MS = 15 * 60 * 1000;
export const AI_ESTIMATE_PROOF_DOMAIN = "km.ai-estimate-proof.v1";
type AiEstimateProofPayload = {
  v: 1; userId: string; requestedIdentity: string; canonicalFoodName: string;
  kcalPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number; fiberPer100g: number;
  exp: number;
};

export type AiEstimateProofInput = {
  requestedIdentity: string; canonicalFoodName: string;
  kcalPer100g: number; proteinPer100g: number; fatPer100g: number; carbsPer100g: number; fiberPer100g: number;
};

function sign(payload: string, secret: string) {
  const derivedKey = createHmac("sha256", secret).update(AI_ESTIMATE_PROOF_DOMAIN).digest();
  return createHmac("sha256", derivedKey).update(payload).digest("base64url");
}

function defaultSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_ACCESS_SECRET is required");
  return secret;
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidInput(value: AiEstimateProofInput): boolean {
  return typeof value.requestedIdentity === "string" && value.requestedIdentity.length > 0
    && typeof value.canonicalFoodName === "string" && value.canonicalFoodName.length > 0
    && isFiniteNonNegative(value.kcalPer100g) && isFiniteNonNegative(value.proteinPer100g)
    && isFiniteNonNegative(value.fatPer100g) && isFiniteNonNegative(value.carbsPer100g) && isFiniteNonNegative(value.fiberPer100g);
}

export function createAiEstimateProof(userId: string, estimate: AiEstimateProofInput, secret = defaultSecret(), now = Date.now()) {
  if (!userId || !isValidInput(estimate) || !Number.isInteger(now)) throw invalidProof();
  const payload: AiEstimateProofPayload = {
    v: 1, userId, requestedIdentity: estimate.requestedIdentity, canonicalFoodName: estimate.canonicalFoodName,
    kcalPer100g: estimate.kcalPer100g, proteinPer100g: estimate.proteinPer100g, fatPer100g: estimate.fatPer100g,
    carbsPer100g: estimate.carbsPer100g, fiberPer100g: estimate.fiberPer100g, exp: now + TTL_MS
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

// Every numeric/identity field the client submits for persistence must
// match the signed payload EXACTLY — a client cannot accept the identity of
// one estimate while substituting different macro numbers.
export function verifyAiEstimateProof(proof: string, userId: string, estimate: AiEstimateProofInput, secret = defaultSecret(), now = Date.now()) {
  if (!userId || !isValidInput(estimate) || !Number.isInteger(now)) throw invalidProof();
  const [encoded, signature, extra] = proof.split(".");
  if (!encoded || !signature || extra) throw invalidProof();
  const expected = Buffer.from(sign(encoded, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw invalidProof();
  let payload: unknown;
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); } catch { throw invalidProof(); }
  if (!isAiEstimateProofPayload(payload)) throw invalidProof();
  if (payload.userId !== userId || payload.exp <= now) throw invalidProof();
  if (payload.requestedIdentity !== estimate.requestedIdentity || payload.canonicalFoodName !== estimate.canonicalFoodName) throw invalidProof();
  if (payload.kcalPer100g !== estimate.kcalPer100g || payload.proteinPer100g !== estimate.proteinPer100g
    || payload.fatPer100g !== estimate.fatPer100g || payload.carbsPer100g !== estimate.carbsPer100g || payload.fiberPer100g !== estimate.fiberPer100g) throw invalidProof();
  return { requestedIdentity: payload.requestedIdentity, canonicalFoodName: payload.canonicalFoodName } as const;
}

function isAiEstimateProofPayload(value: unknown): value is AiEstimateProofPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  const allowedKeys = ["v", "userId", "requestedIdentity", "canonicalFoodName", "kcalPer100g", "proteinPer100g", "fatPer100g", "carbsPer100g", "fiberPer100g", "exp"];
  return Object.keys(payload).every((key) => allowedKeys.includes(key))
    && payload.v === 1
    && typeof payload.userId === "string" && payload.userId.length > 0
    && typeof payload.requestedIdentity === "string" && payload.requestedIdentity.length > 0
    && typeof payload.canonicalFoodName === "string" && payload.canonicalFoodName.length > 0
    && isFiniteNonNegative(payload.kcalPer100g) && isFiniteNonNegative(payload.proteinPer100g)
    && isFiniteNonNegative(payload.fatPer100g) && isFiniteNonNegative(payload.carbsPer100g) && isFiniteNonNegative(payload.fiberPer100g)
    && typeof payload.exp === "number" && Number.isInteger(payload.exp) && payload.exp > 0;
}

function invalidProof() {
  return Object.assign(new Error("invalid_ai_estimate_proof"), { status: 400, publicCode: "invalid_ai_estimate_proof" });
}
