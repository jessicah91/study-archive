import { google } from "googleapis";
import { NextResponse } from "next/server";

import { getAuthorizedGoogleClient } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EventCategory =
  | "study"
  | "work"
  | "health"
  | "personal"
  | "travel"
  | "other";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink: string | null;
  status: string | null;
  category: EventCategory;
  isStudyRelated: boolean;
};

const STUDY_KEYWORDS = [
  "시험",
  "중간고사",
  "기말고사",
  "과제",
  "발표",
  "수업",
  "강의",
  "퀴즈",
  "레포트",
  "리포트",
  "제출",
  "공부",
  "복습",
  "예습",
  "스터디",
  "세미나",
  "논문",
  "hsk",
  "toeic",
  "토익",
  "자격증",
];

const WORK_KEYWORDS = [
  "면접",
  "회의",
  "미팅",
  "출근",
  "근무",
  "인턴",
  "프로젝트",
  "마감",
  "업무",
];

const HEALTH_KEYWORDS = [
  "병원",
  "진료",
  "검사",
  "치과",
  "운동",
  "헬스",
  "러닝",
  "필라테스",
  "요가",
];

const TRAVEL_KEYWORDS = [
  "여행",
  "항공",
  "비행기",
  "출국",
  "입국",
  "호텔",
  "숙소",
  "기차",
  "공항",
];

function containsKeyword(
  text: string,
  keywords: string[],
) {
  const normalized = text.toLowerCase();

  return keywords.some((keyword) =>
    normalized.includes(keyword.toLowerCase()),
  );
}

function getEventCategory(
  title: string,
  description: string | null,
): EventCategory {
  const combinedText = `${title} ${description ?? ""}`;

  if (containsKeyword(combinedText, STUDY_KEYWORDS)) {
    return "study";
  }

  if (containsKeyword(combinedText, WORK_KEYWORDS)) {
    return "work";
  }

  if (containsKeyword(combinedText, HEALTH_KEYWORDS)) {
    return "health";
  }

  if (containsKeyword(combinedText, TRAVEL_KEYWORDS)) {
    return "travel";
  }

  return "personal";
}

export async function GET() {
  try {
    const oauth2Client =
      await getAuthorizedGoogleClient();

    if (!oauth2Client) {
      return NextResponse.json(
        {
          connected: false,
          events: [],
        },
        { status: 401 },
      );
    }

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
      showDeleted: false,
    });

    const events: CalendarEvent[] = (
      response.data.items ?? []
    )
      .filter((event) => {
        const start =
          event.start?.dateTime ?? event.start?.date;

        return Boolean(
          event.id &&
            event.summary &&
            start &&
            event.status !== "cancelled",
        );
      })
      .map((event) => {
        const title = event.summary ?? "제목 없는 일정";
        const description = event.description ?? null;

        const category = getEventCategory(
          title,
          description,
        );

        return {
          id: event.id!,
          title,
          description,
          location: event.location ?? null,
          start:
            event.start?.dateTime ??
            event.start?.date ??
            "",
          end:
            event.end?.dateTime ??
            event.end?.date ??
            "",
          allDay: Boolean(event.start?.date),
          htmlLink: event.htmlLink ?? null,
          status: event.status ?? null,
          category,
          isStudyRelated: category === "study",
        };
      });

    return NextResponse.json({
      connected: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Google events error:", error);

    return NextResponse.json(
      {
        connected: false,
        events: [],
        error: "Google 일정을 불러오지 못했습니다.",
        detail:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류입니다.",
      },
      { status: 500 },
    );
  }
}