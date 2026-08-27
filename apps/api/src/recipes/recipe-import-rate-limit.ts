import type { Request } from "express";

export const RECIPE_IMPORT_RATE_LIMIT = { windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false } as const;
export const recipeImportRateLimitKey = (req: Request) => {
  if (!req.user?.id) throw Object.assign(new Error("unauthorized"), { status: 401, publicCode: "unauthorized" });
  return req.user.id;
};
