import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import { adminRouter } from "./admin-router.js";
import { adminEmailList, emailVerificationRouter, isAdminUser, sendVerification } from "./email-verification.js";
import { DEFAULT_SETTINGS, getSettings, loadSettings, refreshPremiumUsers, resetSettingsForTests, setPremiumUsersForTests, setSettings, userFallbackWindows } from "./runtime-settings.js";
import { clearPendingUsageForTests, countUsage, flushUsage, pendingUsageForTests, usageMiddleware } from "./usage-counters.js";
import { UserUsageBudget } from "../catalog/usage-budget.js";

const servers: any[] = [];
afterEach(() => { for (const s of servers.splice(0)) s.close(); resetSettingsForTests(); clearPendingUsageForTests(); });

function listen(app: express.Express) {
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(error?.name === "ZodError" ? 400 : 500).json({ error: String(error?.message ?? error) }));
  const server = app.listen(0); servers.push(server);
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
const call = (base: string, method: string, path: string, user?: string, body?: unknown) =>
  fetch(`${base}${path}`, { method, headers: { "content-type": "application/json", ...(user ? { authorization: `Bearer ${user}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });

function fakeDb() {
  const users: any[] = [
    { id: "admin", username: "norbi-admin", email: "norbert@norbapp.com", emailVerifiedAt: new Date("2026-10-15"), locale: "hu", createdAt: new Date("2026-10-15"), _count: { meals: 0, recipes: 0 } },
    { id: "fake", username: "impostor", email: "norbert@norbapp.com ", emailVerifiedAt: null, locale: "hu", createdAt: new Date("2026-10-15"), _count: { meals: 0, recipes: 0 } },
    { id: "u1", username: "anna", email: "anna@example.com", emailVerifiedAt: null, locale: "de", createdAt: new Date("2026-10-14"), _count: { meals: 3, recipes: 1 } },
    { id: "u2", username: "bela", email: null, emailVerifiedAt: null, locale: "hu", createdAt: new Date("2026-10-10"), _count: { meals: 0, recipes: 0 } }
  ];
  const feedback: any[] = [{ id: "dc9bcf", status: "open", message: "tojás", createdAt: new Date() }, { id: "6c6ae5", status: "done", message: "virsli", createdAt: new Date() }];
  const settingsRows: any[] = [];
  const prisma: any = {
    user: {
      findUnique: async ({ where }: any) => users.find((u) => u.id === where.id) ?? null,
      findMany: async () => users.filter((u) => u.username !== "system:keto-mentor"),
      count: async () => users.length
    },
    feedback: {
      findMany: async ({ where }: any) => feedback.filter((f) => !where.status || f.status === where.status),
      update: async ({ where, data }: any) => { const f = feedback.find((x) => x.id === where.id); if (!f) throw Object.assign(new Error("x"), { code: "P2025" }); Object.assign(f, data); return f; },
      count: async () => feedback.length
    },
    meal: { count: async () => 0, groupBy: async (args: any) => (args._count ? users.map((u) => ({ userId: u.id, _count: { _all: u._count.meals } })) : []), findMany: async () => [] },
    recipe: { count: async () => 0 },
    usageDaily: { findMany: async () => [{ day: new Date("2026-10-15"), kind: "search", count: 5, totalMs: 1000n, promptTokens: 0n, completionTokens: 0n }] },
    appSetting: { findMany: async () => settingsRows, upsert: async ({ where, create, update }: any) => { const r = settingsRows.find((x) => x.key === where.key); if (r) r.value = update.value; else settingsRows.push({ ...create }); } },
    $executeRaw: async () => 1
  };
  return { prisma, users, feedback, settingsRows };
}

function startAdmin() {
  const db = fakeDb();
  const lines: string[] = [];
  const deleted: string[] = [];
  const resets: string[] = [];
  const app = express();
  app.use(express.json());
  const requireAuth: express.RequestHandler = (req, res, next) => { const id = req.header("authorization")?.slice(7); if (!id) return res.status(401).end(); (req as any).user = { id }; next(); };
  app.use(adminRouter({
    prisma: db.prisma, requireAuth, admins: adminEmailList(undefined), systemUsername: "system:keto-mentor",
    deleteAccount: async (id) => { deleted.push(id); return 0; },
    sendPasswordReset: async (u) => { resets.push(u.email); return "sent"; },
    log: (l) => lines.push(l)
  }));
  return { ...db, lines, deleted, resets, base: listen(app) };
}

describe("admin access", () => {
  it("needs a session and a confirmed admin address", async () => {
    const t = startAdmin();
    expect((await call(t.base, "GET", "/admin/settings")).status).toBe(401);
    expect((await call(t.base, "GET", "/admin/settings", "u1")).status).toBe(403);
    expect((await call(t.base, "GET", "/admin/settings", "fake")).status).toBe(403); // same address, not confirmed
    expect((await call(t.base, "GET", "/admin/settings", "admin")).status).toBe(200);
  });

  it("knows who is admin", () => {
    expect(adminEmailList(undefined)).toEqual(["norbert@norbapp.com"]);
    expect(adminEmailList(" A@b.c, x@y.z ")).toEqual(["a@b.c", "x@y.z"]);
    expect(isAdminUser({ email: "Norbert@norbapp.com", emailVerifiedAt: new Date() }, ["norbert@norbapp.com"])).toBe(true);
    expect(isAdminUser({ email: "norbert@norbapp.com", emailVerifiedAt: null }, ["norbert@norbapp.com"])).toBe(false);
  });
});

describe("admin features", () => {
  it("returns the overview with usage totals", async () => {
    const t = startAdmin();
    const body = await (await call(t.base, "GET", "/admin/overview", "admin")).json();
    expect(body.users.total).toBe(4);
    expect(body.feedback.total).toBe(2);
    expect(body.usageTotals.search).toEqual({ count: 5, avgMs: 200, promptTokens: 0, completionTokens: 0 });
    expect(body.perDay["2026-10-15"].search).toBe(5);
  });

  it("lists open tickets and closes one with a note", async () => {
    const t = startAdmin();
    expect((await (await call(t.base, "GET", "/admin/feedback", "admin")).json()).items.map((i: any) => i.id)).toEqual(["dc9bcf"]);
    const res = await call(t.base, "PATCH", "/admin/feedback/dc9bcf", "admin", { status: "done", adminNote: "javítva" });
    expect(res.status).toBe(200);
    expect(t.feedback[0]).toMatchObject({ status: "done", adminNote: "javítva" });
    expect((await call(t.base, "PATCH", "/admin/feedback/nope", "admin", { status: "done" })).status).toBe(404);
    expect(t.lines).toContain("admin_action action=feedback_update id=dc9bcf status=done");
  });

  it("lists users, deletes others but never itself, sends reset links", async () => {
    const t = startAdmin();
    const users = (await (await call(t.base, "GET", "/admin/users", "admin")).json()).users;
    expect(users.find((u: any) => u.id === "admin").isAdmin).toBe(true);
    expect(users.find((u: any) => u.id === "u1")).toMatchObject({ meals: 3, recipes: 1, emailVerified: false, isAdmin: false });
    const top = (await (await call(t.base, "GET", "/admin/top-testers", "admin")).json()).testers;
    expect(top.some((u: any) => u.id === "admin")).toBe(false);
    expect(top[0]).toMatchObject({ rank: 1, id: "u1", meals: 3 });
    expect((await call(t.base, "DELETE", "/admin/users/admin", "admin")).status).toBe(400);
    expect((await call(t.base, "DELETE", "/admin/users/u1", "admin")).status).toBe(204);
    expect(t.deleted).toEqual(["u1"]);
    expect((await call(t.base, "POST", "/admin/users/u2/password-reset", "admin")).status).toBe(400);
    expect(await (await call(t.base, "POST", "/admin/users/u1/password-reset", "admin")).json()).toEqual({ outcome: "sent" });
    expect(t.resets).toEqual(["anna@example.com"]);
  });

  it("saves settings, applies them at once and reloads them after a restart", async () => {
    const t = startAdmin();
    const next = { registrationOpen: false, announcement: { enabled: true, hu: "Karbantartás 20-kor", de: "Wartung um 20 Uhr", en: "Maintenance at 8 pm" }, aiLimits: { perHour: 5, perDay: 20, perRecipe: 3, premiumPerHour: 50, premiumPerDay: 150 }, premiumAccess: "premium_only" as const, reminderDailyCap: 50 };
    expect((await call(t.base, "PUT", "/admin/settings", "admin", next)).status).toBe(200);
    expect(getSettings()).toEqual(next);
    expect(userFallbackWindows().map((w) => w.limit)).toEqual([5, 20]);
    expect((await call(t.base, "PUT", "/admin/settings", "admin", { ...next, aiLimits: { perHour: -1, perDay: 1, perRecipe: 1 } })).status).toBe(400);
    resetSettingsForTests();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
    await loadSettings(t.prisma);
    expect(getSettings()).toEqual(next);
  });

  it("a dynamic budget follows the admin limits immediately", () => {
    const budget = new UserUsageBudget(userFallbackWindows);
    resetSettingsForTests();
    // Beta: everyone gets the premium allowance (60/hour by default).
    for (let i = 0; i < 60; i++) expect(budget.consume("u")).toBe(true);
    expect(budget.consume("u")).toBe(false);
  });

  it("premium users get the larger AI allowance once premium is closed", () => {
    resetSettingsForTests();
    setSettings({ ...getSettings(), premiumAccess: "premium_only" });
    setPremiumUsersForTests(["vip"]);
    const budget = new UserUsageBudget(userFallbackWindows);
    for (let i = 0; i < 30; i++) expect(budget.consume("free")).toBe(true);
    expect(budget.consume("free")).toBe(false);
    for (let i = 0; i < 60; i++) expect(budget.consume("vip")).toBe(true);
    expect(budget.consume("vip")).toBe(false);
    setPremiumUsersForTests([]);
    resetSettingsForTests();
  });

  it("reads premium users from active, unexpired entitlements", async () => {
    let where: any;
    await refreshPremiumUsers({ entitlement: { findMany: async (args: any) => { where = args.where; return [{ userId: "vip" }]; } } }, new Date("2026-10-16T00:00:00Z"));
    expect(where.active).toBe(true);
    resetSettingsForTests();
    setSettings({ ...getSettings(), premiumAccess: "premium_only" });
    expect(userFallbackWindows("vip").map((w) => w.limit)).toEqual([60, 200]);
    expect(userFallbackWindows("other").map((w) => w.limit)).toEqual([30, 100]);
    setPremiumUsersForTests([]);
    resetSettingsForTests();
  });
});

describe("e-mail confirmation", () => {
  function startVerify() {
    const tokens: any[] = [];
    const users: any[] = [{ id: "u1", email: "anna@example.com", emailVerifiedAt: null, locale: "de" }];
    const sent: any[] = [];
    const match = (row: any, where: any) => Object.entries(where).every(([k, v]: [string, any]) => v && typeof v === "object" && "gt" in v ? row[k] > v.gt : row[k] === v);
    const prisma: any = {
      user: { findUnique: async ({ where }: any) => users.find((u) => u.id === where.id) ?? null, update: async ({ where, data }: any) => Object.assign(users.find((u) => u.id === where.id), data) },
      emailVerificationToken: {
        findFirst: async ({ where }: any) => tokens.find((t) => match(t, where)) ?? null,
        findUnique: async ({ where }: any) => tokens.find((t) => t.tokenHash === where.tokenHash) ?? null,
        create: async ({ data }: any) => { const r = { createdAt: new Date(), usedAt: null, ...data }; tokens.push(r); return r; },
        updateMany: async ({ where, data }: any) => { tokens.filter((t) => match(t, where)).forEach((t) => Object.assign(t, data)); return {}; }
      },
      $transaction: async (ops: any[]) => Promise.all(ops)
    };
    const deps = { prisma, webAppUrl: "https://app.example", mailer: { send: async (m: any) => { sent.push(m); return { outcome: "sent" as const }; } }, log: () => undefined };
    const app = express(); app.use(express.json());
    app.use(emailVerificationRouter({ ...deps, requireAuth: (req, _res, next) => { (req as any).user = { id: "u1" }; next(); } }));
    return { deps, users, tokens, sent, base: listen(app) };
  }

  it("mails a link that confirms the address once, and only for the address it was sent to", async () => {
    const t = startVerify();
    expect(await sendVerification(t.deps, "u1")).toBe("sent");
    expect(t.sent[0]).toMatchObject({ to: "anna@example.com", subject: "Keto Mentor by NorbApp – E-Mail-Adresse bestätigen" });
    expect(await sendVerification(t.deps, "u1")).toBe("cooldown");
    const token = /#verify=([A-Za-z0-9_-]+)/.exec(t.sent[0].text)![1];
    expect(JSON.stringify(t.tokens)).not.toContain(token);
    t.users[0].email = "other@example.com";
    expect((await call(t.base, "POST", "/auth/verify-email", undefined, { token })).status).toBe(400);
    t.users[0].email = "anna@example.com";
    expect((await call(t.base, "POST", "/auth/verify-email", undefined, { token })).status).toBe(200);
    expect(t.users[0].emailVerifiedAt).toBeInstanceOf(Date);
    expect((await call(t.base, "POST", "/auth/verify-email", undefined, { token })).status).toBe(400);
    expect(await sendVerification(t.deps, "u1")).toBe("already");
  });
});

describe("usage counters", () => {
  it("counts tracked requests and errors without user data, then flushes", async () => {
    const mw = usageMiddleware();
    const fire = (method: string, path: string, statusCode: number) => {
      let finish = () => {};
      mw({ method, path }, { statusCode, on: (_e, cb) => { finish = cb; } }, () => {});
      finish();
    };
    fire("GET", "/search", 200); fire("GET", "/search", 200); fire("POST", "/meal-input/interpret", 500); fire("GET", "/me", 200);
    countUsage("ai:food_nlp", { ms: 1500, promptTokens: 1000, completionTokens: 100 });
    countUsage("bad kind!");
    const day = new Date().toISOString().slice(0, 10);
    const pending = pendingUsageForTests();
    expect(pending.get(`${day}|search`)?.count).toBe(2);
    expect(pending.get(`${day}|interpret:error`)?.count).toBe(1);
    expect(pending.get(`${day}|http_5xx`)?.count).toBe(1);
    expect(pending.get(`${day}|ai:food_nlp`)).toEqual({ count: 1, totalMs: 1500, promptTokens: 1000, completionTokens: 100 });
    expect([...pending.keys()].some((k) => k.includes("/me") || k.includes("bad"))).toBe(false);
    const sql: any[] = [];
    await flushUsage({ $executeRaw: async (q: any) => { sql.push(q); return 1; } });
    expect(sql).toHaveLength(4);
    expect(pendingUsageForTests().size).toBe(0);
  });

  it("keeps the counts for the next flush when the database write fails", async () => {
    countUsage("search");
    await flushUsage({ $executeRaw: async () => { throw new Error("db down"); } });
    expect([...pendingUsageForTests().values()][0].count).toBe(1);
  });
});
