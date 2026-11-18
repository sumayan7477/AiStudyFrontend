import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDown, Bot } from "lucide-react";

import MarkdownView from "../common/MarkdownView";
import type { ChatUiMessage } from "../../types/chat";
import { formatDateTime, formatMessageTime } from "../../utils/date";

interface MessageThreadProps {
    messages: ChatUiMessage[];
    /** Shows the typing indicator. */
    sending: boolean;
    /** Shown instead of the list when there are no messages yet. */
    emptyContent?: ReactNode;
}

/** Distance from the bottom (px) that still counts as "at the bottom". */
const STICK_THRESHOLD = 80;

/**
 * Scrollable message list. Render it with key={conversation} so each conversation starts fresh.
 * Auto-scroll: only while the user is at the bottom (or has just sent a message); if they scrolled up to
 * read, new content never moves them, and a "Jump to latest" button appears instead.
 */
export default function MessageThread({ messages, sending, emptyContent }: MessageThreadProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const stickToBottom = useRef(true);
    const renderedCount = useRef(0);
    const [atBottom, setAtBottom] = useState(true);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
        stickToBottom.current = bottom;
        setAtBottom(bottom);
    };

    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const previousCount = renderedCount.current;
        renderedCount.current = messages.length;
        const added = messages.length > previousCount;
        const last = messages[messages.length - 1];

        // The user's own new message always brings the view back to the bottom.
        if (added && last?.isUser) stickToBottom.current = true;
        if (!stickToBottom.current) return;

        const lastEl = lastMessageRef.current;
        if (added && previousCount > 0 && last && !last.isUser && lastEl && lastEl.offsetHeight > el.clientHeight) {
            // A long new answer: show its beginning rather than its end.
            el.scrollTop = lastEl.offsetTop - 16;
        } else {
            el.scrollTop = el.scrollHeight;
        }
    }, [messages, sending]);

    const jumpToLatest = () => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        stickToBottom.current = true;
        setAtBottom(true);
    };

    return (
        <div className="relative min-h-0 flex-1">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                role="log"
                aria-label="Messages"
                data-testid="chat-scroll"
                className="h-full overflow-y-auto px-3 py-4 sm:px-6"
            >
                {messages.length === 0 && !sending ? (
                    emptyContent
                ) : (
                    <div className="mx-auto max-w-3xl space-y-5">
                        {messages.map((message, index) => (
                            <div key={message.id} ref={index === messages.length - 1 ? lastMessageRef : undefined}>
                                <MessageBubble message={message} />
                            </div>
                        ))}
                        {sending && <TypingIndicator />}
                    </div>
                )}
            </div>

            {!atBottom && (
                <button
                    type="button"
                    onClick={jumpToLatest}
                    className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-sm text-gray-700 shadow hover:text-indigo-600"
                >
                    <ArrowDown size={14} aria-hidden="true" />
                    Jump to latest
                </button>
            )}
        </div>
    );
}

function MessageBubble({ message }: { message: ChatUiMessage }) {
    const time = (
        <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)} className="mt-1 block text-xs">
            {formatMessageTime(message.createdAt)}
        </time>
    );

    if (message.isUser) {
        return (
            <div className="flex justify-end">
                <div
                    data-role="user"
                    aria-label="Your message"
                    className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-white"
                >
                    {/* The user's text is shown exactly as typed (never interpreted as Markdown or HTML). */}
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    <div className="text-right text-indigo-200">{time}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-2 sm:gap-3">
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 sm:flex">
                <Bot size={18} aria-hidden="true" />
            </div>
            <div
                data-role="assistant"
                aria-label="AI response"
                className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border bg-white px-4 py-3 [&>div>*:last-child]:mb-0"
            >
                <MarkdownView content={message.text} copyCode />

                {message.truncated && (
                    <div role="note" className="mt-3 flex gap-2 rounded bg-amber-50 p-3 text-sm text-amber-800">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>
                            This answer was cut off because it reached the length limit. Ask a follow-up such as
                            "please continue" to get the rest.
                        </span>
                    </div>
                )}

                <div className="text-gray-400">{time}</div>
            </div>
        </div>
    );
}

function TypingIndicator() {
    const [slow, setSlow] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => setSlow(true), 15_000);
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <div className="flex gap-2 sm:gap-3">
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 sm:flex">
                <Bot size={18} aria-hidden="true" />
            </div>
            <div role="status" aria-live="polite" className="rounded-2xl rounded-tl-sm border bg-white px-4 py-3 text-sm text-gray-500">
                <span className="mr-2 inline-flex gap-1 align-middle" aria-hidden="true">
                    {[0, 150, 300].map((delay) => (
                        <span key={delay} className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                </span>
                The AI is thinking...
                {slow && " Long answers can take up to a minute or two."}
            </div>
        </div>
    );
}
