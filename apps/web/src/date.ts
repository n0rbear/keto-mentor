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
