import Link from "next/link";

type DashboardSchedule = {
  id: string;
  subject_id: string | null;
  title: string;
  schedule_type: string;
  due_date: string;
  due_time: string | null;
  completed: boolean;
};

type DashboardSubject = {
  id: string;
  name: string;
};

type TodayTasksProps = {
  schedules: DashboardSchedule[];
  subjects: DashboardSubject[];
};

function isSameDate(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export default function TodayTasks({
  schedules,
  subjects,
}: TodayTasksProps) {
  const today = new Date();

  const subjectMap = new Map(
    subjects.map((subject) => [
      subject.id,
      subject.name,
    ]),
  );

  const todayItems = schedules
    .filter(
      (item) =>
        !item.completed &&
        isSameDate(
          new Date(`${item.due_date}T00:00:00`),
          today,
        ),
    )
    .slice(0, 5);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            TODAY
          </p>

          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            오늘 일정
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            오늘 마감인 미완료 일정만 표시해요.
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-extrabold text-indigo-600">
          {todayItems.length}
        </div>
      </div>

      {todayItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm font-semibold text-slate-600">
            오늘 등록된 일정이 없어요.
          </p>

          <Link
            href="/schedule"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            일정 추가하기
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {todayItems.map((item) => (
            <Link
              key={item.id}
              href={
                item.schedule_type === "시험"
                  ? "/exams"
                  : "/schedule"
              }
              className="block rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    {item.schedule_type}
                  </span>

                  <p className="mt-3 text-sm font-bold text-slate-800">
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {item.subject_id
                      ? subjectMap.get(item.subject_id) ??
                        "과목 정보 없음"
                      : "과목 없음"}
                  </p>
                </div>

                {item.due_time && (
                  <span className="text-xs font-semibold text-slate-500">
                    {item.due_time.slice(0, 5)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
