/**
 * Owner-beta blocker (2026-09-12): "minden nagyon lassú" (everything is very
 * slow) — real production waterfalls (checkpoint H.2 smoke tests) showed
 * single meal-input requests taking 15-84 seconds with zero visibility into
 * WHICH stage actually consumed that time. This is a lightweight, additive,
 * structured-log timing wrapper used at every major await boundary across
 * the resolution pipeline (local search, food-understanding AI, search-
 * intent AI, external USDA/BLS lookup, semantic candidate gate AI,
 * candidate localization AI, quantity AI) — deliberately NOT a new function
 * parameter threaded through every signature (that would touch dozens of
 * existing call sites and test fixtures for a purely diagnostic feature);
 * instead each stage logs its own elapsed time as it completes, exactly
 * like the existing logDynamicResolutionOutcome/quantity_ai diagnostics
 * already do in this codebase. Grep production logs for "timing_stage" to
 * reconstruct a request's waterfall.
 */
export async function timeStage<T>(stage: string, fn: () => Promise<T>): Promise<T> {
  const startedAt = performance.now();
  try {
    return await fn();
  } finally {
    console.log(`timing_stage stage=${stage} ms=${Math.round(performance.now() - startedAt)}`);
  }
}

/**
 * Owner-beta performance principle: independent items in one meal may run
 * concurrently, but never unboundedly — an unbounded Promise.all across
 * every item in a meal (each potentially making its own search-intent/
 * semantic-gate/quantity AI call on a local miss) is exactly the kind of
 * provider burst that has repeatedly triggered Groq/OpenRouter 429s in this
 * project's own history. A small fixed concurrency window gets the latency
 * benefit of overlap without ever firing more than DEFAULT_CONCURRENCY
 * simultaneous AI/external calls from a single request.
 */
export const DEFAULT_CONCURRENCY = 3;

export async function mapWithConcurrency<TIn, TOut>(items: readonly TIn[], limit: number, fn: (item: TIn, index: number) => Promise<TOut>): Promise<TOut[]> {
  const results: TOut[] = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }
  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
