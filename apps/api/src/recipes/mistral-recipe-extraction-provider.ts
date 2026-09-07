import { MistralAiProvider, type MistralProviderOptions } from "../ai/mistral-provider.js";
import { ChatRecipeExtractionProvider } from "./recipe-extraction-provider.js";

export class MistralRecipeExtractionProvider extends ChatRecipeExtractionProvider {
  constructor(options: MistralProviderOptions) {
    super(new MistralAiProvider(options));
  }
}
