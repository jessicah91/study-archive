"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  htmlLink: string | null;
};

type EventsResponse = {
  connected: boolean;
  events: CalendarEvent[];
};

function formatDate(date: string, allDay: boolean) {
  const d = new Date(date);

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
    ...(allDay
      ? {}
      : {
          hour: "2-digit",
          minute: "2-digit",
        }),
  }).format(d);
}

function getDday(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diff = Math.ceil(
    (target.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (diff === 0) return "D-DAY";
  if (diff > 0) return `D-${diff}`;

  return `D+${Math.abs(diff)}`;
}

export default function UpcomingSchedule() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] =
    useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/google/events", {
          cache: "no-store",
        });

        const json =
          (await res.json()) as EventsResponse;

        setConnected(json.connected);
        setEvents((json.events ?? []).slice(0, 4));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-indigo-600">
            GOOGLE CALENDAR
          </p>

          <h2 className="mt-2 text-xl font-black text-slate-900">
            다가오는 일정
          </h2>
        </div>

        <Link
          href="/calendar"
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          전체보기
        </Link>
      </div>

      {loading && (
        <div className="py-10 text-center text-slate-400">
          일정 불러오는 중...
        </div>
      )}

      {!loading && connected === false && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <div className="text-4xl">📅</div>

          <p className="mt-4 font-semibold text-slate-700">
            Google Calendar가 연결되지 않았어요.
          </p>

          <a
            href="/api/google/login"
            className="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
          >
            연결하기
          </a>
        </div>
      )}

      {!loading &&
        connected &&
        events.length === 0 && (
          <div className="py-10 text-center text-slate-400">
            다가오는 일정이 없습니다.
          </div>
        )}

      {!loading &&
        connected &&
        events.length > 0 && (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-300"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600">
                  {getDday(event.start)}
                </div>

                <div className="flex-1">
                  <p className="font-bold text-slate-800">
                    {event.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(
                      event.start,
                      event.allDay,
                    )}
                  </p>
                </div>

                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    보기
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
    </section>
  );
}