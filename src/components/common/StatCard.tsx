import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: number;
    icon: LucideIcon;
}

const StatCard = ({ label, value, icon: Icon }: StatCardProps) => {
    return (
        <div className="flex items-center gap-4 rounded-lg bg-white p-5 shadow">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Icon size={24} aria-hidden="true" />
            </div>

            <div className="min-w-0">
                <p className="truncate text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
            </div>
        </div>
    );
};

export default StatCard;
