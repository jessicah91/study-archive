import Link from "next/link";

import type {
  DashboardSchedule,
  DashboardSubject,
} from "@/app/page";

type UpcomingScheduleProps = {
  schedules: DashboardSchedule[];
  subjects: DashboardSubject[];
};

function formatDate(
  date: string,
  time: string | null,
) {
  const dateText =
    new Intl.DateTimeFormat(
      "ko-KR",
      {
        month: "short",
        day: "numeric",
        weekday: "short",
      },
    ).format(
      new Date(
        `${date}T00:00:00`,
      ),
    );

  return time
    ? `${dateText} ${time.slice(
        0,
        5,
      )}`
    : dateText;
}

function getDday(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(
    `${date}T00:00:00`,
  );

  const diff = Math.ceil(
    (target.getTime() -
      today.getTime()) /
      86400000,
  );

  if (diff === 0) {
    return "D-DAY";
  }

  if (diff > 0) {
    return `D-${diff}`;
  }

  return `D+${Math.abs(diff)}`;
}

export default function UpcomingSchedule({
  schedules,
  subjects,
}: UpcomingScheduleProps) {
  const subjectMap = new Map(
    subjects.map((subject) => [
      subject.id,
      subject.name,
    ]),
  );

  const upcoming = schedules
    .filter(
      (item) =>
        !item.completed &&
        new Date(
          `${item.due_date}T23:59:59`,
        ) >= new Date(),
    )
    .slice(0, 5);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            UPCOMING
          </p>

          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            다가오는 일정
          </h2>
        </div>

        <Link
          href="/schedule"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"
        >
          전체보기
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm font-semibold text-slate-600">
            다가오는 일정이 없어요.
          </p>

          <Link
            href="/schedule"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            일정 추가하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((item) => (
            <Link
              key={item.id}
              href={
                item.schedule_type ===
                "시험"
                  ? "/exams"
                  : "/schedule"
              }
              className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-300"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
                {getDday(
                  item.due_date,
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-800">
                  {item.title}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(
                    item.due_date,
                    item.due_time,
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {item.schedule_type}
                  {item.subject_id
                    ? ` · ${
                        subjectMap.get(
                          item.subject_id,
                        ) ??
                        "과목 정보 없음"
                      }`
                    : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
