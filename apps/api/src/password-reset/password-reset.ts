import { createHash, randomBytes } from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import { emailUpdateSchema, passwordResetConfirmSchema, passwordResetRequestSchema } from "@keto-mentor/shared";
import type { Mailer } from "../mail/mailer.js";

// Password reset by e-mail (owner decision 2026-10-15, tester release).
// - request: always 202, whether or not the address belongs to an account,
//   so the endpoint never reveals who is registered;
// - the link carries a random 32-byte token; only its SHA-256 is stored,
//   valid for one hour, single use, and a newer request voids older links;
// - confirm: sets the new password and signs every session out.
// Logs never contain the address or the token.

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
export const RESET_COOLDOWN_MS = 2 * 60 * 1000;
export const RESET_REQUEST_LIMIT = Object.freeze({ windowMs: 15 * 60 * 1000, limit: 5 });
// Confirming (a mistyped new password) and attaching an e-mail get their own,
// roomier per-IP budget so they never eat the mail-sending one.
export const RESET_CONFIRM_LIMIT = Object.freeze({ windowMs: 15 * 60 * 1000, limit: 20 });

type Lang = "hu" | "de" | "en";
type Db = {
  user: { findUnique(args: any): Promise<any>; update(args: any): Promise<any> };
  passwordResetToken: { findFirst(args: any): Promise<any>; findUnique(args: any): Promise<any>; create(args: any): Promise<any>; updateMany(args: any): Promise<any> };
  session: { updateMany(args: any): Promise<any> };
  $transaction(ops: any[]): Promise<any>;
};
export type PasswordResetDeps = {
  prisma: Db;
  mailer: Mailer;
  webAppUrl: string;
  hashPassword(password: string): Promise<string>;
  verifyPassword(hash: string, password: string): Promise<boolean>;
  requireAuth: express.RequestHandler;
  /** Called after an account attaches a new e-mail (sends the confirmation link). */
  onEmailChanged?: (userId: string) => Promise<unknown>;
  log?: (line: string) => void;
  now?: () => Date;
};

export const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

const COPY: Record<Lang, { subject: string; intro: string; action: string; ignore: string }> = {
  hu: { subject: "Keto Mentor by NorbApp – új jelszó beállítása", intro: "Új jelszót kértél a Keto Mentor fiókodhoz. Az alábbi link 1 óráig érvényes, és egyszer használható:", action: "Új jelszó beállítása", ignore: "Ha nem te kérted, hagyd figyelmen kívül ezt a levelet; a jelszavad nem változik." },
  de: { subject: "Keto Mentor by NorbApp – neues Passwort festlegen", intro: "Du hast ein neues Passwort für dein Keto-Mentor-Konto angefordert. Der Link ist 1 Stunde gültig und nur einmal verwendbar:", action: "Neues Passwort festlegen", ignore: "Wenn du das nicht angefordert hast, ignoriere diese E-Mail; dein Passwort bleibt unverändert." },
  en: { subject: "Keto Mentor by NorbApp – set a new password", intro: "You asked for a new password for your Keto Mentor account. The link is valid for 1 hour and works once:", action: "Set a new password", ignore: "If you did not ask for this, ignore this e-mail; your password stays the same." }
};

export function resetEmail(lang: Lang, link: string) {
  const c = COPY[lang];
  const text = `${c.intro}\n\n${link}\n\n${c.ignore}\n`;
  const html = `<p>${c.intro}</p><p><a href="${link}">${c.action}</a></p><p style="color:#666">${c.ignore}</p>`;
  return { subject: c.subject, text, html };
}

const langOf = (value: unknown): Lang => (value === "de" || value === "en" ? value : "hu");

