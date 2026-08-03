import type { DashboardSchedule } from "@/app/page";

type DashboardStatsProps = {
  materials: number;
  summaries: number;
  weeks: number;
  subjects: number;
  schedules: DashboardSchedule[];
};

export default function DashboardStats({
  materials,
  summaries,
  weeks,
  subjects,
  schedules,
}: DashboardStatsProps) {
  const now = new Date();

  const upcomingExams = schedules.filter(
    (item) =>
      item.schedule_type === "시험" &&
      !item.completed &&
      new Date(`${item.due_date}T23:59:59`) >= now,
  ).length;

  const incompleteTasks = schedules.filter(
    (item) =>
      !item.completed &&
      item.schedule_type !== "시험",
  ).length;

  const cards = [
    {
      title: "등록 과목",
      value: subjects,
      icon: "📚",
    },
    {
      title: "등록 자료",
      value: materials,
      icon: "📄",
    },
    {
      title: "다가오는 시험",
      value: upcomingExams,
      icon: "📝",
    },
    {
      title: "남은 일정",
      value: incompleteTasks,
      icon: "📅",
    },
  ];

  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.title}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-3xl">
              {card.icon}
            </span>

            <p className="text-4xl font-extrabold text-slate-900">
              {card.value}
            </p>
          </div>

          <p className="mt-6 text-sm font-semibold text-slate-500">
            {card.title}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            주차 {weeks}개 · AI 분석 {summaries}개
          </p>
        </article>
      ))}
    </section>
  );
}
