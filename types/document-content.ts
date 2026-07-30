export type DocumentContentStatus =
  | "pending"
  | "extracting"
  | "extracted"
  | "summarizing"
  | "completed"
  | "failed";

export type StudyDocumentContent = {
  id: string;
  material_id: string;
  extracted_text: string | null;
  ai_summary: string | null;
  ai_keywords: unknown[] | null;
  ai_status: DocumentContentStatus;
  created_at: string;
};