"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type QuizData = {
  title: string;
  questions: QuizQuestion[];
};

type QuizResponse = {
  quizSetId?: string | null;
  quiz?: QuizData | null;
  error?: string;
  detail?: string;
};

export default function MaterialQuizPage() {
  const params = useParams<{ materialId: string }>();
  const materialId = params.materialId;

  const [quizSetId, setQuizSetId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    async function loadSavedQuiz() {
      if (!materialId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/materials/quiz?materialId=${encodeURIComponent(materialId)}`,
          { cache: "no-store" },
        );

        const result = (await response.json()) as QuizResponse;

        if (!response.ok) {
          throw new Error(result.error ?? "저장된 문제를 불러오지 못했어요.");
        }

        setQuizSetId(result.quizSetId ?? null);
        setQuiz(result.quiz ?? null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "문제를 불러오지 못했어요.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadSavedQuiz();
  }, [materialId]);

  async function generateQuiz(forceRegenerate = false) {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSaveMessage("");
      setAnswers({});
      setIsSubmitted(false);

      const response = await fetch("/api/materials/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          forceRegenerate,
        }),
      });

      const result = (await response.json()) as QuizResponse;

      if (!response.ok || !result.quiz || !result.quizSetId) {
        throw new Error(
          result.detail
            ? `${result.error ?? "문제 생성 실패"}: ${result.detail}`
            : result.error ?? "AI 문제 생성에 실패했습니다.",
        );
      }

      setQuizSetId(result.quizSetId);
      setQuiz(result.quiz);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "문제 생성 중 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (isSubmitted) return;

    setAnswers((previous) => ({
      ...previous,
      [questionIndex]: optionIndex,
    }));
  }

  async function submitQuiz() {
    if (!quiz || !quizSetId) return;

    const unansweredCount = quiz.questions.filter(
      (_, index) => answers[index] === undefined,
    ).length;

    if (unansweredCount > 0) {
      setErrorMessage(`아직 선택하지 않은 문제가 ${unansweredCount}개 있어요.`);
      return;
    }

    setErrorMessage("");
    setSaveMessage("");
    setIsSavingResult(true);

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizSetId,
          answers,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        score?: number;
        totalQuestions?: number;
        wrongCount?: number;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "풀이 결과를 저장하지 못했어요.");
      }

      setIsSubmitted(true);
      setSaveMessage(
        `풀이 기록을 저장했어요. 틀린 문제 ${result.wrongCount ?? 0}개는 오답노트에 자동 등록됐어요.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "풀이 결과 저장에 실패했어요.",
      );
    } finally {
      setIsSavingResult(false);
    }
  }

  const score =
    quiz?.questions.reduce(
      (sum, question, index) =>
        answers[index] === question.answerIndex ? sum + 1 : sum,
      0,
    ) ?? 0;

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">문제를 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Link
            href="/quiz"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← 문제 풀이 목록으로
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            AI 문제 풀기
          </h1>
        </header>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {saveMessage && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {saveMessage}
          </div>
        )}

        {!quiz && (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">📝</div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              학습자료 문제를 만들어볼까요?
            </h2>

            <button
              type="button"
              onClick={() => void generateQuiz(false)}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white"
            >
              AI 문제 생성하기
            </button>
          </section>
        )}

        {quiz && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    객관식 {quiz.questions.length}문제
                  </span>

                  <h2 className="mt-3 text-xl font-bold text-slate-900">
                    {quiz.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => void generateQuiz(true)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  새 문제 생성
                </button>
              </div>
            </section>

            {quiz.questions.map((question, questionIndex) => {
              const selectedAnswer = answers[questionIndex];
              const isCorrect = selectedAnswer === question.answerIndex;

              return (
                <section
                  key={`${question.id}-${questionIndex}`}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {questionIndex + 1}
                    </span>

                    <h3 className="pt-1 text-base font-bold leading-7 text-slate-900">
                      {question.question}
                    </h3>
                  </div>

                  <div className="mt-5 space-y-3">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selectedAnswer === optionIndex;
                      const isAnswer = question.answerIndex === optionIndex;

                      let optionClass =
                        "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50";

                      if (isSelected && !isSubmitted) {
                        optionClass = "border-indigo-500 bg-indigo-50";
                      }

                      if (isSubmitted && isAnswer) {
                        optionClass = "border-emerald-500 bg-emerald-50";
                      }

                      if (isSubmitted && isSelected && !isAnswer) {
                        optionClass = "border-red-400 bg-red-50";
                      }

                      return (
                        <button
                          type="button"
                          key={`${option}-${optionIndex}`}
                          onClick={() =>
                            selectAnswer(questionIndex, optionIndex)
                          }
                          disabled={isSubmitted}
                          className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition disabled:cursor-default ${optionClass}`}
                        >
                          <span className="font-bold text-slate-500">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span className="text-slate-700">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isSubmitted && (
                    <div
                      className={`mt-5 rounded-xl px-4 py-4 text-sm ${
                        isCorrect
                          ? "bg-emerald-50 text-emerald-900"
                          : "bg-red-50 text-red-900"
                      }`}
                    >
                      <p className="font-bold">
                        {isCorrect
                          ? "정답입니다."
                          : `오답입니다. 정답은 ${String.fromCharCode(
                              65 + question.answerIndex,
                            )}번입니다.`}
                      </p>
                      <p className="mt-2 leading-6">{question.explanation}</p>
                    </div>
                  )}
                </section>
              );
            })}

            {isSubmitted ? (
              <section className="rounded-2xl bg-slate-900 p-7 text-white">
                <p className="text-sm text-slate-300">최종 점수</p>
                <p className="mt-2 text-4xl font-bold">
                  {score} / {quiz.questions.length}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setIsSubmitted(false);
                      setSaveMessage("");
                    }}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                  >
                    같은 문제 다시 풀기
                  </button>

                  <Link
                    href="/wrong-answers"
                    className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    오답노트 보기
                  </Link>
                </div>
              </section>
            ) : (
              <button
                type="button"
                onClick={() => void submitQuiz()}
                disabled={isSavingResult}
                className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {isSavingResult ? "결과 저장 중..." : "답안 제출하기"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
