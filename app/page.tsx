"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type SubjectSummary = {
  id: string;
  name: string;
  professor: string | null;
  semester: string | null;
  color: string;
  created_at: string;
};

type WeekSummary = {
  id: string;
  subject_id: string;
  week_number: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

type DashboardStats = {
  subjectCount: number;
  weekCount: number;
  examCount: number;
  gradeCount: number;
};

const initialStats: DashboardStats = {
  subjectCount: 0,
  weekCount: 0,
  examCount: 0,
  gradeCount: 0,
};

const quickMenus = [
  {
    name: "과목 관리",
    description: "과목과 주차별 학습 자료를 관리해요.",
    href: "/subjects",
    icon: "▤",
  },
  {
    name: "시험 공부",
    description: "시험 일정과 공부 계획을 정리해요.",
    href: "/exams",
    icon: "✎",
  },
  {
    name: "AI 학습 채팅",
    description: "AI에게 개념 설명과 문제 생성을 요청해요.",
    href: "/chat",
    icon: "🤖",
  },
  {
    name: "암기카드",
    description: "앞면과 뒷면을 넘기며 암기해요.",
    href: "/flashcards",
    icon: "▣",
  },
  {
    name: "학점 관리",
    description: "성적과 평균 학점을 확인해요.",
    href: "/grades",
    icon: "A",
  },
  {
    name: "일정·과제",
    description: "다가오는 일정과 과제를 관리해요.",
    href: "/schedule",
    icon: "□",
  },
];

function formatDate(date: string | null) {
  if (!date) {
    return "날짜 미정";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 6) {
    return "늦은 시간까지 공부하고 있네요";
  }

  if (hour < 12) {
    return "좋은 아침이에요";
  }

  if (hour < 18) {
    return "좋은 오후예요";
  }

  return "오늘도 수고했어요";
}

export default function HomePage() {
  const [stats, setStats] =
    useState<DashboardStats>(initialStats);

  const [subjects, setSubjects] = useState<
    SubjectSummary[]
  >([]);

  const [weeks, setWeeks] = useState<
    WeekSummary[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const recentSubjects = useMemo(() => {
    return [...subjects]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      )
      .slice(0, 4);
  }, [subjects]);

  const upcomingWeeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...weeks]
      .filter((week) => {
        if (!week.start_date && !week.end_date) {
          return false;
        }

        const targetDate =
          week.end_date ?? week.start_date;

        if (!targetDate) {
          return false;
        }

        return (
          new Date(`${targetDate}T00:00:00`).getTime() >=
          today.getTime()
        );
      })
      .sort((a, b) => {
        const firstDate =
          a.end_date ?? a.start_date ?? "";

        const secondDate =
          b.end_date ?? b.start_date ?? "";

        return firstDate.localeCompare(secondDate);
      })
      .slice(0, 5);
  }, [weeks]);

  const completedSetupCount = useMemo(() => {
    let count = 0;

    if (stats.subjectCount > 0) {
      count += 1;
    }

    if (stats.weekCount > 0) {
      count += 1;
    }

    if (stats.examCount > 0) {
      count += 1;
    }

    if (stats.gradeCount > 0) {
      count += 1;
    }

    return count;
  }, [stats]);

  const setupProgress = Math.round(
    (completedSetupCount / 4) * 100,
  );

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [
        subjectsResult,
        weeksResult,
        examsResult,
        gradesResult,
      ] = await Promise.all([
        supabase
          .from("study_subjects")
          .select(
            "id, name, professor, semester, color, created_at",
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("study_weeks")
          .select(
            "id, subject_id, week_number, title, start_date, end_date, created_at",
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("study_exams")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("study_grades")
          .select("id", {
            count: "exact",
            head: true,
          }),
      ]);

      if (subjectsResult.error) {
        throw subjectsResult.error;
      }

      if (weeksResult.error) {
        throw weeksResult.error;
      }

      const subjectData =
        (subjectsResult.data ??
          []) as SubjectSummary[];

      const weekData =
        (weeksResult.data ?? []) as WeekSummary[];

      setSubjects(subjectData);
      setWeeks(weekData);

      setStats({
        subjectCount: subjectData.length,
        weekCount: weekData.length,
        examCount: examsResult.error
          ? 0
          : examsResult.count ?? 0,
        gradeCount: gradesResult.error
          ? 0
          : gradesResult.count ?? 0,
      });
    } catch (error) {
      console.error(
        "대시보드 불러오기 오류:",
        error,
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "대시보드 정보를 불러오지 못했어요.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  function findSubjectName(subjectId: string) {
    return (
      subjects.find(
        (subject) => subject.id === subjectId,
      )?.name ?? "과목 정보 없음"
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            학습 현황을 불러오는 중이에요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-indigo-600">
            STUDY DASHBOARD
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {getGreeting()} 👋
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            과목, 시험, 학점과 학습 진행 상황을
            한곳에서 확인해 보세요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            새로고침
          </button>

          <Link
            href="/subjects"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            + 과목 추가
          </Link>
        </div>
      </header>

      {errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
          <p className="font-semibold">
            일부 정보를 불러오지 못했어요.
          </p>

          <p className="mt-1">
            {errorMessage}
          </p>
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-600">
              ▤
            </span>

            <span className="text-xs font-bold tracking-wide text-slate-400">
              SUBJECTS
            </span>
          </div>

          <p className="mt-5 text-3xl font-extrabold text-slate-900">
            {stats.subjectCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            등록된 과목
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-xl font-bold text-emerald-600">
              週
            </span>

            <span className="text-xs font-bold tracking-wide text-slate-400">
              WEEKS
            </span>
          </div>

          <p className="mt-5 text-3xl font-extrabold text-slate-900">
            {stats.weekCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            등록된 학습 주차
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-xl font-bold text-amber-600">
              ✎
            </span>

            <span className="text-xs font-bold tracking-wide text-slate-400">
              EXAMS
            </span>
          </div>

          <p className="mt-5 text-3xl font-extrabold text-slate-900">
            {stats.examCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            등록된 시험
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-lg font-extrabold text-rose-600">
              A
            </span>

            <span className="text-xs font-bold tracking-wide text-slate-400">
              GRADES
            </span>
          </div>

          <p className="mt-5 text-3xl font-extrabold text-slate-900">
            {stats.gradeCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            등록된 성적
          </p>
        </article>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-slate-900">
              학습 공간 준비 현황
            </p>

            <p className="mt-1 text-sm text-slate-500">
              과목, 주차, 시험, 성적을 등록하면
              대시보드가 채워져요.
            </p>
          </div>

          <p className="text-2xl font-extrabold text-indigo-600">
            {setupProgress}%
          </p>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{
              width: `${setupProgress}%`,
            }}
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "과목 등록",
              done: stats.subjectCount > 0,
            },
            {
              label: "주차 등록",
              done: stats.weekCount > 0,
            },
            {
              label: "시험 등록",
              done: stats.examCount > 0,
            },
            {
              label: "성적 등록",
              done: stats.gradeCount > 0,
            },
          ].map((item) => (
            <div
              key={item.label}
              className={[
                "flex items-center gap-3 rounded-2xl border px-4 py-3",
                item.done
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-slate-100 bg-slate-50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  item.done
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {item.done ? "✓" : "·"}
              </span>

              <span
                className={[
                  "text-sm font-semibold",
                  item.done
                    ? "text-emerald-700"
                    : "text-slate-500",
                ].join(" ")}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5">
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            QUICK ACCESS
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
            바로가기
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickMenus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-600 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  {menu.icon}
                </span>

                <span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500">
                  →
                </span>
              </div>

              <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                {menu.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {menu.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">
                최근 등록한 과목
              </p>

              <p className="mt-1 text-sm text-slate-500">
                최근 추가한 과목을 확인해요.
              </p>
            </div>

            <Link
              href="/subjects"
              className="text-sm font-bold text-indigo-600 transition hover:text-indigo-500"
            >
              전체 보기
            </Link>
          </div>

          {recentSubjects.length > 0 ? (
            <div className="mt-5 space-y-3">
              {recentSubjects.map((subject) => (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-10 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          subject.color ||
                          "#6366f1",
                      }}
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {subject.name}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {subject.professor ||
                          "담당 교수 미입력"}
                        {" · "}
                        {subject.semester ||
                          "학기 미입력"}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-slate-300">
                    →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm font-semibold text-slate-600">
                아직 등록한 과목이 없어요.
              </p>

              <Link
                href="/subjects"
                className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                과목 추가하기
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">
                다가오는 학습 주차
              </p>

              <p className="mt-1 text-sm text-slate-500">
                날짜가 등록된 주차를 확인해요.
              </p>
            </div>

            <Link
              href="/schedule"
              className="text-sm font-bold text-indigo-600 transition hover:text-indigo-500"
            >
              일정 보기
            </Link>
          </div>

          {upcomingWeeks.length > 0 ? (
            <div className="mt-5 space-y-3">
              {upcomingWeeks.map((week) => (
                <Link
                  key={week.id}
                  href={`/subjects/${week.subject_id}/weeks/${week.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-indigo-600">
                      {findSubjectName(
                        week.subject_id,
                      )}
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-slate-800">
                      {week.week_number}주차 ·{" "}
                      {week.title}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                    {formatDate(
                      week.end_date ??
                        week.start_date,
                    )}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm font-semibold text-slate-600">
                예정된 학습 주차가 없어요.
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                과목 상세페이지에서 주차의 시작일이나
                종료일을 입력해 보세요.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}