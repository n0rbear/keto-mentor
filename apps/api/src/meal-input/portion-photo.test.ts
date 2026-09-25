import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import { portionPhotoRouter } from "./portion-photo.js";
import { OpenAiPortionVisionProvider, portionInstruction, type PortionEstimateOutput, type PortionVisionProvider } from "../ai/portion-vision-provider.js";

function fakePrisma(initialPlates: any[] = []) {
  const plates = [...initialPlates];
  return {
    plates,
    prisma: {
      userPlate: {
        findMany: async ({ where }: any) => plates.filter((p) => p.userId === where.userId),
        findFirst: async ({ where }: any) => plates.find((p) => p.id === where.id && p.userId === where.userId) ?? null,
        count: async ({ where }: any) => plates.filter((p) => p.userId === where.userId).length,
        create: async ({ data }: any) => { const plate = { id: `plate-${plates.length + 1}`, ...data }; plates.push(plate); return { id: plate.id, name: plate.name, diameterMm: plate.diameterMm }; },
        deleteMany: async ({ where }: any) => { const i = plates.findIndex((p) => p.id === where.id && p.userId === where.userId); if (i >= 0) plates.splice(i, 1); return { count: i >= 0 ? 1 : 0 }; }
      }
    } as any
  };
}

const servers: any[] = [];
afterEach(() => { for (const s of servers.splice(0)) s.close(); });

async function start(prisma: any, provider: PortionVisionProvider) {
  const app = express();
  const requireAuth: express.RequestHandler = (req, _res, next) => { (req as any).user = { id: "user-1", locale: "hu" }; next(); };
  app.use(portionPhotoRouter(prisma, provider, requireAuth));
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(error.status ?? 400).json({ error: error.publicCode ?? "validation_error" }));
  const server = app.listen(0);
  servers.push(server);
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

const image = Buffer.from("fake-jpeg");
const post = (base: string, query: string) => fetch(`${base}/meal-input/portion-photo?${query}`, { method: "POST", headers: { "content-type": "image/jpeg" }, body: image });

function provider(output: Partial<PortionEstimateOutput>, seen: any[] = []): PortionVisionProvider {
  return { id: "fixture", estimate: async (input) => { seen.push(input); return { referenceFound: true, plateFound: true, plateDiameterMm: null, grams: 420, confidence: 0.6, notes: "", ...output }; } };
}

describe("plate-photo portion estimation", () => {
  it("coin reference, first home photo: estimates grams and remembers the user's plate", async () => {
    const { prisma, plates } = fakePrisma();
    const seen: any[] = [];
    const base = await start(prisma, provider({ grams: 420.4, plateDiameterMm: 262 }, seen));
    const res = await post(base, "dish=h%C3%BAsos%20k%C3%A1poszta&reference=coin&coin=huf100&savePlate=1&plateName=M%C3%A9ly%20t%C3%A1ny%C3%A9r");
    const body = await res.json();
    expect(body).toMatchObject({ status: "estimated", grams: 420, savedPlate: { name: "Mély tányér", diameterMm: 262 } });
    expect(seen[0]).toMatchObject({ dish: "húsos káposzta", reference: { kind: "coin", coin: "huf100" }, measurePlate: true });
    expect(plates).toHaveLength(1);
  });

  it("later home photo uses the saved plate as scale, no coin needed", async () => {
    const { prisma } = fakePrisma([{ id: "p1", userId: "user-1", name: "Mély tányér", diameterMm: 262 }]);
    const seen: any[] = [];
    const base = await start(prisma, provider({}, seen));
    const body = await (await post(base, "dish=gul%C3%A1s&reference=plate&plateId=p1")).json();
    expect(body).toMatchObject({ status: "estimated", grams: 420, savedPlate: null });
    expect(seen[0]).toMatchObject({ reference: { kind: "plate", diameterMm: 262 }, measurePlate: false });
  });

  it("restaurant/guest photo with a coin never saves the plate", async () => {
    const { prisma, plates } = fakePrisma();
    const base = await start(prisma, provider({ plateDiameterMm: 300 }));
    await post(base, "dish=pizza&reference=coin&coin=eur1");
    expect(plates).toHaveLength(0);
  });

  it("another user's plate cannot be used, and a missing reference is reported instead of guessed", async () => {
    const { prisma } = fakePrisma([{ id: "p2", userId: "user-2", name: "x", diameterMm: 250 }]);
    const base = await start(prisma, provider({ referenceFound: false, grams: null }));
    expect((await post(base, "dish=leves&reference=plate&plateId=p2")).status).toBe(404);
    expect(await (await post(base, "dish=leves&reference=coin&coin=eur1")).json()).toMatchObject({ status: "reference_not_found" });
  });

  it("an absurd plate diameter or portion is not trusted", async () => {
    const { prisma, plates } = fakePrisma();
    const base = await start(prisma, provider({ grams: 9000, plateDiameterMm: 900 }));
    const body = await (await post(base, "dish=leves&reference=coin&coin=eur1&savePlate=1")).json();
    expect(body).toMatchObject({ status: "food_not_measurable", savedPlate: null });
    expect(plates).toHaveLength(0);
  });

  it("lists and deletes only the user's own plates", async () => {
    const { prisma, plates } = fakePrisma([{ id: "p1", userId: "user-1", name: "A", diameterMm: 260 }, { id: "p2", userId: "user-2", name: "B", diameterMm: 250 }]);
    const base = await start(prisma, provider({}));
    expect((await (await fetch(`${base}/me/plates`)).json()).plates.map((p: any) => p.id)).toEqual(["p1"]);
    await fetch(`${base}/me/plates/p2`, { method: "DELETE" });
    expect(plates).toHaveLength(2);
    await fetch(`${base}/me/plates/p1`, { method: "DELETE" });
    expect(plates.map((p) => p.id)).toEqual(["p2"]);
  });
});

describe("OpenAiPortionVisionProvider", () => {
  it("sends the image inline with the coin scale and parses the JSON answer; never leaks the key into the body", async () => {
    let body: any;
    const fetchImpl = vi.fn(async (_url: string, init: any) => {
      body = JSON.parse(init.body);
      expect(init.headers.authorization).toBe("Bearer sk-test");
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ referenceFound: true, plateFound: true, plateDiameterMm: 260, grams: 380, confidence: 0.5, notes: "ok" }) } }] }), { status: 200 });
    });
    const p = new OpenAiPortionVisionProvider({ apiKey: "sk-test", fetchImpl: fetchImpl as any });
    const out = await p.estimate({ image: Buffer.from("img"), mimeType: "image/jpeg", dish: "gulyás", reference: { kind: "coin", coin: "eur1" }, measurePlate: true });
    expect(out.grams).toBe(380);
    expect(JSON.stringify(body)).not.toContain("sk-test");
    expect(body.messages[0].content).toContain("23.25 mm");
    expect(body.messages[1].content[0].image_url.url).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("the instruction uses the saved plate diameter when no coin is used", () => {
    expect(portionInstruction({ dish: "x", reference: { kind: "plate", diameterMm: 262 }, measurePlate: false })).toContain("262 mm");
  });
});
