/** GET /api/progress (ProgressDto). */
export interface ProgressOverview {
    totalChats: number;
    totalStudyPlans: number;
    totalQuizzes: number;
    /** Number of quiz attempts (submissions). */
    completedQuizzes: number;
    /** Average attempt result, 0-100. The API returns 0 when there are no attempts. */
    averageQuizScore: number;
    currentStreak: number;
    totalActivities: number;
}

/** GET /api/progress/stats (StatsDto): counts for the current UTC day. */
export interface TodayStats {
    /** New chat conversations started today (not messages). */
    todayChats: number;
    todayActivities: number;
    todayStudyPlans: number;
    /** Quiz attempts submitted today. */
    todayQuizzes: number;
}

/** GET /api/progress/weekly item (WeeklyProgressDto): 7 items, oldest first, ending with the current UTC day. */
export interface WeeklyDay {
    /** Short day name from the server, e.g. "Mon". No date is included. */
    day: string;
    activities: number;
}

/** GET /api/progress/streak (StreakDto). */
export interface Streak {
    /** Consecutive UTC days with activity, ending today or yesterday. */
    currentStreak: number;
    /** Midnight UTC of the last active day; "0001-01-01T00:00:00Z" when the user has no activity. */
    lastActiveDate: string;
}

/** GET /api/activity item (ActivityDto): the latest 20, newest first. */
export interface ActivityItem {
    title: string;
    createdAt: string;
}
