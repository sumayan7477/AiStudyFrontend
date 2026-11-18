import type { AnswerLetter, QuizQuestion } from "../../types/quiz";

interface QuestionNavigatorProps {
    questions: QuizQuestion[];
    answers: Record<string, AnswerLetter>;
    current: number;
    onGoTo: (index: number) => void;
    disabled?: boolean;
}

/** Numbered buttons for every question, showing which are answered and which is open. */
export default function QuestionNavigator({ questions, answers, current, onGoTo, disabled = false }: QuestionNavigatorProps) {
    return (
        <nav aria-label="Questions">
            <ol className="flex flex-wrap gap-2">
                {questions.map((question, index) => {
                    const answered = answers[question.id] !== undefined;
                    const isCurrent = index === current;
                    return (
                        <li key={question.id}>
                            <button
                                type="button"
                                onClick={() => onGoTo(index)}
                                disabled={disabled}
                                aria-current={isCurrent ? "step" : undefined}
                                aria-label={`Question ${index + 1}, ${answered ? "answered" : "not answered"}`}
                                className={`h-9 w-9 rounded-lg border text-sm font-medium disabled:opacity-60 ${
                                    isCurrent
                                        ? "border-indigo-600 ring-2 ring-indigo-600 ring-offset-1"
                                        : ""
                                } ${answered ? "border-indigo-600 bg-indigo-600 text-white" : "bg-white text-gray-700 hover:border-indigo-300"}`}
                            >
                                {index + 1}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
