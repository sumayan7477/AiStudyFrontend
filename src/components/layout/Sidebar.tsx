import { LogOut } from "lucide-react";
import { navigation } from "../../utils/navigation";
import SidebarItem from "./SidebarItem";
import { useAuth } from "../../context/useAuth";

const Sidebar = () => {
    const { logout } = useAuth();

    return (
        <aside className="flex h-screen w-64 flex-col border-r bg-white">
            {/* Logo */}
            <div className="border-b p-6">
                <h1 className="text-2xl font-bold text-indigo-600">
                    AI Study
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 p-4">
                {navigation.map((item) => (
                    <SidebarItem
                        key={item.path}
                        {...item}
                    />
                ))}
            </nav>

            {/* Logout */}
            <div className="border-t p-4">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 hover:bg-red-50"
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;