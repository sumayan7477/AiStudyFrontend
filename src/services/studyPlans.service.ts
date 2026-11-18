import api from "../api/axios";
import type { ApiMessageResponse } from "../types/api";
import type { GenerateStudyPlanRequest, StudyPlan } from "../types/studyPlans";

const studyPlansService = {
    /** All of the user's study plans, newest first (includes the full plan text). */
    list: async (): Promise<StudyPlan[]> => {
        const response = await api.get<StudyPlan[]>("/studyplans");
        return response.data;
    },

    get: async (id: string): Promise<StudyPlan> => {
        const response = await api.get<StudyPlan>(`/studyplans/${encodeURIComponent(id)}`);
        return response.data;
    },

    /** AI generation: the axios client applies the 130 s AI timeout to this endpoint automatically. */
    generate: async (request: GenerateStudyPlanRequest): Promise<StudyPlan> => {
        const response = await api.post<StudyPlan>("/studyplans/generate", {
            subject: request.subject,
            dailyHours: request.dailyHours,
            examDate: request.examDate,
        });
        return response.data;
    },

    remove: async (id: string): Promise<ApiMessageResponse> => {
        const response = await api.delete<ApiMessageResponse>(`/studyplans/${encodeURIComponent(id)}`);
        return response.data;
    },
};

export default studyPlansService;
