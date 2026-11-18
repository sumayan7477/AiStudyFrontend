import type { Flashcard } from "../../types/flashcards";

interface FlashcardCardProps {
    card: Flashcard;
    flipped: boolean;
    onFlip: () => void;
}

const faceClass =
    "flex min-w-0 flex-col rounded-xl border p-5 shadow-sm [backface-visibility:hidden] [grid-area:1/1] sm:p-8";

/**
 * One flashcard. The whole card is a button: click, Enter or Space flips it.
 * Only the visible side is exposed to screen readers (the other side is aria-hidden).
 */
export default function FlashcardCard({ card, flipped, onFlip }: FlashcardCardProps) {
    return (
        <button
            type="button"
            onClick={onFlip}
            aria-describedby="flashcard-flip-hint"
            data-testid="flashcard"
            data-flipped={flipped}
            className="group block w-full rounded-xl text-left [perspective:1200px] focus:outline-none"
        >
            <span
                className={`grid min-h-[16rem] rounded-xl transition-transform duration-500 [transform-style:preserve-3d] group-focus-visible:ring-2 group-focus-visible:ring-indigo-500 group-focus-visible:ring-offset-2 motion-reduce:transition-none sm:min-h-[20rem] ${
                    flipped ? "[transform:rotateY(180deg)]" : ""
                }`}
            >
                <span data-face="front" aria-hidden={flipped} className={`${faceClass} bg-white`}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Question</span>
                    <span className="flex flex-1 items-center justify-center py-4 text-center text-lg font-semibold text-gray-900 sm:text-2xl">
                        <span className="min-w-0 whitespace-pre-line break-words">{card.front}</span>
                    </span>
                    <span className="text-center text-xs text-gray-400">Click to show the answer</span>
                </span>

                <span
                    data-face="back"
                    aria-hidden={!flipped}
                    className={`${faceClass} border-indigo-200 bg-indigo-50 [transform:rotateY(180deg)]`}
                >
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Answer</span>
                    <span className="flex flex-1 items-center justify-center py-4 text-center text-base text-gray-800 sm:text-xl">
                        <span className="min-w-0 whitespace-pre-line break-words">{card.back}</span>
                    </span>
                    <span className="text-center text-xs text-gray-400">Click to show the question</span>
                </span>
            </span>
        </button>
    );
}
