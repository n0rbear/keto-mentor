import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { clearPendingUsageForTests, pendingUsageCount } from "../admin/usage-counters.js";
import { campaignAdminRoutes, campaignPublicRouter, countCampaign, slug } from "./campaign-links.js";

function fakeDb() {
  const settings = new Map<string, unknown>();
  return {
    settings,
    appSetting: {
      findUnique: async ({ where }: any) => (settings.has(where.key) ? { key: where.key, value: settings.get(where.key) } : null),
      upsert: async ({ where, create }: any) => { settings.set(where.key, create.value); }
    },
    usageDaily: { findMany: async () => [{ day: new Date("2026-10-10"), kind: "ref_visit:tiktok", count: 7 }, { day: new Date("2026-08-01"), kind: "ref_visit:tiktok", count: 3 }, { day: new Date("2026-10-11"), kind: "ref_signup:tiktok", count: 2 }] }
  };
}
async function serve(db: any) {
  const app = express(); app.use(express.json());
  const admin = express.Router(); campaignAdminRoutes(admin, { prisma: db, now: () => new Date("2026-10-16T10:00:00Z") });
  app.use(admin); app.use(campaignPublicRouter({ prisma: db }));
  const server = app.listen(0); const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const call = (method: string, path: string, body?: unknown) => fetch(base + path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { call, close: () => server.close() };
}
afterEach(() => clearPendingUsageForTests());

describe("kampánylinkek", () => {
  it("creates the starting links once, then shows visits and registrations per link", async () => {
    const db = fakeDb(); const t = await serve(db);
    const first = await (await t.call("GET", "/admin/campaign-links")).json();
    expect(first.links.map((l: any) => l.code)).toContain("tiktok");
    const tiktok = first.links.find((l: any) => l.code === "tiktok");
    expect(tiktok.visits).toEqual({ total: 10, last30: 7 });
    expect(tiktok.signups).toEqual({ total: 2, last30: 2 });
    // Deleting every link does not bring the starting set back.
    for (const l of first.links) expect((await t.call("DELETE", `/admin/campaign-links/${l.code}`)).status).toBe(204);
    expect((await (await t.call("GET", "/admin/campaign-links")).json()).links).toEqual([]);
    t.close();
  });

  it("adds a link with a code made from its name and refuses duplicates", async () => {
    const db = fakeDb(); const t = await serve(db);
    const res = await t.call("POST", "/admin/campaign-links", { label: "Keto Magyarország csoport" });
    expect(res.status).toBe(201);
    expect((await res.json()).link.code).toBe("keto-magyarorszag-csoport");
    expect((await t.call("POST", "/admin/campaign-links", { label: "x", code: "keto-magyarorszag-csoport" })).status).toBe(409);
    expect((await t.call("POST", "/admin/campaign-links", { label: "x", code: "Rossz Kód!" })).status).toBe(400);
    expect(slug("Ősz – TikTok #2")).toBe("osz-tiktok-2");
    t.close();
  });

  it("counts visits and sign-ups only for known codes", async () => {
    const db = fakeDb(); const t = await serve(db);
    await t.call("GET", "/admin/campaign-links");
    expect((await t.call("POST", "/public/ref", { code: "tiktok" })).status).toBe(204);
    await t.call("POST", "/public/ref", { code: "ismeretlen" });
    await t.call("POST", "/public/ref", { code: "<script>" });
    expect(pendingUsageCount("ref_visit:tiktok")).toBe(1);
    expect(pendingUsageCount("ref_visit:ismeretlen")).toBe(0);
    expect(await countCampaign(db, "signup", "tiktok")).toBe(true);
    expect(await countCampaign(db, "signup", 42)).toBe(false);
    expect(pendingUsageCount("ref_signup:tiktok")).toBe(1);
    t.close();
  });
});
