"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type GradeSemester = {
  id: string;
  semester_name: string;
  year: number;
  semester_number: number;
  created_at: string;
};

type GradeCourse = {
  id: string;
  semester_id: string;
  course_name: string;
  category: "전필" | "전선" | "부전" | "교필" | "교핵" | "기타";
  credits: number;
  letter_grade: string;
  grade_point: number | null;
  is_major: boolean;
  memo: string | null;
  created_at: string;
};

type CourseForm = {
  semester_id: string;
  course_name: string;
  category: "전필" | "전선" | "부전" | "교필" | "교핵" | "기타";
  credits: number;
  letter_grade: string;
  is_major: boolean;
  memo: string;
};

const GRADE_POINTS: Record<string, number | null> = {
  "A+": 4.3,
  A0: 4.0,
  "A-": 3.7,

  "B+": 3.3,
  B0: 3.0,
  "B-": 2.7,

  "C+": 2.3,
  C0: 2.0,
  "C-": 1.7,

  "D+": 1.3,
  D0: 1.0,
  "D-": 0.7,

  F: 0,
  P: null,
  NP: null,
};

const EMPTY_SEMESTER = {
  semester_name: "",
  year: new Date().getFullYear(),
  semester_number: 1,
};

const EMPTY_COURSE: CourseForm = {
  semester_id: "",
  course_name: "",
  category: "전필",
  credits: 3,
  letter_grade: "A+",
  is_major: true,
  memo: "",
};

function calculateGpa(courses: GradeCourse[]) {
  const graded = courses.filter(
    (course) => course.grade_point !== null && course.credits > 0,
  );

  const totalCredits = graded.reduce(
    (sum, course) => sum + Number(course.credits),
    0,
  );

  if (totalCredits === 0) return 0;

  const points = graded.reduce(
    (sum, course) =>
      sum + Number(course.grade_point ?? 0) * Number(course.credits),
    0,
  );

  return points / totalCredits;
}

