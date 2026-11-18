import type { Streak, WeeklyDay } from "../types/progress";

/**
 * The API counts days in UTC (DateTime.UtcNow.Date). These helpers use the same UTC calendar so the
 * page never shifts a day for users east or west of UTC.
 */

const DAY_MS = 86_400_000;

function utcMidnight(date: Date, addDays = 0): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + addDays);
}

/** "2026-11-18T00:00:00Z" for the current UTC day. */
export function utcTodayIso(now: Date = new Date()): string {
    return new Date(utcMidnight(now)).toISOString().replace(".000Z", "Z");
}

/** Whole UTC calendar days from `value` to today (0 = today, 1 = yesterday). */
export function utcDaysSince(value: string, now: Date = new Date()): number | null {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return Math.round((utcMidnight(now) - utcMidnight(date)) / DAY_MS);
}

/** True when the API reports no activity at all (LastActiveDate = DateTime.MinValue). */
export function hasNeverBeenActive(streak: Streak): boolean {
    const date = new Date(streak.lastActiveDate);
    return Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1;
}

const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

export interface WeeklyBar {
    /** Day name exactly as returned by the API. */
    day: string;
    activities: number;
    /** Midnight-UTC date of this bar, or null when it cannot be determined safely. */
    date: string | null;
    isToday: boolean;
}

/**
 * Adds the calendar date to each weekly item. The API sends only day names, oldest first, ending with
 * the server's current UTC day. The dates are reconstructed from the browser's UTC clock and accepted
 * only if every day name matches; the neighbouring days are tried too, in case the request crossed
 * UTC midnight or the clocks differ slightly. If nothing matches (e.g. a non-English server culture),
 * no dates are shown rather than wrong ones.
 */
export function buildWeeklyBars(days: WeeklyDay[], now: Date = new Date()): WeeklyBar[] {
    for (const offset of [0, -1, 1]) {
        const end = utcMidnight(now, offset);
        const dates = days.map((_, index) => new Date(end - (days.length - 1 - index) * DAY_MS));
        const matches = dates.every((date, index) => weekdayFormat.format(date).toLowerCase() === days[index].day.trim().toLowerCase());

        if (matches && days.length > 0) {
            return days.map((item, index) => ({
                day: item.day,
                activities: item.activities,
                date: dates[index].toISOString().replace(".000Z", "Z"),
                isToday: offset === 0 && index === days.length - 1,
            }));
        }
    }

    return days.map((item) => ({ day: item.day, activities: item.activities, date: null, isToday: false }));
}
