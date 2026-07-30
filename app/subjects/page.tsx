"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import type {
  Subject,
  SubjectFormData,
} from "@/types/subject";

const initialForm: SubjectFormData = {
  name: "",
  professor: "",
  semester: "",
  color: "#6366f1",
  description: "",
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] =
    useState<SubjectFormData>(initialForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSubjects = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("study_subjects")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setMessage(
        `과목을 불러오지 못했어요: ${error.message}`,
      );
      setIsLoading(false);
      return;
    }

    setSubjects((data ?? []) as Subject[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  function updateForm<K extends keyof SubjectFormData>(
    key: K,
    value: SubjectFormData[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setMessage("과목명을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const subjectData = {
      name: trimmedName,
      professor: form.professor.trim() || null,
      semester: form.semester.trim() || null,
      color: form.color,
      description: form.description.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("study_subjects")
        .update(subjectData)
        .eq("id", editingId);

      if (error) {
        console.error(error);
        setMessage(
          `과목을 수정하지 못했어요: ${error.message}`,
        );
        setIsSaving(false);
        return;
      }

      setMessage("과목을 수정했어요.");
    } else {
      const { error } = await supabase
        .from("study_subjects")
        .insert({
          ...subjectData,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error(error);
        setMessage(
          `과목을 추가하지 못했어요: ${error.message}`,
        );
        setIsSaving(false);
        return;
      }

      setMessage("과목을 추가했어요.");
    }

    resetForm();
    await loadSubjects();
    setIsSaving(false);
  }

  function startEditing(subject: Subject) {
    setEditingId(subject.id);

    setForm({
      name: subject.name,
      professor: subject.professor ?? "",
      semester: subject.semester ?? "",
      color: subject.color,
      description: subject.description ?? "",
    });

    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteSubject(subject: Subject) {
    const shouldDelete = window.confirm(
      `"${subject.name}" 과목을 삭제할까요?\n과목에 등록된 주차도 함께 삭제돼요.`,
    );

    if (!shouldDelete) {
      return;
    }

    setMessage("");

    const { error } = await supabase
      .from("study_subjects")
      .delete()
      .eq("id", subject.id);

    if (error) {
      console.error(error);
      setMessage(
        `과목을 삭제하지 못했어요: ${error.message}`,
      );
      return;
    }

    if (editingId === subject.id) {
      resetForm();
    }

    setMessage("과목을 삭제했어요.");
    await loadSubjects();
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8">
        <p className="mb-2 text-sm font-semibold tracking-[0.18em] text-indigo-600">
          SUBJECTS
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          과목
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          수강 과목을 등록하고 과목별 주차와 학습
          자료를 관리해요.
        </p>
      </header>

      <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {editingId ? "과목 수정" : "새 과목 추가"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            과목명은 필수이고, 나머지 항목은 비워도
            돼요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                과목명 *
              </span>

              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                placeholder="예: 개발경제학"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                담당 교수
              </span>

              <input
                type="text"
                value={form.professor}
                onChange={(event) =>
                  updateForm(
                    "professor",
                    event.target.value,
                  )
                }
                placeholder="예: 김교수"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                학기
              </span>

              <input
                type="text"
                value={form.semester}
                onChange={(event) =>
                  updateForm(
                    "semester",
                    event.target.value,
                  )
                }
                placeholder="예: 2026년 2학기"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                과목 색상
              </span>

              <div className="flex h-[46px] items-center gap-3 rounded-2xl border border-slate-200 px-4">
                <input
                  type="color"
                  value={form.color}
                  onChange={(event) =>
                    updateForm(
                      "color",
                      event.target.value,
                    )
                  }
                  className="h-8 w-12 cursor-pointer border-0 bg-transparent p-0"
                />

                <span className="text-sm text-slate-500">
                  {form.color}
                </span>
              </div>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              메모
            </span>

            <textarea
              value={form.description}
              onChange={(event) =>
                updateForm(
                  "description",
                  event.target.value,
                )
              }
              placeholder="시험 방식, 수업 특징 등을 적어두세요."
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "저장 중..."
                : editingId
                  ? "수정 완료"
                  : "과목 추가"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                수정 취소
              </button>
            )}
          </div>
        </form>

        {message && (
          <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {message}
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              등록한 과목
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              총 {subjects.length}개
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadSubjects()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            새로고침
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            과목을 불러오는 중이에요.
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              아직 등록된 과목이 없어요.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              위 입력창에서 첫 번째 과목을 추가해
              보세요.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <article
                key={subject.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="h-2"
                  style={{
                    backgroundColor: subject.color,
                  }}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-slate-900">
                        {subject.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {subject.semester ||
                          "학기 미입력"}
                      </p>
                    </div>

                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          subject.color,
                      }}
                    />
                  </div>

                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-400">
                        담당 교수
                      </dt>

                      <dd className="text-right font-medium text-slate-700">
                        {subject.professor ||
                          "미입력"}
                      </dd>
                    </div>
                  </dl>

                  {subject.description && (
                    <p className="mt-4 line-clamp-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                      {subject.description}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <Link
                      href={`/subjects/${subject.id}`}
                      className="flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      열기
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        startEditing(subject)
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void deleteSubject(subject)
                      }
                      className="rounded-xl border border-red-100 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}