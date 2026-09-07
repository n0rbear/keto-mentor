import { describe, expect, it } from "vitest";
import { mondayOf, shiftDate, toDateString, todayLocalDate } from "./date";

describe("diary date helpers", () => {
  it("formats a Date as local YYYY-MM-DD", () => {
    expect(toDateString(new Date(2026, 8, 6))).toBe("2026-09-06");
    expect(toDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("shifts a date forward and backward by whole days", () => {
    expect(shiftDate("2026-09-06", 1)).toBe("2026-09-07");
    expect(shiftDate("2026-09-06", -1)).toBe("2026-09-05");
  });

  it("shifts correctly across a month boundary", () => {
    expect(shiftDate("2026-09-30", 1)).toBe("2026-10-01");
    expect(shiftDate("2026-10-01", -1)).toBe("2026-09-30");
  });

  it("shifts correctly across a year boundary", () => {
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("todayLocalDate matches the current local calendar day", () => {
    expect(todayLocalDate()).toBe(toDateString(new Date()));
  });

  describe("mondayOf", () => {
    it("resolves the Monday of a mid-week date", () => {
      expect(mondayOf("2026-09-09")).toBe("2026-09-07"); // Wednesday -> Monday
    });

    it("resolves a Monday as itself", () => {
      expect(mondayOf("2026-09-07")).toBe("2026-09-07");
    });

    it("resolves a Sunday to the Monday before it", () => {
      expect(mondayOf("2026-09-13")).toBe("2026-09-07");
    });

    it("resolves correctly across a month boundary", () => {
      expect(mondayOf("2026-09-01")).toBe("2026-08-31");
    });

    it("resolves correctly across a year boundary", () => {
      expect(mondayOf("2027-01-01")).toBe("2026-12-28");
    });
  });
});
