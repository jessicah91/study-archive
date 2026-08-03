"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: string;
  name: string;
};

type ExamType =
  | "중간고사"
  | "기말고사"
  | "퀴즈"
  | "쪽지시험"
  | "실기"
  | "기타";

type ExamItem = {
  id: string;
  subject_id: string | null;
  title: string;
  due_date: string;
  due_time: string | null;
  priority: "높음" | "보통" | "낮음";
  completed: boolean;
  memo: string | null;
  exam_type: ExamType | null;
  exam_scope: string | null;
  target_score: number | null;
  actual_score: number | null;
  study_progress: number;
};

type ExamForm = {
  subject_id: string;
  title: string;
  due_date: string;
  due_time: string;
  priority: "높음" | "보통" | "낮음";
  memo: string;
  exam_type: ExamType;
  exam_scope: string;
  target_score: string;
  actual_score: string;
  study_progress: number;
};

const EMPTY_FORM: ExamForm = {
  subject_id: "",
  title: "",
  due_date: "",
  due_time: "",
  priority: "보통",
  memo: "",
  exam_type: "중간고사",
  exam_scope: "",
  target_score: "",
  actual_score: "",
  study_progress: 0,
};

function getDDay(dateValue: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${dateValue}T00:00:00`);
  const difference = Math.ceil(
    (dueDate.getTime() - today.getTime()) / 86400000,
  );

  if (difference === 0) return "D-DAY";
  if (difference > 0) return `D-${difference}`;
  return `D+${Math.abs(difference)}`;
}

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${dateValue}T00:00:00`));
}

