"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

type SummaryResult = {
  documentType:
    | "syllabus"
    | "lecture"
    | "assignment"
    | "exam_notice"
    | "other";

  title: string;
  overview: string;
  keyPoints: string[];
  keyConcepts: string[];
  examPoints: string[];
  reviewQuestions: string[];
};

type SummaryResponse = {
  message?: string;
  source?: "database" | "openai";
  updatedAt?: string;
  summary?: SummaryResult;
  error?: string;
  detail?: string;
};

type MaterialStudySummaryProps = {
  materialId: string;
};

function formatDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDocumentTypeLabel(
  documentType: SummaryResult["documentType"],
) {
  if (documentType === "syllabus") {
    return "📚 강의계획서";
  }

  if (documentType === "lecture") {
    return "📖 강의자료";
  }

  if (documentType === "assignment") {
    return "📝 과제 안내";
  }

  if (documentType === "exam_notice") {
    return "🧾 시험 안내";
  }

  return "📄 기타 문서";
}

export default function MaterialStudySummary({
  materialId,
}: MaterialStudySummaryProps) {
  const [summary, setSummary] =
    useState<SummaryResult | null>(null);

  const [source, setSource] = useState<
    "database" | "openai" | null
  >(null);

  const [updatedAt, setUpdatedAt] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isCheckingSaved,
    setIsCheckingSaved,
  ] = useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadSavedSummary() {
      if (!materialId) {
        setIsCheckingSaved(false);
        return;
      }

      try {
        setIsCheckingSaved(true);

        const response = await fetch(
          `/api/materials/summarize?materialId=${encodeURIComponent(
            materialId,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const contentType =
          response.headers.get("content-type");

        if (
          !contentType?.includes(
            "application/json",
          )
        ) {
          throw new Error(
            `저장된 분석 결과를 확인하지 못했어요. 상태 코드: ${response.status}`,
          );
        }

        const result =
          (await response.json()) as SummaryResponse;

        if (!response.ok) {
          throw new Error(
            result.detail
              ? `${
                  result.error ??
                  "분석 결과 조회 실패"
                }: ${result.detail}`
              : result.error ??
                  "저장된 분석 결과를 불러오지 못했어요.",
          );
        }

        if (
          !isCancelled &&
          result.summary
        ) {
          setSummary(result.summary);
          setSource("database");
          setUpdatedAt(
            result.updatedAt ?? null,
          );
        }
      } catch (error) {
        console.error(
          "저장된 AI 분석 조회 오류:",
          error,
        );
      } finally {
        if (!isCancelled) {
          setIsCheckingSaved(false);
        }
      }
    }

    void loadSavedSummary();

    return () => {
      isCancelled = true;
    };
  }, [materialId]);

  async function generateSummary(
    forceRegenerate = false,
  ) {
    if (!materialId) {
      setErrorMessage(
        "학습 자료 ID가 없어요.",
      );
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        "/api/materials/summarize",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            materialId,
            forceRegenerate,
          }),
        },
      );

      const contentType =
        response.headers.get("content-type");

      if (
        !contentType?.includes(
          "application/json",
        )
      ) {
        const rawResponse =
          await response.text();

        console.error(
          "JSON이 아닌 서버 응답:",
          rawResponse,
        );

        throw new Error(
          `서버 응답을 읽지 못했어요. 상태 코드: ${response.status}`,
        );
      }

      const result =
        (await response.json()) as SummaryResponse;

      if (!response.ok) {
        throw new Error(
          result.detail
            ? `${
                result.error ??
                "AI 문서 분석 실패"
              }: ${result.detail}`
            : result.error ??
                "AI 문서 분석에 실패했어요.",
        );
      }

      if (!result.summary) {
        throw new Error(
          "서버 응답에 분석 결과가 없어요.",
        );
      }

      setSummary(result.summary);
      setSource(
        result.source ?? "openai",
      );
      setUpdatedAt(
        result.updatedAt ??
          new Date().toISOString(),
      );
    } catch (error) {
      console.error(
        "AI 문서 분석 오류:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "AI 문서 분석 중 오류가 발생했어요.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingSaved) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              AI 문서 분석
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              저장된 분석 결과를 불러오고
              있어요.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5">
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            STEP 2
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
            AI 문서 분석
          </h2>

          <p className="mt-2 text-sm leading-7 text-slate-500">
            추출된 텍스트를 분석해 문서
            유형, 핵심 내용, 평가 방식,
            시험 포인트와 복습 문제를
            정리해요.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            void generateSummary(false)
          }
          disabled={isLoading}
          className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading
            ? "AI가 문서를 분석 중이에요..."
            : "AI 문서 분석 시작"}
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              AI 문서 분석
            </span>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {getDocumentTypeLabel(
                summary.documentType,
              )}
            </span>

            {source && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {source === "database"
                  ? "저장된 분석"
                  : "새로 생성된 분석"}
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {summary.title}
          </h2>

          {updatedAt && (
            <p className="mt-2 text-xs text-slate-400">
              마지막 생성:{" "}
              {formatDate(updatedAt)}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/materials/${materialId}/quiz`}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            문제 풀기
          </Link>

          <button
            type="button"
            onClick={() =>
              void generateSummary(true)
            }
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "다시 분석 중..."
              : "AI 분석 다시 만들기"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div>
        <h3 className="mb-2 font-bold text-slate-900">
          전체 요약
        </h3>

        <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
          {summary.overview}
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-bold text-slate-900">
          {summary.documentType ===
          "syllabus"
            ? "📚 과목 정보"
            : "핵심 내용"}
        </h3>

        {summary.keyPoints.length > 0 ? (
          <ol className="space-y-3">
            {summary.keyPoints.map(
              (point, index) => (
                <li
                  key={`${point}-${index}`}
                  className="flex gap-3 text-sm leading-6 text-slate-700"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {index + 1}
                  </span>

                  <span>{point}</span>
                </li>
              ),
            )}
          </ol>
        ) : (
          <p className="text-sm text-slate-400">
            생성된 핵심 내용이 없어요.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-bold text-slate-900">
          {summary.documentType ===
          "syllabus"
            ? "📋 평가 방식"
            : "핵심 개념"}
        </h3>

        {summary.keyConcepts.length >
        0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {summary.keyConcepts.map(
              (concept, index) => (
                <div
                  key={`${concept}-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm leading-6 text-slate-700">
                    {concept}
                  </p>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            생성된 핵심 개념이 없어요.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-bold text-slate-900">
          {summary.documentType ===
          "syllabus"
            ? "📅 주요 일정"
            : "시험 포인트"}
        </h3>

        {summary.examPoints.length > 0 ? (
          <div className="space-y-3">
            {summary.examPoints.map(
              (point, index) => (
                <div
                  key={`${point}-${index}`}
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                >
                  <p className="text-sm leading-6 text-amber-950">
                    <span className="mr-2 font-bold text-amber-600">
                      {index + 1}.
                    </span>

                    {point}
                  </p>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            생성된 시험 포인트가 없어요.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-bold text-slate-900">
          {summary.documentType ===
          "syllabus"
            ? "📌 과제 · 출결"
            : "복습 문제"}
        </h3>

        {summary.reviewQuestions.length >
        0 ? (
          <div className="space-y-3">
            {summary.reviewQuestions.map(
              (question, index) => (
                <div
                  key={`${question}-${index}`}
                  className="rounded-xl border border-slate-200 px-4 py-4"
                >
                  <p className="text-sm leading-6 text-slate-700">
                    <span className="mr-2 font-bold text-indigo-600">
                      Q{index + 1}.
                    </span>

                    {question}
                  </p>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            생성된 복습 문제가 없어요.
          </p>
        )}
      </div>
    </section>
  );
}