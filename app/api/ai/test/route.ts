import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "OPENAI_API_KEY가 설정되지 않았어요.",
      },
      { status: 500 },
    );
  }

  try {
    const openai = new OpenAI({
      apiKey,
    });

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input:
        "한국어로 'OpenAI API 연결 성공'이라는 의미의 짧은 문장을 작성해줘.",
    });

    return NextResponse.json({
      success: true,
      message: response.output_text,
    });
  } catch (error) {
    console.error("OpenAI API test error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "OpenAI API 연결 중 알 수 없는 오류가 발생했어요.",
      },
      { status: 500 },
    );
  }
}