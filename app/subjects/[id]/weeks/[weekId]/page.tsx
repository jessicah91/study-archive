"use client";

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
};

type DocumentContent = {
  material_id: string;
  ai_status: string;
  extracted_text: string | null;
};

type LibraryItem = StudyMaterial & {
  subjectName: string;
  subjectColor: string;
  weekNumber: number | null;
  weekTitle: string;
  aiStatus: string;
  hasExtractedText: boolean;
  hasSummary: boolean;
  hasQuiz: boolean;
};

type SummaryApiResponse = {
  summary?: unknown;
};

type QuizApiResponse = {
  quiz?: unknown;
  questions?: unknown[];
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

function formatDate(value: string) {
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

  return "bg-slate-100 text-slate-600";
}

function getAiStatusLabel(item: LibraryItem) {
  if (item.hasSummary) {
    return "AI 요약 완료";
  }

  if (item.hasExtractedText) {
    return "텍스트 추출 완료";
  }

  if (
    item.aiStatus === "processing" ||
    item.aiStatus === "extracting"
  ) {
    return "처리 중";
  }

  if (item.aiStatus === "failed") {
    return "처리 실패";
  }

  return "처리 대기";
}

function getAiStatusStyle(item: LibraryItem) {
  if (item.hasSummary) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (item.hasExtractedText) {
    return "bg-indigo-50 text-indigo-700";
  }

  if (
    item.aiStatus === "processing" ||
    item.aiStatus === "extracting"
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (item.aiStatus === "failed") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

async function checkSummary(materialId: string) {
  try {
    const response = await fetch(
      `/api/materials/summarize?materialId=${encodeURIComponent(
        materialId,
      )}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return false;
    }

    const result =
      (await response.json()) as SummaryApiResponse;

    return Boolean(result.summary);
  } catch {
    return false;
  }
}

async function checkQuiz(materialId: string) {
  try {
    const response = await fetch(
      `/api/materials/quiz?materialId=${encodeURIComponent(
        materialId,
      )}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return false;
    }

    const result =
      (await response.json()) as QuizApiResponse;

    return Boolean(
      result.quiz ||
        (Array.isArray(result.questions) &&
          result.questions.length > 0),
    );
  } catch {
    return false;
  }
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState<
    string | null
  >(null);

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
      (materialsResult.data ?? []) as StudyMaterial[];

    const subjects =
      (subjectsResult.data ?? []) as Subject[];

    const weeks =
      (weeksResult.data ?? []) as StudyWeek[];

    const contents = contentsResult.error
      ? []
      : ((contentsResult.data ??
          []) as DocumentContent[]);

    const baseItems = materials.map((material) => {
      const subject = subjects.find(
        (item) => item.id === material.subject_id,
      );

      const week = weeks.find(
        (item) => item.id === material.week_id,
      );

      const content = contents.find(
        (item) =>
          item.material_id === material.id,
      );

      return {
        ...material,
        subjectName:
          subject?.name ?? "삭제된 과목",
        subjectColor:
          subject?.color ?? "#6366f1",
        weekNumber:
          week?.week_number ?? null,
        weekTitle:
          week?.title ?? "주차 정보 없음",
        aiStatus:
          content?.ai_status ?? "pending",
        hasExtractedText: Boolean(
          content?.extracted_text?.trim(),
        ),
        hasSummary: false,
        hasQuiz: false,
      };
    });

    setItems(baseItems);

    if (baseItems.length > 0) {
      const statusResults = await Promise.all(
        baseItems.map(async (item) => {
          const [hasSummary, hasQuiz] =
            await Promise.all([
              checkSummary(item.id),
              checkQuiz(item.id),
            ]);

          return {
            id: item.id,
            hasSummary,
            hasQuiz,
          };
        }),
      );

      const statusMap = new Map(
        statusResults.map((result) => [
          result.id,
          result,
        ]),
      );

      setItems(
        baseItems.map((item) => {
          const status = statusMap.get(item.id);

          return {
            ...item,
            hasSummary:
              status?.hasSummary ?? false,
            hasQuiz: status?.hasQuiz ?? false,
          };
        }),
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const subjectOptions = useMemo(() => {
    return [
      "전체",
      ...Array.from(
        new Set(
          items.map((item) => item.subjectName),
        ),
      ).sort(),
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

      const statusLabel =
        getAiStatusLabel(item);

      const matchesStatus =
        selectedStatus === "전체" ||
        statusLabel === selectedStatus;

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

  const summaryCount = useMemo(() => {
    return items.filter(
      (item) => item.hasSummary,
    ).length;
  }, [items]);

  const quizCount = useMemo(() => {
    return items.filter(
      (item) => item.hasQuiz,
    ).length;
  }, [items]);

  const extractedCount = useMemo(() => {
    return items.filter(
      (item) => item.hasExtractedText,
    ).length;
  }, [items]);

  const totalStorage = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + (item.file_size || 0),
      0,
    );
  }, [items]);

  async function openMaterial(
    item: LibraryItem,
  ) {
    setIsOpening(item.id);
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
        `자료를 열지 못했어요: ${
          error?.message ?? "주소 생성 실패"
        }`,
      );

      setIsOpening(null);
      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer",
    );

    setIsOpening(null);
  }

  async function downloadMaterial(
    item: LibraryItem,
  ) {
    setMessage("");

    const { data, error } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .download(item.storage_path);

    if (error || !data) {
      console.error(error);

      setMessage(
        `자료를 다운로드하지 못했어요: ${
          error?.message ?? "파일 생성 실패"
        }`,
      );

      return;
    }

    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = item.original_name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  async function deleteMaterial(
    item: LibraryItem,
  ) {
    const shouldDelete = window.confirm(
      `"${item.original_name}" 자료를 삭제할까요?\n연결된 추출 결과와 AI 데이터도 함께 삭제될 수 있어요.`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(item.id);
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

      setIsDeleting(null);
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

      setIsDeleting(null);
      return;
    }

    setItems((previous) =>
      previous.filter(
        (current) => current.id !== item.id,
      ),
    );

    setMessage("자료를 삭제했어요.");
    setIsDeleting(null);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

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
            과목별로 업로드한 자료를 한곳에서
            검색하고 관리할 수 있어요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadLibrary()}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            새로고침
          </button>

          <Link
            href="/subjects"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            + 과목으로 이동
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
          <p className="text-xs font-bold tracking-wide text-slate-400">
            전체 자료
          </p>

          <p className="mt-3 text-2xl font-extrabold text-slate-900">
            {items.length}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            텍스트 추출 완료
          </p>

          <p className="mt-3 text-2xl font-extrabold text-indigo-600">
            {extractedCount}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            AI 요약 완료
          </p>

          <p className="mt-3 text-2xl font-extrabold text-emerald-600">
            {summaryCount}개
          </p>

          <p className="mt-1 text-xs text-slate-400">
            문제 생성 {quizCount}개
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-400">
            저장공간
          </p>

          <p className="mt-3 text-2xl font-extrabold text-rose-500">
            {formatFileSize(totalStorage)}
          </p>
        </article>
      </section>

      <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_160px_180px_160px]">
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
              모든 처리 상태
            </option>
            <option value="AI 요약 완료">
              AI 요약 완료
            </option>
            <option value="텍스트 추출 완료">
              텍스트 추출 완료
            </option>
            <option value="처리 중">
              처리 중
            </option>
            <option value="처리 대기">
              처리 대기
            </option>
            <option value="처리 실패">
              처리 실패
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

      <section className="mt-6">
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
                            getAiStatusStyle(item),
                          ].join(" ")}
                        >
                          {getAiStatusLabel(item)}
                        </span>

                        {item.hasQuiz && (
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                            문제 생성 완료
                          </span>
                        )}
                      </div>

                      <h2 className="mt-4 break-words text-lg font-extrabold leading-7 text-slate-900">
                        {item.original_name}
                      </h2>

                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold text-slate-400">
                        <span
                          className="inline-flex items-center gap-2"
                          style={{
                            color:
                              item.subjectColor,
                          }}
                        >
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
                            : "주차 미상"}
                        </span>

                        <span>·</span>

                        <span>{item.weekTitle}</span>

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
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          isOpening === item.id
                        }
                        onClick={() =>
                          void openMaterial(item)
                        }
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                      >
                        {isOpening === item.id
                          ? "여는 중..."
                          : "파일 열기"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void downloadMaterial(
                            item,
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        다운로드
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

                    <Link
                      href={`/materials/${item.id}`}
                      className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      AI 학습 화면
                    </Link>

                    <Link
                      href={`/materials/${item.id}/quiz`}
                      className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                    >
                      문제 풀기
                    </Link>

                    <button
                      type="button"
                      disabled={
                        isDeleting === item.id
                      }
                      onClick={() =>
                        void deleteMaterial(item)
                      }
                      className="rounded-xl border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeleting === item.id
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
              과목 주차에서 자료를 업로드하거나
              검색 조건을 변경해 보세요.
            </p>

            <Link
              href="/subjects"
              className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              과목에서 자료 업로드하기
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}