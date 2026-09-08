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
  // Records the ORDER in which each fake DB method is invoked (not when it
  // resolves), so tests can prove call-order/concurrency properties (e.g.
  // "the user lookup started before the transaction settled") without
  // relying on brittle timing.
  const calls: string[] = [];

  const prisma = {
    $transaction: async (fn: (tx: any) => Promise<any>) => {
      calls.push("$transaction");
      // A real microtask hop, so a concurrently-kicked-off (not awaited yet)
      // sibling call has a chance to have already started by the time this
      // resolves — same as it would against a real async DB round-trip.
      await Promise.resolve();
      return fn(prisma);
    },
    session: {
      async create({ data }: { data: { userId: string; refreshHash: string; expiresAt: Date } }) {
        calls.push("session.create");
        const id = `sess_${++counter}`;
        const row = { ...data, id, revokedAt: null as Date | null } as FakeSession;
        sessions.push(row);
        return row;
      },
      async findUnique({ where }: { where: { id: string } }) {
        calls.push("session.findUnique");
        const found = sessions.find((s) => s.id === where.id);
        return found ? { ...found } : null;
      },
      async updateMany({ where, data }: { where: { id: string; userId?: string; revokedAt?: null }; data: { revokedAt: Date } }) {
        calls.push("session.updateMany");
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
        calls.push("user.findUnique");
        return users[where.id] ?? null;
      },
      async findUniqueOrThrow({ where }: { where: { id: string } }) {
        calls.push("user.findUniqueOrThrow");
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
  return { prisma: prisma as any, data, calls };
}


const { verifyRefreshToken } = await import("./auth.js");
const { createSession, rotateSession, revokeActiveSession } = await import("./session.js");

describe("session refresh token binding", () => {
  it("valid refresh succeeds and issues a new secret-bound token", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
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
    const created = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const payload = verifyRefreshToken(created.refreshToken)!;
    const result = await rotateSession(prisma, { sessionId: payload.sessionId, secret: "wrong-secret" });
    expect(result.ok).toBe(false);
  });

  it("expired session fails", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const payload = verifyRefreshToken(created.refreshToken)!;
    data.setExpired(payload.sessionId);
    const result = await rotateSession(prisma, payload);
    expect(result.ok).toBe(false);
  });

  it("revoked session fails", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const payload = verifyRefreshToken(created.refreshToken)!;
    data.setRevoked(payload.sessionId);
    const result = await rotateSession(prisma, payload);
    expect(result.ok).toBe(false);
  });

  it("old token cannot be reused after rotation", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const payload = verifyRefreshToken(created.refreshToken)!;
    const first = await rotateSession(prisma, payload);
    expect(first.ok).toBe(true);
    const replay = await rotateSession(prisma, payload);
    expect(replay.ok).toBe(false);
  });

  it("concurrent replays of the same old token produce at most one successor session", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const payload = verifyRefreshToken(created.refreshToken)!;
    const [a, b] = await Promise.all([rotateSession(prisma, payload), rotateSession(prisma, payload)]);
    const successes = [a.ok, b.ok].filter(Boolean).length;
    expect(successes).toBe(1);
  });

  it("logout revokes only the active session, not others", async () => {
    const { prisma, data } = makeClient();
    data.addUser("u1");
    const s1 = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const s2 = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const p1 = verifyRefreshToken(s1.refreshToken)!;
    const p2 = verifyRefreshToken(s2.refreshToken)!;
    await rev_ok(prisma, p1, "u1");
    // s1 should be revoked; s2 still works
    expect((await rotateSession(prisma, p2)).ok).toBe(true);
    expect((await rotateSession(prisma, p1)).ok).toBe(false);
  });
});

// Owner-beta finding J (login/startup performance): createSession used to
// re-fetch the user by id AFTER creating the session, even though both
// existing callers (login, register) already have the full user row in
// hand — an entirely avoidable extra DB round-trip on every login. These
// prove the fix by call-count/call-order, not by timing, per the task's
// own guidance against brittle millisecond assertions.
describe("session issuance avoids avoidable DB round-trips (owner-beta finding J)", () => {
  it("createSession never re-fetches the user it was already given", async () => {
    const { prisma, calls } = makeClient();
    const user = { id: "u1", username: "u1", locale: "en" };
    await createSession(prisma, user);
    expect(calls).toEqual(["session.create"]);
    expect(calls).not.toContain("user.findUnique");
    expect(calls).not.toContain("user.findUniqueOrThrow");
  });

  it("rotateSession starts the user lookup before the consume+create transaction settles, not sequentially after it", async () => {
    const { prisma, data, calls } = makeClient();
    data.addUser("u1");
    const created = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const payload = verifyRefreshToken(created.refreshToken)!;
    calls.length = 0; // only care about ordering within rotateSession itself

    const result = await rotateSession(prisma, payload);
    expect(result.ok).toBe(true);

    // The old sequential version called user.findUniqueOrThrow strictly
    // AFTER $transaction had fully resolved. The fixed version starts it
    // before awaiting the transaction, so it must appear before
    // "$transaction" in call order, not after.
    const userCallIndex = calls.indexOf("user.findUniqueOrThrow");
    const transactionCallIndex = calls.indexOf("$transaction");
    expect(userCallIndex).toBeGreaterThanOrEqual(0);
    expect(transactionCallIndex).toBeGreaterThanOrEqual(0);
    expect(userCallIndex).toBeLessThan(transactionCallIndex);
  });
});


async function rev_ok(prisma: any, payload: { sessionId: string; secret: string }, userId: string) {
  await revokeActiveSession(prisma, payload, userId);
}

// A client whose DB work throws unexpectedly (simulates Prisma/transaction/Argon2
// failure). This proves the awaited async work rejects rather than being silently
// swallowed, so the Express 4 route's `catch (error) { next(error) }` path is
// reached (the failure is forwarded, not turned into an unhandled rejection or a 401).
function makeFailingClient() {
  const sessions: FakeSession[] = [];
  const users: Record<string, { id: string; username: string; locale: string }> = { u1: { id: "u1", username: "u1", locale: "en" } };
  let counter = 0;
  const prisma = {
    $transaction: () => Promise.reject(new Error("simulated db failure")),
    session: {
      async create({ data }: { data: { userId: string; refreshHash: string; expiresAt: Date } }) {
        const id = `sess_${++counter}`;
        const row = { ...data, id, revokedAt: null as Date | null } as FakeSession;
        sessions.push(row);
        return row;
      },
      async findUnique({ where }: { where: { id: string } }) {
        return sessions.find((s) => s.id === where.id) ?? null;
      },
      async updateMany() {
        throw new Error("simulated db failure");
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
  return { prisma: prisma as any, counter };
}

describe("session service forwards unexpected failures", () => {
  it("rotateSession rejects on an unexpected DB/transaction error", async () => {
    const { prisma } = makeFailingClient();
    const created = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const payload = verifyRefreshToken(created.refreshToken)!;
    await expect(rotateSession(prisma, payload)).rejects.toThrow("simulated db failure");
  });

  it("revokeActiveSession rejects on an unexpected DB error", async () => {
    const { prisma } = makeFailingClient();
    const created = await createSession(prisma, { id: "u1", username: "u1", locale: "en" });
    const payload = verifyRefreshToken(created.refreshToken)!;
    await expect(revokeActiveSession(prisma, payload, "u1")).rejects.toThrow("simulated db failure");
  });
});
