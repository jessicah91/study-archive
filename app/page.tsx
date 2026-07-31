"use client";

import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import StudyProgress from "@/components/dashboard/StudyProgress";
import TodayTasks from "@/components/dashboard/TodayTasks";
import RecentMaterials from "@/components/dashboard/RecentMaterials";
import SubjectProgress from "@/components/dashboard/SubjectProgress";
import RecommendedStudy from "@/components/dashboard/RecommendedStudy";
import UpcomingSchedule from "@/components/dashboard/UpcomingSchedule";

type DashboardData = {
  subjects: any[];
  weeks: any[];
  materials: any[];
  summaries: any[];
};

export default function HomePage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch(
          "/api/dashboard"
        );

        if (!response.ok) {
          throw new Error(
            "대시보드를 불러오지 못했습니다."
          );
        }

        const data =
          (await response.json()) as DashboardData;

        setDashboard(data);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            대시보드를 불러오는 중...
          </p>
        </div>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <h2 className="text-xl font-bold text-red-600">
            오류가 발생했습니다.
          </h2>

          <p className="mt-3 text-red-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  const completedWeeks = dashboard.weeks.filter(
    (week) =>
      dashboard.materials.some(
        (material) =>
          material.week_id === week.id
      )
  ).length;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">

      <DashboardHeader
        totalSubjects={dashboard.subjects.length}
        totalMaterials={dashboard.materials.length}
        totalSummaries={dashboard.summaries.length}
      />

      <DashboardStats
        materials={dashboard.materials.length}
        summaries={dashboard.summaries.length}
        weeks={dashboard.weeks.length}
        subjects={dashboard.subjects.length}
      />

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">

        <StudyProgress
          totalMaterials={dashboard.materials.length}
          totalSummaries={dashboard.summaries.length}
          totalWeeks={dashboard.weeks.length}
          completedWeeks={completedWeeks}
        />

        <TodayTasks
          subjectsCount={dashboard.subjects.length}
          materialsCount={dashboard.materials.length}
          summariesCount={dashboard.summaries.length}
        />

      </div>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">

        <RecentMaterials
          materials={dashboard.materials}
          subjects={dashboard.subjects}
          weeks={dashboard.weeks}
        />

        <SubjectProgress
          subjects={dashboard.subjects}
          weeks={dashboard.weeks}
          materials={dashboard.materials}
        />

      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">

        <RecommendedStudy
  materials={dashboard.materials}
  summaries={dashboard.summaries}
  subjects={dashboard.subjects}
/>

        <UpcomingSchedule />

      </div>

    </main>
  );
}