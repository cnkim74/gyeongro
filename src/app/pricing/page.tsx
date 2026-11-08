import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CREDIT_PACKS, SUBSCRIPTION_PLANS, PLUS_BENEFITS, PAYMENTS_ENABLED, won } from "@/lib/pricing";
import { FREE_MONTHLY } from "@/lib/planner-quota";
import { Check, Sparkles, Zap } from "lucide-react";

export const metadata = {
  title: "요금제 · 이용권 - Pothos",
  description: "기본 AI는 무료, 더 섬세한 고급 AI는 필요한 만큼 이용권으로. Pothos AI 여행 플래너 요금 안내.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.2em] text-blue-600">PRICING</p>
            <h1 className="mt-3 text-[30px] sm:text-4xl font-extrabold text-slate-900 tracking-tight">필요한 만큼만, 부담 없이</h1>
            <p className="mt-3 text-slate-500">기본 AI는 무료로, 더 섬세한 일정이 필요할 땐 고급 AI 이용권으로.</p>
          </div>

          {/* 기본 vs 고급 */}
          <div className="grid md:grid-cols-2 gap-5 mb-14">
            <div className="rounded-3xl bg-white border border-slate-200 p-7">
              <p className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <Zap className="w-5 h-5 text-blue-600" /> 기본 AI
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">무료</p>
              <p className="text-sm text-slate-500 mt-1">회원이면 매달 {FREE_MONTHLY.user}회</p>
              <ul className="mt-5 space-y-2 text-[15px] text-slate-700">
                {["실제 장소로 짜는 일자별 일정", "지도·동선·예상 경비", "PDF 저장 · 환율 계산기", "빠른 응답의 가벼운 AI 모델"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="w-5 h-5 text-blue-600 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/planner" className="mt-6 block text-center py-3 rounded-2xl border border-slate-200 font-bold text-slate-800 hover:bg-slate-50">
                무료로 일정 만들기
              </Link>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 p-7">
              <p className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <Sparkles className="w-5 h-5 text-amber-600" /> 고급 AI
              </p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">
                1회 630원<span className="text-base font-bold text-slate-500">부터</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">이용권으로 필요한 만큼</p>
              <ul className="mt-5 space-y-2 text-[15px] text-slate-700">
                {["가장 똑똑한 AI가 동선·장소를 더 섬세하게", "취향·테마를 더 깊이 반영", "일정이 끝까지 안 만들어지면 이용권 자동 복구", "기본 AI 기능 모두 포함"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="w-5 h-5 text-amber-600 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 이용권 */}
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">고급 AI 이용권</h2>
          <p className="text-sm text-slate-500 mb-5">한 번 결제, 유효기간 안에 언제든. 만료가 가까운 이용권부터 사용돼요.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {CREDIT_PACKS.map((p) => (
              <div key={p.id} className={`relative rounded-3xl bg-white p-6 border ${p.badge ? "border-amber-300 shadow-lg" : "border-slate-200"}`}>
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">{p.badge}</span>
                )}
                <p className="text-lg font-extrabold text-slate-900">{p.name}</p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900">{won(p.price)}</p>
                <p className="text-xs text-slate-500">1회당 {won(Math.round(p.price / p.credits))} · {p.validDays >= 365 ? "1년" : `${p.validDays}일`} 유효</p>
                <p className="mt-3 text-sm text-slate-600 min-h-[40px]">{p.desc}</p>
                <button
                  type="button"
                  disabled={!PAYMENTS_ENABLED}
                  className="mt-4 w-full py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {PAYMENTS_ENABLED ? "구매하기" : "결제 준비 중"}
                </button>
              </div>
            ))}
          </div>

          {/* 플러스 */}
          <div className="rounded-3xl bg-slate-900 text-white p-7 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-amber-300">POTHOS PLUS · 곧 출시</p>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold">자주 떠나는 사람을 위한 플러스</p>
                <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-[15px] text-slate-200">
                  {PLUS_BENEFITS.map((b) => (
                    <li key={b} className="flex gap-2">
                      <Check className="w-5 h-5 text-amber-300 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 min-w-[220px]">
                {SUBSCRIPTION_PLANS.map((p) => (
                  <div key={p.id} className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-sm text-slate-300">{p.name}</p>
                    <p className="text-xl font-extrabold">
                      {won(p.price)}
                      <span className="text-sm font-semibold text-slate-400"> / {p.period === "month" ? "월" : "년"}</span>
                    </p>
                    {p.note && <p className="text-xs text-amber-300">{p.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 text-xs text-slate-400 leading-relaxed space-y-1">
            <p>· 사용하지 않은 이용권은 구매 후 7일 이내 전액 환불, 일부 사용 시 사용분을 뺀 금액을 환불해 드려요.</p>
            <p>· AI 오류로 일정이 끝까지 만들어지지 않으면 사용한 횟수·이용권은 자동으로 되돌려져요.</p>
            <p>· 무료 횟수는 매월 1일(한국 시간)에 다시 채워져요.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
