import { describe, expect, it, vi } from "vitest";
import { keepAwakeUrls, pingOnce, startKeepAwake } from "./keep-awake.js";

describe("keep awake", () => {
  it("defaults to norbapp.com, accepts a list, ignores non-https and can be turned off", () => {
    expect(keepAwakeUrls(undefined)).toEqual(["https://norbapp.com"]);
    expect(keepAwakeUrls("https://a.example, http://b.example, nope ,https://c.example/x")).toEqual(["https://a.example", "https://c.example/x"]);
    expect(keepAwakeUrls("off")).toEqual([]);
  });

  it("logs only failures, never content", async () => {
    const log = vi.fn();
    await pingOnce(["https://ok.example", "https://down.example", "https://err.example"], (async (url: string) => {
      if (url.includes("err")) throw Object.assign(new Error("x"), { name: "TimeoutError" });
      return new Response("page", { status: url.includes("down") ? 503 : 200 });
    }) as any, log);
    expect(log.mock.calls.map((c) => c[0].replace(/ ms=\d+/, "")).sort()).toEqual(["keep_awake host=down.example status=503", "keep_awake host=err.example failed=TimeoutError"]);
  });

  it("pings at start and then on the interval", () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(async () => new Response("", { status: 200 }));
    const stop = startKeepAwake(["https://norbapp.com"], { fetchImpl: fetchImpl as any, intervalMs: 1000 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    stop();
    vi.advanceTimersByTime(5000);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
});
