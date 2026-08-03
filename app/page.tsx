"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentMaterials from "@/components/dashboard/RecentMaterials";
import RecommendedStudy from "@/components/dashboard/RecommendedStudy";
import StudyProgress from "@/components/dashboard/StudyProgress";
import SubjectProgress from "@/components/dashboard/SubjectProgress";
import TodayTasks from "@/components/dashboard/TodayTasks";
import UpcomingSchedule from "@/components/dashboard/UpcomingSchedule";

export type DashboardSubject = {
  id: string;
  name: string;
  color?: string | null;
};

export type DashboardWeek = {
  id: string;
  subject_id: string;
  week_number: number;
  title: string;
};

export type DashboardMaterial = {
  id: string;
  subject_id: string;
  week_id: string;
  original_name: string;
  file_size: number;
  created_at: string;
};

export type DashboardSummary = {
  id: string;
  material_id: string;
  output_type: string;
  created_at?: string;
  updated_at?: string;
};

export type DashboardSchedule = {
  id: string;
  subject_id: string | null;
  title: string;
  schedule_type: string;
  due_date: string;
  due_time: string | null;
  priority: string;
  completed: boolean;
  memo: string | null;
  study_progress?: number | null;
  exam_type?: string | null;
};

type DashboardData = {
  subjects: DashboardSubject[];
  weeks: DashboardWeek[];
  materials: DashboardMaterial[];
  summaries: DashboardSummary[];
  schedules: DashboardSchedule[];
};

type DashboardErrorResponse = {
  error?: string;
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
        setIsLoading(true);
        setError("");

        const response = await fetch(
          "/api/dashboard",
          {
            cache: "no-store",
          },
        );

        const result = (await response.json()) as
          | DashboardData
          | DashboardErrorResponse;

        if (!response.ok) {
          const errorResult =
            result as DashboardErrorResponse;

          throw new Error(
            errorResult.error ??
              "대시보드를 불러오지 못했습니다.",
          );
        }

        setDashboard(
          result as DashboardData,
        );
      } catch (loadError) {
        console.error(
          "대시보드 조회 오류:",
          loadError,
        );

        setDashboard(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "대시보드를 불러오는 중 오류가 발생했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const completedWeeks =
    useMemo(() => {
      if (!dashboard) {
        return 0;
      }

      return dashboard.weeks.filter(
        (week) =>
          dashboard.materials.some(
            (material) =>
              material.week_id ===
              week.id,
          ),
      ).length;
    }, [dashboard]);

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
            {error ||
              "대시보드 데이터가 없습니다."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <DashboardHeader
        totalSubjects={
          dashboard.subjects.length
        }
        totalMaterials={
          dashboard.materials.length
        }
        totalSummaries={
          dashboard.summaries.length
        }
      />

      <DashboardStats
        materials={
          dashboard.materials.length
        }
        summaries={
          dashboard.summaries.length
        }
        weeks={
          dashboard.weeks.length
        }
        subjects={
          dashboard.subjects.length
        }
        schedules={
          dashboard.schedules
        }
      />

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <StudyProgress
          totalMaterials={
            dashboard.materials.length
          }
          totalSummaries={
            dashboard.summaries.length
          }
          totalWeeks={
            dashboard.weeks.length
          }
          completedWeeks={
            completedWeeks
          }
        />

        <TodayTasks
          schedules={
            dashboard.schedules
          }
          subjects={
            dashboard.subjects
          }
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <RecentMaterials
          materials={
            dashboard.materials
          }
          subjects={
            dashboard.subjects
          }
          weeks={
            dashboard.weeks
          }
        />

        <SubjectProgress
          subjects={
            dashboard.subjects
          }
          weeks={
            dashboard.weeks
          }
          materials={
            dashboard.materials
          }
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <RecommendedStudy
          materials={
            dashboard.materials
          }
          summaries={
            dashboard.summaries
          }
          subjects={
            dashboard.subjects
          }
          schedules={
            dashboard.schedules
          }
        />

        <UpcomingSchedule
          schedules={
            dashboard.schedules
          }
          subjects={
            dashboard.subjects
          }
        />
      </div>
    </main>
  );
}