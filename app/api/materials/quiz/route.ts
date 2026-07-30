import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type QuizResult = {
  title: string;
  questions: QuizQuestion[];
};

function normalizeQuiz(value: unknown): QuizResult {
  const raw =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const rawQuestions = Array.isArray(raw.questions)
    ? raw.questions
    : [];

  const questions = rawQuestions
    .map((item, index): QuizQuestion | null => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const rawQuestion = item as Record<string, unknown>;

      const options = Array.isArray(rawQuestion.options)
        ? rawQuestion.options
            .filter(
              (option): option is string =>
                typeof option === "string"
            )
            .map((option) => option.trim())
            .filter(Boolean)
        : [];

      const answerIndex =
        typeof rawQuestion.answerIndex === "number"
          ? rawQuestion.answerIndex
          : -1;

      if (
        typeof rawQuestion.question !== "string" ||
        options.length !== 4 ||
        answerIndex < 0 ||
        answerIndex > 3
      ) {
        return null;
      }

      return {
        id:
          typeof rawQuestion.id === "number"
            ? rawQuestion.id
            : index + 1,
        question: rawQuestion.question.trim(),
        options,
        answerIndex,
        explanation:
          typeof rawQuestion.explanation === "string"
            ? rawQuestion.explanation.trim()
            : "해설이 없습니다.",
      };
    })
    .filter(
      (question): question is QuizQuestion =>
        question !== null
    );

  return {
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title.trim()
        : "AI 객관식 문제",
    questions,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      materialId?: unknown;
    };

    const materialId = body.materialId;

    if (
      typeof materialId !== "string" ||
      !materialId.trim()
    ) {
      return NextResponse.json(
        {
          error: "학습 자료 ID가 없습니다.",
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY가 설정되지 않았습니다.",
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("study_document_contents")
      .select("*")
      .eq("material_id", materialId)
      .maybeSingle();

    if (error) {
      console.error("학습 자료 조회 오류:", error);

      return NextResponse.json(
        {
          error: "학습 자료를 불러오지 못했습니다.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error: "추출된 학습 자료가 없습니다.",
        },
        { status: 404 }
      );
    }

    const documentText =
      data.extracted_text ??
      data.content ??
      data.text_content ??
      data.raw_text ??
      data.text ??
      "";

    if (
      typeof documentText !== "string" ||
      !documentText.trim()
    ) {
      return NextResponse.json(
        {
          error: "학습 자료의 텍스트가 비어 있습니다.",
        },
        { status: 400 }
      );
    }

    const quizSourceText = documentText
      .trim()
      .slice(0, 30000);

    const response = await openai.responses.create({
      model:
        process.env.OPENAI_MODEL ?? "gpt-5-mini",

      instructions: `
너는 대학 시험 문제를 만드는 출제자다.

제공된 학습 자료의 내용만 사용해서 객관식 문제를 만들어라.

반드시 아래 규칙을 지켜라.

1. 한국어로 작성한다.
2. 총 5문제를 만든다.
3. 문제마다 선택지는 정확히 4개다.
4. 정답은 반드시 선택지 중 하나다.
5. answerIndex는 0부터 3까지의 숫자다.
6. 단순 암기 문제와 이해·비교 문제를 섞는다.
7. 오답 선택지도 학습 자료와 관련 있게 만든다.
8. 각 문제에 정답 해설을 작성한다.
9. 반드시 유효한 JSON 객체만 출력한다.
10. 마크다운 코드 블록은 사용하지 않는다.

응답 형식:

{
  "title": "문제 세트 제목",
  "questions": [
    {
      "id": 1,
      "question": "문제 내용",
      "options": [
        "선택지 1",
        "선택지 2",
        "선택지 3",
        "선택지 4"
      ],
      "answerIndex": 0,
      "explanation": "정답 해설"
    }
  ]
}
      `.trim(),

      input: `
다음 학습 자료를 바탕으로 객관식 문제 5개를 만들어라.

[학습 자료 시작]

${quizSourceText}

[학습 자료 끝]
      `.trim(),
    });

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      return NextResponse.json(
        {
          error: "AI가 문제를 생성하지 못했습니다.",
        },
        { status: 500 }
      );
    }

    let parsedQuiz: unknown;

    try {
      const cleanedOutput = rawOutput
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      parsedQuiz = JSON.parse(cleanedOutput);
    } catch (error) {
      console.error("AI 문제 JSON 변환 오류:", error);
      console.error("AI 원본 응답:", rawOutput);

      return NextResponse.json(
        {
          error: "AI가 생성한 문제를 읽지 못했습니다.",
          detail:
            error instanceof Error
              ? error.message
              : String(error),
        },
        { status: 500 }
      );
    }

    const quiz = normalizeQuiz(parsedQuiz);

    if (quiz.questions.length !== 5) {
      return NextResponse.json(
        {
          error: "AI가 정상적인 5문제를 생성하지 못했습니다.",
          detail: `생성된 정상 문제 수: ${quiz.questions.length}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "AI 문제 생성 성공",
      quiz,
    });
  } catch (error) {
    console.error("AI 문제 생성 API 오류:", error);

    return NextResponse.json(
      {
        error: "문제 생성 중 서버 오류가 발생했습니다.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}