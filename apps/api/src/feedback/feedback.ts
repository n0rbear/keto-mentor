import express from "express";
import rateLimit from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { z } from "zod";

// In-app bug report (owner request 2026-10-13): "a field where bugs can be
// written, so that the developer sees them in the log". Log only, no
// database table — each report becomes exactly ONE searchable line
// (`user_feedback id=...`) in the plain key=value style used elsewhere.
// Render log retention is limited; a table could be a later improvement.

export const FEEDBACK_MESSAGE_MAX = 2000;
export const FEEDBACK_RATE_LIMIT = Object.freeze({ windowMs: 15 * 60 * 1000, limit: 10 });

// Whitelisted, length-capped context fields. Unknown keys are dropped by
// zod's default object parsing, so nothing else the client sends is logged.
export const feedbackSchema = z.object({
  message: z.string().trim().min(1).max(FEEDBACK_MESSAGE_MAX),
  context: z.object({
    view: z.string().max(40).optional(),
    lang: z.string().max(8).optional(),
    build: z.string().max(80).optional(),
    clientTime: z.string().max(40).optional(),
    lastInput: z.string().max(500).optional(),
    operationId: z.string().max(64).optional()
  }).optional()
});

export function feedbackRateLimitKey(request: { user?: { id: string } }) {
  if (!request.user?.id) throw new Error("Authenticated user required before feedback rate limiting");
  return request.user.id;
}

// JSON-escapes a client-supplied value so that newlines, quotes and other
// control characters can never break the line or forge another log line.
// JSON.stringify leaves U+2028/U+2029 raw; some viewers treat them as line
// breaks, so they are escaped as well.
export function logValue(value: string | undefined, max?: number) {
  if (value == null || value === "") return "-";
  const capped = max != null && value.length > max ? `${value.slice(0, max)}…` : value;
  return JSON.stringify(capped).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function formatFeedbackLine(id: string, userId: string, input: z.infer<typeof feedbackSchema>) {
  const c = input.context ?? {};
  return `user_feedback id=${id} user=${userId} view=${logValue(c.view)} lang=${logValue(c.lang)} build=${logValue(c.build)}`
    + ` clientTime=${logValue(c.clientTime)} operationId=${logValue(c.operationId)} lastInput=${logValue(c.lastInput, 300)}`
    + ` message=${logValue(input.message)}`;
}

export type FeedbackRecord = { id: string; userId: string; message: string } & NonNullable<z.infer<typeof feedbackSchema>["context"]>;

// The ticket is also stored for the admin screen (2026-10-15); a failed write
// never fails the report — the log line is the record of last resort.
export function feedbackRouter(requireAuth: express.RequestHandler, log: (line: string) => void = console.log, store?: (record: FeedbackRecord) => Promise<unknown>) {
  const router = express.Router();
  const limiter = rateLimit({ ...FEEDBACK_RATE_LIMIT, standardHeaders: true, legacyHeaders: false, keyGenerator: feedbackRateLimitKey });
  router.post("/feedback", requireAuth, limiter, async (req, res, next) => {
    try {
      const input = feedbackSchema.parse(req.body);
      const id = randomBytes(3).toString("hex");
      log(formatFeedbackLine(id, req.user!.id, input));
      if (store) await store({ id, userId: req.user!.id, message: input.message, ...(input.context ?? {}) }).catch(() => log(`user_feedback_store outcome=failed id=${id}`));
      res.status(201).json({ id });
    } catch (error) { next(error); }
  });
  return router;
}
