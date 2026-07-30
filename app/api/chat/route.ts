import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY가 설정되지 않았어요. .env.local을 확인해 주세요.",
        },
        {
          status: 500,
        },
      );
    }

    const body =
      (await request.json()) as ChatRequestBody;

    const messages = body.messages;

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return NextResponse.json(
        {
          error: "대화 내용이 비어 있어요.",
        },
        {
          status: 400,
        },
      );
    }

    const validMessages = messages
      .filter(
        (
          message,
        ): message is ChatMessage =>
          (message.role === "user" ||
            message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0,
      )
      .slice(-12);

    if (validMessages.length === 0) {
      return NextResponse.json(
        {
          error:
            "전송할 수 있는 메시지가 없어요.",
        },
        {
          status: 400,
        },
      );
    }

    const conversationText = validMessages
      .map((message) => {
        const speaker =
          message.role === "user"
            ? "학생"
            : "AI 튜터";

        return `${speaker}: ${message.content}`;
      })
      .join("\n\n");

    const response =
      await openai.responses.create({
        model:
          process.env.OPENAI_CHAT_MODEL ||
          "gpt-5-mini",

        instructions: `
너는 대학생의 시험 공부를 돕는 AI 학습 튜터다.

답변 원칙:
- 사용자가 이해하기 쉬운 한국어로 설명한다.
- 개념 설명은 정의, 핵심 원리, 예시 순서로 작성한다.
- 시험 대비 요청에는 출제 가능성이 높은 부분을 구분한다.
- 문제 생성 요청에는 문제와 정답을 명확히 나눈다.
- 모르는 내용은 추측하지 않는다.
- 답변은 필요 이상으로 장황하지 않게 작성한다.
- 사용자가 제공하지 않은 강의 자료의 내용을 실제 자료처럼 단정하지 않는다.
        `.trim(),

        input: conversationText,
      });

    const answer = response.output_text.trim();

    if (!answer) {
      return NextResponse.json(
        {
          error:
            "AI가 빈 답변을 반환했어요. 다시 시도해 주세요.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.error("AI chat error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "AI 채팅 처리 중 오류가 발생했어요.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}