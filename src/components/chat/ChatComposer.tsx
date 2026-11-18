import { useEffect, useLayoutEffect, type RefObject } from "react";
import { SendHorizontal, X } from "lucide-react";

import { CHAT_PROMPT_MAX_LENGTH } from "../../utils/chat";

interface ChatComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    /** True while this conversation waits for the AI. */
    sending: boolean;
    error: string | null;
    onDismissError: () => void;
    inputRef: RefObject<HTMLTextAreaElement | null>;
}

const MAX_HEIGHT_PX = 192;

/** Multiline input: Enter sends, Shift+Enter adds a new line. */
export default function ChatComposer({ value, onChange, onSend, sending, error, onDismissError, inputRef }: ChatComposerProps) {
    const canSend = !sending && value.trim().length > 0;

    // Grow with the text (also when text is restored after a failed send).
    useLayoutEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    }, [value, inputRef]);

    // Put the cursor back in the box when the reply arrives, unless the user moved focus elsewhere.
    useEffect(() => {
        if (sending) return;
        const active = document.activeElement;
        if (!active || active === document.body) inputRef.current?.focus();
    }, [sending, inputRef]);

    const submit = () => {
        if (canSend) onSend();
    };

    const nearLimit = value.length > CHAT_PROMPT_MAX_LENGTH * 0.9;

    return (
        <form
            noValidate
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
            className="border-t bg-white p-3 sm:p-4"
        >
            {error && (
                <div role="alert" className="mx-auto mb-3 flex max-w-3xl items-start justify-between gap-3 rounded bg-red-50 p-3 text-sm text-red-700">
                    <span className="break-words">{error}</span>
                    <button type="button" onClick={onDismissError} aria-label="Dismiss error" className="shrink-0 rounded p-0.5 hover:bg-red-100">
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>
            )}

            <div className="mx-auto max-w-3xl">
                <div className="flex items-end gap-2 rounded-lg border bg-white px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <label htmlFor="chat-input" className="sr-only">Message</label>
                    <textarea
                        id="chat-input"
                        ref={inputRef}
                        rows={1}
                        value={value}
                        maxLength={CHAT_PROMPT_MAX_LENGTH}
                        disabled={sending}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => {
                            // Enter sends; Shift+Enter (and Enter while composing with an IME) adds text.
                            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        placeholder={sending ? "Waiting for the AI to reply..." : "Ask anything about your studies..."}
                        aria-describedby="chat-input-help"
                        className="min-w-0 flex-1 resize-none border-0 bg-transparent py-1.5 leading-6 focus:outline-none disabled:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!canSend}
                        aria-label="Send message"
                        title="Send message"
                        className="shrink-0 rounded-lg bg-indigo-600 p-2.5 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <SendHorizontal size={18} aria-hidden="true" />
                    </button>
                </div>

                <div id="chat-input-help" className="mt-1 flex justify-between gap-4 text-xs text-gray-400">
                    <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
                    <span className={`ml-auto ${nearLimit ? "text-amber-600" : ""}`}>
                        {value.length}/{CHAT_PROMPT_MAX_LENGTH}
                    </span>
                </div>
            </div>
        </form>
    );
}
