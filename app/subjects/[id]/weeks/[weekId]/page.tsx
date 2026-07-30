"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import WeekMaterials from "@/components/WeekMaterials";
import { supabase } from "@/lib/supabase";
import type { Subject } from "@/types/subject";
import type { StudyWeek } from "@/types/week";

function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function WeekDetailPage() {
  const params = useParams<{
    id: string;
    weekId: string;
  }>();

  const subjectId = params.id;
  const weekId = params.weekId;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [week, setWeek] = useState<StudyWeek | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadPageData = useCallback(async () => {
    if (!subjectId || !weekId) {
      setErrorMessage("과목 또는 주차 ID를 찾을 수 없어요.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const [
      { data: subjectData, error: subjectError },
      { data: weekData, error: weekError },
    ] = await Promise.all([
      supabase
        .from("study_subjects")
        .select("*")
        .eq("id", subjectId)
        .maybeSingle(),

      supabase
        .from("study_weeks")
        .select("*")
        .eq("id", weekId)
        .eq("subject_id", subjectId)
        .maybeSingle(),
    ]);

    if (subjectError) {
      console.error(subjectError);
      setErrorMessage(
        `과목 정보를 불러오지 못했어요: ${subjectError.message}`,
      );
      setIsLoading(false);
      return;
    }

    if (weekError) {
      console.error(weekError);
      setErrorMessage(
        `주차 정보를 불러오지 못했어요: ${weekError.message}`,
      );
      setIsLoading(false);
      return;
    }

    if (!subjectData) {
      setErrorMessage("존재하지 않거나 삭제된 과목이에요.");
      setIsLoading(false);
      return;
    }

    if (!weekData) {
      setErrorMessage(
        "존재하지 않거나 이 과목에 속하지 않은 주차예요.",
      );
      setIsLoading(false);
      return;
    }

    setSubject(subjectData as Subject);
    setWeek(weekData as StudyWeek);
    setIsLoading(false);
  }, [subjectId, weekId]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const dateText = useMemo(() => {
    if (!week) {
      return "날짜 미입력";
    }

    const startDate = formatDate(week.start_date);
    const endDate = formatDate(week.end_date);

    if (startDate && endDate) {
      return `${startDate} ~ ${endDate}`;
    }

    if (startDate) {
      return `${startDate} 시작`;
    }

    if (endDate) {
      return `${endDate} 종료`;
    }

    return "날짜 미입력";
  }, [week]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          주차 정보를 불러오는 중이에요.
        </p>
      </div>
    );
  }

  if (errorMessage || !subject || !week) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
        <p className="font-semibold text-red-500">
          {errorMessage || "주차 정보를 찾지 못했어요."}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/subjects/${subjectId}`}
            className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            과목으로 돌아가기
          </Link>

          <Link
            href="/subjects"
            className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            과목 목록
          </Link>
        </div>
      </div>
    );
  }

  const dashboardMenus = [
    {
      title: "수업 자료",
      description:
        "PDF, PPT, Word, 이미지 등 수업 자료를 등록하고 관리해요.",
      icon: "▱",
      badge: "다음 단계",
    },
    {
      title: "수업 필기",
      description:
        "강의 내용과 중요한 설명을 주차별 노트로 기록해요.",
      icon: "✎",
      badge: "준비 중",
    },
    {
      title: "AI 학습",
      description:
        "업로드한 자료에서 요약, 핵심 개념, 용어와 문제를 생성해요.",
      icon: "AI",
      badge: "준비 중",
    },
    {
      title: "문제 풀이",
      description:
        "이 주차의 객관식·주관식 문제와 모의 문제를 풀어요.",
      icon: "?",
      badge: "준비 중",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
        <Link
          href="/subjects"
          className="transition hover:text-slate-900"
        >
          과목
        </Link>

        <span className="text-slate-300">/</span>

        <Link
          href={`/subjects/${subject.id}`}
          className="transition hover:text-slate-900"
        >
          {subject.name}
        </Link>

        <span className="text-slate-300">/</span>

        <span className="text-slate-900">
          {week.week_number}주차
        </span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div
          className="h-3"
          style={{ backgroundColor: subject.color }}
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />

                <p className="text-sm font-semibold tracking-[0.16em] text-slate-400">
                  WEEKLY STUDY
                </p>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  {week.week_number}주차
                </span>
              </div>

              <h1 className="mt-4 break-words text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {week.title}
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                {subject.name} · {dateText}
              </p>
            </div>

            <Link
              href={`/subjects/${subject.id}`}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              ← 주차 목록
            </Link>
          </div>

          {week.description && (
            <div className="mt-7 rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-400">
                주차 메모
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {week.description}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5">
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            STUDY DASHBOARD
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            주차 학습 대시보드
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            자료 등록부터 AI 분석과 복습까지 한곳에서 관리해요.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {dashboardMenus.map((menu) => (
            <article
              key={menu.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-extrabold text-slate-600">
                  {menu.icon}
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {menu.title}
                    </h3>

                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        menu.badge === "다음 단계"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {menu.badge}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {menu.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-400">
            등록 자료
          </p>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            0개
          </p>

          <p className="mt-1 text-xs text-slate-400">
            자료 업로드 기능 연결 예정
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-400">
            AI 분석
          </p>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            대기
          </p>

          <p className="mt-1 text-xs text-slate-400">
            자료가 등록되면 분석할 수 있어요
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-400">
            복습 상태
          </p>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            시작 전
          </p>

          <p className="mt-1 text-xs text-slate-400">
            추후 복습 완료 기능 연결 예정
          </p>
        </article>
      </section>

      <WeekMaterials
  subjectId={subject.id}
  weekId={week.id}
/>
</div>
  );
}