"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "study-materials";

type Subject = {
  id: string;
  name: string;
  color: string | null;
};

type StudyWeek = {
  id: string;
  subject_id: string;
  week_number: number;
  title: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
};

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

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function getFileLabel(fileName: string) {
  const extension = getExtension(fileName);

  if (extension === "pdf") {
    return "PDF";
  }

  if (extension === "ppt" || extension === "pptx") {
    return "PPT";
  }

  if (extension === "doc" || extension === "docx") {
    return "WORD";
  }

  if (extension === "xls" || extension === "xlsx") {
    return "EXCEL";
  }

  if (
    extension === "png" ||
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "webp"
  ) {
    return "IMAGE";
  }

  if (extension === "txt") {
    return "TEXT";
  }

  return extension.toUpperCase() || "FILE";
}

function getFileLabelClass(fileName: string) {
  const label = getFileLabel(fileName);

  if (label === "PDF") {
    return "bg-rose-50 text-rose-700";
  }

  if (label === "PPT") {
    return "bg-orange-50 text-orange-700";
  }

  if (label === "WORD") {
    return "bg-blue-50 text-blue-700";
  }

  if (label === "EXCEL") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (label === "IMAGE") {
    return "bg-violet-50 text-violet-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function WeekDetailPage() {
  const params = useParams<{
    id: string;
    weekId: string;
  }>();

  const subjectId = params.id;
  const weekId = params.weekId;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [week, setWeek] = useState<StudyWeek | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [openingMaterialId, setOpeningMaterialId] = useState<
    string | null
  >(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<
    string | null
  >(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadPage = useCallback(async () => {
    if (!subjectId || !weekId) {
      setErrorMessage("과목 또는 주차 ID를 찾을 수 없어요.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage("");
    setErrorMessage("");

    const [subjectResult, weekResult, materialsResult] =
      await Promise.all([
        supabase
          .from("study_subjects")
          .select("id, name, color")
          .eq("id", subjectId)
          .maybeSingle(),

        supabase
          .from("study_weeks")
          .select(
            "id, subject_id, week_number, title, start_date, end_date, description",
          )
          .eq("id", weekId)
          .eq("subject_id", subjectId)
          .maybeSingle(),

        supabase
          .from("study_materials")
          .select(
            "id, subject_id, week_id, original_name, storage_path, file_type, file_size, created_at",
          )
          .eq("subject_id", subjectId)
          .eq("week_id", weekId)
          .order("created_at", {
            ascending: false,
          }),
      ]);

    if (subjectResult.error) {
      console.error(subjectResult.error);
      setErrorMessage(
        `과목 정보를 불러오지 못했어요: ${subjectResult.error.message}`,
      );
      setIsLoading(false);
      return;
    }

    if (!subjectResult.data) {
      setErrorMessage("존재하지 않거나 삭제된 과목이에요.");
      setIsLoading(false);
      return;
    }

    if (weekResult.error) {
      console.error(weekResult.error);
      setErrorMessage(
        `주차 정보를 불러오지 못했어요: ${weekResult.error.message}`,
      );
      setIsLoading(false);
      return;
    }

    if (!weekResult.data) {
      setErrorMessage("존재하지 않거나 삭제된 주차예요.");
      setIsLoading(false);
      return;
    }

    if (materialsResult.error) {
      console.error(materialsResult.error);
      setErrorMessage(
        `자료를 불러오지 못했어요: ${materialsResult.error.message}`,
      );
      setIsLoading(false);
      return;
    }

    setSubject(subjectResult.data as Subject);
    setWeek(weekResult.data as StudyWeek);
    setMaterials(
      (materialsResult.data ?? []) as StudyMaterial[],
    );

    setIsLoading(false);
  }, [subjectId, weekId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  async function handleFileSelected(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !subjectId || !weekId) {
      return;
    }

    setIsUploading(true);
    setMessage("");

    const safeFileName = file.name.replace(
      /[^a-zA-Z0-9가-힣._-]/g,
      "_",
    );

    const storagePath =
      `${subjectId}/${weekId}/` +
      `${crypto.randomUUID()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType:
          file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error(uploadError);
      setMessage(
        `파일 업로드에 실패했어요: ${uploadError.message}`,
      );
      setIsUploading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("study_materials")
      .insert({
        subject_id: subjectId,
        week_id: weekId,
        original_name: file.name,
        storage_path: storagePath,
        file_type:
          file.type || getExtension(file.name) || null,
        file_size: file.size,
      });

    if (insertError) {
      console.error(insertError);

      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      setMessage(
        `자료 정보를 저장하지 못했어요: ${insertError.message}`,
      );
      setIsUploading(false);
      return;
    }

    setMessage("자료를 업로드했어요.");
    setIsUploading(false);

    await loadPage();
  }

  async function openMaterial(material: StudyMaterial) {
    setOpeningMaterialId(material.id);
    setMessage("");

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(material.storage_path, 60 * 10);

    if (error || !data?.signedUrl) {
      console.error(error);

      setMessage(
        `파일을 열지 못했어요: ${
          error?.message ?? "파일 주소 생성 실패"
        }`,
      );

      setOpeningMaterialId(null);
      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer",
    );

    setOpeningMaterialId(null);
  }

  async function downloadMaterial(material: StudyMaterial) {
    setMessage("");

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(material.storage_path);

    if (error || !data) {
      console.error(error);

      setMessage(
        `파일을 다운로드하지 못했어요: ${
          error?.message ?? "파일 생성 실패"
        }`,
      );

      return;
    }

    const objectUrl = URL.createObjectURL(data);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = material.original_name;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(objectUrl);
  }

  async function deleteMaterial(material: StudyMaterial) {
    const shouldDelete = window.confirm(
      `"${material.original_name}" 자료를 삭제할까요?\nAI 요약과 문제 데이터도 함께 삭제될 수 있어요.`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingMaterialId(material.id);
    setMessage("");

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([material.storage_path]);

    if (storageError) {
      console.error(storageError);

      setMessage(
        `파일을 삭제하지 못했어요: ${storageError.message}`,
      );

      setDeletingMaterialId(null);
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

      setMessage(
        `자료 정보를 삭제하지 못했어요: ${databaseError.message}`,
      );

      setDeletingMaterialId(null);
      return;
    }

    setMaterials((previous) =>
      previous.filter((item) => item.id !== material.id),
    );

    setMessage("자료를 삭제했어요.");
    setDeletingMaterialId(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            주차 정보를 불러오는 중이에요.
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage || !subject || !week) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
        <p className="font-semibold text-red-500">
          {errorMessage || "주차 정보를 찾지 못했어요."}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadPage()}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            다시 시도
          </button>

          <Link
            href={`/subjects/${subjectId}`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            과목으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => void handleFileSelected(event)}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
        <Link
          href="/subjects"
          className="transition hover:text-slate-900"
        >
          과목 목록
        </Link>

        <span>/</span>

        <Link
          href={`/subjects/${subject.id}`}
          className="transition hover:text-slate-900"
        >
          {subject.name}
        </Link>

        <span>/</span>

        <span className="text-slate-900">
          {week.week_number}주차
        </span>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div
          className="h-3"
          style={{
            backgroundColor: subject.color ?? "#6366f1",
          }}
        />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-extrabold tracking-[0.16em] text-indigo-600">
                WEEK {week.week_number}
              </p>

              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                {week.title}
              </h1>

              <p className="mt-3 text-sm font-semibold text-slate-500">
                {subject.name}
              </p>
            </div>

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="self-start rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? "업로드 중..." : "+ 자료 업로드"}
            </button>
          </div>

          {(week.start_date || week.end_date) && (
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              {formatDate(week.start_date) || "시작일 없음"}
              {" · "}
              {formatDate(week.end_date) || "종료일 없음"}
            </div>
          )}

          {week.description && (
            <div className="mt-4 rounded-2xl border border-slate-100 p-5">
              <p className="text-xs font-bold tracking-wide text-slate-400">
                주차 메모
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {week.description}
              </p>
            </div>
          )}
        </div>
      </section>

      {message && (
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-semibold text-indigo-700">
          {message}
        </div>
      )}

      <section className="mt-8">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
              STUDY MATERIALS
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
              학습 자료
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              총 {materials.length}개의 자료가 등록되어 있어요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPage()}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            새로고침
          </button>
        </div>

        {materials.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-4xl">📚</p>

            <h3 className="mt-4 text-lg font-extrabold text-slate-800">
              아직 등록된 자료가 없어요.
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              강의 자료를 업로드하면 AI 요약과 문제 생성을
              사용할 수 있어요.
            </p>

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              자료 업로드하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => (
              <article
                key={material.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <span
                      className={[
                        "inline-flex rounded-lg px-2.5 py-1 text-xs font-extrabold",
                        getFileLabelClass(material.original_name),
                      ].join(" ")}
                    >
                      {getFileLabel(material.original_name)}
                    </span>

                    <h3 className="mt-4 break-words text-lg font-extrabold text-slate-900">
                      {material.original_name}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs font-semibold text-slate-400">
                      <span>
                        {formatFileSize(material.file_size)}
                      </span>

                      <span>·</span>

                      <span>{formatDate(material.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={openingMaterialId === material.id}
                      onClick={() => void openMaterial(material)}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                    >
                      {openingMaterialId === material.id
                        ? "여는 중..."
                        : "파일 열기"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void downloadMaterial(material)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      다운로드
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                  <Link
                    href={`/materials/${material.id}`}
                    className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    AI 문서 분석
                  </Link>

                  <Link
                    href={`/materials/${material.id}/quiz`}
                    className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                  >
                    문제 풀기
                  </Link>

                  <button
                    type="button"
                    disabled={deletingMaterialId === material.id}
                    onClick={() => void deleteMaterial(material)}
                    className="rounded-xl border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingMaterialId === material.id
                      ? "삭제 중..."
                      : "삭제"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}