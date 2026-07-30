import Link from "next/link";

const upcomingExams = [
  {
    id: 1,
    subject: "개발경제학",
    examName: "중간고사",
    date: "2026-08-12",
    dDay: 14,
    progress: 35,
  },
  {
    id: 2,
    subject: "국제개발협력",
    examName: "기말고사",
    date: "2026-08-25",
    dDay: 27,
    progress: 10,
  },
];

const studyModes = [
  {
    title: "과목별 공부",
    description: "과목과 주차를 선택해 자료를 정리하고 공부해요.",
    icon: "📚",
    href: "/subjects",
    buttonText: "과목 선택하기",
  },
  {
    title: "AI 문제풀이",
    description: "업로드한 자료를 기반으로 AI 문제를 생성해요.",
    icon: "📝",
    href: "/questions",
    buttonText: "문제 풀러 가기",
  },
  {
    title: "오답노트",
    description: "틀린 문제와 헷갈린 개념을 다시 복습해요.",
    icon: "✍️",
    href: "/wrong-answers",
    buttonText: "오답 확인하기",
  },
  {
    title: "실전 시험",
    description: "시험 범위와 제한 시간을 설정해 실전처럼 풀어요.",
    icon: "⏱️",
    href: "#exam-mode",
    buttonText: "시험 만들기",
  },
];

const recentStudy = [
  {
    id: 1,
    title: "충칭 vs 광둥 개발 모델",
    subject: "개발경제학",
    type: "AI 문제풀이",
    result: "4 / 5",
    date: "오늘",
  },
  {
    id: 2,
    title: "Lewis 잉여노동 모형",
    subject: "개발경제학",
    type: "AI 요약",
    result: "요약 완료",
    date: "어제",
  },
];

export default function ExamsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                시험 대비
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                시험공부
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                시험 일정을 확인하고, 자료 요약부터 문제풀이까지 한곳에서
                준비해요.
              </p>
            </div>

            <Link
              href="/schedule"
              className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              시험 일정 관리
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">다가오는 시험</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {upcomingExams.length}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              등록된 시험 기준
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">가장 가까운 시험</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              D-{upcomingExams[0].dDay}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {upcomingExams[0].subject}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">최근 문제 정답률</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              80%
            </p>
            <p className="mt-2 text-xs text-slate-400">
              최근 문제풀이 기준
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">복습할 오답</p>
            <p className="mt-2 text-3xl font-bold text-rose-500">
              1
            </p>
            <p className="mt-2 text-xs text-slate-400">
              오답노트에 저장된 문제
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                다가오는 시험
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                시험일까지 남은 기간과 학습 진도를 확인해요.
              </p>
            </div>

            <Link
              href="/schedule"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              일정 전체 보기 →
            </Link>
          </div>

          {upcomingExams.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingExams.map((exam) => (
                <article
                  key={exam.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {exam.subject}
                      </span>

                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {exam.examName}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {exam.date}
                      </p>
                    </div>

                    <span className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white">
                      D-{exam.dDay}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        학습 진도
                      </span>
                      <span className="font-bold text-slate-700">
                        {exam.progress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{
                          width: `${exam.progress}%`,
                        }}
                      />
                    </div>
                  </div>

                  <Link
                    href="/subjects"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    공부 시작하기
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
              <p className="text-3xl">📅</p>
              <p className="mt-3 font-semibold text-slate-800">
                등록된 시험이 없어요.
              </p>
              <Link
                href="/schedule"
                className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                시험 등록하기
              </Link>
            </div>
          )}
        </section>

        <section className="mb-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              공부 방법 선택
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              필요한 방식으로 바로 학습을 시작해요.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {studyModes.map((mode) => (
              <article
                key={mode.title}
                className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  {mode.icon}
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {mode.title}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                  {mode.description}
                </p>

                <Link
                  href={mode.href}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {mode.buttonText}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section
          id="exam-mode"
          className="mb-8 overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                실전 시험 모드
              </span>

              <h2 className="mt-4 text-2xl font-bold">
                실제 시험처럼 연습해보세요
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                과목, 시험 범위, 문제 수와 제한 시간을 선택해 모의시험을
                만들 수 있어요. 세부 기능은 다음 개발 단계에서 연결됩니다.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="shrink-0 cursor-not-allowed rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-slate-400"
            >
              곧 사용 가능
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                최근 학습 기록
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                최근에 공부한 자료와 결과를 확인해요.
              </p>
            </div>

            <Link
              href="/subjects"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              모든 과목 보기 →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentStudy.map((study) => (
              <article
                key={study.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {study.type}
                    </span>

                    <span className="text-xs text-slate-400">
                      {study.date}
                    </span>
                  </div>

                  <h3 className="mt-2 font-bold text-slate-900">
                    {study.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {study.subject}
                  </p>
                </div>

                <span className="w-fit rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                  {study.result}
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}