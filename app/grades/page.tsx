import {
  getCourses,
  getPercentileTable,
  getSemesters,
} from "@/lib/grades";

type SemesterRow = {
  id: string;
  semester_name: string;
  year: number;
  semester_number: number;
  total_credits: number | string;
  gpa: number | string;
  major_gpa: number | string | null;
  percentile: number | string | null;
  completed_courses: number;
};

type CourseRow = {
  id: string;
  semester_id: string;
  course_name: string;
  category: "전공" | "교양" | "기타";
  credits: number | string;
  letter_grade: string;
  grade_point: number | string | null;
  is_major: boolean;
  memo: string | null;
};

type PercentileRow = {
  id: string;
  gpa: number | string;
  percentile: number | string;
};

function toNumber(value: number | string | null | undefined) {
  const convertedValue = Number(value);

  if (Number.isNaN(convertedValue)) {
    return 0;
  }

  return convertedValue;
}

function normalizeGpa(gpa: number) {
  return gpa.toFixed(2);
}

function formatPercentile(percentile: number | null) {
  if (percentile === null) {
    return "환산표 미등록";
  }

  return percentile.toFixed(2);
}

function getGradeStyle(grade: string) {
  if (grade === "A+") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (grade === "A0") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (grade.startsWith("B")) {
    return "bg-amber-50 text-amber-700";
  }

  if (grade.startsWith("C")) {
    return "bg-orange-50 text-orange-700";
  }

  if (grade === "F" || grade === "NP") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default async function GradesPage() {
  const [
    semesterResult,
    courseResult,
    percentileResult,
  ] = await Promise.all([
    getSemesters(),
    getCourses(),
    getPercentileTable(),
  ]);

  const semesters = (semesterResult ?? []) as SemesterRow[];
  const courses = (courseResult ?? []) as CourseRow[];
  const percentileRows = (percentileResult ??
    []) as PercentileRow[];

  const percentileMap = new Map<string, number>(
    percentileRows.map((row) => [
      normalizeGpa(toNumber(row.gpa)),
      toNumber(row.percentile),
    ]),
  );

  function getPercentile(gpa: number) {
    return percentileMap.get(normalizeGpa(gpa)) ?? null;
  }

  if (semesters.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <p className="text-sm font-semibold text-indigo-600">
              성적 분석
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              학점관리
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              학기별 학점과 학교 기준 백분위를 함께
              확인해요.
            </p>
          </header>

          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-4xl">🎓</p>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              등록된 학기 성적이 없어요
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Supabase의 grade_semesters 테이블에 성적을
              등록해 주세요.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const currentSemester = semesters[0];

  const currentSemesterGpa = toNumber(
    currentSemester.gpa,
  );

  const currentSemesterCredits = toNumber(
    currentSemester.total_credits,
  );

  const currentSemesterCourses = courses.filter(
    (course) =>
      course.semester_id === currentSemester.id,
  );

  const cumulativeCredits = semesters.reduce(
    (total, semester) =>
      total + toNumber(semester.total_credits),
    0,
  );

  const totalGradePoints = semesters.reduce(
    (total, semester) =>
      total +
      toNumber(semester.gpa) *
        toNumber(semester.total_credits),
    0,
  );

  const cumulativeGpa =
    cumulativeCredits === 0
      ? 0
      : totalGradePoints / cumulativeCredits;

  const cumulativePercentile = getPercentile(
    Number(cumulativeGpa.toFixed(2)),
  );

  const currentPercentile =
    getPercentile(currentSemesterGpa);

  const totalCourses = semesters.reduce(
    (total, semester) =>
      total + toNumber(semester.completed_courses),
    0,
  );

  const highestSemesterGpa = Math.max(
    ...semesters.map((semester) =>
      toNumber(semester.gpa),
    ),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                성적 분석
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                학점관리
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                학기별 학점과 학교 기준 백분위를 함께
                확인해요.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="w-fit cursor-not-allowed rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white opacity-60"
            >
              + 성적 입력
            </button>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              현재 학기 평점
            </p>

            <div className="mt-2 flex items-end gap-1">
              <p className="text-3xl font-bold text-slate-900">
                {currentSemesterGpa.toFixed(2)}
              </p>

              <span className="pb-1 text-sm font-medium text-slate-400">
                / 4.30
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              {currentSemester.semester_name}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              현재 학기 백분위
            </p>

            <div className="mt-2 flex items-end gap-1">
              <p className="text-3xl font-bold text-indigo-600">
                {formatPercentile(currentPercentile)}
              </p>

              {currentPercentile !== null && (
                <span className="pb-1 text-sm font-medium text-slate-400">
                  점
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-400">
              학교 환산표 기준
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              누적 평점
            </p>

            <div className="mt-2 flex items-end gap-1">
              <p className="text-3xl font-bold text-emerald-600">
                {cumulativeGpa.toFixed(2)}
              </p>

              <span className="pb-1 text-sm font-medium text-slate-400">
                / 4.30
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              총 {cumulativeCredits}학점
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              누적 백분위
            </p>

            <div className="mt-2 flex items-end gap-1">
              <p className="text-3xl font-bold text-rose-500">
                {formatPercentile(cumulativePercentile)}
              </p>

              {cumulativePercentile !== null && (
                <span className="pb-1 text-sm font-medium text-slate-400">
                  점
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-400">
              환산표 등록값만 표시
            </p>
          </article>
        </section>

        <section className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
              %
            </div>

            <div>
              <h2 className="font-bold text-indigo-950">
                백분위 환산 방식
              </h2>

              <p className="mt-2 text-sm leading-6 text-indigo-900/70">
                평점을 소수점 둘째 자리까지 맞춘 뒤 학교
                백분위 환산표에서 동일한 값을 찾아 표시해요.
                환산표에 없는 평점은 임의로 계산하거나
                보간하지 않아요.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.45fr_0.75fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  학기별 성적
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  각 학기의 평점과 백분위를 비교해요.
                </p>
              </div>

              <span className="text-sm font-medium text-slate-400">
                총 {semesters.length}학기
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      학기
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      이수학점
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      전체 평점
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      백분위
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      전공 평점
                    </th>

                    <th className="px-3 py-3 text-xs font-semibold text-slate-500">
                      과목 수
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {semesters.map((semester) => {
                    const semesterGpa = toNumber(
                      semester.gpa,
                    );

                    const percentile =
                      getPercentile(semesterGpa);

                    const majorGpa =
                      semester.major_gpa === null
                        ? null
                        : toNumber(semester.major_gpa);

                    return (
                      <tr
                        key={semester.id}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold text-slate-900">
                            {semester.semester_name}
                          </p>
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-600">
                          {toNumber(
                            semester.total_credits,
                          )}
                          학점
                        </td>

                        <td className="px-3 py-4">
                          <span className="font-bold text-slate-900">
                            {semesterGpa.toFixed(2)}
                          </span>

                          <span className="ml-1 text-xs text-slate-400">
                            / 4.30
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          {percentile !== null ? (
                            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700">
                              {percentile.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-600">
                              환산표 미등록
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-4 text-sm font-semibold text-emerald-700">
                          {majorGpa === null
                            ? "-"
                            : majorGpa.toFixed(2)}
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-600">
                          {semester.completed_courses}개
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                학점 요약
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500">
                    총 이수학점
                  </span>

                  <span className="font-bold text-slate-900">
                    {cumulativeCredits}학점
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500">
                    완료 과목
                  </span>

                  <span className="font-bold text-slate-900">
                    {totalCourses}개
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500">
                    최고 학기 평점
                  </span>

                  <span className="font-bold text-indigo-600">
                    {highestSemesterGpa.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    기준 만점
                  </span>

                  <span className="font-bold text-slate-900">
                    4.30
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                현재 성적
              </span>

              <h2 className="mt-4 text-2xl font-bold">
                {currentSemesterGpa.toFixed(2)}
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                학교 기준 백분위
              </p>

              <p className="mt-1 text-3xl font-bold text-indigo-300">
                {formatPercentile(currentPercentile)}
              </p>

              {currentPercentile !== null && (
                <p className="mt-1 text-xs text-slate-400">
                  백분위 점수
                </p>
              )}
            </section>
          </aside>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                현재 학기 과목
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {currentSemester.semester_name} 과목별 성적을
                확인해요.
              </p>
            </div>

            <span className="text-sm font-medium text-slate-400">
              {currentSemesterCourses.length}과목
            </span>
          </div>

          {currentSemesterCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
              <p className="text-sm text-slate-500">
                현재 학기에 등록된 과목이 없어요.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentSemesterCourses.map((course) => {
                const gradePoint =
                  course.grade_point === null
                    ? null
                    : toNumber(course.grade_point);

                return (
                  <article
                    key={course.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-400">
                          {course.category}
                        </span>

                        <h3 className="mt-2 font-bold text-slate-900">
                          {course.course_name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {toNumber(course.credits)}학점
                        </p>
                      </div>

                      <span
                        className={`rounded-xl px-3 py-2 text-sm font-bold ${getGradeStyle(
                          course.letter_grade,
                        )}`}
                      >
                        {course.letter_grade}
                      </span>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          평점
                        </span>

                        <span className="text-sm font-bold text-slate-700">
                          {gradePoint === null
                            ? "-"
                            : gradePoint.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
          <p className="text-3xl">🎓</p>

          <h2 className="mt-3 text-lg font-bold text-slate-900">
            백분위 환산표를 정확하게 적용해요
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Supabase에 등록된 GPA와 동일한 값이 있을 때만
            백분위를 표시해요. 환산표에 없는 값은 임의로
            계산하거나 보간하지 않아요.
          </p>
        </section>

        <p className="mt-4 text-center text-xs text-slate-400">
          현재 학기 이수학점: {currentSemesterCredits}학점
        </p>
      </div>
    </main>
  );
}
