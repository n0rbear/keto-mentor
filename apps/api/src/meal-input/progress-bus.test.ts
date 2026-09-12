import { describe, expect, it, vi } from "vitest";
import { closeProgress, publishProgress, subscribeProgress } from "./progress-bus.js";

describe("progress-bus", () => {
  it("delivers published stages, in order, to a subscriber", () => {
    const id = crypto.randomUUID();
    const seen: string[] = [];
    const unsubscribe = subscribeProgress(id, (stage) => seen.push(stage));
    publishProgress(id, "local_food_search");
    publishProgress(id, "food_understanding");
    publishProgress(id, "finalizing");
    expect(seen).toEqual(["local_food_search", "food_understanding", "finalizing"]);
    unsubscribe();
    closeProgress(id);
  });

  it("a subscriber that connects after the first stage still sees the CURRENT stage immediately (no dropped early event)", () => {
    const id = crypto.randomUUID();
    publishProgress(id, "local_food_search");
    const seen: string[] = [];
    subscribeProgress(id, (stage) => seen.push(stage));
    expect(seen).toEqual(["local_food_search"]);
    closeProgress(id);
  });

  it("publishing with no operationId is a safe no-op", () => {
    expect(() => publishProgress(undefined, "finalizing")).not.toThrow();
  });

  it("unsubscribe stops further delivery to that listener", () => {
    const id = crypto.randomUUID();
    const onStage = vi.fn();
    const unsubscribe = subscribeProgress(id, onStage);
    publishProgress(id, "local_food_search");
    unsubscribe();
    publishProgress(id, "finalizing");
    expect(onStage).toHaveBeenCalledOnce();
    expect(onStage).toHaveBeenCalledWith("local_food_search");
    closeProgress(id);
  });

  it("closeProgress clears replay state — a NEW subscriber after close sees nothing until a fresh publish", () => {
    const id = crypto.randomUUID();
    publishProgress(id, "finalizing");
    closeProgress(id);
    const seen: string[] = [];
    subscribeProgress(id, (stage) => seen.push(stage));
    expect(seen).toEqual([]);
    closeProgress(id);
  });

  it("category-only: never carries anything beyond the bare stage name", () => {
    const id = crypto.randomUUID();
    const seen: unknown[] = [];
    subscribeProgress(id, (stage) => seen.push(stage));
    publishProgress(id, "recipe_discovery");
    expect(seen).toEqual(["recipe_discovery"]);
    expect(typeof seen[0]).toBe("string");
    closeProgress(id);
  });
});
