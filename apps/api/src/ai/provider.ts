export type AiCapability = "coach_chat" | "food_nlp" | "photo_analysis" | "recipe" | "weekly_plan" | "shopping_list";

export interface AiProvider {
  id: string;
  supports(capability: AiCapability): boolean;
  run<TInput, TOutput>(capability: AiCapability, input: TInput): Promise<TOutput>;
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
