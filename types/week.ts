export type StudyWeek = {
  id: string;
  subject_id: string;
  week_number: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type WeekFormData = {
  week_number: string;
  title: string;
  start_date: string;
  end_date: string;
  description: string;
};