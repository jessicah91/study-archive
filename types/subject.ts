export type Subject = {
  id: string;
  name: string;
  professor: string | null;
  semester: string | null;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type SubjectFormData = {
  name: string;
  professor: string;
  semester: string;
  color: string;
  description: string;
};