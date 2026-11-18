import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface SidebarItemProps {
    name: string;
    path: string;
    icon: LucideIcon;
    onNavigate?: () => void;
}

const SidebarItem = ({
    name,
    path,
    icon: Icon,
    onNavigate,
}: SidebarItemProps) => {
    return (
        <NavLink
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200
                ${
                    isActive
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
                }`
            }
        >
            <Icon size={20} aria-hidden="true" />
            <span>{name}</span>
        </NavLink>
    );
};

export default SidebarItem;
