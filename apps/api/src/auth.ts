import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { env } from "./config.js";
import { prisma } from "./db.js";

export type AuthUser = { id: string; username: string; locale: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id });
export const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password);

export function signAccessToken(user: AuthUser) {
  return jwt.sign(user, env.JWT_ACCESS_SECRET, { expiresIn: "15m", audience: "keto-mentor", issuer: "keto-mentor-api" });
}

export function signRefreshToken(sessionId: string) {
  return jwt.sign({ sessionId }, env.JWT_REFRESH_SECRET, { expiresIn: "30d", audience: "keto-mentor", issuer: "keto-mentor-api" });
}


export function setRefreshCookie(res: Response, token: string) {
  res.cookie("km_refresh", token, {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

export function readRefreshToken(req: Request): { sessionId: string } | null {
  const token = req.cookies?.km_refresh;
  if (!token) return null;
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, { audience: "keto-mentor", issuer: "keto-mentor-api" }) as { sessionId: string };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { audience: "keto-mentor", issuer: "keto-mentor-api" }) as AuthUser;
    const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, username: true, locale: true } });
    if (!user) return res.status(401).json({ error: "invalid_token" });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}
