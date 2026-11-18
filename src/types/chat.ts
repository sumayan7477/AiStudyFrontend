/** POST /api/chat body (ChatRequestDto). sessionId null starts a new conversation. */
export interface SendChatRequest {
    sessionId: string | null;
    prompt: string;
}

/** POST /api/chat response (ChatResponseDto). */
export interface SendChatResponse {
    sessionId: string;
    /** The AI answer (Markdown). When isTruncated is true it ends with the API's truncation notice. */
    response: string;
    isTruncated: boolean;
}

/** GET /api/chat/history item (ChatHistoryDto). Newest conversation first; not paginated. */
export interface ChatHistoryItem {
    sessionId: string;
    /** The first 40 characters of the conversation's first prompt. */
    title: string;
    createdAt: string;
}

/** GET /api/chat/{sessionId} item (ChatMessageDto), oldest first. Messages have no id. */
export interface ChatMessage {
    isUser: boolean;
    message: string;
    createdAt: string;
}

/** A message as shown on the chat page (API messages have no id, so the page assigns one). */
export interface ChatUiMessage {
    id: string;
    isUser: boolean;
    /** Plain text for the user's messages, Markdown for AI answers (truncation notice removed). */
    text: string;
    createdAt: string;
    /** AI answer cut off at the length limit. */
    truncated: boolean;
}
