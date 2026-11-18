/** Chat limits and helpers that mirror the API (AiRequestLimits, ChatService, ChatResponseDto). */

export const CHAT_PROMPT_MAX_LENGTH = 4000;

/** The API names a new conversation after the first 40 characters of its first prompt. */
const TITLE_LENGTH = 40;

/**
 * Appended by the API to truncated answers (ChatResponseDto.TruncationNotice). It is also saved in the
 * history, which has no truncation flag, so this is the only way to recognise a truncated saved answer.
 */
const TRUNCATION_NOTICE =
    "\n\n[Response incomplete: the answer was cut off because it reached the length limit. " +
    "Ask a follow-up question such as \"please continue\" to get the rest.]";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSessionId(value: string): boolean {
    return GUID.test(value);
}

export function validateChatPrompt(prompt: string): string | undefined {
    const value = prompt.trim();
    if (!value) return "Please type a message.";
    if (value.length > CHAT_PROMPT_MAX_LENGTH) return `Messages can be at most ${CHAT_PROMPT_MAX_LENGTH} characters.`;
    return undefined;
}

/** Same rule as ChatService: shown in the list until the refreshed history arrives. */
export function titleFromPrompt(prompt: string): string {
    return prompt.length > TITLE_LENGTH ? prompt.substring(0, TITLE_LENGTH) : prompt;
}

/** One-line title: the API's title is the start of the first prompt, which may contain line breaks. */
export function displayTitle(title: string | undefined): string {
    return title?.replace(/\s+/g, " ").trim() || "Untitled conversation";
}

/**
 * Splits an AI answer into its text and a truncation flag. The API's own notice is removed from the
 * text so the page can show it as a warning instead (it is kept if the wording ever changes).
 */
export function splitTruncation(message: string, flagged = false): { text: string; truncated: boolean } {
    if (message.endsWith(TRUNCATION_NOTICE)) {
        return { text: message.slice(0, -TRUNCATION_NOTICE.length), truncated: true };
    }
    return { text: message, truncated: flagged };
}
