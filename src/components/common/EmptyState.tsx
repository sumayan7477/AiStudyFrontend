import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
    title: string;
    message?: string;
    icon?: LucideIcon;
}

const EmptyState = ({ title, message, icon: Icon = Inbox }: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center px-4 py-8 text-center">
            <Icon className="mb-3 text-gray-400" size={32} aria-hidden="true" />
            <p className="font-medium text-gray-700">{title}</p>
            {message && <p className="mt-1 max-w-md text-sm text-gray-500">{message}</p>}
        </div>
    );
};

export default EmptyState;
