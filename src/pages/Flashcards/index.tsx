import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Layers, RotateCw, Sparkles, Trash2 } from "lucide-react";

import { formatApiError, parseApiError } from "../../api/errors";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import { useApiQuery } from "../../hooks/useApiQuery";
import flashcardsService from "../../services/flashcards.service";
import type { FlashcardSet } from "../../types/flashcards";
import { formatDateTime, formatRelativeTime } from "../../utils/date";
import {
    FLASHCARDS_MAX,
    FLASHCARDS_MIN,
    pickFieldErrors,
    TOPIC_MAX_LENGTH,
    validateFlashcards,
    type FieldErrors,
    type FlashcardsFormValues,
} from "../../utils/validation";

const FIELDS = ["topic", "numberOfCards"] as const;

const cardsLabel = (count: number) => `${count} ${count === 1 ? "card" : "cards"}`;

export default function Flashcards() {
    const navigate = useNavigate();
    const { data, error, loading, refetch } = useApiQuery("flashcards", flashcardsService.list);

    // Sets deleted on this page (removed from the list only after the API confirms).
    const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

    // ---- generate ----
    const [values, setValues] = useState<FlashcardsFormValues>({ topic: "", numberOfCards: "10" });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors<FlashcardsFormValues>>({});
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

    const setField = (field: keyof FlashcardsFormValues, value: string) => {
        setValues((previous) => ({ ...previous, [field]: value }));
        setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
        setGenerateError(null);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (generatingRef.current) return;

        const errors = validateFlashcards(values);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        const requested = Number(values.numberOfCards);
        generatingRef.current = true;
        setGenerating(true);
        setGenerateError(null);

        try {
            // User-triggered only (never from an effect), so StrictMode cannot duplicate it.
            const set = await flashcardsService.generate({ topic: values.topic.trim(), numberOfCards: requested });

            // The API keeps only valid, distinct AI cards, so a set can have fewer than requested.
            const shortBy = set.cardCount < requested
                ? ` The AI produced ${set.cardCount} of the ${requested} requested cards.`
                : "";

            if (mounted.current) {
                toast.success(`Flashcards generated.${shortBy}`);
                navigate(`/flashcards/${set.id}`);
            } else {
                toast.success(`Your flashcards on "${set.topic}" are ready.${shortBy}`);
            }
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);
            if (apiError.kind === "unauthorized") return; // AuthContext signs the user out

            if (!mounted.current) {
                toast.error(formatApiError(apiError));
                return;
            }

            const serverFieldErrors = pickFieldErrors<FlashcardsFormValues>(apiError.fieldErrors, FIELDS);
            if (Object.keys(serverFieldErrors).length > 0) setFieldErrors(serverFieldErrors);
            else setGenerateError(formatApiError(apiError));
        } finally {
            generatingRef.current = false;
            if (mounted.current) setGenerating(false);
        }
    };

    // ---- delete ----
    const [pendingDelete, setPendingDelete] = useState<FlashcardSet | null>(null);
    const [deleting, setDeleting] = useState(false);

    const markRemoved = (id: string) => setRemovedIds((previous) => new Set(previous).add(id));

    const handleDelete = async () => {
        if (!pendingDelete) return;
        const set = pendingDelete;

        setDeleting(true);
        try {
            await flashcardsService.remove(set.id);
            markRemoved(set.id);
            toast.success("Flashcard set deleted.");
            setPendingDelete(null);
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);

            if (apiError.kind === "notFound") {
                markRemoved(set.id);
                toast("This flashcard set had already been deleted.");
                setPendingDelete(null);
            } else if (apiError.kind !== "unauthorized") {
                toast.error(formatApiError(apiError)); // the set stays in the list
                setPendingDelete(null);
            }
        } finally {
            setDeleting(false);
        }
    };

    const sets = (data ?? []).filter((set) => !removedIds.has(set.id));
    const showListError = error && !data && error.kind !== "unauthorized";

    const inputClass = (field: keyof FlashcardsFormValues) =>
        `w-full rounded border p-3 disabled:bg-gray-50 ${fieldErrors[field] ? "border-red-500" : ""}`;

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Flashcards</h1>
                    <p className="mt-1 text-gray-600">Generate flashcard sets with AI and study them card by card.</p>
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
                <h2 className="mb-4 text-lg font-semibold">Generate flashcards</h2>

                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-3">
                        <label htmlFor="flashcards-topic" className="mb-1 block text-sm font-medium">Topic</label>
                        <input
                            id="flashcards-topic"
                            type="text"
                            value={values.topic}
                            maxLength={TOPIC_MAX_LENGTH}
                            disabled={generating}
                            onChange={(e) => setField("topic", e.target.value)}
                            placeholder="e.g. Spanish verbs"
                            aria-invalid={!!fieldErrors.topic}
                            aria-describedby={fieldErrors.topic ? "flashcards-topic-error" : undefined}
                            className={inputClass("topic")}
                        />
                        {fieldErrors.topic && <p id="flashcards-topic-error" className="mt-1 text-sm text-red-600">{fieldErrors.topic}</p>}
                    </div>

                    <div>
                        <label htmlFor="flashcards-numberOfCards" className="mb-1 block text-sm font-medium">Cards</label>
                        <input
                            id="flashcards-numberOfCards"
                            type="number"
                            inputMode="numeric"
                            min={FLASHCARDS_MIN}
                            max={FLASHCARDS_MAX}
                            step={1}
                            value={values.numberOfCards}
                            disabled={generating}
                            onChange={(e) => setField("numberOfCards", e.target.value)}
                            aria-invalid={!!fieldErrors.numberOfCards}
                            aria-describedby={fieldErrors.numberOfCards ? "flashcards-numberOfCards-error" : "flashcards-count-help"}
                            className={inputClass("numberOfCards")}
                        />
                        {fieldErrors.numberOfCards ? (
                            <p id="flashcards-numberOfCards-error" className="mt-1 text-sm text-red-600">{fieldErrors.numberOfCards}</p>
                        ) : (
                            <p id="flashcards-count-help" className="mt-1 text-xs text-gray-500">{FLASHCARDS_MIN}-{FLASHCARDS_MAX}</p>
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
                        {generating ? "Generating..." : "Generate flashcards"}
                    </button>
                </div>

                {generating && (
                    <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded bg-indigo-50 p-3 text-sm text-indigo-700">
                        <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        Generating flashcards... This can take up to a minute.
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
                    <p className="text-center text-sm text-gray-500">Loading your flashcard sets...</p>
                </div>
            )}

            {showListError && (
                <ErrorState title="Could not load your flashcard sets" message={formatApiError(error)} onRetry={refetch} retrying={loading} />
            )}

            {error && data && error.kind !== "unauthorized" && (
                <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
                    Could not refresh: {formatApiError(error)}
                </p>
            )}

            {data && (
                <section aria-label="Saved flashcard sets" className="rounded-lg bg-white shadow">
                    <h2 className="border-b px-5 py-4 text-lg font-semibold">
                        Your flashcard sets{sets.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({sets.length})</span>}
                    </h2>

                    {sets.length === 0 ? (
                        <EmptyState icon={Layers} title="No flashcard sets yet" message="Enter a topic above to generate your first set." />
                    ) : (
                        <ul className="divide-y">
                            {sets.map((set) => (
                                <li key={set.id} className="flex items-start gap-3 px-5 py-4">
                                    <Link to={`/flashcards/${set.id}`} className="group min-w-0 flex-1">
                                        <p className="break-words font-semibold text-gray-900 group-hover:text-indigo-600">{set.topic}</p>
                                        <p className="mt-1 text-sm text-gray-600">
                                            <span>{cardsLabel(set.cardCount)}</span>{" "}
                                            <span className="mx-1 text-gray-300" aria-hidden="true">·</span>{" "}
                                            <time dateTime={set.createdAt} title={formatDateTime(set.createdAt)} className="text-gray-500">
                                                Created {formatRelativeTime(set.createdAt)}
                                            </time>
                                        </p>
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => setPendingDelete(set)}
                                        aria-label={`Delete flashcard set "${set.topic}"`}
                                        title="Delete flashcard set"
                                        className="shrink-0 rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 size={18} aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete flashcard set?"
                message={pendingDelete ? `"${pendingDelete.topic}" and its ${cardsLabel(pendingDelete.cardCount)} will be permanently deleted.` : ""}
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}
