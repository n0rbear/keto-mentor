import { describe, expect, it } from "vitest";
import { resolveDiaryDateRange } from "./diary-date.js";

describe("resolveDiaryDateRange", () => {
  it("defaults to today in UTC when no params are given", () => {
    const now = new Date("2026-09-06T12:00:00Z");
    const range = resolveDiaryDateRange({}, now);
    expect(range.date).toBe("2026-09-06");
    expect(range.start.toISOString()).toBe("2026-09-06T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-07T00:00:00.000Z");
  });

  it("resolves an explicit valid date", () => {
    const range = resolveDiaryDateRange({ date: "2026-01-15" }, new Date("2026-09-06T12:00:00Z"));
    expect(range.date).toBe("2026-01-15");
    expect(range.start.toISOString()).toBe("2026-01-15T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-01-16T00:00:00.000Z");
  });

  it("rejects a malformed date string", () => {
    expect(() => resolveDiaryDateRange({ date: "not-a-date" })).toThrow("invalid_date");
    expect(() => resolveDiaryDateRange({ date: "2026-9-6" })).toThrow("invalid_date");
  });

  it("rejects a calendar date that doesn't exist", () => {
    expect(() => resolveDiaryDateRange({ date: "2026-02-30" })).toThrow("invalid_date");
    expect(() => resolveDiaryDateRange({ date: "2026-13-01" })).toThrow("invalid_date");
  });

  it("rejects an out-of-range timezone offset", () => {
    expect(() => resolveDiaryDateRange({ date: "2026-09-06", tzOffsetMinutes: "10000" })).toThrow("invalid_timezone_offset");
    expect(() => resolveDiaryDateRange({ date: "2026-09-06", tzOffsetMinutes: "not-a-number" })).toThrow("invalid_timezone_offset");
  });

  it("rejects a future date relative to now", () => {
    const now = new Date("2026-09-06T12:00:00Z");
    expect(() => resolveDiaryDateRange({ date: "2026-09-07" }, now)).toThrow("future_date");
  });

  it("does not reject today itself as a future date", () => {
    const now = new Date("2026-09-06T00:00:01Z");
    expect(() => resolveDiaryDateRange({ date: "2026-09-06" }, now)).not.toThrow();
  });

  describe("timezone boundary behavior (UTC+2 / -120 minutes, matching German summer time)", () => {
    const TZ = "-120";

    it("keeps a just-after-local-midnight meal on the correct local day", () => {
      // 2026-09-06T22:30:00Z = 2026-09-07T00:30 CEST — just after local midnight.
      const range = resolveDiaryDateRange({ date: "2026-09-07", tzOffsetMinutes: TZ }, new Date("2026-09-07T22:00:00Z"));
      const mealAt = new Date("2026-09-06T22:30:00Z");
      expect(mealAt >= range.start && mealAt < range.end).toBe(true);
    });

    it("excludes a meal that has already rolled into the next local day", () => {
      // 2026-09-07T22:30:00Z = 2026-09-08T00:30 CEST — belongs to the 8th locally, not the 7th.
      const range = resolveDiaryDateRange({ date: "2026-09-07", tzOffsetMinutes: TZ }, new Date("2026-09-07T22:00:00Z"));
      const mealAt = new Date("2026-09-07T22:30:00Z");
      expect(mealAt >= range.start && mealAt < range.end).toBe(false);
    });

    it("resolves the default 'today' using the caller's timezone, not UTC's", () => {
      // 2026-09-05T23:30:00Z = 2026-09-06T01:30 CEST — already the 6th locally,
      // even though it is still the 5th in UTC.
      const now = new Date("2026-09-05T23:30:00Z");
      const range = resolveDiaryDateRange({ tzOffsetMinutes: TZ }, now);
      expect(range.date).toBe("2026-09-06");
    });
  });
});
