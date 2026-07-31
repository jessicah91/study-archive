import Link from "next/link";

type TodayTasksProps = {
  subjectsCount: number;
  materialsCount: number;
  summariesCount: number;
};

type TaskItem = {
  title: string;
  description: string;
  href: string;
  completed: boolean;
};

export default function TodayTasks({
  subjectsCount,
  materialsCount,
  summariesCount,
}: TodayTasksProps) {
  const tasks: TaskItem[] = [
    {
      title: "과목 등록하기",
      description: "공부할 과목과 기본 정보를 등록해요.",
      href: "/subjects",
      completed: subjectsCount > 0,
    },
    {
      title: "학습 자료 업로드하기",
      description: "강의 PDF나 필기 자료를 등록해요.",
      href: "/subjects",
      completed: materialsCount > 0,
    },
    {
      title: "AI 요약 생성하기",
      description: "업로드한 자료를 시험 대비용으로 정리해요.",
      href: "/library",
      completed:
        materialsCount > 0 &&
        summariesCount >= materialsCount,
    },
    {
      title: "복습 문제 풀기",
      description: "요약한 내용을 객관식 문제로 복습해요.",
      href: "/quiz",
      completed: false,
    },
  ];

  const completedCount = tasks.filter(
    (task) => task.completed,
  ).length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            TODAY
          </p>

          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            오늘 할 일
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {completedCount}/{tasks.length}개 완료
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-extrabold text-indigo-600">
          {completedCount}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {tasks.map((task) => (
          <Link
            key={task.title}
            href={task.href}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
          >
            <span
              className={[
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold",
                task.completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-slate-300 text-transparent",
              ].join(" ")}
            >
              ✓
            </span>

            <div className="min-w-0">
              <p
                className={[
                  "text-sm font-bold",
                  task.completed
                    ? "text-slate-400 line-through"
                    : "text-slate-800",
                ].join(" ")}
              >
                {task.title}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                {task.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}