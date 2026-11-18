import type { LucideIcon } from "lucide-react";
import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    FileText,
    History,
    Layers,
    MessageSquare,
    RotateCw,
    Trash2,
} from "lucide-react";

import { formatApiError } from "../../api/errors";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import { useApiQuery } from "../../hooks/useApiQuery";
import { ACTIVITY_LIMIT, activityService } from "../../services/progress.service";
import { formatDateTime, formatRelativeTime } from "../../utils/date";

/**
 * Icon for an activity. The API only sends a title, so the icon is chosen from the fixed start of the
 * titles the backend writes ("Generated quiz on {topic}", "Deleted a quiz", ...). Only that prefix is
 * checked, so a topic like "quiz techniques" cannot change the icon. The title is always shown unchanged.
 */
const ICONS: [prefix: string, icon: LucideIcon][] = [
    ["deleted", Trash2],
    ["completed a quiz", CheckCircle2],
    ["generated quiz", BookOpen],
    ["generated flashcards", Layers],
    ["generated study plan", CalendarDays],
    ["generated ai notes", FileText],
    ["asked the ai assistant", MessageSquare],
];

function iconFor(title: string): LucideIcon {
    const text = title.trim().toLowerCase();
    return ICONS.find(([prefix]) => text.startsWith(prefix))?.[1] ?? History;
}

export default function ActivityPage() {
    const { data, error, loading, refetch } = useApiQuery("activity", activityService.list);
    const showError = error && !data && error.kind !== "unauthorized";
    const activities = data ?? [];

    return (
        <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Activity</h1>
                    <p className="mt-1 text-gray-600">Your most recent study activity.</p>
                </div>
                {data && (
                    <button
                        type="button"
                        onClick={refetch}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm text-gray-700 hover:text-indigo-600 disabled:opacity-60"
                    >
                        <RotateCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
                        Refresh
                    </button>
                )}
            </div>

            {loading && !data && (
                <div className="rounded-lg bg-white p-10 shadow" aria-busy="true">
                    <Loader size="lg" />
                    <p className="text-center text-sm text-gray-500">Loading your activity...</p>
                </div>
            )}

            {showError && <ErrorState title="Could not load your activity" message={formatApiError(error)} onRetry={refetch} retrying={loading} />}

            {error && data && error.kind !== "unauthorized" && (
                <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">Could not refresh: {formatApiError(error)}</p>
            )}

            {data && (
                <section aria-labelledby="activity-heading" className="rounded-lg bg-white shadow">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-4">
                        <h2 id="activity-heading" className="text-lg font-semibold">Recent activity</h2>
                        {activities.length > 0 && (
                            <p className="text-sm text-gray-500" data-testid="activity-count">
                                {activities.length >= ACTIVITY_LIMIT
                                    ? `Showing your latest ${ACTIVITY_LIMIT} activities`
                                    : `${activities.length} ${activities.length === 1 ? "activity" : "activities"}`}
                            </p>
                        )}
                    </div>

                    {activities.length === 0 ? (
                        <EmptyState
                            icon={History}
                            title="No activity yet"
                            message="Generate notes, quizzes, flashcards or study plans, or chat with the AI, and your activity will appear here."
                        />
                    ) : (
                        <ol className="divide-y">
                            {activities.map((activity, index) => {
                                const Icon = iconFor(activity.title);
                                return (
                                    <li key={`${activity.createdAt}-${index}`} className="flex items-start gap-3 px-5 py-3">
                                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                            <Icon size={16} aria-hidden="true" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="break-words text-gray-800">{activity.title}</p>
                                            <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)} className="text-sm text-gray-500">
                                                {formatDateTime(activity.createdAt)} · {formatRelativeTime(activity.createdAt)}
                                            </time>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </section>
            )}
        </div>
    );
}
