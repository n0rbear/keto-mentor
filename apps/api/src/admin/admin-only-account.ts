import type express from "express";
import { isAdminUser } from "./email-verification.js";

// "Az admin fiók CSAK admin fiók legyen" (owner decision 2026-10-15): the
// admin account manages the app and logs nothing. Writes to the diary,
// recipes and the food profile are refused for it on the server, whatever
// the web app shows. Reading stays allowed (it is all empty anyway).
export function forbidAdminAccountWrites(deps: { prisma: { user: { findUnique(args: any): Promise<any> } }; admins: readonly string[] }): express.RequestHandler {
  return async (req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD" || !req.user) return next();
    try {
      const user = await deps.prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true, emailVerifiedAt: true } });
      if (isAdminUser(user, deps.admins)) return res.status(403).json({ error: "admin_account_no_logging" });
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
