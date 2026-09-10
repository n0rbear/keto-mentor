import { domainOf, type WebKnowledgeSearchProvider, type WebSearchQuery, type WebSearchResult } from "./web-knowledge-search-provider.js";

export class TavilyProviderError extends Error {
  constructor(readonly code: "timeout" | "http_error" | "response_too_large" | "invalid_response", readonly httpStatus?: number) {
    super(code);
    this.name = "TavilyProviderError";
  }
}

type TavilyResponse = { results: Array<{ title?: unknown; url?: unknown; content?: unknown; score?: unknown }> };

function isTavilyResponse(value: unknown): value is TavilyResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.results);
}

async function boundedText(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw new TavilyProviderError("response_too_large");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new TavilyProviderError("response_too_large");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}

export type TavilyProviderOptions = {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxResponseBytes?: number;
  fetchImpl?: typeof fetch;
};

/**
 * Maps Tavily's own response shape into the provider-neutral WebSearchResult
 * model — this is the ONLY file in the codebase that knows Tavily's response
 * fields (`content`, `score`, ...). Swapping the web-search provider later
 * means writing one new file matching this same interface, never touching
 * RecipeDiscoveryService or anything downstream of it.
 */
export class TavilyWebKnowledgeSearchProvider implements WebKnowledgeSearchProvider {
  readonly id = "tavily";
  private readonly apiKey: string;
  private readonly url: string;
  private readonly timeoutMs: number;
  private readonly maxResponseBytes: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TavilyProviderOptions) {
    if (!options.apiKey.trim()) throw new Error("Tavily API key is required");
    this.apiKey = options.apiKey;
    const base = options.baseUrl ?? "https://api.tavily.com";
    this.url = new URL("search", base.endsWith("/") ? base : `${base}/`).toString();
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.maxResponseBytes = options.maxResponseBytes ?? 256 * 1024;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async search(query: WebSearchQuery, signal?: AbortSignal): Promise<WebSearchResult[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const onExternalAbort = () => controller.abort();
    signal?.addEventListener("abort", onExternalAbort, { once: true });
    try {
      const response = await this.fetchImpl(this.url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          query: query.query,
          search_depth: "basic",
          max_results: Math.min(Math.max(query.maxResults ?? 5, 1), 10),
          include_domains: query.includeDomains,
          exclude_domains: query.excludeDomains,
          include_raw_content: false,
          include_answer: false,
          include_images: false
        }),
        signal: controller.signal
      });
      const body = await boundedText(response, this.maxResponseBytes);
      if (!response.ok) throw new TavilyProviderError("http_error", response.status);
      let parsed: unknown;
      try { parsed = JSON.parse(body); } catch { throw new TavilyProviderError("invalid_response"); }
      if (!isTavilyResponse(parsed)) throw new TavilyProviderError("invalid_response");
      return parsed.results
        .filter((item): item is { title: string; url: string; content?: string; score?: number } => typeof item.url === "string" && typeof item.title === "string")
        .map((item) => ({
          url: item.url,
          title: item.title,
          snippet: typeof item.content === "string" ? item.content.slice(0, 500) : "",
          domain: domainOf(item.url),
          score: typeof item.score === "number" ? item.score : undefined
        }));
    } catch (error) {
      if (error instanceof TavilyProviderError) throw error;
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) throw new TavilyProviderError("timeout");
      throw new TavilyProviderError("http_error");
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onExternalAbort);
    }
  }
}
