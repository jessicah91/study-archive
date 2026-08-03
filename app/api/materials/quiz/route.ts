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
                typeof option === "string",
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
        question !== null,
    );

  return {
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title.trim()
        : "AI 객관식 문제",
    questions,
  };
}

async function loadSavedQuiz(materialId: string) {
  const { data: quizSet, error: quizSetError } =
    await supabaseAdmin
      .from("study_quiz_sets")
      .select("id, material_id, title, question_count, created_at")
      .eq("material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (quizSetError) {
    throw quizSetError;
  }

  if (!quizSet) {
    return null;
  }

  const { data: questions, error: questionError } =
    await supabaseAdmin
      .from("study_quiz_questions")
      .select(
        "id, question_number, question, options, answer_index, explanation",
      )
      .eq("quiz_set_id", quizSet.id)
      .order("question_number", { ascending: true });

  if (questionError) {
    throw questionError;
  }

  return {
    quizSetId: quizSet.id,
    quiz: {
      title: quizSet.title,
      questions: (questions ?? []).map((question) => ({
        id: question.question_number,
        question: question.question,
        options: question.options as string[],
        answerIndex: question.answer_index,
        explanation: question.explanation,
      })),
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId")?.trim();

    if (!materialId) {
      return NextResponse.json(
        { error: "학습 자료 ID가 없습니다." },
        { status: 400 },
      );
    }

    const savedQuiz = await loadSavedQuiz(materialId);

    return NextResponse.json({
      quizSetId: savedQuiz?.quizSetId ?? null,
      quiz: savedQuiz?.quiz ?? null,
    });
  } catch (error) {
    console.error("저장 문제 조회 오류:", error);

    return NextResponse.json(
      {
        error: "저장된 문제를 불러오지 못했습니다.",
        detail:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      materialId?: unknown;
      forceRegenerate?: unknown;
    };

    const materialId =
      typeof body.materialId === "string"
        ? body.materialId.trim()
        : "";

    const forceRegenerate = body.forceRegenerate === true;

    if (!materialId) {
      return NextResponse.json(
        { error: "학습 자료 ID가 없습니다." },
        { status: 400 },
      );
    }

    if (!forceRegenerate) {
      const savedQuiz = await loadSavedQuiz(materialId);

      if (savedQuiz) {
        return NextResponse.json({
          message: "저장된 문제 조회 성공",
          source: "database",
          ...savedQuiz,
        });
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 },
      );
    }

    const { data: documentData, error: documentError } =
      await supabaseAdmin
        .from("study_document_contents")
        .select("*")
        .eq("material_id", materialId)
        .maybeSingle();

    if (documentError) {
      return NextResponse.json(
        {
          error: "학습 자료를 불러오지 못했습니다.",
          detail: documentError.message,
        },
        { status: 500 },
      );
    }

    if (!documentData) {
      return NextResponse.json(
        { error: "추출된 학습 자료가 없습니다." },
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

    if (typeof documentText !== "string" || !documentText.trim()) {
      return NextResponse.json(
        { error: "학습 자료의 텍스트가 비어 있습니다." },
        { status: 400 },
      );
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
      instructions: `
너는 대학 시험 문제를 만드는 출제자다.
제공된 학습 자료의 내용만 사용해서 객관식 문제를 만들어라.

규칙:
1. 한국어로 작성한다.
2. 총 5문제를 만든다.
3. 선택지는 정확히 4개다.
4. answerIndex는 0부터 3까지다.
5. 암기형과 이해·비교형을 섞는다.
6. 각 문제에 해설을 작성한다.
7. 유효한 JSON 객체만 출력한다.
8. 마크다운 코드 블록은 사용하지 않는다.

형식:
{
  "title": "문제 세트 제목",
  "questions": [
    {
      "id": 1,
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answerIndex": 0,
      "explanation": "해설"
    }
  ]
}
      `.trim(),
      input: `
다음 학습 자료를 바탕으로 객관식 문제 5개를 만들어라.

[학습 자료 시작]
${documentText.trim().slice(0, 30000)}
[학습 자료 끝]
      `.trim(),
    });

    const rawOutput = response.output_text?.trim();

    if (!rawOutput) {
      return NextResponse.json(
        { error: "AI가 문제를 생성하지 못했습니다." },
        { status: 500 },
      );
    }

    const cleanedOutput = rawOutput
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const quiz = normalizeQuiz(JSON.parse(cleanedOutput));

    if (quiz.questions.length !== 5) {
      return NextResponse.json(
        {
          error: "AI가 정상적인 5문제를 생성하지 못했습니다.",
          detail: `생성된 정상 문제 수: ${quiz.questions.length}`,
        },
        { status: 500 },
      );
    }

    const { data: quizSet, error: quizSetError } =
      await supabaseAdmin
        .from("study_quiz_sets")
        .insert({
          material_id: materialId,
          title: quiz.title,
          question_count: quiz.questions.length,
        })
        .select("id")
        .single();

    if (quizSetError || !quizSet) {
      return NextResponse.json(
        {
          error: "문제 세트를 저장하지 못했습니다.",
          detail: quizSetError?.message,
        },
        { status: 500 },
      );
    }

    const { error: questionSaveError } =
      await supabaseAdmin
        .from("study_quiz_questions")
        .insert(
          quiz.questions.map((question, index) => ({
            quiz_set_id: quizSet.id,
            question_number: index + 1,
            question: question.question,
            options: question.options,
            answer_index: question.answerIndex,
            explanation: question.explanation,
          })),
        );

    if (questionSaveError) {
      await supabaseAdmin
        .from("study_quiz_sets")
        .delete()
        .eq("id", quizSet.id);

      return NextResponse.json(
        {
          error: "생성된 문제를 저장하지 못했습니다.",
          detail: questionSaveError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "AI 문제 생성 및 저장 성공",
      source: "openai",
      quizSetId: quizSet.id,
      quiz,
    });
  } catch (error) {
    console.error("AI 문제 생성 API 오류:", error);

    return NextResponse.json(
      {
        error: "문제 생성 중 서버 오류가 발생했습니다.",
        detail:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
