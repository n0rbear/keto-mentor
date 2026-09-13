import { OpenAiProvider, type OpenAiProviderOptions } from "../ai/openai-provider.js";
import { ChatRecipeExtractionProvider } from "./recipe-extraction-provider.js";

export class OpenAiRecipeExtractionProvider extends ChatRecipeExtractionProvider {
  constructor(options: OpenAiProviderOptions) {
    super(new OpenAiProvider(options));
  }
}
