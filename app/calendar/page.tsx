"use client";

import { useEffect, useState } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink: string | null;
};

type EventsResponse = {
  connected: boolean;
  events: CalendarEvent[];
  error?: string;
};

function formatDate(event: CalendarEvent) {
  const start = new Date(event.start);

  if (event.allDay) {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Seoul",
    }).format(start);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(start);
}

function getDaysLeft(start: string) {
  const now = new Date();
  const target = new Date(start);

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const targetDate = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  return Math.ceil(
    (targetDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function getDdayLabel(start: string) {
  const days = getDaysLeft(start);

  if (days === 0) return "D-DAY";
  if (days > 0) return `D-${days}`;

  return `D+${Math.abs(days)}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<
    CalendarEvent[]
  >([]);

  const [connected, setConnected] =
    useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/google/events",
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as EventsResponse;

      setConnected(result.connected);
      setEvents(result.events ?? []);

      if (
        !response.ok &&
        response.status !== 401
      ) {
        setError(
          result.error ??
            "일정을 불러오지 못했습니다.",
        );
      }
    } catch {
      setConnected(false);
      setError("일정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold tracking-[0.16em] text-indigo-600">
            GOOGLE CALENDAR
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            학습 일정
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Google Calendar에 저장된 시험과 일정을
            확인해요.
          </p>
        </div>

        <div className="flex gap-2">
          {connected && (
            <button
              type="button"
              onClick={() => void loadEvents()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              새로고침
            </button>
          )}

          <a
            href="/api/google/login"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700"
          >
            {connected
              ? "Google 계정 다시 연결"
              : "Google Calendar 연결"}
          </a>
        </div>
      </div>

      {loading && (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="font-semibold text-slate-500">
            Google 일정을 불러오는 중이에요.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {!loading && connected === false && (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="text-4xl">📅</div>

          <h2 className="mt-4 text-lg font-extrabold text-slate-800">
            Google Calendar를 연결해주세요
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            연결하면 시험, 과제와 개인 일정을 자동으로
            불러옵니다.
          </p>

          <a
            href="/api/google/login"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
          >
            Google Calendar 연결하기
          </a>
        </div>
      )}

      {!loading &&
        connected &&
        events.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-4xl">🗓️</div>

            <p className="mt-4 font-bold text-slate-700">
              다가오는 일정이 없습니다.
            </p>
          </div>
        )}

      {!loading &&
        connected &&
        events.length > 0 && (
          <div className="mt-8 grid gap-4">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-600">
                        {getDdayLabel(event.start)}
                      </span>

                      {event.allDay && (
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                          종일
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-extrabold text-slate-900">
                      {event.title}
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {formatDate(event)}
                    </p>

                    {event.location && (
                      <p className="mt-2 text-sm text-slate-500">
                        📍 {event.location}
                      </p>
                    )}

                    {event.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {event.htmlLink && (
                    <a
                      href={event.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Google에서 보기
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
    </main>
  );
}