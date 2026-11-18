/** GET /api/dashboard — mirrors DashboardDto / DashboardStatsDto / RecentActivityDto on the API. */
export interface DashboardStats {
    totalStudyPlans: number;
    totalAIChats: number;
    totalQuizzes: number;
    /** Individual flashcards across all of the user's sets. */
    totalFlashcards: number;
    totalActivities: number;
}

export interface RecentActivity {
    title: string;
    /** UTC ISO-8601 timestamp, e.g. "2026-11-18T09:12:33Z". */
    createdAt: string;
}

export interface DashboardResponse {
    fullName: string;
    statistics: DashboardStats;
    /** Up to 5 most recent activities, newest first. */
    recentActivities: RecentActivity[];
}
