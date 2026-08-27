import { describe, expect, it, vi } from "vitest";
import { fetchPublicHtml, isPublicAddress, pinnedRequestOptions, RECIPE_PAGE_MAX_BYTES, SafeFetchError } from "./safe-url-fetcher.js";

const publicDns = vi.fn(async () => [{ address: "93.184.216.34", family: 4 }]);
const htmlResponse = (overrides: Partial<{ status: number; headers: Record<string, string>; body: Buffer }> = {}) => ({ status: 200, headers: { "content-type": "text/html; charset=utf-8" }, body: Buffer.from("<html></html>"), ...overrides });

describe("recipe URL SSRF policy", () => {
  it.each(["127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.169.254", "224.0.0.1", "::1", "fe80::1", "fc00::1", "2001:db8::1", "::ffff:127.0.0.1", "64:ff9b::127.0.0.1", "2001::1", "2002::1", "2001:20::1", "3fff::1"])("rejects non-public address %s", (address) => expect(isPublicAddress(address)).toBe(false));
  it("accepts public IPv4 and IPv6", () => { expect(isPublicAddress("93.184.216.34")).toBe(true); expect(isPublicAddress("2606:2800:220:1:248:1893:25c8:1946")).toBe(true); });
  it.each(["http://localhost/a", "http://127.0.0.1/a", "http://[::1]/a", "file:///etc/passwd"])("blocks %s", async (url) => {
    await expect(fetchPublicHtml(url, { resolve: publicDns, request: vi.fn() })).rejects.toMatchObject({ publicCode: expect.stringMatching(/blocked_url|invalid_url/) });
  });
  it.each(["http://2130706433/", "http://0x7f000001/", "http://0177.0.0.1/"])("blocks WHATWG-canonicalized unusual IP form %s", async (url) => {
    const request = vi.fn(); await expect(fetchPublicHtml(url, { resolve: publicDns, request })).rejects.toMatchObject({ publicCode: "blocked_url" }); expect(request).not.toHaveBeenCalled();
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
  it("retains the original HTTPS hostname for SNI and certificate validation", () => {
    const options = pinnedRequestOptions(new URL("https://recipes.example/path"), { address: "93.184.216.34", family: 4 });
    expect(options).toMatchObject({ servername: "recipes.example", rejectUnauthorized: true });
    const callback = vi.fn(); options.lookup("recipes.example", {}, callback); expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
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

describe("absolute recipe fetch deadline", () => {
  function scheduler() {
    let callback!: () => void;
    return { setTimer: vi.fn((next: () => void) => { callback = next; return 1 as any; }), clearTimer: vi.fn(), expire: () => callback() };
  }

  it("stops a slow-drip request at the single wall-clock deadline", async () => {
    const timer = scheduler(); let started!: () => void; const requestStarted = new Promise<void>((resolve) => { started = resolve; });
    const request = vi.fn(async (_url, _address, _max, _remaining, signal: AbortSignal) => { started(); return new Promise<any>((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("upstream detail")), { once: true })); });
    const operation = fetchPublicHtml("https://example.com", { resolve: publicDns, request, setTimer: timer.setTimer, clearTimer: timer.clearTimer });
    await requestStarted; timer.expire(); await expect(operation).rejects.toMatchObject({ publicCode: "fetch_timeout" }); expect(timer.clearTimer).toHaveBeenCalledTimes(1);
  });

  it("counts DNS time against the same deadline", async () => {
    let now = 0; const timer = scheduler();
    const operation = fetchPublicHtml("https://example.com", { now: () => now, setTimer: timer.setTimer, clearTimer: timer.clearTimer, resolve: async () => { now = 8_001; return [{ address: "93.184.216.34", family: 4 }]; }, request: vi.fn() });
    await expect(operation).rejects.toMatchObject({ publicCode: "fetch_timeout" });
  });

  it("does not reset the deadline across redirects", async () => {
    const timer = scheduler(); const request = vi.fn(async (_url, _address, _max, remaining: number) => request.mock.calls.length === 1 ? htmlResponse({ status: 302, headers: { location: "/next" } }) : (expect(remaining).toBeLessThanOrEqual(8_000), htmlResponse()));
    await expect(fetchPublicHtml("https://example.com", { resolve: publicDns, request, setTimer: timer.setTimer, clearTimer: timer.clearTimer })).resolves.toMatchObject({ finalUrl: "https://example.com/next" });
    expect(timer.setTimer).toHaveBeenCalledTimes(1); expect(timer.clearTimer).toHaveBeenCalledTimes(1);
  });

  it("allows a normal fast response and clears its deadline timer", async () => {
    const timer = scheduler(); await expect(fetchPublicHtml("https://example.com", { resolve: publicDns, request: async () => htmlResponse(), setTimer: timer.setTimer, clearTimer: timer.clearTimer })).resolves.toMatchObject({ html: "<html></html>" }); expect(timer.clearTimer).toHaveBeenCalledTimes(1);
  });
});
