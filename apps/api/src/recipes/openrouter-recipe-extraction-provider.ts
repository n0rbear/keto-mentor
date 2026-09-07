import { OpenRouterAiProvider, type OpenRouterProviderOptions } from "../ai/openrouter-provider.js";
import { ChatRecipeExtractionProvider } from "./recipe-extraction-provider.js";

export class OpenRouterRecipeExtractionProvider extends ChatRecipeExtractionProvider {
  constructor(options: OpenRouterProviderOptions) {
    super(new OpenRouterAiProvider(options));
  }
}
