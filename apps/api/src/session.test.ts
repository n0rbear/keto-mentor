process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/ketomentor?schema=ketomentor";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.JWT_REFRESH_SECRET = "b".repeat(32);


import type { Session } from "@prisma/client";
import { describe, expect, it } from "vitest";

type FakeSession = Session & { id: string };

function makeClient() {
  const sessions: FakeSession[] = [];
  const users: Record<string, { id: string; username: string; locale: string }> = {};
  let counter = 0;

  const prisma = {
    $transaction: (fn: (tx: any) => Promise<any>) => fn(prisma),
    session: {
      async create({ data }: { data: { userId: string; refreshHash: string; expiresAt: Date } }) {
        const id = `sess_${++counter}`;
        const row = { ...data, id, revokedAt: null as Date | null } as FakeSession;
        sessions.push(row);
        return row;
      },
      async findUnique({ where }: { where: { id: string } }) {
        const found = sessions.find((s) => s.id === where.id);
        return found ? { ...found } : null;
      },
      async updateMany({ where, data }: { where: { id: string; userId?: string; revokedAt?: null }; data: { revokedAt: Date } }) {
        let count = 0;
        for (const s of sessions) {
          const idOk = s.id === where.id;
          const userOk = where.userId === undefined || s.userId === where.userId;
          const revokedOk = where.revokedAt === null ? s.revokedAt === null : true;
          if (idOk && userOk && revokedOk) {
            s.revokedAt = data.revokedAt;
            count += 1;
          }
        }
        return { count };
      }
    },
    user: {
      async findUnique({ where }: { where: { id: string } }) {
        return users[where.id] ?? null;
      },
      async findUniqueOrThrow({ where }: { where: { id: string } }) {
        const u = users[where.id];
        if (!u) throw new Error("user not found");
        return u;
      }
    }
  };
  const data = {
    addUser(id: string, username = id, locale = "en") {
      users[id] = { id, username, locale };
      return users[id];
    },
    setExpired(id: string) {
      const s = sessions.find((x) => x.id === id);
      if (s) s.expiresAt = new Date(Date.now() - 1000);
    },
    setRevoked(id: string) {
      const s = sessions.find((x) => x.id === id);
      if (s) s.revokedAt = new Date();
    }
  };
  return { prisma: prisma as any, data };
}


const { verifyRefreshToken } = await import("./auth.js");
const { createSession, rotateSession, revokeActiveSession } = await import("./session.js");

describe("session refresh token binding", () => {
  it("valid refresh succeeds and issues a new secret-bound token", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, "u1");
    const payload = verifyRefreshToken(created.refreshToken)!;
    expect(payload).toBeTruthy();

    const result = await rotateSession(prisma, payload);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // new token decodes and points to a different session id
    const next = verifyRefreshToken(result.refreshToken)!;
    expect(next.sessionId).not.toBe(payload.sessionId);
    expect(next.secret).not.toBe(payload.secret);
  });

  it("invalid secret fails", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, "u1");
    const payload = verifyRefreshToken(created.refreshToken)!;
    const result = await rotateSession(prisma, { sessionId: payload.sessionId, secret: "wrong-secret" });
    expect(result.ok).toBe(false);
  });

  it("expired session fails", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, "u1");
    const payload = verifyRefreshToken(created.refreshToken)!;
    data.setExpired(payload.sessionId);
    const result = await rotateSession(prisma, payload);
    expect(result.ok).toBe(false);
  });

  it("revoked session fails", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, "u1");
    const payload = verifyRefreshToken(created.refreshToken)!;
    data.setRevoked(payload.sessionId);
    const result = await rotateSession(prisma, payload);
    expect(result.ok).toBe(false);
  });

  it("old token cannot be reused after rotation", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, "u1");
    const payload = verifyRefreshToken(created.refreshToken)!;
    const first = await rotateSession(prisma, payload);
    expect(first.ok).toBe(true);
    const replay = await rotateSession(prisma, payload);
    expect(replay.ok).toBe(false);
  });

  it("concurrent replays of the same old token produce at most one successor session", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, "u1");
    const payload = verifyRefreshToken(created.refreshToken)!;
    const [a, b] = await Promise.all([rotateSession(prisma, payload), rotateSession(prisma, payload)]);
    const successes = [a.ok, b.ok].filter(Boolean).length;
    expect(successes).toBe(1);
  });

  it("logout revokes only the active session, not others", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const s1 = await createSession(prisma, "u1");
    const s2 = await createSession(prisma, "u1");
    const p1 = verifyRefreshToken(s1.refreshToken)!;
    const p2 = verifyRefreshToken(s2.refreshToken)!;
    await rev_ok(prisma, p1, "u1");
    // s1 should be revoked; s2 still works
    expect((await rotateSession(prisma, p2)).ok).toBe(true);
    expect((await rotateSession(prisma, p1)).ok).toBe(false);
  });
});

async function rev_ok(prisma: any, payload: { sessionId: string; secret: string }, userId: string) {
  await revokeActiveSession(prisma, payload, userId);
}