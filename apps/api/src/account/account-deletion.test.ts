import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import { accountDeletionRouter } from "./account-deletion.js";

const servers: any[] = [];
afterEach(() => { for (const s of servers.splice(0)) s.close(); });

async function start(withSystem = true) {
  const calls: any[] = [];
  const lines: string[] = [];
  const users: Record<string, any> = { u1: { id: "u1", passwordHash: "hash:pw" }, ...(withSystem ? { sys: { id: "sys" } } : {}) };
  const tx = {
    user: {
      findUnique: async ({ where }: any) => where.username ? (withSystem && where.username === "system:keto-mentor" ? users.sys : null) : users[where.id] ?? null,
      delete: async (args: any) => { calls.push(["user.delete", args]); delete users[args.where.id]; }
    },
    recipe: { updateMany: async (args: any) => { calls.push(["recipe.updateMany", args]); return { count: 2 }; } },
    food: { deleteMany: async (args: any) => { calls.push(["food.deleteMany", args]); return { count: 3 }; } }
  };
  const prisma = { ...tx, $transaction: async (fn: any) => fn(tx) };
  const app = express();
  app.use(express.json());
  const requireAuth: express.RequestHandler = (req, res, next) => { if (!req.header("authorization")) return res.status(401).end(); (req as any).user = { id: "u1" }; next(); };
  app.use(accountDeletionRouter({ prisma: prisma as any, requireAuth, verifyPassword: async (h, p) => h === `hash:${p}`, systemUsername: "system:keto-mentor", log: (l) => lines.push(l) }));
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(error?.name === "ZodError" ? 400 : 500).end());
  const server = app.listen(0); servers.push(server);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const del = (body: unknown, auth = true) => fetch(`${base}/me`, { method: "DELETE", headers: { "content-type": "application/json", ...(auth ? { authorization: "Bearer t" } : {}) }, body: JSON.stringify(body) });
  return { calls, lines, users, del };
}

describe("DELETE /me (account deletion)", () => {
  it("needs a session and the current password", async () => {
    const t = await start();
    expect((await t.del({ currentPassword: "pw" }, false)).status).toBe(401);
    expect((await t.del({ currentPassword: "wrong" })).status).toBe(401);
    expect((await t.del({})).status).toBe(400);
    expect(t.calls).toHaveLength(0);
  });

  it("hands shared public recipes to the system account, deletes the user and its unreferenced private foods", async () => {
    const t = await start();
    const res = await t.del({ currentPassword: "pw" });
    expect(res.status).toBe(204);
    expect(t.calls.map(([name]) => name)).toEqual(["recipe.updateMany", "user.delete", "food.deleteMany"]);
    expect(t.calls[0][1]).toEqual({ where: { userId: "u1", mealItems: { some: { meal: { userId: { not: "u1" } } } } }, data: { userId: "sys" } });
    expect(t.calls[2][1]).toEqual({ where: { createdById: "u1", mealItems: { none: {} }, recipeIngredients: { none: {} } } });
    expect(t.users.u1).toBeUndefined();
    expect(t.lines).toEqual(["account_deleted shared_recipes_kept=2"]);
  });

  it("still deletes when there is no system account", async () => {
    const t = await start(false);
    expect((await t.del({ currentPassword: "pw" })).status).toBe(204);
    expect(t.calls.map(([name]) => name)).toEqual(["user.delete", "food.deleteMany"]);
  });
});
