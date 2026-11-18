import { Bell, Search } from "lucide-react";
import UserDropdown from "./UserDropdown";

const Navbar = () => {
    return (
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-white px-4 sm:px-6">

            {/* Search */}

            <div className="relative hidden w-full max-w-sm sm:block lg:max-w-md">
                <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                />

                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full rounded-lg border py-2 pl-10 pr-4 outline-none focus:border-indigo-500"
                />
            </div>

            {/* Right */}

            <div className="ml-auto flex items-center gap-4 sm:gap-6">

                {/* No unread indicator: the API has no notifications yet. */}
                <button className="relative" aria-label="Notifications">
                    <Bell size={22} />
                </button>

                {/* Level/XP badges removed: they were hardcoded ("Level 1", "0 XP"), not real data. */}

                <UserDropdown />

            </div>

        </header>
    );
};

export default Navbar;
