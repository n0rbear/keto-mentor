import { describe, expect, it, vi } from "vitest";
import { RecipeDiscoveryService } from "./recipe-discovery.js";
import { WebKnowledgeSearchRateLimiter } from "../web-knowledge/web-knowledge-rate-limit.js";
import { NegativeSearchCache } from "../web-knowledge/negative-search-cache.js";
import { DisabledWebKnowledgeSearchProvider } from "../web-knowledge/web-knowledge-search-provider.js";

function fakeProvider(results: Array<{ url: string; title: string; domain: string }>) {
  const search = vi.fn(async () => results);
  return { id: "fake", search };
}

function service(provider: { id: string; search: (...args: any[]) => any }, overrides: Partial<{ rateLimiter: WebKnowledgeSearchRateLimiter; negativeCache: NegativeSearchCache }> = {}) {
  return new RecipeDiscoveryService({
    provider: provider as any,
    rateLimiter: overrides.rateLimiter ?? new WebKnowledgeSearchRateLimiter(),
    negativeCache: overrides.negativeCache ?? new NegativeSearchCache()
  });
}

describe("RecipeDiscoveryService: one-search-per-attempt bound (Tavily credit protection)", () => {
  it("makes exactly one provider.search call per discover() invocation", async () => {
    const provider = fakeProvider([{ url: "https://mindmegette.hu/toltott-kaposzta.html", title: "Töltött káposzta recept", domain: "mindmegette.hu" }]);
    await service(provider).discover({ originalPhrase: "töltött káposzta", locale: "hu", userId: "user-1" });
    expect(provider.search).toHaveBeenCalledOnce();
  });

  it("includes the original phrase and a language-level (not dish-specific) hint in the query", async () => {
    const provider = fakeProvider([]);
    await service(provider).discover({ originalPhrase: "rakott krumpli", locale: "hu", userId: "user-1" });
    const query = provider.search.mock.calls[0][0].query as string;
    expect(query).toContain("rakott krumpli");
    expect(query).toContain("recept");
  });
});

describe("RecipeDiscoveryService: relevance filtering against the ORIGINAL concept", () => {
  it("rejects a clearly unrelated result even with a high provider score, and never returns it as a candidate", async () => {
    const provider = fakeProvider([{ url: "https://example.com/unrelated-recipe", title: "Csokoládés süti recept", domain: "example.com" }]);
    const outcome = await service(provider).discover({ originalPhrase: "töltött káposzta", locale: "hu", userId: "user-1" });
    expect(outcome).toMatchObject({ status: "no_results", resultCount: 1, candidatesAfterRelevanceFilter: 0 });
  });

  it("accepts a genuinely relevant result whose title shares every meaningful token of the original phrase", async () => {
    const provider = fakeProvider([{ url: "https://mindmegette.hu/toltott-kaposzta.html", title: "Töltött káposzta recept", domain: "mindmegette.hu" }]);
    const outcome = await service(provider).discover({ originalPhrase: "töltött káposzta", locale: "hu", userId: "user-1" });
    expect(outcome).toMatchObject({ status: "found", candidates: [{ url: "https://mindmegette.hu/toltott-kaposzta.html", domain: "mindmegette.hu" }] });
  });

  it("returns a bounded ORDERED set of relevant candidates (not just the top one) so the caller can try import suitability sequentially", async () => {
    const results = Array.from({ length: 5 }, (_, i) => ({ url: `https://example.com/${i}`, title: "Töltött káposzta recept", domain: `site${i}.example.com` }));
    const provider = fakeProvider(results);
    const outcome = await service(provider).discover({ originalPhrase: "töltött káposzta", locale: "hu", userId: "user-1" });
    expect(outcome.status).toBe("found");
    if (outcome.status === "found") {
      expect(outcome.candidates.length).toBeLessThanOrEqual(3); // bounded — see MAX_CANDIDATES_RETURNED
      expect(outcome.candidates.length).toBeGreaterThan(1); // and genuinely more than just the top one
      expect(outcome.candidates.map((c) => c.url)).toEqual(results.slice(0, outcome.candidates.length).map((r) => r.url)); // preserves order
    }
  });

  it("considers only the top bounded slice of results, never the full unbounded list", async () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ url: `https://example.com/${i}`, title: "Unrelated page", domain: "example.com" }));
    const provider = fakeProvider(many);
    const outcome = await service(provider).discover({ originalPhrase: "gulyásleves", locale: "hu", userId: "user-1" });
    expect(outcome).toMatchObject({ status: "no_results", resultCount: 10 });
  });
});

describe("RecipeDiscoveryService: cost controls", () => {
  it("is a no-op with the disabled provider — zero search calls, safe unresolved outcome", async () => {
    const provider = new DisabledWebKnowledgeSearchProvider();
    const spy = vi.spyOn(provider, "search");
    const outcome = await service(provider).discover({ originalPhrase: "töltött káposzta", locale: "hu", userId: "user-1" });
    expect(outcome).toEqual({ status: "disabled" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("rate-limits per user without ever calling the provider once exhausted", async () => {
    const provider = fakeProvider([]);
    const rateLimiter = new WebKnowledgeSearchRateLimiter();
    vi.spyOn(rateLimiter, "consume").mockReturnValue(false);
    const outcome = await service(provider, { rateLimiter }).discover({ originalPhrase: "töltött káposzta", locale: "hu", userId: "user-1" });
    expect(outcome).toEqual({ status: "rate_limited" });
    expect(provider.search).not.toHaveBeenCalled();
  });

  it("never re-searches a phrase already negatively cached (no candidates found last time)", async () => {
    const provider = fakeProvider([{ url: "https://example.com/unrelated", title: "Something else entirely", domain: "example.com" }]);
    const negativeCache = new NegativeSearchCache();
    const svc = service(provider, { negativeCache });
    const first = await svc.discover({ originalPhrase: "töltött káposzta", locale: "hu", userId: "user-1" });
    expect(first.status).toBe("no_results");
    expect(provider.search).toHaveBeenCalledOnce();

    const second = await svc.discover({ originalPhrase: "töltött káposzta", locale: "hu", userId: "user-2" });
    expect(second).toMatchObject({ status: "no_results" });
    expect(provider.search).toHaveBeenCalledOnce(); // unchanged — negative cache short-circuited before any search
  });

  it("a provider failure degrades to a safe outcome, never throws", async () => {
    const provider = { id: "fake", search: vi.fn(async () => { throw new Error("network down"); }) };
    const outcome = await service(provider).discover({ originalPhrase: "töltött káposzta", locale: "hu", userId: "user-1" });
    expect(outcome).toEqual({ status: "provider_error" });
  });
});
