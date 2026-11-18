import api from "../api/axios";
import type { ApiMessageResponse } from "../types/api";
import type { ChatHistoryItem, ChatMessage, SendChatRequest, SendChatResponse } from "../types/chat";

const chatService = {
    /**
     * Sends a prompt (AI call). The axios client applies the 130 s AI timeout to POST /chat automatically.
     * The API saves the prompt and the answer only when the AI call succeeds.
     */
    send: async (request: SendChatRequest): Promise<SendChatResponse> => {
        const response = await api.post<SendChatResponse>("/chat", {
            sessionId: request.sessionId,
            prompt: request.prompt,
        });
        return response.data;
    },

    /** All of the user's conversations, newest first. */
    history: async (): Promise<ChatHistoryItem[]> => {
        const response = await api.get<ChatHistoryItem[]>("/chat/history");
        return response.data;
    },

    /** Messages of one conversation, oldest first. 404 when it does not exist (or belongs to someone else). */
    messages: async (sessionId: string): Promise<ChatMessage[]> => {
        const response = await api.get<ChatMessage[]>(`/chat/${encodeURIComponent(sessionId)}`);
        return response.data;
    },

    remove: async (sessionId: string): Promise<ApiMessageResponse> => {
        const response = await api.delete<ApiMessageResponse>(`/chat/${encodeURIComponent(sessionId)}`);
        return response.data;
    },
};

export default chatService;
