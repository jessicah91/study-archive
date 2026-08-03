import Link from "next/link";

type DashboardMaterial = {
  id: string;
  subject_id: string;
  original_name: string;
};

type DashboardSummary = {
  id: string;
  material_id: string;
};

type DashboardSubject = {
  id: string;
  name: string;
};

type DashboardSchedule = {
  id: string;
  subject_id: string | null;
  title: string;
  schedule_type: string;
  due_date: string;
  completed: boolean;
};

type RecommendedStudyProps = {
  materials: DashboardMaterial[];
  summaries: DashboardSummary[];
  subjects: DashboardSubject[];
  schedules: DashboardSchedule[];
};

export default function RecommendedStudy({
  materials,
  summaries,
  subjects,
  schedules,
}: RecommendedStudyProps) {
  const subjectMap = new Map(
    subjects.map((subject) => [
      subject.id,
      subject.name,
    ]),
  );

  const upcoming = schedules.find(
    (item) =>
      !item.completed &&
      new Date(
        `${item.due_date}T23:59:59`,
      ) >= new Date(),
  );

  const summarizedMaterialIds = new Set(
    summaries.map(
      (summary) => summary.material_id,
    ),
  );

  const materialToAnalyze = materials.find(
    (material) =>
      !summarizedMaterialIds.has(
        material.id,
      ),
  );

  let title = "새 학습 자료를 등록해 보세요";
  let description =
    "등록된 일정이나 분석 대기 자료가 아직 없어요.";
  let href = "/subjects";
  let buttonText = "과목 관리하기";
  let icon = "📚";

  if (upcoming) {
    const subjectName = upcoming.subject_id
      ? subjectMap.get(
          upcoming.subject_id,
        ) ?? "과목 정보 없음"
      : "과목 없음";

    title = upcoming.title;
    description = `${subjectName} · ${upcoming.due_date} 마감`;

    if (upcoming.schedule_type === "시험") {
      href = "/exams";
      buttonText = "시험 준비하기";
      icon = "📝";
    } else {
      href = "/schedule";
      buttonText = "일정 확인하기";
      icon = "📅";
    }
  } else if (materialToAnalyze) {
    title = materialToAnalyze.original_name;
    description =
      "아직 AI 분석이 생성되지 않은 자료예요.";
    href = `/materials/${materialToAnalyze.id}`;
    buttonText = "AI 문서 분석하기";
    icon = "🤖";
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
        RECOMMEND
      </p>

      <h2 className="mt-2 text-xl font-extrabold text-slate-900">
        다음 학습 추천
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        실제 일정과 자료 분석 상태를 기준으로 보여줘요.
      </p>

      <div className="mt-6 rounded-3xl bg-slate-900 p-6 text-white">
        <div className="text-4xl">
          {icon}
        </div>

        <h3 className="mt-4 text-xl font-extrabold">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          {description}
        </p>

        <Link
          href={href}
          className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}