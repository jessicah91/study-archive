import { NextResponse } from "next/server";

import { createGoogleOAuthClient } from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const oauth2Client = createGoogleOAuthClient();

    const authorizationUrl =
      oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: true,
        scope: [
          "https://www.googleapis.com/auth/calendar.readonly",
        ],
      });

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Google login error:", error);

    return NextResponse.json(
      {
        error: "Google 로그인 주소 생성에 실패했습니다.",
        detail:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류입니다.",
      },
      { status: 500 },
    );
  }
}