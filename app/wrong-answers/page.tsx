"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type WrongAnswer = {
  id: string;
  subject_name: string;
  question: string;
  wrong_answer: string;
  correct_answer: string;
  explanation: string;
  difficulty: string;
  is_mastered: boolean;
  created_at: string;
};

type WrongAnswerForm = {
  subjectName: string;
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  explanation: string;
  difficulty: string;
};

const initialForm: WrongAnswerForm = {
  subjectName: "",
  question: "",
  wrongAnswer: "",
  correctAnswer: "",
  explanation: "",
  difficulty: "보통",
};

const difficulties = ["쉬움", "보통", "어려움"];

export default function WrongAnswersPage() {
  const [items, setItems] = useState<WrongAnswer[]>([]);
  const [form, setForm] =
    useState<WrongAnswerForm>(initialForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [searchKeyword, setSearchKeyword] =
    useState("");

  const [selectedSubject, setSelectedSubject] =
    useState("전체");

  const [selectedStatus, setSelectedStatus] =
    useState("전체");

  const [message, setMessage] = useState("");

  const subjectOptions = useMemo(() => {
    const names = items
      .map((item) => item.subject_name.trim())
      .filter(Boolean);

    return [
      "전체",
      ...Array.from(new Set(names)).sort(),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword =
      searchKeyword.trim().toLowerCase();

    return items.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.subject_name
          .toLowerCase()
          .includes(keyword) ||
        item.question.toLowerCase().includes(keyword) ||
        item.correct_answer
          .toLowerCase()
          .includes(keyword) ||
        item.explanation
          .toLowerCase()
          .includes(keyword);

      const matchesSubject =
        selectedSubject === "전체" ||
        item.subject_name === selectedSubject;

      const matchesStatus =
        selectedStatus === "전체" ||
        (selectedStatus === "암기 완료" &&
          item.is_mastered) ||
        (selectedStatus === "학습 중" &&
          !item.is_mastered);

      return (
        matchesKeyword &&
        matchesSubject &&
        matchesStatus
      );
    });
  }, [
    items,
    searchKeyword,
    selectedSubject,
    selectedStatus,
  ]);

  const masteredCount = useMemo(() => {
    return items.filter(
      (item) => item.is_mastered,
    ).length;
  }, [items]);

  const progressPercent = useMemo(() => {
    if (items.length === 0) {
      return 0;
    }

    return Math.round(
      (masteredCount / items.length) * 100,
    );
  }, [items.length, masteredCount]);

  const loadWrongAnswers = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("study_wrong_answers")
      .select(
        "id, subject_name, question, wrong_answer, correct_answer, explanation, difficulty, is_mastered, created_at",
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "오답노트 불러오기 오류:",
        error,
      );

      setMessage(
        `오답노트를 불러오지 못했어요: ${error.message}`,
      );

      setIsLoading(false);
      return;
    }

    setItems((data ?? []) as WrongAnswer[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadWrongAnswers();
  }, [loadWrongAnswers]);

  function updateForm(
    key: keyof WrongAnswerForm,
    value: string,
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function openCreateForm() {
    setForm(initialForm);
    setEditingId(null);
    setIsFormOpen(true);
    setMessage("");
  }

  function closeForm() {
    setForm(initialForm);
    setEditingId(null);
    setIsFormOpen(false);
  }

  function startEditing(item: WrongAnswer) {
    setEditingId(item.id);

    setForm({
      subjectName: item.subject_name,
      question: item.question,
      wrongAnswer: item.wrong_answer,
      correctAnswer: item.correct_answer,
      explanation: item.explanation,
      difficulty: item.difficulty,
    });

    setIsFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const subjectName = form.subjectName.trim();
    const question = form.question.trim();
    const wrongAnswer = form.wrongAnswer.trim();
    const correctAnswer =
      form.correctAnswer.trim();
    const explanation = form.explanation.trim();

    if (!question || !correctAnswer) {
      setMessage(
        "문제와 정답은 반드시 입력해 주세요.",
      );

      return;
    }

    setIsSaving(true);
    setMessage("");

    const payload = {
      subject_name: subjectName,
      question,
      wrong_answer: wrongAnswer,
      correct_answer: correctAnswer,
      explanation,
      difficulty: form.difficulty,
    };

    if (editingId) {
      const { error } = await supabase
        .from("study_wrong_answers")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("오답 수정 오류:", error);

        setMessage(
          `오답을 수정하지 못했어요: ${error.message}`,
        );

        setIsSaving(false);
        return;
      }

      setMessage("오답이 수정되었어요.");
    } else {
      const { error } = await supabase
        .from("study_wrong_answers")
        .insert(payload);

      if (error) {
        console.error("오답 추가 오류:", error);

        setMessage(
          `오답을 추가하지 못했어요: ${error.message}`,
        );

        setIsSaving(false);
        return;
      }

      setMessage("새 오답이 추가되었어요.");
    }

    closeForm();
    await loadWrongAnswers();
    setIsSaving(false);
  }

  async function toggleMastered(item: WrongAnswer) {
    const { error } = await supabase
      .from("study_wrong_answers")
      .update({
        is_mastered: !item.is_mastered,
      })
      .eq("id", item.id);

    if (error) {
      console.error(
        "암기 상태 변경 오류:",
        error,
      );

      setMessage(
        `암기 상태를 변경하지 못했어요: ${error.message}`,
      );

      return;
    }

    setItems((previous) =>
      previous.map((current) =>
        current.id === item.id
          ? {
              ...current,
              is_mastered:
                !current.is_mastered,
            }
          : current,
      ),
    );
  }

  async function deleteItem(itemId: string) {
    const shouldDelete = window.confirm(
      "이 오답을 삭제할까요?",
    );

    if (!shouldDelete) {
      return;
    }

    const { error } = await supabase
      .from("study_wrong_answers")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("오답 삭제 오류:", error);

      setMessage(
        `오답을 삭제하지 못했어요: ${error.message}`,
      );

      return;
    }

    setItems((previous) =>
      previous.filter(
        (item) => item.id !== itemId,
      ),
    );

    setMessage("오답이 삭제되었어요.");
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            오답노트를 불러오는 중이에요.
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
            WRONG ANSWERS
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            오답노트
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            틀린 문제와 정답, 해설을 기록하고
            반복해서 복습해 보세요.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="self-start rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 lg:self-auto"
        >
          + 오답 추가
        </button>
      </header>

      {message && (
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-semibold text-indigo-700">
          {message}
        </div>
      )}

      {isFormOpen && (
        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {editingId
                  ? "오답 수정"
                  : "새 오답 추가"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                문제와 정답을 중심으로 입력하면
                나중에 검색해서 복습할 수 있어요.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              aria-label="입력창 닫기"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-50"
            >
              ×
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  과목
                </span>

                <input
                  value={form.subjectName}
                  onChange={(event) =>
                    updateForm(
                      "subjectName",
                      event.target.value,
                    )
                  }
                  placeholder="예: 개발경제학"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  난이도
                </span>

                <select
                  value={form.difficulty}
                  onChange={(event) =>
                    updateForm(
                      "difficulty",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  {difficulties.map(
                    (difficulty) => (
                      <option
                        key={difficulty}
                        value={difficulty}
                      >
                        {difficulty}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                문제
              </span>

              <textarea
                value={form.question}
                onChange={(event) =>
                  updateForm(
                    "question",
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="틀린 문제를 입력하세요."
                className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <div className="grid gap-5 lg:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  내가 쓴 답
                </span>

                <textarea
                  value={form.wrongAnswer}
                  onChange={(event) =>
                    updateForm(
                      "wrongAnswer",
                      event.target.value,
                    )
                  }
                  rows={4}
                  placeholder="내가 잘못 적었던 답"
                  className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  정답
                </span>

                <textarea
                  value={form.correctAnswer}
                  onChange={(event) =>
                    updateForm(
                      "correctAnswer",
                      event.target.value,
                    )
                  }
                  rows={4}
                  placeholder="정확한 정답을 입력하세요."
                  className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                해설과 틀린 이유
              </span>

              <textarea
                value={form.explanation}
                onChange={(event) =>
                  updateForm(
                    "explanation",
                    event.target.value,
                  )
                }
                rows={5}
                placeholder="왜 틀렸는지, 다음에는 무엇을 확인해야 하는지 적어보세요."
                className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
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
                    : "오답 저장"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                취소
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            전체 오답
          </p>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {items.length}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            암기 완료
          </p>

          <p className="mt-3 text-2xl font-extrabold text-emerald-600">
            {masteredCount}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            복습 진행률
          </p>

          <p className="mt-3 text-2xl font-extrabold text-indigo-600">
            {progressPercent}%
          </p>
        </article>
      </section>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-700">
            전체 복습 진행률
          </p>

          <p className="text-sm font-extrabold text-indigo-600">
            {masteredCount} / {items.length}
          </p>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </section>

      <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
          <input
            value={searchKeyword}
            onChange={(event) =>
              setSearchKeyword(
                event.target.value,
              )
            }
            placeholder="과목, 문제, 정답, 해설 검색"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />

          <select
            value={selectedSubject}
            onChange={(event) =>
              setSelectedSubject(
                event.target.value,
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            {subjectOptions.map((subject) => (
              <option
                key={subject}
                value={subject}
              >
                {subject === "전체"
                  ? "전체 과목"
                  : subject}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(
                event.target.value,
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="전체">
              전체 상태
            </option>

            <option value="학습 중">
              학습 중
            </option>

            <option value="암기 완료">
              암기 완료
            </option>
          </select>
        </div>
      </section>

      <section className="mt-6">
        {filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className={[
                  "rounded-3xl border bg-white p-6 shadow-sm",
                  item.is_mastered
                    ? "border-emerald-200"
                    : "border-slate-200",
                ].join(" ")}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.subject_name && (
                      <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">
                        {item.subject_name}
                      </span>
                    )}

                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                      난이도 {item.difficulty}
                    </span>

                    {item.is_mastered && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        암기 완료
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-400">
                    {formatDate(item.created_at)}
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-extrabold tracking-[0.16em] text-slate-400">
                    QUESTION
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-lg font-extrabold leading-8 text-slate-900">
                    {item.question}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                    <p className="text-xs font-extrabold tracking-wide text-red-500">
                      내가 쓴 답
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-red-800">
                      {item.wrong_answer ||
                        "입력한 답이 없어요."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="text-xs font-extrabold tracking-wide text-emerald-600">
                      정답
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-emerald-900">
                      {item.correct_answer}
                    </p>
                  </div>
                </div>

                {item.explanation && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-extrabold tracking-wide text-slate-500">
                      해설과 틀린 이유
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {item.explanation}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void toggleMastered(item)
                    }
                    className={[
                      "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                      item.is_mastered
                        ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-emerald-600 text-white hover:bg-emerald-500",
                    ].join(" ")}
                  >
                    {item.is_mastered
                      ? "다시 학습하기"
                      : "암기 완료"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      startEditing(item)
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void deleteItem(item.id)
                    }
                    className="rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-bold text-slate-700">
              표시할 오답이 없어요.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              새 오답을 추가하거나 검색 조건을
              변경해 보세요.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              첫 오답 추가하기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}