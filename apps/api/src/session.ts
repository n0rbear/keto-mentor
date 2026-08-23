import { randomBytes } from "node:crypto";
import type { Session } from "@prisma/client";
import { hashPassword, signAccessToken, signRefreshToken, verifyPassword } from "./auth.js";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionClient = Pick<typeof import("./db.js").prisma, "session" | "user"> & {
  $transaction: <R>(fn: (tx: any) => Promise<R>) => Promise<R>;
};

function newRefreshSecret(): string {
  return randomBytes(32).toString("hex");
}

/** Thrown inside a rotation transaction when the old session cannot be consumed. */
class SessionConsumeError extends Error {}

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
 * Validate the refresh token and rotate to a new session + refresh secret.
 *
 * The old session is consumed via `updateMany({ id, revokedAt: null })` inside a
 * transaction, requiring `count === 1`. Because the consume and the successor
 * Session creation run in the SAME Prisma transaction, either both commit or
 * neither does, and concurrent/replayed old tokens can only succeed once
 * (the loser sees count === 0 and the whole transaction rolls back). On every
 * successful refresh a brand-new random secret is generated and only its hash
 * is stored in the DB (the raw secret is never persisted).
 *
 * Argon2 hashing of the next secret is done BEFORE entering the transaction so
 * the (potentially slow) CPU work does not hold a DB transaction open.
 */
export async function rotateSession(
  prisma: SessionClient,
  payload: { sessionId: string; secret: string }
): Promise<RefreshResult> {
  const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return { ok: false };
  if (!(await verifyPassword(session.refreshHash, payload.secret))) return { ok: false };

  // Precompute the next secret + its hash outside the DB transaction.
  const nextSecret = newRefreshSecret();
  const nextHash = await hashPassword(nextSecret);

  let successorId: string | null = null;
  try {
    successorId = await prisma.$transaction(async (tx) => {
      const consumed = await tx.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      if (consumed.count !== 1) throw new SessionConsumeError();
      const successor = await tx.session.create({
        data: { userId: session.userId, refreshHash: nextHash, expiresAt: new Date(Date.now() + SESSION_TTL_MS) }
      });
      return successor.id;
    });
  } catch (error) {
    if (error instanceof SessionConsumeError) return { ok: false };
    throw error;
  }
  if (!successorId) return { ok: false };

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { id: true, username: true, locale: true }
  });
  return {
    ok: true,
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(successorId, nextSecret)
  };
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