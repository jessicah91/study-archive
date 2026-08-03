import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      subjects,
      weeks,
      materials,
      summaries,
      schedules,
    ] = await Promise.all([
      supabaseAdmin
        .from("study_subjects")
        .select("id, name, color")
        .order("created_at", {
          ascending: false,
        }),

      supabaseAdmin
        .from("study_weeks")
        .select(
          "id, subject_id, week_number, title",
        )
        .order("week_number", {
          ascending: true,
        }),

      supabaseAdmin
        .from("study_materials")
        .select(
          "id, subject_id, week_id, original_name, file_size, created_at",
        )
        .order("created_at", {
          ascending: false,
        }),

      supabaseAdmin
        .from("study_ai_outputs")
        .select(
          "id, material_id, output_type, created_at, updated_at",
        )
        .eq("output_type", "summary")
        .order("updated_at", {
          ascending: false,
        }),

      supabaseAdmin
        .from("study_schedule")
        .select(
          `
            id,
            subject_id,
            title,
            schedule_type,
            due_date,
            due_time,
            priority,
            completed,
            memo,
            study_progress,
            exam_type
          `,
        )
        .order("due_date", {
          ascending: true,
        })
        .order("due_time", {
          ascending: true,
        }),
    ]);

    const firstError =
      subjects.error ??
      weeks.error ??
      materials.error ??
      summaries.error ??
      schedules.error;

    if (firstError) {
      console.error(
        "Dashboard query error:",
        firstError,
      );

      return NextResponse.json(
        {
          error:
            firstError.message ??
            "대시보드 데이터를 불러오지 못했습니다.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        subjects: subjects.data ?? [],
        weeks: weeks.data ?? [],
        materials: materials.data ?? [],
        summaries: summaries.data ?? [],
        schedules: schedules.data ?? [],
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Dashboard API Error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Dashboard API Error",
      },
      {
        status: 500,
      },
    );
  }
}