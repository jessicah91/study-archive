import { google, type Auth } from "googleapis";

import { supabaseAdmin } from "@/lib/supabase-admin";

const TOKEN_ID = "primary";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} 환경변수가 없습니다.`);
  }

  return value;
}

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    getRequiredEnv("GOOGLE_CLIENT_ID"),
    getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    getRequiredEnv("GOOGLE_REDIRECT_URI"),
  );
}

export async function saveGoogleTokens(
  tokens: Auth.Credentials,
) {
  const { data: existing, error: existingError } =
    await supabaseAdmin
      .from("google_calendar_tokens")
      .select("refresh_token")
      .eq("id", TOKEN_ID)
      .maybeSingle();

  if (existingError) {
    throw new Error(
      `기존 Google 토큰 조회 실패: ${existingError.message}`,
    );
  }

  const refreshToken =
    tokens.refresh_token ??
    existing?.refresh_token ??
    null;

  const { error } = await supabaseAdmin
    .from("google_calendar_tokens")
    .upsert(
      {
        id: TOKEN_ID,
        access_token: tokens.access_token ?? null,
        refresh_token: refreshToken,
        scope: tokens.scope ?? null,
        token_type: tokens.token_type ?? null,
        expiry_date: tokens.expiry_date ?? null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

  if (error) {
    throw new Error(
      `Google 토큰 저장 실패: ${error.message}`,
    );
  }
}

export async function getAuthorizedGoogleClient() {
  const { data, error } = await supabaseAdmin
    .from("google_calendar_tokens")
    .select(
      `
        access_token,
        refresh_token,
        scope,
        token_type,
        expiry_date
      `,
    )
    .eq("id", TOKEN_ID)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Google 토큰 조회 실패: ${error.message}`,
    );
  }

  if (!data?.refresh_token && !data?.access_token) {
    return null;
  }

  const oauth2Client = createGoogleOAuthClient();

  oauth2Client.setCredentials({
    access_token: data.access_token ?? undefined,
    refresh_token: data.refresh_token ?? undefined,
    scope: data.scope ?? undefined,
    token_type: data.token_type ?? undefined,
    expiry_date: data.expiry_date ?? undefined,
  });

  oauth2Client.on("tokens", (tokens) => {
    void saveGoogleTokens(tokens).catch((saveError) => {
      console.error(
        "갱신된 Google 토큰 저장 실패:",
        saveError,
      );
    });
  });

  return oauth2Client;
}