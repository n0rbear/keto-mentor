import { Prisma } from "@prisma/client";

// Anonymous daily usage counters for the admin statistics (owner decision
// 2026-10-15: aggregated only — no user id, no text). Requests only bump an
// in-memory tally; a timer writes it to ketomentor.UsageDaily once a minute
// with one upsert per (day, kind). A crash loses at most a minute of counts,
// which only ever makes the statistics slightly low. Counting never throws
// into the request that triggered it.

export type UsageExtra = { ms?: number; promptTokens?: number; completionTokens?: number };
type Tally = { count: number; totalMs: number; promptTokens: number; completionTokens: number };

const pending = new Map<string, Tally>();
const KIND = /^[a-z0-9_:.-]{1,60}$/;

export const usageDay = (at = new Date()) => at.toISOString().slice(0, 10);

export function countUsage(kind: string, extra: UsageExtra = {}, at = new Date()) {
  if (!KIND.test(kind)) return;
  const key = `${usageDay(at)}|${kind}`;
  const tally = pending.get(key) ?? { count: 0, totalMs: 0, promptTokens: 0, completionTokens: 0 };
  tally.count += 1;
  tally.totalMs += Math.max(0, Math.round(extra.ms ?? 0));
  tally.promptTokens += Math.max(0, Math.round(extra.promptTokens ?? 0));
  tally.completionTokens += Math.max(0, Math.round(extra.completionTokens ?? 0));
  pending.set(key, tally);
}

export function pendingUsageForTests() { return new Map(pending); }
export function clearPendingUsageForTests() { pending.clear(); }

type UsageDb = { $executeRaw(query: Prisma.Sql): Promise<number> };

export async function flushUsage(prisma: UsageDb) {
  const batch = [...pending.entries()];
  pending.clear();
  for (const [key, t] of batch) {
    const [day, kind] = key.split("|");
    try {
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "ketomentor"."UsageDaily" ("day", "kind", "count", "totalMs", "promptTokens", "completionTokens")
        VALUES (${day}::date, ${kind}, ${t.count}, ${t.totalMs}, ${t.promptTokens}, ${t.completionTokens})
        ON CONFLICT ("day", "kind") DO UPDATE SET
          "count" = "UsageDaily"."count" + EXCLUDED."count",
          "totalMs" = "UsageDaily"."totalMs" + EXCLUDED."totalMs",
          "promptTokens" = "UsageDaily"."promptTokens" + EXCLUDED."promptTokens",
          "completionTokens" = "UsageDaily"."completionTokens" + EXCLUDED."completionTokens"`);
    } catch {
      // Put it back for the next flush rather than lose it.
      const back = pending.get(key) ?? { count: 0, totalMs: 0, promptTokens: 0, completionTokens: 0 };
      pending.set(key, { count: back.count + t.count, totalMs: back.totalMs + t.totalMs, promptTokens: back.promptTokens + t.promptTokens, completionTokens: back.completionTokens + t.completionTokens });
    }
  }
}

export function startUsageFlusher(prisma: UsageDb, everyMs = 60_000) {
  const timer = setInterval(() => { void flushUsage(prisma); }, everyMs);
  timer.unref?.();
  const onExit = () => { void flushUsage(prisma); };
  process.once("SIGTERM", onExit);
  return () => clearInterval(timer);
}

// Which requests the statistics count (exact method + path). Anything that
// answers 5xx is also counted under "<kind>:error" and "http_5xx".
export const TRACKED_REQUESTS: Readonly<Record<string, string>> = Object.freeze({
  "GET /search": "search",
  "GET /foods": "food_search",
  "POST /meal-input/interpret": "interpret",
  "POST /meal-input/transcribe": "voice",
  "POST /foods/resolve-external": "external_lookup",
  "POST /recipes/import-url/preview": "recipe_import",
  "POST /meals": "meal_saved",
  "POST /auth/register": "register",
  "POST /auth/login": "login",
  "POST /feedback": "feedback",
  "POST /auth/password-reset/request": "reset_request",
  "GET /meals/dinner-suggestions": "dinner_suggestions",
  "POST /meal-plans": "meal_plan",
  "POST /public/try": "public_try"
});

export function usageMiddleware(count: typeof countUsage = countUsage) {
  return (req: { method: string; path: string }, res: { statusCode: number; on(event: "finish", cb: () => void): void }, next: () => void) => {
    const started = Date.now();
    res.on("finish", () => {
      const kind = TRACKED_REQUESTS[`${req.method} ${req.path}`];
      const failed = res.statusCode >= 500;
      if (kind) count(failed ? `${kind}:error` : kind, { ms: Date.now() - started });
      if (failed) count("http_5xx");
    });
    next();
  };
}
