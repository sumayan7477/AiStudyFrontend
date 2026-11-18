import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Trash2 } from "lucide-react";

import { formatApiError, parseApiError } from "../../api/errors";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import MarkdownView from "../../components/common/MarkdownView";
import { useApiQuery } from "../../hooks/useApiQuery";
import notesService from "../../services/notes.service";
import { formatDateTime, formatRelativeTime } from "../../utils/date";

export default function NotesDetails() {
    const { id = "" } = useParams();
    const navigate = useNavigate();
    const { data: note, error, loading, refetch } = useApiQuery(`note:${id}`, () => notesService.get(id));

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!note) return;

        setDeleting(true);
        try {
            await notesService.remove(note.id);
            toast.success("Note deleted.");
            navigate("/notes", { replace: true });
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);

            if (apiError.kind === "notFound") {
                toast("This note had already been deleted.");
                navigate("/notes", { replace: true });
            } else if (apiError.kind !== "unauthorized") {
                toast.error(formatApiError(apiError)); // the note stays on screen
                setConfirmOpen(false);
            }
        } finally {
            setDeleting(false);
        }
    };

    const notFound = error?.kind === "notFound";
    const showError = error && !note && error.kind !== "unauthorized";

    return (
        <div className="mx-auto max-w-4xl">
            <Link
                to="/notes"
                className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600"
            >
                <ArrowLeft size={16} aria-hidden="true" />
                Back to notes
            </Link>

            {loading && !note && (
                <div className="rounded-lg bg-white p-10 shadow" aria-busy="true">
                    <Loader size="lg" />
                    <p className="text-center text-sm text-gray-500">Loading note...</p>
                </div>
            )}

            {showError && (
                <ErrorState
                    title={notFound ? "Note not found" : "Could not load this note"}
                    message={notFound ? "It may have been deleted." : formatApiError(error)}
                    onRetry={notFound ? undefined : refetch}
                    retrying={loading}
                />
            )}

            {note && (
                <article className="rounded-lg bg-white shadow">
                    <header className="flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4 sm:px-8 sm:py-6">
                        <div className="min-w-0">
                            <h1 className="break-words text-2xl font-bold sm:text-3xl">{note.topic}</h1>
                            <time
                                dateTime={note.createdAt}
                                title={formatDateTime(note.createdAt)}
                                className="text-sm text-gray-500"
                            >
                                Created {formatDateTime(note.createdAt)} · {formatRelativeTime(note.createdAt)}
                            </time>
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
                        <MarkdownView content={note.content} />
                    </div>
                </article>
            )}

            <ConfirmDialog
                open={confirmOpen}
                title="Delete note?"
                message={note ? `"${note.topic}" will be permanently deleted.` : ""}
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
}
