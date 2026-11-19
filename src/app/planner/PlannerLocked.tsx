"use client";

// 비회원에게 보이는 AI 플래너 소개 — 입력 폼 대신 기능 소개·예시 일정·회원가입 안내
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, MapPin, Wallet, Sparkles, Route, FileDown, Lock, Check } from "lucide-react";

const FEATURES = [
  { icon: Sparkles, title: "AI 맞춤 일정", desc: "여행지·기간·예산·취향만 고르면 하루 단위 코스를 짜 줘요" },
  { icon: Route, title: "동선까지 고려", desc: "가까운 곳끼리 묶어서 이동 시간을 줄여요" },
  { icon: Wallet, title: "예산 맞춤", desc: "식비·교통·입장료까지 예산 안에서 계획해요" },
  { icon: FileDown, title: "저장·PDF", desc: "내 여행에 저장하고 PDF로 내려받을 수 있어요" },
];

const SAMPLE = [
  { day: "1일차", items: ["오전 · 성산일출봉 일출 산책", "점심 · 성산 해산물 정식", "오후 · 우도 자전거 한 바퀴", "저녁 · 함덕 해변 노을"] },
  { day: "2일차", items: ["오전 · 비자림 숲길", "점심 · 고기국수", "오후 · 섭지코지", "저녁 · 동문시장 야시장"] },
];

export default function PlannerLocked() {
  const pathname = usePathname();
  const sp = useSearchParams();
  // 가입·로그인 뒤 같은 화면(축제·목적지 조건 포함)으로 돌아오기
  const back = `${pathname}${sp.toString() ? `?${sp.toString()}` : ""}`;
  const q = `?callbackUrl=${encodeURIComponent(back)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="text-center pt-6 sm:pt-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
          <Lock className="w-3.5 h-3.5" /> 회원 전용
        </span>
        <h1 className="mt-4 text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight">AI가 설계하는 나만의 여행</h1>
        <p className="mt-3 text-base sm:text-lg text-gray-500">
          여행 정보는 누구나 볼 수 있지만, <b className="text-gray-800">AI 여행 설계는 회원만</b> 쓸 수 있어요.
          <br className="hidden sm:block" /> 가입하면 매달 무료로 일정을 만들 수 있어요.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/signup${q}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-bold shadow-lg shadow-blue-500/25"
          >
            <Sparkles className="w-5 h-5" /> 무료 회원가입하고 시작
          </Link>
          <Link href={`/login${q}`} className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-gray-200 bg-white text-gray-700 font-bold">
            이미 회원이에요 · 로그인
          </Link>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl bg-white border border-gray-100 p-5">
            <f.icon className="w-6 h-6 text-blue-600" />
            <p className="mt-3 font-bold text-gray-900">{f.title}</p>
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* 예시 일정 (흐리게) */}
      <div className="mt-10 relative rounded-3xl bg-white border border-gray-100 p-6 overflow-hidden">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
          <span className="font-bold text-gray-900 text-base">예시 · 가을 제주 동쪽 2박 3일</span>
          <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> 제주</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> 2박 3일</span>
          <span className="inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> 1인 50만 원</span>
        </p>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {SAMPLE.map((d) => (
            <div key={d.day} className="rounded-2xl bg-gray-50 p-4">
              <p className="font-bold text-blue-700">{d.day}</p>
              <ul className="mt-2 space-y-1.5">
                {d.items.map((it) => (
                  <li key={it} className="flex items-start gap-1.5 text-sm text-gray-700">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" /> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center pb-5">
          <Link href={`/signup${q}`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-bold">
            <Lock className="w-4 h-4" /> 가입하고 내 일정 만들기
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-gray-400">
        가입 전에도{" "}
        <Link href="/festivals" className="underline">축제</Link> ·{" "}
        <Link href="/stories" className="underline">여행 스토리</Link> ·{" "}
        <Link href="/blog" className="underline">여행 인사이트</Link> ·{" "}
        <Link href="/exchange" className="underline">환율 계산기</Link> 같은 여행 정보는 자유롭게 볼 수 있어요.
      </p>
    </div>
  );
}
