export type DiaryDateRange = { start: Date; end: Date; date: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TZ_OFFSET_MINUTES = 14 * 60;

function invalidDateError() {
  return Object.assign(new Error("invalid_date"), { status: 400, publicCode: "invalid_date" });
}

function invalidTimezoneError() {
  return Object.assign(new Error("invalid_timezone_offset"), { status: 400, publicCode: "invalid_timezone_offset" });
}

function futureDateError() {
  return Object.assign(new Error("future_date"), { status: 400, publicCode: "future_date" });
}

/**
 * Resolves the [start, end) UTC instant range for one calendar day in the
 * caller's local timezone, plus the canonical "YYYY-MM-DD" for that day.
 *
 * `tzOffsetMinutes` follows the `Date.prototype.getTimezoneOffset()` convention
 * (minutes to ADD to local time to reach UTC — e.g. -120 for UTC+2), so the web
 * client can pass its own `getTimezoneOffset()` value straight through. This
 * keeps a late-night meal on the user's actual calendar day instead of silently
 * depending on the server's own timezone.
 */
export function resolveDiaryDateRange(
  params: { date?: string; tzOffsetMinutes?: string },
  now: Date = new Date()
): DiaryDateRange {
  let tzOffsetMinutes = 0;
  if (params.tzOffsetMinutes !== undefined) {
    tzOffsetMinutes = Number(params.tzOffsetMinutes);
    if (!Number.isFinite(tzOffsetMinutes) || Math.abs(tzOffsetMinutes) > MAX_TZ_OFFSET_MINUTES) throw invalidTimezoneError();
  }

  let year: number, month: number, day: number;
  if (params.date !== undefined) {
    if (!DATE_PATTERN.test(params.date)) throw invalidDateError();
    const [y, m, d] = params.date.split("-").map(Number);
    // Reject calendar dates that don't round-trip (e.g. 2026-02-30).
    const probe = new Date(Date.UTC(y, m - 1, d));
    if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) throw invalidDateError();
    year = y; month = m; day = d;
  } else {
    // Default to "today" in the caller's timezone: shift `now` by the offset
    // before reading its (UTC) calendar fields back out.
    const localNow = new Date(now.getTime() - tzOffsetMinutes * 60_000);
    year = localNow.getUTCFullYear();
    month = localNow.getUTCMonth() + 1;
    day = localNow.getUTCDate();
  }

  const start = new Date(Date.UTC(year, month - 1, day) + tzOffsetMinutes * 60_000);
  if (start.getTime() > now.getTime()) throw futureDateError();
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const date = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { start, end, date };
}
