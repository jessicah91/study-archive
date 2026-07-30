"use client";

import { ReactNode, useState } from "react";

import Sidebar from "@/components/Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function toggleDesktopSidebar() {
    setIsSidebarCollapsed((previous) => !previous);
  }

  function toggleMobileSidebar() {
    setIsMobileSidebarOpen((previous) => !previous);
  }

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onToggleCollapse={toggleDesktopSidebar}
        onCloseMobile={closeMobileSidebar}
      />

      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="모바일 메뉴 닫기"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label="메뉴 열기"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ☰
        </button>

        <div className="text-center">
          <p className="text-sm font-bold text-slate-900">Study Archive</p>
          <p className="text-xs text-slate-400">학점·시험 관리</p>
        </div>

        <div className="h-10 w-10" />
      </header>

      <main
        className={[
          "min-h-screen pt-16 transition-[padding] duration-300 lg:pt-0",
          isSidebarCollapsed ? "lg:pl-24" : "lg:pl-64",
        ].join(" ")}
      >
        <div className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-7 lg:px-10 lg:py-10 xl:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}