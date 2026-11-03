import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import FxQuickButton from "@/components/FxQuickButton";
// 한글 친화 폰트 (Pretendard, OFL 라이선스) — 필요한 글자만 내려받는 dynamic subset
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com"),
  // 검색엔진 소유 확인 — Vercel 환경변수에 값을 넣으면 <meta> 로 들어감
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NAVER_SITE_VERIFICATION ? { other: { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION } } : {}),
  },
  // 블로그 RSS 자동 발견
  alternates: { types: { "application/rss+xml": [{ url: "/rss.xml", title: "Pothos 여행 인사이트" }] } },
  title: "Pothos - 먼 곳을 향한 동경, 그리고 여정",
  description:
    "AI가 설계하는 맞춤 여행 일정과 함께 떠날 동료, 영감을 주는 스토리. 그리스어 '동경'에서 시작된 글로벌 여행 플랫폼 Pothos.",
  keywords:
    "Pothos, 여행, AI 여행 플래너, 동료 매칭, 여행 동행, 여행 스토리, 맞춤 여행, 글로벌 여행",
  openGraph: {
    title: "Pothos · Wherever you long for",
    description: "AI 맞춤 일정 + 동료 매칭 + 영감 가득한 여행 스토리",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
        {/* 여행 중 어디서든 쓰는 환율 계산기 버튼 */}
        <FxQuickButton />
      </body>
    </html>
  );
}
