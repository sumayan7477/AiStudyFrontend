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
