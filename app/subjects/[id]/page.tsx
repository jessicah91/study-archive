"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import type { Subject } from "@/types/subject";
import type {
  StudyWeek,
  WeekFormData,
} from "@/types/week";

const TOTAL_SEMESTER_WEEKS = 15;

const initialWeekForm: WeekFormData = {
  week_number: "",
  title: "",
  start_date: "",
  end_date: "",
  description: "",
};

type SortOption =
  | "week-asc"
  | "week-desc"
  | "latest"
  | "oldest";

type MessageType = "success" | "error" | "info";

type PageMessage = {
  type: MessageType;
  text: string;
};

function formatDate(date: string | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getMessageClass(type: MessageType) {
  if (type === "success") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (type === "error") {
    return "border-red-100 bg-red-50 text-red-600";
  }

  return "border-slate-100 bg-slate-50 text-slate-600";
}

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const subjectId = params.id;

  const [subject, setSubject] =
    useState<Subject | null>(null);

  const [weeks, setWeeks] = useState<StudyWeek[]>([]);

  const [weekForm, setWeekForm] =
    useState<WeekFormData>(initialWeekForm);

  const [editingWeekId, setEditingWeekId] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingWeek, setIsSavingWeek] =
    useState(false);

  const [deletingWeekId, setDeletingWeekId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [pageMessage, setPageMessage] =
    useState<PageMessage | null>(null);

  const [searchKeyword, setSearchKeyword] =
    useState("");

  const [sortOption, setSortOption] =
    useState<SortOption>("week-asc");

  const nextWeekNumber = useMemo(() => {
    if (weeks.length === 0) {
      return 1;
    }

    return (
      Math.max(
        ...weeks.map((week) => week.week_number),
      ) + 1
    );
  }, [weeks]);

  const progressPercent = useMemo(() => {
    const percent =
      (weeks.length / TOTAL_SEMESTER_WEEKS) * 100;

    return Math.min(Math.round(percent), 100);
  }, [weeks.length]);

  const visibleWeeks = useMemo(() => {
    const keyword = searchKeyword
      .trim()
      .toLowerCase();

    const filtered = weeks.filter((week) => {
      if (!keyword) {
        return true;
      }

      const title = week.title.toLowerCase();
      const description =
        week.description?.toLowerCase() ?? "";
      const weekNumber = String(week.week_number);

      return (
        title.includes(keyword) ||
        description.includes(keyword) ||
        weekNumber.includes(keyword)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === "week-asc") {
        return a.week_number - b.week_number;
      }

      if (sortOption === "week-desc") {
        return b.week_number - a.week_number;
      }

      if (sortOption === "latest") {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      }

      return (
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
      );
    });
  }, [weeks, searchKeyword, sortOption]);

  const loadSubject = useCallback(async () => {
    if (!subjectId) {
      setErrorMessage("과목 ID를 찾을 수 없어요.");
      return false;
    }

    const { data, error } = await supabase
      .from("study_subjects")
      .select("*")
      .eq("id", subjectId)
      .maybeSingle();

    if (error) {
      console.error(error);

      setErrorMessage(
        `과목을 불러오지 못했어요: ${error.message}`,
      );

      return false;
    }

    if (!data) {
      setErrorMessage(
        "존재하지 않거나 삭제된 과목이에요.",
      );

      return false;
    }

    setSubject(data as Subject);
    return true;
  }, [subjectId]);

  const loadWeeks = useCallback(async () => {
    if (!subjectId) {
      return;
    }

    const { data, error } = await supabase
      .from("study_weeks")
      .select("*")
      .eq("subject_id", subjectId)
      .order("week_number", {
        ascending: true,
      });

    if (error) {
      console.error(error);

      setPageMessage({
        type: "error",
        text: `주차를 불러오지 못했어요: ${error.message}`,
      });

      return;
    }

    setWeeks((data ?? []) as StudyWeek[]);
  }, [subjectId]);

  const initializePage = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    setPageMessage(null);

    const subjectLoaded = await loadSubject();

    if (subjectLoaded) {
      await loadWeeks();
    }

    setIsLoading(false);
  }, [loadSubject, loadWeeks]);

  useEffect(() => {
    void initializePage();
  }, [initializePage]);

  function updateWeekForm<
    K extends keyof WeekFormData,
  >(
    key: K,
    value: WeekFormData[K],
  ) {
    setWeekForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function resetWeekForm() {
    setWeekForm(initialWeekForm);
    setEditingWeekId(null);
  }

  function scrollToWeekForm() {
    document
      .getElementById("week-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function fillNextWeekNumber() {
    setWeekForm((previous) => ({
      ...previous,
      week_number: String(nextWeekNumber),
      title:
        previous.title.trim() ||
        `${nextWeekNumber}주차`,
    }));
  }

  async function handleWeekSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSavingWeek) {
      return;
    }

    const weekNumber = Number(
      weekForm.week_number,
    );

    const title = weekForm.title.trim();

    if (
      !Number.isInteger(weekNumber) ||
      weekNumber < 1 ||
      weekNumber > 30
    ) {
      setPageMessage({
        type: "error",
        text: "주차 번호는 1부터 30 사이의 정수로 입력해 주세요.",
      });

      return;
    }

    if (!title) {
      setPageMessage({
        type: "error",
        text: "주차 제목을 입력해 주세요.",
      });

      return;
    }

    if (
      weekForm.start_date &&
      weekForm.end_date &&
      weekForm.start_date > weekForm.end_date
    ) {
      setPageMessage({
        type: "error",
        text: "종료일은 시작일보다 빠를 수 없어요.",
      });

      return;
    }

    const duplicateWeek = weeks.find(
      (week) =>
        week.week_number === weekNumber &&
        week.id !== editingWeekId,
    );

    if (duplicateWeek) {
      setPageMessage({
        type: "error",
        text: `${weekNumber}주차는 이미 등록되어 있어요.`,
      });

      return;
    }

    setIsSavingWeek(true);
    setPageMessage(null);

    const now = new Date().toISOString();

    const weekData = {
      subject_id: subjectId,
      week_number: weekNumber,
      title,
      start_date:
        weekForm.start_date || null,
      end_date: weekForm.end_date || null,
      description:
        weekForm.description.trim() || null,
      updated_at: now,
    };

    try {
      if (editingWeekId) {
        const { error } = await supabase
          .from("study_weeks")
          .update(weekData)
          .eq("id", editingWeekId)
          .eq("subject_id", subjectId);

        if (error) {
          throw error;
        }

        setPageMessage({
          type: "success",
          text: "주차를 수정했어요.",
        });
      } else {
        const { error } = await supabase
          .from("study_weeks")
          .insert({
            ...weekData,
            created_at: now,
          });

        if (error) {
          throw error;
        }

        setPageMessage({
          type: "success",
          text: "새 주차를 추가했어요.",
        });
      }

      resetWeekForm();
      await loadWeeks();
    } catch (error) {
      console.error(error);

      const supabaseError = error as {
        code?: string;
        message?: string;
      };

      if (supabaseError.code === "23505") {
        setPageMessage({
          type: "error",
          text: "이미 등록된 주차 번호예요. 다른 번호를 입력해 주세요.",
        });
      } else {
        setPageMessage({
          type: "error",
          text:
            supabaseError.message ??
            "주차를 저장하지 못했어요.",
        });
      }
    } finally {
      setIsSavingWeek(false);
    }
  }

  function startEditingWeek(week: StudyWeek) {
    setEditingWeekId(week.id);

    setWeekForm({
      week_number: String(week.week_number),
      title: week.title,
      start_date: week.start_date ?? "",
      end_date: week.end_date ?? "",
      description: week.description ?? "",
    });

    setPageMessage({
      type: "info",
      text: `${week.week_number}주차를 수정하고 있어요.`,
    });

    scrollToWeekForm();
  }

  async function deleteWeek(week: StudyWeek) {
    if (deletingWeekId) {
      return;
    }

    const shouldDelete = window.confirm(
      `${week.week_number}주차 "${week.title}"을 삭제할까요?\n등록된 자료도 함께 삭제될 수 있어요.`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingWeekId(week.id);
    setPageMessage(null);

    const { error } = await supabase
      .from("study_weeks")
      .delete()
      .eq("id", week.id)
      .eq("subject_id", subjectId);

    if (error) {
      console.error(error);

      setPageMessage({
        type: "error",
        text: `주차를 삭제하지 못했어요: ${error.message}`,
      });

      setDeletingWeekId(null);
      return;
    }

    if (editingWeekId === week.id) {
      resetWeekForm();
    }

    setPageMessage({
      type: "success",
      text: `${week.week_number}주차를 삭제했어요.`,
    });

    await loadWeeks();
    setDeletingWeekId(null);
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

        <p className="mt-4 text-sm text-slate-500">
          과목과 주차 정보를 불러오는 중이에요.
        </p>
      </div>
    );
  }

  if (errorMessage || !subject) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
        <p className="font-semibold text-red-500">
          {errorMessage ||
            "과목 정보를 찾지 못했어요."}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void initializePage()}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            다시 시도
          </button>

          <Link
            href="/subjects"
            className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            과목 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <span aria-hidden="true">←</span>
          과목 목록
        </Link>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div
          className="h-3"
          style={{
            backgroundColor: subject.color,
          }}
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="min-w-0">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{
                    backgroundColor:
                      subject.color,
                  }}
                />

                <p className="text-sm font-semibold tracking-[0.16em] text-slate-400">
                  SUBJECT
                </p>
              </div>

              <h1 className="break-words text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {subject.name}
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                {subject.semester ||
                  "학기 정보 없음"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/subjects"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                과목 관리
              </Link>

              <button
                type="button"
                onClick={scrollToWeekForm}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                + 주차 추가
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-400">
                담당 교수
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                {subject.professor ||
                  "미입력"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-400">
                등록한 주차
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                총 {weeks.length}개
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-400">
                다음 주차
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                {nextWeekNumber}주차
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-400">
                  학기 진행률
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {weeks.length} /{" "}
                  {TOTAL_SEMESTER_WEEKS}주차
                </p>
              </div>

              <p className="text-lg font-extrabold text-indigo-600">
                {progressPercent}%
              </p>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>

          {subject.description && (
            <div className="mt-4 rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-semibold tracking-wide text-slate-400">
                과목 메모
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {subject.description}
              </p>
            </div>
          )}
        </div>
      </section>

      {pageMessage && (
        <div
          className={[
            "mt-6 rounded-2xl border px-4 py-3 text-sm",
            getMessageClass(pageMessage.type),
          ].join(" ")}
        >
          {pageMessage.text}
        </div>
      )}

      <section className="mt-8">
        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
              WEEKLY STUDY
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              주차별 학습
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              수업 자료와 복습 내용을 주차별로
              관리해요.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={searchKeyword}
              onChange={(event) =>
                setSearchKeyword(
                  event.target.value,
                )
              }
              placeholder="주차 검색"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />

            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value as SortOption,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 outline-none transition focus:border-indigo-400"
            >
              <option value="week-asc">
                주차 빠른 순
              </option>

              <option value="week-desc">
                주차 늦은 순
              </option>

              <option value="latest">
                최근 등록 순
              </option>

              <option value="oldest">
                오래된 등록 순
              </option>
            </select>

            <button
              type="button"
              onClick={() => void loadWeeks()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              새로고침
            </button>
          </div>
        </div>

        {weeks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              아직 등록한 주차가 없어요.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              아래 입력창에서 첫 번째 주차를
              추가해 보세요.
            </p>
          </div>
        ) : visibleWeeks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              검색 결과가 없어요.
            </p>

            <button
              type="button"
              onClick={() =>
                setSearchKeyword("")
              }
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              검색 초기화
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleWeeks.map((week) => (
              <article
                key={week.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-indigo-600">
                      {week.week_number}주차
                    </p>

                    <h3 className="mt-2 break-words text-lg font-bold text-slate-900">
                      {week.title}
                    </h3>
                  </div>

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-extrabold text-slate-600">
                    {week.week_number}
                  </span>
                </div>

                {(week.start_date ||
                  week.end_date) && (
                  <p className="mt-4 text-sm text-slate-500">
                    {formatDate(
                      week.start_date,
                    ) || "시작일 없음"}
                    {" · "}
                    {formatDate(
                      week.end_date,
                    ) || "종료일 없음"}
                  </p>
                )}

                {week.description ? (
                  <p className="mt-4 line-clamp-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                    {week.description}
                  </p>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-slate-200 p-3 text-sm text-slate-400">
                    등록된 주차 메모가 없어요.
                  </p>
                )}

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Link
                    href={`/subjects/${subject.id}/weeks/${week.id}`}
                    className="flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    열기
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      startEditingWeek(week)
                    }
                    disabled={
                      deletingWeekId === week.id
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void deleteWeek(week)
                    }
                    disabled={
                      deletingWeekId !== null
                    }
                    className="rounded-xl border border-red-100 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingWeekId === week.id
                      ? "삭제 중"
                      : "삭제"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        id="week-form"
        className="mt-8 scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {editingWeekId
                ? "주차 수정"
                : "새 주차 추가"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              주차 번호와 제목은 필수예요.
            </p>
          </div>

          {!editingWeekId && (
            <button
              type="button"
              onClick={fillNextWeekNumber}
              className="self-start rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
            >
              {nextWeekNumber}주차 자동 입력
            </button>
          )}
        </div>

        <form
          onSubmit={handleWeekSubmit}
          className="space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                주차 번호 *
              </span>

              <input
                type="number"
                min={1}
                max={30}
                required
                value={weekForm.week_number}
                onChange={(event) =>
                  updateWeekForm(
                    "week_number",
                    event.target.value,
                  )
                }
                placeholder="예: 1"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                주차 제목 *
              </span>

              <input
                type="text"
                required
                value={weekForm.title}
                onChange={(event) =>
                  updateWeekForm(
                    "title",
                    event.target.value,
                  )
                }
                placeholder="예: 개발경제학의 기본 개념"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                시작일
              </span>

              <input
                type="date"
                value={weekForm.start_date}
                onChange={(event) =>
                  updateWeekForm(
                    "start_date",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                종료일
              </span>

              <input
                type="date"
                min={
                  weekForm.start_date ||
                  undefined
                }
                value={weekForm.end_date}
                onChange={(event) =>
                  updateWeekForm(
                    "end_date",
                    event.target.value,
                  )
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              주차 메모
            </span>

            <textarea
              value={weekForm.description}
              onChange={(event) =>
                updateWeekForm(
                  "description",
                  event.target.value,
                )
              }
              placeholder="수업 범위, 준비할 자료, 복습할 내용을 적어두세요."
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSavingWeek}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingWeek
                ? "저장 중..."
                : editingWeekId
                  ? "수정 완료"
                  : "주차 추가"}
            </button>

            {editingWeekId && (
              <button
                type="button"
                onClick={() => {
                  resetWeekForm();

                  setPageMessage({
                    type: "info",
                    text: "수정을 취소했어요.",
                  });
                }}
                disabled={isSavingWeek}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                수정 취소
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                resetWeekForm();
                setPageMessage(null);
              }}
              disabled={isSavingWeek}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              입력 초기화
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}