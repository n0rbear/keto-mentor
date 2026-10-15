import { describe, expect, it, vi } from "vitest";
import { forbidAdminAccountWrites } from "./admin-only-account.js";

const admins = ["norbert@norbapp.com"];
function run(method: string, user: any) {
  const prisma = { user: { findUnique: vi.fn(async () => user) } };
  const res: any = { status: vi.fn(() => res), json: vi.fn(() => res) };
  const next = vi.fn();
  return forbidAdminAccountWrites({ prisma, admins })({ method, user: { id: "u1" } } as any, res, next).then(() => ({ res, next }));
}

describe("admin account is admin-only", () => {
  it("refuses a write from the confirmed admin account", async () => {
    const { res, next } = await run("POST", { email: "Norbert@norbapp.com", emailVerifiedAt: new Date() });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "admin_account_no_logging" });
    expect(next).not.toHaveBeenCalled();
  });
  it("lets everyone else write, and an unconfirmed admin address too", async () => {
    expect((await run("POST", { email: "a@b.c", emailVerifiedAt: new Date() })).next).toHaveBeenCalledWith();
    expect((await run("PATCH", { email: "norbert@norbapp.com", emailVerifiedAt: null })).next).toHaveBeenCalledWith();
  });
  it("never blocks reads", async () => {
    expect((await run("GET", { email: "norbert@norbapp.com", emailVerifiedAt: new Date() })).next).toHaveBeenCalledWith();
  });
});
