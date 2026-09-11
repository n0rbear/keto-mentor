/**
 * Provider-neutral web search abstraction. Knows nothing about food, Recipe,
 * nutrition, or meal-input — it performs one thing: a bounded web search that
 * returns a small, normalized result list. Domain-specific services
 * (RecipeDiscoveryService, and later a food/nutrition-discovery equivalent)
 * are built ON TOP of this, never inside it — see recipes/recipe-discovery.ts.
 *
 * A search result is discovery data only. It is never trusted identity,
 * never trusted nutrition, and never itself sufficient evidence for
 * anything — every consumer of WebSearchResult must independently verify
 * relevance against its own original concept before acting on a result.
 */
export type WebSearchResult = {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  score?: number;
};

export type WebSearchQuery = {
  query: string;
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
};

export interface WebKnowledgeSearchProvider {
  readonly id: string;
  search(query: WebSearchQuery, signal?: AbortSignal): Promise<WebSearchResult[]>;
}

/** "No web search provider configured" — the default, safe-by-construction state. */
export class DisabledWebKnowledgeSearchProvider implements WebKnowledgeSearchProvider {
  readonly id = "disabled";
  async search(): Promise<WebSearchResult[]> {
    return [];
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
