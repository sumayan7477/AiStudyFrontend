import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CircleSlash, RotateCcw, XCircle } from "lucide-react";

import { ANSWER_LETTERS, type AnswerLetter } from "../../types/quiz";
import {
    buildResultRows,
    difficultyBadgeClass,
    formatDifficulty,
    formatPercentage,
    isQuizResultState,
    optionText,
    type ResultRow,
} from "../../utils/quiz";

/**
 * Results come from the submission (router state). The API has no endpoint to load a past result,
 * so opening this page directly shows an explanation instead of invented data.
 */
export default function QuizResult() {
    const { id = "" } = useParams();
    const location = useLocation();
    const state = isQuizResultState(location.state, id) ? location.state : null;

    if (!state) {
        return (
            <div className="mx-auto max-w-3xl">
                <div className="flex flex-col items-center rounded-lg bg-white p-8 text-center shadow">
                    <CircleSlash className="mb-3 text-gray-400" size={32} aria-hidden="true" />
                    <h1 className="mb-1 text-lg font-semibold text-gray-900">No results to show</h1>
                    <p className="mb-5 max-w-md text-sm text-gray-600">
                        Results are shown right after you submit a quiz and are not available to open again later.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to={`/quizzes/${id}`} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Take this quiz</Link>
                        <Link to="/quizzes" className="rounded border px-4 py-2 text-gray-700 hover:bg-gray-50">Back to quizzes</Link>
                    </div>
                </div>
            </div>
        );
    }

    const { quiz, result } = state;
    const rows = buildResultRows(state);
    const answered = rows.filter((row) => row.outcome !== null).length;
    const percentage = result.percentage;
    const verdict = percentage >= 80 ? "Excellent work!" : percentage >= 50 ? "Good effort!" : "Keep practising!";

    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <Link to="/quizzes" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                <ArrowLeft size={16} aria-hidden="true" />
                Back to quizzes
            </Link>

            <section aria-label="Score" className="rounded-lg bg-white p-6 shadow">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-indigo-600">Quiz results</p>
                        <h1 className="break-words text-2xl font-bold">{quiz.topic}</h1>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${difficultyBadgeClass(quiz.difficulty)}`}>
                            {formatDifficulty(quiz.difficulty)}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-bold text-indigo-600" data-testid="quiz-percentage">{formatPercentage(percentage)}</p>
                        <p className="text-sm text-gray-600">{verdict}</p>
                    </div>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-lg bg-gray-50 p-3">
                        <dt className="text-xs text-gray-500">Score</dt>
                        <dd className="text-lg font-semibold" data-testid="quiz-score">{result.score} / {result.totalQuestions}</dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                        <dt className="text-xs text-gray-500">Answered</dt>
                        <dd className="text-lg font-semibold">{answered} / {result.totalQuestions}</dd>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                        <dt className="text-xs text-gray-500">Total questions</dt>
                        <dd className="text-lg font-semibold">{result.totalQuestions}</dd>
                    </div>
                </dl>

                {answered < result.totalQuestions && (
                    <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
                        {result.totalQuestions - answered} unanswered {result.totalQuestions - answered === 1 ? "question" : "questions"} scored 0
                        and {result.totalQuestions - answered === 1 ? "is" : "are"} included in the percentage.
                    </p>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                    <Link to={`/quizzes/${quiz.id}`} className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                        <RotateCcw size={16} aria-hidden="true" />
                        Retake quiz
                    </Link>
                    <Link to="/quizzes" className="rounded border px-4 py-2 text-gray-700 hover:bg-gray-50">All quizzes</Link>
                </div>
            </section>

            <section aria-label="Answers">
                <h2 className="mb-3 text-lg font-semibold">Review your answers</h2>
                <ol className="space-y-4">
                    {rows.map((row) => (
                        <ResultItem key={row.question.id} row={row} />
                    ))}
                </ol>
            </section>
        </div>
    );
}

function ResultItem({ row }: { row: ResultRow }) {
    const { outcome, question } = row;
    const status = outcome === null ? "unanswered" : outcome.isCorrect ? "correct" : "incorrect";

    const badge = {
        correct: { label: "Correct", className: "bg-green-100 text-green-800", Icon: CheckCircle2 },
        incorrect: { label: "Incorrect", className: "bg-red-100 text-red-800", Icon: XCircle },
        unanswered: { label: "Not answered", className: "bg-gray-100 text-gray-700", Icon: CircleSlash },
    }[status];

    const optionClass = (letter: AnswerLetter) => {
        if (!outcome) return "border-gray-200";
        if (letter === outcome.correct) return "border-green-500 bg-green-50";
        if (letter === outcome.selected) return "border-red-500 bg-red-50";
        return "border-gray-200";
    };

    return (
        <li
            data-testid="result-item"
            data-status={status}
            aria-label={`Question ${row.number}: ${badge.label}`}
            className="rounded-lg bg-white p-5 shadow"
        >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-500">Question {row.number}</p>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                    <badge.Icon size={14} aria-hidden="true" />
                    {badge.label}
                </span>
            </div>

            <p className="mb-4 whitespace-pre-line break-words font-semibold text-gray-900">{question.question}</p>

            <ul className="space-y-2">
                {ANSWER_LETTERS.map((letter) => {
                    const isSelected = outcome?.selected === letter;
                    const isCorrect = outcome?.correct === letter;
                    return (
                        <li key={letter} className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${optionClass(letter)}`}>
                            <span className="font-semibold text-gray-600">{letter}.</span>
                            <span className="min-w-0 flex-1 break-words text-gray-800">{optionText(question, letter)}</span>
                            <span className="flex shrink-0 flex-col items-end gap-1 text-xs font-medium">
                                {isSelected && <span className={isCorrect ? "text-green-700" : "text-red-700"}>Your answer</span>}
                                {isCorrect && <span className="text-green-700">Correct answer</span>}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {outcome && (outcome.selected === null || outcome.correct === null) && (
                // Older quizzes may store answers that do not match an option exactly.
                <dl className="mt-3 space-y-1 text-sm text-gray-700">
                    {outcome.selected === null && <div><dt className="inline font-medium">Your answer: </dt><dd className="inline">{outcome.selectedRaw}</dd></div>}
                    {outcome.correct === null && <div><dt className="inline font-medium">Correct answer: </dt><dd className="inline">{outcome.correctRaw}</dd></div>}
                </dl>
            )}

            {outcome?.explanation && (
                <div className="mt-4 rounded bg-indigo-50 p-3 text-sm text-indigo-900">
                    <p className="mb-1 font-semibold">Explanation</p>
                    <p className="whitespace-pre-line break-words">{outcome.explanation}</p>
                </div>
            )}

            {!outcome && (
                <p className="mt-3 text-sm text-gray-500">You did not answer this question, so it scored 0.</p>
            )}
        </li>
    );
}
