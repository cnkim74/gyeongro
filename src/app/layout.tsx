import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
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
  title: "경로 - AI 맞춤 여행 플랫폼",
  description: "AI가 당신만의 완벽한 여행 일정을 설계해드립니다. 취향, 예산, 기간을 입력하면 최적의 여행 코스를 추천해드려요.",
  keywords: "여행, AI 여행 플래너, 맞춤 여행, DIY 여행, 여행 일정, 경로",
  openGraph: {
    title: "경로 - AI 맞춤 여행 플랫폼",
    description: "AI가 당신만의 완벽한 여행 일정을 설계해드립니다.",
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
      </body>
    </html>
  );
}
