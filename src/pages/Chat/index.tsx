import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Bot, MessageSquareOff, PanelLeft, Plus, Trash2 } from "lucide-react";

import { formatApiError, parseApiError, type ApiError } from "../../api/errors";
import ChatComposer from "../../components/chat/ChatComposer";
import ConversationList from "../../components/chat/ConversationList";
import MessageThread from "../../components/chat/MessageThread";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import { sharedRequest, useApiQuery } from "../../hooks/useApiQuery";
import chatService from "../../services/chat.service";
import type { ChatHistoryItem, ChatMessage, ChatUiMessage } from "../../types/chat";
import { displayTitle, isSessionId, splitTruncation, titleFromPrompt, validateChatPrompt } from "../../utils/chat";
import { formatDateTime } from "../../utils/date";

/** Key of the not-yet-saved conversation shown at /chat (the API assigns the id on the first reply). */
const NEW = "new";

// ---------------------------------------------------------------- per-conversation state

type ThreadStatus = "loading" | "ready" | "error" | "missing";

interface Thread {
    status: ThreadStatus;
    messages: ChatUiMessage[];
    loadError: ApiError | null;
    /** Waiting for the AI reply in this conversation. */
    sending: boolean;
    sendError: string | null;
}

const EMPTY_THREAD: Thread = { status: "ready", messages: [], loadError: null, sending: false, sendError: null };

type Action =
    | { type: "loadStart"; key: string }
    | { type: "loaded"; key: string; messages: ChatUiMessage[] }
    | { type: "loadFailed"; key: string; error: ApiError }
    | { type: "sendStart"; key: string; message: ChatUiMessage }
    | { type: "sendDone"; key: string; sessionId: string; reply: ChatUiMessage }
    | { type: "sendFailed"; key: string; messageId: string; error: string; missing: boolean }
    | { type: "dismissError"; key: string }
    | { type: "forget"; key: string };

/**
 * All conversations opened on this page, keyed by session id (or NEW). Every update names its
 * conversation explicitly, so a reply always lands in the conversation it was sent from, even if the
 * user has switched to another one meanwhile.
 */
function threadsReducer(state: Record<string, Thread>, action: Action): Record<string, Thread> {
    const thread = state[action.key];

    switch (action.type) {
        case "loadStart":
            if (thread && (thread.status === "ready" || thread.status === "loading")) return state;
            return { ...state, [action.key]: { ...EMPTY_THREAD, status: "loading" } };

        case "loaded":
            // Ignore late/duplicate results once the conversation is ready (e.g. StrictMode, a new chat).
            if (thread && thread.status !== "loading") return state;
            return { ...state, [action.key]: { ...EMPTY_THREAD, messages: action.messages } };

        case "loadFailed":
            if (thread && thread.status !== "loading") return state;
            return {
                ...state,
                [action.key]: {
                    ...EMPTY_THREAD,
                    status: action.error.kind === "notFound" ? "missing" : "error",
                    loadError: action.error,
                },
            };

        case "sendStart": {
            const base = thread ?? EMPTY_THREAD;
            return {
                ...state,
                [action.key]: { ...base, messages: [...base.messages, action.message], sending: true, sendError: null },
            };
        }

        case "sendDone": {
            if (!thread) return state; // deleted while waiting
            const next: Thread = { ...thread, messages: [...thread.messages, action.reply], sending: false, sendError: null };
            if (action.key === action.sessionId) return { ...state, [action.key]: next };

            // A new conversation got its id: move it from NEW to that id.
            const rest = { ...state };
            delete rest[action.key];
            return { ...rest, [action.sessionId]: next };
        }

        case "sendFailed":
            if (!thread) return state;
            return {
                ...state,
                [action.key]: {
                    ...thread,
                    // Nothing was saved by the API, so the message is removed and put back in the input.
                    messages: thread.messages.filter((m) => m.id !== action.messageId),
                    status: action.missing ? "missing" : thread.status,
                    sending: false,
                    sendError: action.error,
                },
            };

        case "dismissError":
            if (!thread) return state;
            return { ...state, [action.key]: { ...thread, sendError: null } };

        case "forget": {
            if (!thread) return state;
            const rest = { ...state };
            delete rest[action.key];
            return rest;
        }
    }
}

