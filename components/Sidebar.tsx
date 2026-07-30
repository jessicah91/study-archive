"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
};

type MenuItem = {
  name: string;
  href: string;
  icon: string;
};

const menuItems: MenuItem[] = [
  {
    name: "홈",
    href: "/",
    icon: "⌂",
  },
  {
    name: "과목",
    href: "/subjects",
    icon: "▤",
  },
  {
    name: "시험 공부",
    href: "/exams",
    icon: "✎",
  },
  {
    name: "AI 학습 채팅",
    href: "/chat",
    icon: "🤖",
  },
  {
  name: "질문 모음",
  href: "/questions",
  icon: "?",
  },
  {
    name: "오답노트",
    href: "/wrong-answers",
    icon: "!",
  },
  {
    
  name: "암기카드",
  href: "/flashcards",
  icon: "▣",
  },
  {
    name: "학점 관리",
    href: "/grades",
    icon: "A",
  },
  {
    name: "일정·과제",
    href: "/schedule",
    icon: "□",
  },
  {
    name: "문제 풀이",
    href: "/questions",
    icon: "?",
  },
  {
    name: "자료실",
    href: "/library",
    icon: "▱",
  },
  {
    name: "설정",
    href: "/settings",
    icon: "⚙",
  },
];

export default function Sidebar({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  function isActivePath(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300",
        isCollapsed ? "w-24" : "w-64",
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-20 items-center border-b border-slate-100",
          isCollapsed ? "justify-center px-3" : "justify-between px-5",
        ].join(" ")}
      >
        {!isCollapsed && (
          <Link href="/" onClick={onCloseMobile} className="min-w-0">
            <p className="truncate text-base font-extrabold tracking-tight text-slate-900">
              Study Archive
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              학점·시험 관리
            </p>
          </Link>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 lg:flex"
        >
          {isCollapsed ? "›" : "‹"}
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="메뉴 닫기"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-lg text-slate-500 lg:hidden"
        >
          ×
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const active = isActivePath(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.name : undefined}
                  className={[
                    "group flex min-h-12 items-center rounded-2xl text-sm font-semibold transition",
                    isCollapsed
                      ? "justify-center px-3"
                      : "gap-3 px-4",
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-white",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>

                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div
          className={[
            "rounded-2xl bg-slate-50",
            isCollapsed ? "p-2 text-center" : "p-4",
          ].join(" ")}
        >
          {isCollapsed ? (
            <span
              title="개인 학습 공간"
              className="text-lg"
            >
              📚
            </span>
          ) : (
            <>
              <p className="text-xs font-bold text-slate-700">
                개인 학습 공간
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                과목과 시험 자료를 한곳에서 관리해요.
              </p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}