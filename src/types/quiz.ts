/** Quiz API shapes (Models/DTOs/Quiz on the backend). */

export const QUIZ_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type QuizDifficulty = (typeof QUIZ_DIFFICULTIES)[number];

export const ANSWER_LETTERS = ["A", "B", "C", "D"] as const;
export type AnswerLetter = (typeof ANSWER_LETTERS)[number];

/** QuizQuestionDto: never contains the correct answer or explanation. */
export interface QuizQuestion {
    id: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
}

/** QuizDto. In GET /quizzes `questions` is empty and only `questionCount` is filled. No creation date. */
export interface Quiz {
    id: string;
    topic: string;
    /** As entered when generating ("Easy", "medium", ...). */
    difficulty: string;
    questionCount: number;
    questions: QuizQuestion[];
}

/** POST /quizzes/generate (GenerateQuizDto). */
export interface GenerateQuizRequest {
    topic: string;
    difficulty: QuizDifficulty;
    numberOfQuestions: number;
}

/** QuizAnswerDto. */
export interface QuizAnswer {
    questionId: string;
    selectedAnswer: AnswerLetter;
}

/** QuestionResultDto: one per submitted answer, in submission order (no question id). */
export interface QuestionResult {
    question: string;
    /** Usually a letter; older quizzes may store the option text. */
    correctAnswer: string;
    selectedAnswer: string;
    isCorrect: boolean;
    explanation: string;
}

/** QuizResultDto. totalQuestions counts every question, answered or not; percentage = score / total * 100. */
export interface QuizResult {
    score: number;
    totalQuestions: number;
    percentage: number;
    results: QuestionResult[];
}
