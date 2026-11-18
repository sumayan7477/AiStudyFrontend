import api from "../api/axios";
import type { ApiMessageResponse } from "../types/api";
import type { GenerateNoteRequest, Note } from "../types/notes";

const notesService = {
    /** All of the user's notes, newest first (includes full content). */
    list: async (): Promise<Note[]> => {
        const response = await api.get<Note[]>("/notes");
        return response.data;
    },

    get: async (id: string): Promise<Note> => {
        const response = await api.get<Note>(`/notes/${encodeURIComponent(id)}`);
        return response.data;
    },

    /** AI generation: the axios client applies the 130 s AI timeout to this endpoint automatically. */
    generate: async (request: GenerateNoteRequest): Promise<Note> => {
        const response = await api.post<Note>("/notes/generate", { topic: request.topic });
        return response.data;
    },

    remove: async (id: string): Promise<ApiMessageResponse> => {
        const response = await api.delete<ApiMessageResponse>(`/notes/${encodeURIComponent(id)}`);
        return response.data;
    },
};

export default notesService;
