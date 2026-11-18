/**
 * Date display helpers. The API returns UTC ISO-8601 strings ending in "Z"; these helpers show
 * them in the user's local time zone.
 */

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

function toDate(value: string | Date): Date | null {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "18 Nov 2026, 3:12 PM" in the user's locale and time zone. */
export function formatDateTime(value: string | Date): string {
    const date = toDate(value);
    return date ? dateTimeFormat.format(date) : "";
}

const timeFormat = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

/** Chat message time: "3:12 PM" for today, otherwise date and time (local time zone). */
export function formatMessageTime(value: string | Date, now: Date = new Date()): string {
    const date = toDate(value);
    if (!date) return "";
    return date.toDateString() === now.toDateString() ? timeFormat.format(date) : dateTimeFormat.format(date);
}

// ---------------------------------------------------------------- date-only values

const dateOnlyFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" });

/**
 * Formats a calendar date that the API stores as midnight UTC (e.g. a study plan's exam date,
 * "2026-12-15T00:00:00Z"). Formatted in UTC so it shows the same day everywhere; formatting it in
 * local time would show the previous day for users west of UTC.
 */
export function formatDateOnly(value: string): string {
    const date = toDate(value);
    return date ? dateOnlyFormat.format(date) : "";
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Today's date in the user's time zone as "YYYY-MM-DD" (for <input type="date">). */
export function todayLocalIsoDate(now: Date = new Date()): string {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** UTC today plus `years`, as "YYYY-MM-DD" — the same calculation the API uses for its upper limit. */
export function utcIsoDatePlusYears(years: number, now: Date = new Date()): string {
    return `${now.getUTCFullYear() + years}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

/**
 * Whole days from the user's local today until a midnight-UTC calendar date.
 * 0 = today, negative = in the past.
 */
export function daysUntilDate(value: string, now: Date = new Date()): number | null {
    const date = toDate(value);
    if (!date) return null;

    const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / 86_400_000);
}

/** e.g. "in 27 days", "tomorrow", "today", "3 days ago" for a calendar date. */
export function describeDaysUntil(days: number | null): string {
    if (days === null) return "";
    if (days === 0) return "today";
    return relativeFormat.format(days, "day");
}

// ---------------------------------------------------------------- relative time

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 24 * 60 * 60],
    ["month", 30 * 24 * 60 * 60],
    ["week", 7 * 24 * 60 * 60],
    ["day", 24 * 60 * 60],
    ["hour", 60 * 60],
    ["minute", 60],
];

/** e.g. "just now", "5 minutes ago", "yesterday". */
export function formatRelativeTime(value: string | Date, now: Date = new Date()): string {
    const date = toDate(value);
    if (!date) return "";

    const seconds = Math.round((date.getTime() - now.getTime()) / 1000);

    if (Math.abs(seconds) < 60) return "just now";

    for (const [unit, unitSeconds] of UNITS) {
        if (Math.abs(seconds) >= unitSeconds) {
            return relativeFormat.format(Math.round(seconds / unitSeconds), unit);
        }
    }

    return "just now";
}
