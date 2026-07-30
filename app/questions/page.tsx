import Link from "next/link";

type QuestionSet = {
  id: number;
  title: string;
  subject: string;
  week: string;
  material: string;
  questionCount: number;
  completedCount: number;
  score: number | null;
  type: "객관식" | "OX" | "단답형" | "혼합";
  status: "새 문제" | "풀이 중" | "완료";
};

const questionSets: QuestionSet[] = [
  {
    id: 1,
    title: "충칭·광둥 개발 모델 핵심 문제",
    subject: "개발경제학",
    week: "1주차",
    material: "충칭 vs 광둥 개발 모델.pdf",
    questionCount: 5,
    completedCount: 5,
    score: 80,
    type: "객관식",
    status: "완료",
  },
  {
    id: 2,
    title: "Lewis 잉여노동 모형 복습 문제",
    subject: "개발경제학",
    week: "2주차",
    material: "Lewis 잉여노동 모형 강의자료.pdf",
    questionCount: 10,
    completedCount: 4,
    score: null,
    type: "혼합",
    status: "풀이 중",
  },
  {
    id: 3,
    title: "국제개발협력 기본 개념 문제",
    subject: "국제개발협력",
    week: "3주차",
    material: "국제개발협력 발표 자료.pptx",
    questionCount: 8,
    completedCount: 0,
    score: null,
    type: "객관식",
    status: "새 문제",
  },
  {
    id: 4,
    title: "중국경제 개혁개방 OX 퀴즈",
    subject: "중국경제",
    week: "4주차",
    material: "중국경제 핵심 개념 정리.docx",
    questionCount: 12,
    completedCount: 12,
    score: 92,
    type: "OX",
    status: "완료",
  },
];

const subjects = [
  {
    name: "개발경제학",
    totalSets: 5,
    completedSets: 2,
    accuracy: 78,
  },
  {
    name: "국제개발협력",
    totalSets: 3,
    completedSets: 1,
    accuracy: 84,
  },
  {
    name: "중국경제",
    totalSets: 4,
    completedSets: 3,
    accuracy: 91,
  },
];

const questionTypes = [
  {
    title: "객관식",
    description: "4개의 선택지 중 정답을 골라요.",
    icon: "①",
  },
  {
    title: "OX 문제",
    description: "문장이 맞는지 틀리는지 판단해요.",
    icon: "○",
  },
  {
    title: "단답형",
    description: "핵심 개념이나 용어를 직접 입력해요.",
    icon: "✎",
  },
  {
    title: "혼합 문제",
    description: "여러 문제 유형을 섞어서 풀어요.",
    icon: "▦",
  },
];

function getStatusStyle(status: QuestionSet["status"]) {
  if (status === "완료") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "풀이 중") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-indigo-50 text-indigo-700";
}

function getActionText(status: QuestionSet["status"]) {
  if (status === "완료") {
    return "다시 풀기";
  }

  if (status === "풀이 중") {
    return "이어서 풀기";
  }

  return "문제 풀기";
}

