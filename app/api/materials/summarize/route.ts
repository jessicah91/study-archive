import OpenAI from "openai";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type DocumentType =
  | "syllabus"
  | "lecture"
  | "assignment"
  | "exam_notice"
  | "other";

type SummaryResult = {
  documentType: DocumentType;
  title: string;
  overview: string;
  keyPoints: string[];
  keyConcepts: string[];
  examPoints: string[];
  reviewQuestions: string[];
};

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDocumentType(value: unknown): DocumentType {
  if (
    value === "syllabus" ||
    value === "lecture" ||
    value === "assignment" ||
    value === "exam_notice" ||
    value === "other"
  ) {
    return value;
  }

  return "other";
}

function normalizeSummary(value: unknown): SummaryResult {
  const summary =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    documentType: normalizeDocumentType(summary.documentType),

    title:
      typeof summary.title === "string" && summary.title.trim()
        ? summary.title.trim()
        : "AI 자료 분석",

    overview:
      typeof summary.overview === "string"
        ? summary.overview.trim()
        : "",

    keyPoints: normalizeStringArray(summary.keyPoints),
    keyConcepts: normalizeStringArray(summary.keyConcepts),
    examPoints: normalizeStringArray(summary.examPoints),
    reviewQuestions: normalizeStringArray(summary.reviewQuestions),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId");

    if (!materialId) {
      return NextResponse.json(
        { error: "materialId가 없습니다." },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("study_ai_outputs")
      .select("content, model_name, updated_at")
      .eq("material_id", materialId)
      .eq("output_type", "summary")
      .maybeSingle();

    if (error) {
      console.error("저장된 AI 분석 조회 오류:", error);

      return NextResponse.json(
        {
          error: "저장된 AI 분석을 불러오지 못했습니다.",
          detail: error.message,
        },
        { status: 500 },
      );
    }

    if (!data?.content) {
      return NextResponse.json({
        message: "저장된 AI 분석이 없습니다.",
        summary: null,
      });
    }

    return NextResponse.json({
      message: "저장된 AI 분석 조회 성공",
      source: "database",
      model: data.model_name,
      updatedAt: data.updated_at,
      summary: normalizeSummary(data.content),
    });
  } catch (error) {
    console.error("AI 분석 조회 API 오류:", error);

    return NextResponse.json(
      {
        error: "저장된 AI 분석을 확인하지 못했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const materialId = body.materialId;
    const forceRegenerate = body.forceRegenerate === true;

    if (!materialId || typeof materialId !== "string") {
      return NextResponse.json(
        { error: "materialId가 없습니다." },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const { data: savedOutput, error: savedOutputError } =
      await supabaseAdmin
        .from("study_ai_outputs")
        .select("content, model_name, updated_at")
        .eq("material_id", materialId)
        .eq("output_type", "summary")
        .maybeSingle();

    if (savedOutputError) {
      console.error("기존 AI 분석 조회 오류:", savedOutputError);
    }

    if (savedOutput?.content && !forceRegenerate) {
      return NextResponse.json({
        message: "저장된 AI 분석 조회 성공",
        source: "database",
        materialId,
        model: savedOutput.model_name,
        updatedAt: savedOutput.updated_at,
        summary: normalizeSummary(savedOutput.content),
      });
    }

    const { data: documentData, error: documentError } =
      await supabaseAdmin
        .from("study_document_contents")
        .select("*")
        .eq("material_id", materialId)
        .maybeSingle();

    if (documentError) {
      console.error("자료 조회 오류:", documentError);

      return NextResponse.json(
        {
          error: "자료 내용을 불러오지 못했습니다.",
          detail: documentError.message,
        },
        { status: 500 },
      );
    }

    if (!documentData) {
      return NextResponse.json(
        { error: "저장된 자료 텍스트를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    const documentText =
      documentData.extracted_text ??
      documentData.content ??
      documentData.text_content ??
      documentData.raw_text ??
      documentData.text ??
      "";

    if (
      typeof documentText !== "string" ||
      !documentText.trim()
    ) {
      return NextResponse.json(
        {
          error: "자료 데이터는 있지만 텍스트가 비어 있습니다.",
          columns: Object.keys(documentData),
        },
        { status: 400 },
      );
    }

    const textForSummary = documentText.slice(0, 30000);

    const aiResponse = await openai.responses.create({
      model,

      instructions: `
너는 대학생의 학기 운영과 시험 공부를 돕는 문서 분석 전문가다.

먼저 문서의 성격을 다음 중 하나로 판단한다.

- syllabus: 강의계획서, 수업계획서, OT 자료, 오리엔테이션 자료
- lecture: 일반 강의자료, 교재, 수업 슬라이드
- assignment: 과제 안내가 중심인 문서
- exam_notice: 시험 안내가 중심인 문서
- other: 위 유형에 명확히 해당하지 않는 문서

공통 규칙:
1. 반드시 제공된 문서에 적힌 내용만 사용한다.
2. 문서에 없는 정보는 추측하지 않는다.
3. 찾을 수 없는 정보는 "문서에 명시되지 않음"이라고 쓴다.
4. 영어 문서는 핵심 내용을 자연스러운 한국어로 번역해 정리한다.
5. 날짜, 요일, 시간, 배점, 비율, 제출기한은 원문을 꼼꼼히 확인한다.
6. 서로 충돌하거나 애매한 정보가 있으면 그 사실을 분명히 표시한다.
7. 반드시 유효한 JSON 객체만 출력한다.
8. 마크다운 코드 블록은 사용하지 않는다.

문서 유형이 syllabus이면 다음 기준으로 작성한다.

- title: 과목명 또는 문서를 대표하는 제목
- overview: 수업 방식과 운영상의 핵심을 3~5문장으로 요약
- keyPoints:
  담당 교수, 수업 요일·시간, 강의실, 수업 방식, BL 수업의 대면·온라인 운영 방식,
  수업 기간 등 기본 정보를 정리한다.
- keyConcepts:
  평가 구성과 배점을 "항목명: 내용" 형식으로 정리한다.
  중간고사, 기말고사, 과제, 발표, 출석, 참여도 등의 비율을 포함하고,
  합계가 100%가 아니거나 불명확하면 표시한다.
- examPoints:
  중간·기말고사 날짜, 과제 마감일, 발표일, 휴강·보강 등 중요한 일정과
  출결 관련 핵심 규정을 정리한다.
- reviewQuestions:
  과제 내용, 제출 방식, 지각·결석 기준, F 기준, 온라인 출석 인정 방식,
  학생이 추가로 확인해야 하는 사항을 정리한다.
  이 유형에서는 질문 형태로 만들지 말고 확인 사항 형태로 작성한다.

문서 유형이 lecture이면 다음 기준으로 작성한다.

- title: 자료의 핵심 제목
- overview: 자료 전체에 대한 3~5문장 요약
- keyPoints: 핵심 내용을 최소 5개
- keyConcepts: "개념명: 설명" 형식으로 최소 4개
- examPoints: 시험에 나올 가능성이 높은 포인트를 최소 4개
- reviewQuestions: 복습 문제를 최소 4개

문서 유형이 assignment이면 다음 기준으로 작성한다.

- title: 과제명
- overview: 과제 목적과 해야 할 일을 요약
- keyPoints: 제출물, 수행 내용, 개인·팀 여부, 분량과 형식
- keyConcepts: 평가 기준과 배점을 "항목명: 내용" 형식으로 정리
- examPoints: 마감일, 제출 방식, 파일 형식, 지각 제출 규정
- reviewQuestions: 빠뜨리기 쉬운 조건과 추가 확인 사항

문서 유형이 exam_notice이면 다음 기준으로 작성한다.

- title: 시험명
- overview: 시험 범위와 진행 방식을 요약
- keyPoints: 시험 날짜, 시간, 장소, 방식, 범위
- keyConcepts: 문항 유형, 배점, 준비물, 허용 자료
- examPoints: 반드시 준비해야 할 핵심 내용
- reviewQuestions: 추가 확인이 필요한 사항

반드시 아래 구조로 응답한다.

{
  "documentType": "syllabus | lecture | assignment | exam_notice | other",
  "title": "문서 제목",
  "overview": "전체 요약",
  "keyPoints": [
    "내용 1"
  ],
  "keyConcepts": [
    "항목명: 내용"
  ],
  "examPoints": [
    "중요 사항 1"
  ],
  "reviewQuestions": [
    "복습 문제 또는 확인 사항 1"
  ]
}
      `.trim(),

      input: `
아래 문서의 유형을 먼저 판단한 뒤, 해당 유형에 맞게 한국어로 분석해줘.

[문서 시작]

${textForSummary}

[문서 끝]
      `.trim(),
    });

    const rawOutput = aiResponse.output_text?.trim();

    if (!rawOutput) {
      return NextResponse.json(
        { error: "AI가 분석 결과를 반환하지 않았습니다." },
        { status: 500 },
      );
    }

    let parsedOutput: unknown;

    try {
      const cleanedOutput = rawOutput
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      parsedOutput = JSON.parse(cleanedOutput);
    } catch (parseError) {
      console.error("AI JSON 변환 오류:", parseError);
      console.error("AI 원본 응답:", rawOutput);

      return NextResponse.json(
        {
          error: "AI 응답을 JSON으로 변환하지 못했습니다.",
          detail:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
          rawOutput,
        },
        { status: 500 },
      );
    }

    const summary = normalizeSummary(parsedOutput);

    const { error: saveError } = await supabaseAdmin
      .from("study_ai_outputs")
      .upsert(
        {
          material_id: materialId,
          output_type: "summary",
          model_name: model,
          content: summary,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "material_id,output_type",
        },
      );

    if (saveError) {
      console.error("AI 분석 저장 오류:", saveError);

      return NextResponse.json(
        {
          error: "AI 분석은 생성됐지만 DB 저장에 실패했습니다.",
          detail: saveError.message,
          code: saveError.code,
          hint: saveError.hint,
          details: saveError.details,
          summary,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "AI 분석 생성 및 저장 성공",
      source: "openai",
      materialId,
      model,
      originalTextLength: documentText.length,
      summarizedTextLength: textForSummary.length,
      summary,
    });
  } catch (error) {
    console.error("AI 분석 API 오류:", error);

    return NextResponse.json(
      {
        error: "서버에서 AI 분석 요청을 처리하지 못했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}