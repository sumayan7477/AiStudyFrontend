import { ANSWER_LETTERS, type AnswerLetter, type QuizQuestion } from "../../types/quiz";
import { optionText } from "../../utils/quiz";

interface QuestionCardProps {
    question: QuizQuestion;
    number: number;
    total: number;
    selected: AnswerLetter | undefined;
    onSelect: (letter: AnswerLetter) => void;
    disabled?: boolean;
}

/** One question with its four options as a native radio group (arrow keys move between options). */
export default function QuestionCard({ question, number, total, selected, onSelect, disabled = false }: QuestionCardProps) {
    return (
        <fieldset disabled={disabled} className="min-w-0">
            <legend className="mb-1 text-sm font-medium text-indigo-600">
                Question {number} of {total}
            </legend>
            <p id={`question-${question.id}-text`} className="mb-5 whitespace-pre-line break-words text-lg font-semibold text-gray-900">
                {question.question}
            </p>

            <div className="space-y-3" role="radiogroup" aria-labelledby={`question-${question.id}-text`}>
                {ANSWER_LETTERS.map((letter) => {
                    const checked = selected === letter;
                    return (
                        <label
                            key={letter}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-indigo-500 ${
                                checked ? "border-indigo-600 bg-indigo-50" : "hover:border-indigo-300 hover:bg-gray-50"
                            } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
                        >
                            <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={letter}
                                checked={checked}
                                onChange={() => onSelect(letter)}
                                className="sr-only"
                            />
                            <span
                                aria-hidden="true"
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                                    checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 text-gray-600"
                                }`}
                            >
                                {letter}
                            </span>
                            <span className="min-w-0 break-words pt-0.5 text-gray-800">
                                <span className="sr-only">Option {letter}: </span>
                                {optionText(question, letter)}
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}
