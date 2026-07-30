const modelOptions = [
  {
    id: "gpt-5-mini",
    name: "GPT-5 mini",
    description: "빠르고 비용이 적게 드는 기본 모델",
    recommended: true,
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    description: "더 깊은 분석과 고품질 요약에 적합",
    recommended: false,
  },
];

const notificationOptions = [
  {
    title: "과제 마감 알림",
    description: "과제 마감일이 가까워지면 알려줘요.",
    enabled: true,
  },
  {
    title: "시험 일정 알림",
    description: "시험 D-day와 복습 계획을 알려줘요.",
    enabled: true,
  },
  {
    title: "주간 학습 리포트",
    description: "매주 공부량과 정답률을 요약해요.",
    enabled: false,
  },
  {
    title: "오답 복습 알림",
    description: "복습할 오답이 쌓이면 알려줘요.",
    enabled: true,
  },
];

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">
            앱 환경 관리
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            설정
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            프로필, AI 모델, 알림과 외부 서비스 연결을 관리해요.
          </p>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
                황
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  황지원
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  개인 학습 계정
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-fit cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
            >
              프로필 수정
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              AI 설정
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              요약, 문제 생성과 학습 분석에 사용할 모델을 선택해요.
            </p>
          </div>

          <div className="space-y-4">
            {modelOptions.map((model) => (
              <article
                key={model.id}
                className={`rounded-2xl border p-5 ${
                  model.recommended
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {model.name}
                      </h3>

                      {model.recommended && (
                        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                          현재 사용 중
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {model.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-fit cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-400"
                  >
                    {model.recommended ? "선택됨" : "선택"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              현재 환경변수
            </p>

            <code className="mt-2 block text-xs text-slate-500">
              OPENAI_MODEL=gpt-5-mini
            </code>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              외부 서비스 연결
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              일정과 파일을 외부 서비스와 연결할 수 있어요.
            </p>
          </div>

          <div className="space-y-4">
            <article className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    📅
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Google Calendar
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      시험과 과제 일정을 구글 캘린더와 동기화해요.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-fit cursor-not-allowed rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white opacity-60"
                >
                  연결 준비 중
                </button>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                    🗂️
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Google Drive
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      학습 자료를 드라이브에서 가져오는 기능이에요.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-fit cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
                >
                  추후 지원
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              알림 설정
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              중요한 시험과 과제 일정을 놓치지 않도록 설정해요.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {notificationOptions.map((option) => (
              <article
                key={option.title}
                className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {option.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {option.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  aria-label={`${option.title} 설정`}
                  className={`relative h-7 w-12 shrink-0 cursor-not-allowed rounded-full transition ${
                    option.enabled
                      ? "bg-indigo-600"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      option.enabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              화면 설정
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              앱 화면과 표시 방식을 관리해요.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-indigo-300 bg-indigo-50 p-5">
              <span className="text-sm font-bold text-indigo-700">
                라이트 모드
              </span>

              <p className="mt-2 text-sm text-slate-600">
                밝은 배경의 기본 화면
              </p>

              <button
                type="button"
                disabled
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white opacity-70"
              >
                사용 중
              </button>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <span className="text-sm font-bold text-slate-700">
                다크 모드
              </span>

              <p className="mt-2 text-sm text-slate-500">
                어두운 배경의 집중 화면
              </p>

              <button
                type="button"
                disabled
                className="mt-4 cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-400"
              >
                추후 지원
              </button>
            </article>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            데이터 관리
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            저장된 학습 데이터와 계정을 관리해요.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-400"
            >
              학습 데이터 내보내기
            </button>

            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-300"
            >
              모든 데이터 삭제
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
          <p className="text-3xl">⚙️</p>

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            설정 저장 기능은 다음 단계에서 연결해요
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            메뉴 기본 화면을 모두 완성한 뒤 프로필, AI 모델,
            알림 설정과 Google Calendar 연결 정보를
            Supabase에 저장하도록 구현할 예정이에요.
          </p>
        </section>
      </div>
    </main>
  );
}