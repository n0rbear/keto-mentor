import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import { platesRouter } from "./plates.js";
import { estimatePlatePortion, dishProfileFromProvenance } from "./plate-portion.js";

function fakePrisma(initialPlates: any[] = [], recipes: any[] = []) {
  const plates = [...initialPlates];
  const pick = (p: any) => ({ id: p.id, name: p.name, kind: p.kind, capacityMl: p.capacityMl ?? null, diameterMm: p.diameterMm ?? null });
  return {
    plates,
    prisma: {
      userPlate: {
        findMany: async ({ where }: any) => plates.filter((p) => p.userId === where.userId).map(pick),
        findFirst: async ({ where }: any) => { const p = plates.find((x) => x.id === where.id && x.userId === where.userId); return p ? pick(p) : null; },
        count: async ({ where }: any) => plates.filter((p) => p.userId === where.userId).length,
        create: async ({ data }: any) => { const p = { id: `plate-${plates.length + 1}`, ...data }; plates.push(p); return pick(p); },
        updateMany: async ({ where, data }: any) => { const p = plates.find((x) => x.id === where.id && x.userId === where.userId); if (p) Object.assign(p, data); return { count: p ? 1 : 0 }; },
        deleteMany: async ({ where }: any) => { const i = plates.findIndex((p) => p.id === where.id && p.userId === where.userId); if (i >= 0) plates.splice(i, 1); return { count: i >= 0 ? 1 : 0 }; }
      },
      recipe: {
        findFirst: async ({ where }: any) => recipes.find((r) => r.id === where.id && (r.userId === where.OR[0].userId || r.visibility === "public")) ?? null
      }
    } as any
  };
}

const servers: any[] = [];
afterEach(() => { for (const s of servers.splice(0)) s.close(); });

async function start(prisma: any) {
  const app = express();
  const requireAuth: express.RequestHandler = (req, _res, next) => { (req as any).user = { id: "user-1" }; next(); };
  app.use(platesRouter(prisma, requireAuth));
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(error.status ?? 400).json({ error: error.publicCode ?? "validation_error" }));
  const server = app.listen(0);
  servers.push(server);
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
const json = (method: string, body: unknown) => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const referenceLecso = { kind: "reference_dish", densityGPerMl: 0.991, parts: [{ part: "lecso_virslivel", grams: 400, densityGPerMl: 0.991, flatPlate: { coverage: 0.75, height_cm: 1.6 } }] };

describe("plate portion math", () => {
  it("deep plate: capacity x fill x density", () => {
    expect(estimatePlatePortion({ kind: "deep", capacityMl: 650 }, "normal", { densityGPerMl: 1.022 })).toEqual({ grams: 498, densityGPerMl: 1.022, basis: "reference" });
    expect(estimatePlatePortion({ kind: "deep", capacityMl: 450 }, "half", null)).toMatchObject({ grams: 225, basis: "default" });
  });

  it("flat plate: the owner's real 17 cm plate holds far less than a 26 cm one", () => {
    const profile = dishProfileFromProvenance(referenceLecso);
    const at26 = estimatePlatePortion({ kind: "flat", diameterMm: 260 }, "normal", profile).grams;
    const at17 = estimatePlatePortion({ kind: "flat", diameterMm: 170 }, "normal", profile).grams;
    expect(at26).toBe(404);
    expect(Math.abs(at17 - 404 * (17 / 26) ** 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(estimatePlatePortion({ kind: "flat", diameterMm: 260 }, "heaped", profile).grams - at26 * 1.35)).toBeLessThanOrEqual(1);
  });

  it("an unknown dish uses the stated defaults, never a reference profile it does not have", () => {
    expect(dishProfileFromProvenance({ forkedFromRecipeId: "x" })).toBeNull();
    expect(estimatePlatePortion({ kind: "flat", diameterMm: 260 }, "normal", null)).toMatchObject({ grams: 340, basis: "default" });
  });
});

describe("saját tányérok API", () => {
  it("saves a deep plate by capacity and a flat plate by diameter; lists only the user's own", async () => {
    const { prisma, plates } = fakePrisma([{ id: "other", userId: "user-2", name: "x", kind: "flat", diameterMm: 250 }]);
    const base = await start(prisma);
    expect((await fetch(`${base}/me/plates`, json("POST", { kind: "deep", name: "Mély tányér", capacityMl: 650 }))).status).toBe(201);
    expect((await fetch(`${base}/me/plates`, json("POST", { kind: "flat", name: "Kis lapos", diameterMm: 170 }))).status).toBe(201);
    expect((await fetch(`${base}/me/plates`, json("POST", { kind: "deep", name: "Rossz", diameterMm: 170 }))).status).toBe(400);
    const listed = (await (await fetch(`${base}/me/plates`)).json()).plates;
    expect(listed.map((p: any) => [p.name, p.kind, p.capacityMl, p.diameterMm])).toEqual([["Mély tányér", "deep", 650, null], ["Kis lapos", "flat", null, 170]]);
    expect(plates).toHaveLength(3);
  });

  it("estimates grams for a visible reference recipe; another user's plate is not usable", async () => {
    const { prisma } = fakePrisma(
      [{ id: "p1", userId: "user-1", name: "Mély", kind: "deep", capacityMl: 650 }, { id: "p2", userId: "user-2", name: "x", kind: "deep", capacityMl: 650 }],
      [{ id: "r1", userId: "system", visibility: "public", provenance: { ...referenceLecso, densityGPerMl: 1.022 } }]
    );
    const base = await start(prisma);
    expect(await (await fetch(`${base}/me/plates/p1/portion`, json("POST", { recipeId: "r1", fill: "normal" }))).json()).toEqual({ grams: 498, densityGPerMl: 1.022, basis: "reference" });
    expect((await fetch(`${base}/me/plates/p2/portion`, json("POST", { fill: "normal" }))).status).toBe(404);
    expect((await fetch(`${base}/me/plates/p1/portion`, json("POST", { fill: "heaped" }))).status).toBe(400);
  });

  it("edits and deletes only the user's own plates", async () => {
    const { prisma, plates } = fakePrisma([{ id: "p1", userId: "user-1", name: "Régi", kind: "flat", diameterMm: 260 }, { id: "p2", userId: "user-2", name: "B", kind: "flat", diameterMm: 250 }]);
    const base = await start(prisma);
    expect((await (await fetch(`${base}/me/plates/p1`, json("PUT", { kind: "flat", name: "Kis lapos", diameterMm: 170 }))).json()).plate).toMatchObject({ name: "Kis lapos", diameterMm: 170 });
    expect((await fetch(`${base}/me/plates/p2`, json("PUT", { kind: "flat", name: "x", diameterMm: 170 }))).status).toBe(404);
    await fetch(`${base}/me/plates/p2`, { method: "DELETE" });
    expect(plates).toHaveLength(2);
    await fetch(`${base}/me/plates/p1`, { method: "DELETE" });
    expect(plates.map((p) => p.id)).toEqual(["p2"]);
  });
});
