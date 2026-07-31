"use client";

import MaterialExtractButton from "@/components/MaterialExtractButton";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

type StudySubject = {
  id: string;
  name: string;
  color: string | null;
};

type StudyWeek = {
  id: string;
  subject_id: string;
  week_number: number;
  title: string;
};

type DocumentContent = {
  material_id: string;
  ai_status: string | null;
  extracted_text: string | null;
};

type AiOutput = {
  material_id: string;
  output_type: string;
  updated_at: string | null;
};

type LibraryItem = StudyMaterial & {
  subjectName: string;
  subjectColor: string;
  weekNumber: number | null;
  weekTitle: string;
  extractionStatus: string;
  extractedTextLength: number;
  hasSummary: boolean;
  summaryUpdatedAt: string | null;
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
    return "날짜 없음";
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

function getFileCategory(fileName: string) {
  const extension = getExtension(fileName);

  if (extension === "pdf") {
    return "PDF";
  }

  if (
    extension === "ppt" ||
    extension === "pptx"
  ) {
    return "PPT";
  }

  if (
    extension === "doc" ||
    extension === "docx"
  ) {
    return "WORD";
  }

  if (
    extension === "xls" ||
    extension === "xlsx"
  ) {
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

  return "OTHER";
}

function getFileTypeStyle(fileType: string) {
  if (fileType === "PDF") {
    return "bg-rose-50 text-rose-700";
  }

  if (fileType === "PPT") {
    return "bg-orange-50 text-orange-700";
  }

  if (fileType === "WORD") {
    return "bg-blue-50 text-blue-700";
  }

  if (fileType === "EXCEL") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (fileType === "IMAGE") {
    return "bg-violet-50 text-violet-700";
  }

  if (fileType === "TEXT") {
    return "bg-cyan-50 text-cyan-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getExtractionLabel(item: LibraryItem) {
  if (item.extractedTextLength > 0) {
    return "텍스트 추출 완료";
  }

  if (item.extractionStatus === "extracting") {
    return "텍스트 추출 중";
  }

  if (item.extractionStatus === "failed") {
    return "텍스트 추출 실패";
  }

  return "텍스트 미추출";
}

function getExtractionStyle(item: LibraryItem) {
  if (item.extractedTextLength > 0) {
    return "bg-indigo-50 text-indigo-700";
  }

  if (item.extractionStatus === "extracting") {
    return "bg-amber-50 text-amber-700";
  }

  if (item.extractionStatus === "failed") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isOpeningId, setIsOpeningId] =
    useState<string | null>(null);

  const [isDownloadingId, setIsDownloadingId] =
    useState<string | null>(null);

  const [isDeletingId, setIsDeletingId] =
    useState<string | null>(null);

  const [searchKeyword, setSearchKeyword] =
    useState("");

  const [selectedSubject, setSelectedSubject] =
    useState("전체");

  const [selectedFileType, setSelectedFileType] =
    useState("전체");

  const [selectedStatus, setSelectedStatus] =
    useState("전체");

  const [sortOption, setSortOption] =
    useState("최신순");

  const [message, setMessage] = useState("");

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    const [
      materialsResult,
      subjectsResult,
      weeksResult,
      contentsResult,
      outputsResult,
    ] = await Promise.all([
      supabase
        .from("study_materials")
        .select(
          "id, subject_id, week_id, original_name, storage_path, file_type, file_size, created_at",
        )
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("study_subjects")
        .select("id, name, color"),

      supabase
        .from("study_weeks")
        .select(
          "id, subject_id, week_number, title",
        ),

      supabase
        .from("study_document_contents")
        .select(
          "material_id, ai_status, extracted_text",
        ),

      supabase
        .from("study_ai_outputs")
        .select(
          "material_id, output_type, updated_at",
        )
        .eq("output_type", "summary"),
    ]);

    if (materialsResult.error) {
      console.error(materialsResult.error);

      setMessage(
        `자료를 불러오지 못했어요: ${materialsResult.error.message}`,
      );

      setIsLoading(false);
      return;
    }

    if (subjectsResult.error) {
      console.error(subjectsResult.error);

      setMessage(
        `과목 정보를 불러오지 못했어요: ${subjectsResult.error.message}`,
      );

      setIsLoading(false);
      return;
    }

    if (weeksResult.error) {
      console.error(weeksResult.error);

      setMessage(
        `주차 정보를 불러오지 못했어요: ${weeksResult.error.message}`,
      );

      setIsLoading(false);
      return;
    }

    const materials =
      (materialsResult.data ??
        []) as StudyMaterial[];

    const subjects =
      (subjectsResult.data ??
        []) as StudySubject[];

    const weeks =
      (weeksResult.data ??
        []) as StudyWeek[];

    const contents = contentsResult.error
      ? []
      : ((contentsResult.data ??
          []) as DocumentContent[]);

    const outputs = outputsResult.error
      ? []
      : ((outputsResult.data ??
          []) as AiOutput[]);

    if (contentsResult.error) {
      console.error(contentsResult.error);
    }

    if (outputsResult.error) {
      console.error(outputsResult.error);
    }

    const subjectMap = new Map(
      subjects.map((subject) => [
        subject.id,
        subject,
      ]),
    );

    const weekMap = new Map(
      weeks.map((week) => [week.id, week]),
    );

    const contentMap = new Map(
      contents.map((content) => [
        content.material_id,
        content,
      ]),
    );

    const summaryMap = new Map(
      outputs.map((output) => [
        output.material_id,
        output,
      ]),
    );

    const libraryItems: LibraryItem[] =
      materials.map((material) => {
        const subject = subjectMap.get(
          material.subject_id,
        );

        const week = weekMap.get(
          material.week_id,
        );

        const content = contentMap.get(
          material.id,
        );

        const summary = summaryMap.get(
          material.id,
        );

        return {
          ...material,

          subjectName:
            subject?.name ?? "과목 정보 없음",

          subjectColor:
            subject?.color ?? "#6366f1",

          weekNumber:
            week?.week_number ?? null,

          weekTitle:
            week?.title ?? "주차 정보 없음",

          extractionStatus:
            content?.ai_status ?? "pending",

          extractedTextLength:
            content?.extracted_text?.trim()
              .length ?? 0,

          hasSummary: Boolean(summary),

          summaryUpdatedAt:
            summary?.updated_at ?? null,
        };
      });

    setItems(libraryItems);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const subjectOptions = useMemo(() => {
    const subjects = items
      .map((item) => item.subjectName)
      .filter(Boolean);

    return [
      "전체",
      ...Array.from(new Set(subjects)).sort(),
    ];
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword =
      searchKeyword.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const fileCategory =
        getFileCategory(item.original_name);

      const matchesKeyword =
        !keyword ||
        item.original_name
          .toLowerCase()
          .includes(keyword) ||
        item.subjectName
          .toLowerCase()
          .includes(keyword) ||
        item.weekTitle
          .toLowerCase()
          .includes(keyword);

      const matchesSubject =
        selectedSubject === "전체" ||
        item.subjectName === selectedSubject;

      const matchesFileType =
        selectedFileType === "전체" ||
        fileCategory === selectedFileType;

      const matchesStatus =
        selectedStatus === "전체" ||
        (selectedStatus === "요약 완료" &&
          item.hasSummary) ||
        (selectedStatus === "텍스트 추출 완료" &&
          item.extractedTextLength > 0 &&
          !item.hasSummary) ||
        (selectedStatus === "텍스트 미추출" &&
          item.extractedTextLength === 0);

      return (
        matchesKeyword &&
        matchesSubject &&
        matchesFileType &&
        matchesStatus
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === "오래된순") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortOption === "이름순") {
        return a.original_name.localeCompare(
          b.original_name,
          "ko",
        );
      }

      if (sortOption === "용량 큰 순") {
        return b.file_size - a.file_size;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    items,
    searchKeyword,
    selectedSubject,
    selectedFileType,
    selectedStatus,
    sortOption,
  ]);

  const extractedCount = useMemo(() => {
    return items.filter(
      (item) => item.extractedTextLength > 0,
    ).length;
  }, [items]);

  const summaryCount = useMemo(() => {
    return items.filter(
      (item) => item.hasSummary,
    ).length;
  }, [items]);

  const totalStorage = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + (item.file_size || 0),
      0,
    );
  }, [items]);

  const groupedSubjects = useMemo(() => {
    const grouped = new Map<
      string,
      {
        subjectName: string;
        subjectColor: string;
        count: number;
        summaryCount: number;
      }
    >();

    items.forEach((item) => {
      const current = grouped.get(
        item.subject_id,
      );

      if (current) {
        current.count += 1;

        if (item.hasSummary) {
          current.summaryCount += 1;
        }

        return;
      }

      grouped.set(item.subject_id, {
        subjectName: item.subjectName,
        subjectColor: item.subjectColor,
        count: 1,
        summaryCount: item.hasSummary ? 1 : 0,
      });
    });

    return Array.from(grouped.values()).sort(
      (a, b) => b.count - a.count,
    );
  }, [items]);

  async function openMaterial(
    item: LibraryItem,
  ) {
    setIsOpeningId(item.id);
    setMessage("");

    const { data, error } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(
          item.storage_path,
          60 * 10,
        );

    if (error || !data?.signedUrl) {
      console.error(error);

      setMessage(
        `파일을 열지 못했어요: ${
          error?.message ?? "파일 주소 생성 실패"
        }`,
      );

      setIsOpeningId(null);
      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer",
    );

    setIsOpeningId(null);
  }

  async function downloadMaterial(
    item: LibraryItem,
  ) {
    setIsDownloadingId(item.id);
    setMessage("");

    const { data, error } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .download(item.storage_path);

    if (error || !data) {
      console.error(error);

      setMessage(
        `파일을 다운로드하지 못했어요: ${
          error?.message ?? "파일 불러오기 실패"
        }`,
      );

      setIsDownloadingId(null);
      return;
    }

    const downloadUrl =
      URL.createObjectURL(data);

    const anchor =
      document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = item.original_name;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(downloadUrl);

    setIsDownloadingId(null);
  }

  async function deleteMaterial(
    item: LibraryItem,
  ) {
    const shouldDelete = window.confirm(
      `"${item.original_name}" 자료를 삭제할까요?\n텍스트 추출 결과와 AI 요약도 함께 삭제될 수 있어요.`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingId(item.id);
    setMessage("");

    const { error: storageError } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([item.storage_path]);

    if (storageError) {
      console.error(storageError);

      setMessage(
        `파일을 삭제하지 못했어요: ${storageError.message}`,
      );

      setIsDeletingId(null);
      return;
    }

    const { error: databaseError } =
      await supabase
        .from("study_materials")
        .delete()
        .eq("id", item.id);

    if (databaseError) {
      console.error(databaseError);

      setMessage(
        `자료 정보를 삭제하지 못했어요: ${databaseError.message}`,
      );

      setIsDeletingId(null);
      return;
    }

    setItems((previous) =>
      previous.filter(
        (current) => current.id !== item.id,
      ),
    );

    setMessage("자료를 삭제했어요.");
    setIsDeletingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm text-slate-500">
            실제 업로드 자료를 불러오는 중이에요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-indigo-600">
            STUDY LIBRARY
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            자료실
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            과목과 주차에 업로드한 실제 자료를
            한곳에서 검색하고 관리해요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              void loadLibrary()
            }
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            새로고침
          </button>

          <Link
            href="/subjects"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            + 자료 업로드
          </Link>
        </div>
      </header>

      {message && (
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm font-semibold text-indigo-700">
          {message}
        </div>
      )}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">
            전체 자료
          </p>

          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {items.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            실제 업로드 파일
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">
            텍스트 추출
          </p>

          <p className="mt-3 text-3xl font-extrabold text-indigo-600">
            {extractedCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            PDF 학습 준비 완료
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">
            AI 요약
          </p>

          <p className="mt-3 text-3xl font-extrabold text-emerald-600">
            {summaryCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            저장된 요약 자료
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">
            사용한 저장공간
          </p>

          <p className="mt-3 text-3xl font-extrabold text-rose-500">
            {formatFileSize(totalStorage)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            등록 파일 총합
          </p>
        </article>
      </section>

      <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_190px_150px_180px_150px]">
          <input
            value={searchKeyword}
            onChange={(event) =>
              setSearchKeyword(
                event.target.value,
              )
            }
            placeholder="파일명, 과목명, 주차명 검색"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />

          <select
            value={selectedSubject}
            onChange={(event) =>
              setSelectedSubject(
                event.target.value,
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            {subjectOptions.map((subject) => (
              <option
                key={subject}
                value={subject}
              >
                {subject === "전체"
                  ? "모든 과목"
                  : subject}
              </option>
            ))}
          </select>

          <select
            value={selectedFileType}
            onChange={(event) =>
              setSelectedFileType(
                event.target.value,
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="전체">
              모든 파일
            </option>

            <option value="PDF">PDF</option>
            <option value="PPT">PPT</option>
            <option value="WORD">Word</option>
            <option value="EXCEL">Excel</option>
            <option value="IMAGE">이미지</option>
            <option value="TEXT">텍스트</option>
            <option value="OTHER">기타</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(
                event.target.value,
              )
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="전체">
              모든 학습 상태
            </option>

            <option value="요약 완료">
              요약 완료
            </option>

            <option value="텍스트 추출 완료">
              텍스트 추출 완료
            </option>

            <option value="텍스트 미추출">
              텍스트 미추출
            </option>
          </select>

          <select
            value={sortOption}
            onChange={(event) =>
              setSortOption(event.target.value)
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="최신순">
              최신순
            </option>

            <option value="오래된순">
              오래된순
            </option>

            <option value="이름순">
              이름순
            </option>

            <option value="용량 큰 순">
              용량 큰 순
            </option>
          </select>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          검색 결과 {filteredItems.length}개
        </p>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1fr_300px]">
        <div>
          {filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const fileCategory =
                  getFileCategory(
                    item.original_name,
                  );

                return (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "rounded-lg px-2.5 py-1 text-xs font-extrabold",
                              getFileTypeStyle(
                                fileCategory,
                              ),
                            ].join(" ")}
                          >
                            {fileCategory}
                          </span>

                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs font-bold",
                              getExtractionStyle(
                                item,
                              ),
                            ].join(" ")}
                          >
                            {getExtractionLabel(
                              item,
                            )}
                          </span>

                          {item.hasSummary && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              AI 요약 완료
                            </span>
                          )}
                        </div>

                        <h2 className="mt-4 break-words text-lg font-extrabold leading-7 text-slate-900">
                          {item.original_name}
                        </h2>

                        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold text-slate-400">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  item.subjectColor,
                              }}
                            />

                            {item.subjectName}
                          </span>

                          <span>·</span>

                          <span>
                            {item.weekNumber
                              ? `${item.weekNumber}주차`
                              : "주차 정보 없음"}
                          </span>

                          <span>·</span>

                          <span>
                            {item.weekTitle}
                          </span>

                          <span>·</span>

                          <span>
                            {formatFileSize(
                              item.file_size,
                            )}
                          </span>

                          <span>·</span>

                          <span>
                            {formatDate(
                              item.created_at,
                            )}
                          </span>
                        </div>

                        {item.extractedTextLength >
                          0 && (
                          <p className="mt-3 text-xs text-slate-400">
                            추출된 텍스트{" "}
                            {item.extractedTextLength.toLocaleString()}
                            자
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={
                            isOpeningId ===
                            item.id
                          }
                          onClick={() =>
                            void openMaterial(
                              item,
                            )
                          }
                          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                        >
                          {isOpeningId ===
                          item.id
                            ? "여는 중..."
                            : "파일 열기"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            isDownloadingId ===
                            item.id
                          }
                          onClick={() =>
                            void downloadMaterial(
                              item,
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          {isDownloadingId ===
                          item.id
                            ? "받는 중..."
                            : "다운로드"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                      <Link
  href={`/subjects/${item.subject_id}/weeks/${item.week_id}`}
  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
>
  과목·주차로 이동
</Link>

<MaterialExtractButton
  materialId={item.id}
  hasExtractedText={item.extractedTextLength > 0}
/>

                      <button
                        type="button"
                        disabled={
                          isDeletingId === item.id
                        }
                        onClick={() =>
                          void deleteMaterial(
                            item,
                          )
                        }
                        className="rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {isDeletingId === item.id
                          ? "삭제 중..."
                          : "삭제"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-4xl">🗂️</p>

              <h2 className="mt-4 text-lg font-extrabold text-slate-800">
                표시할 자료가 없어요.
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                과목 주차에서 자료를
                업로드하거나 검색 조건을
                변경해 보세요.
              </p>

              <Link
                href="/subjects"
                className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                자료 업로드하기
              </Link>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900">
              과목별 자료
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              실제 등록된 자료 현황이에요.
            </p>

            <div className="mt-5 space-y-4">
              {groupedSubjects.length > 0 ? (
                groupedSubjects.map(
                  (subject) => {
                    const summaryRate =
                      subject.count > 0
                        ? Math.round(
                            (subject.summaryCount /
                              subject.count) *
                              100,
                          )
                        : 0;

                    return (
                      <article
                        key={
                          subject.subjectName
                        }
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  subject.subjectColor,
                              }}
                            />

                            <h3 className="truncate text-sm font-bold text-slate-800">
                              {
                                subject.subjectName
                              }
                            </h3>
                          </div>

                          <span className="text-xs font-semibold text-slate-500">
                            {subject.count}개
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{
                              width: `${summaryRate}%`,
                            }}
                          />
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          AI 요약{" "}
                          {subject.summaryCount}/
                          {subject.count}
                        </p>
                      </article>
                    );
                  },
                )
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  등록된 과목 자료가 없어요.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-xs font-semibold tracking-[0.16em] text-indigo-300">
              NEXT STEP
            </p>

            <h2 className="mt-3 text-xl font-extrabold">
              자료에서 공부로
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              PDF 텍스트를 추출하고 AI 요약을
              만들면 이후 퀴즈, 암기카드,
              오답노트로 연결할 수 있어요.
            </p>

            <Link
              href="/subjects"
              className="mt-6 inline-flex w-full justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
            >
              과목에서 공부 시작
            </Link>
          </section>
        </aside>
      </section>
    </div>
  );
}