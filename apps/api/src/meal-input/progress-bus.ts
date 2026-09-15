import { EventEmitter } from "node:events";

// Owner-beta (2026-09-12): truthful, real-stage progress for the UI during
// long interpretation operations — see interpret.ts and
// recipe-discovery-fallback.ts call sites, which publish a stage ONLY
// immediately before the corresponding real awaited work begins. Never a
// fake percentage, never a timer-driven rotation.
export type ProgressStage =
  | "food_understanding"
  | "local_food_search"
  | "local_recipe_search"
  | "recipe_discovery"
  | "quantity_resolution"
  | "finalizing";

type Entry = { emitter: EventEmitter; lastStage: ProgressStage | null; timeout: NodeJS.Timeout };

// Single-process, in-memory only — fine for the current single-instance
// Render deployment. A horizontally-scaled deployment would need a shared
// pub/sub (e.g. Redis) instead; noted here rather than built speculatively.
const TTL_MS = 60_000;
const entries = new Map<string, Entry>();

function getOrCreate(operationId: string): Entry {
  let entry = entries.get(operationId);
  if (!entry) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(5);
    const timeout = setTimeout(() => entries.delete(operationId), TTL_MS);
    timeout.unref?.();
    entry = { emitter, lastStage: null, timeout };
    entries.set(operationId, entry);
  }
  return entry;
}

/**
 * Category-only — a bare stage name, never user meal text, provider
 * identity, prompts, or any other diagnostic detail. `operationId` is a
 * client-generated, unauthenticated-adjacent correlator (validated as a
 * bounded alphanumeric string by mealInterpretationSchema) — never used for
 * authorization, only as an in-memory event-stream key. A missing/undefined
 * operationId (the client chose not to open a progress stream) makes this a
 * complete no-op.
 */
export function publishProgress(operationId: string | undefined, stage: ProgressStage): void {
  if (!operationId) return;
  const entry = getOrCreate(operationId);
  entry.lastStage = stage;
  entry.emitter.emit("stage", stage);
}

/** Immediately replays the current stage (if any) so a subscriber that connects a moment late still sees where things stand, then attaches for future stages. Returns an unsubscribe function. */
export function subscribeProgress(operationId: string, onStage: (stage: ProgressStage) => void): () => void {
  const entry = getOrCreate(operationId);
  if (entry.lastStage) onStage(entry.lastStage);
  entry.emitter.on("stage", onStage);
  return () => entry.emitter.off("stage", onStage);
}

/** Called once the owning request completes — frees the entry immediately rather than waiting out the full TTL. */
export function closeProgress(operationId: string | undefined): void {
  if (!operationId) return;
  const entry = entries.get(operationId);
  if (!entry) return;
  clearTimeout(entry.timeout);
  entries.delete(operationId);
}
