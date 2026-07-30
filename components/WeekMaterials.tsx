"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import type { StudyMaterial } from "@/types/material";

import MaterialStudySummary from "./MaterialStudySummary";

type WeekMaterialsProps = {
  subjectId: string;
  weekId: string;
};

type MaterialTextExtractorProps = {
  materialId: string;
  fileName: string;
  fileType: string | null;
};

type ExtractionResult = {
  pageCount: number;
  characterCount: number;
  preview: string;
};

type ContentState = {
  ai_status: string;
  extracted_text: string | null;
} | null;

const STORAGE_BUCKET = "study-materials";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const acceptedExtensions = [
  "pdf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "png",
  "jpg",
  "jpeg",
  "webp",
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function createSafeFileName(fileName: string) {
  const extension = getExtension(fileName);

  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w가-힣-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);

  const uniqueId = crypto.randomUUID();

  return extension
    ? `${Date.now()}-${uniqueId}-${baseName}.${extension}`
    : `${Date.now()}-${uniqueId}-${baseName}`;
}

function MaterialTextExtractor({
  materialId,
  fileName,
  fileType,
}: MaterialTextExtractorProps) {
  const [content, setContent] = useState<ContentState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ExtractionResult | null>(null);

  const isPdf =
    getExtension(fileName) === "pdf" ||
    fileType === "application/pdf";

  const loadContentStatus = useCallback(async () => {
    if (!isPdf) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("study_document_contents")
      .select("ai_status, extracted_text")
      .eq("material_id", materialId)
      .maybeSingle();

    if (error) {
      console.error(error);
      setMessage(`추출 상태를 확인하지 못했어요: ${error.message}`);
    } else {
      setContent(data as ContentState);
    }

    setIsLoading(false);
  }, [isPdf, materialId]);

  useEffect(() => {
    void loadContentStatus();
  }, [loadContentStatus]);

  async function extractText() {
  setIsExtracting(true);
  setMessage("");
  setResult(null);

  try {
    const response = await fetch("/api/materials/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        materialId,
      }),
    });

    const responseText = await response.text();

    let data: {
      error?: string;
      message?: string;
      result?: ExtractionResult;
    } = {};

    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `서버 응답을 읽지 못했어요. 상태 코드: ${response.status}`,
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        data.error ??
          `텍스트 추출에 실패했어요. 상태 코드: ${response.status}`,
      );
    }

    if (!data.result) {
      throw new Error(
        "텍스트 추출 결과가 서버 응답에 없어요.",
      );
    }

    setResult(data.result);

    setMessage(
      data.message ??
        "텍스트 추출이 완료됐어요.",
    );

    await loadContentStatus();
  } catch (error) {
    console.error(error);

    setMessage(
      error instanceof Error
        ? error.message
        : "텍스트 추출 중 오류가 발생했어요.",
    );
  } finally {
    setIsExtracting(false);
  }
}

  if (!isPdf) return null;

  if (isLoading) {
    return (
      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
        <p className="text-xs text-slate-400">PDF 상태 확인 중...</p>
      </div>
    );
  }

  const isExtracted =
    content?.ai_status === "extracted" ||
    content?.ai_status === "completed";

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-700">PDF 텍스트</p>
          <p className="mt-1 text-xs text-slate-400">
            {isExtracted
              ? `추출 완료 · ${content?.extracted_text?.length ?? 0}자`
              : content?.ai_status === "extracting"
                ? "추출 처리 중"
                : content?.ai_status === "failed"
                  ? "추출 실패"
                  : "아직 추출하지 않음"}
          </p>
        </div>

        <button
          type="button"
          disabled={isExtracting}
          onClick={() => void extractText()}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExtracting
            ? "추출 중..."
            : isExtracted
              ? "다시 추출"
              : "텍스트 추출"}
        </button>
      </div>

      {message && (
        <p className="mt-3 text-xs leading-5 text-slate-500">{message}</p>
      )}

      {result && (
        <div className="mt-3 rounded-lg bg-white p-3">
          <p className="text-xs font-semibold text-slate-600">
            {result.pageCount > 0 ? `${result.pageCount}페이지 · ` : ""}
            {result.characterCount.toLocaleString()}자
          </p>

          <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-5 text-slate-400">
            {result.preview}
          </p>
        </div>
      )}
    </div>
  );
}

