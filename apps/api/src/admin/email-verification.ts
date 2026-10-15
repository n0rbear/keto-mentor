import { createHash, randomBytes } from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { Mailer } from "../mail/mailer.js";

// E-mail confirmation (admin release, 2026-10-15). The admin role is granted
// only to a CONFIRMED address on the ADMIN_EMAILS list, so registering with
// someone else's address never makes anyone admin. Same token discipline as
// the password reset: random 32 bytes in the link, only the SHA-256 stored,
// 24 hours, single use, and bound to the address it was sent to.

export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const VERIFY_COOLDOWN_MS = 2 * 60 * 1000;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
type Lang = "hu" | "de" | "en";
const langOf = (value: unknown): Lang => (value === "de" || value === "en" ? value : "hu");

const COPY: Record<Lang, { subject: string; intro: string; action: string; ignore: string }> = {
  hu: { subject: "Keto Mentor – e-mail cím megerősítése", intro: "Kérjük, erősítsd meg az e-mail címedet a Keto Mentorban. A link 24 óráig érvényes:", action: "E-mail cím megerősítése", ignore: "Ha nem te adtad meg ezt a címet, hagyd figyelmen kívül ezt a levelet." },
  de: { subject: "Keto Mentor – E-Mail-Adresse bestätigen", intro: "Bitte bestätige deine E-Mail-Adresse bei Keto Mentor. Der Link ist 24 Stunden gültig:", action: "E-Mail-Adresse bestätigen", ignore: "Wenn du diese Adresse nicht angegeben hast, ignoriere diese E-Mail." },
  en: { subject: "Keto Mentor – confirm your e-mail address", intro: "Please confirm your e-mail address for Keto Mentor. The link is valid for 24 hours:", action: "Confirm e-mail address", ignore: "If you did not enter this address, ignore this e-mail." }
};

type Db = {
  user: { findUnique(args: any): Promise<any>; update(args: any): Promise<any> };
  emailVerificationToken: { findFirst(args: any): Promise<any>; findUnique(args: any): Promise<any>; create(args: any): Promise<any>; updateMany(args: any): Promise<any> };
  $transaction(ops: any[]): Promise<any>;
};
export type VerificationDeps = { prisma: Db; mailer: Mailer; webAppUrl: string; log?: (line: string) => void; now?: () => Date };

export function adminEmailList(raw: string | undefined) {
  return (raw ?? "norbert@norbapp.com").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
}
export const isAdminUser = (user: { email?: string | null; emailVerifiedAt?: Date | null } | null | undefined, admins: readonly string[]) =>
  !!user?.email && !!user.emailVerifiedAt && admins.includes(user.email.toLowerCase());

/** Sends a confirmation link; returns "sent" | "cooldown" | "no_email" | "already" | mailer outcome. */
export async function sendVerification(deps: VerificationDeps, userId: string): Promise<string> {
  const now = deps.now?.() ?? new Date();
  const user = await deps.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, emailVerifiedAt: true, locale: true } });
  if (!user?.email) return "no_email";
  if (user.emailVerifiedAt) return "already";
  const recent = await deps.prisma.emailVerificationToken.findFirst({ where: { userId, createdAt: { gt: new Date(now.getTime() - VERIFY_COOLDOWN_MS) } }, select: { id: true } });
  if (recent) return "cooldown";
  const token = randomBytes(32).toString("base64url");
  await deps.prisma.$transaction([
    deps.prisma.emailVerificationToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } }),
    deps.prisma.emailVerificationToken.create({ data: { userId, email: user.email, tokenHash: hash(token), expiresAt: new Date(now.getTime() + VERIFY_TOKEN_TTL_MS) } })
  ]);
  const c = COPY[langOf(user.locale)];
  const link = `${deps.webAppUrl.replace(/\/+$/, "")}/#verify=${token}`;
  const result = await deps.mailer.send({ to: user.email, subject: c.subject, text: `${c.intro}\n\n${link}\n\n${c.ignore}\n`, html: `<p>${c.intro}</p><p><a href="${link}">${c.action}</a></p><p style="color:#666">${c.ignore}</p>` });
  (deps.log ?? console.log)(`email_verification outcome=${result.outcome}`);
  return result.outcome;
}

export function emailVerificationRouter(deps: VerificationDeps & { requireAuth: express.RequestHandler }) {
  const router = express.Router();
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
  router.post("/me/email/verify-request", deps.requireAuth, limiter, async (req, res, next) => {
    try { res.status(202).json({ outcome: await sendVerification(deps, req.user!.id) }); } catch (error) { next(error); }
  });
  router.post("/auth/verify-email", limiter, async (req, res, next) => {
    try {
      const { token } = z.object({ token: z.string().min(20).max(200) }).parse(req.body);
      const now = deps.now?.() ?? new Date();
      const row = await deps.prisma.emailVerificationToken.findUnique({ where: { tokenHash: hash(token) } });
      const user = row && await deps.prisma.user.findUnique({ where: { id: row.userId }, select: { id: true, email: true } });
      if (!row || row.usedAt || row.expiresAt <= now || !user || user.email !== row.email) return res.status(400).json({ error: "invalid_or_expired_token" });
      await deps.prisma.$transaction([
        deps.prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: now } }),
        deps.prisma.emailVerificationToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: now } })
      ]);
      (deps.log ?? console.log)("email_verification outcome=confirmed");
      res.json({ ok: true });
    } catch (error) { next(error); }
  });
  return router;
}
