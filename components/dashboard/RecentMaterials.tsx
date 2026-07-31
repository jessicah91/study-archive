import Link from "next/link";

type Material = {
  id: string;
  subject_id: string;
  week_id: string;
  original_name: string;
  file_size: number;
  created_at: string;
};

type Subject = {
  id: string;
  name: string;
  color?: string | null;
};

type Week = {
  id: string;
  week_number: number;
  title: string;
};

type Props = {
  materials: Material[];
  subjects: Subject[];
  weeks: Week[];
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getExt(name: string) {
  return name.split(".").pop()?.toUpperCase() ?? "FILE";
}

export default function RecentMaterials({
  materials,
  subjects,
  weeks,
}: Props) {
  const recent = [...materials]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            RECENT MATERIALS
          </p>

          <h2 className="mt-2 text-xl font-extrabold text-slate-900">
            최근 업로드한 자료
          </h2>
        </div>

        <Link
          href="/library"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          전체보기
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="font-semibold text-slate-700">
            아직 업로드한 자료가 없습니다.
          </p>

          <Link
            href="/subjects"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            자료 업로드
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recent.map((material) => {
            const subject = subjects.find(
              (s) => s.id === material.subject_id,
            );

            const week = weeks.find(
              (w) => w.id === material.week_id,
            );

            return (
              <Link
                key={material.id}
                href={`/subjects/${material.subject_id}/weeks/${material.week_id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                  {getExt(material.original_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">
                    {material.original_name}
                  </p>

                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>{subject?.name ?? "-"}</span>

                    <span>·</span>

                    <span>
                      {week
                        ? `${week.week_number}주차`
                        : "-"}
                    </span>

                    <span>·</span>

                    <span>
                      {formatSize(material.file_size)}
                    </span>

                    <span>·</span>

                    <span>
                      {formatDate(material.created_at)}
                    </span>
                  </div>
                </div>

                <span className="text-slate-400">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}