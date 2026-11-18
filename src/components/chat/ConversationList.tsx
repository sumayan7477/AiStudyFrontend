import { Link } from "react-router-dom";
import { MessageSquare, Plus, RotateCw, Trash2, X } from "lucide-react";

import EmptyState from "../common/EmptyState";
import Loader from "../common/Loader";
import type { ChatHistoryItem } from "../../types/chat";
import { displayTitle } from "../../utils/chat";
import { formatDateTime, formatRelativeTime } from "../../utils/date";

interface ConversationListProps {
    items: ChatHistoryItem[];
    /** False until the history has loaded once. */
    loaded: boolean;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
    activeId: string | null;
    /** Conversations waiting for an AI reply (cannot be deleted meanwhile). */
    busyIds: ReadonlySet<string>;
    onDelete: (item: ChatHistoryItem) => void;
    /** Called after choosing a conversation or "New chat" (closes the panel on small screens). */
    onNavigate: () => void;
    onClose: () => void;
}

export default function ConversationList({
    items,
    loaded,
    loading,
    error,
    onRetry,
    activeId,
    busyIds,
    onDelete,
    onNavigate,
    onClose,
}: ConversationListProps) {
    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <h2 className="font-semibold">Conversations</h2>
                <div className="flex items-center gap-1">
                    {loaded && (
                        <button
                            type="button"
                            onClick={onRetry}
                            disabled={loading}
                            aria-label="Refresh conversations"
                            title="Refresh conversations"
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-60"
                        >
                            <RotateCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close conversations"
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="border-b p-3">
                <Link
                    to="/chat"
                    onClick={onNavigate}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                >
                    <Plus size={18} aria-hidden="true" />
                    New chat
                </Link>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {!loaded && loading && (
                    <div aria-busy="true" className="py-6">
                        <Loader size="sm" />
                        <p className="text-center text-sm text-gray-500">Loading conversations...</p>
                    </div>
                )}

                {!loaded && error && (
                    <div role="alert" className="m-3 rounded bg-red-50 p-3 text-sm text-red-700">
                        <p className="mb-2">Could not load your conversations. {error}</p>
                        <button
                            type="button"
                            onClick={onRetry}
                            disabled={loading}
                            className="flex items-center gap-1 rounded bg-white px-3 py-1 text-red-700 shadow-sm hover:bg-red-100 disabled:opacity-60"
                        >
                            <RotateCw size={14} aria-hidden="true" />
                            Try again
                        </button>
                    </div>
                )}

                {loaded && items.length === 0 && (
                    <EmptyState icon={MessageSquare} title="No conversations yet" message="Your conversations will appear here." />
                )}

                {items.length > 0 && (
                    <ul aria-label="Saved conversations" className="space-y-1 p-2">
                        {items.map((item) => {
                            const active = item.sessionId === activeId;
                            const title = displayTitle(item.title);
                            return (
                                <li
                                    key={item.sessionId}
                                    className={`group flex items-start gap-1 rounded-lg ${active ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                                >
                                    <Link
                                        to={`/chat/${item.sessionId}`}
                                        onClick={onNavigate}
                                        aria-current={active ? "page" : undefined}
                                        className="min-w-0 flex-1 px-3 py-2"
                                    >
                                        <p title={title} className={`truncate text-sm font-medium ${active ? "text-indigo-700" : "text-gray-800"}`}>
                                            {title}
                                        </p>
                                        <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)} className="text-xs text-gray-500">
                                            {formatRelativeTime(item.createdAt)}
                                        </time>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(item)}
                                        disabled={busyIds.has(item.sessionId)}
                                        aria-label={`Delete conversation "${title}"`}
                                        title="Delete conversation"
                                        className="mr-1 mt-2 shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                    >
                                        <Trash2 size={16} aria-hidden="true" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
