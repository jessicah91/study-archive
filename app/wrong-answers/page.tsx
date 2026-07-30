import Link from "next/link";

type WrongAnswerItem = {
  id: number;
  question: string;
  subject: string;
  week: string;
  material: string;
  selectedAnswer: string;
  correctAnswer: string;
  explanation: string;
  mistakeType: "개념 부족" | "헷갈림" | "단순 실수";
  reviewCount: number;
  mastered: boolean;
};

const wrongAnswers: WrongAnswerItem[] = [
  {
    id: 1,
    question:
      "충칭 모델과 광둥 모델의 가장 큰 차이로 적절한 것은?",
    subject: "개발경제학",
    week: "1주차",
    material: "충칭 vs 광둥 개발 모델.pdf",
    selectedAnswer:
      "충칭 모델은 시장 개방을 중심으로 하고 광둥 모델은 국가 주도 개발을 중심으로 한다.",
    correctAnswer:
      "충칭 모델은 국가 주도와 공공성을 강조하고, 광둥 모델은 시장 중심과 대외 개방을 강조한다.",
    explanation:
      "충칭 모델은 국유기업과 공공주택, 사회정책을 강조하는 국가 주도형 모델이고, 광둥 모델은 수출·시장 중심의 성장 전략을 강조합니다.",
    mistakeType: "개념 부족",
    reviewCount: 1,
    mastered: false,
  },
  {
    id: 2,
    question:
      "Lewis 모형에서 전통 부문에 잉여노동이 존재할 때 나타나는 현상은?",
    subject: "개발경제학",
    week: "2주차",
    material: "Lewis 잉여노동 모형 강의자료.pdf",
    selectedAnswer:
      "노동자가 이동할수록 전통 부문의 생산량이 급격히 감소한다.",
    correctAnswer:
      "일정 수준까지 노동자가 이동해도 전통 부문의 총생산이 크게 감소하지 않는다.",
    explanation:
      "잉여노동이 존재하면 일부 노동자가 현대 부문으로 이동해도 전통 부문의 한계생산이 매우 낮기 때문에 총생산이 크게 줄지 않습니다.",
    mistakeType: "헷갈림",
    reviewCount: 2,
    mastered: false,
  },
  {
    id: 3,
    question:
      "공적개발원조의 기본 목적에 가장 가까운 것은?",
    subject: "국제개발협력",
    week: "3주차",
    material: "국제개발협력 발표 자료.pptx",
    selectedAnswer:
      "공여국 기업의 해외 진출 확대",
    correctAnswer:
      "개발도상국의 경제·사회 발전과 복지 증진",
    explanation:
      "공적개발원조는 개발도상국의 경제 발전과 사회복지 증진을 주된 목적으로 합니다.",
    mistakeType: "단순 실수",
    reviewCount: 3,
    mastered: true,
  },
];

const mistakeTypes = [
  {
    label: "개념 부족",
    count: 1,
    description: "핵심 개념을 충분히 이해하지 못한 문제",
  },
  {
    label: "헷갈림",
    count: 1,
    description: "비슷한 개념이나 선택지를 혼동한 문제",
  },
  {
    label: "단순 실수",
    count: 1,
    description: "문제를 잘못 읽거나 선택을 실수한 문제",
  },
];

