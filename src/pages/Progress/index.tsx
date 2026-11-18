import type { ReactNode } from "react";
import {
    Activity,
    BarChart3,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Flame,
    Layers,
    MessageSquare,
    Percent,
    RotateCw,
} from "lucide-react";

import { formatApiError } from "../../api/errors";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import StatCard from "../../components/common/StatCard";
import WeeklyChart from "../../components/progress/WeeklyChart";
import { useApiQuery, type ApiQueryState } from "../../hooks/useApiQuery";
import dashboardService from "../../services/dashboard.service";
import progressService from "../../services/progress.service";
import type { DashboardResponse } from "../../types/dashboard";
import type { ProgressOverview, Streak, TodayStats } from "../../types/progress";
import { describeDaysUntil, formatDateOnly } from "../../utils/date";
import { buildWeeklyBars, hasNeverBeenActive, utcDaysSince, utcTodayIso } from "../../utils/progress";

export default function ProgressPage() {
    // One request per endpoint; each section shows its own loading/error state.
    const overview = useApiQuery("progress", progressService.overview);
    const stats = useApiQuery("progress:stats", progressService.stats);
    const weekly = useApiQuery("progress:weekly", progressService.weekly);
    const streak = useApiQuery("progress:streak", progressService.streak);
    // The flashcard count is not part of /progress; the dashboard endpoint has it.
    const dashboard = useApiQuery("dashboard", dashboardService.get);

    const queries = [overview, stats, weekly, streak, dashboard];
    const anyLoading = queries.some((q) => q.loading);
    const anyData = queries.some((q) => q.data !== null);
    const refreshAll = () => queries.forEach((q) => q.refetch());

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Progress</h1>
                    <p className="mt-1 text-gray-600">Your study activity, quiz results and streak.</p>
                </div>
                {anyData && (
                    <button
                        type="button"
                        onClick={refreshAll}
                        disabled={anyLoading}
                        className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm text-gray-700 hover:text-indigo-600 disabled:opacity-60"
                    >
                        <RotateCw size={16} className={anyLoading ? "animate-spin" : ""} aria-hidden="true" />
                        Refresh
                    </button>
                )}
            </div>

            <section aria-labelledby="overview-heading">
                <h2 id="overview-heading" className="mb-3 text-lg font-semibold">Overview</h2>
                <QueryBody query={overview} what="your progress">
                    {(data) => <OverviewCards data={data} flashcards={dashboard} />}
                </QueryBody>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
                <section aria-labelledby="streak-heading" className="rounded-lg bg-white p-5 shadow">
                    <h2 id="streak-heading" className="mb-3 flex items-center gap-2 text-lg font-semibold">
                        <Flame size={20} className="text-orange-500" aria-hidden="true" />
                        Study streak
                    </h2>
                    <QueryBody query={streak} what="your streak">
                        {(data) => <StreakSummary streak={data} />}
                    </QueryBody>
                </section>

                <section aria-labelledby="today-heading" className="rounded-lg bg-white p-5 shadow lg:col-span-2">
                    <h2 id="today-heading" className="text-lg font-semibold">Today</h2>
                    <p className="mb-3 text-xs text-gray-500" data-testid="utc-today">
                        UTC day {formatDateOnly(utcTodayIso())} (the server counts days in UTC)
                    </p>
                    <QueryBody query={stats} what="today's statistics">
                        {(data) => <TodayGrid stats={data} />}
                    </QueryBody>
                </section>
            </div>

            <section aria-labelledby="weekly-heading" className="rounded-lg bg-white p-5 shadow">
                <h2 id="weekly-heading" className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <BarChart3 size={20} className="text-indigo-600" aria-hidden="true" />
                    Activity in the last 7 days
                </h2>
                <QueryBody query={weekly} what="weekly progress">
                    {(data) => {
                        if (data.length === 0) return <EmptyState icon={BarChart3} title="No weekly data available" />;
                        const bars = buildWeeklyBars(data);
                        return (
                            <>
                                <WeeklyChart bars={bars} />
                                {bars.some((bar) => bar.date === null) && (
                                    <p className="mt-2 text-xs text-gray-500">Dates could not be matched to the server's day names, so only the day names are shown.</p>
                                )}
                            </>
                        );
                    }}
                </QueryBody>
            </section>
        </div>
    );
}

