import { LogOut, X } from "lucide-react";
import { navigation } from "../../utils/navigation";
import SidebarItem from "./SidebarItem";
import { useAuth } from "../../context/useAuth";

interface SidebarProps {
    /** Display classes from the caller, e.g. "hidden lg:flex" (desktop) or "flex" (mobile drawer). */
    className?: string;
    /** Called after a navigation link is chosen (closes the mobile drawer). */
    onNavigate?: () => void;
    /** Shows a close button (mobile drawer only). */
    onClose?: () => void;
}

const Sidebar = ({ className = "", onNavigate, onClose }: SidebarProps) => {
    const { logout } = useAuth();

    return (
        <aside className={`h-full w-64 shrink-0 flex-col border-r bg-white ${className}`}>
            {/* Logo (not a heading: each page has its own <h1>) */}
            <div className="flex items-center justify-between border-b p-6">
                <p className="text-2xl font-bold text-indigo-600">AI Study</p>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation menu"
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                )}
            </div>

            {/* Navigation (scrolls on short screens) */}
            <nav aria-label="Main" className="flex-1 space-y-2 overflow-y-auto p-4">
                {navigation.map((item) => (
                    <SidebarItem key={item.path} {...item} onNavigate={onNavigate} />
                ))}
            </nav>

            {/* Logout */}
            <div className="border-t p-4">
                <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 hover:bg-red-50"
                >
                    <LogOut size={20} aria-hidden="true" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
