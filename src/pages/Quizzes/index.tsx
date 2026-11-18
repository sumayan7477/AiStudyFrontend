import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BookOpen, Play, RotateCw, Sparkles, Trash2 } from "lucide-react";

import { formatApiError, parseApiError } from "../../api/errors";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import { useApiQuery } from "../../hooks/useApiQuery";
import quizzesService from "../../services/quizzes.service";
import { QUIZ_DIFFICULTIES, type Quiz, type QuizDifficulty } from "../../types/quiz";
import { difficultyBadgeClass, formatDifficulty } from "../../utils/quiz";
import {
    pickFieldErrors,
    QUIZ_QUESTIONS_MAX,
    QUIZ_QUESTIONS_MIN,
    TOPIC_MAX_LENGTH,
    validateQuiz,
    type FieldErrors,
    type QuizFormValues,
} from "../../utils/validation";

const FIELDS = ["topic", "difficulty", "numberOfQuestions"] as const;
const INITIAL_VALUES: QuizFormValues = { topic: "", difficulty: "Medium", numberOfQuestions: "10" };

export default function Quizzes() {
    const navigate = useNavigate();
    const { data, error, loading, refetch } = useApiQuery("quizzes", quizzesService.list);

    // Quizzes deleted on this page (removed from the list only after the API confirms).
    const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

    // ---- generate ----
    const [values, setValues] = useState<QuizFormValues>(INITIAL_VALUES);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors<QuizFormValues>>({});
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const generatingRef = useRef(false); // blocks double submits before React re-renders
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const setField = (field: keyof QuizFormValues, value: string) => {
        setValues((previous) => ({ ...previous, [field]: value }));
        setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
        setGenerateError(null);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (generatingRef.current) return;

        const errors = validateQuiz(values);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const requested = Number(values.numberOfQuestions);
        generatingRef.current = true;
        setGenerating(true);
        setGenerateError(null);

        try {
            // User-triggered only (never from an effect), so StrictMode cannot duplicate it.
            const quiz = await quizzesService.generate({
                topic: values.topic.trim(),
                difficulty: values.difficulty as QuizDifficulty,
                numberOfQuestions: requested,
            });

            // The API keeps only valid AI questions, so a quiz can have fewer than requested.
            const shortBy = quiz.questionCount < requested
                ? ` The AI produced ${quiz.questionCount} of the ${requested} requested questions.`
                : "";

            if (mounted.current) {
                toast.success(`Quiz generated.${shortBy}`);
                navigate(`/quizzes/${quiz.id}`);
            } else {
                toast.success(`Your quiz on "${quiz.topic}" is ready.${shortBy}`);
            }
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);
            if (apiError.kind === "unauthorized") return; // AuthContext signs the user out

            if (!mounted.current) {
                toast.error(formatApiError(apiError));
                return;
            }

            const serverFieldErrors = pickFieldErrors<QuizFormValues>(apiError.fieldErrors, FIELDS);
            if (Object.keys(serverFieldErrors).length > 0) setFieldErrors(serverFieldErrors);
            else setGenerateError(formatApiError(apiError));
        } finally {
            generatingRef.current = false;
            if (mounted.current) setGenerating(false);
        }
    };

    // ---- delete ----
    const [pendingDelete, setPendingDelete] = useState<Quiz | null>(null);
    const [deleting, setDeleting] = useState(false);

    const markRemoved = (id: string) => setRemovedIds((previous) => new Set(previous).add(id));

    const handleDelete = async () => {
        if (!pendingDelete) return;
        const quiz = pendingDelete;

        setDeleting(true);
        try {
            await quizzesService.remove(quiz.id);
            markRemoved(quiz.id);
            toast.success("Quiz deleted.");
            setPendingDelete(null);
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);

            if (apiError.kind === "notFound") {
                markRemoved(quiz.id);
                toast("This quiz had already been deleted.");
                setPendingDelete(null);
            } else if (apiError.kind !== "unauthorized") {
                toast.error(formatApiError(apiError)); // the quiz stays in the list
                setPendingDelete(null);
            }
        } finally {
            setDeleting(false);
        }
    };

    const quizzes = (data ?? []).filter((quiz) => !removedIds.has(quiz.id));
    const showListError = error && !data && error.kind !== "unauthorized";

    const inputClass = (field: keyof QuizFormValues) =>
        `w-full rounded border p-3 disabled:bg-gray-50 ${fieldErrors[field] ? "border-red-500" : ""}`;

    const fieldError = (field: keyof QuizFormValues) =>
        fieldErrors[field] && (
            <p id={`quiz-${field}-error`} className="mt-1 text-sm text-red-600">{fieldErrors[field]}</p>
        );

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Quizzes</h1>
                    <p className="mt-1 text-gray-600">Generate multiple-choice quizzes with AI and test yourself.</p>
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
                <h2 className="mb-4 text-lg font-semibold">Generate a quiz</h2>

                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                        <label htmlFor="quiz-topic" className="mb-1 block text-sm font-medium">Topic</label>
                        <input
                            id="quiz-topic"
                            type="text"
                            value={values.topic}
                            maxLength={TOPIC_MAX_LENGTH}
                            disabled={generating}
                            onChange={(e) => setField("topic", e.target.value)}
                            placeholder="e.g. The French Revolution"
                            aria-invalid={!!fieldErrors.topic}
                            aria-describedby={fieldErrors.topic ? "quiz-topic-error" : undefined}
                            className={inputClass("topic")}
                        />
                        {fieldError("topic")}
                    </div>

                    <div>
                        <label htmlFor="quiz-difficulty" className="mb-1 block text-sm font-medium">Difficulty</label>
                        <select
                            id="quiz-difficulty"
                            value={values.difficulty}
                            disabled={generating}
                            onChange={(e) => setField("difficulty", e.target.value)}
                            aria-invalid={!!fieldErrors.difficulty}
                            aria-describedby={fieldErrors.difficulty ? "quiz-difficulty-error" : undefined}
                            className={`${inputClass("difficulty")} bg-white`}
                        >
                            {QUIZ_DIFFICULTIES.map((difficulty) => (
                                <option key={difficulty} value={difficulty}>{difficulty}</option>
                            ))}
                        </select>
                        {fieldError("difficulty")}
                    </div>

                    <div>
                        <label htmlFor="quiz-numberOfQuestions" className="mb-1 block text-sm font-medium">Questions</label>
                        <input
                            id="quiz-numberOfQuestions"
                            type="number"
                            inputMode="numeric"
                            min={QUIZ_QUESTIONS_MIN}
                            max={QUIZ_QUESTIONS_MAX}
                            step={1}
                            value={values.numberOfQuestions}
                            disabled={generating}
                            onChange={(e) => setField("numberOfQuestions", e.target.value)}
                            aria-invalid={!!fieldErrors.numberOfQuestions}
                            aria-describedby={fieldErrors.numberOfQuestions ? "quiz-numberOfQuestions-error" : "quiz-count-help"}
                            className={inputClass("numberOfQuestions")}
                        />
                        {fieldError("numberOfQuestions") || (
                            <p id="quiz-count-help" className="mt-1 text-xs text-gray-500">{QUIZ_QUESTIONS_MIN}-{QUIZ_QUESTIONS_MAX}</p>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-gray-400">{values.topic.length}/{TOPIC_MAX_LENGTH}</span>
                    <button
                        type="submit"
                        disabled={generating}
                        className="flex items-center justify-center gap-2 rounded bg-indigo-600 px-5 py-3 text-white disabled:opacity-60"
                    >
                        <Sparkles size={18} aria-hidden="true" />
                        {generating ? "Generating..." : "Generate quiz"}
                    </button>
                </div>

                {generating && (
                    <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded bg-indigo-50 p-3 text-sm text-indigo-700">
                        <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        Generating your quiz... This can take up to a minute.
                    </div>
                )}

                {generateError && (
                    <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{generateError}</p>
                )}
            </form>

            {/* List */}
            {loading && !data && (
                <div className="rounded-lg bg-white p-10 shadow" aria-busy="true">
                    <Loader size="lg" />
                    <p className="text-center text-sm text-gray-500">Loading your quizzes...</p>
                </div>
            )}

            {showListError && (
                <ErrorState title="Could not load your quizzes" message={formatApiError(error)} onRetry={refetch} retrying={loading} />
            )}

            {error && data && error.kind !== "unauthorized" && (
                <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
                    Could not refresh: {formatApiError(error)}
                </p>
            )}

            {data && (
                <section aria-label="Saved quizzes" className="rounded-lg bg-white shadow">
                    <h2 className="border-b px-5 py-4 text-lg font-semibold">
                        Your quizzes{quizzes.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({quizzes.length})</span>}
                    </h2>

                    {quizzes.length === 0 ? (
                        <EmptyState icon={BookOpen} title="No quizzes yet" message="Enter a topic above to generate your first quiz." />
                    ) : (
                        <ul className="divide-y">
                            {quizzes.map((quiz) => (
                                <li key={quiz.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="break-words font-semibold text-gray-900">{quiz.topic}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyBadgeClass(quiz.difficulty)}`}>
                                                {formatDifficulty(quiz.difficulty)}
                                            </span>
                                            <span>{quiz.questionCount} {quiz.questionCount === 1 ? "question" : "questions"}</span>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <Link
                                            to={`/quizzes/${quiz.id}`}
                                            aria-label={`Start quiz "${quiz.topic}"`}
                                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                                        >
                                            <Play size={16} aria-hidden="true" />
                                            Start
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => setPendingDelete(quiz)}
                                            aria-label={`Delete quiz "${quiz.topic}"`}
                                            title="Delete quiz"
                                            className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 size={18} aria-hidden="true" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete quiz?"
                message={pendingDelete ? `"${pendingDelete.topic}" and its questions will be permanently deleted.` : ""}
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}