/** Loading / error / data for one section. A failed refresh keeps the previous data and says so. */
function QueryBody<T>({ query, what, children }: { query: ApiQueryState<T>; what: string; children: (data: T) => ReactNode }) {
    const { data, error, loading, refetch } = query;
    if (error?.kind === "unauthorized") return null; // AuthContext signs the user out

    if (data !== null) {
        return (
            <>
                {error && (
                    <p role="alert" className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">
                        Could not refresh {what}: {formatApiError(error)}
                    </p>
                )}
                {children(data)}
            </>
        );
    }

    if (error) {
        return <ErrorState title={`Could not load ${what}`} message={formatApiError(error)} onRetry={refetch} retrying={loading} />;
    }

    return (
        <div aria-busy="true" className="py-4">
            <Loader size="sm" />
            <p className="text-center text-sm text-gray-500">Loading {what}...</p>
        </div>
    );
}

function OverviewCards({ data, flashcards }: { data: ProgressOverview; flashcards: ApiQueryState<DashboardResponse> }) {
    const attempts = data.completedQuizzes;
    const flashcardCount = flashcards.data?.statistics.totalFlashcards;

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="overview-cards">
            <StatCard label="Study plans" value={data.totalStudyPlans} icon={CalendarDays} />
            <StatCard label="Quizzes generated" value={data.totalQuizzes} icon={BookOpen} />
            <StatCard label="Quiz attempts" value={attempts} icon={CheckCircle2} />
            <StatCard
                label="Average quiz score"
                value={0}
                icon={Percent}
                // The API returns 0 when there are no attempts; showing "0%" would be misleading.
                display={attempts > 0 ? `${Math.round(data.averageQuizScore * 100) / 100}%` : "—"}
                hint={attempts > 0 ? `Across ${attempts} ${attempts === 1 ? "attempt" : "attempts"}` : "No quiz attempts yet"}
            />
            <StatCard
                label="Flashcards"
                value={flashcardCount ?? 0}
                icon={Layers}
                display={flashcardCount !== undefined ? undefined : flashcards.error ? "Unavailable" : "…"}
                hint={flashcardCount !== undefined ? "Cards across all sets" : flashcards.error ? "Could not load the flashcard count" : undefined}
            />
            <StatCard label="AI chat conversations" value={data.totalChats} icon={MessageSquare} />
            <StatCard label="Activities" value={data.totalActivities} icon={Activity} hint="All recorded activities" />
        </div>
    );
}

function StreakSummary({ streak }: { streak: Streak }) {
    if (hasNeverBeenActive(streak)) {
        return (
            <div data-testid="streak">
                <p className="text-4xl font-bold text-gray-900">0 days</p>
                <p className="mt-2 text-sm text-gray-600">No activity yet. Your streak starts with your first study activity.</p>
            </div>
        );
    }

    const daysSince = utcDaysSince(streak.lastActiveDate);
    const days = streak.currentStreak;

    return (
        <div data-testid="streak">
            <p className="text-4xl font-bold text-gray-900">
                {days} {days === 1 ? "day" : "days"}
            </p>
            <p className="mt-2 text-sm text-gray-600">
                Last active:{" "}
                <time dateTime={streak.lastActiveDate}>{formatDateOnly(streak.lastActiveDate)}</time>
                {daysSince !== null && daysSince >= 0 && <> ({describeDaysUntil(-daysSince)})</>}
            </p>
            {days > 0 && daysSince === 1 && (
                <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-800">No activity yet today (UTC). Study today to keep your streak.</p>
            )}
            {days === 0 && (
                <p className="mt-2 text-sm text-gray-500">A streak counts consecutive days with activity, ending today or yesterday.</p>
            )}
        </div>
    );
}

function TodayGrid({ stats }: { stats: TodayStats }) {
    const items: [string, number][] = [
        ["Activities", stats.todayActivities],
        ["Chat conversations started", stats.todayChats],
        ["Study plans created", stats.todayStudyPlans],
        ["Quiz attempts", stats.todayQuizzes],
    ];

    return (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="today-stats">
            {items.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</dd>
                </div>
            ))}
        </dl>
    );
}
