import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Send } from "lucide-react";

import { formatApiError, parseApiError } from "../../api/errors";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ErrorState from "../../components/common/ErrorState";
import Loader from "../../components/common/Loader";
import QuestionCard from "../../components/quiz/QuestionCard";
import QuestionNavigator from "../../components/quiz/QuestionNavigator";
import { useApiQuery } from "../../hooks/useApiQuery";
import quizzesService from "../../services/quizzes.service";
import type { AnswerLetter, Quiz, QuizAnswer } from "../../types/quiz";
import { difficultyBadgeClass, formatDifficulty, type QuizResultState } from "../../utils/quiz";

export default function QuizPage() {
    const { id = "" } = useParams();
    // key: answers and position never carry over to another quiz.
    return <QuizRunner key={id} id={id} />;
}

function QuizRunner({ id }: { id: string }) {
    const { data: quiz, error, loading, refetch } = useApiQuery(`quiz:${id}`, () => quizzesService.get(id));

    return (
        <div className="mx-auto max-w-3xl">
            <Link to="/quizzes" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                <ArrowLeft size={16} aria-hidden="true" />
                Back to quizzes
            </Link>

            {loading && !quiz && (
                <div className="rounded-lg bg-white p-10 shadow" aria-busy="true">
                    <Loader size="lg" />
                    <p className="text-center text-sm text-gray-500">Loading quiz...</p>
                </div>
            )}

            {error && !quiz && error.kind !== "unauthorized" && (
                <ErrorState
                    title={error.kind === "notFound" ? "Quiz not found" : "Could not load this quiz"}
                    message={error.kind === "notFound" ? "It may have been deleted." : formatApiError(error)}
                    onRetry={error.kind === "notFound" ? undefined : refetch}
                    retrying={loading}
                />
            )}

            {quiz && quiz.questions.length === 0 && (
                <ErrorState title="This quiz has no questions" message="Generate a new quiz from the quizzes page." />
            )}

            {quiz && quiz.questions.length > 0 && <QuizTaker quiz={quiz} />}
        </div>
    );
}

function QuizTaker({ quiz }: { quiz: Quiz }) {
    const navigate = useNavigate();
    const questions = quiz.questions;
    const total = questions.length;

    const [answers, setAnswers] = useState<Record<string, AnswerLetter>>({});
    const [current, setCurrent] = useState(0);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const submittingRef = useRef(false); // blocks double submits before React re-renders

    const question = questions[current];
    const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
    const unanswered = questions.flatMap((q, index) => (answers[q.id] === undefined ? [index + 1] : []));
    const isLast = current === total - 1;

    const select = (letter: AnswerLetter) => {
        setAnswers((previous) => ({ ...previous, [question.id]: letter }));
        setSubmitError(null);
    };

    const handleSubmit = async () => {
        if (submittingRef.current || answeredCount === 0) return;

        // Answered questions only, in quiz order; the API scores unanswered ones as 0.
        const submitted: QuizAnswer[] = questions
            .filter((q) => answers[q.id] !== undefined)
            .map((q) => ({ questionId: q.id, selectedAnswer: answers[q.id] }));

        submittingRef.current = true;
        setSubmitting(true);
        setSubmitError(null);

        try {
            const result = await quizzesService.submit(quiz.id, submitted);
            const state: QuizResultState = { quiz, answers: submitted, result };
            // replace: "Back" from the results goes to the quiz list, not to a finished quiz.
            navigate(`/quizzes/result/${quiz.id}`, { replace: true, state });
        } catch (failure: unknown) {
            const apiError = parseApiError(failure);
            setConfirmOpen(false);
            if (apiError.kind === "unauthorized") return; // AuthContext signs the user out

            // The answers stay selected so the user can try again.
            setSubmitError(
                apiError.kind === "notFound"
                    ? "This quiz no longer exists. It may have been deleted."
                    : formatApiError(apiError),
            );
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const confirmMessage =
        unanswered.length === 0
            ? `You answered all ${total} questions. Submit your answers for grading?`
            : `You answered ${answeredCount} of ${total} questions.\n` +
              `Unanswered: ${unanswered.map((n) => `question ${n}`).join(", ")}. Unanswered questions score 0.\n` +
              "Submit anyway?";

    return (
        <div className="space-y-4">
            {/* Header and progress */}
            <section aria-label="Quiz progress" className="rounded-lg bg-white p-5 shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="break-words text-2xl font-bold">{quiz.topic}</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyBadgeClass(quiz.difficulty)}`}>
                                {formatDifficulty(quiz.difficulty)}
                            </span>
                            <span>{total} {total === 1 ? "question" : "questions"}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setConfirmOpen(true)}
                        disabled={answeredCount === 0 || submitting}
                        className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Send size={16} aria-hidden="true" />
                        {submitting ? "Submitting..." : "Submit quiz"}
                    </button>
                </div>

                <div className="mt-4">
                    <div className="mb-1 flex justify-between text-sm text-gray-600">
                        <span id="quiz-progress-label">{answeredCount} of {total} answered</span>
                        <span>{Math.round((answeredCount / total) * 100)}%</span>
                    </div>
                    <div
                        role="progressbar"
                        aria-labelledby="quiz-progress-label"
                        aria-valuemin={0}
                        aria-valuemax={total}
                        aria-valuenow={answeredCount}
                        className="h-2 overflow-hidden rounded-full bg-gray-200"
                    >
                        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(answeredCount / total) * 100}%` }} />
                    </div>
                </div>

                <div className="mt-4">
                    <QuestionNavigator questions={questions} answers={answers} current={current} onGoTo={setCurrent} disabled={submitting} />
                    {answeredCount > 0 && unanswered.length > 0 && (
                        <p className="mt-2 text-sm text-amber-700" data-testid="unanswered-summary">
                            Unanswered: {unanswered.join(", ")}
                        </p>
                    )}
                    {answeredCount === 0 && (
                        <p className="mt-2 text-sm text-gray-500">Answer at least one question to submit the quiz.</p>
                    )}
                </div>
            </section>

            {submitError && (
                <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{submitError}</p>
            )}

            {/* Current question */}
            <section aria-label="Current question" className="rounded-lg bg-white p-5 shadow sm:p-6">
                <QuestionCard
                    key={question.id}
                    question={question}
                    number={current + 1}
                    total={total}
                    selected={answers[question.id]}
                    onSelect={select}
                    disabled={submitting}
                />

                <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => setCurrent((n) => n - 1)}
                        disabled={current === 0 || submitting}
                        className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                        <ChevronLeft size={16} aria-hidden="true" />
                        Previous
                    </button>

                    {isLast ? (
                        <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            disabled={answeredCount === 0 || submitting}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Review and submit
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setCurrent((n) => n + 1)}
                            disabled={submitting}
                            className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                        >
                            Next
                            <ChevronRight size={16} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </section>

            <ConfirmDialog
                open={confirmOpen}
                title="Submit quiz?"
                message={confirmMessage}
                confirmLabel="Submit"
                busyLabel="Submitting..."
                cancelLabel="Keep answering"
                tone="primary"
                busy={submitting}
                onConfirm={handleSubmit}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
}
