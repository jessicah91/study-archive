import Link from "next/link";

type LibraryItem = {
  id: number;
  title: string;
  subject: string;
  week: string;
  fileType: "PDF" | "PPT" | "WORD" | "IMAGE";
  fileSize: string;
  uploadedAt: string;
  status: "요약 완료" | "텍스트 추출 완료" | "처리 대기";
  hasSummary: boolean;
  hasQuiz: boolean;
};

const libraryItems: LibraryItem[] = [
  {
    id: 1,
    title: "충칭 vs 광둥 개발 모델 총칭광둥 유산점.pdf",
    subject: "개발경제학",
    week: "1주차",
    fileType: "PDF",
    fileSize: "860.2KB",
    uploadedAt: "2026-07-29",
    status: "요약 완료",
    hasSummary: true,
    hasQuiz: true,
  },
  {
    id: 2,
    title: "Lewis 잉여노동 모형 강의자료.pdf",
    subject: "개발경제학",
    week: "2주차",
    fileType: "PDF",
    fileSize: "1.8MB",
    uploadedAt: "2026-07-27",
    status: "텍스트 추출 완료",
    hasSummary: false,
    hasQuiz: false,
  },
  {
    id: 3,
    title: "국제개발협력 발표 자료.pptx",
    subject: "국제개발협력",
    week: "3주차",
    fileType: "PPT",
    fileSize: "4.2MB",
    uploadedAt: "2026-07-25",
    status: "처리 대기",
    hasSummary: false,
    hasQuiz: false,
  },
  {
    id: 4,
    title: "중국경제 핵심 개념 정리.docx",
    subject: "중국경제",
    week: "4주차",
    fileType: "WORD",
    fileSize: "420KB",
    uploadedAt: "2026-07-22",
    status: "요약 완료",
    hasSummary: true,
    hasQuiz: false,
  },
];

const recentSubjects = [
  {
    name: "개발경제학",
    fileCount: 8,
    summaryCount: 5,
  },
  {
    name: "국제개발협력",
    fileCount: 5,
    summaryCount: 2,
  },
  {
    name: "중국경제",
    fileCount: 4,
    summaryCount: 3,
  },
];

function getFileTypeStyle(fileType: LibraryItem["fileType"]) {
  if (fileType === "PDF") {
    return "bg-rose-50 text-rose-700";
  }

  if (fileType === "PPT") {
    return "bg-orange-50 text-orange-700";
  }

  if (fileType === "WORD") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

function getStatusStyle(status: LibraryItem["status"]) {
  if (status === "요약 완료") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "텍스트 추출 완료") {
    return "bg-indigo-50 text-indigo-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function LibraryPage() {
  const summaryCompletedCount = libraryItems.filter(
    (item) => item.hasSummary
  ).length;

  const quizCreatedCount = libraryItems.filter(
    (item) => item.hasQuiz
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                학습 자료 관리
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                자료실
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                모든 과목의 학습 자료를 한곳에서 검색하고 관리해요.
              </p>
            </div>

            <Link
              href="/subjects"
              className="inline-flex w-fit items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              + 자료 업로드
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">전체 자료</p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {libraryItems.length}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              모든 과목의 업로드 자료
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">AI 요약 완료</p>

            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {summaryCompletedCount}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              요약을 생성한 자료
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">문제 생성 완료</p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {quizCreatedCount}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              문제풀이가 가능한 자료
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">사용한 저장공간</p>

            <p className="mt-2 text-3xl font-bold text-rose-500">
              7.3MB
            </p>

            <p className="mt-2 text-xs text-slate-400">
              임시 표시값
            </p>
          </article>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
            <div>
              <label
                htmlFor="library-search"
                className="sr-only"
              >
                자료 검색
              </label>

              <input
                id="library-search"
                type="search"
                disabled
                placeholder="파일명, 과목명으로 검색"
                className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
              />
            </div>

            <select
              disabled
              aria-label="과목 필터"
              className="cursor-not-allowed rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
            >
              <option>모든 과목</option>
              <option>개발경제학</option>
              <option>국제개발협력</option>
              <option>중국경제</option>
            </select>

            <select
              disabled
              aria-label="파일 형식 필터"
              className="cursor-not-allowed rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
            >
              <option>모든 파일</option>
              <option>PDF</option>
              <option>PPT</option>
              <option>WORD</option>
              <option>이미지</option>
            </select>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            검색과 필터 기능은 실제 자료 DB 연결 단계에서 활성화됩니다.
          </p>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  등록된 자료
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  최근 업로드한 순서로 표시돼요.
                </p>
              </div>

              <span className="text-sm font-medium text-slate-400">
                총 {libraryItems.length}개
              </span>
            </div>

            <div className="space-y-4">
              {libraryItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${getFileTypeStyle(
                            item.fileType
                          )}`}
                        >
                          {item.fileType}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>

                        {item.hasQuiz && (
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                            문제 생성 완료
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 break-words font-bold leading-6 text-slate-900">
                        {item.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>{item.subject}</span>
                        <span>·</span>
                        <span>{item.week}</span>
                        <span>·</span>
                        <span>{item.fileSize}</span>
                        <span>·</span>
                        <span>{item.uploadedAt}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled
                      className="shrink-0 cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-400"
                    >
                      더보기
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href="/subjects"
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      자료 열기
                    </Link>

                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-400"
                    >
                      AI 요약
                    </button>

                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-400"
                    >
                      문제 풀기
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                과목별 자료
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                과목별 등록 현황이에요.
              </p>

              <div className="mt-5 space-y-4">
                {recentSubjects.map((subject) => {
                  const summaryRate = Math.round(
                    (subject.summaryCount / subject.fileCount) * 100
                  );

                  return (
                    <article
                      key={subject.name}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900">
                          {subject.name}
                        </h3>

                        <span className="text-xs font-semibold text-slate-500">
                          {subject.fileCount}개
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{
                            width: `${summaryRate}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-400">
                        AI 요약 {subject.summaryCount}/
                        {subject.fileCount}
                      </p>
                    </article>
                  );
                })}
              </div>

              <Link
                href="/subjects"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                과목 전체 보기
              </Link>
            </section>

            <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                자료 활용 팁
              </span>

              <h2 className="mt-4 text-xl font-bold">
                자료만 쌓아두지 마세요
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                업로드한 자료에서 AI 요약을 만들고 문제까지 풀면 시험
                대비 효과를 높일 수 있어요.
              </p>

              <Link
                href="/subjects"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
              >
                공부 시작하기
              </Link>
            </section>
          </aside>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
          <p className="text-3xl">🗂️</p>

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            실제 업로드 자료 연결은 다음 단계에서 진행해요
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            메뉴 기본 화면을 모두 만든 후 Supabase의 학습 자료 테이블과
            연결해서 실제 파일 검색, 과목 필터, 삭제, 다운로드 및 자료별
            AI 기능 이동을 구현할 예정이에요.
          </p>
        </section>
      </div>
    </main>
  );
}