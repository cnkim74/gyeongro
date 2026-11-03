import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExchangeCalculator from "@/components/ExchangeCalculator";

export const metadata = {
  title: "여행 환율 계산기 - Pothos",
  description: "엔·달러·유로·바트·동 등 26개 통화를 원화로 바로 계산. 여행 중 휴대폰으로 간편하게.",
  alternates: { canonical: "/exchange" },
};

export default function ExchangePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">💱 여행 환율 계산기</h1>
          <p className="text-[15px] text-gray-500 mb-5">마지막에 고른 통화를 기억해요. 홈 화면에 추가해 두면 여행 중 앱처럼 쓸 수 있어요.</p>
          <ExchangeCalculator variant="compact" remember title="환율 계산" />
          <div className="mt-6 rounded-2xl bg-white border border-gray-100 p-4 text-sm text-gray-600 leading-relaxed">
            <p className="font-bold text-gray-800 mb-1">📱 홈 화면에 추가하는 법</p>
            <p>아이폰: 사파리 아래 공유 버튼 → &apos;홈 화면에 추가&apos;</p>
            <p>안드로이드: 크롬 오른쪽 위 ⋮ → &apos;홈 화면에 추가&apos;</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
            <Link href="/travel-guide" className="rounded-2xl bg-white border border-gray-100 p-4 text-gray-700 hover:border-emerald-200">
              🛡️ 여행경보·날씨
            </Link>
            <Link href="/planner" className="rounded-2xl bg-white border border-gray-100 p-4 text-gray-700 hover:border-emerald-200">
              ✨ AI 일정 만들기
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
