import { NextRequest, NextResponse } from "next/server";

import {
  createGoogleOAuthClient,
  saveGoogleTokens,
} from "@/lib/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const oauthError =
      request.nextUrl.searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(
        new URL(
          `/calendar?error=${encodeURIComponent(oauthError)}`,
          request.url,
        ),
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/calendar?error=no_authorization_code",
          request.url,
        ),
      );
    }

    const oauth2Client = createGoogleOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

    await saveGoogleTokens(tokens);

    return NextResponse.redirect(
      new URL("/calendar?connected=true", request.url),
    );
  } catch (error) {
    console.error("Google callback error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "unknown_error";

    return NextResponse.redirect(
      new URL(
        `/calendar?error=${encodeURIComponent(message)}`,
        request.url,
      ),
    );
  }
}