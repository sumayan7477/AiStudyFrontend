import {
    LayoutDashboard,
    MessageSquare,
    CalendarDays,
    BookOpen,
    FileText,
    Layers,
    TrendingUp,
    Trophy,
    History,
    User,
    Settings
} from "lucide-react";

export const navigation = [
    {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
    },
    {
        name: "AI Chat",
        icon: MessageSquare,
        path: "/chat",
    },
    {
        name: "Study Plans",
        icon: CalendarDays,
        path: "/study-plans",
    },
    {
        name: "Quizzes",
        icon: BookOpen,
        path: "/quizzes",
    },
    {
        name: "Notes",
        icon: FileText,
        path: "/notes",
    },
    {
        name: "Flashcards",
        icon: Layers,
        path: "/flashcards",
    },
    {
        name: "Progress",
        icon: TrendingUp,
        path: "/progress",
    },
    {
        name: "Gamification",
        icon: Trophy,
        path: "/gamification",
    },
    {
        name: "Activity",
        icon: History,
        path: "/activity",
    },
    {
        name: "Profile",
        icon: User,
        path: "/profile",
    },
    {
        name: "Settings",
        icon: Settings,
        path: "/settings",
    },
];