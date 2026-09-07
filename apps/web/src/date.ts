// Local-calendar-day helpers (never UTC) — the diary date picker and prev/next
// navigation operate on the browser's own local "today", matching what the
// user actually sees on their clock.

export function todayLocalDate(): string {
  return toDateString(new Date());
}

export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

// Monday of the local week containing `dateStr` (Monday-Sunday convention,
// matching the server's /meals/week resolution) — used to detect when the
// selected diary date has moved into a different week than the one on screen.
export function mondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return toDateString(date);
}
