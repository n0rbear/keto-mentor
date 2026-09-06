process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/ketomentor?schema=ketomentor";
process.env.JWT_ACCESS_SECRET = "a".repeat(32);
process.env.JWT_REFRESH_SECRET = "b".repeat(32);

import { describe, expect, it } from "vitest";

const { parseEnv } = await import("./config.js");

const base = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET
};

describe("parseEnv", () => {
  it("treats a blank optional enum var the same as unset instead of crashing", () => {
    const env = parseEnv({ ...base, FOOD_AI_PROVIDER: "" });
    expect(env.FOOD_AI_PROVIDER).toBeUndefined();
  });

  it("treats a blank optional string var the same as unset instead of crashing", () => {
    const env = parseEnv({ ...base, MISTRAL_API_KEY: "" });
    expect(env.MISTRAL_API_KEY).toBeUndefined();
  });

  it("still rejects a genuinely invalid value", () => {
    expect(() => parseEnv({ ...base, FOOD_AI_PROVIDER: "bogus" })).toThrow();
  });

  it("accepts a valid provider value", () => {
    const env = parseEnv({ ...base, FOOD_AI_PROVIDER: "openrouter" });
    expect(env.FOOD_AI_PROVIDER).toBe("openrouter");
  });
});
