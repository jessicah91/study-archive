import Link from "next/link";

const upcomingTasks = [
  {
    id: 1,
    type: "과제",
    title: "개발경제학 리딩리포트",
    subject: "개발경제학",
    dueDate: "2026-08-03",
    dDay: 4,
    priority: "높음",
    completed: false,
  },
  {
    id: 2,
    type: "시험",
    title: "개발경제학 중간고사",
    subject: "개발경제학",
    dueDate: "2026-08-12",
    dDay: 13,
    priority: "높음",
    completed: false,
  },
  {
    id: 3,
    type: "발표",
    title: "국제개발협력 팀 발표",
    subject: "국제개발협력",
    dueDate: "2026-08-18",
    dDay: 19,
    priority: "보통",
    completed: false,
  },
];

const weekDays = [
  {
    day: "월",
    date: "27",
    events: ["개발경제학 복습"],
  },
  {
    day: "화",
    date: "28",
    events: ["리딩리포트 작성"],
  },
  {
    day: "수",
    date: "29",
    events: ["AI 문제풀이"],
  },
  {
    day: "목",
    date: "30",
    events: ["팀 발표 준비"],
    active: true,
  },
  {
    day: "금",
    date: "31",
    events: ["중국경제 3주차"],
  },
  {
    day: "토",
    date: "1",
    events: [],
  },
  {
    day: "일",
    date: "2",
    events: ["주간 복습"],
  },
];

const summaryCards = [
  {
    label: "이번 주 일정",
    value: "7",
    description: "학습·과제·시험 포함",
  },
  {
    label: "마감 임박",
    value: "1",
    description: "3일 이내 일정",
  },
  {
    label: "완료한 과제",
    value: "3",
    description: "이번 달 기준",
  },
  {
    label: "다가오는 시험",
    value: "2",
    description: "등록된 시험",
  },
];

function getTypeStyle(type: string) {
  if (type === "시험") {
    return "bg-rose-50 text-rose-700";
  }

  if (type === "과제") {
    return "bg-indigo-50 text-indigo-700";
  }

  return "bg-amber-50 text-amber-700";
}

function getPriorityStyle(priority: string) {
  if (priority === "높음") {
    return "bg-rose-50 text-rose-600";
  }

  return "bg-slate-100 text-slate-600";
}

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                학업 일정 관리
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                일정·과제
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                시험, 과제, 발표와 공부 계획을 한곳에서 관리해요.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="inline-flex w-fit cursor-not-allowed items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white opacity-60"
            >
              + 일정 추가
            </button>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{card.label}</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {card.value}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                이번 주
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                2026년 7월 27일 – 8월 2일
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-400"
              >
                ←
              </button>

              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-400"
              >
                오늘
              </button>

              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-400"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {weekDays.map((day) => (
              <article
                key={`${day.day}-${day.date}`}
                className={`min-h-36 rounded-2xl border p-4 ${
                  day.active
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      day.active
                        ? "text-indigo-700"
                        : "text-slate-500"
                    }`}
                  >
                    {day.day}
                  </span>

                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      day.active
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    {day.date}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {day.events.length > 0 ? (
                    day.events.map((event) => (
                      <div
                        key={event}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-medium leading-5 text-slate-700 shadow-sm"
                      >
                        {event}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-300">
                      등록된 일정 없음
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  다가오는 일정
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  가까운 마감 순서로 확인해요.
                </p>
              </div>

              <button
                type="button"
                disabled
                className="cursor-not-allowed text-sm font-semibold text-slate-400"
              >
                전체 보기 →
              </button>
            </div>

            <div className="space-y-4">
              {upcomingTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getTypeStyle(
                            task.type
                          )}`}
                        >
                          {task.type}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                            task.priority
                          )}`}
                        >
                          중요도 {task.priority}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-slate-900">
                        {task.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {task.subject}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        마감 {task.dueDate}
                      </p>
                    </div>

                    <span className="w-fit rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                      D-{task.dDay}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-400"
                    >
                      완료 처리
                    </button>

                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400"
                    >
                      수정
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                가장 가까운 마감
              </span>

              <p className="mt-5 text-sm text-slate-300">
                개발경제학
              </p>

              <h2 className="mt-2 text-xl font-bold">
                리딩리포트
              </h2>

              <p className="mt-4 text-4xl font-bold">
                D-4
              </p>

              <p className="mt-3 text-sm text-slate-300">
                2026년 8월 3일까지
              </p>

              <Link
                href="/subjects"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
              >
                관련 과목 공부하기
              </Link>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                일정 분류
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-3 w-3 rounded-full bg-indigo-500" />
                    과제
                  </span>

                  <span className="font-bold text-slate-900">
                    3
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                    시험
                  </span>

                  <span className="font-bold text-slate-900">
                    2
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    발표
                  </span>

                  <span className="font-bold text-slate-900">
                    2
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
          <p className="text-3xl">📅</p>

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            일정 등록 기능은 다음 단계에서 연결해요
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            메뉴 화면을 모두 완성한 뒤 Supabase를 연결해서 일정 추가,
            수정, 완료 처리와 실제 D-day 계산을 구현할 예정이에요.
          </p>
        </section>
      </div>
    </main>
  );
}