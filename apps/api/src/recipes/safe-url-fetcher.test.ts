import { describe, expect, it, vi } from "vitest";
import { fetchPublicHtml, isPublicAddress, RECIPE_PAGE_MAX_BYTES, SafeFetchError } from "./safe-url-fetcher.js";

const publicDns = vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]);
const htmlResponse = (overrides: Partial<{ status: number; headers: Record<string, string>; body: Buffer }> = {}) => ({ status: 200, headers: { "content-type": "text/html; charset=utf-8" }, body: Buffer.from("<html></html>"), ...overrides });

describe("recipe URL SSRF policy", () => {
  it.each(["127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.169.254", "224.0.0.1", "::1", "fe80::1", "fc00::1", "2001:db8::1"])("rejects non-public address %s", (address) => expect(isPublicAddress(address)).toBe(false));
  it("accepts public IPv4 and IPv6", () => { expect(isPublicAddress("93.184.216.34")).toBe(true); expect(isPublicAddress("2606:2800:220:1:248:1893:25c8:1946")).toBe(true); });
  it.each(["http://localhost/a", "http://127.0.0.1/a", "http://[::1]/a", "file:///etc/passwd"])("blocks %s", async (url) => {
    await expect(fetchPublicHtml(url, { resolve: publicDns, request: vi.fn() })).rejects.toMatchObject({ publicCode: expect.stringMatching(/blocked_url|invalid_url/) });
  });
  it("rejects a DNS response when any address is private (rebinding defense)", async () => {
    const request = vi.fn();
    await expect(fetchPublicHtml("https://example.com", { resolve: async () => [{ address: "93.184.216.34", family: 4 }, { address: "127.0.0.1", family: 4 }], request })).rejects.toMatchObject({ publicCode: "blocked_url" });
    expect(request).not.toHaveBeenCalled();
  });
  it("pins a vetted public address for the request", async () => {
    const request = vi.fn(async (_url, address) => { expect(address.address).toBe("93.184.216.34"); return htmlResponse(); });
    await expect(fetchPublicHtml("https://example.com", { resolve: publicDns, request })).resolves.toMatchObject({ finalUrl: "https://example.com/" });
  });
  it("re-resolves redirects and rejects a private destination", async () => {
    const resolve = vi.fn(async (hostname: string) => hostname === "safe.example" ? [{ address: "93.184.216.34", family: 4 }] : [{ address: "169.254.169.254", family: 4 }]);
    const request = vi.fn(async () => htmlResponse({ status: 302, headers: { location: "http://metadata.example/latest" } }));
    await expect(fetchPublicHtml("https://safe.example", { resolve, request })).rejects.toMatchObject({ publicCode: "blocked_url" });
    expect(resolve).toHaveBeenCalledTimes(2); expect(request).toHaveBeenCalledTimes(1);
  });
});

describe("recipe URL fetch limits", () => {
  it("maps timeout deterministically", async () => {
    await expect(fetchPublicHtml("https://example.com", { resolve: publicDns, request: async () => { throw new SafeFetchError("fetch_timeout"); } })).rejects.toMatchObject({ publicCode: "fetch_timeout" });
  });
  it("rejects an oversized actual body", async () => {
    await expect(fetchPublicHtml("https://example.com", { resolve: publicDns, request: async () => htmlResponse({ body: Buffer.alloc(RECIPE_PAGE_MAX_BYTES + 1) }) })).rejects.toMatchObject({ publicCode: "response_too_large" });
  });
  it("rejects an oversized Content-Length before accepting the body", async () => {
    await expect(fetchPublicHtml("https://example.com", { resolve: publicDns, request: async () => htmlResponse({ headers: { "content-type": "text/html", "content-length": String(RECIPE_PAGE_MAX_BYTES + 1) } }) })).rejects.toMatchObject({ publicCode: "response_too_large" });
  });
  it("rejects binary content", async () => {
    await expect(fetchPublicHtml("https://example.com", { resolve: publicDns, request: async () => htmlResponse({ headers: { "content-type": "image/png" } }) })).rejects.toMatchObject({ publicCode: "unsupported_content_type" });
  });
  it("limits redirect chains", async () => {
    const request = vi.fn(async () => htmlResponse({ status: 302, headers: { location: "/next" } }));
    await expect(fetchPublicHtml("https://example.com", { resolve: publicDns, request })).rejects.toMatchObject({ publicCode: "redirect_limit" });
    expect(request).toHaveBeenCalledTimes(4);
  });
});
