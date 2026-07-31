"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import MaterialStudySummary from "@/components/MaterialStudySummary";
import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "study-materials";

type StudyMaterial = {
  id: string;
  subject_id: string;
  week_id: string;
  original_name: string;
  storage_path: string;
  file_type: string | null;
  file_size: number;
  created_at: string;
};

type Subject = {
  id: string;
  name: string;
  color: string | null;
};

type StudyWeek = {
  id: string;
  week_number: number;
  title: string;
};

type DocumentContent = {
  material_id: string;
  ai_status: string;
  extracted_text: string | null;
};

type ExtractApiResponse = {
  message?: string;
  error?: string;
  result?: {
    pageCount?: number;
    characterCount?: number;
    preview?: string;
  };
};

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(
    1,
  )} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getExtension(fileName: string) {
  return (
    fileName.split(".").pop()?.toUpperCase() ??
    "FILE"
  );
}

export default function MaterialStudyPage() {
  const params = useParams<{
    materialId: string;
  }>();

  const materialId = params.materialId;

  const [material, setMaterial] =
    useState<StudyMaterial | null>(null);

  const [subject, setSubject] =
    useState<Subject | null>(null);

  const [week, setWeek] =
    useState<StudyWeek | null>(null);

  const [documentContent, setDocumentContent] =
    useState<DocumentContent | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isExtracting, setIsExtracting] =
    useState(false);

  const [isOpening, setIsOpening] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadPage = useCallback(async () => {
    if (!materialId) {
      setErrorMessage("자료 ID를 찾을 수 없어요.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const { data: materialData, error: materialError } =
      await supabase
        .from("study_materials")
        .select(
          `
            id,
            subject_id,
            week_id,
            original_name,
            storage_path,
            file_type,
            file_size,
            created_at
          `,
        )
        .eq("id", materialId)
        .maybeSingle();

    if (materialError) {
      console.error(materialError);

      setErrorMessage(
        `자료를 불러오지 못했어요: ${materialError.message}`,
      );

      setIsLoading(false);
      return;
    }

    if (!materialData) {
      setErrorMessage(
        "존재하지 않거나 삭제된 자료예요.",
      );

      setIsLoading(false);
      return;
    }

    const typedMaterial =
      materialData as StudyMaterial;

    const [
      subjectResult,
      weekResult,
      contentResult,
    ] = await Promise.all([
      supabase
        .from("study_subjects")
        .select("id, name, color")
        .eq("id", typedMaterial.subject_id)
        .maybeSingle(),

      supabase
        .from("study_weeks")
        .select("id, week_number, title")
        .eq("id", typedMaterial.week_id)
        .maybeSingle(),

      supabase
        .from("study_document_contents")
        .select(
          "material_id, ai_status, extracted_text",
        )
        .eq("material_id", materialId)
        .maybeSingle(),
    ]);

    if (subjectResult.error) {
      console.error(subjectResult.error);
    }

    if (weekResult.error) {
      console.error(weekResult.error);
    }

    if (contentResult.error) {
      console.error(contentResult.error);
    }

    setMaterial(typedMaterial);

    setSubject(
      (subjectResult.data as Subject | null) ??
        null,
    );

    setWeek(
      (weekResult.data as StudyWeek | null) ??
        null,
    );

    setDocumentContent(
      (contentResult.data as DocumentContent | null) ??
        null,
    );

    setIsLoading(false);
  }, [materialId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const hasExtractedText = Boolean(
    documentContent?.extracted_text?.trim(),
  );

  async function extractText() {
    if (!materialId || isExtracting) {
      return;
    }

    try {
      setIsExtracting(true);
      setMessage("");
      setErrorMessage("");

      const response = await fetch(
        "/api/materials/extract",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            materialId,
          }),
        },
      );

      const contentType =
        response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error(
          `서버 응답을 읽지 못했어요. 상태 코드: ${response.status}`,
        );
      }

      const result =
        (await response.json()) as ExtractApiResponse;

      if (!response.ok) {
        throw new Error(
          result.error ??
            "텍스트 추출에 실패했어요.",
        );
      }

      setMessage(
        result.message ??
          "PDF 텍스트 추출이 완료됐어요.",
      );

      await loadPage();
    } catch (error) {
      console.error("텍스트 추출 오류:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "텍스트 추출 중 오류가 발생했어요.",
      );
    } finally {
      setIsExtracting(false);
    }
  }

  async function openOriginalFile() {
    if (!material) {
      return;
    }

    setIsOpening(true);
    setErrorMessage("");

    const { data, error } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(
          material.storage_path,
          60 * 10,
        );

    if (error || !data?.signedUrl) {
      console.error(error);

      setErrorMessage(
        `파일을 열지 못했어요: ${
          error?.message ?? "주소 생성 실패"
        }`,
      );

      setIsOpening(false);
      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer",
    );

    setIsOpening(false);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            학습 자료를 불러오는 중이에요.
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage && !material) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
        <p className="font-semibold text-red-500">
          {errorMessage}
        </p>

        <Link
          href="/library"
          className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          자료실로 돌아가기
        </Link>
      </div>
    );
  }

  if (!material) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
        <Link
          href="/library"
          className="transition hover:text-slate-900"
        >
          자료실
        </Link>

        {subject && (
          <>
            <span>/</span>

            <Link
              href={`/subjects/${subject.id}`}
              className="transition hover:text-slate-900"
            >
              {subject.name}
            </Link>
          </>
        )}

        {subject && week && (
          <>
            <span>/</span>

            <Link
              href={`/subjects/${subject.id}/weeks/${week.id}`}
              className="transition hover:text-slate-900"
            >
              {week.week_number}주차
            </Link>
          </>
        )}

        <span>/</span>

        <span className="text-slate-900">
          AI 문서 분석
        </span>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div
          className="h-3"
          style={{
            backgroundColor:
              subject?.color ?? "#6366f1",
          }}
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-700">
                  {getExtension(
                    material.original_name,
                  )}
                </span>

                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-bold",
                    hasExtractedText
                      ? "bg-emerald-50 text-emerald-700"
                      : documentContent?.ai_status ===
                            "extracting"
                        ? "bg-amber-50 text-amber-700"
                        : documentContent?.ai_status ===
                            "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-100 text-slate-600",
                  ].join(" ")}
                >
                  {hasExtractedText
                    ? "텍스트 추출 완료"
                    : documentContent?.ai_status ===
                          "extracting"
                      ? "텍스트 추출 중"
                      : documentContent?.ai_status ===
                          "failed"
                        ? "텍스트 추출 실패"
                        : "텍스트 추출 필요"}
                </span>
              </div>

              <h1 className="mt-4 break-words text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {material.original_name}
              </h1>

              <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-sm font-semibold text-slate-400">
                {subject && (
                  <>
                    <span>{subject.name}</span>
                    <span>·</span>
                  </>
                )}

                {week && (
                  <>
                    <span>
                      {week.week_number}주차 ·{" "}
                      {week.title}
                    </span>

                    <span>·</span>
                  </>
                )}

                <span>
                  {formatFileSize(
                    material.file_size,
                  )}
                </span>

                <span>·</span>

                <span>
                  {formatDate(
                    material.created_at,
                  )}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void openOriginalFile()
                }
                disabled={isOpening}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {isOpening
                  ? "파일 여는 중..."
                  : "원본 파일 열기"}
              </button>

              {hasExtractedText && (
                <Link
                  href={`/materials/${material.id}/quiz`}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  문제 풀기
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
          {errorMessage}
        </div>
      )}

      <section className="mt-8">
        {!hasExtractedText ? (
          <div className="rounded-3xl border border-amber-200 bg-white p-7 shadow-sm sm:p-8">
            <p className="text-sm font-semibold tracking-[0.16em] text-amber-600">
              STEP 1
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
              PDF 텍스트 추출
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              AI 문서 분석을 시작하려면 먼저
              PDF의 텍스트를 추출해야 해요.
              추출된 텍스트는 데이터베이스에 저장되고,
              이후 AI 요약과 문제 생성에 사용돼요.
            </p>

            <button
              type="button"
              onClick={() => void extractText()}
              disabled={isExtracting}
              className="mt-6 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExtracting
                ? "PDF 텍스트 추출 중..."
                : "텍스트 추출 시작"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
              <p className="font-semibold text-emerald-700">
                텍스트 추출이 완료됐어요. 이제
                AI 문서 분석을 만들 수 있어요.
              </p>
            </div>

            <MaterialStudySummary
              materialId={material.id}
            />
          </div>
        )}
      </section>
    </div>
  );
}