import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SummaryResult = {
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

function normalizeSummary(value: unknown): SummaryResult {
  const summary =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    title:
      typeof summary.title === "string"
        ? summary.title.trim()
        : "AI 학습 자료 요약",

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
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("study_ai_outputs")
      .select("content, model_name, updated_at")
      .eq("material_id", materialId)
      .eq("output_type", "summary")
      .maybeSingle();

    if (error) {
      console.error("저장된 AI 요약 조회 오류:", error);

      return NextResponse.json(
        {
          error: "저장된 AI 요약을 불러오지 못했습니다.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    if (!data?.content) {
      return NextResponse.json({
        message: "저장된 AI 요약이 없습니다.",
        summary: null,
      });
    }

    return NextResponse.json({
      message: "저장된 AI 요약 조회 성공",
      source: "database",
      model: data.model_name,
      updatedAt: data.updated_at,
      summary: normalizeSummary(data.content),
    });
  } catch (error) {
    console.error("AI 요약 조회 API 오류:", error);

    return NextResponse.json(
      {
        error: "저장된 AI 요약을 확인하지 못했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
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
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    /*
     * 이미 생성된 요약이 있으면 OpenAI를 다시 호출하지 않고
     * DB에서 바로 반환한다.
     */
    const { data: savedOutput, error: savedOutputError } =
      await supabaseAdmin
        .from("study_ai_outputs")
        .select("content, model_name, updated_at")
        .eq("material_id", materialId)
        .eq("output_type", "summary")
        .maybeSingle();

    if (savedOutputError) {
      console.error("기존 AI 요약 조회 오류:", savedOutputError);
    }

    if (savedOutput?.content && !forceRegenerate) {
  return NextResponse.json({
    message: "저장된 AI 요약 조회 성공",
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
      console.error("교재 조회 오류:", documentError);

      return NextResponse.json(
        {
          error: "교재 내용을 불러오지 못했습니다.",
          detail: documentError.message,
        },
        { status: 500 }
      );
    }

    if (!documentData) {
      return NextResponse.json(
        { error: "저장된 교재 텍스트를 찾지 못했습니다." },
        { status: 404 }
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
          error: "교재 데이터는 있지만 텍스트가 비어 있습니다.",
          columns: Object.keys(documentData),
        },
        { status: 400 }
      );
    }

    /*
     * 지금은 안정적인 테스트를 위해 최대 30,000자까지만 사용한다.
     * 이후 긴 문서 분할 요약 기능으로 개선할 수 있다.
     */
    const textForSummary = documentText.slice(0, 30000);

    const aiResponse = await openai.responses.create({
      model,
      instructions: `
너는 대학생의 시험 공부를 돕는 학습 자료 분석 전문가다.

다음 조건을 반드시 지켜라.

1. 제공된 학습 자료에 포함된 내용만 사용한다.
2. 모든 내용을 자연스러운 한국어로 작성한다.
3. 시험 공부에 도움이 되도록 구체적으로 정리한다.
4. 반드시 유효한 JSON 객체만 출력한다.
5. 마크다운 코드 블록은 사용하지 않는다.
6. keyPoints는 최소 5개 작성한다.
7. keyConcepts는 반드시 최소 4개 작성한다.
8. keyConcepts는 "개념명: 설명" 형식으로 작성한다.
9. examPoints는 최소 4개 작성한다.
10. reviewQuestions는 최소 4개 작성한다.

반드시 다음 구조로 응답한다.

{
  "title": "자료의 핵심 제목",
  "overview": "자료 전체에 대한 3~5문장 요약",
  "keyPoints": [
    "핵심 내용 1",
    "핵심 내용 2",
    "핵심 내용 3",
    "핵심 내용 4",
    "핵심 내용 5"
  ],
  "keyConcepts": [
    "개념명 1: 개념 설명",
    "개념명 2: 개념 설명",
    "개념명 3: 개념 설명",
    "개념명 4: 개념 설명"
  ],
  "examPoints": [
    "시험 포인트 1",
    "시험 포인트 2",
    "시험 포인트 3",
    "시험 포인트 4"
  ],
  "reviewQuestions": [
    "복습 문제 1",
    "복습 문제 2",
    "복습 문제 3",
    "복습 문제 4"
  ]
}
      `.trim(),

      input: `
아래 학습 자료를 시험 대비용으로 분석하고 요약해줘.

[학습 자료 시작]

${textForSummary}

[학습 자료 끝]
      `.trim(),
    });

    const rawOutput = aiResponse.output_text?.trim();

    if (!rawOutput) {
      return NextResponse.json(
        { error: "AI가 요약 결과를 반환하지 않았습니다." },
        { status: 500 }
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
        { status: 500 }
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
        }
      );

    if (saveError) {
  console.error("AI 요약 저장 오류:", saveError);

  return NextResponse.json(
    {
      error: "AI 요약은 생성됐지만 DB 저장에 실패했습니다.",
      saveError,
      detail: saveError.message,
      code: saveError.code,
      hint: saveError.hint,
      details: saveError.details,
      summary,
    },
    { status: 500 }
  );
}

    return NextResponse.json({
      message: "AI 요약 생성 및 저장 성공",
      source: "openai",
      materialId,
      model,
      originalTextLength: documentText.length,
      summarizedTextLength: textForSummary.length,
      summary,
    });
  } catch (error) {
    console.error("요약 API 오류:", error);

    return NextResponse.json(
      {
        error: "서버에서 요약 요청을 처리하지 못했습니다.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}