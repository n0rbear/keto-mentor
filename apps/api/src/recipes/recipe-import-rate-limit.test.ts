import { describe, expect, it } from "vitest";
import { RECIPE_IMPORT_RATE_LIMIT, recipeImportRateLimitKey } from "./recipe-import-rate-limit.js";

describe("recipe import rate limit", () => {
  it("uses 10 previews per authenticated user per 15 minutes", () => {
    expect(RECIPE_IMPORT_RATE_LIMIT).toMatchObject({ limit: 10, windowMs: 900_000 });
    expect(recipeImportRateLimitKey({ user: { id: "user-a" } } as any)).toBe("user-a");
    expect(recipeImportRateLimitKey({ user: { id: "user-b" } } as any)).toBe("user-b");
  });
  it("cannot fall back to a shared IP key before authentication", () => {
    expect(() => recipeImportRateLimitKey({ ip: "203.0.113.1" } as any)).toThrowError(expect.objectContaining({ publicCode: "unauthorized" }));
  });
});