export default function WeekMaterials({
  subjectId,
  weekId,
}: WeekMaterialsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState("");

  const loadMaterials = useCallback(async () => {
    if (!subjectId || !weekId) {
      setMessage("과목 또는 주차 ID를 찾지 못했어요.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("study_materials")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("week_id", weekId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage(`자료 목록을 불러오지 못했어요: ${error.message}`);
      setIsLoading(false);
      return;
    }

    setMaterials((data ?? []) as StudyMaterial[]);
    setIsLoading(false);
  }, [subjectId, weekId]);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  function validateFile(file: File) {
    const extension = getExtension(file.name);

    if (!acceptedExtensions.includes(extension)) {
      return "지원하지 않는 파일 형식이에요.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "파일 크기는 최대 20MB까지 가능해요.";
    }

    if (file.size === 0) {
      return "내용이 없는 파일은 업로드할 수 없어요.";
    }

    return null;
  }

  async function uploadFile(file: File) {
    const validationMessage = validateFile(file);

    if (validationMessage) {
      setMessage(`${file.name}: ${validationMessage}`);
      return;
    }

    setIsUploading(true);
    setMessage("");

    const safeFileName = createSafeFileName(file.name);
    const storagePath = [subjectId, weekId, safeFileName].join("/");

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);
      setMessage(`파일을 업로드하지 못했어요: ${uploadError.message}`);
      setIsUploading(false);
      return;
    }

    const { error: databaseError } = await supabase
      .from("study_materials")
      .insert({
        subject_id: subjectId,
        week_id: weekId,
        original_name: file.name,
        storage_path: storagePath,
        file_type: file.type || getExtension(file.name) || null,
        file_size: file.size,
      });

    if (databaseError) {
      console.error(databaseError);

      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      setMessage(`자료 정보를 저장하지 못했어요: ${databaseError.message}`);
      setIsUploading(false);
      return;
    }

    setMessage(`"${file.name}"을 업로드했어요.`);
    await loadMaterials();
    setIsUploading(false);
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);

    if (files.length === 0) return;

    for (const file of files) {
      await uploadFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;
    void uploadFiles(event.target.files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length === 0) return;
    void uploadFiles(event.dataTransfer.files);
  }

  async function openMaterial(material: StudyMaterial) {
    setMessage("");

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(material.storage_path, 60 * 10);

    if (error || !data?.signedUrl) {
      console.error(error);
      setMessage(
        `자료를 열지 못했어요: ${error?.message ?? "주소 생성 실패"}`,
      );
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteMaterial(material: StudyMaterial) {
    const shouldDelete = window.confirm(
      `"${material.original_name}" 자료를 삭제할까요?`,
    );

    if (!shouldDelete) return;

    setMessage("");

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([material.storage_path]);

    if (storageError) {
      console.error(storageError);
      setMessage(`파일을 삭제하지 못했어요: ${storageError.message}`);
      return;
    }

    const { error: databaseError } = await supabase
      .from("study_materials")
      .delete()
      .eq("id", material.id)
      .eq("subject_id", subjectId)
      .eq("week_id", weekId);

    if (databaseError) {
      console.error(databaseError);
      setMessage(`자료 정보를 삭제하지 못했어요: ${databaseError.message}`);
      return;
    }

    setMessage("자료를 삭제했어요.");
    await loadMaterials();
  }

  return (
    <section id="materials" className="mt-8 scroll-mt-8">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            MATERIALS
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">수업 자료</h2>
          <p className="mt-2 text-sm text-slate-500">
            이 주차의 강의 자료와 필기 파일을 업로드해요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadMaterials()}
          className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:self-auto"
        >
          새로고침
        </button>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "rounded-3xl border-2 border-dashed bg-white p-8 text-center transition",
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-300",
        ].join(" ")}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          ↑
        </div>

        <p className="mt-4 font-bold text-slate-800">
          파일을 여기에 끌어다 놓으세요
        </p>

        <p className="mt-2 text-sm text-slate-500">
          PDF, PPT, Word, Excel, 이미지·텍스트 파일
        </p>

        <p className="mt-1 text-xs text-slate-400">파일당 최대 20MB</p>

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "업로드 중..." : "파일 선택"}
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          {message}
        </p>
      )}

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">등록한 자료</h3>
          <p className="text-sm text-slate-500">총 {materials.length}개</p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            자료를 불러오는 중이에요.
          </div>
        ) : materials.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              아직 등록한 자료가 없어요.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              위 업로드 영역에서 첫 자료를 등록해 보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <article
                key={material.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-extrabold uppercase text-slate-600">
                      {getExtension(material.original_name) || "FILE"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="break-all font-semibold text-slate-800">
                        {material.original_name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatFileSize(material.file_size)}
                        {" · "}
                        {formatDate(material.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2 sm:pt-0.5">
                    <button
                      type="button"
                      onClick={() => void openMaterial(material)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      열기
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteMaterial(material)}
                      className="rounded-xl border border-red-100 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <MaterialTextExtractor
                  materialId={material.id}
                  fileName={material.original_name}
                  fileType={material.file_type}
                />
                <MaterialStudySummary
  materialId={material.id}
/>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}