import { Bell, Search } from "lucide-react";
import UserDropdown from "./UserDropdown";

const Navbar = () => {
    return (
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">

            {/* Search */}

            <div className="relative w-96">
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

            <div className="flex items-center gap-6">

                <button className="relative">
                    <Bell size={22} />

                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"></span>
                </button>

                <div className="rounded-lg bg-indigo-100 px-4 py-2 font-semibold text-indigo-600">
                    Level 1
                </div>

                <div className="rounded-lg bg-yellow-100 px-4 py-2 font-semibold text-yellow-700">
                    0 XP
                </div>

                <UserDropdown />

            </div>

        </header>
    );
};

export default Navbar;