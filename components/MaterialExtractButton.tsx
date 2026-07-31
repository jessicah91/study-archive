"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ExtractApiResponse = {
  message?: string;
  error?: string;
  result?: {
    pageCount?: number;
    characterCount?: number;
    preview?: string;
  };
};

type MaterialExtractButtonProps = {
  materialId: string;
  hasExtractedText?: boolean;
  className?: string;
};

export default function MaterialExtractButton({
  materialId,
  hasExtractedText = false,
  className = "",
}: MaterialExtractButtonProps) {
  const router = useRouter();

  const [isExtracting, setIsExtracting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function handleClick() {
    if (!materialId || isExtracting) {
      return;
    }

    if (hasExtractedText) {
      router.push(`/materials/${materialId}`);
      return;
    }

    try {
      setIsExtracting(true);
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

      router.push(`/materials/${materialId}`);
      router.refresh();
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

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isExtracting}
        className={[
          "rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
          hasExtractedText
            ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
          className,
        ].join(" ")}
      >
        {isExtracting
          ? "텍스트 추출 중..."
          : hasExtractedText
            ? "AI 문서 분석"
            : "텍스트 추출하기"}
      </button>

      {errorMessage && (
        <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}