function getMistakeTypeStyle(
  mistakeType: WrongAnswerItem["mistakeType"]
) {
  if (mistakeType === "개념 부족") {
    return "bg-rose-50 text-rose-700";
  }

  if (mistakeType === "헷갈림") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function WrongAnswersPage() {
  const activeWrongAnswers = wrongAnswers.filter(
    (item) => !item.mastered
  );

  const masteredCount = wrongAnswers.filter(
    (item) => item.mastered
  ).length;

  const totalReviewCount = wrongAnswers.reduce(
    (total, item) => total + item.reviewCount,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                취약 개념 복습
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                오답노트
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                틀린 문제와 헷갈린 개념을 다시 확인하고 반복해서
                복습해요.
              </p>
            </div>

            <Link
              href="/questions"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              문제풀이로 이동
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              복습할 오답
            </p>

            <p className="mt-2 text-3xl font-bold text-rose-500">
              {activeWrongAnswers.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              아직 학습 완료하지 않은 문제
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              학습 완료
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {masteredCount}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              반복 복습을 마친 문제
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              누적 복습
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {totalReviewCount}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              모든 오답의 복습 횟수
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              가장 많은 실수
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              개념 부족
            </p>

            <p className="mt-2 text-xs text-slate-400">
              최근 오답 기준
            </p>
          </article>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  복습할 문제
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  틀린 문제를 하나씩 다시 확인해요.
                </p>
              </div>

              <div className="flex gap-2">
                <select
                  disabled
                  aria-label="과목 필터"
                  className="cursor-not-allowed rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                >
                  <option>모든 과목</option>
                  <option>개발경제학</option>
                  <option>국제개발협력</option>
                  <option>중국경제</option>
                </select>

                <select
                  disabled
                  aria-label="실수 유형 필터"
                  className="cursor-not-allowed rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                >
                  <option>모든 유형</option>
                  <option>개념 부족</option>
                  <option>헷갈림</option>
                  <option>단순 실수</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              {wrongAnswers.map((item, index) => (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-5 ${
                    item.mastered
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {index + 1}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getMistakeTypeStyle(
                            item.mistakeType
                          )}`}
                        >
                          {item.mistakeType}
                        </span>

                        {item.mastered && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            학습 완료
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          복습 {item.reviewCount}회
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-bold leading-7 text-slate-900">
                        {item.question}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {item.subject} · {item.week}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {item.material}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <p className="text-xs font-bold text-rose-600">
                        내가 선택한 답
                      </p>

                      <p className="mt-2 text-sm leading-6 text-rose-900">
                        {item.selectedAnswer}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-bold text-emerald-600">
                        정답
                      </p>

                      <p className="mt-2 text-sm leading-6 text-emerald-900">
                        {item.correctAnswer}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-500">
                      해설
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.explanation}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-400"
                    >
                      다시 풀기
                    </button>

                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
                    >
                      비슷한 문제 만들기
                    </button>

                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
                    >
                      {item.mastered
                        ? "학습 완료 취소"
                        : "학습 완료"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                실수 유형
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                어떤 이유로 자주 틀리는지 확인해요.
              </p>

              <div className="mt-5 space-y-4">
                {mistakeTypes.map((type) => (
                  <article
                    key={type.label}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getMistakeTypeStyle(
                          type.label as WrongAnswerItem["mistakeType"]
                        )}`}
                      >
                        {type.label}
                      </span>

                      <span className="text-lg font-bold text-slate-900">
                        {type.count}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {type.description}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                오늘의 복습 추천
              </span>

              <h2 className="mt-4 text-xl font-bold">
                개발 모델 비교 개념을 다시 봐요
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                최근 문제에서 충칭 모델과 광둥 모델의 특징을
                혼동했어요.
              </p>

              <button
                type="button"
                disabled
                className="mt-6 w-full cursor-not-allowed rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-400"
              >
                추천 오답 복습
              </button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                복습 기준
              </h2>

              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    1
                  </span>

                  <p className="leading-6">
                    문제를 다시 풀고 정답을 확인해요.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    2
                  </span>

                  <p className="leading-6">
                    비슷한 문제를 연속으로 맞히면 학습 완료로
                    표시해요.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    3
                  </span>

                  <p className="leading-6">
                    일정 기간 후 다시 복습할 문제를 추천해요.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
          <p className="text-3xl">✍️</p>

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            실제 오답 저장 기능은 다음 단계에서 연결해요
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            문제풀이 결과를 Supabase에 저장한 뒤 틀린 문제를
            자동으로 이 화면에 추가하고, 다시 풀기와 학습 완료
            기능을 구현할 예정이에요.
          </p>
        </section>
      </div>
    </main>
  );
}