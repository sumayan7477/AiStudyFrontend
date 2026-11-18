import api from "../api/axios";
import type { ApiMessageResponse } from "../types/api";
import type { GenerateQuizRequest, Quiz, QuizAnswer, QuizResult } from "../types/quiz";

const quizzesService = {
    /** All of the user's quizzes, newest first. Questions are not included (use questionCount). */
    list: async (): Promise<Quiz[]> => {
        const response = await api.get<Quiz[]>("/quizzes");
        return response.data;
    },

    /** Quiz with its questions, without correct answers. */
    get: async (id: string): Promise<Quiz> => {
        const response = await api.get<Quiz>(`/quizzes/${encodeURIComponent(id)}`);
        return response.data;
    },

    /** AI generation: the axios client applies the 130 s AI timeout to this endpoint automatically. */
    generate: async (request: GenerateQuizRequest): Promise<Quiz> => {
        const response = await api.post<Quiz>("/quizzes/generate", {
            topic: request.topic,
            difficulty: request.difficulty,
            numberOfQuestions: request.numberOfQuestions,
        });
        return response.data;
    },

    /** Grades the answers (some questions may be left out; at least one answer is required). */
    submit: async (id: string, answers: QuizAnswer[]): Promise<QuizResult> => {
        const response = await api.post<QuizResult>(`/quizzes/${encodeURIComponent(id)}/submit`, {
            answers: answers.map((a) => ({ questionId: a.questionId, selectedAnswer: a.selectedAnswer })),
        });
        return response.data;
    },

    remove: async (id: string): Promise<ApiMessageResponse> => {
        const response = await api.delete<ApiMessageResponse>(`/quizzes/${encodeURIComponent(id)}`);
        return response.data;
    },
};

export default quizzesService;
