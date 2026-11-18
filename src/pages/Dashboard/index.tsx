import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
    Activity,
    BookOpen,
    CalendarDays,
    History,
    Layers,
    MessageSquare,
    RotateCw,
} from "lucide-react";

import { formatApiError } from "../../api/errors";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/useAuth";
import { useApiQuery } from "../../hooks/useApiQuery";
import dashboardService from "../../services/dashboard.service";
import { formatDateTime, formatRelativeTime } from "../../utils/date";

const Dashboard = () => {
    const { user } = useAuth();
    const { data, error, loading, refetch } = useApiQuery("dashboard", dashboardService.get);

    // A failed refresh keeps the previous data on screen and reports the problem with a toast.
    const hadData = useRef(false);
    useEffect(() => {
        if (data) hadData.current = true;
    }, [data]);
    useEffect(() => {
        if (error && hadData.current && error.kind !== "unauthorized" && error.kind !== "cancelled") {
            toast.error(formatApiError(error), { id: "dashboard-refresh" });
        }
    }, [error]);

    // 401 is handled globally (AuthContext logs out and redirects).
    const showError = error && !data && error.kind !== "unauthorized";

    const fullName = data?.fullName || user?.fullName || "";
    const stats = data?.statistics;
    const activities = data?.recentActivities ?? [];
    const isNewUser =
        !!stats &&
        stats.totalStudyPlans + stats.totalAIChats + stats.totalQuizzes + stats.totalFlashcards === 0;

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">
                        Dashboard
                    </h1>
                    {fullName && (
                        <p className="mt-1 text-gray-600">Welcome back, {fullName}.</p>
                    )}
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
                    <p className="text-center text-sm text-gray-500">Loading your dashboard...</p>
                </div>
            )}

            {showError && (
                <ErrorState
                    title="Could not load your dashboard"
                    message={formatApiError(error)}
                    onRetry={refetch}
                    retrying={loading}
                />
            )}

            {stats && (
                <>
                    <section aria-label="Statistics" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                        <StatCard label="Study plans" value={stats.totalStudyPlans} icon={CalendarDays} />
                        <StatCard label="AI chats" value={stats.totalAIChats} icon={MessageSquare} />
                        <StatCard label="Quizzes" value={stats.totalQuizzes} icon={BookOpen} />
                        <StatCard label="Flashcards" value={stats.totalFlashcards} icon={Layers} />
                        <StatCard label="Activities" value={stats.totalActivities} icon={Activity} />
                    </section>

                    {isNewUser && (
                        <p className="mb-6 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-700">
                            Your statistics will grow as you create study plans, chat with the AI,
                            and generate quizzes and flashcards.
                        </p>
                    )}

                    <section className="rounded-lg bg-white shadow" aria-labelledby="recent-activity-heading">
                        <h2 id="recent-activity-heading" className="flex items-center gap-2 border-b px-5 py-4 text-lg font-semibold">
                            <History size={20} className="text-indigo-600" aria-hidden="true" />
                            Recent activity
                        </h2>

                        {activities.length === 0 ? (
                            <EmptyState
                                title="No activity yet"
                                message="Your latest actions will appear here."
                            />
                        ) : (
                            <ul className="divide-y">
                                {activities.map((activity, index) => (
                                    <li
                                        key={`${activity.createdAt}-${index}`}
                                        className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                                    >
                                        <span className="break-words text-gray-800">{activity.title}</span>
                                        <time
                                            dateTime={activity.createdAt}
                                            title={formatDateTime(activity.createdAt)}
                                            className="shrink-0 text-sm text-gray-500"
                                        >
                                            {formatRelativeTime(activity.createdAt)}
                                        </time>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </>
            )}
        </div>
    );
};

export default Dashboard;
