import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import { hashResetToken, passwordResetRouter, RESET_COOLDOWN_MS, RESET_TOKEN_TTL_MS, resetEmail } from "./password-reset.js";
import type { MailMessage } from "../mail/mailer.js";
import { preferredWebOrigin, resendMailer } from "../mail/mailer.js";

const servers: any[] = [];
afterEach(() => { for (const s of servers.splice(0)) s.close(); });

// In-memory stand-in for the three Prisma models the router touches.
function fakeDb() {
  const users = [{ id: "u1", email: "anna@example.com", locale: "de", passwordHash: "hash:old-password" }, { id: "u2", email: "taken@example.com", locale: "hu", passwordHash: "hash:x" }];
  const tokens: any[] = [];
  const sessions = [{ id: "s1", userId: "u1", revokedAt: null as Date | null }, { id: "s2", userId: "u2", revokedAt: null as Date | null }];
  const match = (row: any, where: any) => Object.entries(where).every(([key, value]: [string, any]) =>
    value && typeof value === "object" && "gt" in value ? row[key] > value.gt : row[key] === value);
  const prisma = {
    user: {
      findUnique: async ({ where }: any) => users.find((u) => match(u, where)) ?? null,
      update: async ({ where, data }: any) => {
        if (data.email && users.some((u) => u.email === data.email && u.id !== where.id)) throw Object.assign(new Error("unique"), { code: "P2002" });
        const user = users.find((u) => u.id === where.id)!; Object.assign(user, data); return user;
      }
    },
    passwordResetToken: {
      findFirst: async ({ where }: any) => tokens.find((t) => match(t, where)) ?? null,
      findUnique: async ({ where }: any) => tokens.find((t) => t.tokenHash === where.tokenHash) ?? null,
      create: async ({ data }: any) => { const row = { id: `t${tokens.length}`, createdAt: clock.now, usedAt: null, ...data }; tokens.push(row); return row; },
      updateMany: async ({ where, data }: any) => { const rows = tokens.filter((t) => match(t, where)); rows.forEach((t) => Object.assign(t, data)); return { count: rows.length }; }
    },
    session: { updateMany: async ({ where, data }: any) => { const rows = sessions.filter((s) => match(s, where)); rows.forEach((s) => Object.assign(s, data)); return { count: rows.length }; } },
    $transaction: async (ops: any[]) => Promise.all(ops)
  };
  return { prisma, users, tokens, sessions };
}
const clock = { now: new Date("2026-10-15T10:00:00Z") };

async function start() {
  const db = fakeDb();
  const sent: MailMessage[] = [];
  const lines: string[] = [];
  const app = express();
  app.use(express.json());
  const requireAuth: express.RequestHandler = (req, res, next) => {
    if (!req.header("authorization")) return res.status(401).json({ error: "missing_token" });
    (req as any).user = { id: "u1", username: "anna", locale: "de" }; next();
  };
  app.use(passwordResetRouter({
    prisma: db.prisma as any, webAppUrl: "https://ketomentor.norbapp.com/", requireAuth,
    mailer: { send: async (message) => { sent.push(message); return { outcome: "sent", status: 200 }; } },
    hashPassword: async (p) => `hash:${p}`, verifyPassword: async (h, p) => h === `hash:${p}`,
    log: (line) => lines.push(line), now: () => clock.now
  }));
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(error?.name === "ZodError" ? 400 : 500).json({ error: "x" }));
  const server = app.listen(0); servers.push(server);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call = (method: string, path: string, body: unknown, auth = false) => fetch(`${base}${path}`, { method, headers: { "content-type": "application/json", ...(auth ? { authorization: "Bearer t" } : {}) }, body: JSON.stringify(body) });
  return { ...db, sent, lines, call };
}
const tokenFrom = (message: MailMessage) => /#reset=([A-Za-z0-9_-]+)/.exec(message.text)![1];

