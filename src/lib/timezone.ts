/**
 * The store operates in the Philippines (Asia/Manila, UTC+8, no DST — the offset is fixed
 * year-round). The app server (Vercel) runs in UTC, so both date-boundary math (Prisma
 * `gte`/`lte` filters for "today"/"this month"/etc.) and on-screen date/time display need to
 * be anchored to Manila explicitly rather than the server's own timezone.
 */
export const MANILA_TIMEZONE = "Asia/Manila";
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** The Manila-local calendar date (year/zero-based month/day) that `date` falls on. */
export function manilaYearMonthDay(date: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month") - 1, day: get("day") };
}

/** Real UTC instant corresponding to 00:00:00.000 Manila time on the day `date` falls on. */
export function manilaDayStart(date: Date = new Date()): Date {
  const { year, month, day } = manilaYearMonthDay(date);
  return new Date(Date.UTC(year, month, day) - MANILA_OFFSET_MS);
}

/** Real UTC instant corresponding to 23:59:59.999 Manila time on the day `date` falls on. */
export function manilaDayEnd(date: Date = new Date()): Date {
  const { year, month, day } = manilaYearMonthDay(date);
  return new Date(Date.UTC(year, month, day + 1) - MANILA_OFFSET_MS - 1);
}

/** Start/end of the Manila calendar month that `date` falls in. */
export function manilaMonthRange(date: Date = new Date()): { from: Date; to: Date } {
  const { year, month } = manilaYearMonthDay(date);
  return {
    from: new Date(Date.UTC(year, month, 1) - MANILA_OFFSET_MS),
    to: new Date(Date.UTC(year, month + 1, 1) - MANILA_OFFSET_MS - 1),
  };
}

/** Start/end of the Manila calendar year that `date` falls in. */
export function manilaYearRange(date: Date = new Date()): { from: Date; to: Date } {
  const { year } = manilaYearMonthDay(date);
  return {
    from: new Date(Date.UTC(year, 0, 1) - MANILA_OFFSET_MS),
    to: new Date(Date.UTC(year + 1, 0, 1) - MANILA_OFFSET_MS - 1),
  };
}

/** Parses a `YYYY-MM-DD` `<input type="date">` value as that calendar day in Manila time. */
export function manilaDateFromInput(value: string): Date {
  return new Date(`${value}T00:00:00+08:00`);
}

export function formatManilaDateTime(date: Date): string {
  return date.toLocaleString("en-PH", { timeZone: MANILA_TIMEZONE });
}

export function formatManilaDate(date: Date): string {
  return date.toLocaleDateString("en-PH", { timeZone: MANILA_TIMEZONE });
}

export function formatManilaTime(date: Date): string {
  return date.toLocaleTimeString("en-PH", { timeZone: MANILA_TIMEZONE });
}
