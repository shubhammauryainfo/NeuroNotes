"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  QuizAnswerRecord,
  QuizQuestion,
  QuizSessionRecord,
  QuizSessionSummary
} from "@/lib/quiz";
import { cn } from "@/lib/utils";

type QuizWorkspaceProps = {
  activeQuiz: QuizSessionRecord | null;
  recentQuizSessions: QuizSessionSummary[];
  noteCount: number;
  weakTopics: string[];
  strongTopics: string[];
  setupReady: boolean;
  selectedSessionId: string | null;
  generateAdaptiveQuizAction: () => Promise<void>;
  generateRetryWrongAnswersAction: (formData: FormData) => Promise<void>;
  submitAdaptiveQuizAction: (formData: FormData) => Promise<void>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function getScoreTone(answer: QuizAnswerRecord | undefined) {
  if (!answer) {
    return "bg-lemon";
  }

  if (answer.selected_option === "UNANSWERED") {
    return "bg-rose";
  }

  return answer.is_correct ? "bg-mint" : "bg-coral";
}

function getOptionTone(
  question: QuizQuestion,
  optionLabel: string,
  selectedOption: string,
  answer: QuizAnswerRecord | undefined,
  isCompleted: boolean
) {
  if (!isCompleted) {
    return selectedOption === optionLabel ? "bg-sky" : "bg-white";
  }

  if (question.answer === optionLabel) {
    return "bg-mint";
  }

  if (answer?.selected_option === optionLabel && !answer.is_correct) {
    return "bg-coral";
  }

  if (answer?.selected_option === "UNANSWERED") {
    return "bg-rose";
  }

  return "bg-white";
}

function GenerateQuizPending({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <>
      <SubmitButton
        idleLabel="Generate adaptive quiz"
        pendingLabel="Building quiz..."
        className="w-full"
        variant="secondary"
        disabled={disabled}
      />
      {disabled ? (
        <p className="mt-3 text-xs font-black uppercase leading-5">
          Add notes and finish Supabase quiz setup before generating.
        </p>
      ) : null}
      <div
        className={cn(
          "mt-4 grid gap-3 transition",
          pending ? "opacity-100" : "pointer-events-none h-0 overflow-hidden opacity-0"
        )}
        aria-hidden={!pending}
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="animate-pulse border-[3px] border-ink bg-white p-4 shadow-brutal-sm"
          >
            <div className="h-4 w-24 border-[3px] border-ink bg-lemon" />
            <div className="mt-3 h-5 w-full border-[3px] border-ink bg-cream" />
            <div className="mt-3 grid gap-2">
              {[1, 2].map((line) => (
                <div
                  key={line}
                  className="h-11 border-[3px] border-ink bg-sky"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function GenerateQuizPanel({
  action,
  disabled
}: {
  action: () => Promise<void>;
  disabled: boolean;
}) {
  return (
    <form action={action} className="w-full max-w-md">
      <GenerateQuizPending disabled={disabled} />
    </form>
  );
}

export function QuizWorkspace({
  activeQuiz,
  recentQuizSessions,
  noteCount,
  weakTopics,
  strongTopics,
  setupReady,
  selectedSessionId,
  generateAdaptiveQuizAction,
  generateRetryWrongAnswersAction,
  submitAdaptiveQuizAction
}: QuizWorkspaceProps) {
  const initialSelections = useMemo(() => {
    const map = new Map<number, string>();
    activeQuiz?.quiz_answers?.forEach((answer) => {
      map.set(answer.question_index, answer.selected_option);
    });
    return map;
  }, [activeQuiz]);

  const [selections, setSelections] = useState<Record<number, string>>(() =>
    Object.fromEntries(initialSelections.entries())
  );
  const [reviewMode, setReviewMode] = useState(false);
  const [openExplanations, setOpenExplanations] = useState<Record<number, boolean>>(
    {}
  );

  useEffect(() => {
    setSelections(Object.fromEntries(initialSelections.entries()));
    setReviewMode(false);
    setOpenExplanations({});
  }, [initialSelections, activeQuiz?.id]);

  const questions = activeQuiz?.questions ?? [];
  const isCompleted = activeQuiz?.status === "completed";
  const answeredCount = questions.filter((_, index) => {
    const value = selections[index];
    return Boolean(value && value !== "UNANSWERED");
  }).length;
  const unansweredCount = Math.max(questions.length - answeredCount, 0);
  const completionPercent = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;
  const averageScore =
    recentQuizSessions.filter((session) => typeof session.score === "number").reduce(
      (total, session) => total + (session.score ?? 0) / Math.max(session.total_questions, 1),
      0
    ) /
      Math.max(
        recentQuizSessions.filter((session) => typeof session.score === "number").length,
        1
      ) || 0;

  const completedSessions = recentQuizSessions.filter(
    (session) => session.status === "completed" && typeof session.score === "number"
  );
  const lowestSession = completedSessions.reduce<QuizSessionSummary | null>(
    (lowest, session) => {
      if (!lowest) {
        return session;
      }

      const currentRatio =
        (session.score ?? 0) / Math.max(session.total_questions, 1);
      const lowestRatio =
        (lowest.score ?? 0) / Math.max(lowest.total_questions, 1);

      return currentRatio < lowestRatio ? session : lowest;
    },
    null
  );
  const bestSession = completedSessions.reduce<QuizSessionSummary | null>(
    (best, session) => {
      if (!best) {
        return session;
      }

      const currentRatio =
        (session.score ?? 0) / Math.max(session.total_questions, 1);
      const bestRatio = (best.score ?? 0) / Math.max(best.total_questions, 1);

      return currentRatio > bestRatio ? session : best;
    },
    null
  );

  return (
    <main className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-rose">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-black uppercase">Adaptive quiz mode</h1>
                <p className="mt-2 max-w-2xl text-sm font-black uppercase leading-6">
                  Generate smarter MCQs from your notes, lean harder on weak
                  topics, and keep feeding quiz results back into your study
                  profile.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="border-[3px] border-ink bg-white p-3 shadow-brutal-sm">
                  <p className="text-[10px] font-black uppercase">Notes ready</p>
                  <p className="mt-2 text-2xl font-black uppercase">{noteCount}</p>
                </div>
                <div className="border-[3px] border-ink bg-lemon p-3 shadow-brutal-sm">
                  <p className="text-[10px] font-black uppercase">Weak topics</p>
                  <p className="mt-2 text-2xl font-black uppercase">
                    {weakTopics.length}
                  </p>
                </div>
                <div className="border-[3px] border-ink bg-sky p-3 shadow-brutal-sm">
                  <p className="text-[10px] font-black uppercase">Quiz average</p>
                  <p className="mt-2 text-2xl font-black uppercase">
                    {Math.round(averageScore * 100)}%
                  </p>
                </div>
              </div>

              {!setupReady ? (
                <div className="border-[3px] border-ink bg-coral p-4 shadow-brutal-sm">
                  <p className="text-sm font-black uppercase leading-6">
                    Quiz tables are not live in Supabase yet. Run the latest
                    `supabase/schema.sql` before using quiz mode.
                  </p>
                </div>
              ) : null}

              {noteCount === 0 ? (
                <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
                  <p className="text-sm font-black uppercase leading-6">
                    No study material yet. Upload or write notes first, then come
                    back for adaptive MCQs.
                  </p>
                  <Link
                    href="/notes"
                    className="mt-4 inline-flex border-[3px] border-ink bg-lemon px-4 py-3 text-sm font-black uppercase shadow-brutal-sm transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none"
                  >
                    Open notes
                  </Link>
                </div>
              ) : null}
            </div>

            <GenerateQuizPanel
              action={generateAdaptiveQuizAction}
              disabled={!setupReady || noteCount === 0}
            />
          </div>
        </Card>

        <Card className="bg-sky">
          <h2 className="text-xl font-black uppercase">Why this quiz adapts</h2>
          <div className="mt-4 space-y-3 text-sm font-black uppercase">
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">Priority focus</p>
              <p className="mt-2 text-lg">
                {activeQuiz?.topic || weakTopics[0] || "General revision"}
              </p>
            </div>
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">Weak topics driving question mix</p>
              <p className="mt-2 leading-6">
                {weakTopics.length ? weakTopics.slice(0, 4).join(", ") : "No weak topics logged yet"}
              </p>
            </div>
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">Strong topics for balance</p>
              <p className="mt-2 leading-6">
                {strongTopics.length
                  ? strongTopics.slice(0, 4).join(", ")
                  : "Strong topics appear after a few quiz wins"}
              </p>
            </div>
            <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
              <p className="text-[10px]">Source notes used</p>
              <p className="mt-2 text-lg">
                {activeQuiz?.source_note_ids?.length ?? Math.min(noteCount, 4)}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-white" id="current-quiz">
          <div className="flex flex-col gap-4 border-b-[3px] border-ink pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black uppercase">
                {activeQuiz ? "Current quiz" : "Ready for your first quiz"}
              </h2>
              <p className="mt-2 text-sm font-black uppercase leading-6">
                {activeQuiz
                  ? "Answer every question, review the count, then submit for grading."
                  : "Your generated MCQs will appear here with progress tracking and review."}
              </p>
            </div>
            {activeQuiz ? (
              <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
                <span className="border-[3px] border-ink bg-lemon px-3 py-2 shadow-brutal-sm">
                  Topic: {activeQuiz.topic || "General"}
                </span>
                <span className="border-[3px] border-ink bg-sky px-3 py-2 shadow-brutal-sm">
                  Difficulty: {activeQuiz.difficulty}
                </span>
                <span className="border-[3px] border-ink bg-mint px-3 py-2 shadow-brutal-sm">
                  Status: {activeQuiz.status}
                </span>
                {typeof activeQuiz.score === "number" ? (
                  <span className="border-[3px] border-ink bg-coral px-3 py-2 shadow-brutal-sm">
                    Score: {activeQuiz.score}/{activeQuiz.total_questions}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {!activeQuiz ? (
            <div className="mt-6 border-[3px] border-dashed border-ink bg-cream p-8 text-center shadow-brutal-sm">
              <p className="text-xl font-black uppercase">No quiz generated yet</p>
              <p className="mt-3 text-sm font-black uppercase leading-6">
                Start with a fresh adaptive set and NeuroNotes will focus on weak
                areas pulled from your study history.
              </p>
            </div>
          ) : (
            <>
              <form action={submitAdaptiveQuizAction} className="mt-6 space-y-5">
              <input type="hidden" name="sessionId" value={activeQuiz.id} />

              <div className="sticky top-4 z-10 border-[3px] border-ink bg-lemon p-4 shadow-brutal">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase">
                      Progress: {answeredCount}/{questions.length} answered
                    </p>
                    <div className="mt-3 h-4 border-[3px] border-ink bg-white">
                      <div
                        className="h-full border-r-[3px] border-ink bg-sky transition-all"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-black uppercase sm:flex">
                    <span className="border-[3px] border-ink bg-white px-3 py-2 shadow-brutal-sm">
                      {completionPercent}% ready
                    </span>
                    <span className="border-[3px] border-ink bg-mint px-3 py-2 shadow-brutal-sm">
                      {answeredCount} answered
                    </span>
                    <span className="border-[3px] border-ink bg-rose px-3 py-2 shadow-brutal-sm">
                      {unansweredCount} open
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
                {questions.map((question, index) => {
                  const answer = activeQuiz.quiz_answers?.find(
                    (item) => item.question_index === index
                  );
                  const selectedOption =
                    selections[index] ?? answer?.selected_option ?? "";

                  return (
                    <div
                      key={`${activeQuiz.id}-${index}`}
                      className={cn(
                        "border-[3px] border-ink p-5 shadow-brutal-sm",
                        getScoreTone(answer)
                      )}
                    >
                      <div className="mb-4 flex flex-wrap gap-2 text-[10px] font-black uppercase">
                        <span className="border-[3px] border-ink bg-white px-2 py-1 text-ink">
                          {index + 1} / {questions.length}
                        </span>
                        <span className="border-[3px] border-ink bg-white px-2 py-1 text-ink">
                          {question.topic}
                        </span>
                        <span className="border-[3px] border-ink bg-white px-2 py-1 text-ink">
                          {question.difficulty}
                        </span>
                        {answer?.selected_option === "UNANSWERED" ? (
                          <span className="border-[3px] border-ink bg-coral px-2 py-1 text-ink">
                            Unanswered
                          </span>
                        ) : null}
                      </div>

                      <p className="mb-5 text-base font-black uppercase leading-7 sm:text-lg">
                        {question.question}
                      </p>

                      <div className="grid gap-3">
                        {question.options.map((option) => (
                          <label
                            key={`${activeQuiz.id}-${index}-${option.label}`}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 border-[3px] border-ink p-4 text-sm font-bold shadow-brutal-sm transition",
                              !isCompleted && "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none",
                              getOptionTone(
                                question,
                                option.label,
                                selectedOption,
                                answer,
                                isCompleted
                              )
                            )}
                          >
                            <input
                              type="radio"
                              name={`answer-${index}`}
                              value={option.label}
                              checked={selectedOption === option.label}
                              disabled={isCompleted}
                              onChange={() => {
                                setSelections((current) => ({
                                  ...current,
                                  [index]: option.label
                                }));
                                setReviewMode(false);
                              }}
                              className="mt-1 h-4 w-4 border-ink"
                            />
                            <span className="text-ink">
                              <strong>{option.label}.</strong> {option.text}
                            </span>
                          </label>
                        ))}
                      </div>

                      {isCompleted ? (
                        <div className="mt-4 space-y-3">
                          <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
                            <span className="border-[3px] border-ink bg-white px-3 py-2 shadow-brutal-sm">
                              Your answer: {answer?.selected_option || "UNANSWERED"}
                            </span>
                            <span className="border-[3px] border-ink bg-mint px-3 py-2 shadow-brutal-sm">
                              Correct: {question.answer}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="border-[3px] border-ink bg-white px-4 py-3 text-sm font-black uppercase shadow-brutal-sm transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none"
                            onClick={() =>
                              setOpenExplanations((current) => ({
                                ...current,
                                [index]: !current[index]
                              }))
                            }
                          >
                            {openExplanations[index] ? "Hide explanation" : "Why this is correct"}
                          </button>
                          {openExplanations[index] ? (
                            <div className="border-[3px] border-ink bg-white p-4 text-sm font-bold leading-6 shadow-brutal-sm">
                              {question.explanation}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {!isCompleted && questions.length > 0 ? (
                <div className="border-[3px] border-ink bg-cream p-4 shadow-brutal-sm">
                  {!reviewMode ? (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-black uppercase leading-6">
                        Review before grading. You have {answeredCount} answered and{" "}
                        {unansweredCount} still open.
                      </p>
                      <Button type="button" onClick={() => setReviewMode(true)}>
                        Review answers
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
                        <span className="border-[3px] border-ink bg-mint px-3 py-2 shadow-brutal-sm">
                          Answered: {answeredCount}
                        </span>
                        <span className="border-[3px] border-ink bg-coral px-3 py-2 shadow-brutal-sm">
                          Unanswered: {unansweredCount}
                        </span>
                        <span className="border-[3px] border-ink bg-white px-3 py-2 shadow-brutal-sm">
                          Submit anyway?
                        </span>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <SubmitButton
                          idleLabel="Submit quiz"
                          pendingLabel="Grading quiz..."
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setReviewMode(false)}
                        >
                          Keep editing
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              </form>

              {isCompleted ? (
                <div className="mt-5 border-[3px] border-ink bg-cream p-4 shadow-brutal-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-black uppercase leading-6">
                      Build a focused retry quiz from only the questions you missed.
                    </p>
                    <form action={generateRetryWrongAnswersAction}>
                      <input type="hidden" name="sessionId" value={activeQuiz.id} />
                      <SubmitButton
                        idleLabel="Retry wrong answers"
                        pendingLabel="Building retry quiz..."
                        variant="secondary"
                      />
                    </form>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="bg-lemon">
            <h2 className="text-xl font-black uppercase">Adaptive quiz summary</h2>
            <div className="mt-4 grid gap-3">
              <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
                <p className="text-[10px] font-black uppercase">Weakest recent topic</p>
                <p className="mt-2 text-lg font-black uppercase">
                  {lowestSession?.topic || weakTopics[0] || "Not enough data yet"}
                </p>
              </div>
              <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
                <p className="text-[10px] font-black uppercase">Best recent topic</p>
                <p className="mt-2 text-lg font-black uppercase">
                  {bestSession?.topic || strongTopics[0] || "Still building profile"}
                </p>
              </div>
              <div className="border-[3px] border-ink bg-white p-4 shadow-brutal-sm">
                <p className="text-[10px] font-black uppercase">Completed quiz attempts</p>
                <p className="mt-2 text-lg font-black uppercase">
                  {completedSessions.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-cream">
            <h2 className="mb-4 text-xl font-black uppercase">Recent quiz sessions</h2>
            <div className="space-y-3">
              {recentQuizSessions.map((session) => {
                const isActive = selectedSessionId
                  ? session.id === selectedSessionId
                  : activeQuiz?.id === session.id;

                return (
                  <div
                    key={session.id}
                    className={cn(
                      "border-[3px] border-ink bg-white p-4 shadow-brutal-sm",
                      isActive && "bg-sky"
                    )}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
                        <span className="border-[3px] border-ink bg-lemon px-2 py-1">
                          {session.topic || "General"}
                        </span>
                        <span className="border-[3px] border-ink bg-white px-2 py-1">
                          {session.status}
                        </span>
                        <span className="border-[3px] border-ink bg-white px-2 py-1">
                          {session.difficulty}
                        </span>
                        <span className="border-[3px] border-ink bg-white px-2 py-1">
                          {formatDate(session.created_at)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm font-black uppercase">
                          {typeof session.score === "number"
                            ? `${session.score}/${session.total_questions} correct`
                            : "Waiting for grading"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/quiz?session=${session.id}#current-quiz`}
                            className="inline-flex border-[3px] border-ink bg-white px-3 py-2 text-xs font-black uppercase shadow-brutal-sm transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none"
                          >
                            Review
                          </Link>
                          <form action={generateAdaptiveQuizAction}>
                            <SubmitButton
                              idleLabel="Retry"
                              pendingLabel="Building..."
                              variant="secondary"
                              className="px-3 py-2 text-xs"
                            />
                          </form>
                          {session.status === "completed" ? (
                            <form action={generateRetryWrongAnswersAction}>
                              <input type="hidden" name="sessionId" value={session.id} />
                              <SubmitButton
                                idleLabel="Retry wrong"
                                pendingLabel="Building..."
                                variant="secondary"
                                className="px-3 py-2 text-xs"
                              />
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!recentQuizSessions.length ? (
                <p className="text-sm font-bold uppercase leading-6">
                  Generate your first adaptive quiz to start tracking score
                  trends, weak topics, and review sessions.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
