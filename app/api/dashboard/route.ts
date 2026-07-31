import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const [
      subjects,
      weeks,
      materials,
      summaries,
    ] = await Promise.all([
      supabaseAdmin
        .from("study_subjects")
        .select("*"),

      supabaseAdmin
        .from("study_weeks")
        .select("*"),

      supabaseAdmin
        .from("study_materials")
        .select("*"),

      supabaseAdmin
        .from("study_ai_outputs")
        .select("*")
        .eq("output_type", "summary"),
    ]);

    return NextResponse.json({
      subjects: subjects.data ?? [],
      weeks: weeks.data ?? [],
      materials: materials.data ?? [],
      summaries: summaries.data ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Dashboard API Error",
      },
      {
        status: 500,
      }
    );
  }
}