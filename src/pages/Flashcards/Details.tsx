import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Layers, ListRestart, RotateCcw, Shuffle } from "lucide-react";

import { formatApiError } from "../../api/errors";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import FlashcardCard from "../../components/flashcards/FlashcardCard";
import { useApiQuery } from "../../hooks/useApiQuery";
import flashcardsService from "../../services/flashcards.service";
import type { Flashcard } from "../../types/flashcards";
import { formatDateTime, formatRelativeTime } from "../../utils/date";
import { identityOrder, shuffled } from "../../utils/shuffle";

export default function FlashcardDetails() {
    const { id = "" } = useParams();
    // key: position, flip state and shuffle order never carry over to another set.
    return <FlashcardSetView key={id} id={id} />;
}

function FlashcardSetView({ id }: { id: string }) {
    const { data: set, error, loading, refetch } = useApiQuery(`flashcards:${id}`, () => flashcardsService.get(id));
    const notFound = error?.kind === "notFound";

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/flashcards" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                <ArrowLeft size={16} aria-hidden="true" />
                Back to flashcard sets
            </Link>

            {loading && !set && (
                <div className="rounded-lg bg-white p-10 shadow" aria-busy="true">
                    <Loader size="lg" />
                    <p className="text-center text-sm text-gray-500">Loading flashcards...</p>
                </div>
            )}

            {error && !set && error.kind !== "unauthorized" && (
                <ErrorState
                    title={notFound ? "Flashcard set not found" : "Could not load this flashcard set"}
                    message={notFound ? "It may have been deleted." : formatApiError(error)}
                    onRetry={notFound ? undefined : refetch}
                    retrying={loading}
                />
            )}

            {set && (
                <>
                    <header className="mb-4">
                        <h1 className="break-words text-2xl font-bold sm:text-3xl">{set.topic}</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            {set.flashcards.length} {set.flashcards.length === 1 ? "card" : "cards"}{" "}
                            <span className="mx-1 text-gray-300" aria-hidden="true">·</span>{" "}
                            <time dateTime={set.createdAt} title={formatDateTime(set.createdAt)}>
                                Created {formatRelativeTime(set.createdAt)}
                            </time>
                        </p>
                    </header>

                    {set.flashcards.length === 0 ? (
                        <div className="rounded-lg bg-white shadow">
                            <EmptyState icon={Layers} title="This set has no cards" message="Generate a new set from the flashcards page." />
                        </div>
                    ) : (
                        <StudyDeck cards={set.flashcards} />
                    )}
                </>
            )}
        </div>
    );
}

function StudyDeck({ cards }: { cards: Flashcard[] }) {
    // `order` is a permutation of card indexes: shuffling reorders it, never the cards themselves.
    const [order, setOrder] = useState(() => identityOrder(cards.length));
    const [position, setPosition] = useState(0);
    const [flipped, setFlipped] = useState(false);

    const total = cards.length;
    const card = cards[order[position]];
    const isShuffled = order.some((value, index) => value !== index);
    const atStart = position === 0;
    const atEnd = position === total - 1;

    const goTo = (next: number) => {
        setPosition(Math.min(Math.max(next, 0), total - 1));
        setFlipped(false); // a new card always starts with its question
    };

    const reorder = (nextOrder: number[]) => {
        setOrder(nextOrder);
        setPosition(0);
        setFlipped(false);
    };

    // Arrow keys move between cards (Enter/Space on the focused card flip it).
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, [contenteditable='true'], [role='alertdialog']")) return;

            if (e.key === "ArrowRight") {
                e.preventDefault();
                setPosition((p) => Math.min(p + 1, total - 1));
                setFlipped(false);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setPosition((p) => Math.max(p - 1, 0));
                setFlipped(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [total]);

    return (
        <section aria-label="Study flashcards" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p aria-live="polite" className="text-sm font-medium text-gray-700" data-testid="card-position">
                    Card {position + 1} of {total}
                    {isShuffled && " "}
                    {isShuffled && <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">Shuffled</span>}
                </p>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => reorder(shuffled(identityOrder(total)))}
                        disabled={total < 2}
                        className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-sm text-gray-700 hover:text-indigo-600 disabled:opacity-50"
                    >
                        <Shuffle size={16} aria-hidden="true" />
                        Shuffle
                    </button>
                    {isShuffled && (
                        <button
                            type="button"
                            onClick={() => reorder(identityOrder(total))}
                            className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-sm text-gray-700 hover:text-indigo-600"
                        >
                            <ListRestart size={16} aria-hidden="true" />
                            Original order
                        </button>
                    )}
                </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${((position + 1) / total) * 100}%` }} />
            </div>

            <FlashcardCard key={card.id} card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
            <p id="flashcard-flip-hint" className="text-center text-xs text-gray-500">
                Press Enter or Space on the card to flip it. Use the ← and → arrow keys to move between cards.
            </p>

            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => goTo(position - 1)}
                    disabled={atStart}
                    className="flex items-center gap-1 rounded-lg border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                    <ChevronLeft size={16} aria-hidden="true" />
                    Previous
                </button>

                <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                >
                    <RotateCcw size={16} aria-hidden="true" />
                    {flipped ? "Show question" : "Show answer"}
                </button>

                {atEnd ? (
                    <button
                        type="button"
                        onClick={() => goTo(0)}
                        disabled={total < 2}
                        className="flex items-center gap-1 rounded-lg border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                        Start over
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => goTo(position + 1)}
                        className="flex items-center gap-1 rounded-lg border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Next
                        <ChevronRight size={16} aria-hidden="true" />
                    </button>
                )}
            </div>
        </section>
    );
}
