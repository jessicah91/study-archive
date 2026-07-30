"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

type StudyQuestion = {
  id: string;
  subject_name: string;
  question: string;
  answer: string;
  memo: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type QuestionForm = {
  subjectName: string;
  question: string;
  answer: string;
  memo: string;
  priority: string;
  status: string;
};

const initialForm: QuestionForm = {
  subjectName: "",
  question: "",
  answer: "",
  memo: "",
  priority: "보통",
  status: "미해결",
};

const priorities = ["낮음", "보통", "높음"];

const statuses = ["미해결", "확인 중", "해결 완료"];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getPriorityClasses(priority: string) {
  if (priority === "높음") {
    return "bg-red-50 text-red-600";
  }

  if (priority === "낮음") {
    return "bg-slate-100 text-slate-500";
  }

  return "bg-amber-50 text-amber-600";
}

function getStatusClasses(status: string) {
  if (status === "해결 완료") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "확인 중") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-rose-100 text-rose-700";
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<
    StudyQuestion[]
  >([]);

  const [form, setForm] =
    useState<QuestionForm>(initialForm);

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

  const [sortOption, setSortOption] =
    useState("최신순");

  const [message, setMessage] = useState("");

  const subjectOptions = useMemo(() => {
    const subjectNames = questions
      .map((item) => item.subject_name.trim())
      .filter(Boolean);

    return [
      "전체",
      ...Array.from(
        new Set(subjectNames),
      ).sort(),
    ];
  }, [questions]);

  const unresolvedCount = useMemo(() => {
    return questions.filter(
      (item) => item.status !== "해결 완료",
    ).length;
  }, [questions]);

  const completedCount = useMemo(() => {
    return questions.filter(
      (item) => item.status === "해결 완료",
    ).length;
  }, [questions]);

  const progressPercent = useMemo(() => {
    if (questions.length === 0) {
      return 0;
    }

    return Math.round(
      (completedCount / questions.length) * 100,
    );
  }, [completedCount, questions.length]);

  const filteredQuestions = useMemo(() => {
    const keyword =
      searchKeyword.trim().toLowerCase();

    const filtered = questions.filter(
      (item) => {
        const matchesKeyword =
          !keyword ||
          item.subject_name
            .toLowerCase()
            .includes(keyword) ||
          item.question
            .toLowerCase()
            .includes(keyword) ||
          item.answer
            .toLowerCase()
            .includes(keyword) ||
          item.memo
            .toLowerCase()
            .includes(keyword);

        const matchesSubject =
          selectedSubject === "전체" ||
          item.subject_name === selectedSubject;

        const matchesStatus =
          selectedStatus === "전체" ||
          item.status === selectedStatus;

        return (
          matchesKeyword &&
          matchesSubject &&
          matchesStatus
        );
      },
    );

    return [...filtered].sort((a, b) => {
      if (sortOption === "오래된순") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortOption === "중요도순") {
        const priorityOrder: Record<
          string,
          number
        > = {
          높음: 3,
          보통: 2,
          낮음: 1,
        };

        return (
          (priorityOrder[b.priority] ?? 0) -
          (priorityOrder[a.priority] ?? 0)
        );
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    questions,
    searchKeyword,
    selectedSubject,
    selectedStatus,
    sortOption,
  ]);

  const loadQuestions = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("study_questions")
        .select(
          "id, subject_name, question, answer, memo, priority, status, created_at, updated_at",
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "질문 불러오기 오류:",
          error,
        );

        setMessage(
          `질문을 불러오지 못했어요: ${error.message}`,
        );

        setIsLoading(false);
        return;
      }

      setQuestions(
        (data ?? []) as StudyQuestion[],
      );

      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  function updateForm(
    key: keyof QuestionForm,
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
    setMessage("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setForm(initialForm);
    setEditingId(null);
    setIsFormOpen(false);
  }

  function startEditing(
    item: StudyQuestion,
  ) {
    setEditingId(item.id);

    setForm({
      subjectName: item.subject_name,
      question: item.question,
      answer: item.answer,
      memo: item.memo,
      priority: item.priority,
      status: item.status,
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

    const subjectName =
      form.subjectName.trim();

    const question = form.question.trim();
    const answer = form.answer.trim();
    const memo = form.memo.trim();

    if (!question) {
      setMessage(
        "질문 내용을 입력해 주세요.",
      );

      return;
    }

    setIsSaving(true);
    setMessage("");

    const payload = {
      subject_name: subjectName,
      question,
      answer,
      memo,
      priority: form.priority,
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("study_questions")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error(
          "질문 수정 오류:",
          error,
        );

        setMessage(
          `질문을 수정하지 못했어요: ${error.message}`,
        );

        setIsSaving(false);
        return;
      }

      setMessage("질문이 수정되었어요.");
    } else {
      const { error } = await supabase
        .from("study_questions")
        .insert(payload);

      if (error) {
        console.error(
          "질문 저장 오류:",
          error,
        );

        setMessage(
          `질문을 저장하지 못했어요: ${error.message}`,
        );

        setIsSaving(false);
        return;
      }

      setMessage("새 질문이 저장되었어요.");
    }

    closeForm();
    await loadQuestions();
    setIsSaving(false);
  }

  async function updateStatus(
    item: StudyQuestion,
    status: string,
  ) {
    const { error } = await supabase
      .from("study_questions")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      console.error(
        "질문 상태 변경 오류:",
        error,
      );

      setMessage(
        `상태를 변경하지 못했어요: ${error.message}`,
      );

      return;
    }

    setQuestions((previous) =>
      previous.map((question) =>
        question.id === item.id
          ? {
              ...question,
              status,
              updated_at:
                new Date().toISOString(),
            }
          : question,
      ),
    );

    setMessage(
      `질문 상태가 '${status}'로 변경되었어요.`,
    );
  }

  async function deleteQuestion(
    itemId: string,
  ) {
    const shouldDelete = window.confirm(
      "이 질문을 삭제할까요?",
    );

    if (!shouldDelete) {
      return;
    }

    const { error } = await supabase
      .from("study_questions")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error(
        "질문 삭제 오류:",
        error,
      );

      setMessage(
        `질문을 삭제하지 못했어요: ${error.message}`,
      );

      return;
    }

    setQuestions((previous) =>
      previous.filter(
        (item) => item.id !== itemId,
      ),
    );

    setMessage("질문이 삭제되었어요.");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            질문을 불러오는 중이에요.
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
            STUDY QUESTIONS
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            질문 모음
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            공부하다 생긴 질문을 저장하고 답변과
            해결 상태를 관리해 보세요.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="self-start rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 lg:self-auto"
        >
          + 질문 추가
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
                  ? "질문 수정"
                  : "새 질문 추가"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                답을 아직 모른다면 질문만 먼저
                저장해도 돼요.
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
            <div className="grid gap-5 md:grid-cols-3">
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
                  중요도
                </span>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    updateForm(
                      "priority",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  {priorities.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  상태
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      "status",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  {statuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                질문
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
                placeholder="공부하다 궁금했던 내용을 입력하세요."
                className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                답변
              </span>

              <textarea
                value={form.answer}
                onChange={(event) =>
                  updateForm(
                    "answer",
                    event.target.value,
                  )
                }
                rows={6}
                placeholder="찾아본 답이나 교수님께 들은 설명을 입력하세요."
                className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                추가 메모
              </span>

              <textarea
                value={form.memo}
                onChange={(event) =>
                  updateForm(
                    "memo",
                    event.target.value,
                  )
                }
                rows={3}
                placeholder="관련 페이지, 강의 주차, 다시 확인할 내용 등을 적어보세요."
                className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
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
                    : "질문 저장"}
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
            전체 질문
          </p>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {questions.length}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            미해결 질문
          </p>

          <p className="mt-3 text-2xl font-extrabold text-rose-600">
            {unresolvedCount}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            해결률
          </p>

          <p className="mt-3 text-2xl font-extrabold text-indigo-600">
            {progressPercent}%
          </p>
        </article>
      </section>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-700">
            질문 해결 진행률
          </p>

          <p className="text-sm font-extrabold text-indigo-600">
            {completedCount} / {questions.length}
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
        <div className="grid gap-3 lg:grid-cols-[1fr_200px_180px_160px]">
          <input
            value={searchKeyword}
            onChange={(event) =>
              setSearchKeyword(
                event.target.value,
              )
            }
            placeholder="과목, 질문, 답변, 메모 검색"
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

            {statuses.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(event) =>
              setSortOption(event.target.value)
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="최신순">
              최신순
            </option>

            <option value="오래된순">
              오래된순
            </option>

            <option value="중요도순">
              중요도순
            </option>
          </select>
        </div>
      </section>

      <section className="mt-6">
        {filteredQuestions.length > 0 ? (
          <div className="space-y-4">
            {filteredQuestions.map((item) => (
              <article
                key={item.id}
                className={[
                  "rounded-3xl border bg-white p-6 shadow-sm",
                  item.status === "해결 완료"
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

                    <span
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-bold",
                        getPriorityClasses(
                          item.priority,
                        ),
                      ].join(" ")}
                    >
                      중요도 {item.priority}
                    </span>

                    <span
                      className={[
                        "rounded-full px-3 py-1.5 text-xs font-bold",
                        getStatusClasses(
                          item.status,
                        ),
                      ].join(" ")}
                    >
                      {item.status}
                    </span>
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

                <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <p className="text-xs font-extrabold tracking-wide text-indigo-600">
                    ANSWER
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {item.answer ||
                      "아직 등록된 답변이 없어요."}
                  </p>
                </div>

                {item.memo && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-extrabold tracking-wide text-slate-500">
                      추가 메모
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {item.memo}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  {item.status !==
                    "해결 완료" && (
                    <button
                      type="button"
                      onClick={() =>
                        void updateStatus(
                          item,
                          "해결 완료",
                        )
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      해결 완료
                    </button>
                  )}

                  {item.status === "미해결" && (
                    <button
                      type="button"
                      onClick={() =>
                        void updateStatus(
                          item,
                          "확인 중",
                        )
                      }
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      확인 중으로 변경
                    </button>
                  )}

                  {item.status ===
                    "해결 완료" && (
                    <button
                      type="button"
                      onClick={() =>
                        void updateStatus(
                          item,
                          "미해결",
                        )
                      }
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      다시 확인하기
                    </button>
                  )}

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
                      void deleteQuestion(
                        item.id,
                      )
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
              표시할 질문이 없어요.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              새 질문을 추가하거나 검색 조건을
              변경해 보세요.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              첫 질문 추가하기
            </button>
          </div>
        )}
      </section>
    </div>
  );
}