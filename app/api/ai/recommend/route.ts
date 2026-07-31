import OpenAI from "openai";
import { NextResponse } from "next/server";
import { google } from "googleapis";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthorizedGoogleClient } from "@/lib/google-calendar";

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
        {
          connected: false,
        },
        {
          status: 401,
        },
      );
    }

    const calendar = google.calendar({
      version: "v3",
      auth: oauth,
    });

    const calendarResult =
      await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: "startTime",
      });

    const events =
      calendarResult.data.items?.map((event) => ({
        title: event.summary,
        start:
          event.start?.dateTime ??
          event.start?.date,
      })) ?? [];

    const { data: materials } =
      await supabaseAdmin
        .from("study_materials")
        .select("original_name")
        .order("created_at", {
          ascending: false,
        })
        .limit(20);

    const prompt = `
너는 최고의 학습 코치다.

다가오는 일정

${JSON.stringify(events, null, 2)}

보유 자료

${materials
  ?.map((m) => m.original_name)
  .join("\n")}

해야 할 일

1. 가장 중요한 일정 찾기
2. 오늘 공부하면 좋은 것 추천
3. 예상 공부시간
4. 우선순위
5. 간단한 동기부여

JSON으로만 대답

{
 "title":"",
 "reason":"",
 "studyPlan":[
   ""
 ],
 "estimatedTime":"",
 "motivation":""
}
`;

    const response =
      await openai.responses.create({
        model: "gpt-5",
        input: prompt,
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