import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, type ApiState } from "./api";

afterEach(() => vi.restoreAllMocks());

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("api() automatic token refresh on 401", () => {
  it("calls /auth/refresh once and retries the original request with the new token", async () => {
    const setToken = vi.fn();
    const state = { token: "expired", setToken };
    const calls: string[] = [];
    let refreshCount = 0;
    let apiCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init: any) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        refreshCount += 1;
        return jsonResponse(200, { accessToken: "fresh" });
      }
      if (url.endsWith("/me")) {
        apiCount += 1;
        calls.push(init.headers?.Authorization);
        return apiCount === 1 ? jsonResponse(401, { error: "invalid_token" }) : jsonResponse(200, { user: { id: "u1" } });
      }
      return jsonResponse(404, { error: "not_found" });
    });

    const result = await api<{ user: { id: string } }>("/me", {}, state as ApiState);

    expect(refreshCount).toBe(1);
    expect(apiCount).toBe(2);
    expect(calls[0]).toBe("Bearer expired");
    expect(calls[1]).toBe("Bearer fresh");
    expect(setToken).toHaveBeenCalledWith("fresh");
    expect(result.user.id).toBe("u1");
  });

  it("does not retry without an existing token", async () => {
    const setToken = vi.fn();
    const state = { token: null, setToken };
    const apiCount = { value: 0 };
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any) => {
      if (String(input).endsWith("/me")) apiCount.value += 1;
      return jsonResponse(401, { error: "invalid_token" });
    });

    await expect(api("/me", {}, state as ApiState)).rejects.toBeInstanceOf(ApiError);
    expect(apiCount.value).toBe(1);
    expect(setToken).not.toHaveBeenCalled();
  });

  it("clears the token and throws when refresh fails", async () => {
    const setToken = vi.fn();
    const state = { token: "expired", setToken };
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any) => {
      if (String(input).endsWith("/auth/refresh")) return jsonResponse(401, { error: "invalid_token" });
      return jsonResponse(401, { error: "invalid_token" });
    });

    await expect(api("/me", {}, state as ApiState)).rejects.toBeInstanceOf(ApiError);
    expect(setToken).toHaveBeenCalledWith(null);
  });
});