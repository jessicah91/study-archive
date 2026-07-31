import Link from "next/link";

export default function QuizPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header>
        <p className="text-sm font-semibold tracking-[0.18em] text-indigo-600">
          STUDY QUIZ
        </p>

        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          문제 풀이
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          업로드한 학습 자료에서 생성한 문제를
          풀고 복습할 수 있어요.
        </p>
      </header>

      <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-2xl font-extrabold text-indigo-600">
          ?
        </div>

        <h2 className="mt-5 text-xl font-extrabold text-slate-900">
          아직 생성된 문제가 없어요.
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
          과목의 주차 페이지에서 자료를 업로드한
          뒤 AI 요약과 문제 생성을 진행해 주세요.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/subjects"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            과목으로 이동
          </Link>

          <Link
            href="/library"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            자료실 보기
          </Link>
        </div>
      </section>
    </div>
  );
}