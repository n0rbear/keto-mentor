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

  // Regression: owner-beta blocker #4 (2026-09-10). Node's net.connect()
  // Happy-Eyeballs/dual-stack path (net.js's lookupAndConnectMultiple —
  // confirmed live on Node 20.20.2, the exact version Render resolves from
  // this repo's engines.node) invokes a hostname-based custom `lookup`
  // option with `{all: true}` and expects `callback(err, addresses[])`, NOT
  // the legacy `callback(err, address, family)` triple. A lookup answering
  // only the legacy form gets its single address string misread as an
  // addresses array by Node, which then throws ERR_INVALID_IP_ADDRESS
  // before ever attempting a connection — every real recipe-URL fetch
  // failed with SafeFetchError("fetch_failed") as a result, confirmed via a
  // live reproduction against real recipe sites under Node 20.20.2. Both
  // calling conventions must resolve to the SAME single already-validated,
  // pinned address — this is a calling-convention bugfix, never a change to
  // which address is trusted or connected to.
  it("answers Node's Happy-Eyeballs {all:true} lookup calling convention with an addresses array, not the legacy single-address form", () => {
    const options = pinnedRequestOptions(new URL("https://recipes.example/path"), { address: "93.184.216.34", family: 4 });
    const callback = vi.fn();
    options.lookup("recipes.example", { all: true } as any, callback as any);
    expect(callback).toHaveBeenCalledWith(null, [{ address: "93.184.216.34", family: 4 }]);
    expect(callback).not.toHaveBeenCalledWith(null, "93.184.216.34", expect.anything());
  });

  it("still answers the legacy calling convention when all is absent/false, unchanged", () => {
    const options = pinnedRequestOptions(new URL("https://recipes.example/path"), { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 });
    const legacyCallback = vi.fn();
    options.lookup("recipes.example", { all: false } as any, legacyCallback as any);
    expect(legacyCallback).toHaveBeenCalledWith(null, "2606:2800:220:1:248:1893:25c8:1946", 6);
  });

  it("supports Node's alternate 2-arg (hostname, callback) lookup invocation form", () => {
    const options = pinnedRequestOptions(new URL("https://recipes.example/path"), { address: "93.184.216.34", family: 4 });
    const callback = vi.fn();
    (options.lookup as any)("recipes.example", callback);
    expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
  });

  it("never returns any address other than the single pre-validated pinned one, in either calling convention", () => {
    const pinned = { address: "203.0.113.9" /* documentation range — deliberately not a real routable target */, family: 4 as const };
    const options = pinnedRequestOptions(new URL("https://recipes.example/path"), pinned);
    const arrayForm = vi.fn(); options.lookup("recipes.example", { all: true } as any, arrayForm as any);
    const addresses = arrayForm.mock.calls[0][1] as Array<{ address: string }>;
    expect(addresses).toHaveLength(1);
    expect(addresses[0].address).toBe(pinned.address);
    const legacyForm = vi.fn(); options.lookup("recipes.example", {} as any, legacyForm as any);
    expect(legacyForm).toHaveBeenCalledWith(null, pinned.address, pinned.family);
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
