import { describe, expect, it } from "vitest";
import { resolveWeekRange } from "./diary-date.js";

describe("resolveWeekRange", () => {
  it("resolves the Monday-Sunday week containing a mid-week date", () => {
    // 2026-09-09 is a Wednesday.
    const week = resolveWeekRange({ date: "2026-09-09" }, new Date("2026-09-10T12:00:00Z"));
    expect(week.weekStart).toBe("2026-09-07"); // Monday
    expect(week.weekEnd).toBe("2026-09-13"); // Sunday
    expect(week.days).toEqual(["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"]);
    expect(week.start.toISOString()).toBe("2026-09-07T00:00:00.000Z");
    expect(week.end.toISOString()).toBe("2026-09-14T00:00:00.000Z");
  });

  it("resolves a date that already is a Monday as the start of its own week", () => {
    const week = resolveWeekRange({ date: "2026-09-07" }, new Date("2026-09-10T12:00:00Z"));
    expect(week.weekStart).toBe("2026-09-07");
  });

  it("resolves a date that is a Sunday as the end of its own week", () => {
    const week = resolveWeekRange({ date: "2026-09-13" }, new Date("2026-09-13T23:00:00Z"));
    expect(week.weekStart).toBe("2026-09-07");
    expect(week.weekEnd).toBe("2026-09-13");
  });

  it("navigates to the previous week correctly", () => {
    const week = resolveWeekRange({ date: "2026-08-31" }, new Date("2026-09-10T12:00:00Z"));
    expect(week.weekStart).toBe("2026-08-31"); // Monday
    expect(week.weekEnd).toBe("2026-09-06");
  });

  it("resolves a week that crosses a month boundary", () => {
    const week = resolveWeekRange({ date: "2026-09-01" }, new Date("2026-09-10T12:00:00Z"));
    expect(week.weekStart).toBe("2026-08-31");
    expect(week.days).toContain("2026-09-01");
    expect(week.days).toContain("2026-08-31");
  });

  it("resolves a week that crosses a year boundary", () => {
    // 2027-01-01 is a Friday; its week starts Monday 2026-12-28.
    const week = resolveWeekRange({ date: "2027-01-01" }, new Date("2027-01-02T12:00:00Z"));
    expect(week.weekStart).toBe("2026-12-28");
    expect(week.weekEnd).toBe("2027-01-03");
    expect(week.days).toEqual(["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
  });

  it("defaults to the week containing today when no date is given", () => {
    const week = resolveWeekRange({}, new Date("2026-09-09T12:00:00Z"));
    expect(week.weekStart).toBe("2026-09-07");
  });

  it("rejects a malformed date string", () => {
    expect(() => resolveWeekRange({ date: "not-a-date" })).toThrow("invalid_date");
  });

  it("rejects a calendar date that doesn't exist", () => {
    expect(() => resolveWeekRange({ date: "2026-02-30" })).toThrow("invalid_date");
  });

  it("rejects an out-of-range timezone offset", () => {
    expect(() => resolveWeekRange({ date: "2026-09-09", tzOffsetMinutes: "10000" })).toThrow("invalid_timezone_offset");
  });

  it("rejects navigating into an entirely future week", () => {
    const now = new Date("2026-09-10T12:00:00Z"); // within the week of 2026-09-07
    expect(() => resolveWeekRange({ date: "2026-09-14" }, now)).toThrow("future_week"); // next Monday
  });

  it("allows the current week even though it contains future days", () => {
    const now = new Date("2026-09-08T00:00:01Z"); // Tuesday, just after the week's Monday started
    expect(() => resolveWeekRange({ date: "2026-09-07" }, now)).not.toThrow();
  });

  describe("timezone boundary behavior (UTC+2 / -120 minutes)", () => {
    const TZ = "-120";

    it("keeps a just-after-local-midnight Monday meal inside the correct week", () => {
      // 2026-09-06T22:30:00Z = 2026-09-07T00:30 CEST — just after local Monday midnight.
      const week = resolveWeekRange({ date: "2026-09-07", tzOffsetMinutes: TZ }, new Date("2026-09-10T12:00:00Z"));
      const mealAt = new Date("2026-09-06T22:30:00Z");
      expect(mealAt >= week.start && mealAt < week.end).toBe(true);
    });

    it("excludes a meal that has already rolled into the following Monday locally", () => {
      // 2026-09-13T22:30:00Z = 2026-09-14T00:30 CEST — the following Monday locally.
      const week = resolveWeekRange({ date: "2026-09-07", tzOffsetMinutes: TZ }, new Date("2026-09-10T12:00:00Z"));
      const mealAt = new Date("2026-09-13T22:30:00Z");
      expect(mealAt >= week.start && mealAt < week.end).toBe(false);
    });

    it("resolves the default week using the caller's timezone, not UTC's", () => {
      // 2026-09-06T23:30:00Z = 2026-09-07T01:30 CEST — already Monday locally.
      const now = new Date("2026-09-06T23:30:00Z");
      const week = resolveWeekRange({ tzOffsetMinutes: TZ }, now);
      expect(week.weekStart).toBe("2026-09-07");
    });
  });

  describe("UTC+1 boundary behavior (-60 minutes)", () => {
    it("resolves the week correctly at the UTC+1 offset", () => {
      const week = resolveWeekRange({ date: "2026-09-09", tzOffsetMinutes: "-60" }, new Date("2026-09-10T12:00:00Z"));
      expect(week.weekStart).toBe("2026-09-07");
      expect(week.weekEnd).toBe("2026-09-13");
    });
  });
});
