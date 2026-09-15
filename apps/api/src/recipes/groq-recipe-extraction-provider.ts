import { GroqAiProvider, type GroqProviderOptions } from "../ai/groq-provider.js";
import { ChatRecipeExtractionProvider } from "./recipe-extraction-provider.js";

export class GroqRecipeExtractionProvider extends ChatRecipeExtractionProvider {
  constructor(options: GroqProviderOptions) {
    super(new GroqAiProvider(options));
  }
}
