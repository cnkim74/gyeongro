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
      </body>
    </html>
  );
}
