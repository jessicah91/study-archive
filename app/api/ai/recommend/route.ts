import OpenAI from "openai";
import { google } from "googleapis";
import { NextResponse } from "next/server";

import { getAuthorizedGoogleClient } from "@/lib/google-calendar";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    const oauth = await getAuthorizedGoogleClient();

    if (!oauth) {
      return NextResponse.json(
        { connected: false },
        { status: 401 },
      );
    }

    const calendar = google.calendar({
      version: "v3",
      auth: oauth,
    });

    const calendarResult =
      await calendar.events.list({
        calendarId: "primary",
        singleEvents: true,
        orderBy: "startTime",
        timeMin: new Date().toISOString(),
        maxResults: 30,
      });

    const events =
      calendarResult.data.items?.map((event) => ({
        title: event.summary,
        start:
          event.start?.dateTime ??
          event.start?.date,
        description: event.description,
      })) ?? [];

    const { data: summaries } =
      await supabaseAdmin
        .from("study_ai_outputs")
        .select("content")
        .eq("output_type", "summary")
        .order("updated_at", {
          ascending: false,
        })
        .limit(5);

    const summaryText =
      summaries
        ?.map((item) => item.content)
        .join("\n\n-----------------\n\n") ??
      "요약 없음";

    const response =
      await openai.responses.create({
        model: "gpt-5",

        input: [
          {
            role: "system",
            content: `
너는 AI 학습 코치이다.

사용자의 일정과 학습 자료를 보고

오늘 무엇을 공부해야 하는지 추천한다.

반드시 JSON만 반환한다.

{
"title":"",
"reason":"",
"priority":"",
"estimatedTime":"",
"studyPlan":[
""
],
"motivation":""
}
`,
          },

          {
            role: "user",
            content: `
다가오는 일정

${JSON.stringify(events, null, 2)}

최근 AI 요약

${summaryText}
`,
          },
        ],
      });

    return NextResponse.json(
      JSON.parse(response.output_text),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "AI 추천 생성 실패",
      },
      {
        status: 500,
      },
    );
  }
}