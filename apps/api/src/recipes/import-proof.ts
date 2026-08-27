import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 15 * 60 * 1000;
type ImportProofPayload = { v: 1; userId: string; sourceUrl: string; method: "schema_org_json_ld"; exp: number };

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function defaultSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_ACCESS_SECRET is required");
  return secret;
}

export function createRecipeImportProof(userId: string, sourceUrl: string, secret = defaultSecret(), now = Date.now()) {
  const payload: ImportProofPayload = { v: 1, userId, sourceUrl, method: "schema_org_json_ld", exp: now + TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifyRecipeImportProof(proof: string, userId: string, sourceUrl: string, secret = defaultSecret(), now = Date.now()) {
  const [encoded, signature, extra] = proof.split(".");
  if (!encoded || !signature || extra) throw invalidProof();
  const expected = Buffer.from(sign(encoded, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw invalidProof();
  let payload: ImportProofPayload;
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); } catch { throw invalidProof(); }
  if (payload.v !== 1 || payload.userId !== userId || payload.sourceUrl !== sourceUrl || payload.method !== "schema_org_json_ld" || payload.exp < now) throw invalidProof();
  return { sourceUrl: payload.sourceUrl, extractionMethod: payload.method } as const;
}

function invalidProof() {
  return Object.assign(new Error("invalid_import_proof"), { status: 400, publicCode: "invalid_import_proof" });
}
