import type { Metadata } from "next";

import AppShell from "@/components/AppShell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Study Archive",
  description: "학점과 시험 공부를 관리하는 개인 학습 사이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}