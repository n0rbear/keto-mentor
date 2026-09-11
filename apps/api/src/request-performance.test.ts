import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONCURRENCY, mapWithConcurrency, timeStage } from "./request-performance.js";

describe("timeStage", () => {
  it("returns the wrapped function's result unchanged", async () => {
    const result = await timeStage("test_stage", async () => 42);
    expect(result).toBe(42);
  });

  it("logs a structured timing_stage line with the stage name and an elapsed ms", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await timeStage("my_stage", async () => "value");
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/^timing_stage stage=my_stage ms=\d+$/));
    spy.mockRestore();
  });

  it("still logs the stage (and rethrows) when the wrapped function throws", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(timeStage("failing_stage", async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/^timing_stage stage=failing_stage ms=\d+$/));
    spy.mockRestore();
  });
});

describe("mapWithConcurrency", () => {
  it("preserves input order in the output regardless of completion order", async () => {
    const delays = [30, 10, 20, 5];
    const result = await mapWithConcurrency(delays, 4, async (ms, index) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return index;
    });
    expect(result).toEqual([0, 1, 2, 3]);
  });

  it("never runs more than `limit` callbacks concurrently", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);
    await mapWithConcurrency(items, 3, async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight -= 1;
    });
    expect(maxInFlight).toBeLessThanOrEqual(3);
    expect(maxInFlight).toBeGreaterThan(1);
  });

  it("still processes every item when the limit exceeds the item count", async () => {
    const result = await mapWithConcurrency([1, 2], 10, async (n) => n * 2);
    expect(result).toEqual([2, 4]);
  });

  it("handles an empty list without error", async () => {
    const result = await mapWithConcurrency([], 3, async () => 1);
    expect(result).toEqual([]);
  });

  it("DEFAULT_CONCURRENCY is a small positive bound, not unlimited", () => {
    expect(DEFAULT_CONCURRENCY).toBeGreaterThan(0);
    expect(DEFAULT_CONCURRENCY).toBeLessThanOrEqual(5);
  });
});
