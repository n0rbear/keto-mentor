import { foodUnderstandingSchema, type FoodUnderstanding } from "@keto-mentor/shared";

export type AiCapability = "coach_chat" | "food_nlp" | "photo_analysis" | "recipe" | "weekly_plan" | "shopping_list";

export type FoodNlpInput = { text: string };

export interface AiProvider {
  id: string;
  model?: string;
  supports(capability: AiCapability): boolean;
  run<TInput, TOutput>(capability: AiCapability, input: TInput): Promise<TOutput>;
}

export async function understandFood(provider: AiProvider, input: FoodNlpInput): Promise<FoodUnderstanding> {
  if (!provider.supports("food_nlp")) throw new Error("food_nlp_disabled");
  return foodUnderstandingSchema.parse(await provider.run<FoodNlpInput, unknown>("food_nlp", input));
}

export class StubAiProvider implements AiProvider {
  id = "stub";

  supports(): boolean {
    return false;
  }

  async run(): Promise<never> {
    throw new Error("AI features are not enabled in the MVP.");
  }
}
