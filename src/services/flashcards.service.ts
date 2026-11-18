import api from "../api/axios";
import type { ApiMessageResponse } from "../types/api";
import type { FlashcardSet, GenerateFlashcardsRequest } from "../types/flashcards";

const flashcardsService = {
    /** All of the user's sets, newest first. Cards are not included (use cardCount). */
    list: async (): Promise<FlashcardSet[]> => {
        const response = await api.get<FlashcardSet[]>("/flashcards");
        return response.data;
    },

    /** One set with its cards. */
    get: async (id: string): Promise<FlashcardSet> => {
        const response = await api.get<FlashcardSet>(`/flashcards/${encodeURIComponent(id)}`);
        return response.data;
    },

    /** AI generation: the axios client applies the 130 s AI timeout to this endpoint automatically. */
    generate: async (request: GenerateFlashcardsRequest): Promise<FlashcardSet> => {
        const response = await api.post<FlashcardSet>("/flashcards/generate", {
            topic: request.topic,
            numberOfCards: request.numberOfCards,
        });
        return response.data;
    },

    remove: async (id: string): Promise<ApiMessageResponse> => {
        const response = await api.delete<ApiMessageResponse>(`/flashcards/${encodeURIComponent(id)}`);
        return response.data;
    },
};

export default flashcardsService;
