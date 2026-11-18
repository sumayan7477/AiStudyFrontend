import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, CalendarDays, Clock, Trash2 } from "lucide-react";

import { formatApiError, parseApiError } from "../../api/errors";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import MarkdownView from "../../components/common/MarkdownView";
import { useApiQuery } from "../../hooks/useApiQuery";
import studyPlansService from "../../services/studyPlans.service";
import {
    daysUntilDate,
    describeDaysUntil,
    formatDateOnly,
    formatDateTime,
    formatRelativeTime,
} from "../../utils/date";

export default function StudyPlansDetails() {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const { data: plan, error, loading, refetch } = useApiQuery(`studyplan:${id}`, () => studyPlansService.get(id));

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!plan) return;

        setDeleting(true);
        try {
            await studyPlansService.remove(plan.id);
            toast.success("Study plan deleted.");
            navigate("/study-plans", { replace: true });
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);

            if (apiError.kind === "notFound") {
                toast("This study plan had already been deleted.");
                navigate("/study-plans", { replace: true });
            } else if (apiError.kind !== "unauthorized") {
                toast.error(formatApiError(apiError)); // the plan stays on screen
                setConfirmOpen(false);
            }
        } finally {
            setDeleting(false);
        }
    };

    const notFound = error?.kind === "notFound";
    const showError = error && !plan && error.kind !== "unauthorized";
    const days = plan ? daysUntilDate(plan.examDate) : null;

    return (
        <div className="mx-auto max-w-4xl">
            <Link
                to="/study-plans"
                className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
            >
                <ArrowLeft size={16} aria-hidden="true" />
                Back to study plans
            </Link>

            {loading && !plan && (
                <div className="rounded-lg bg-white p-10 shadow" aria-busy="true">
                    <Loader size="lg" />
                    <p className="text-center text-sm text-gray-500">Loading study plan...</p>
                </div>
            )}

            {showError && (
                <ErrorState
                    title={notFound ? "Study plan not found" : "Could not load this study plan"}
                    message={notFound ? "It may have been deleted." : formatApiError(error)}
                    onRetry={notFound ? undefined : refetch}
                    retrying={loading}
                />
            )}

            {plan && (
                <article className="rounded-lg bg-white shadow">
                    <header className="flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4 sm:px-8 sm:py-6">
                        <div className="min-w-0">
                            <h1 className="break-words text-2xl font-bold sm:text-3xl">{plan.subject}</h1>

                            <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <CalendarDays size={14} aria-hidden="true" />
                                    <dt>Exam:</dt>
                                    <dd>
                                        <time dateTime={plan.examDate}>{formatDateOnly(plan.examDate)}</time>
                                        {days !== null && <span className="text-gray-500"> ({describeDaysUntil(days)})</span>}
                                    </dd>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={14} aria-hidden="true" />
                                    <dt>Daily study:</dt>
                                    <dd>{plan.dailyHours} {plan.dailyHours === 1 ? "hour" : "hours"}</dd>
                                </div>
                                <div className="flex items-center gap-1">
                                    <dt>Created:</dt>
                                    <dd>
                                        <time dateTime={plan.createdAt} title={formatDateTime(plan.createdAt)}>
                                            {formatDateTime(plan.createdAt)} · {formatRelativeTime(plan.createdAt)}
                                        </time>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            className="flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <Trash2 size={16} aria-hidden="true" />
                            Delete
                        </button>
                    </header>

                    <div className="px-5 py-6 sm:px-8">
                        <MarkdownView content={plan.aiResponse} />
                    </div>
                </article>
            )}

            <ConfirmDialog
                open={confirmOpen}
                title="Delete study plan?"
                message={plan ? `The study plan for "${plan.subject}" will be permanently deleted.` : ""}
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
}
