import { describe, expect, it, vi } from "vitest";
import { TavilyProviderError, TavilyWebKnowledgeSearchProvider } from "./tavily-provider.js";
import { DisabledWebKnowledgeSearchProvider, domainOf } from "./web-knowledge-search-provider.js";

function tavilyResponse(results: unknown[], init?: ResponseInit) {
  return new Response(JSON.stringify({ query: "q", results }), { status: 200, headers: { "content-type": "application/json" }, ...init });
}

function provider(fetchImpl: typeof fetch, overrides: Partial<ConstructorParameters<typeof TavilyWebKnowledgeSearchProvider>[0]> = {}) {
  return new TavilyWebKnowledgeSearchProvider({ apiKey: "tvly-test-key", fetchImpl, ...overrides });
}

describe("TavilyWebKnowledgeSearchProvider: response mapping", () => {
  it("maps Tavily's own result shape into the provider-neutral WebSearchResult model", async () => {
    const request = vi.fn(async () => tavilyResponse([
      { title: "Töltött káposzta recept", url: "https://mindmegette.hu/toltott-kaposzta.html", content: "A hagyományos magyar étel receptje...", score: 0.87 },
      { title: "Irrelevant page", url: "https://example.com/other" }
    ]));
    const results = await provider(request as typeof fetch).search({ query: "töltött káposzta recept" });
    expect(results).toEqual([
      { url: "https://mindmegette.hu/toltott-kaposzta.html", title: "Töltött káposzta recept", snippet: "A hagyományos magyar étel receptje...", domain: "mindmegette.hu", score: 0.87 },
      { url: "https://example.com/other", title: "Irrelevant page", snippet: "", domain: "example.com", score: undefined }
    ]);
  });

  it("sends the Authorization: Bearer header, never the key in the body, and uses the documented endpoint/method", async () => {
    const request = vi.fn(async () => tavilyResponse([]));
    await provider(request as typeof fetch).search({ query: "gulyásleves recept" });
    expect(request).toHaveBeenCalledOnce();
    const [url, init] = request.mock.calls[0];
    expect(String(url)).toBe("https://api.tavily.com/search");
    expect((init?.headers as Record<string, string>).authorization).toBe("Bearer tvly-test-key");
    expect(JSON.stringify(init?.body)).not.toContain("tvly-test-key");
    const body = JSON.parse(String(init?.body));
    expect(body.query).toBe("gulyásleves recept");
  });

  it.each([
    ["custom max_results within bounds", 3, 3],
    ["clamped above the ceiling", 50, 10],
    ["clamped below the floor", 0, 1]
  ])("bounds max_results (%s)", async (_name, requested, expected) => {
    const request = vi.fn(async () => tavilyResponse([]));
    await provider(request as typeof fetch).search({ query: "q", maxResults: requested });
    const body = JSON.parse(String(request.mock.calls[0][1]?.body));
    expect(body.max_results).toBe(expected);
  });
});

describe("TavilyWebKnowledgeSearchProvider: failure handling", () => {
  it("times out without retrying", async () => {
    const request = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
    }));
    await expect(provider(request as typeof fetch, { timeoutMs: 5 }).search({ query: "q" })).rejects.toEqual(new TavilyProviderError("timeout"));
    expect(request).toHaveBeenCalledOnce();
  });

  it("surfaces a clear HTTP error without exposing the response body", async () => {
    const request = vi.fn(async () => new Response("upstream secret detail", { status: 401 }));
    await expect(provider(request as typeof fetch).search({ query: "q" })).rejects.toEqual(new TavilyProviderError("http_error", 401));
  });

  it("rejects an oversized response", async () => {
    const request = vi.fn(async () => new Response("x".repeat(80)));
    await expect(provider(request as typeof fetch, { maxResponseBytes: 64 }).search({ query: "q" })).rejects.toEqual(new TavilyProviderError("response_too_large"));
  });

  it("rejects invalid/non-JSON and malformed-shape responses", async () => {
    await expect(provider((async () => new Response("not-json")) as typeof fetch).search({ query: "q" })).rejects.toEqual(new TavilyProviderError("invalid_response"));
    await expect(provider((async () => new Response(JSON.stringify({ no_results_field: true }))) as typeof fetch).search({ query: "q" })).rejects.toEqual(new TavilyProviderError("invalid_response"));
  });

  it("never throws for a malformed individual result — drops it and keeps the rest", async () => {
    const request = vi.fn(async () => tavilyResponse([{ title: "Good", url: "https://example.com/a" }, { title: "Missing URL" }, { url: "https://example.com/b" }]));
    const results = await provider(request as typeof fetch).search({ query: "q" });
    expect(results).toHaveLength(1);
    expect(results[0].url).toBe("https://example.com/a");
  });
});

describe("DisabledWebKnowledgeSearchProvider", () => {
  it("always returns an empty result list without any network call", async () => {
    const provider = new DisabledWebKnowledgeSearchProvider();
    expect(provider.id).toBe("disabled");
    expect(await provider.search({ query: "anything" })).toEqual([]);
  });
});

describe("domainOf", () => {
  it("strips a leading www. and returns the bare hostname", () => {
    expect(domainOf("https://www.mindmegette.hu/recept")).toBe("mindmegette.hu");
    expect(domainOf("https://nosalty.hu/x")).toBe("nosalty.hu");
  });
  it("returns an empty string for an unparseable URL rather than throwing", () => {
    expect(domainOf("not a url")).toBe("");
  });
});
