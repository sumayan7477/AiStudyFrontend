/** StudyPlanDto from the API (GET /api/studyplans, GET /api/studyplans/{id}, POST .../generate). */
export interface StudyPlan {
    id: string;
    subject: string;
    dailyHours: number;
    /** Calendar date stored as midnight UTC, e.g. "2026-12-15T00:00:00Z" — format with formatDateOnly. */
    examDate: string;
    /** AI-generated plan as Markdown (free text; the API has no structured tasks). */
    aiResponse: string;
    /** UTC ISO-8601 timestamp. */
    createdAt: string;
}

/** POST /api/studyplans/generate body (GenerateStudyPlanDto). */
export interface GenerateStudyPlanRequest {
    subject: string;
    dailyHours: number;
    /** "YYYY-MM-DD" (the API treats it as a UTC date). */
    examDate: string;
}