function nullableNumber(value: string) {
  if (!value.trim()) return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function ExamsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [form, setForm] = useState<ExamForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"전체" | "예정" | "완료">("전체");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const [subjectResult, examResult] = await Promise.all([
      supabase.from("study_subjects").select("id, name").order("name"),
      supabase
        .from("study_schedule")
        .select(
          "id, subject_id, title, due_date, due_time, priority, completed, memo, exam_type, exam_scope, target_score, actual_score, study_progress",
        )
        .eq("schedule_type", "시험")
        .order("due_date", { ascending: true })
        .order("due_time", { ascending: true }),
    ]);

    if (subjectResult.error) {
      setMessage(`과목을 불러오지 못했어요: ${subjectResult.error.message}`);
    }

    if (examResult.error) {
      setMessage(`시험을 불러오지 못했어요: ${examResult.error.message}`);
    }

    setSubjects((subjectResult.data ?? []) as Subject[]);
    setExams(
      (examResult.data ?? []).map((item) => ({
        ...item,
        study_progress: Number(item.study_progress) || 0,
      })) as ExamItem[],
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects],
  );

  const upcomingExams = useMemo(
    () =>
      exams.filter(
        (exam) =>
          !exam.completed &&
          new Date(`${exam.due_date}T23:59:59`) >= new Date(),
      ),
    [exams],
  );

  const visibleExams = useMemo(() => {
    if (filter === "예정") return exams.filter((exam) => !exam.completed);
    if (filter === "완료") return exams.filter((exam) => exam.completed);
    return exams;
  }, [exams, filter]);

  const averageProgress =
    upcomingExams.length === 0
      ? 0
      : Math.round(
          upcomingExams.reduce(
            (sum, exam) => sum + exam.study_progress,
            0,
          ) / upcomingExams.length,
        );

  const scoredExams = exams.filter((exam) => exam.actual_score !== null);
  const averageScore =
    scoredExams.length === 0
      ? null
      : scoredExams.reduce(
          (sum, exam) => sum + Number(exam.actual_score ?? 0),
          0,
        ) / scoredExams.length;

  async function saveExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.due_date) {
      setMessage("시험명과 시험 날짜를 입력해 주세요.");
      return;
    }

    setSaving(true);
    setMessage("");

    const actualScore = nullableNumber(form.actual_score);

    const payload = {
      subject_id: form.subject_id || null,
      title: form.title.trim(),
      schedule_type: "시험",
      due_date: form.due_date,
      due_time: form.due_time || null,
      priority: form.priority,
      completed: actualScore !== null,
      memo: form.memo.trim() || null,
      exam_type: form.exam_type,
      exam_scope: form.exam_scope.trim() || null,
      target_score: nullableNumber(form.target_score),
      actual_score: actualScore,
      study_progress: Math.min(Math.max(form.study_progress, 0), 100),
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase
          .from("study_schedule")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("study_schedule").insert(payload);

    if (result.error) {
      setMessage(`시험을 저장하지 못했어요: ${result.error.message}`);
    } else {
      setMessage(editingId ? "시험을 수정했어요." : "시험을 추가했어요.");
      setEditingId(null);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadData();
    }

    setSaving(false);
  }

  function startEdit(exam: ExamItem) {
    setEditingId(exam.id);
    setForm({
      subject_id: exam.subject_id ?? "",
      title: exam.title,
      due_date: exam.due_date,
      due_time: exam.due_time?.slice(0, 5) ?? "",
      priority: exam.priority,
      memo: exam.memo ?? "",
      exam_type: exam.exam_type ?? "기타",
      exam_scope: exam.exam_scope ?? "",
      target_score:
        exam.target_score === null ? "" : String(exam.target_score),
      actual_score:
        exam.actual_score === null ? "" : String(exam.actual_score),
      study_progress: exam.study_progress,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateProgress(examId: string, progress: number) {
    const safeProgress = Math.min(Math.max(progress, 0), 100);

    const { error } = await supabase
      .from("study_schedule")
      .update({
        study_progress: safeProgress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", examId);

    if (error) {
      setMessage(`진도를 저장하지 못했어요: ${error.message}`);
      return;
    }

    setExams((previous) =>
      previous.map((exam) =>
        exam.id === examId
          ? { ...exam, study_progress: safeProgress }
          : exam,
      ),
    );
  }

  async function toggleComplete(exam: ExamItem) {
    const { error } = await supabase
      .from("study_schedule")
      .update({
        completed: !exam.completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exam.id);

    if (error) {
      setMessage(`완료 상태를 변경하지 못했어요: ${error.message}`);
      return;
    }

    await loadData();
  }

  async function deleteExam(examId: string) {
    if (!window.confirm("이 시험을 삭제할까요?")) return;

    const { error } = await supabase
      .from("study_schedule")
      .delete()
      .eq("id", examId);

    if (error) {
      setMessage(`시험을 삭제하지 못했어요: ${error.message}`);
      return;
    }

    setMessage("시험을 삭제했어요.");
    await loadData();
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">시험 정보를 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            EXAM STUDY
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            시험 공부
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            예시 데이터 없이 실제 시험 일정과 학습 진도만 표시해요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/schedule"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
          >
            전체 일정 보기
          </Link>

          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY_FORM);
              setShowForm(true);
            }}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            + 시험 추가
          </button>
        </div>
      </header>

      {message && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-semibold text-indigo-700">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveExam}
          className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 xl:grid-cols-4"
        >
          <select
            value={form.subject_id}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                subject_id: event.target.value,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="">과목 없음</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                title: event.target.value,
              }))
            }
            placeholder="시험명"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <select
            value={form.exam_type}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                exam_type: event.target.value as ExamType,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            {["중간고사", "기말고사", "퀴즈", "쪽지시험", "실기", "기타"].map(
              (type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ),
            )}
          </select>

          <select
            value={form.priority}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                priority: event.target.value as ExamForm["priority"],
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="높음">중요도 높음</option>
            <option value="보통">중요도 보통</option>
            <option value="낮음">중요도 낮음</option>
          </select>

          <input
            type="date"
            required
            value={form.due_date}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                due_date: event.target.value,
              }))
            }
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <input
            type="time"
            value={form.due_time}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                due_time: event.target.value,
              }))
            }
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <input
            type="number"
            min={0}
            max={100}
            value={form.target_score}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                target_score: event.target.value,
              }))
            }
            placeholder="목표 점수"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <input
            type="number"
            min={0}
            max={100}
            value={form.actual_score}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                actual_score: event.target.value,
              }))
            }
            placeholder="실제 점수"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              학습 진도 {form.study_progress}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.study_progress}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  study_progress: Number(event.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          <textarea
            value={form.exam_scope}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                exam_scope: event.target.value,
              }))
            }
            placeholder="시험 범위"
            rows={3}
            className="resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
          />

          <textarea
            value={form.memo}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                memo: event.target.value,
              }))
            }
            placeholder="시험 메모"
            rows={3}
            className="resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {editingId ? "수정 완료" : "시험 저장"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
          >
            취소
          </button>
        </form>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["다가오는 시험", `${upcomingExams.length}개`],
          [
            "가장 가까운 시험",
            upcomingExams[0] ? getDDay(upcomingExams[0].due_date) : "-",
          ],
          ["평균 학습 진도", `${averageProgress}%`],
          [
            "평균 실제 점수",
            averageScore === null ? "-" : `${averageScore.toFixed(1)}점`,
          ],
        ].map(([label, value]) => (
          <article
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(["전체", "예정", "완료"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold",
                filter === option
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600",
              ].join(" ")}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {visibleExams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-3xl">📝</p>
            <p className="mt-3 font-semibold text-slate-700">
              등록된 시험이 없어요.
            </p>
          </div>
        ) : (
          visibleExams.map((exam) => (
            <article
              key={exam.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      {exam.exam_type ?? "기타"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      중요도 {exam.priority}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-extrabold text-slate-900">
                    {exam.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {exam.subject_id
                      ? subjectMap.get(exam.subject_id) ?? "과목 정보 없음"
                      : "과목 없음"}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {formatDate(exam.due_date)}
                    {exam.due_time ? ` ${exam.due_time.slice(0, 5)}` : ""}
                  </p>

                  {exam.exam_scope && (
                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-400">
                        시험 범위
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {exam.exam_scope}
                      </p>
                    </div>
                  )}
                </div>

                <div className="w-full rounded-2xl bg-slate-50 p-5 lg:w-72">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">시험까지</span>
                    <span className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                      {getDDay(exam.due_date)}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">
                        학습 진도
                      </span>
                      <span className="font-bold text-indigo-700">
                        {exam.study_progress}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={exam.study_progress}
                      onChange={(event) =>
                        void updateProgress(
                          exam.id,
                          Number(event.target.value),
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-3 text-center">
                      <p className="text-xs text-slate-400">목표</p>
                      <p className="mt-1 font-bold text-slate-800">
                        {exam.target_score ?? "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3 text-center">
                      <p className="text-xs text-slate-400">실제</p>
                      <p className="mt-1 font-bold text-slate-800">
                        {exam.actual_score ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {exam.subject_id && (
                  <Link
                    href={`/subjects/${exam.subject_id}`}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    과목 공부하기
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => void toggleComplete(exam)}
                  className="rounded-xl border border-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700"
                >
                  {exam.completed ? "예정으로 변경" : "완료 처리"}
                </button>

                <button
                  type="button"
                  onClick={() => startEdit(exam)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  수정
                </button>

                <button
                  type="button"
                  onClick={() => void deleteExam(exam.id)}
                  className="rounded-xl border border-red-100 px-4 py-2 text-sm font-semibold text-red-500"
                >
                  삭제
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
