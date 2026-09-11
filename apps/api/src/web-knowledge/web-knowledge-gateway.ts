import { DisabledWebKnowledgeSearchProvider, type WebKnowledgeSearchProvider } from "./web-knowledge-search-provider.js";
import { TavilyWebKnowledgeSearchProvider } from "./tavily-provider.js";

export type WebKnowledgeGatewayConfigInput = {
  WEB_SEARCH_PROVIDER?: string;
  TAVILY_API_KEY?: string;
  TAVILY_BASE_URL?: string;
};

/**
 * Selects the configured web-knowledge search provider. Mirrors the
 * configuredFoodAiProvider/configuredSearchIntentProvider/
 * configuredRecipeAiProvider factory pattern exactly: a misconfigured or
 * absent provider degrades to Disabled rather than taking the API down, and
 * the rest of the codebase (RecipeDiscoveryService, meal-input) only ever
 * sees the provider-neutral WebKnowledgeSearchProvider interface — never
 * Tavily-specific shapes or config.
 */
export function configuredWebKnowledgeSearchProvider(config: WebKnowledgeGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): WebKnowledgeSearchProvider {
  const kind = config.WEB_SEARCH_PROVIDER?.trim().toLowerCase();
  try {
    if (kind === "tavily") {
      if (!config.TAVILY_API_KEY) throw new Error("TAVILY_API_KEY is required when WEB_SEARCH_PROVIDER=tavily");
      return new TavilyWebKnowledgeSearchProvider({ apiKey: config.TAVILY_API_KEY, baseUrl: config.TAVILY_BASE_URL, fetchImpl: overrides.fetchImpl });
    }
  } catch (error) {
    console.error("web_knowledge_search_provider_misconfigured:", error instanceof Error ? error.message : error);
  }
  return new DisabledWebKnowledgeSearchProvider();
}
