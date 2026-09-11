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
  FOOD_AI_PROVIDER: z.enum(["mistral", "openrouter", "groq"]).optional(),
  FOOD_AI_MODEL: z.string().min(1).max(160).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_BASE_URL: z.string().url().max(500).optional(),
  OPENROUTER_APP_REFERER: z.string().url().max(300).optional(),
  OPENROUTER_APP_TITLE: z.string().min(1).max(120).optional(),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).max(160).optional(),
  GROQ_BASE_URL: z.string().url().max(500).optional(),
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
