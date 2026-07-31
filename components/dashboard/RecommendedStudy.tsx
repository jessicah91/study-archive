"use client";

import { useCallback, useEffect, useState } from "react";

type RecommendedStudyProps = {
  materials: unknown[];
  summaries: unknown[];
  subjects: unknown[];
};

type RecommendationResponse = {
  title?: string;
  reason?: string;
  priority?: string;
  estimatedTime?: string;
  studyPlan?: string[];
  motivation?: string;
  connected?: boolean;
  error?: string;
};

export default function RecommendedStudy({
  materials,
  summaries,
  subjects,
}: RecommendedStudyProps) {
  const [recommendation, setRecommendation] =
    useState<RecommendationResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecommendation = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/ai/recommend", {
        method: "GET",
        cache: "no-store",
      });

      const result =
        (await response.json()) as RecommendationResponse;

      if (!response.ok) {
        throw new Error(
          result.error ?? "AI 추천을 불러오지 못했습니다.",
        );
      }

      setRecommendation(result);
    } catch (loadError) {
      setRecommendation(null);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "AI 추천을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void materials;
    void summaries;
    void subjects;

    void loadRecommendation();
  }, [
    loadRecommendation,
    materials,
    summaries,
    subjects,
  ]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            AI RECOMMEND
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-900">
            오늘의 학습 추천
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            일정과 최근 학습 자료를 바탕으로 추천해요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadRecommendation()}
          disabled={loading}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "생성 중" : "다시 추천"}
        </button>
      </div>

      {loading && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            AI가 오늘의 학습 계획을 만들고 있어요.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-600">
            추천을 불러오지 못했어요.
          </p>

          <p className="mt-2 text-sm leading-6 text-red-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadRecommendation()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        recommendation?.connected === false && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="text-3xl">📅</div>

            <p className="mt-4 text-sm font-bold text-slate-700">
              Google Calendar 연결이 필요해요.
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              일정을 연결하면 시험과 과제 날짜를 참고해
              학습 계획을 추천할 수 있어요.
            </p>

            <a
              href="/api/google/login"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Calendar 연결
            </a>
          </div>
        )}

      {!loading &&
        !error &&
        recommendation &&
        recommendation.connected !== false && (
          <div className="mt-6">
            <div className="rounded-3xl bg-slate-900 p-6 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-indigo-200">
                  AI 학습 코치
                </span>

                {recommendation.priority && (
                  <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
                    우선순위 {recommendation.priority}
                  </span>
                )}
              </div>

              <h3 className="mt-4 text-2xl font-black">
                {recommendation.title ??
                  "오늘의 학습 계획"}
              </h3>

              {recommendation.reason && (
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {recommendation.reason}
                </p>
              )}

              {recommendation.estimatedTime && (
                <div className="mt-5 inline-flex rounded-xl bg-white/10 px-4 py-2">
                  <span className="text-sm font-bold text-indigo-200">
                    예상 공부시간
                  </span>

                  <span className="ml-2 text-sm font-black text-white">
                    {recommendation.estimatedTime}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-black text-slate-800">
                오늘 할 일
              </p>

              {recommendation.studyPlan &&
              recommendation.studyPlan.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {recommendation.studyPlan.map(
                    (item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-black text-indigo-600">
                          {index + 1}
                        </div>

                        <p className="text-sm font-semibold leading-6 text-slate-700">
                          {item}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  추천할 학습 항목이 아직 없습니다.
                </p>
              )}
            </div>

            {recommendation.motivation && (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-black tracking-wide text-indigo-600">
                  TODAY&apos;S MESSAGE
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-indigo-900">
                  {recommendation.motivation}
                </p>
              </div>
            )}
          </div>
        )}
    </section>
  );
}