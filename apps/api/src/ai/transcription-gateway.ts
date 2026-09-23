import { DisabledTranscriptionProvider, OpenAiTranscriptionProvider, type TranscriptionProvider } from "./transcription-provider.js";

export type TranscriptionGatewayConfigInput = {
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_TRANSCRIBE_MODEL?: string;
};

/**
 * Voice food entry (2026-09-23): reuses the SAME OPENAI_API_KEY/
 * OPENAI_BASE_URL every other OpenAI-backed capability in this codebase
 * reads (ai/openai-provider.ts, food-ai-gateway-config.ts) — no new secret.
 * Degrades to DisabledTranscriptionProvider (voice input unavailable, text
 * entry unaffected) whenever the key is unset, exactly like every other
 * configured*Provider factory in this codebase.
 */
export function configuredTranscriptionProvider(config: TranscriptionGatewayConfigInput, overrides: { fetchImpl?: typeof fetch } = {}): TranscriptionProvider {
  const apiKey = config.OPENAI_API_KEY?.trim();
  if (!apiKey) return new DisabledTranscriptionProvider();
  try {
    return new OpenAiTranscriptionProvider({ apiKey, model: config.OPENAI_TRANSCRIBE_MODEL, baseUrl: config.OPENAI_BASE_URL, fetchImpl: overrides.fetchImpl });
  } catch (error) {
    console.error("transcription_provider_misconfigured:", error instanceof Error ? error.message : error);
    return new DisabledTranscriptionProvider();
  }
}