describe("password reset by e-mail", () => {
  it("answers 202 for unknown addresses without sending or revealing anything", async () => {
    const t = await start();
    const res = await t.call("POST", "/auth/password-reset/request", { email: "nobody@example.com" });
    expect(res.status).toBe(202);
    expect(t.sent).toHaveLength(0);
    expect(t.lines).toEqual(["password_reset_request outcome=no_account"]);
  });

  it("mails a one-hour single-use link in the user's language and stores only the token hash", async () => {
    const t = await start();
    expect((await t.call("POST", "/auth/password-reset/request", { email: " Anna@Example.com " })).status).toBe(202);
    expect(t.sent).toHaveLength(1);
    expect(t.sent[0]).toMatchObject({ to: "anna@example.com", subject: "Keto Mentor – neues Passwort festlegen" });
    const token = tokenFrom(t.sent[0]);
    expect(t.sent[0].text).toContain(`https://ketomentor.norbapp.com/#reset=${token}`);
    expect(t.tokens[0].tokenHash).toBe(hashResetToken(token));
    expect(JSON.stringify(t.tokens)).not.toContain(token);
    expect(t.tokens[0].expiresAt.getTime() - clock.now.getTime()).toBe(RESET_TOKEN_TTL_MS);
    expect(t.lines.join("\n")).not.toMatch(/anna|reset=/);
  });

  it("sets the new password, signs out every session, and the link works only once", async () => {
    const t = await start();
    await t.call("POST", "/auth/password-reset/request", { email: "anna@example.com" });
    const token = tokenFrom(t.sent[0]);
    const ok = await t.call("POST", "/auth/password-reset/confirm", { token, password: "uj-jelszo-123" });
    expect(ok.status).toBe(200);
    expect(t.users[0].passwordHash).toBe("hash:uj-jelszo-123");
    expect(t.sessions.find((s) => s.userId === "u1")!.revokedAt).toEqual(clock.now);
    expect(t.sessions.find((s) => s.userId === "u2")!.revokedAt).toBeNull();
    const again = await t.call("POST", "/auth/password-reset/confirm", { token, password: "masik-jelszo-123" });
    expect(again.status).toBe(400);
    expect(await again.json()).toEqual({ error: "invalid_or_expired_token" });
  });

  it("rejects an expired link, a link voided by a newer one, and a short password", async () => {
    const t = await start();
    await t.call("POST", "/auth/password-reset/request", { email: "anna@example.com" });
    const first = tokenFrom(t.sent[0]);
    expect((await t.call("POST", "/auth/password-reset/request", { email: "anna@example.com" })).status).toBe(202);
    expect(t.sent).toHaveLength(1); // cooldown: no second mail within two minutes
    const saved = clock.now;
    clock.now = new Date(saved.getTime() + RESET_COOLDOWN_MS + 1000);
    await t.call("POST", "/auth/password-reset/request", { email: "anna@example.com" });
    const second = tokenFrom(t.sent[1]);
    expect((await t.call("POST", "/auth/password-reset/confirm", { token: first, password: "uj-jelszo-123" })).status).toBe(400);
    expect((await t.call("POST", "/auth/password-reset/confirm", { token: second, password: "rovid" })).status).toBe(400);
    clock.now = new Date(clock.now.getTime() + RESET_TOKEN_TTL_MS + 1000);
    expect((await t.call("POST", "/auth/password-reset/confirm", { token: second, password: "uj-jelszo-123" })).status).toBe(400);
    clock.now = saved;
  });

  it("lets an existing account attach an e-mail with its current password", async () => {
    const t = await start();
    expect((await t.call("PUT", "/me/email", { email: "new@example.com", currentPassword: "old-password" })).status).toBe(401);
    expect((await t.call("PUT", "/me/email", { email: "new@example.com", currentPassword: "wrong" }, true)).status).toBe(401);
    expect((await t.call("PUT", "/me/email", { email: "taken@example.com", currentPassword: "old-password" }, true)).status).toBe(409);
    const ok = await t.call("PUT", "/me/email", { email: "New@Example.com", currentPassword: "old-password" }, true);
    expect(ok.status).toBe(200);
    expect(t.users[0].email).toBe("new@example.com");
  });
});

describe("reset e-mail and Resend transport", () => {
  it("has HU/DE/EN copy with the link in text and html", () => {
    for (const lang of ["hu", "de", "en"] as const) {
      const mail = resetEmail(lang, "https://x/#reset=abc");
      expect(mail.text).toContain("https://x/#reset=abc");
      expect(mail.html).toContain('href="https://x/#reset=abc"');
    }
    expect(resetEmail("hu", "l").subject).toBe("Keto Mentor – új jelszó beállítása");
  });

  it("is not_configured without a key and posts to Resend with one", async () => {
    expect(await resendMailer(undefined, "a@b.c").send({ to: "x@y.z", subject: "s", text: "t", html: "h" })).toEqual({ outcome: "not_configured" });
    const calls: any[] = [];
    const fake = (async (url: any, init: any) => { calls.push([url, init]); return new Response("{}", { status: 200 }); }) as typeof fetch;
    expect(await resendMailer("re_key", "Keto Mentor <noreply@norbapp.com>", fake).send({ to: "x@y.z", subject: "s", text: "t", html: "h" })).toEqual({ outcome: "sent", status: 200 });
    expect(calls[0][0]).toBe("https://api.resend.com/emails");
    expect(calls[0][1].headers.Authorization).toBe("Bearer re_key");
    expect(JSON.parse(calls[0][1].body)).toMatchObject({ from: "Keto Mentor <noreply@norbapp.com>", to: ["x@y.z"] });
    const failing = (async () => new Response("{}", { status: 403 })) as typeof fetch;
    expect(await resendMailer("re_key", "a@b.c", failing).send({ to: "x@y.z", subject: "s", text: "t", html: "h" })).toEqual({ outcome: "failed", status: 403 });
  });
});

describe("e-mail link origin", () => {
  it("prefers the app's own domain over the Render host", () => {
    expect(preferredWebOrigin("https://keto-mentor-web.onrender.com, https://ketomentor.norbapp.com")).toBe("https://ketomentor.norbapp.com");
    expect(preferredWebOrigin("https://keto-mentor-web.onrender.com")).toBe("https://keto-mentor-web.onrender.com");
    expect(preferredWebOrigin("")).toBe("http://localhost:5173");
  });
});
