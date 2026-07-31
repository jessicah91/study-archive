type DashboardHeaderProps = {
  totalSubjects: number;
  totalMaterials: number;
  totalSummaries: number;
};

export default function DashboardHeader({
  totalSubjects,
  totalMaterials,
  totalSummaries,
}: DashboardHeaderProps) {
  const today = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <section className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 p-8 text-white shadow-lg">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-indigo-100">
            STUDY DASHBOARD
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            안녕하세요 👋
          </h1>

          <p className="mt-3 text-indigo-100">
            {today}
          </p>

          <p className="mt-6 max-w-xl leading-7 text-indigo-50">
            오늘도 차근차근 공부를 이어가 볼까요?
            업로드한 자료를 AI가 요약하고,
            퀴즈와 암기카드까지 자동으로 만들어드립니다.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
            <p className="text-xs text-indigo-100">
              과목
            </p>

            <p className="mt-2 text-3xl font-extrabold">
              {totalSubjects}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
            <p className="text-xs text-indigo-100">
              자료
            </p>

            <p className="mt-2 text-3xl font-extrabold">
              {totalMaterials}
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 p-5 backdrop-blur">
            <p className="text-xs text-indigo-100">
              AI요약
            </p>

            <p className="mt-2 text-3xl font-extrabold">
              {totalSummaries}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}