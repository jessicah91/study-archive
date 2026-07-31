type StudyProgressProps = {
  totalMaterials: number;
  totalSummaries: number;
  totalWeeks: number;
  completedWeeks: number;
};

type ProgressItem = {
  label: string;
  value: number;
  description: string;
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function StudyProgress({
  totalMaterials,
  totalSummaries,
  totalWeeks,
  completedWeeks,
}: StudyProgressProps) {
  const summaryProgress =
    totalMaterials > 0
      ? clampPercent(
          (totalSummaries / totalMaterials) * 100,
        )
      : 0;

  const weekProgress =
    totalWeeks > 0
      ? clampPercent(
          (completedWeeks / totalWeeks) * 100,
        )
      : 0;

  const materialProgress =
    totalWeeks > 0
      ? clampPercent(
          (totalMaterials / totalWeeks) * 100,
        )
      : 0;

  const progressItems: ProgressItem[] = [
    {
      label: "학습 주차 진행률",
      value: weekProgress,
      description: `${completedWeeks}/${totalWeeks}주차 학습 진행`,
    },
    {
      label: "AI 요약 완료율",
      value: summaryProgress,
      description: `${totalSummaries}/${totalMaterials}개 자료 요약`,
    },
    {
      label: "주차별 자료 등록률",
      value: materialProgress,
      description: `${totalMaterials}개 자료 등록`,
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
          PROGRESS
        </p>

        <h2 className="mt-2 text-xl font-extrabold text-slate-900">
          학습 진행률
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          등록한 과목과 자료를 기준으로 현재 학습 상태를
          확인해요.
        </p>
      </div>

      <div className="mt-7 space-y-6">
        {progressItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {item.label}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {item.description}
                </p>
              </div>

              <p className="text-lg font-extrabold text-slate-900">
                {item.value}%
              </p>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{
                  width: `${item.value}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}