"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

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
  quiz?: QuizData;
  error?: string;
  detail?: string;
};

export default function MaterialQuizPage() {
  const params = useParams<{ materialId: string }>();
  const materialId = params.materialId;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function generateQuiz() {
    if (!materialId) {
      setErrorMessage("학습 자료 ID가 없습니다.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setQuiz(null);
      setAnswers({});
      setIsSubmitted(false);

      const response = await fetch("/api/materials/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          materialId,
        }),
      });

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        const rawResponse = await response.text();

        console.error("JSON이 아닌 서버 응답:", rawResponse);

        throw new Error(
          `서버 응답을 읽지 못했습니다. 상태 코드: ${response.status}`
        );
      }

      const result = (await response.json()) as QuizResponse;

      if (!response.ok) {
        throw new Error(
          result.detail
            ? `${result.error ?? "문제 생성 실패"}: ${result.detail}`
            : result.error ?? "AI 문제 생성에 실패했습니다."
        );
      }

      if (!result.quiz) {
        throw new Error("서버 응답에 생성된 문제가 없습니다.");
      }

      setQuiz(result.quiz);
    } catch (error) {
      console.error("AI 문제 생성 오류:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "문제 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function selectAnswer(questionIndex: number, optionIndex: number) {
    if (isSubmitted) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [questionIndex]: optionIndex,
    }));
  }

  function submitQuiz() {
    if (!quiz) {
      return;
    }

    const unansweredCount = quiz.questions.filter(
      (_, questionIndex) => answers[questionIndex] === undefined
    ).length;

    if (unansweredCount > 0) {
      setErrorMessage(
        `아직 선택하지 않은 문제가 ${unansweredCount}개 있어요.`
      );
      return;
    }

    setErrorMessage("");
    setIsSubmitted(true);
  }

  function calculateScore() {
    if (!quiz) {
      return 0;
    }

    return quiz.questions.reduce((score, question, questionIndex) => {
      return answers[questionIndex] === question.answerIndex
        ? score + 1
        : score;
    }, 0);
  }

  function restartQuiz() {
    setAnswers({});
    setIsSubmitted(false);
    setErrorMessage("");
  }

  const score = calculateScore();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Link
            href="/subjects"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← 과목 목록으로
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            AI 문제 풀기
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            업로드한 학습 자료를 바탕으로 객관식 문제를 생성합니다.
          </p>
        </header>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {!quiz && (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-5xl">📝</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              학습자료 문제를 만들어볼까요?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              학습 자료에서 중요한 내용을 골라 객관식 5문제를 만듭니다.
            </p>

            <button
              type="button"
              onClick={generateQuiz}
              disabled={isLoading}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading
                ? "AI가 문제를 만들고 있어요..."
                : "AI 문제 생성하기"}
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

                {!isSubmitted && (
                  <span className="text-sm text-slate-500">
                    선택 완료 {Object.keys(answers).length}/
                    {quiz.questions.length}
                  </span>
                )}
              </div>
            </section>

            {quiz.questions.map((question, questionIndex) => {
              const selectedAnswer = answers[questionIndex];
              const isCorrect =
                selectedAnswer === question.answerIndex;

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
                      const isSelected =
                        selectedAnswer === optionIndex;
                      const isAnswer =
                        question.answerIndex === optionIndex;

                      let optionClass =
                        "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50";

                      if (isSelected && !isSubmitted) {
                        optionClass =
                          "border-indigo-500 bg-indigo-50";
                      }

                      if (isSubmitted && isAnswer) {
                        optionClass =
                          "border-emerald-500 bg-emerald-50";
                      }

                      if (
                        isSubmitted &&
                        isSelected &&
                        !isAnswer
                      ) {
                        optionClass =
                          "border-red-400 bg-red-50";
                      }

                      return (
                        <button
                          type="button"
                          key={`${option}-${optionIndex}`}
                          onClick={() =>
                            selectAnswer(
                              questionIndex,
                              optionIndex
                            )
                          }
                          disabled={isSubmitted}
                          className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition disabled:cursor-default ${optionClass}`}
                        >
                          <span className="font-bold text-slate-500">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>

                          <span className="text-slate-700">
                            {option}
                          </span>
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
                              65 + question.answerIndex
                            )}번입니다.`}
                      </p>

                      <p className="mt-2 leading-6">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </section>
              );
            })}

            {isSubmitted ? (
              <section className="rounded-2xl bg-slate-900 p-7 text-white shadow-sm">
                <p className="text-sm text-slate-300">최종 점수</p>

                <p className="mt-2 text-4xl font-bold">
                  {score} / {quiz.questions.length}
                </p>

                <p className="mt-3 text-sm text-slate-300">
                  정답률{" "}
                  {Math.round(
                    (score / quiz.questions.length) * 100
                  )}
                  %
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={restartQuiz}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900"
                  >
                    같은 문제 다시 풀기
                  </button>

                  <button
                    type="button"
                    onClick={generateQuiz}
                    disabled={isLoading}
                    className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isLoading
                      ? "생성 중..."
                      : "새로운 문제 만들기"}
                  </button>
                </div>
              </section>
            ) : (
              <button
                type="button"
                onClick={submitQuiz}
                className="w-full rounded-xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-indigo-500"
              >
                답안 제출하기
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}