import Link from "next/link";

type DashboardSubject = {
  id: string;
  name: string;
  color?: string | null;
};

type DashboardWeek = {
  id: string;
  subject_id: string;
};

type DashboardMaterial = {
  id: string;
  subject_id: string;
};

type SubjectProgressProps = {
  subjects: DashboardSubject[];
  weeks: DashboardWeek[];
  materials: DashboardMaterial[];
};

export default function SubjectProgress({
  subjects,
  weeks,
  materials,
}: SubjectProgressProps) {
  const subjectStats = subjects
    .map((subject) => {
      const weekCount = weeks.filter(
        (week) =>
          week.subject_id === subject.id,
      ).length;

      const materialCount = materials.filter(
        (material) =>
          material.subject_id === subject.id,
      ).length;

      const progress =
        weekCount > 0
          ? Math.min(
              100,
              Math.round(
                (materialCount / weekCount) *
                  100,
              ),
            )
          : 0;

      return {
        ...subject,
        weekCount,
        materialCount,
        progress,
      };
    })
    .sort(
      (a, b) =>
        b.materialCount - a.materialCount,
    );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            SUBJECTS
          </p>

          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            과목별 진행 상태
          </h2>
        </div>

        <Link
          href="/subjects"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          과목 관리
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {subjectStats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              등록한 과목이 없어요.
            </p>
          </div>
        ) : (
          subjectStats.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="block rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        subject.color ??
                        "#6366f1",
                    }}
                  />

                  <p className="truncate text-sm font-bold text-slate-800">
                    {subject.name}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-extrabold text-slate-900">
                  {subject.progress}%
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{
                    width: `${subject.progress}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {subject.weekCount}개 주차
                </span>

                <span>
                  자료 {subject.materialCount}개
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}