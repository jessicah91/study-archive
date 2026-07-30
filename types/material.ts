export type StudyMaterial = {
  id: string;
  subject_id: string;
  week_id: string;
  original_name: string;
  storage_path: string;
  file_type: string | null;
  file_size: number;
  created_at: string;
};