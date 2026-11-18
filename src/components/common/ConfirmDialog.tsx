import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Shows a busy label and disables both buttons while the action runs. */
    busy?: boolean;
    busyLabel?: string;
    /** "danger" (default) for destructive actions, "primary" for others (e.g. submitting a quiz). */
    tone?: "danger" | "primary";
    onConfirm: () => void;
    onCancel: () => void;
}

/** Small modal used before destructive actions. Escape or a backdrop click cancels. */
const ConfirmDialog = ({
    open,
    title,
    message,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    busy = false,
    busyLabel = "Deleting...",
    tone = "danger",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    const cancelButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;

        // Focus the safe option first.
        cancelButton.current?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !busy) onCancel();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, busy, onCancel]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => !busy && onCancel()}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
                className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="confirm-dialog-title" className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
                <p id="confirm-dialog-message" className="mb-6 whitespace-pre-line break-words text-sm text-gray-600">{message}</p>

                <div className="flex justify-end gap-3">
                    <button
                        ref={cancelButton}
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className={`rounded-lg px-4 py-2 text-sm text-white disabled:opacity-60 ${tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                    >
                        {busy ? busyLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
