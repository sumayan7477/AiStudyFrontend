import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FileText, RotateCw, Sparkles, Trash2 } from "lucide-react";

import { formatApiError, parseApiError } from "../../api/errors";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import { useApiQuery } from "../../hooks/useApiQuery";
import notesService from "../../services/notes.service";
import type { Note } from "../../types/notes";
import { formatDateTime, formatRelativeTime } from "../../utils/date";
import { markdownPreview } from "../../utils/markdown";
import { TOPIC_MAX_LENGTH, validateTopic } from "../../utils/validation";

export default function Notes() {
    const navigate = useNavigate();
    const { data, error, loading, refetch } = useApiQuery("notes", notesService.list);

    // Notes deleted in this session (removed from the list only after the API confirms).
    const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

    // ---- generate ----
    const [topic, setTopic] = useState("");
    const [topicError, setTopicError] = useState<string | undefined>();
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

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (generatingRef.current) return;

        const validation = validateTopic(topic);
        if (validation) {
            setTopicError(validation);
            return;
        }

        generatingRef.current = true;
        setGenerating(true);
        setGenerateError(null);

        try {
            // User-triggered only (never from an effect), so StrictMode cannot duplicate it.
            const note = await notesService.generate({ topic: topic.trim() });

            if (mounted.current) {
                toast.success("Notes generated.");
                navigate(`/notes/${note.id}`);
            } else {
                // The user left the page while the AI was working; do not move them.
                toast.success(`Your notes on "${note.topic}" are ready.`);
            }
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);
            if (apiError.kind === "unauthorized") return; // AuthContext signs the user out

            if (!mounted.current) {
                toast.error(formatApiError(apiError));
                return;
            }

            const fieldMessage = apiError.fieldErrors.topic?.[0];
            if (fieldMessage) setTopicError(fieldMessage);
            else setGenerateError(formatApiError(apiError));
        } finally {
            generatingRef.current = false;
            if (mounted.current) setGenerating(false);
        }
    };

    // ---- delete ----
    const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
    const [deleting, setDeleting] = useState(false);

    const markRemoved = (id: string) =>
        setRemovedIds((previous) => new Set(previous).add(id));

    const handleDelete = async () => {
        if (!pendingDelete) return;
        const note = pendingDelete;

        setDeleting(true);
        try {
            await notesService.remove(note.id);
            markRemoved(note.id);
            toast.success("Note deleted.");
            setPendingDelete(null);
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);

            if (apiError.kind === "notFound") {
                markRemoved(note.id);
                toast("This note had already been deleted.");
                setPendingDelete(null);
            } else if (apiError.kind !== "unauthorized") {
                // The note stays in the list.
                toast.error(formatApiError(apiError));
                setPendingDelete(null);
            }
        } finally {
            setDeleting(false);
        }
    };

    const notes = (data ?? []).filter((note) => !removedIds.has(note.id));
    const showListError = error && !data && error.kind !== "unauthorized";

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Notes</h1>
                    <p className="mt-1 text-gray-600">Generate study notes on any topic with AI.</p>
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
                <label htmlFor="note-topic" className="mb-2 block font-semibold">
                    Topic
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                        id="note-topic"
                        name="topic"
                        type="text"
                        value={topic}
                        maxLength={TOPIC_MAX_LENGTH}
                        disabled={generating}
                        onChange={(e) => {
                            setTopic(e.target.value);
                            setTopicError(undefined);
                            setGenerateError(null);
                        }}
                        placeholder="e.g. Photosynthesis"
                        aria-invalid={!!topicError}
                        aria-describedby="note-topic-help"
                        className="min-w-0 flex-1 rounded border p-3 disabled:bg-gray-50"
                    />

                    <button
                        type="submit"
                        disabled={generating}
                        className="flex items-center justify-center gap-2 rounded bg-indigo-600 px-5 py-3 text-white disabled:opacity-60"
                    >
                        <Sparkles size={18} aria-hidden="true" />
                        {generating ? "Generating..." : "Generate notes"}
                    </button>
                </div>

                <div id="note-topic-help" className="mt-2 flex justify-between gap-4 text-sm">
                    <span className={topicError ? "text-red-600" : "text-gray-500"}>
                        {topicError ?? "The AI writes structured notes in Markdown."}
                    </span>
                    <span className="shrink-0 text-gray-400">{topic.length}/{TOPIC_MAX_LENGTH}</span>
                </div>

                {generating && (
                    <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded bg-indigo-50 p-3 text-sm text-indigo-700">
                        <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        Generating notes... This can take up to a minute.
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
                    <p className="text-center text-sm text-gray-500">Loading your notes...</p>
                </div>
            )}

            {showListError && (
                <ErrorState
                    title="Could not load your notes"
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
                <section aria-label="Saved notes" className="rounded-lg bg-white shadow">
                    <h2 className="border-b px-5 py-4 text-lg font-semibold">
                        Saved notes{notes.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({notes.length})</span>}
                    </h2>

                    {notes.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="No notes yet"
                            message="Enter a topic above to generate your first notes."
                        />
                    ) : (
                        <ul className="divide-y">
                            {notes.map((note) => (
                                <li key={note.id} className="flex items-start gap-3 px-5 py-4">
                                    <Link to={`/notes/${note.id}`} className="group min-w-0 flex-1">
                                        <p className="break-words font-semibold text-gray-900 group-hover:text-indigo-600">
                                            {note.topic}
                                        </p>
                                        <time
                                            dateTime={note.createdAt}
                                            title={formatDateTime(note.createdAt)}
                                            className="text-sm text-gray-500"
                                        >
                                            {formatDateTime(note.createdAt)} · {formatRelativeTime(note.createdAt)}
                                        </time>
                                        <p className="mt-1 line-clamp-2 break-words text-sm text-gray-600">
                                            {markdownPreview(note.content)}
                                        </p>
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => setPendingDelete(note)}
                                        aria-label={`Delete note "${note.topic}"`}
                                        title="Delete note"
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
                title="Delete note?"
                message={pendingDelete ? `"${pendingDelete.topic}" will be permanently deleted.` : ""}
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}