/** Issues a reset link and mails it; also used by the admin screen. Returns the outcome it logged. */
export async function sendPasswordReset(deps: Pick<PasswordResetDeps, "prisma" | "mailer" | "webAppUrl" | "log" | "now">, user: { id: string; email: string; locale?: string | null }): Promise<string> {
  const log = deps.log ?? console.log;
  const at = (deps.now ?? (() => new Date()))();
  const recent = await deps.prisma.passwordResetToken.findFirst({ where: { userId: user.id, createdAt: { gt: new Date(at.getTime() - RESET_COOLDOWN_MS) } }, select: { id: true } });
  if (recent) { log("password_reset_request outcome=cooldown"); return "cooldown"; }
  const token = randomBytes(32).toString("base64url");
  await deps.prisma.$transaction([
    deps.prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: at } }),
    deps.prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashResetToken(token), expiresAt: new Date(at.getTime() + RESET_TOKEN_TTL_MS) } })
  ]);
  const link = `${deps.webAppUrl.replace(/\/+$/, "")}/#reset=${token}`;
  const result = await deps.mailer.send({ to: user.email, ...resetEmail(langOf(user.locale), link) });
  log(`password_reset_email outcome=${result.outcome}${result.status ? ` status=${result.status}` : ""}`);
  return result.outcome;
}

export function passwordResetRouter(deps: PasswordResetDeps) {
  const router = express.Router();
  const log = deps.log ?? console.log;
  const now = deps.now ?? (() => new Date());
  const limiter = rateLimit({ ...RESET_REQUEST_LIMIT, standardHeaders: true, legacyHeaders: false });
  const confirmLimiter = rateLimit({ ...RESET_CONFIRM_LIMIT, standardHeaders: true, legacyHeaders: false });
  const emailLimiter = rateLimit({ ...RESET_CONFIRM_LIMIT, standardHeaders: true, legacyHeaders: false });

  router.post("/auth/password-reset/request", limiter, async (req, res, next) => {
    try {
      const input = passwordResetRequestSchema.parse(req.body);
      const user = await deps.prisma.user.findUnique({ where: { email: input.email }, select: { id: true, locale: true } });
      if (!user) { log("password_reset_request outcome=no_account"); return res.status(202).json({ ok: true }); }
      await sendPasswordReset(deps, { id: user.id, email: input.email, locale: input.locale ?? user.locale });
      res.status(202).json({ ok: true });
    } catch (error) { next(error); }
  });

  router.post("/auth/password-reset/confirm", confirmLimiter, async (req, res, next) => {
    try {
      const input = passwordResetConfirmSchema.parse(req.body);
      const row = await deps.prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(input.token) } });
      const at = now();
      if (!row || row.usedAt || row.expiresAt <= at) { log("password_reset_confirm outcome=invalid"); return res.status(400).json({ error: "invalid_or_expired_token" }); }
      const passwordHash = await deps.hashPassword(input.password);
      await deps.prisma.$transaction([
        deps.prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
        deps.prisma.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: at } }),
        deps.prisma.session.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: at } })
      ]);
      log("password_reset_confirm outcome=changed");
      res.json({ ok: true });
    } catch (error) { next(error); }
  });

  // An existing username-only account (everyone registered before the
  // tester release) attaches an e-mail so it can reset its password later.
  router.put("/me/email", deps.requireAuth, emailLimiter, async (req, res, next) => {
    try {
      const input = emailUpdateSchema.parse(req.body);
      const user = await deps.prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, passwordHash: true } });
      if (!user || !(await deps.verifyPassword(user.passwordHash, input.currentPassword))) return res.status(401).json({ error: "invalid_credentials" });
      try {
        await deps.prisma.user.update({ where: { id: user.id }, data: { email: input.email, emailVerifiedAt: null } });
      } catch (error: any) {
        if (error?.code === "P2002") return res.status(409).json({ error: "email_taken" });
        throw error;
      }
      if (deps.onEmailChanged) await deps.onEmailChanged(user.id).catch(() => undefined);
      res.json({ email: input.email });
    } catch (error) { next(error); }
  });

  return router;
}
