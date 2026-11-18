import { useEffect, useRef } from "react";
import Sidebar from "./Sidebar";

interface MobileSidebarProps {
    open: boolean;
    /** Must be stable (useCallback), it is an effect dependency. */
    onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The navigation as a slide-in drawer below the lg breakpoint (the desktop sidebar is hidden there).
 * Modal behaviour: focus moves into the drawer and stays there (Tab wraps), Escape or a click on the
 * backdrop closes it, choosing a link closes it, and focus returns to the menu button afterwards.
 */
const MobileSidebar = ({ open, onClose }: MobileSidebarProps) => {
    const panel = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        const links = panel.current;
        (links?.querySelector<HTMLElement>('nav a[aria-current="page"]') ?? links?.querySelector<HTMLElement>("nav a"))?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== "Tab" || !panel.current) return;

            const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            // Back to where the user was; normally the menu button that opened the drawer.
            const target = previouslyFocused && previouslyFocused !== document.body && previouslyFocused.isConnected
                ? previouslyFocused
                : document.querySelector<HTMLElement>('[aria-controls="mobile-navigation"]');
            target?.focus();
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" data-testid="mobile-nav-backdrop" />
            <div
                ref={panel}
                id="mobile-navigation"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
                className="absolute inset-y-0 left-0 flex w-64 max-w-[85vw] shadow-xl"
            >
                <Sidebar className="flex w-full" onNavigate={onClose} onClose={onClose} />
            </div>
        </div>
    );
};

export default MobileSidebar;
