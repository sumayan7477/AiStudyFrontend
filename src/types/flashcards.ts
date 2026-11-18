/** Flashcard API shapes (Models/DTOs/Flashcards on the backend). */

/** FlashcardDto. */
export interface Flashcard {
    id: string;
    front: string;
    back: string;
}

/** FlashcardSetDto. In GET /flashcards `flashcards` is empty and only `cardCount` is filled. */
export interface FlashcardSet {
    id: string;
    topic: string;
    /** UTC, e.g. "2026-11-18T09:30:00Z". */
    createdAt: string;
    cardCount: number;
    flashcards: Flashcard[];
}

/** POST /flashcards/generate (GenerateFlashcardsDto). */
export interface GenerateFlashcardsRequest {
    topic: string;
    numberOfCards: number;
}
