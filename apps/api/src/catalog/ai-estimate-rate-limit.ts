// The final, most expensive fallback tier — only ever reached after local,
// authoritative-adapter, AND web-evidence resolution have all genuinely
// failed. Its own independent, tight budget (separate from
// WebEvidenceFallbackRateLimiter) so a user spamming unresolvable queries
// can't run up AI estimation calls at a higher rate than intended, even if
// they've already exhausted the web-evidence budget for other queries.
import { USER_FALLBACK_WINDOWS, UserUsageBudget } from "./usage-budget.js";

// Per user: 30 per hour and 100 per day (roadmap E3, owner-approved
// 2026-09-26); recipes add their own per-recipe cap on top.
export const AI_ESTIMATE_RATE_LIMIT = USER_FALLBACK_WINDOWS;

export class AiEstimateRateLimiter extends UserUsageBudget {
  constructor(now: () => number = Date.now) { super(AI_ESTIMATE_RATE_LIMIT, now); }
}
