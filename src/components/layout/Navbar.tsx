import { Bell, Menu, Search } from "lucide-react";
import UserDropdown from "./UserDropdown";

interface NavbarProps {
    /** Opens the navigation drawer (shown below the lg breakpoint only). */
    onMenuClick: () => void;
    menuOpen: boolean;
}

const Navbar = ({ onMenuClick, menuOpen }: NavbarProps) => {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-white px-4 sm:px-6">

            <button
                type="button"
                onClick={onMenuClick}
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                className="shrink-0 rounded p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            >
                <Menu size={22} aria-hidden="true" />
            </button>

            {/* Search (not connected to the API yet) */}

            <div className="relative hidden w-full max-w-sm sm:block lg:max-w-md">
                <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                    aria-hidden="true"
                />

                <input
                    type="search"
                    placeholder="Search..."
                    aria-label="Search"
                    className="w-full rounded-lg border py-2 pl-10 pr-4 outline-none focus:border-indigo-500"
                />
            </div>

            {/* Right */}

            <div className="ml-auto flex min-w-0 items-center gap-4 sm:gap-6">

                {/* No unread indicator: the API has no notifications yet. */}
                <button type="button" className="relative" aria-label="Notifications">
                    <Bell size={22} aria-hidden="true" />
                </button>

                {/* Level/XP badges removed: they were hardcoded ("Level 1", "0 XP"), not real data. */}

                <UserDropdown />

            </div>

        </header>
    );
};

export default Navbar;