export default function QuestionsPage() {
  const completedSets = questionSets.filter(
    (set) => set.status === "완료"
  ).length;

  const inProgressSets = questionSets.filter(
    (set) => set.status === "풀이 중"
  ).length;

  const completedScores = questionSets
    .map((set) => set.score)
    .filter((score): score is number => score !== null);

  const averageScore =
    completedScores.length > 0
      ? Math.round(
          completedScores.reduce(
            (total, score) => total + score,
            0
          ) / completedScores.length
        )
      : 0;

  const totalSolvedQuestions = questionSets.reduce(
    (total, set) => total + set.completedCount,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                AI 학습 문제
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                문제풀이
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                학습 자료에서 생성한 문제를 풀고 성적과 취약
                개념을 확인해요.
              </p>
            </div>

            <Link
              href="/subjects"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              + 새 문제 만들기
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              생성된 문제 세트
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {questionSets.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              모든 과목 기준
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              완료한 세트
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {completedSets}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              채점을 마친 문제
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              평균 정답률
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {averageScore}%
            </p>

            <p className="mt-2 text-xs text-slate-400">
              완료한 문제 기준
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              푼 문제
            </p>

            <p className="mt-2 text-3xl font-bold text-rose-500">
              {totalSolvedQuestions}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              누적 풀이 문항
            </p>
          </article>
        </section>

        {inProgressSets > 0 && (
          <section className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                  이어서 학습
                </span>

                <h2 className="mt-4 text-xl font-bold">
                  풀던 문제가 남아 있어요
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Lewis 잉여노동 모형 복습 문제를 4문제까지
                  풀었어요.
                </p>

                <div className="mt-4 h-2 max-w-md overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-indigo-400"
                    style={{
                      width: "40%",
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  4 / 10문제 완료
                </p>
              </div>

              <button
                type="button"
                disabled
                className="shrink-0 cursor-not-allowed rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-400 opacity-80"
              >
                이어서 풀기
              </button>
            </div>
          </section>
        )}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              문제 유형
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              원하는 문제 유형을 선택해 학습할 수 있어요.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {questionTypes.map((type) => (
              <article
                key={type.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-bold text-indigo-600 shadow-sm">
                  {type.icon}
                </div>

                <h3 className="mt-4 font-bold text-slate-900">
                  {type.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {type.description}
                </p>

                <button
                  type="button"
                  disabled
                  className="mt-5 w-full cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
                >
                  유형 선택
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  문제 세트
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  최근 생성된 문제부터 표시돼요.
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  disabled
                  aria-label="과목별 필터"
                  className="cursor-not-allowed rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                >
                  <option>모든 과목</option>
                  <option>개발경제학</option>
                  <option>국제개발협력</option>
                  <option>중국경제</option>
                </select>

                <select
                  disabled
                  aria-label="풀이 상태 필터"
                  className="cursor-not-allowed rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                >
                  <option>모든 상태</option>
                  <option>새 문제</option>
                  <option>풀이 중</option>
                  <option>완료</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {questionSets.map((set) => {
                const progress = Math.round(
                  (set.completedCount / set.questionCount) *
                    100
                );

                return (
                  <article
                    key={set.id}
                    className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/20"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              set.status
                            )}`}
                          >
                            {set.status}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {set.type}
                          </span>

                          <span className="text-xs text-slate-400">
                            {set.questionCount}문제
                          </span>
                        </div>

                        <h3 className="mt-3 break-words font-bold leading-6 text-slate-900">
                          {set.title}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          {set.subject} · {set.week}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {set.material}
                        </p>
                      </div>

                      {set.score !== null && (
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-xs text-slate-400">
                            최근 점수
                          </p>

                          <p className="mt-1 text-2xl font-bold text-indigo-600">
                            {set.score}점
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">
                          풀이 진도
                        </span>

                        <span className="font-bold text-slate-700">
                          {set.completedCount}/
                          {set.questionCount}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-400"
                      >
                        {getActionText(set.status)}
                      </button>

                      {set.status === "완료" && (
                        <Link
                          href="/wrong-answers"
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          오답 확인
                        </Link>
                      )}

                      <button
                        type="button"
                        disabled
                        className="cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
                      >
                        결과 보기
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                과목별 정답률
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                취약 과목을 확인해요.
              </p>

              <div className="mt-5 space-y-5">
                {subjects.map((subject) => (
                  <article key={subject.name}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {subject.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          완료 {subject.completedSets}/
                          {subject.totalSets}세트
                        </p>
                      </div>

                      <span className="text-sm font-bold text-indigo-600">
                        {subject.accuracy}%
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{
                          width: `${subject.accuracy}%`,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                오늘의 추천
              </span>

              <h2 className="mt-4 text-xl font-bold">
                개발경제학 오답을 복습해요
              </h2>

              <p className="mt-3 text-sm leading-6 text-indigo-100">
                최근 문제에서 개발 모델 비교 개념을 자주
                틀렸어요.
              </p>

              <Link
                href="/wrong-answers"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-700"
              >
                오답 복습하기
              </Link>
            </section>
          </aside>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
          <p className="text-3xl">📝</p>

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            실제 문제 기록은 다음 단계에서 연결해요
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            메뉴 화면을 모두 완성한 후 AI가 생성한 문제와
            사용자의 답안, 점수, 풀이 진도를 Supabase에
            저장해서 이 화면에 실제 기록을 표시할 예정이에요.
          </p>
        </section>
      </div>
    </main>
  );
}