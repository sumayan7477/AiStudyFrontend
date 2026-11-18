import {
    ANSWER_LETTERS,
    type AnswerLetter,
    type Quiz,
    type QuestionResult,
    type QuizAnswer,
    type QuizQuestion,
    type QuizResult,
} from "../types/quiz";

export function optionText(question: QuizQuestion, letter: AnswerLetter): string {
    switch (letter) {
        case "A": return question.optionA;
        case "B": return question.optionB;
        case "C": return question.optionC;
        case "D": return question.optionD;
    }
}

/**
 * Turns an answer from the API into a letter: "B" / "b" or, for older quizzes that stored the
 * option text, the matching option. Returns null when it matches nothing.
 */
export function toLetter(answer: string, question: QuizQuestion): AnswerLetter | null {
    const value = answer.trim();
    const upper = value.toUpperCase();
    if ((ANSWER_LETTERS as readonly string[]).includes(upper)) return upper as AnswerLetter;

    return ANSWER_LETTERS.find((letter) => optionText(question, letter).trim().toLowerCase() === value.toLowerCase()) ?? null;
}

/** "medium" -> "Medium" (the API keeps the casing used when the quiz was generated). */
export function formatDifficulty(difficulty: string): string {
    const value = difficulty.trim();
    return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "Unknown";
}

export function difficultyBadgeClass(difficulty: string): string {
    switch (difficulty.trim().toLowerCase()) {
        case "easy": return "bg-green-100 text-green-800";
        case "medium": return "bg-amber-100 text-amber-800";
        case "hard": return "bg-red-100 text-red-800";
        default: return "bg-gray-100 text-gray-700";
    }
}

/** e.g. 66.67 -> "66.67%", 70 -> "70%". */
export function formatPercentage(value: number): string {
    return `${Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}%`;
}

// ---------------------------------------------------------------- results

/** What the result page receives from the quiz page (router state; there is no API to load results later). */
export interface QuizResultState {
    quiz: Quiz;
    answers: QuizAnswer[];
    result: QuizResult;
}

export function isQuizResultState(value: unknown, quizId: string): value is QuizResultState {
    if (typeof value !== "object" || value === null) return false;
    const state = value as Partial<QuizResultState>;
    return (
        state.quiz?.id === quizId &&
        Array.isArray(state.quiz.questions) &&
        Array.isArray(state.answers) &&
        Array.isArray(state.result?.results)
    );
}

export interface ResultRow {
    number: number;
    question: QuizQuestion;
    /** Null when the question was not answered (it scores zero; the API returns nothing for it). */
    outcome: {
        selected: AnswerLetter | null;
        correct: AnswerLetter | null;
        /** Raw values, shown when they do not match an option (older quizzes). */
        selectedRaw: string;
        correctRaw: string;
        isCorrect: boolean;
        explanation: string;
    } | null;
}

/**
 * One row per quiz question, in quiz order. The API returns results in the order the answers were
 * submitted (without question ids), so result i belongs to submitted answer i.
 */
export function buildResultRows({ quiz, answers, result }: QuizResultState): ResultRow[] {
    const byQuestion = new Map<string, QuestionResult>();
    if (result.results.length === answers.length) {
        answers.forEach((answer, index) => byQuestion.set(answer.questionId, result.results[index]));
    } else {
        // Defensive fallback (should not happen): match by question text.
        for (const item of result.results) {
            const question = quiz.questions.find((q) => q.question === item.question && !byQuestion.has(q.id));
            if (question) byQuestion.set(question.id, item);
        }
    }

    return quiz.questions.map((question, index) => {
        const item = byQuestion.get(question.id);
        return {
            number: index + 1,
            question,
            outcome: item
                ? {
                    selected: toLetter(item.selectedAnswer, question),
                    correct: toLetter(item.correctAnswer, question),
                    selectedRaw: item.selectedAnswer,
                    correctRaw: item.correctAnswer,
                    isCorrect: item.isCorrect,
                    explanation: item.explanation,
                }
                : null,
        };
    });
}
