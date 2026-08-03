"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type QuizSet = {
  id: string;
  material_id: string;
  title: string;
  question_count: number;
  created_at: string;
};

type Material = {
  id: string;
  subject_id: string;
  week_id: string;
  original_name: string;
};

type Subject = {
  id: string;
  name: string;
};

type Week = {
  id: string;
  week_number: number;
  title: string;
};

type Attempt = {
  id: string;
  quiz_set_id: string;
  score: number;
  total_questions: number;
  created_at: string;
};

export default function QuizPage() {
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("전체");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const [quizResult, materialResult, subjectResult, weekResult, attemptResult] =
      await Promise.all([
        supabase
          .from("study_quiz_sets")
          .select("id, material_id, title, question_count, created_at")
          .order("created_at", { ascending: false }),

        supabase
          .from("study_materials")
          .select("id, subject_id, week_id, original_name"),

        supabase
          .from("study_subjects")
          .select("id, name"),

        supabase
          .from("study_weeks")
          .select("id, week_number, title"),

        supabase
          .from("study_quiz_attempts")
          .select("id, quiz_set_id, score, total_questions, created_at")
          .order("created_at", { ascending: false }),
      ]);

    const firstError =
      quizResult.error ??
      materialResult.error ??
      subjectResult.error ??
      weekResult.error ??
      attemptResult.error;

    if (firstError) {
      setMessage(`문제 기록을 불러오지 못했어요: ${firstError.message}`);
      setLoading(false);
      return;
    }

    setQuizSets((quizResult.data ?? []) as QuizSet[]);
    setMaterials((materialResult.data ?? []) as Material[]);
    setSubjects((subjectResult.data ?? []) as Subject[]);
    setWeeks((weekResult.data ?? []) as Week[]);
    setAttempts((attemptResult.data ?? []) as Attempt[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const materialMap = useMemo(
    () => new Map(materials.map((item) => [item.id, item])),
    [materials],
  );

  const subjectMap = useMemo(
    () => new Map(subjects.map((item) => [item.id, item.name])),
    [subjects],
  );

  const weekMap = useMemo(
    () => new Map(weeks.map((item) => [item.id, item])),
    [weeks],
  );

  const latestAttemptMap = useMemo(() => {
    const map = new Map<string, Attempt>();

    attempts.forEach((attempt) => {
      if (!map.has(attempt.quiz_set_id)) {
        map.set(attempt.quiz_set_id, attempt);
      }
    });

    return map;
  }, [attempts]);

  const subjectOptions = useMemo(() => {
    return ["전체", ...subjects.map((subject) => subject.name).sort()];
  }, [subjects]);

  const filteredQuizSets = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return quizSets.filter((quizSet) => {
      const material = materialMap.get(quizSet.material_id);
      const subjectName = material
        ? subjectMap.get(material.subject_id) ?? ""
        : "";

      const matchesSubject =
        selectedSubject === "전체" || subjectName === selectedSubject;

      const matchesKeyword =
        !keyword ||
        quizSet.title.toLowerCase().includes(keyword) ||
        material?.original_name.toLowerCase().includes(keyword) ||
        subjectName.toLowerCase().includes(keyword);

      return matchesSubject && matchesKeyword;
    });
  }, [
    quizSets,
    materialMap,
    subjectMap,
    selectedSubject,
    searchKeyword,
  ]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-500">생성된 문제를 불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7">
      <header>
        <p className="text-sm font-semibold tracking-[0.18em] text-indigo-600">
          STUDY QUIZ
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          문제 풀이
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          자료별로 생성한 문제와 최근 풀이 결과를 한곳에서 확인해요.
        </p>
      </header>

      {message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
          {message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">생성된 문제 세트</p>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {quizSets.length}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">총 문제 수</p>
          <p className="mt-3 text-2xl font-extrabold text-indigo-600">
            {quizSets.reduce((sum, item) => sum + item.question_count, 0)}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">풀이 기록</p>
          <p className="mt-3 text-2xl font-extrabold text-emerald-600">
            {attempts.length}회
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="과목, 자료명, 문제 세트 검색"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400"
          />

          <select
            value={selectedSubject}
            onChange={(event) => setSelectedSubject(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject === "전체" ? "전체 과목" : subject}
              </option>
            ))}
          </select>
        </div>
      </section>

      {filteredQuizSets.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="text-4xl">📝</div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">
            생성된 문제가 없어요.
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            과목의 자료 페이지에서 AI 문제를 먼저 생성해 주세요.
          </p>
          <Link
            href="/subjects"
            className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            과목으로 이동
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {filteredQuizSets.map((quizSet) => {
            const material = materialMap.get(quizSet.material_id);
            const subjectName = material
              ? subjectMap.get(material.subject_id) ?? "과목 정보 없음"
              : "과목 정보 없음";
            const week = material ? weekMap.get(material.week_id) : undefined;
            const latestAttempt = latestAttemptMap.get(quizSet.id);

            return (
              <article
                key={quizSet.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    {subjectName}
                  </span>
                  {week && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {week.week_number}주차
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-extrabold text-slate-900">
                  {quizSet.title}
                </h2>

                <p className="mt-2 truncate text-sm text-slate-500">
                  {material?.original_name ?? "자료 정보 없음"}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">문제 수</p>
                    <p className="mt-1 font-extrabold text-slate-900">
                      {quizSet.question_count}문제
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">최근 결과</p>
                    <p className="mt-1 font-extrabold text-slate-900">
                      {latestAttempt
                        ? `${latestAttempt.score}/${latestAttempt.total_questions}`
                        : "미응시"}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/materials/${quizSet.material_id}/quiz`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  문제 풀기
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
