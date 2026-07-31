type DashboardStatsProps = {
  materials: number;
  summaries: number;
  weeks: number;
  subjects: number;
};

export default function DashboardStats({
  materials,
  summaries,
  weeks,
  subjects,
}: DashboardStatsProps) {
  const cards = [
    {
      title: "등록 자료",
      value: materials,
      icon: "📄",
    },
    {
      title: "AI 요약",
      value: summaries,
      icon: "🤖",
    },
    {
      title: "등록 주차",
      value: weeks,
      icon: "📚",
    },
    {
      title: "등록 과목",
      value: subjects,
      icon: "🎓",
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
            <span className="text-3xl" aria-hidden="true">
              {card.icon}
            </span>

            <p className="text-4xl font-extrabold text-slate-900">
              {card.value}
            </p>
          </div>

          <p className="mt-6 text-sm font-semibold text-slate-500">
            {card.title}
          </p>
        </article>
      ))}
    </section>
  );
}