"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Subject = {
  id: string;
  name: string;
};

type ScheduleItem = {
  id: string;
  subject_id: string | null;
  title: string;
  schedule_type: "과제" | "시험" | "발표" | "수업" | "공부" | "기타";
  due_date: string;
  due_time: string | null;
  priority: "높음" | "보통" | "낮음";
  completed: boolean;
  memo: string | null;
  created_at: string;
};

const EMPTY_FORM = {
  subject_id: "",
  title: "",
  schedule_type: "과제" as ScheduleItem["schedule_type"],
  due_date: "",
  due_time: "",
  priority: "보통" as ScheduleItem["priority"],
  memo: "",
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

export default function SchedulePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("전체");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);

    const [subjectResult, scheduleResult] = await Promise.all([
      supabase.from("study_subjects").select("id, name").order("name"),
      supabase
        .from("study_schedule")
        .select(
          "id, subject_id, title, schedule_type, due_date, due_time, priority, completed, memo, created_at",
        )
        .order("due_date", { ascending: true })
        .order("due_time", { ascending: true }),
    ]);

    if (subjectResult.error) {
      setMessage(`과목 정보를 불러오지 못했어요: ${subjectResult.error.message}`);
    }

    if (scheduleResult.error) {
      setMessage(`일정을 불러오지 못했어요: ${scheduleResult.error.message}`);
    }

    setSubjects((subjectResult.data ?? []) as Subject[]);
    setItems((scheduleResult.data ?? []) as ScheduleItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects],
  );

  const visibleItems = useMemo(() => {
    if (filter === "완료") {
      return items.filter((item) => item.completed);
    }

    if (filter === "미완료") {
      return items.filter((item) => !item.completed);
    }

    if (filter !== "전체") {
      return items.filter((item) => item.schedule_type === filter);
    }

    return items;
  }, [items, filter]);

  const upcomingCount = items.filter(
    (item) => !item.completed && new Date(`${item.due_date}T23:59:59`) >= new Date(),
  ).length;

  const urgentCount = items.filter((item) => {
    if (item.completed) return false;
    const dDay = getDDay(item.due_date);
    return ["D-DAY", "D-1", "D-2", "D-3"].includes(dDay);
  }).length;

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      subject_id: form.subject_id || null,
      title: form.title.trim(),
      schedule_type: form.schedule_type,
      due_date: form.due_date,
      due_time: form.due_time || null,
      priority: form.priority,
      memo: form.memo.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase
          .from("study_schedule")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("study_schedule").insert(payload);

    if (result.error) {
      setMessage(`일정을 저장하지 못했어요: ${result.error.message}`);
    } else {
      setMessage(editingId ? "일정을 수정했어요." : "일정을 추가했어요.");
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      await loadData();
    }

    setSaving(false);
  }

  function startEdit(item: ScheduleItem) {
    setEditingId(item.id);
    setForm({
      subject_id: item.subject_id ?? "",
      title: item.title,
      schedule_type: item.schedule_type,
      due_date: item.due_date,
      due_time: item.due_time ?? "",
      priority: item.priority,
      memo: item.memo ?? "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleComplete(item: ScheduleItem) {
    const { error } = await supabase
      .from("study_schedule")
      .update({
        completed: !item.completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setMessage(`완료 상태를 변경하지 못했어요: ${error.message}`);
      return;
    }

    await loadData();
  }

  async function deleteItem(id: string) {
    if (!window.confirm("이 일정을 삭제할까요?")) return;

    const { error } = await supabase
      .from("study_schedule")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(`일정을 삭제하지 못했어요: ${error.message}`);
      return;
    }

    setMessage("일정을 삭제했어요.");
    await loadData();
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">일정을 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            SCHEDULE
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            일정·과제
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            시험, 과제, 발표와 공부 계획을 등록하고 완료 처리해요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setShowForm(true);
          }}
          className="self-start rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          + 일정 추가
        </button>
      </header>

      {message && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-semibold text-indigo-700">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveSchedule}
          className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 xl:grid-cols-4"
        >
          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                title: event.target.value,
              }))
            }
            placeholder="일정 제목"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

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

          <select
            value={form.schedule_type}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                schedule_type:
                  event.target.value as ScheduleItem["schedule_type"],
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            {["과제", "시험", "발표", "수업", "공부", "기타"].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={form.priority}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                priority: event.target.value as ScheduleItem["priority"],
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
            value={form.memo}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                memo: event.target.value,
              }))
            }
            placeholder="메모"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {editingId ? "수정 완료" : "일정 저장"}
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
          </div>
        </form>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["전체 일정", `${items.length}개`],
          ["다가오는 일정", `${upcomingCount}개`],
          ["마감 임박", `${urgentCount}개`],
          ["완료", `${items.filter((item) => item.completed).length}개`],
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
          {["전체", "미완료", "완료", "과제", "시험", "발표", "수업", "공부"].map(
            (option) => (
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
            ),
          )}
        </div>
      </section>

      <section className="space-y-4">
        {visibleItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">등록된 일정이 없어요.</p>
          </div>
        ) : (
          visibleItems.map((item) => (
            <article
              key={item.id}
              className={[
                "rounded-3xl border bg-white p-6 shadow-sm",
                item.completed
                  ? "border-slate-200 opacity-60"
                  : "border-slate-200",
              ].join(" ")}
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      {item.schedule_type}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      중요도 {item.priority}
                    </span>
                    {item.completed && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        완료
                      </span>
                    )}
                  </div>

                  <h2
                    className={[
                      "mt-3 text-lg font-extrabold text-slate-900",
                      item.completed ? "line-through" : "",
                    ].join(" ")}
                  >
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {item.subject_id
                      ? subjectMap.get(item.subject_id) ?? "과목 정보 없음"
                      : "과목 없음"}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {formatDate(item.due_date)}
                    {item.due_time ? ` ${item.due_time.slice(0, 5)}` : ""}
                  </p>

                  {item.memo && (
                    <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                      {item.memo}
                    </p>
                  )}
                </div>

                <span className="self-start rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                  {getDDay(item.due_date)}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => void toggleComplete(item)}
                  className="rounded-xl border border-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700"
                >
                  {item.completed ? "미완료로 변경" : "완료 처리"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => void deleteItem(item.id)}
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