export default function GradesPage() {
  const [semesters, setSemesters] = useState<GradeSemester[]>([]);
  const [courses, setCourses] = useState<GradeCourse[]>([]);
  const [semesterForm, setSemesterForm] = useState(EMPTY_SEMESTER);
  const [courseForm, setCourseForm] =
         useState<CourseForm>(EMPTY_COURSE);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [showSemesterForm, setShowSemesterForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const [semesterResult, courseResult] = await Promise.all([
      supabase
        .from("grade_semesters")
        .select("id, semester_name, year, semester_number, created_at")
        .order("year", { ascending: false })
        .order("semester_number", { ascending: false }),
      supabase
        .from("grade_courses")
        .select(
          "id, semester_id, course_name, category, credits, letter_grade, grade_point, is_major, memo, created_at",
        )
        .order("created_at", { ascending: false }),
    ]);

    if (semesterResult.error) {
      setMessage(`학기 정보를 불러오지 못했어요: ${semesterResult.error.message}`);
    }

    if (courseResult.error) {
      setMessage(`성적 정보를 불러오지 못했어요: ${courseResult.error.message}`);
    }

    const nextSemesters =
      (semesterResult.data ?? []) as GradeSemester[];
    const nextCourses =
      (courseResult.data ?? []) as GradeCourse[];

    setSemesters(nextSemesters);
    setCourses(nextCourses);

    if (!courseForm.semester_id && nextSemesters[0]) {
      setCourseForm((previous) => ({
        ...previous,
        semester_id: nextSemesters[0].id,
      }));
    }

    setLoading(false);
  }, [courseForm.semester_id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const cumulativeGpa = useMemo(
    () => calculateGpa(courses),
    [courses],
  );

  const totalCredits = useMemo(
    () => courses.reduce((sum, course) => sum + Number(course.credits), 0),
    [courses],
  );

  const majorGpa = useMemo(
    () => calculateGpa(courses.filter((course) => course.is_major)),
    [courses],
  );

  const semesterSummaries = useMemo(
    () =>
      semesters.map((semester) => {
        const semesterCourses = courses.filter(
          (course) => course.semester_id === semester.id,
        );

        return {
          ...semester,
          courses: semesterCourses,
          credits: semesterCourses.reduce(
            (sum, course) => sum + Number(course.credits),
            0,
          ),
          gpa: calculateGpa(semesterCourses),
          majorGpa: calculateGpa(
            semesterCourses.filter((course) => course.is_major),
          ),
        };
      }),
    [semesters, courses],
  );

  async function saveSemester(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("grade_semesters").insert({
      semester_name: semesterForm.semester_name.trim(),
      year: Number(semesterForm.year),
      semester_number: Number(semesterForm.semester_number),
    });

    if (error) {
      setMessage(`학기를 저장하지 못했어요: ${error.message}`);
    } else {
      setMessage("학기를 추가했어요.");
      setSemesterForm(EMPTY_SEMESTER);
      setShowSemesterForm(false);
      await loadData();
    }

    setSaving(false);
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!courseForm.semester_id) {
      setMessage("학기를 먼저 선택해 주세요.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      semester_id: courseForm.semester_id,
      course_name: courseForm.course_name.trim(),
      category: courseForm.category,
      credits: Number(courseForm.credits),
      letter_grade: courseForm.letter_grade,
      grade_point: GRADE_POINTS[courseForm.letter_grade],
      is_major: courseForm.is_major,
      memo: courseForm.memo.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = editingCourseId
      ? await supabase
          .from("grade_courses")
          .update(payload)
          .eq("id", editingCourseId)
      : await supabase.from("grade_courses").insert(payload);

    if (result.error) {
      setMessage(`성적을 저장하지 못했어요: ${result.error.message}`);
    } else {
      setMessage(editingCourseId ? "성적을 수정했어요." : "성적을 추가했어요.");
      setEditingCourseId(null);
      setCourseForm({
        ...EMPTY_COURSE,
        semester_id: semesters[0]?.id ?? "",
      });
      setShowCourseForm(false);
      await loadData();
    }

    setSaving(false);
  }

  function editCourse(course: GradeCourse) {
    setEditingCourseId(course.id);
    setCourseForm({
      semester_id: course.semester_id,
      course_name: course.course_name,
      category: course.category,
      credits: Number(course.credits),
      letter_grade: course.letter_grade,
      is_major: course.is_major,
      memo: course.memo ?? "",
    });
    setShowCourseForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteCourse(courseId: string) {
    if (!window.confirm("이 성적을 삭제할까요?")) return;

    const { error } = await supabase
      .from("grade_courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      setMessage(`성적을 삭제하지 못했어요: ${error.message}`);
      return;
    }

    setMessage("성적을 삭제했어요.");
    await loadData();
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">학점 정보를 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            GRADE MANAGER
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            학점 관리
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            4.3 만점 기준으로 학기별·누적 평점을 자동 계산해요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowSemesterForm((value) => !value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
          >
            + 학기 추가
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCourseId(null);
              setCourseForm({
                ...EMPTY_COURSE,
                semester_id: semesters[0]?.id ?? "",
              });
              setShowCourseForm(true);
            }}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            + 성적 입력
          </button>
        </div>
      </header>

      {message && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-semibold text-indigo-700">
          {message}
        </div>
      )}

      {showSemesterForm && (
        <form
          onSubmit={saveSemester}
          className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4"
        >
          <input
            required
            value={semesterForm.semester_name}
            onChange={(event) =>
              setSemesterForm((previous) => ({
                ...previous,
                semester_name: event.target.value,
              }))
            }
            placeholder="예: 2026-2학기"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            type="number"
            required
            value={semesterForm.year}
            onChange={(event) =>
              setSemesterForm((previous) => ({
                ...previous,
                year: Number(event.target.value),
              }))
            }
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <select
            value={semesterForm.semester_number}
            onChange={(event) =>
              setSemesterForm((previous) => ({
                ...previous,
                semester_number: Number(event.target.value),
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value={1}>1학기</option>
            <option value={2}>2학기</option>
            <option value={3}>여름학기</option>
            <option value={4}>겨울학기</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            학기 저장
          </button>
        </form>
      )}

      {showCourseForm && (
        <form
          onSubmit={saveCourse}
          className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2 xl:grid-cols-4"
        >
          <select
            required
            value={courseForm.semester_id}
            onChange={(event) =>
              setCourseForm((previous) => ({
                ...previous,
                semester_id: event.target.value,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="">학기 선택</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.semester_name}
              </option>
            ))}
          </select>

          <input
            required
            value={courseForm.course_name}
            onChange={(event) =>
              setCourseForm((previous) => ({
                ...previous,
                course_name: event.target.value,
              }))
            }
            placeholder="과목명"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <select
            value={courseForm.category}
            onChange={(event) => {
              const category = event.target.value as "전필" | "전선" | "부전" | "교필" | "교핵" | "기타";
              setCourseForm((previous) => ({
                ...previous,
                category,
                is_major: category === "전필" || 
                category === "전선" || 
                category === "부전",
              }));
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="전필">전공필수</option>
<option value="전선">전공선택</option>
<option value="부전">부전공</option>
<option value="교필">교양필수</option>
<option value="교핵">핵심교양</option>
<option value="일선">일반선택</option>
<option value="기타">기타</option>
          </select>

          <input
            type="number"
            min={0}
            step={0.5}
            required
            value={courseForm.credits}
            onChange={(event) =>
              setCourseForm((previous) => ({
                ...previous,
                credits: Number(event.target.value),
              }))
            }
            placeholder="학점"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <select
            value={courseForm.letter_grade}
            onChange={(event) =>
              setCourseForm((previous) => ({
                ...previous,
                letter_grade: event.target.value,
              }))
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            {Object.keys(GRADE_POINTS).map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          <input
            value={courseForm.memo}
            onChange={(event) =>
              setCourseForm((previous) => ({
                ...previous,
                memo: event.target.value,
              }))
            }
            placeholder="메모"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {editingCourseId ? "수정 완료" : "성적 저장"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCourseForm(false);
              setEditingCourseId(null);
            }}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
          >
            취소
          </button>
        </form>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["누적 평점", cumulativeGpa.toFixed(2)],
          ["전공 평점", majorGpa.toFixed(2)],
          ["총 이수학점", `${totalCredits}학점`],
          ["등록 과목", `${courses.length}개`],
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

      <section className="space-y-5">
        {semesterSummaries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              학기를 추가한 뒤 성적을 입력해 주세요.
            </p>
          </div>
        ) : (
          semesterSummaries.map((semester) => (
            <article
              key={semester.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {semester.semester_name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {semester.credits}학점 · 평점 {semester.gpa.toFixed(2)} · 전공{" "}
                    {semester.majorGpa.toFixed(2)}
                  </p>
                </div>
                <span className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
                  {semester.courses.length}과목
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {semester.courses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-400">
                          {course.category}
                        </p>
                        <h3 className="mt-1 font-bold text-slate-900">
                          {course.course_name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {course.credits}학점
                        </p>
                      </div>
                      <span className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                        {course.letter_grade}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => editCourse(course)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCourse(course.id)}
                        className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-500"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
