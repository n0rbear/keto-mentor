export type DiaryDateRange = { start: Date; end: Date; date: string };
export type DiaryWeekRange = { start: Date; end: Date; weekStart: string; weekEnd: string; days: string[] };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TZ_OFFSET_MINUTES = 14 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

function invalidDateError() {
  return Object.assign(new Error("invalid_date"), { status: 400, publicCode: "invalid_date" });
}

function invalidTimezoneError() {
  return Object.assign(new Error("invalid_timezone_offset"), { status: 400, publicCode: "invalid_timezone_offset" });
}

function futureDateError() {
  return Object.assign(new Error("future_date"), { status: 400, publicCode: "future_date" });
}

function futureWeekError() {
  return Object.assign(new Error("future_week"), { status: 400, publicCode: "future_week" });
}

function toDateString(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
  const end = new Date(start.getTime() + DAY_MS);
  const date = toDateString(year, month, day);
  return { start, end, date };
}

/**
 * Resolves the [start, end) UTC instant range for one Monday-Sunday week in
 * the caller's local timezone (the European convention used throughout the
 * HU/DE-first UI), plus each day's canonical "YYYY-MM-DD".
 *
 * Uses the same `tzOffsetMinutes` fixed-offset convention as
 * {@link resolveDiaryDateRange}. Only rejects a week whose Monday is still
 * entirely in the future — the *current* week (which may contain days later
 * than today) is always navigable, so a user can never be blocked from
 * seeing "this week" just because it isn't over yet.
 */
export function resolveWeekRange(
  params: { date?: string; tzOffsetMinutes?: string },
  now: Date = new Date()
): DiaryWeekRange {
  let tzOffsetMinutes = 0;
  if (params.tzOffsetMinutes !== undefined) {
    tzOffsetMinutes = Number(params.tzOffsetMinutes);
    if (!Number.isFinite(tzOffsetMinutes) || Math.abs(tzOffsetMinutes) > MAX_TZ_OFFSET_MINUTES) throw invalidTimezoneError();
  }

  let anchorYear: number, anchorMonth: number, anchorDay: number;
  if (params.date !== undefined) {
    if (!DATE_PATTERN.test(params.date)) throw invalidDateError();
    const [y, m, d] = params.date.split("-").map(Number);
    const probe = new Date(Date.UTC(y, m - 1, d));
    if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) throw invalidDateError();
    anchorYear = y; anchorMonth = m; anchorDay = d;
  } else {
    const localNow = new Date(now.getTime() - tzOffsetMinutes * 60_000);
    anchorYear = localNow.getUTCFullYear();
    anchorMonth = localNow.getUTCMonth() + 1;
    anchorDay = localNow.getUTCDate();
  }

  const anchorUtcMidnight = new Date(Date.UTC(anchorYear, anchorMonth - 1, anchorDay));
  const anchorDow = anchorUtcMidnight.getUTCDay(); // 0=Sunday..6=Saturday
  const daysSinceMonday = (anchorDow + 6) % 7;
  const mondayUtcMidnight = new Date(anchorUtcMidnight.getTime() - daysSinceMonday * DAY_MS);

  const start = new Date(mondayUtcMidnight.getTime() + tzOffsetMinutes * 60_000);
  if (start.getTime() > now.getTime()) throw futureWeekError();
  const end = new Date(start.getTime() + 7 * DAY_MS);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dayUtcMidnight = new Date(mondayUtcMidnight.getTime() + i * DAY_MS);
    days.push(toDateString(dayUtcMidnight.getUTCFullYear(), dayUtcMidnight.getUTCMonth() + 1, dayUtcMidnight.getUTCDate()));
  }

  return { start, end, weekStart: days[0], weekEnd: days[6], days };
}
