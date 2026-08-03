import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

type SubmitBody = {
  quizSetId?: unknown;
  answers?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitBody;

    const quizSetId =
      typeof body.quizSetId === "string" ? body.quizSetId.trim() : "";

    const answers =
      typeof body.answers === "object" &&
      body.answers !== null
        ? (body.answers as Record<string, unknown>)
        : {};

    if (!quizSetId) {
      return NextResponse.json(
        { error: "문제 세트 ID가 없습니다." },
        { status: 400 },
      );
    }

    const { data: quizSet, error: quizSetError } =
      await supabaseAdmin
        .from("study_quiz_sets")
        .select("id, material_id")
        .eq("id", quizSetId)
        .single();

    if (quizSetError || !quizSet) {
      return NextResponse.json(
        { error: "문제 세트를 찾지 못했습니다." },
        { status: 404 },
      );
    }

    const { data: questions, error: questionError } =
      await supabaseAdmin
        .from("study_quiz_questions")
        .select(
          "id, question_number, question, options, answer_index, explanation",
        )
        .eq("quiz_set_id", quizSetId)
        .order("question_number", { ascending: true });

    if (questionError || !questions) {
      return NextResponse.json(
        { error: "문제를 불러오지 못했습니다." },
        { status: 500 },
      );
    }

    const { data: material } =
      await supabaseAdmin
        .from("study_materials")
        .select("id, subject_id")
        .eq("id", quizSet.material_id)
        .maybeSingle();

    let subjectName = "";

    if (material?.subject_id) {
      const { data: subject } =
        await supabaseAdmin
          .from("study_subjects")
          .select("name")
          .eq("id", material.subject_id)
          .maybeSingle();

      subjectName = subject?.name ?? "";
    }

    let score = 0;
    const wrongRows: Array<Record<string, unknown>> = [];

    const answerDetails = questions.map((question, index) => {
      const selectedRaw = answers[String(index)];
      const selectedIndex =
        typeof selectedRaw === "number" ? selectedRaw : -1;
      const isCorrect = selectedIndex === question.answer_index;

      if (isCorrect) {
        score += 1;
      } else {
        const options = question.options as string[];
        const wrongAnswer =
          selectedIndex >= 0 ? options[selectedIndex] ?? "" : "미선택";
        const correctAnswer =
          options[question.answer_index] ?? "";

        wrongRows.push({
          quiz_question_id: question.id,
          material_id: quizSet.material_id,
          subject_name: subjectName,
          question: question.question,
          wrong_answer: wrongAnswer,
          correct_answer: correctAnswer,
          explanation: question.explanation,
          difficulty: "보통",
          is_mastered: false,
          wrong_count: 1,
          last_wrong_at: new Date().toISOString(),
        });
      }

      return {
        question_id: question.id,
        selected_index: selectedIndex,
        correct_index: question.answer_index,
        is_correct: isCorrect,
      };
    });

    const { data: attempt, error: attemptError } =
      await supabaseAdmin
        .from("study_quiz_attempts")
        .insert({
          quiz_set_id: quizSetId,
          score,
          total_questions: questions.length,
          answers: answerDetails,
        })
        .select("id")
        .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        {
          error: "풀이 기록을 저장하지 못했습니다.",
          detail: attemptError?.message,
        },
        { status: 500 },
      );
    }

    for (const row of wrongRows) {
      const questionId = row.quiz_question_id as string;

      const { data: existing } =
        await supabaseAdmin
          .from("study_wrong_answers")
          .select("id, wrong_count")
          .eq("quiz_question_id", questionId)
          .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("study_wrong_answers")
          .update({
            wrong_answer: row.wrong_answer,
            correct_answer: row.correct_answer,
            explanation: row.explanation,
            is_mastered: false,
            wrong_count: Number(existing.wrong_count ?? 0) + 1,
            last_wrong_at: row.last_wrong_at,
          })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin
          .from("study_wrong_answers")
          .insert(row);
      }
    }

    return NextResponse.json({
      message: "풀이 결과 저장 성공",
      attemptId: attempt.id,
      score,
      totalQuestions: questions.length,
      wrongCount: wrongRows.length,
    });
  } catch (error) {
    console.error("문제 제출 API 오류:", error);

    return NextResponse.json(
      {
        error: "풀이 결과 처리 중 오류가 발생했습니다.",
        detail:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
