import { formatDateOnly, formatShortDateUtc } from "../../utils/date";
import type { WeeklyBar } from "../../utils/progress";

interface WeeklyChartProps {
    bars: WeeklyBar[];
}

/**
 * Bar chart of activities per day. Bars start at zero and every bar shows its exact value, so the
 * chart cannot exaggerate differences. Screen readers get the same data as a table.
 * Plain HTML/CSS: no chart library needed.
 */
export default function WeeklyChart({ bars }: WeeklyChartProps) {
    const max = Math.max(0, ...bars.map((bar) => bar.activities));
    const total = bars.reduce((sum, bar) => sum + bar.activities, 0);

    return (
        <figure>
            <div aria-hidden="true" className="flex h-52 items-stretch gap-1 border-b border-gray-300 sm:gap-3" data-testid="weekly-bars">
                {bars.map((bar, index) => {
                    const height = max > 0 ? (bar.activities / max) * 100 : 0;
                    return (
                        <div key={`${bar.day}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end" data-value={bar.activities}>
                            <span className={`mb-1 text-xs font-semibold ${bar.activities === 0 ? "text-gray-400" : "text-gray-700"}`}>
                                {bar.activities}
                            </span>
                            <div className="flex h-40 w-full items-end justify-center">
                                {bar.activities > 0 ? (
                                    <div
                                        className={`w-full max-w-[3rem] rounded-t ${bar.isToday ? "bg-indigo-600" : "bg-indigo-300"}`}
                                        style={{ height: `${height}%` }}
                                        data-bar-height={Math.round(height)}
                                    />
                                ) : (
                                    // Zero is shown as an empty column, not as a small bar.
                                    <div className="h-px w-full max-w-[3rem] bg-gray-200" data-bar-height={0} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div aria-hidden="true" className="mt-2 flex gap-1 sm:gap-3">
                {bars.map((bar, index) => (
                    <div key={`${bar.day}-${index}`} className="min-w-0 flex-1 text-center">
                        <p className={`truncate text-xs font-medium ${bar.isToday ? "text-indigo-700" : "text-gray-700"}`}>
                            {bar.isToday ? "Today" : bar.day}
                        </p>
                        {bar.date && <p className="truncate text-[11px] text-gray-500">{formatShortDateUtc(bar.date)}</p>}
                    </div>
                ))}
            </div>

            <figcaption className="mt-3 text-sm text-gray-600" data-testid="weekly-caption">
                {total === 0
                    ? "No activity in the last 7 days."
                    : `${total} ${total === 1 ? "activity" : "activities"} in the last 7 days.`}{" "}
                Days follow the server's UTC calendar.
            </figcaption>

            <table className="sr-only">
                <caption>Activities per day, last 7 days (UTC)</caption>
                <thead>
                    <tr>
                        <th scope="col">Day</th>
                        <th scope="col">Activities</th>
                    </tr>
                </thead>
                <tbody>
                    {bars.map((bar, index) => (
                        <tr key={`${bar.day}-${index}`}>
                            <th scope="row">{bar.date ? `${bar.day}, ${formatDateOnly(bar.date)}${bar.isToday ? " (today)" : ""}` : bar.day}</th>
                            <td>{bar.activities}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}
