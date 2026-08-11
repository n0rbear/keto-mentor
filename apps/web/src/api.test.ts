import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

afterEach(() => vi.restoreAllMocks());

describe("api client", () => {
  it("returns JSON responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })));
    await expect(api<{ ok: boolean }>("/health")).resolves.toEqual({ ok: true });
  });

  it("preserves server error codes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "food_not_found" }), { status: 404, headers: { "Content-Type": "application/json" } })));
    await expect(api("/meals")).rejects.toMatchObject({ code: "food_not_found", status: 404 });
  });

  it("distinguishes network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api("/meals")).rejects.toMatchObject({ code: "network_error" });
  });
});
