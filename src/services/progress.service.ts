import api from "../api/axios";
import type { ActivityItem, ProgressOverview, Streak, TodayStats, WeeklyDay } from "../types/progress";

const progressService = {
    overview: async (): Promise<ProgressOverview> => (await api.get<ProgressOverview>("/progress")).data,
    stats: async (): Promise<TodayStats> => (await api.get<TodayStats>("/progress/stats")).data,
    weekly: async (): Promise<WeeklyDay[]> => (await api.get<WeeklyDay[]>("/progress/weekly")).data,
    streak: async (): Promise<Streak> => (await api.get<Streak>("/progress/streak")).data,
};

export const activityService = {
    /** The latest 20 activities, newest first (the API's limit). */
    list: async (): Promise<ActivityItem[]> => (await api.get<ActivityItem[]>("/activity")).data,
};

/** Number of activities GET /api/activity returns at most. */
export const ACTIVITY_LIMIT = 20;

export default progressService;
