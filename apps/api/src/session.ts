
import { randomBytes } from "node:crypto";
import type { Session } from "@prisma/client";
import { hashPassword, signAccessToken, signRefreshToken, verifyPassword } from "./auth.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionClient = Pick<typeof import("./db.js").prisma, "session" | "user">;

function newRefreshSecret(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(
  prisma: SessionClient,
  userId: string
): Promise<{ session: Session; refreshToken: string; accessToken: string }> {
  const secret = newRefreshSecret();
  const refreshHash = await hashPassword(secret);
  const session = await prisma.session.create({
    data: { userId, refreshHash, expiresAt: new Date(Date.now() + SESSION_TTL_MS) }
  });
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, username: true, locale: true }
  });
  return {
    session,
    refreshToken: signRefreshToken(session.id, secret),
    accessToken: signAccessToken(user)
  };
}

export type RefreshResult =
  | { ok: true; accessToken: string; refreshToken: string }
  | { ok: false };

/**
 * Validate the refresh token, atomically consume (revoke) the current session,
 * and rotate to a new session + refresh secret. The old session is consumed via
 * an updateMany guarded by `revokedAt: null`, so concurrent/replayed old tokens
 * can only succeed once (count === 1). On every successful refresh a brand-new
 * random secret is generated and only its hash is stored.
 */
export async function rotateSession(
  prisma: SessionClient,
  payload: { sessionId: string; secret: string }
): Promise<RefreshResult> {
  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return { ok: false };
  if (!(await verifyPassword(session.refreshHash, payload.secret))) return { ok: false };

  // Atomically consume the old session. Only the first caller wins (count === 1),
  // which blocks replayed/concurrent old-token refreshes from both succeeding.
  const consumed = await prisma.session.updateMany({
    where: { id: session.id, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  if (consumed.count !== 1) return { ok: false };

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, locale: true }
  });
  if (!user) return { ok: false };

  const next = await createSession(prisma, user.id);
  return { ok: true, accessToken: next.accessToken, refreshToken: next.refreshToken };
}

/**
 * Revoke only the session identified by the refresh token (active session),
 * leaving other sessions for the same user intact.
 */

export async function revokeActiveSession(
  prisma: SessionClient,
  payload: { sessionId: string; secret: string },
  userId: string
): Promise<void> {
  await prisma.session.updateMany({
    where: { id: payload.sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}
