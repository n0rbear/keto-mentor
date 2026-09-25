import "dotenv/config";
import { z } from "zod";
import { assertProductionDatabaseSchema } from "./database-url.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4100),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  USDA_FDC_API_KEY: z.string().min(1).optional(),
  MISTRAL_API_KEY: z.string().min(1).optional(),
  MISTRAL_MODEL: z.string().min(1).max(120).optional(),
  MISTRAL_BASE_URL: z.string().url().max(500).optional(),
  FOOD_AI_PROVIDER: z.enum(["mistral", "openrouter", "groq", "openai"]).optional(),
  FOOD_AI_MODEL: z.string().min(1).max(160).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_BASE_URL: z.string().url().max(500).optional(),
  OPENROUTER_APP_REFERER: z.string().url().max(300).optional(),
  OPENROUTER_APP_TITLE: z.string().min(1).max(120).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).max(160).optional(),
  GROQ_BASE_URL: z.string().url().max(500).optional(),
  // OpenAI baseline checkpoint (2026-09-13): a standalone peer provider kind
  // (see food-ai-gateway-config.ts) — never wired as anyone's failover
  // partner, never removes Groq/OpenRouter/Mistral. OPENAI_API_KEY is
  // deliberately configured ONLY on the staging service for this benchmark.
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_BASE_URL: z.string().url().max(500).optional(),
  // Voice food entry (2026-09-23): reuses OPENAI_API_KEY/OPENAI_BASE_URL
  // above — no new secret. Optional override of the transcription model
  // (default: gpt-4o-mini-transcribe, see ai/transcription-provider.ts);
  // voice input is simply unavailable (client keeps the existing text input)
  // wherever OPENAI_API_KEY itself is unset.
  OPENAI_TRANSCRIBE_MODEL: z.string().min(1).max(120).optional(),
  // Plate-photo portion estimation (2026-09-25): reuses OPENAI_API_KEY;
  // optional vision model override (default gpt-5.4-mini).
  PORTION_VISION_MODEL: z.string().min(1).max(120).optional(),

  WEB_SEARCH_PROVIDER: z.enum(["tavily"]).optional(),
  TAVILY_API_KEY: z.string().min(1).optional(),
  TAVILY_BASE_URL: z.string().url().max(500).optional()
});

// Dashboards like Render can leave an optional var present but blank (e.g. a key
// added without a value yet); treat that the same as unset instead of failing
// enum/min(1) checks meant for a genuinely missing variable.
export function parseEnv(rawEnv: NodeJS.ProcessEnv) {
  const sanitized = Object.fromEntries(Object.entries(rawEnv).filter(([, value]) => value !== ""));
  return envSchema.parse(sanitized);
}

export const env = parseEnv(process.env);
assertProductionDatabaseSchema(env.DATABASE_URL, env.NODE_ENV);
