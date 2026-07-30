import { supabase } from "@/lib/supabase";

export async function getSemesters() {
  const { data, error } = await supabase
    .from("grade_semesters")
    .select("*")
    .order("year", { ascending: false })
    .order("semester_number", { ascending: false });

  if (error) throw error;

  return data;
}

export async function getCourses() {
  const { data, error } = await supabase
    .from("course_grades")
    .select("*");

  if (error) throw error;

  return data;
}

export async function getPercentileTable() {
  const { data, error } = await supabase
    .from("gpa_percentile_table")
    .select("*");

  if (error) throw error;

  return data;
}