import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, Clock, RotateCw, Sparkles, Trash2 } from "lucide-react";

import { formatApiError, parseApiError } from "../../api/errors";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import { useApiQuery } from "../../hooks/useApiQuery";
import studyPlansService from "../../services/studyPlans.service";
import type { StudyPlan } from "../../types/studyPlans";
import {
    daysUntilDate,
    describeDaysUntil,
    formatDateOnly,
    formatDateTime,
    formatRelativeTime,
    todayLocalIsoDate,
    utcIsoDatePlusYears,
} from "../../utils/date";
import { markdownPreview } from "../../utils/markdown";
import {
    DAILY_HOURS_MAX,
    DAILY_HOURS_MIN,
    EXAM_MAX_YEARS_AHEAD,
    TOPIC_MAX_LENGTH,
    pickFieldErrors,
    validateStudyPlan,
    type FieldErrors,
    type StudyPlanFormValues,
} from "../../utils/validation";

const FIELDS = ["subject", "dailyHours", "examDate"] as const;

export default function StudyPlans() {
    const navigate = useNavigate();
    const { data, error, loading, refetch } = useApiQuery("studyplans", studyPlansService.list);

    // Plans deleted in this session (removed from the list only after the API confirms).
    const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

    // ---- generate ----
    const [form, setForm] = useState<StudyPlanFormValues>({ subject: "", dailyHours: "2", examDate: "" });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors<StudyPlanFormValues>>({});
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const generatingRef = useRef(false); // blocks double submits before React re-renders
    const mounted = useRef(true);

    // Same limits as the API: from today (local) to UTC today + 2 years.
    const { minDate, maxDate } = useMemo(
        () => ({ minDate: todayLocalIsoDate(), maxDate: utcIsoDatePlusYears(EXAM_MAX_YEARS_AHEAD) }),
        [],
    );

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name as keyof StudyPlanFormValues;
        setForm({ ...form, [name]: e.target.value });
        setFieldErrors({ ...fieldErrors, [name]: undefined });
        setGenerateError(null);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (generatingRef.current) return;

        const validation = validateStudyPlan(form, minDate, maxDate);
        if (Object.keys(validation).length > 0) {
            setFieldErrors(validation);
            return;
        }

        generatingRef.current = true;
        setGenerating(true);
        setGenerateError(null);

        try {
            // User-triggered only (never from an effect), so StrictMode cannot duplicate it.
            const plan = await studyPlansService.generate({
                subject: form.subject.trim(),
                dailyHours: Number(form.dailyHours),
                examDate: form.examDate,
            });

            if (mounted.current) {
                toast.success("Study plan generated.");
                navigate(`/study-plans/${plan.id}`);
            } else {
                // The user left the page while the AI was working; do not move them.
                toast.success(`Your study plan for "${plan.subject}" is ready.`);
            }
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);
            if (apiError.kind === "unauthorized") return; // AuthContext signs the user out

            if (!mounted.current) {
                toast.error(formatApiError(apiError));
                return;
            }

            // Form values are kept so the user can simply try again.
            const serverFieldErrors = pickFieldErrors<StudyPlanFormValues>(apiError.fieldErrors, [...FIELDS]);
            if (Object.keys(serverFieldErrors).length > 0) setFieldErrors(serverFieldErrors);
            else setGenerateError(formatApiError(apiError));
        } finally {
            generatingRef.current = false;
            if (mounted.current) setGenerating(false);
        }
    };

    // ---- delete ----
    const [pendingDelete, setPendingDelete] = useState<StudyPlan | null>(null);
    const [deleting, setDeleting] = useState(false);

    const markRemoved = (id: string) => setRemovedIds((previous) => new Set(previous).add(id));

    const handleDelete = async () => {
        if (!pendingDelete) return;
        const plan = pendingDelete;

        setDeleting(true);
        try {
            await studyPlansService.remove(plan.id);
            markRemoved(plan.id);
            toast.success("Study plan deleted.");
            setPendingDelete(null);
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);

            if (apiError.kind === "notFound") {
                markRemoved(plan.id);
                toast("This study plan had already been deleted.");
                setPendingDelete(null);
            } else if (apiError.kind !== "unauthorized") {
                // The plan stays in the list.
                toast.error(formatApiError(apiError));
                setPendingDelete(null);
            }
        } finally {
            setDeleting(false);
        }
    };

    const plans = (data ?? []).filter((plan) => !removedIds.has(plan.id));
    const showListError = error && !data && error.kind !== "unauthorized";

    const inputClass = "w-full min-w-0 rounded border p-3 disabled:bg-gray-50";
    const errorText = (field: keyof StudyPlanFormValues) =>
        fieldErrors[field] && <p id={`plan-${field}-error`} className="mt-1 text-sm text-red-600">{fieldErrors[field]}</p>;

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Study Plans</h1>
                    <p className="mt-1 text-gray-600">Get an AI study plan built around your exam date.</p>
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

            {/* Generate */}
            <form onSubmit={handleGenerate} noValidate className="mb-6 rounded-lg bg-white p-5 shadow">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <label htmlFor="plan-subject" className="mb-2 block font-semibold">Subject</label>
                        <input
                            id="plan-subject"
                            name="subject"
                            type="text"
                            value={form.subject}
                            maxLength={TOPIC_MAX_LENGTH}
                            disabled={generating}
                            onChange={handleChange}
                            placeholder="e.g. Organic Chemistry"
                            aria-invalid={!!fieldErrors.subject}
                            aria-describedby={fieldErrors.subject ? "plan-subject-error" : undefined}
                            className={inputClass}
                        />
                        {errorText("subject")}
                    </div>

                    <div>
                        <label htmlFor="plan-dailyHours" className="mb-2 block font-semibold">Hours per day</label>
                        <input
                            id="plan-dailyHours"
                            name="dailyHours"
                            type="number"
                            inputMode="numeric"
                            min={DAILY_HOURS_MIN}
                            max={DAILY_HOURS_MAX}
                            step={1}
                            value={form.dailyHours}
                            disabled={generating}
                            onChange={handleChange}
                            aria-invalid={!!fieldErrors.dailyHours}
                            aria-describedby={fieldErrors.dailyHours ? "plan-dailyHours-error" : undefined}
                            className={inputClass}
                        />
                        {errorText("dailyHours")}
                    </div>

                    <div>
                        <label htmlFor="plan-examDate" className="mb-2 block font-semibold">Exam date</label>
                        <input
                            id="plan-examDate"
                            name="examDate"
                            type="date"
                            min={minDate}
                            max={maxDate}
                            value={form.examDate}
                            disabled={generating}
                            onChange={handleChange}
                            aria-invalid={!!fieldErrors.examDate}
                            aria-describedby={fieldErrors.examDate ? "plan-examDate-error" : undefined}
                            className={inputClass}
                        />
                        {errorText("examDate")}
                    </div>
                </div>

                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                        {DAILY_HOURS_MIN}-{DAILY_HOURS_MAX} hours per day; exam within {EXAM_MAX_YEARS_AHEAD} years.
                    </p>
                    <button
                        type="submit"
                        disabled={generating}
                        className="flex items-center justify-center gap-2 rounded bg-indigo-600 px-5 py-3 text-white disabled:opacity-60"
                    >
                        <Sparkles size={18} aria-hidden="true" />
                        {generating ? "Generating..." : "Generate study plan"}
                    </button>
                </div>

                {generating && (
                    <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded bg-indigo-50 p-3 text-sm text-indigo-700">
                        <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        Generating your study plan... This can take up to a minute.
                    </div>
                )}

                {generateError && (
                    <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">
                        {generateError}
                    </p>
                )}
            </form>

            {/* List */}
            {loading && !data && (
                <div className="rounded-lg bg-white p-10 shadow" aria-busy="true">
                    <Loader size="lg" />
                    <p className="text-center text-sm text-gray-500">Loading your study plans...</p>
                </div>
            )}

            {showListError && (
                <ErrorState
                    title="Could not load your study plans"
                    message={formatApiError(error)}
                    onRetry={refetch}
                    retrying={loading}
                />
            )}

            {error && data && error.kind !== "unauthorized" && (
                <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
                    Could not refresh: {formatApiError(error)}
                </p>
            )}

            {data && (
                <section aria-label="Saved study plans" className="rounded-lg bg-white shadow">
                    <h2 className="border-b px-5 py-4 text-lg font-semibold">
                        Saved study plans{plans.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({plans.length})</span>}
                    </h2>

                    {plans.length === 0 ? (
                        <EmptyState
                            icon={CalendarDays}
                            title="No study plans yet"
                            message="Enter a subject, your daily study hours and exam date above to generate your first plan."
                        />
                    ) : (
                        <ul className="divide-y">
                            {plans.map((plan) => {
                                const days = daysUntilDate(plan.examDate);
                                return (
                                    <li key={plan.id} className="flex items-start gap-3 px-5 py-4">
                                        <Link to={`/study-plans/${plan.id}`} className="group min-w-0 flex-1">
                                            <p className="break-words font-semibold text-gray-900 group-hover:text-indigo-600">
                                                {plan.subject}
                                            </p>

                                            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays size={14} aria-hidden="true" />
                                                    Exam <time dateTime={plan.examDate}>{formatDateOnly(plan.examDate)}</time>
                                                    {days !== null && <span className="text-gray-500">({describeDaysUntil(days)})</span>}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} aria-hidden="true" />
                                                    {plan.dailyHours} {plan.dailyHours === 1 ? "hour" : "hours"}/day
                                                </span>
                                            </p>

                                            <time
                                                dateTime={plan.createdAt}
                                                title={formatDateTime(plan.createdAt)}
                                                className="text-xs text-gray-500"
                                            >
                                                Created {formatRelativeTime(plan.createdAt)}
                                            </time>

                                            <p className="mt-1 line-clamp-2 break-words text-sm text-gray-600">
                                                {markdownPreview(plan.aiResponse)}
                                            </p>
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => setPendingDelete(plan)}
                                            aria-label={`Delete study plan "${plan.subject}"`}
                                            title="Delete study plan"
                                            className="shrink-0 rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 size={18} aria-hidden="true" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete study plan?"
                message={pendingDelete ? `The study plan for "${pendingDelete.subject}" will be permanently deleted.` : ""}
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}