let messageSeq = 0;
const nextMessageId = () => `m${++messageSeq}`;

function toUiMessage(message: ChatMessage): ChatUiMessage {
    const { text, truncated } = message.isUser
        ? { text: message.message, truncated: false }
        : splitTruncation(message.message);
    return { id: nextMessageId(), isUser: message.isUser, text, createdAt: message.createdAt, truncated };
}

const SUGGESTIONS = [
    "Explain neural networks in simple terms",
    "Give me 5 practice questions about photosynthesis",
    "What is the difference between mitosis and meiosis?",
];

// ---------------------------------------------------------------- page

export default function Chat() {
    const navigate = useNavigate();
    const { sessionId: routeParam } = useParams();
    const routeId = routeParam?.toLowerCase() ?? null;
    const invalidId = routeId !== null && !isSessionId(routeId);
    const key = routeId ?? NEW;

    const [threads, dispatch] = useReducer(threadsReducer, {});
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [listOpen, setListOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // ---- history (server list + conversations created/deleted on this page) ----
    const history = useApiQuery("chat:history", chatService.history);
    const [added, setAdded] = useState<ChatHistoryItem[]>([]);
    const [removed, setRemoved] = useState<Set<string>>(() => new Set());

    const markRemoved = useCallback((id: string) => setRemoved((previous) => new Set(previous).add(id)), []);

    const serverItems = (history.data ?? []).map((item) => ({ ...item, sessionId: item.sessionId.toLowerCase() }));
    const serverIds = new Set(serverItems.map((item) => item.sessionId));
    const items = [...added.filter((item) => !serverIds.has(item.sessionId)), ...serverItems].filter(
        (item) => !removed.has(item.sessionId),
    );
    const currentItem = items.find((item) => item.sessionId === routeId);

    // ---- bookkeeping for async results ----
    const mounted = useRef(true);
    const currentKey = useRef(key);
    const sendingKeys = useRef(new Set<string>()); // blocks double submits before React re-renders

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        currentKey.current = key;
    }, [key]);

    // ---- load an existing conversation ----
    const loadMessages = useCallback(
        (id: string) => {
            // Shared request: StrictMode's second mount reuses the first request.
            sharedRequest(`chat:${id}`, () => chatService.messages(id)).then(
                (messages) => dispatch({ type: "loaded", key: id, messages: messages.map(toUiMessage) }),
                (failure: unknown) => {
                    const error = parseApiError(failure);
                    dispatch({ type: "loadFailed", key: id, error });
                    if (error.kind === "notFound") markRemoved(id);
                },
            );
        },
        [markRemoved],
    );

    const thread = threads[key];
    const threadStatus = thread?.status;

    useEffect(() => {
        if (!routeId || !isSessionId(routeId) || threadStatus !== undefined) return;
        loadMessages(routeId);
    }, [routeId, threadStatus, loadMessages]);

    const retryLoad = () => {
        if (!routeId) return;
        dispatch({ type: "loadStart", key: routeId });
        loadMessages(routeId);
    };

    // ---- send ----
    const send = async () => {
        const target = key; // the conversation this message belongs to, whatever the user opens next
        if (invalidId || sendingKeys.current.has(target)) return;
        if (target !== NEW && threads[target]?.status !== "ready") return;

        const prompt = (drafts[target] ?? "").trim();
        if (validateChatPrompt(prompt)) return; // the send button is disabled for empty input

        sendingKeys.current.add(target);
        const userMessage: ChatUiMessage = {
            id: nextMessageId(),
            isUser: true,
            text: prompt,
            createdAt: new Date().toISOString(),
            truncated: false,
        };
        dispatch({ type: "sendStart", key: target, message: userMessage });
        setDrafts((previous) => ({ ...previous, [target]: "" }));

        try {
            // User-triggered only (never from an effect), so StrictMode cannot duplicate it.
            const result = await chatService.send({ sessionId: target === NEW ? null : target, prompt });
            const sessionId = target === NEW ? result.sessionId.toLowerCase() : target;
            const { text, truncated } = splitTruncation(result.response, result.isTruncated);

            dispatch({
                type: "sendDone",
                key: target,
                sessionId,
                reply: { id: nextMessageId(), isUser: false, text, createdAt: new Date().toISOString(), truncated },
            });

            if (target === NEW) {
                // Show it in the list right away (same title rule as the API), then load the real list.
                setAdded((previous) => [
                    { sessionId, title: titleFromPrompt(prompt), createdAt: userMessage.createdAt },
                    ...previous.filter((item) => item.sessionId !== sessionId),
                ]);
                history.refetch();

                if (mounted.current && currentKey.current === NEW) {
                    navigate(`/chat/${sessionId}`, { replace: true });
                }
            }

            if (!mounted.current) toast.success("The AI assistant has replied to your chat message.");
        } catch (failure: unknown) {
            const error = parseApiError(failure);
            const missing = target !== NEW && error.kind === "notFound";
            const message = missing
                ? "This conversation no longer exists. It may have been deleted."
                : error.fieldErrors.prompt?.[0] ?? formatApiError(error);

            dispatch({ type: "sendFailed", key: target, messageId: userMessage.id, error: message, missing });
            // Keep the user's text so it can be sent again.
            setDrafts((previous) => ({ ...previous, [target]: previous[target] ? previous[target] : prompt }));
            if (missing) markRemoved(target);

            if (!mounted.current && error.kind !== "unauthorized") toast.error(message);
        } finally {
            sendingKeys.current.delete(target);
        }
    };

    // ---- delete ----
    const [pendingDelete, setPendingDelete] = useState<ChatHistoryItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    const finishDelete = (id: string, message: string) => {
        markRemoved(id);
        dispatch({ type: "forget", key: id });
        setDrafts((previous) => {
            const rest = { ...previous };
            delete rest[id];
            return rest;
        });
        toast(message);
        setPendingDelete(null);
        if (currentKey.current === id) navigate("/chat", { replace: true });
    };

    const handleDelete = async () => {
        if (!pendingDelete) return;
        const id = pendingDelete.sessionId;

        setDeleting(true);
        try {
            await chatService.remove(id);
            finishDelete(id, "Conversation deleted.");
        } catch (failure: unknown) {
            const error = parseApiError(failure);
            if (error.kind === "notFound") {
                finishDelete(id, "This conversation had already been deleted.");
            } else if (error.kind !== "unauthorized") {
                toast.error(formatApiError(error)); // the conversation stays
                setPendingDelete(null);
            }
        } finally {
            setDeleting(false);
        }
    };

    // ---- derived view state ----
    const busyIds = new Set(Object.entries(threads).filter(([, t]) => t.sending).map(([id]) => id));
    const viewStatus: ThreadStatus | "invalid" = invalidId ? "invalid" : key === NEW ? "ready" : threadStatus ?? "loading";
    const sending = thread?.sending ?? false;
    const canDeleteCurrent = routeId !== null && viewStatus === "ready" && !sending;
    const title = key === NEW ? "New conversation" : currentItem ? displayTitle(currentItem.title) : "Conversation";
    const historyError = history.error && history.error.kind !== "unauthorized" ? formatApiError(history.error) : null;

    const welcome = (
        <div className="mx-auto flex max-w-xl flex-col items-center px-2 py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Bot size={28} aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">How can I help you study?</h3>
            <p className="mt-2 text-sm text-gray-600">
                Ask about any topic. The assistant takes your recent messages in this conversation into account.
            </p>
            <div className="mt-6 flex w-full flex-col gap-2">
                {SUGGESTIONS.map((suggestion) => (
                    <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                            setDrafts((previous) => ({ ...previous, [key]: suggestion }));
                            inputRef.current?.focus();
                        }}
                        className="rounded-lg border px-4 py-2 text-left text-sm text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="mx-auto flex h-full min-h-[32rem] max-w-6xl flex-col">
            <div className="mb-4">
                <h1 className="text-3xl font-bold">AI Chat</h1>
                <p className="mt-1 hidden text-gray-600 sm:block">Ask the AI study assistant questions and continue earlier conversations.</p>
            </div>

            <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-lg bg-white shadow">
                {/* Conversation list: a column on large screens, a panel over the chat on smaller ones. */}
                <aside
                    id="chat-conversations"
                    aria-label="Conversation history"
                    className={`${listOpen ? "flex" : "hidden"} absolute inset-0 z-20 flex-col bg-white lg:static lg:z-auto lg:flex lg:w-64 lg:shrink-0 lg:border-r xl:w-72`}
                >
                    <ConversationList
                        items={items}
                        loaded={history.data !== null}
                        loading={history.loading}
                        error={historyError}
                        onRetry={history.refetch}
                        activeId={routeId}
                        busyIds={busyIds}
                        onDelete={setPendingDelete}
                        onNavigate={() => setListOpen(false)}
                        onClose={() => setListOpen(false)}
                    />
                </aside>

                <section aria-label="Chat" className="flex min-w-0 flex-1 flex-col">
                    <header className="flex items-center gap-2 border-b px-3 py-3 sm:px-5">
                        <button
                            type="button"
                            onClick={() => setListOpen(true)}
                            aria-expanded={listOpen}
                            aria-controls="chat-conversations"
                            aria-label="Show conversations"
                            title="Show conversations"
                            className="shrink-0 rounded p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
                        >
                            <PanelLeft size={20} aria-hidden="true" />
                        </button>

                        <div className="min-w-0 flex-1">
                            <h2 className="truncate font-semibold text-gray-900" title={title}>{title}</h2>
                            {currentItem && (
                                <p className="text-xs text-gray-500">
                                    Started <time dateTime={currentItem.createdAt}>{formatDateTime(currentItem.createdAt)}</time>
                                </p>
                            )}
                        </div>

                        {key !== NEW && (
                            <Link
                                to="/chat"
                                aria-label="New chat"
                                title="New chat"
                                className="shrink-0 rounded p-1.5 text-gray-600 hover:bg-gray-100 hover:text-indigo-600 lg:hidden"
                            >
                                <Plus size={20} aria-hidden="true" />
                            </Link>
                        )}

                        {canDeleteCurrent && (
                            <button
                                type="button"
                                onClick={() =>
                                    setPendingDelete(currentItem ?? { sessionId: key, title: "", createdAt: "" })
                                }
                                aria-label="Delete this conversation"
                                title="Delete this conversation"
                                className="shrink-0 rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            >
                                <Trash2 size={18} aria-hidden="true" />
                            </button>
                        )}
                    </header>

                    {(viewStatus === "invalid" || viewStatus === "missing") && (
                        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                            <MessageSquareOff className="mb-3 text-gray-400" size={32} aria-hidden="true" />
                            <h3 className="text-lg font-semibold text-gray-900">Conversation not found</h3>
                            <p className="mt-1 max-w-sm text-sm text-gray-600">
                                {thread?.sendError ?? "It may have been deleted."}
                            </p>
                            <Link to="/chat" className="mt-4 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                                Start a new conversation
                            </Link>
                        </div>
                    )}

                    {viewStatus === "loading" && (
                        <div className="flex flex-1 flex-col justify-center" aria-busy="true">
                            <Loader size="lg" />
                            <p className="text-center text-sm text-gray-500">Loading conversation...</p>
                        </div>
                    )}

                    {viewStatus === "error" && thread?.loadError && (
                        <div className="flex flex-1 items-center justify-center p-4">
                            <ErrorState
                                title="Could not load this conversation"
                                message={formatApiError(thread.loadError)}
                                onRetry={retryLoad}
                            />
                        </div>
                    )}

                    {viewStatus === "ready" && (
                        <>
                            <MessageThread
                                key={key}
                                messages={thread?.messages ?? []}
                                sending={sending}
                                emptyContent={welcome}
                            />
                            <ChatComposer
                                value={drafts[key] ?? ""}
                                onChange={(value) => setDrafts((previous) => ({ ...previous, [key]: value }))}
                                onSend={send}
                                sending={sending}
                                error={thread?.sendError ?? null}
                                onDismissError={() => dispatch({ type: "dismissError", key })}
                                inputRef={inputRef}
                            />
                        </>
                    )}
                </section>
            </div>

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete conversation?"
                message={
                    pendingDelete?.title
                        ? `"${displayTitle(pendingDelete.title)}" and all its messages will be permanently deleted.`
                        : "This conversation and all its messages will be permanently deleted."
                }
                busy={deleting}
                onConfirm={handleDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}
